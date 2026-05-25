# YT Levelr — Design Notes

This file documents non-obvious constraints and decisions in the codebase.
Read this before making changes to content.js or popup.js.

## AudioContext — never recreate it

`createMediaElementSource` permanently binds to the video element. Calling it
again on the same element throws `InvalidStateError` even if the previous
AudioContext was closed. YouTube reuses the same `<video>` element across SPA
navigations, so the AudioContext must be created exactly once per page load.

On subsequent video navigations, the graph is disconnected and reconnected
(replacing compressor/gain/analyser nodes) but `audioCtx` and `sourceNode`
are never closed or recreated.

## Analyser is upstream of gain — deliberately

The AnalyserNode sits between the compressor and the GainNode, so RMS
measurements reflect the true input level rather than the already-adjusted
output. If the analyser were downstream of gain, the gain would chase its own
output and oscillate.

```
source -> compressor -> analyser -> gain -> destination
                            ^
                    RMS measured here
```

## Asymmetric gain limits

Cuts are permitted more aggressively than boosts at all stages, and gain
transitions are faster for cuts (TC_CUT 0.15s) than boosts (TC_BOOST 1.2s).
This is intentional: a sudden loud blast is worse than staying quiet for a
moment.

## Confidence schedule

Gain limits widen linearly from t=0 to t=30s (LOCK_TC). At t=0 the permitted
range is -6dB/+3dB; at 30s it is -20dB/+15dB. This prevents large corrections
before there are enough samples to trust the median. After 30s, gain locks and
only the slow drift correction (every 3 minutes, blending 10% toward a new
target) applies.

## Volume normalisation in measurement

RMS is divided by the current volume slider value before being compared to the
target. This means the gain correction reflects the true content loudness, not
the user's volume preference. The waveform display uses the same pre-scaled
value for consistency.

## Firefox: currentWindow: true is required

`browser.tabs.query({ active: true })` without `currentWindow: true` can
return the active tab from any window on Firefox. All `tabs.query` calls in
popup.js must include `currentWindow: true` or sendMessage will fail with
"Could not establish connection. Receiving end does not exist."

## YouTube SPA navigation

YouTube fires several events on navigation:

- `yt-navigate-start` — navigation beginning, video not yet loaded
- `yt-navigate-finish` — navigation complete; reliable for subsequent
  navigations but may fire before `document_idle` injection on initial
  page load
- `yt-page-data-updated` — fires later than `yt-navigate-finish`; used as
  a fallback to catch the case where the content script misses the initial
  `yt-navigate-finish` event

Both `yt-navigate-finish` and `yt-page-data-updated` are guarded by an
`href !== currentUrl` check to prevent double-initialisation.

The initial pathname check covers `/watch` and `/shorts/` for direct page
loads.

## onMessage listener must be synchronous

`browser.runtime.onMessage.addListener` is called at the top level of
content.js, before any async initialisation. If it were registered inside a
`.then()` or `await`, the popup could poll before the listener is ready and
get a connection error.

## pollInterval variable in popup.js

`setInterval` is assigned to `pollInterval` so it can be stopped
programmatically if needed (e.g. after a persistent error). The interval is
implicitly stopped when the popup closes because the popup's JS context is torn
down by the browser, so there is no leak into the content script.
