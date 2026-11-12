const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const SONGS = require("./data/songs");

const PORT = Number(process.env.PORT) || 3030;
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

const streamCache = new Map();
const fullTrackCache = new Map();

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-cache"
  });
  res.end(body);
}

async function queryItunes(term) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=5`;
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    return (data.results || []).find((item) => Boolean(item.previewUrl)) || null;
  } catch (_err) {
    clearTimeout(timeout);
    return null;
  }
}

async function fetchStreamInfo(query) {
  const key = query.trim().toLowerCase();
  if (streamCache.has(key)) {
    return streamCache.get(key);
  }

  let match = await queryItunes(query);
  if (!match) {
    const shortTerm = query.trim().split(/\s+/).slice(0, 2).join(" ");
    if (shortTerm && shortTerm.toLowerCase() !== key) {
      match = await queryItunes(shortTerm);
    }
  }

  if (!match) {
    const miss = { found: false };
    streamCache.set(key, miss);
    return miss;
  }

  const artwork = match.artworkUrl100
    ? match.artworkUrl100.replace("100x100bb", "600x600bb")
    : null;

  const result = {
    found: true,
    previewUrl: match.previewUrl,
    artworkUrl: artwork,
    trackName: match.trackName,
    artistName: match.artistName
  };
  streamCache.set(key, result);
  return result;
}

async function isEmbeddableYouTube(videoId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      videoId,
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    };
  } catch (_err) {
    clearTimeout(timeout);
    return null;
  }
}

async function searchYouTubeIds(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 14000);
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const html = await res.text();
    const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1]);
    return [...new Set(matches)].slice(0, 6);
  } catch (err) {
    clearTimeout(timeout);
    console.error("YouTube search error:", err.message);
    return [];
  }
}

async function fetchFullTrack(query, isLofi = false) {
  const cleanQuery = query.trim();
  const searchTerm = isLofi
    ? `${cleanQuery} malayalam lofi slowed reverb`
    : `${cleanQuery} malayalam full song audio`;
  const cacheKey = searchTerm.toLowerCase();

  if (fullTrackCache.has(cacheKey)) {
    return fullTrackCache.get(cacheKey);
  }

  const [rawIds, itunesInfo] = await Promise.all([
    searchYouTubeIds(searchTerm),
    fetchStreamInfo(cleanQuery)
  ]);

  const checks = await Promise.all(rawIds.slice(0, 4).map((id) => isEmbeddableYouTube(id)));
  const candidates = checks.filter(Boolean);

  // Include remaining raw IDs as backup candidates
  const seen = new Set(candidates.map((c) => c.videoId));
  for (const id of rawIds) {
    if (!seen.has(id)) {
      candidates.push({
        videoId: id,
        title: cleanQuery,
        author: "YouTube Audio",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
      });
    }
  }

  const result = {
    found: candidates.length > 0 || itunesInfo.found,
    isLofi,
    candidates,
    artworkUrl: itunesInfo.artworkUrl || candidates[0]?.thumbnail || null,
    previewFallbackUrl: itunesInfo.previewUrl || null
  };

  if (candidates.length > 0) {
    fullTrackCache.set(cacheKey, result);
  }
  return result;
}

function serveStatic(reqPath, res) {
  const normalized = reqPath === "/" ? "/index.html" : reqPath;
  const safePath = path.normalize(normalized).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        fs.readFile(path.join(PUBLIC_DIR, "index.html"), (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Server Error");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(indexContent);
        });
        return;
      }
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Server Error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  if (pathname === "/api/songs" && req.method === "GET") {
    const era = parsedUrl.searchParams.get("era");
    const search = (parsedUrl.searchParams.get("q") || "").trim().toLowerCase();

    let filtered = SONGS;
    if (era && era !== "all") {
      filtered = filtered.filter((s) => s.era === era);
    }
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(search) ||
          s.movie.toLowerCase().includes(search) ||
          s.singer.toLowerCase().includes(search) ||
          s.composer.toLowerCase().includes(search) ||
          String(s.year).includes(search)
      );
    }

    sendJson(res, 200, {
      brand: "Music Buddy",
      total: filtered.length,
      songs: filtered
    });
    return;
  }

  if (pathname === "/api/stream-info" && req.method === "GET") {
    const query = parsedUrl.searchParams.get("q");
    if (!query) {
      sendJson(res, 400, { found: false, error: "Missing query parameter 'q'" });
      return;
    }
    const info = await fetchStreamInfo(query);
    sendJson(res, 200, info);
    return;
  }

  if (pathname === "/api/full-track" && req.method === "GET") {
    const query = parsedUrl.searchParams.get("q");
    const isLofi = parsedUrl.searchParams.get("lofi") === "1";
    if (!query) {
      sendJson(res, 400, { found: false, error: "Missing query parameter 'q'" });
      return;
    }
    const info = await fetchFullTrack(query, isLofi);
    sendJson(res, 200, info);
    return;
  }

  serveStatic(pathname, res);
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n  Music Buddy website running at http://localhost:${port}\n`);
  });
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    const nextPort = (server._currentPort || PORT) + 1;
    server._currentPort = nextPort;
    console.log(`Port in use, trying http://localhost:${nextPort}...`);
    startServer(nextPort);
  } else {
    throw err;
  }
});

server._currentPort = PORT;
startServer(PORT);
