(() => {
  const PLAY_SVG = '<path d="M8 5v14l11-7z"/>';
  const PAUSE_SVG = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

  const SCALES = {
    mohanam: [0, 2, 4, 7, 9, 12, 14, 16],
    kalyani: [0, 2, 4, 6, 7, 9, 11, 12],
    hamsadhwani: [0, 2, 4, 7, 11, 12, 14, 16],
    kharaharapriya: [0, 2, 3, 5, 7, 9, 10, 12],
    jog: [0, 4, 5, 7, 10, 12, 15, 16],
    sindhubhairavi: [0, 1, 3, 5, 7, 8, 10, 12]
  };

  const LOFI_PRESETS = {
    midnight: { speed: 0.85, crackle: 42, rain: 30, warmth: 1400, reverb: 65 },
    monsoon: { speed: 0.80, crackle: 62, rain: 72, warmth: 1100, reverb: 80 },
    velvet: { speed: 0.85, crackle: 18, rain: 0, warmth: 1800, reverb: 85 },
    crisp: { speed: 1.0, crackle: 0, rain: 0, warmth: 8000, reverb: 0 }
  };

  const state = {
    activeView: "home",
    allSongs: [],
    filteredSongs: [],
    queue: [],
    currentIndex: 0,
    currentSong: null,
    activeFilter: "all",
    searchQuery: "",
    sortAsc: true,
    isPlaying: false,
    isShuffle: false,
    isRepeatOne: false,
    engine: "yt", // "yt" | "audio" | "synth"
    volume: 0.75,
    isMuted: false,
    autoplayBlocked: false,
    playRequestId: 0,

    // Full-Song YouTube State
    ytPlayer: null,
    ytReady: false,
    ytCandidates: [],
    ytCandidateIdx: 0,
    ytPollId: null,
    pendingYtLoad: null,

    // Synth Fallback Timer
    synthElapsed: 0,
    synthDuration: 240,
    synthTimerId: null,
    synthTickId: null,

    // Lo-Fi Space State
    lofiEnabled: false,
    lofiMethod: "dsp", // "dsp" | "mix"
    lofi: {
      speed: 1.0,
      crackle: 0,
      rain: 0,
      warmth: 8000,
      reverb: 0
    }
  };

  // DOM Elements
  const bgAudio = document.getElementById("bgAudio");
  const audioUnlockBanner = document.getElementById("audioUnlockBanner");

  const viewPanels = Array.from(document.querySelectorAll(".view-panel"));
  const navTabs = Array.from(document.querySelectorAll(".nav-tab"));
  const navLofiQuickBtn = document.getElementById("navLofiQuickBtn");
  const navLofiLabel = document.getElementById("navLofiLabel");
  const navRadioBtn = document.getElementById("navRadioBtn");
  const navRadioLabel = document.getElementById("navRadioLabel");

  const heroPlayBtn = document.getElementById("heroPlayBtn");
  const heroOpenSpaceBtn = document.getElementById("heroOpenSpaceBtn");
  const heroOpenVaultBtn = document.getElementById("heroOpenVaultBtn");
  const deckEraBadge = document.getElementById("deckEraBadge");
  const deckEngineBadge = document.getElementById("deckEngineBadge");
  const heroArtwork = document.getElementById("heroArtwork");
  const heroArtFallback = document.getElementById("heroArtFallback");
  const heroTrackTitle = document.getElementById("heroTrackTitle");
  const heroTrackMeta = document.getElementById("heroTrackMeta");
  const heroTrackMood = document.getElementById("heroTrackMood");
  const deckPrevBtn = document.getElementById("deckPrevBtn");
  const deckPlayBtn = document.getElementById("deckPlayBtn");
  const deckPlayIcon = document.getElementById("deckPlayIcon");
  const deckNextBtn = document.getElementById("deckNextBtn");

  const trackListEl = document.getElementById("trackList");
  const searchInput = document.getElementById("searchInput");
  const playCustomSearchBtn = document.getElementById("playCustomSearchBtn");
  const filterPills = Array.from(document.querySelectorAll("#view-vault .pill"));
  const eraCards = Array.from(document.querySelectorAll(".era-card"));
  const maestroCards = Array.from(document.querySelectorAll(".maestro-card"));
  const playlistCards = Array.from(document.querySelectorAll(".playlist-card"));
  const sortToggleBtn = document.getElementById("sortToggleBtn");
  const sortLabel = document.getElementById("sortLabel");
  const playAllBtn = document.getElementById("playAllBtn");
  const shuffleAllBtn = document.getElementById("shuffleAllBtn");

  // Space Controls
  const spaceMasterToggle = document.getElementById("spaceMasterToggle");
  const spaceMasterLabel = document.getElementById("spaceMasterLabel");
  const spaceArtwork = document.getElementById("spaceArtwork");
  const spaceArtFallback = document.getElementById("spaceArtFallback");
  const spaceTrackTitle = document.getElementById("spaceTrackTitle");
  const spaceTrackSub = document.getElementById("spaceTrackSub");
  const spaceSourceBadge = document.getElementById("spaceSourceBadge");
  const spaceLofiStatusBadge = document.getElementById("spaceLofiStatusBadge");
  const lofiMethodDspBtn = document.getElementById("lofiMethodDspBtn");
  const lofiMethodMixBtn = document.getElementById("lofiMethodMixBtn");
  const strategyHint = document.getElementById("strategyHint");
  const localDropZone = document.getElementById("localDropZone");
  const localFileInput = document.getElementById("localFileInput");
  const browseLocalBtn = document.getElementById("browseLocalBtn");
  const resetLofiBtn = document.getElementById("resetLofiBtn");
  const presetBtns = Array.from(document.querySelectorAll(".preset-btn"));

  const lofiSpeedSlider = document.getElementById("lofiSpeedSlider");
  const lofiSpeedVal = document.getElementById("lofiSpeedVal");
  const lofiCrackleSlider = document.getElementById("lofiCrackleSlider");
  const lofiCrackleVal = document.getElementById("lofiCrackleVal");
  const lofiRainSlider = document.getElementById("lofiRainSlider");
  const lofiRainVal = document.getElementById("lofiRainVal");
  const lofiWarmthSlider = document.getElementById("lofiWarmthSlider");
  const lofiWarmthVal = document.getElementById("lofiWarmthVal");
  const lofiReverbSlider = document.getElementById("lofiReverbSlider");
  const lofiReverbVal = document.getElementById("lofiReverbVal");

  // Bottom Dock
  const dockProgressTrack = document.getElementById("dockProgressTrack");
  const dockProgressFill = document.getElementById("dockProgressFill");
  const dockArtwork = document.getElementById("dockArtwork");
  const dockFallback = document.getElementById("dockFallback");
  const dockTitle = document.getElementById("dockTitle");
  const dockStatusTag = document.getElementById("dockStatusTag");
  const dockSubtitle = document.getElementById("dockSubtitle");
  const dockShuffleBtn = document.getElementById("dockShuffleBtn");
  const dockPrevBtn = document.getElementById("dockPrevBtn");
  const dockPlayBtn = document.getElementById("dockPlayBtn");
  const dockPlayIcon = document.getElementById("dockPlayIcon");
  const dockNextBtn = document.getElementById("dockNextBtn");
  const dockRepeatBtn = document.getElementById("dockRepeatBtn");
  const currentTimeLabel = document.getElementById("currentTimeLabel");
  const totalTimeLabel = document.getElementById("totalTimeLabel");
  const dockSpaceBtn = document.getElementById("dockSpaceBtn");
  const dockSpaceLabel = document.getElementById("dockSpaceLabel");
  const muteBtn = document.getElementById("muteBtn");
  const volumeSlider = document.getElementById("volumeSlider");

  // ==================== WEB AUDIO LO-FI DSP + AMBIENCE ENGINE ====================
  const dsp = {
    ctx: null,
    masterGain: null,
    mediaSourceConnected: false,
    mediaNode: null,
    lowpass: null,
    dryGain: null,
    wetGain: null,
    convolver: null,
    crackleGain: null,
    rainGain: null,
    crackleStarted: false,
    rainStarted: false,
    pulseEnergy: 0,
    synthStep: 0,

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = state.isMuted ? 0 : state.volume;
        this.masterGain.connect(this.ctx.destination);

        // Lowpass Tape Filter
        this.lowpass = this.ctx.createBiquadFilter();
        this.lowpass.type = "lowpass";
        this.lowpass.frequency.value = state.lofi.warmth;
        this.lowpass.Q.value = 0.85;

        // Dry & Reverb Wet paths
        this.dryGain = this.ctx.createGain();
        this.wetGain = this.ctx.createGain();
        this.dryGain.gain.value = 1;
        this.wetGain.gain.value = state.lofi.reverb / 100;

        this.convolver = this.ctx.createConvolver();
        this.convolver.buffer = this.createImpulseResponse(2.6, 2.4);

        this.lowpass.connect(this.dryGain);
        this.lowpass.connect(this.convolver);
        this.convolver.connect(this.wetGain);
        this.dryGain.connect(this.masterGain);
        this.wetGain.connect(this.masterGain);

        // Ambience Gains
        this.crackleGain = this.ctx.createGain();
        this.crackleGain.gain.value = 0;
        this.crackleGain.connect(this.masterGain);

        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.value = 0;
        this.rainGain.connect(this.masterGain);
      }
      if (this.ctx.state === "suspended") {
        return this.ctx.resume();
      }
      return Promise.resolve();
    },

    createImpulseResponse(duration, decay) {
      const rate = this.ctx.sampleRate;
      const length = Math.floor(rate * duration);
      const impulse = this.ctx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      return impulse;
    },

    connectMediaElement() {
      if (this.mediaSourceConnected) return;
      this.ensureContext();
      try {
        this.mediaNode = this.ctx.createMediaElementSource(bgAudio);
        this.mediaNode.connect(this.lowpass);
        this.mediaSourceConnected = true;
      } catch (_err) {
        // Fallback if already connected or blocked
      }
    },

    startAmbienceGenerators() {
      if (!this.ctx) return;

      if (!this.crackleStarted) {
        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          // Sparse warm vinyl crackle impulses + ultra-soft tape floor
          const r = Math.random();
          data[i] = r > 0.9982 ? (Math.random() * 2 - 1) * 0.75 : (Math.random() * 2 - 1) * 0.015;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const bp = this.ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 2600;
        bp.Q.value = 0.7;

        src.connect(bp);
        bp.connect(this.crackleGain);
        src.start();
        this.crackleStarted = true;
      }

      if (!this.rainStarted) {
        const bufferSize = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const data = buffer.getChannelData(ch);
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Smooth brown/pink rain texture
            lastOut = (lastOut + 0.05 * white) / 1.05;
            data[i] = lastOut * 2.2;
          }
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const lp = this.ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 1550;

        src.connect(lp);
        lp.connect(this.rainGain);
        src.start();
        this.rainStarted = true;
      }
    },

    syncParams() {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const masterTarget = state.isMuted ? 0 : state.volume;
      this.masterGain.gain.setTargetAtTime(masterTarget, now, 0.05);

      this.lowpass.frequency.setTargetAtTime(state.lofi.warmth, now, 0.08);
      const revNorm = state.lofi.reverb / 100;
      this.dryGain.gain.setTargetAtTime(1 - revNorm * 0.35, now, 0.08);
      this.wetGain.gain.setTargetAtTime(revNorm * 0.9, now, 0.08);

      const crackleAmt = state.isPlaying ? (state.lofi.crackle / 100) * 0.24 : 0;
      const rainAmt = state.isPlaying ? (state.lofi.rain / 100) * 0.28 : 0;
      this.crackleGain.gain.setTargetAtTime(crackleAmt, now, 0.12);
      this.rainGain.gain.setTargetAtTime(rainAmt, now, 0.12);
    },

    midiToFreq(midi) {
      return 440 * Math.pow(2, (midi - 69) / 12);
    },

    playNote(midi, durationSec, type = "sine", gainPeak = 0.16) {
      if (!this.ctx || !this.lowpass) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(this.midiToFreq(midi), now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.lowpass);
      osc.start(now);
      osc.stop(now + durationSec + 0.06);
    },

    startSynth(song) {
      this.stopSynth();
      this.ensureContext().then(() => {
        this.startAmbienceGenerators();
        this.syncParams();
        this.synthStep = 0;
        const scale = SCALES[song.scale] || SCALES.mohanam;
        const pattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 5, 6, 7, 5, 4, 2];
        const rootBase = 57 + ((song.id || 1) % 5);

        const tickNote = () => {
          if (!state.isPlaying || state.engine !== "synth") return;
          const idx = pattern[this.synthStep % pattern.length];
          const deg = scale[idx % scale.length];
          const pitchDrop = state.lofiEnabled ? -1 : 0;
          this.playNote(rootBase + deg + pitchDrop, 1.45, "sine", 0.17);
          if (this.synthStep % 4 === 0) {
            this.playNote(rootBase - 12 + pitchDrop, 2.5, "triangle", 0.11);
          }
          this.pulseEnergy = 0.85;
          this.synthStep += 1;
        };

        const scaledBpm = (song.bpm || 76) * state.lofi.speed;
        const beatMs = Math.max(240, Math.round((60 / scaledBpm) * 500));
        tickNote();
        state.synthTimerId = setInterval(tickNote, beatMs);
      }).catch(() => showUnlockPrompt());

      state.synthElapsed = 0;
      state.synthTickId = setInterval(() => {
        if (!state.isPlaying || state.engine !== "synth") return;
        state.synthElapsed += 0.25 * state.lofi.speed;
        updateProgressUI(state.synthElapsed, state.synthDuration);
        if (state.synthElapsed >= state.synthDuration) {
          handleTrackEnded();
        }
      }, 250);
    },

    stopSynth() {
      if (state.synthTimerId) {
        clearInterval(state.synthTimerId);
        state.synthTimerId = null;
      }
      if (state.synthTickId) {
        clearInterval(state.synthTickId);
        state.synthTickId = null;
      }
    }
  };

  // ==================== YOUTUBE FULL-SONG PLAYER ====================
  window.onYouTubeIframeAPIReady = () => {
    state.ytPlayer = new window.YT.Player("ytPlayer", {
      height: "200",
      width: "200",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: () => {
          state.ytReady = true;
          state.ytPlayer.setVolume(state.isMuted ? 0 : Math.round(state.volume * 100));
          if (state.pendingYtLoad) {
            const { videoId, autoPlay } = state.pendingYtLoad;
            state.pendingYtLoad = null;
            loadYouTubeCandidate(videoId, autoPlay);
          }
        },
        onStateChange: (event) => {
          const YTState = window.YT.PlayerState;
          if (event.data === YTState.PLAYING) {
            hideUnlockPrompt();
            setPlayState(true);
            applyLofiToActiveEngine();
            startYtProgressPoll();
          } else if (event.data === YTState.PAUSED) {
            if (state.engine === "yt") {
              setPlayState(false);
            }
          } else if (event.data === YTState.ENDED) {
            if (state.engine === "yt") {
              handleTrackEnded();
            }
          }
        },
        onError: () => {
          if (state.engine !== "yt") return;
          // Try next embeddable YouTube candidate before falling back
          state.ytCandidateIdx += 1;
          if (state.ytCandidateIdx < state.ytCandidates.length) {
            loadYouTubeCandidate(state.ytCandidates[state.ytCandidateIdx].videoId, true);
          } else {
            fallbackFromYouTube();
          }
        }
      }
    });
  };

  function loadYouTubeCandidate(videoId, autoPlay = true) {
    if (!state.ytReady || !state.ytPlayer) {
      state.pendingYtLoad = { videoId, autoPlay };
      return;
    }
    if (autoPlay) {
      state.ytPlayer.loadVideoById({ videoId });
      setTimeout(() => {
        if (state.engine === "yt" && state.ytPlayer && typeof state.ytPlayer.getPlayerState === "function") {
          const ps = state.ytPlayer.getPlayerState();
          // -1 unstarted / 5 cued after delay indicates browser blocked autoplay
          if (ps === -1 || ps === 5) {
            showUnlockPrompt();
          }
        }
      }, 1800);
    } else {
      state.ytPlayer.cueVideoById({ videoId });
    }
  }

  function startYtProgressPoll() {
    stopYtProgressPoll();
    state.ytPollId = setInterval(() => {
      if (state.engine !== "yt" || !state.ytPlayer || typeof state.ytPlayer.getCurrentTime !== "function") {
        return;
      }
      const cur = state.ytPlayer.getCurrentTime() || 0;
      const dur = state.ytPlayer.getDuration() || 0;
      if (dur > 0) {
        updateProgressUI(cur, dur);
      }
    }, 250);
  }

  function stopYtProgressPoll() {
    if (state.ytPollId) {
      clearInterval(state.ytPollId);
      state.ytPollId = null;
    }
  }

  async function fallbackFromYouTube() {
    const song = state.currentSong;
    if (!song) return;
    if (song._previewFallbackUrl) {
      state.engine = "audio";
      bgAudio.src = song._previewFallbackUrl;
      bgAudio.playbackRate = state.lofi.speed;
      bgAudio.preservesPitch = false;
      bgAudio.volume = state.isMuted ? 0 : state.volume;
      try {
        await bgAudio.play();
        setPlayState(true);
        updateTrackDetailsUI(song);
        return;
      } catch (_err) {
        // continue to synth
      }
    }
    state.engine = "synth";
    setPlayState(true);
    updateTrackDetailsUI(song);
    dsp.startSynth(song);
  }

  // ==================== VIEW ROUTING & HELPERS ====================
  function switchView(viewName) {
    state.activeView = viewName;
    viewPanels.forEach((p) => p.classList.toggle("active", p.id === `view-${viewName}`));
    navTabs.forEach((t) => t.classList.toggle("active", t.dataset.view === viewName));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function showUnlockPrompt() {
    state.autoplayBlocked = true;
    audioUnlockBanner.classList.remove("hidden");
  }

  function hideUnlockPrompt() {
    state.autoplayBlocked = false;
    audioUnlockBanner.classList.add("hidden");
  }

  function setPlayState(playing) {
    state.isPlaying = playing;
    document.body.classList.toggle("is-playing", playing);
    const svg = playing ? PAUSE_SVG : PLAY_SVG;
    deckPlayIcon.innerHTML = svg;
    dockPlayIcon.innerHTML = svg;

    const heroSpan = heroPlayBtn.querySelector("span");
    const heroIcon = heroPlayBtn.querySelector("svg");
    if (heroSpan && heroIcon) {
      heroSpan.textContent = playing ? "Pause Background Song" : "Play Full Song";
      heroIcon.innerHTML = svg;
    }

    navRadioLabel.textContent = playing ? "Playing Full" : "Background Radio";
    dockStatusTag.textContent = playing
      ? (state.lofiEnabled ? "LO-FI SPACE" : state.engine === "yt" ? "FULL SONG" : state.engine === "audio" ? "LOCAL DSP" : "RAGAM SYNTH")
      : "PAUSED";

    if (dsp.ctx) {
      dsp.syncParams();
    }
  }

  function updateArtwork(artworkUrl, title) {
    const targets = [
      [heroArtwork, heroArtFallback],
      [dockArtwork, dockFallback],
      [spaceArtwork, spaceArtFallback]
    ];
    for (const [imgEl, fallbackEl] of targets) {
      if (artworkUrl) {
        imgEl.src = artworkUrl;
        imgEl.alt = title;
        imgEl.classList.remove("hidden");
        fallbackEl.classList.add("hidden");
      } else {
        imgEl.classList.add("hidden");
        fallbackEl.classList.remove("hidden");
      }
    }
  }

  function updateTrackDetailsUI(song) {
    if (!song) return;
    deckEraBadge.textContent = `${(song.eraLabel || "Malayalam").toUpperCase()} • ${song.year || "LIVE"}`;
    deckEngineBadge.textContent = state.lofiEnabled
      ? "LO-FI SPACE ACTIVE"
      : song.isLocal
        ? "LOCAL STUDIO TRACK"
        : "FULL SONG STREAM";

    heroTrackTitle.textContent = song.title;
    heroTrackMeta.textContent = `${song.movie} • ${song.singer} • ${song.composer}`;
    heroTrackMood.textContent = `Mood: ${song.mood || "Soulful Melody"}`;

    dockTitle.textContent = song.title;
    dockSubtitle.textContent = `${song.movie} (${song.year}) • ${song.singer}`;

    spaceTrackTitle.textContent = song.title;
    spaceTrackSub.textContent = `${song.movie} (${song.year}) • ${song.singer}`;
    spaceSourceBadge.textContent = song.isLocal
      ? "SOURCE: LOCAL AUDIO (FULL DSP)"
      : state.engine === "yt"
        ? "SOURCE: FULL-SONG STREAM"
        : "SOURCE: RAGAM SYNTH";
    spaceLofiStatusBadge.textContent = state.lofiEnabled
      ? `LO-FI ACTIVE • ${state.lofi.speed.toFixed(2)}x`
      : "ORIGINAL SPEED (1.00x)";

    const rows = trackListEl.querySelectorAll(".track-row");
    rows.forEach((row) => {
      const isMatch = String(row.dataset.id) === String(song.id);
      row.classList.toggle("is-current", isMatch);
      const indexBox = row.querySelector(".track-index");
      if (indexBox) {
        indexBox.innerHTML = isMatch && state.isPlaying
          ? '<span class="eq-mini"><span></span><span></span><span></span></span>'
          : row.dataset.num;
      }
    });
  }

  function updateProgressUI(currentSec, totalSec) {
    const safeTotal = totalSec > 0 ? totalSec : 1;
    const pct = Math.min(100, Math.max(0, (currentSec / safeTotal) * 100));
    dockProgressFill.style.width = `${pct}%`;
    currentTimeLabel.textContent = formatTime(currentSec);
    totalTimeLabel.textContent = formatTime(totalSec);
  }

  // ==================== LO-FI SPACE CONTROL LOGIC ====================
  function applyLofiToActiveEngine() {
    document.body.classList.toggle("is-lofi", state.lofiEnabled);
    spaceMasterToggle.setAttribute("aria-pressed", String(state.lofiEnabled));
    spaceMasterLabel.textContent = state.lofiEnabled ? "Lo-Fi ON" : "Lo-Fi OFF";
    navLofiLabel.textContent = state.lofiEnabled ? "Lo-Fi: ON" : "Lo-Fi: OFF";
    dockSpaceLabel.textContent = state.lofiEnabled ? "✦ Lo-Fi ON" : "✦ Lo-Fi Space";

    // Start procedural Vinyl Crackle / Monsoon Rain generators if ambience > 0
    if (state.lofi.crackle > 0 || state.lofi.rain > 0 || state.engine !== "yt") {
      dsp.ensureContext().then(() => {
        dsp.startAmbienceGenerators();
        dsp.syncParams();
      }).catch(() => {});
    } else if (dsp.ctx) {
      dsp.syncParams();
    }

    // Apply playback speed to active engine
    if (state.engine === "yt" && state.ytPlayer && typeof state.ytPlayer.setPlaybackRate === "function") {
      const rates = typeof state.ytPlayer.getAvailablePlaybackRates === "function"
        ? state.ytPlayer.getAvailablePlaybackRates()
        : [0.5, 0.75, 1, 1.25];
      // Pick closest supported playback rate
      let closest = 1;
      let minDiff = Infinity;
      for (const r of rates) {
        const diff = Math.abs(r - state.lofi.speed);
        if (diff < minDiff) {
          minDiff = diff;
          closest = r;
        }
      }
      state.ytPlayer.setPlaybackRate(closest);
    }

    if (state.engine === "audio") {
      bgAudio.playbackRate = state.lofi.speed;
      bgAudio.preservesPitch = false;
      bgAudio.mozPreservesPitch = false;
      bgAudio.webkitPreservesPitch = false;
    }

    updateTrackDetailsUI(state.currentSong);
    setPlayState(state.isPlaying);
  }

  function updateLofiSlidersUI() {
    lofiSpeedSlider.value = state.lofi.speed;
    lofiSpeedVal.textContent = `${Number(state.lofi.speed).toFixed(2)}x`;
    lofiCrackleSlider.value = state.lofi.crackle;
    lofiCrackleVal.textContent = `${state.lofi.crackle}%`;
    lofiRainSlider.value = state.lofi.rain;
    lofiRainVal.textContent = `${state.lofi.rain}%`;
    lofiWarmthSlider.value = state.lofi.warmth;
    lofiWarmthVal.textContent = `${state.lofi.warmth} Hz`;
    lofiReverbSlider.value = state.lofi.reverb;
    lofiReverbVal.textContent = `${state.lofi.reverb}%`;
  }

  function applyLofiPreset(presetKey) {
    const preset = LOFI_PRESETS[presetKey] || LOFI_PRESETS.crisp;
    state.lofi = { ...preset };
    state.lofiEnabled = presetKey !== "crisp";
    presetBtns.forEach((b) => b.classList.toggle("active", b.dataset.preset === presetKey));
    updateLofiSlidersUI();
    applyLofiToActiveEngine();
  }

  function toggleLofiMaster() {
    if (state.lofiEnabled) {
      applyLofiPreset("crisp");
      if (state.lofiMethod === "mix" && state.currentSong && !state.currentSong.isLocal) {
        playSong(state.currentSong, state.isPlaying);
      }
    } else {
      applyLofiPreset("midnight");
      if (state.lofiMethod === "mix" && state.currentSong && !state.currentSong.isLocal) {
        playSong(state.currentSong, true);
      }
    }
  }

  // ==================== PLAYBACK ORCHESTRATION ====================
  async function playSong(song, autoPlay = true) {
    if (!song) return;
    const reqId = ++state.playRequestId;
    state.currentSong = song;
    state.currentIndex = state.queue.findIndex((s) => String(s.id) === String(song.id));
    if (state.currentIndex < 0) state.currentIndex = 0;

    // Stop previous engines
    stopYtProgressPoll();
    if (state.ytReady && state.ytPlayer && typeof state.ytPlayer.stopVideo === "function") {
      state.ytPlayer.stopVideo();
    }
    bgAudio.pause();
    dsp.stopSynth();

    updateProgressUI(0, 0);
    updateArtwork(song.localArtwork || null, song.title);
    updateTrackDetailsUI(song);

    // Local Audio File Playback (full Web Audio DSP!)
    if (song.isLocal && song.localUrl) {
      state.engine = "audio";
      dsp.ensureContext().then(() => {
        dsp.connectMediaElement();
        dsp.startAmbienceGenerators();
        dsp.syncParams();
      }).catch(() => {});

      bgAudio.src = song.localUrl;
      bgAudio.playbackRate = state.lofi.speed;
      bgAudio.preservesPitch = false;
      bgAudio.volume = 1; // Volume controlled by masterGain when connected
      if (autoPlay) {
        try {
          await bgAudio.play();
          hideUnlockPrompt();
          setPlayState(true);
          applyLofiToActiveEngine();
        } catch (_err) {
          showUnlockPrompt();
          setPlayState(false);
        }
      }
      return;
    }

    if (!autoPlay) {
      setPlayState(false);
      return;
    }

    dockStatusTag.textContent = "LOADING FULL SONG...";
    const useLofiMix = state.lofiEnabled && state.lofiMethod === "mix";

    try {
      const res = await fetch(`/api/full-track?q=${encodeURIComponent(song.query)}&lofi=${useLofiMix ? "1" : "0"}`);
      const data = await res.json();
      if (reqId !== state.playRequestId) return;

      if (data.artworkUrl) {
        updateArtwork(data.artworkUrl, song.title);
      }
      song._previewFallbackUrl = data.previewFallbackUrl || null;

      if (data.candidates && data.candidates.length > 0) {
        state.engine = "yt";
        state.ytCandidates = data.candidates;
        state.ytCandidateIdx = 0;
        updateTrackDetailsUI(song);
        loadYouTubeCandidate(data.candidates[0].videoId, true);
        return;
      }
    } catch (_err) {
      // Fall through to fallback
    }

    if (reqId !== state.playRequestId) return;
    await fallbackFromYouTube();
  }

  async function togglePlayPause() {
    if (!state.currentSong && state.queue.length > 0) {
      await playSong(state.queue[0], true);
      return;
    }

    if (state.isPlaying) {
      if (state.engine === "yt" && state.ytPlayer) {
        state.ytPlayer.pauseVideo();
      } else if (state.engine === "audio") {
        bgAudio.pause();
      } else {
        dsp.stopSynth();
      }
      setPlayState(false);
      updateTrackDetailsUI(state.currentSong);
    } else {
      hideUnlockPrompt();
      if (state.engine === "yt" && state.ytPlayer) {
        if (state.ytCandidates.length > 0) {
          state.ytPlayer.playVideo();
          setPlayState(true);
          applyLofiToActiveEngine();
        } else {
          await playSong(state.currentSong, true);
        }
      } else if (state.engine === "audio") {
        try {
          await bgAudio.play();
          setPlayState(true);
          applyLofiToActiveEngine();
        } catch (_err) {
          await playSong(state.currentSong, true);
        }
      } else {
        setPlayState(true);
        dsp.startSynth(state.currentSong);
      }
    }
  }

  function getNextIndex(step = 1) {
    if (state.queue.length === 0) return 0;
    if (state.isShuffle && state.queue.length > 1) {
      let randIdx = state.currentIndex;
      while (randIdx === state.currentIndex) {
        randIdx = Math.floor(Math.random() * state.queue.length);
      }
      return randIdx;
    }
    return (state.currentIndex + step + state.queue.length) % state.queue.length;
  }

  function handleTrackEnded() {
    if (state.isRepeatOne && state.currentSong) {
      playSong(state.currentSong, true);
      return;
    }
    playSong(state.queue[getNextIndex(1)], true);
  }

  // ==================== VAULT RENDER & CUSTOM STREAM ====================
  function renderTrackList() {
    let list = [...state.allSongs];
    if (state.activeFilter !== "all") {
      list = list.filter((s) => s.era === state.activeFilter);
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.movie.toLowerCase().includes(q) ||
          s.singer.toLowerCase().includes(q) ||
          s.composer.toLowerCase().includes(q) ||
          String(s.year).includes(q)
      );
    }

    list.sort((a, b) => (state.sortAsc ? a.year - b.year : b.year - a.year));
    state.filteredSongs = list;

    if (list.length === 0) {
      trackListEl.innerHTML = `
        <div class="empty-state">
          No vault match for "<strong>${escapeHtml(state.searchQuery)}</strong>".
          Click <strong>Stream Any Song</strong> above to play it directly in full length!
        </div>
      `;
      return;
    }

    trackListEl.innerHTML = list
      .map((song, idx) => {
        const isCurrent = state.currentSong && String(state.currentSong.id) === String(song.id);
        const numStr = String(idx + 1).padStart(2, "0");
        return `
          <div class="track-row ${isCurrent ? "is-current" : ""}" data-id="${song.id}" data-num="${numStr}" role="listitem">
            <div class="track-index">
              ${isCurrent && state.isPlaying ? '<span class="eq-mini"><span></span><span></span><span></span></span>' : numStr}
            </div>
            <div class="track-main">
              <div class="track-title">${escapeHtml(song.title)}</div>
              <div class="track-movie">${escapeHtml(song.movie)} • ${song.year}</div>
            </div>
            <div class="track-credits">
              <div class="track-singer">${escapeHtml(song.singer)}</div>
              <div class="track-composer">${escapeHtml(song.composer)}</div>
            </div>
            <div><span class="era-tag">${escapeHtml(song.eraLabel)}</span></div>
            <div class="col-right">${escapeHtml(song.duration)}</div>
          </div>
        `;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function applyFilter(era, autoStartFirst = false) {
    state.activeFilter = era;
    filterPills.forEach((p) => p.classList.toggle("active", p.dataset.filter === era));
    eraCards.forEach((c) => c.classList.toggle("active", c.dataset.era === era));
    renderTrackList();
    if (state.filteredSongs.length > 0) {
      state.queue = [...state.filteredSongs];
      if (autoStartFirst) {
        playSong(state.queue[0], true);
      }
    }
  }

  function playCustomSearchQuery() {
    const q = searchInput.value.trim();
    if (!q) return;
    const customSong = {
      id: `custom-${Date.now()}`,
      title: q,
      movie: "Custom Stream",
      year: 2026,
      era: "newwave",
      eraLabel: "Custom Request",
      singer: "Malayalam Archive",
      composer: "Music Buddy Live",
      duration: "Full",
      mood: "On-Demand Stream",
      scale: "mohanam",
      bpm: 78,
      query: q
    };
    state.queue = [customSong, ...state.allSongs];
    playSong(customSong, true);
  }

  function handleLocalAudioFile(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const localSong = {
      id: `local-${Date.now()}`,
      title: cleanName,
      movie: "Local Audio File",
      year: "STUDIO",
      era: "newwave",
      eraLabel: "Local DSP",
      singer: "Your Library",
      composer: "Web Audio Lo-Fi Engine",
      duration: "Full",
      mood: "Studio Transformation",
      scale: "mohanam",
      bpm: 76,
      isLocal: true,
      localUrl: url
    };
    state.queue = [localSong, ...state.allSongs];
    if (!state.lofiEnabled) {
      applyLofiPreset("midnight");
    }
    playSong(localSong, true);
  }

  // ==================== EVENT LISTENERS ====================
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
  document.querySelector(".brand").addEventListener("click", (e) => {
    e.preventDefault();
    switchView("home");
  });
  heroOpenSpaceBtn.addEventListener("click", () => switchView("space"));
  heroOpenVaultBtn.addEventListener("click", () => switchView("vault"));
  navLofiQuickBtn.addEventListener("click", toggleLofiMaster);
  dockSpaceBtn.addEventListener("click", () => switchView("space"));

  // HTML5 Audio listeners (Local + Fallback)
  bgAudio.addEventListener("timeupdate", () => {
    if (state.engine === "audio") {
      updateProgressUI(bgAudio.currentTime, bgAudio.duration || 30);
    }
  });
  bgAudio.addEventListener("ended", () => {
    if (state.engine === "audio") handleTrackEnded();
  });

  // Vault interactions
  trackListEl.addEventListener("click", (e) => {
    const row = e.target.closest(".track-row");
    if (!row) return;
    const id = Number(row.dataset.id);
    const chosen = state.filteredSongs.find((s) => s.id === id) || state.allSongs.find((s) => s.id === id);
    if (!chosen) return;
    state.queue = state.filteredSongs.length > 0 ? [...state.filteredSongs] : [...state.allSongs];
    playSong(chosen, true);
  });

  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => applyFilter(pill.dataset.filter, false));
  });

  eraCards.forEach((card) => {
    card.addEventListener("click", () => {
      applyFilter(card.dataset.era, true);
      switchView("vault");
    });
  });

  maestroCards.forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.dataset.maestro || "";
      state.activeFilter = "all";
      filterPills.forEach((p) => p.classList.toggle("active", p.dataset.filter === "all"));
      searchInput.value = name;
      state.searchQuery = name;
      renderTrackList();
      if (state.filteredSongs.length > 0) {
        state.queue = [...state.filteredSongs];
        playSong(state.queue[0], true);
      }
      switchView("vault");
    });
  });

  playlistCards.forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.playlist;
      if (type === "monsoon") {
        state.queue = state.allSongs.filter((s) => /Mazha|Rain|Monsoon|Vidyasagar|Raveendran/i.test(`${s.title} ${s.mood} ${s.composer}`));
        if (!state.lofiEnabled) applyLofiPreset("monsoon");
      } else if (type === "midnight") {
        state.queue = state.allSongs.filter((s) => s.era === "oldies");
        if (!state.lofiEnabled) applyLofiPreset("midnight");
      } else {
        state.queue = state.allSongs.filter((s) => s.year >= 2015);
      }
      if (state.queue.length > 0) {
        playSong(state.queue[0], true);
      }
      switchView("space");
    });
  });

  searchInput.addEventListener("input", () => {
    state.searchQuery = searchInput.value.trim();
    renderTrackList();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && state.filteredSongs.length === 0) {
      playCustomSearchQuery();
    }
  });
  playCustomSearchBtn.addEventListener("click", playCustomSearchQuery);

  sortToggleBtn.addEventListener("click", () => {
    state.sortAsc = !state.sortAsc;
    sortLabel.textContent = state.sortAsc ? "Old → New" : "New → Old";
    renderTrackList();
    if (state.filteredSongs.length > 0) {
      state.queue = [...state.filteredSongs];
    }
  });

  playAllBtn.addEventListener("click", () => {
    state.queue = state.filteredSongs.length > 0 ? [...state.filteredSongs] : [...state.allSongs];
    if (state.queue.length > 0) playSong(state.queue[0], true);
  });

  shuffleAllBtn.addEventListener("click", () => {
    state.isShuffle = true;
    dockShuffleBtn.classList.add("is-active");
    state.queue = state.filteredSongs.length > 0 ? [...state.filteredSongs] : [...state.allSongs];
    if (state.queue.length > 0) {
      playSong(state.queue[Math.floor(Math.random() * state.queue.length)], true);
    }
  });

  // Space Studio Controls
  spaceMasterToggle.addEventListener("click", toggleLofiMaster);
  resetLofiBtn.addEventListener("click", () => {
    applyLofiPreset("crisp");
    if (state.lofiMethod === "mix" && state.currentSong && !state.currentSong.isLocal) {
      playSong(state.currentSong, state.isPlaying);
    }
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const wasMix = state.lofiEnabled && state.lofiMethod === "mix";
      applyLofiPreset(btn.dataset.preset);
      const isNowMix = state.lofiEnabled && state.lofiMethod === "mix";
      if (wasMix !== isNowMix && state.currentSong && !state.currentSong.isLocal) {
        playSong(state.currentSong, true);
      }
    });
  });

  lofiMethodDspBtn.addEventListener("click", () => {
    state.lofiMethod = "dsp";
    lofiMethodDspBtn.classList.add("active");
    lofiMethodMixBtn.classList.remove("active");
    strategyHint.textContent = "Slows the current full song in real time and blends warm vinyl crackle, monsoon rain, and ambient pads.";
    if (state.lofiEnabled && state.currentSong && !state.currentSong.isLocal) {
      playSong(state.currentSong, true);
    }
  });

  lofiMethodMixBtn.addEventListener("click", () => {
    state.lofiMethod = "mix";
    lofiMethodMixBtn.classList.add("active");
    lofiMethodDspBtn.classList.remove("active");
    strategyHint.textContent = "Streams a full-length Malayalam Slowed + Reverb Lo-Fi remix of the current track from the archive.";
    if (!state.lofiEnabled) {
      applyLofiPreset("midnight");
    }
    if (state.currentSong && !state.currentSong.isLocal) {
      playSong(state.currentSong, true);
    }
  });

  function onSliderChanged() {
    state.lofi.speed = Number(lofiSpeedSlider.value);
    state.lofi.crackle = Number(lofiCrackleSlider.value);
    state.lofi.rain = Number(lofiRainSlider.value);
    state.lofi.warmth = Number(lofiWarmthSlider.value);
    state.lofi.reverb = Number(lofiReverbSlider.value);
    state.lofiEnabled =
      state.lofi.speed < 0.99 ||
      state.lofi.crackle > 0 ||
      state.lofi.rain > 0 ||
      state.lofi.warmth < 7500 ||
      state.lofi.reverb > 0;
    presetBtns.forEach((b) => b.classList.remove("active"));
    updateLofiSlidersUI();
    applyLofiToActiveEngine();
  }

  [lofiSpeedSlider, lofiCrackleSlider, lofiRainSlider, lofiWarmthSlider, lofiReverbSlider].forEach((s) => {
    s.addEventListener("input", onSliderChanged);
  });

  browseLocalBtn.addEventListener("click", () => localFileInput.click());
  localFileInput.addEventListener("change", (e) => {
    if (e.target.files?.[0]) handleLocalAudioFile(e.target.files[0]);
  });
  localDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    localDropZone.classList.add("drag-over");
  });
  localDropZone.addEventListener("dragleave", () => localDropZone.classList.remove("drag-over"));
  localDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    localDropZone.classList.remove("drag-over");
    if (e.dataTransfer?.files?.[0]) handleLocalAudioFile(e.dataTransfer.files[0]);
  });

  // Playback Controls
  [heroPlayBtn, deckPlayBtn, dockPlayBtn, navRadioBtn].forEach((btn) => {
    btn.addEventListener("click", togglePlayPause);
  });
  [deckPrevBtn, dockPrevBtn].forEach((btn) => {
    btn.addEventListener("click", () => playSong(state.queue[getNextIndex(-1)], true));
  });
  [deckNextBtn, dockNextBtn].forEach((btn) => {
    btn.addEventListener("click", () => playSong(state.queue[getNextIndex(1)], true));
  });

  dockShuffleBtn.addEventListener("click", () => {
    state.isShuffle = !state.isShuffle;
    dockShuffleBtn.classList.toggle("is-active", state.isShuffle);
  });
  dockRepeatBtn.addEventListener("click", () => {
    state.isRepeatOne = !state.isRepeatOne;
    dockRepeatBtn.classList.toggle("is-active", state.isRepeatOne);
  });

  volumeSlider.addEventListener("input", () => {
    state.volume = Number(volumeSlider.value);
    state.isMuted = state.volume === 0;
    if (state.ytPlayer && typeof state.ytPlayer.setVolume === "function") {
      state.ytPlayer.setVolume(state.isMuted ? 0 : Math.round(state.volume * 100));
    }
    if (!dsp.mediaSourceConnected) {
      bgAudio.volume = state.isMuted ? 0 : state.volume;
    }
    dsp.syncParams();
  });

  muteBtn.addEventListener("click", () => {
    state.isMuted = !state.isMuted;
    if (state.ytPlayer && typeof state.ytPlayer.setVolume === "function") {
      state.ytPlayer.setVolume(state.isMuted ? 0 : Math.round(state.volume * 100));
    }
    if (!dsp.mediaSourceConnected) {
      bgAudio.volume = state.isMuted ? 0 : state.volume;
    }
    dsp.syncParams();
    muteBtn.classList.toggle("is-active", state.isMuted);
  });

  dockProgressTrack.addEventListener("click", (e) => {
    const rect = dockProgressTrack.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (state.engine === "yt" && state.ytPlayer && typeof state.ytPlayer.getDuration === "function") {
      const dur = state.ytPlayer.getDuration() || 0;
      if (dur > 0) state.ytPlayer.seekTo(ratio * dur, true);
    } else if (state.engine === "audio" && bgAudio.duration) {
      bgAudio.currentTime = ratio * bgAudio.duration;
    } else if (state.engine === "synth") {
      state.synthElapsed = ratio * state.synthDuration;
      updateProgressUI(state.synthElapsed, state.synthDuration);
    }
  });

  // Unlock autoplay on first user gesture
  const unlockOnce = () => {
    if (state.autoplayBlocked && !state.isPlaying) {
      hideUnlockPrompt();
      playSong(state.currentSong || state.queue[0], true);
    }
    window.removeEventListener("pointerdown", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
  };
  window.addEventListener("pointerdown", unlockOnce, { passive: true });
  window.addEventListener("keydown", unlockOnce, { passive: true });
  audioUnlockBanner.addEventListener("click", unlockOnce);

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "Space") {
      e.preventDefault();
      togglePlayPause();
    } else if (e.code === "ArrowRight") {
      playSong(state.queue[getNextIndex(1)], true);
    } else if (e.code === "ArrowLeft") {
      playSong(state.queue[getNextIndex(-1)], true);
    } else if (e.key.toLowerCase() === "m") {
      muteBtn.click();
    } else if (e.key.toLowerCase() === "l") {
      toggleLofiMaster();
    }
  });

  // ==================== VISUALIZERS & PARTICLES ====================
  function initParticleCanvas() {
    const canvas = document.getElementById("bgCanvas");
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.28,
      vy: -0.15 - Math.random() * 0.35,
      alpha: 0.15 + Math.random() * 0.45
    }));

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    function frame() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        const speedMult = state.lofiEnabled ? 0.65 : state.isPlaying ? 1.5 : 1;
        p.x += p.vx;
        p.y += p.vy * speedMult;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 37, 51, ${p.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function initVisualizers() {
    const canvases = [
      { el: document.getElementById("heroVisualizer"), bars: 36 },
      { el: document.getElementById("spaceVisualizer"), bars: 44 }
    ];
    const states = canvases.map((c) => new Array(c.bars).fill(0.12));

    function draw(time) {
      dsp.pulseEnergy *= 0.94;
      const tempoFactor = state.lofiEnabled ? 0.65 : 1;

      canvases.forEach((cfg, idx) => {
        const canvas = cfg.el;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const levels = states[idx];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width - (cfg.bars - 1) * 4) / cfg.bars;

        for (let i = 0; i < cfg.bars; i++) {
          const wave =
            Math.sin(time * 0.005 * tempoFactor + i * 0.36) * 0.35 +
            Math.cos(time * 0.009 * tempoFactor - i * 0.22) * 0.25 +
            0.4;
          const target = state.isPlaying
            ? Math.min(1, 0.18 + wave * 0.68 + dsp.pulseEnergy * 0.25)
            : 0.08 + Math.sin(time * 0.002 + i * 0.3) * 0.03;

          levels[i] += (target - levels[i]) * 0.2;
          const h = Math.max(4, levels[i] * (canvas.height - 10));
          const x = i * (barWidth + 4);
          const y = (canvas.height - h) / 2;

          const grad = ctx.createLinearGradient(0, y, 0, y + h);
          grad.addColorStop(0, state.lofiEnabled ? "#ff7a84" : "#ff4b57");
          grad.addColorStop(0.5, "#e50914");
          grad.addColorStop(1, "#5c0008");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, h, 4);
          ctx.fill();
        }
      });

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ==================== INIT ====================
  async function init() {
    initParticleCanvas();
    initVisualizers();
    updateLofiSlidersUI();

    try {
      const res = await fetch("/api/songs");
      const data = await res.json();
      state.allSongs = data.songs || [];
      state.queue = [...state.allSongs];
      renderTrackList();

      if (state.queue.length > 0) {
        await playSong(state.queue[0], true);
      }
    } catch (_err) {
      trackListEl.innerHTML =
        '<div class="empty-state">Unable to load melodies from the Node.js server.</div>';
    }
  }

  init();
})();
