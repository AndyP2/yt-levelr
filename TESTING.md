# YT Levelr — Test Checklist

Manual checklist to run before tagging a release. No automated test harness
exists for browser extensions, so this is the next best thing.

## Core behaviour

- [ ] Direct navigation to a `/watch` URL — extension starts measuring without
      opening the popup
- [ ] Direct navigation to a `/shorts/` URL — same as above
- [ ] SPA navigation from YouTube homepage to a video — extension starts
      measuring
- [ ] SPA navigation from one video to another — measurement resets, extension
      starts fresh
- [ ] After 30s playing, status shows "locked" in popup
- [ ] Drift correction fires after 3 minutes locked (check console logs)

## Popup

- [ ] Popup opens on a YouTube video tab — shows gain, status, waveform
- [ ] Popup opens on a non-YouTube tab — shows "not on a YouTube video",
      waveform clears
- [ ] Popup opens with two browser windows — correct tab is targeted (Firefox
      `currentWindow` bug)
- [ ] Toggle ON/OFF — gain immediately goes to 1.0 when disabled, resumes when
      re-enabled
- [ ] Target slider — adjusting updates the target level live
- [ ] Re-measure button — resets measurement and status shows "measuring"
- [ ] Popup closes and reopens — settings persist (enabled state, target dB)

## Edge cases

- [ ] Video paused — playingMs does not advance, waveform shows null gap
- [ ] Video muted — treated same as paused, no gain correction applied
- [ ] Volume slider at minimum (below 0.05) — treated as muted
- [ ] Very quiet content (below noise floor) — no measurement skew
- [ ] Tab reload mid-measurement — clean reinitialisation

## Browser compatibility

- [ ] Firefox (primary)
- [ ] Chrome
