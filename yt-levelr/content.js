// Cross-browser compatibility shim: Firefox exposes `browser`, Chrome exposes `chrome`
const browser = globalThis.browser ?? globalThis.chrome;

/**
 * YT Levelr - content.js
 *
 * Strategy:
 * - Gain limits widen over time as confidence in the measurement grows
 * - Cuts are permitted more aggressively than boosts at all stages (asymmetric)
 *   because a sudden loud blast is worse than staying quiet for a few seconds
 * - Gain transitions are faster for cuts than for boosts (asymmetric attack/release)
 * - After 30s the gain locks; a slow drift correction every 3 minutes handles
 *   any remaining long-term level shift
 * - Samples below the noise floor are ignored to avoid silence skewing the median
 *
 * Confidence schedule (elapsed => max cut / max boost):
 *   0s:     -6dB  / +3dB  (immediate, low confidence)
 *   30s+:   -20dB / +15dB (full range, locked)
 *   Limits increase linearly between 0s and 30s.
 */

const TARGET_RMS = 0.08;        // Target RMS (~-22 dBFS, comfortable speech level)
const NOISE_FLOOR = 0.005;      // Ignore samples quieter than this
const MAX_GAIN = 5.62;          // +15dB absolute ceiling
const MIN_GAIN = 0.1;           // -20dB absolute floor

const LOCK_TC  = 30000;         // ms - full confidence, lock gain
const DRIFT_TC = 3 * 60 * 1000; // ms - slow drift correction period after lock

// At each elapsed ms threshold, permitted range widens.
// First entry applies from t=0, so there is no dead period.
const CONFIDENCE_SCHEDULE = [
  { at: 0,     maxCutDB: 6,  maxBoostDB: 3  },
  { at: 10000, maxCutDB: 12, maxBoostDB: 6  },
  { at: 30000, maxCutDB: 20, maxBoostDB: 15 },
];

// GainNode transition time constants (seconds)
// Cuts apply faster than boosts to protect against sudden loud audio
const TC_CUT   = 0.15;
const TC_BOOST = 1.2;

let audioCtx = null;
let sourceNode = null;
let gainNode = null;
let analyserNode = null;
let compressorNode = null;

// Ring buffer for waveform display -- last 100 samples (~30s at 300ms interval)
const WAVEFORM_SIZE = 100;
const waveformHistory = new Array(WAVEFORM_SIZE).fill(null);
let waveformHead = 0;

let measurementSamples = [];
let playingMs = 0;        // cumulative ms of actual playback (excludes paused time)
let lastTickTime = null;  // wall clock at last tick, for incrementing playingMs
let locked = false;
let currentGain = 1.0;
let intervalId = null;    // setInterval handle for measurementLoop
let lastDriftCorrection = null;

let enabled = true;

// Load enabled state from storage with error handling
browser.storage.local.get("enabled").then(result => {
  enabled = result.enabled !== false; // default true
}).catch(err => {
  console.warn("[YT Levelr] Failed to load enabled state:", err);
});

// Listen for messages from popup
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    if (msg.type === "setEnabled") {
      enabled = msg.value;
      if (gainNode && audioCtx) {
        gainNode.gain.setTargetAtTime(enabled ? currentGain : 1.0, audioCtx.currentTime, 0.1);
      }
    }
    if (msg.type === "setTarget") {
      // TARGET_RMS is const but we can work around this via a mutable wrapper
      state.targetRMS = msg.value;
    }
    if (msg.type === "remeasure") {
      resetMeasurement();
    }
    if (msg.type === "getState") {
      // Unroll ring buffer into chronological order
      const waveform = [];
      for (let i = 0; i < WAVEFORM_SIZE; i++) {
        waveform.push(waveformHistory[(waveformHead + i) % WAVEFORM_SIZE]);
      }
      const limits = gainLimitsForElapsed(locked ? LOCK_TC : playingMs);
      sendResponse({
        enabled,
        gain: currentGain,
        locked,
        targetRMS: state.targetRMS,
        elapsed: playingMs,
        waveform,
        gainLimits: limits
      });
      return true; // keeps the message channel open for sendResponse
    }
  } catch (err) {
    console.error("[YT Levelr] Message handler error:", err);
  }
});

// Mutable state that the popup can adjust
const state = {
  targetRMS: TARGET_RMS
};

function log(msg) {
  console.debug("[YT Levelr]", msg);
}

function setupAudioGraph(videoEl) {
  try {
    // createMediaElementSource permanently binds to the video element. Calling it
    // again on the same element throws InvalidStateError even if the previous
    // AudioContext was closed - the binding survives context closure.
    // YouTube reuses the same <video> element across SPA navigations, so we must
    // never close the AudioContext or call createMediaElementSource more than once.
    // Instead: create everything once, then on subsequent calls just disconnect and
    // reconnect the graph (which lets us update gainNode.gain etc.) and resume.
    if (!audioCtx) {
      audioCtx = new AudioContext();
      sourceNode = audioCtx.createMediaElementSource(videoEl);
      log("AudioContext and sourceNode created");
    }

    audioCtx.resume().catch(() => {});

    // Disconnect existing graph before reconnecting, so we can safely recreate
    // compressor/gain/analyser nodes without accumulating stale connections.
    try { sourceNode.disconnect(); } catch(e) {}

    // Gentle compressor to tame transient peaks before gain adjustment
    compressorNode = audioCtx.createDynamicsCompressor();
    compressorNode.threshold.value = -18;  // dB
    compressorNode.knee.value = 10;
    compressorNode.ratio.value = 3;
    compressorNode.attack.value = 0.05;
    compressorNode.release.value = 0.3;

    gainNode = audioCtx.createGain();
    gainNode.gain.value = enabled ? currentGain : 1.0;

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;

    // Graph: source -> compressor -> gain -> analyser -> destination
    sourceNode.connect(compressorNode);
    compressorNode.connect(gainNode);
    gainNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

    log("Audio graph connected");
  } catch (err) {
    console.error("[YT Levelr] Failed to setup audio graph:", err.name, err.message, err);
    throw err;
  }
}

function getRMS() {
  if (!analyserNode) return 0;
  const buf = new Float32Array(analyserNode.fftSize);
  try {
    analyserNode.getFloatTimeDomainData(buf);
  } catch (err) {
    console.warn("[YT Levelr] Failed to get time domain data:", err);
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    sum += buf[i] * buf[i];
  }
  return Math.sqrt(sum / buf.length);
}

function resetMeasurement() {
  measurementSamples = [];
  playingMs = 0;
  lastTickTime = null;
  locked = false;
  lastDriftCorrection = null;
  waveformHistory.fill(null);
  waveformHead = 0;
  log("Measurement reset");
}

// Returns the permitted [minGain, maxGain] for the current elapsed time
function gainLimitsForElapsed(elapsed) {
  const t = Math.min(1, elapsed / LOCK_TC);  // 0.0 at start, 1.0 at full confidence
  const maxCutDB   = GAIN_LIMIT_INITIAL.maxCutDB   + t * (GAIN_LIMIT_FULL.maxCutDB   - GAIN_LIMIT_INITIAL.maxCutDB);
  const maxBoostDB = GAIN_LIMIT_INITIAL.maxBoostDB + t * (GAIN_LIMIT_FULL.maxBoostDB - GAIN_LIMIT_INITIAL.maxBoostDB);
  return {
    min: Math.pow(10, -maxCutDB  / 20),
    max: Math.pow(10,  maxBoostDB / 20),
  };
}

function applyGain(g, elapsed) {
  try {
    const limits = gainLimitsForElapsed(elapsed !== undefined ? elapsed : LOCK_TC);
    const clamped = Math.max(
      Math.max(MIN_GAIN, limits.min),
      Math.min(Math.min(MAX_GAIN, limits.max), g)
    );

    const isCut = clamped < currentGain;
    const tc = isCut ? TC_CUT : TC_BOOST;

    currentGain = clamped;
    if (gainNode && enabled) {
      gainNode.gain.setTargetAtTime(currentGain, audioCtx.currentTime, tc);
    }
  } catch (err) {
    console.error("[YT Levelr] Failed to apply gain:", err);
  }
}

function getVolumeScale() {
  // Returns the current volume as a linear scale factor (0.05..1.0).
  // Returns null if the video is muted or below the minimum usable threshold,
  // which callers should treat the same as paused.
  if (!videoEl || videoEl.muted || videoEl.volume < 0.05) return null;
  return videoEl.volume;
}

function isEffectivelyMuted() {
  return getVolumeScale() === null;
}

function measurementLoop() {
  if (!analyserNode || !enabled) return;

  // Resume AudioContext if it was suspended (e.g. browser autoplay policy)
  if (audioCtx && audioCtx.state === "suspended") {
    try {
      audioCtx.resume();
    } catch (err) {
      console.warn("[YT Levelr] Failed to resume AudioContext:", err);
    }
    return;
  }

  const now = Date.now();

  // Accumulate playing time only while the video is actually running and audible
  if (videoEl && !videoEl.paused && !videoEl.ended && !isEffectivelyMuted()) {
    if (lastTickTime !== null) {
      playingMs += now - lastTickTime;
    }
    lastTickTime = now;
  } else {
    // Paused or muted -- stop the clock without advancing the waveform
    lastTickTime = null;
    return;
  }

  const rms = getRMS();
  const volumeScale = getVolumeScale() ?? 1.0; // defensive fallback, unreachable in practice

  // Pre-scale RMS by 1/volume to get the video's inherent signal level,
  // independent of where the user has the volume set.
  // The waveform also uses this so the display reflects true content loudness.
  const trueRMS = rms / volumeScale;

  // Always record to waveform history regardless of noise floor
  waveformHistory[waveformHead] = trueRMS;
  waveformHead = (waveformHead + 1) % WAVEFORM_SIZE;

  // Skip silence
  if (trueRMS < NOISE_FLOOR) return;

  if (!locked) {
    measurementSamples.push(trueRMS);

    // Apply gain on every tick from the first sample onward.
    // The confidence schedule limits how far we can move at each stage,
    // so early corrections are necessarily modest.
    if (measurementSamples.length > 3) {
      const medianRMS = median(measurementSamples);
      // Gain is set purely from true signal level -- volume slider scales output naturally
      const targetGain = state.targetRMS / medianRMS;
      applyGain(targetGain, playingMs);
      log(`Gain update at ${(playingMs/1000).toFixed(1)}s playing: ${currentGain.toFixed(3)}x (true RMS: ${medianRMS.toFixed(4)}, volume: ${volumeScale.toFixed(2)})`);
    }

    // Lock at 30s of actual playback
    if (playingMs >= LOCK_TC) {
      locked = true;
      lastDriftCorrection = Date.now();
      log(`Locked at gain: ${currentGain.toFixed(3)}x`);
      measurementSamples = [];
    }
  } else {
    // Slow drift correction after lock
    const timeSinceDrift = Date.now() - lastDriftCorrection;
    if (timeSinceDrift >= DRIFT_TC) {
      measurementSamples.push(trueRMS);
      if (measurementSamples.length >= 60) {
        const medianRMS = median(measurementSamples);
        // medianRMS is already pre-scaled to true signal level, so no volume factor needed
        const targetGain = state.targetRMS / medianRMS;
        // Blend 10% toward new target, with full gain range permitted
        const correctedGain = currentGain + (targetGain - currentGain) * 0.1;
        applyGain(correctedGain);
        log(`Drift correction: ${currentGain.toFixed(3)}x`);
        measurementSamples = [];
        lastDriftCorrection = Date.now();
      }
    }
  }
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// --- YouTube navigation detection ---

let currentUrl = location.href;
let videoEl = null;

function onNewVideo() {
  log(`New video detected: ${location.href}`);
  currentGain = 1.0;
  resetMeasurement();

  // Wait for video element to appear, then defer AudioContext creation until
  // the first play event. Chrome requires a user gesture before allowing
  // AudioContext construction; a play event satisfies this requirement.
  waitForVideo().then(el => {
    videoEl = el;

    const initGraph = () => {
      if (!audioCtx) {
        try {
          setupAudioGraph(videoEl);
        } catch (err) {
          // setupAudioGraph already logged; don't crash the whole listener
          return;
        }
      } else if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(measurementLoop, 300);
    };

    if (!videoEl.paused) {
      // Video is already playing (e.g. script injected mid-playback)
      initGraph();
    } else {
      videoEl.addEventListener("play", initGraph, { once: true });
    }
  });
}

function waitForVideo() {
  return new Promise(resolve => {
    const check = () => {
      const el = document.querySelector("video");
      if (el) return resolve(el);
      setTimeout(check, 200);
    };
    check();
  });
}

// Handle YouTube UI changes that might affect our listeners
window.addEventListener("yt-navigate-start", () => {
  log("YouTube navigation starting...");
});

// YouTube fires this on SPA navigation
window.addEventListener("yt-navigate-finish", () => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    onNewVideo();
  }
});

// Also handle initial page load if already on a watch page
if (location.pathname === "/watch") {
  onNewVideo();
}

// Gracefully handle video element removal
window.addEventListener("beforeunload", () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
});
