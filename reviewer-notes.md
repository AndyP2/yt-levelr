# Reviewer notes

YT Levelr uses the Web Audio API to intercept the audio output of YouTube's
video element via `createMediaElementSource`, applies a dynamics compressor and
gain correction node, and measures RMS amplitude via an `AnalyserNode` to
normalise loudness between videos. All processing is local. No data is
collected or transmitted.

The extension listens for YouTube's `yt-navigate-finish` and
`yt-page-data-updated` events to detect SPA navigation between videos, and
resets its measurement state on each new video. An initial pathname check
covers direct page loads to `/watch` and `/shorts/`.

The source submitted is the complete, unminified source -- there is no build
step beyond packaging into a zip.
