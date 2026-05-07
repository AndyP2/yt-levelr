# YT Levelr

A Firefox extension that automatically equalizes the volume of YouTube videos, especially podcasts where every producer has their own idea of what the correct levels should be.

![Screenshot](screenshot.png)

## Features

- **Automatic Loudness Normalization**: Automatically adjusts audio levels between videos to create a consistent listening experience
- **Smart Gain Management**: Uses asymmetric gain limits (more aggressive cuts than boosts) to prevent sudden loud blasts
- **Confidence-Based Adjustment**: Gradually widens gain range over 30 seconds as confidence in measurement grows
- **Drift Correction**: Slow automatic correction every 3 minutes after lock to handle long-term level shifts
- **Noise Floor Protection**: Ignores silence periods to avoid skewing measurements
- **Local Processing Only**: All audio processing happens entirely within your browser - no data is collected or transmitted

## Installation

### Firefox (Recommended)

1. Download the latest release from [GitHub Releases](https://github.com/AndyP2/yt-levelr/releases)
2. Open Firefox → Menu → Add-ons and themes
3. Click "Load Temporary Add-on" → Select the `yt-levelr` folder
4. Or install from the official add-on store once published

### Chrome (Experimental)

The extension is primarily designed for Firefox but may work on Chrome with Manifest V3 compatibility. See [Chrome Compatibility](#chrome-compatibility) below.

## How It Works

YT Levelr uses the Web Audio API to intercept audio output from YouTube's video element and applies automatic gain correction:

1. **Audio Interception**: Creates a source node from YouTube's video element
2. **RMS Measurement**: Continuously measures Root Mean Square (RMS) amplitude of the audio
3. **Gain Calculation**: Compares measured level against your target level (default: -22 dBFS)
4. **Smooth Transitions**: Applies gain changes with asymmetric attack/release times to protect against sudden loud sounds
5. **Locking**: After 30 seconds, gain locks and only drift correction applies

### Strategy Details

- **Gain Limits Widen Over Time**: 
  - 0s: ±6dB/+3dB (immediate, low confidence)
  - 10s: ±12dB/+6dB
  - 30s+: ±20dB/+15dB (full range, locked)

- **Asymmetric Treatment**: Cuts are permitted more aggressively than boosts because a sudden loud blast is worse than staying quiet for a few seconds

- **Gain Transitions**: Faster transitions for cuts (0.15s) than boosts (1.2s) to protect against sudden loud audio

## Usage

### Basic Use

1. Install the extension
2. Navigate to any YouTube video
3. The extension automatically starts measuring and adjusting gain
4. After 30 seconds, gain locks and maintains consistent levels

### Target Level Adjustment

Click the extension icon to open the popup:

- **Target Level Slider**: Adjust your preferred loudness (default: -22 dBFS)
  - Lower values = quieter overall volume
  - Higher values = louder overall volume
  - Recommended range: -30 to -12 dBFS

### Re-measuring

If you want to reset the measurement for the current video, click "re-measure current video" in the popup. This is useful if:

- The extension locked at an incorrect level
- You want to start fresh with a new target
- Audio conditions have changed significantly

## Visual Indicators

The popup displays real-time information:

- **Applied Gain**: Current gain multiplier being applied
- **Status**: Shows measuring, locked, or disabled state
- **Confidence Bar**: Progress toward full confidence (100% at 30s)
- **Waveform Display**: Visual representation of audio levels with target line

## Limitations

### Optimized Content Types

- ✅ **Podcasts**: Primary use case - spoken word content works excellently
- ✅ **Interviews**: Conversational audio normalizes well
- ✅ **Audiobooks**: Consistent narration levels handled correctly
- ✅ **Lectures**: Educational content with steady delivery

### Known Limitations

- ⚠️ **Music Videos**: Extended quiet intros may not be handled correctly due to the confidence-based approach
- ⚠️ **Dynamic Range Content**: Music with extreme dynamic range may benefit from manual adjustment
- ⚠️ **Very Quiet Audio**: Content consistently below -48 dBFS may not trigger measurements

### Browser Compatibility

- **Firefox**: Fully supported (tested on Firefox 140+)
- **Chrome**: Experimental support via Manifest V3 compatibility
- **Edge**: May work with Chromium-based implementation

## Privacy

YT Levelr is privacy-first by design:

- ✅ **No Data Collection**: The extension does not collect, store, or transmit any data
- ✅ **No Network Requests**: All processing happens locally in your browser
- ✅ **Minimal Permissions**: Only requests `storage` and `activeTab` permissions
- ✅ **No Analytics**: No usage statistics, crash reporting, or telemetry

See [Privacy Policy](privacy.html) for complete details.

## Technical Details

### Architecture

```
YouTube Video Element
    ↓
MediaElementSource (audio interception)
    ↓
DynamicsCompressor (transient control)
    ↓
GainNode (adjustment)
    ↓
AnalyserNode (RMS measurement)
    ↓
Destination (output)
```

### Audio Processing Pipeline

1. **Input**: Captures audio from YouTube's video element
2. **Compression**: Gentle dynamics compression to tame transient peaks
3. **Gain Adjustment**: Applies calculated gain based on RMS measurement
4. **Analysis**: Continuously measures output level for feedback
5. **Output**: Delivers normalized audio to speakers

### State Management

- **Measurement Phase** (0-30s): Actively measuring and adjusting gain within confidence limits
- **Locked Phase** (30s+): Gain locked, only drift correction applies
- **Drift Correction**: Every 3 minutes after lock, blends 10% toward new target based on recent measurements

### Storage

The extension stores only two user preferences locally:
- `enabled`: Whether the extension is active
- `targetDB`: Your chosen target loudness level in dBFS

These values never leave your browser.

## Troubleshooting

### Extension Not Working

1. **Check YouTube URL**: Ensure you're on a YouTube video page (`youtube.com/watch`)
2. **Verify Video Element**: The video element must be loaded and playing
3. **Browser Console**: Open DevTools (F12) → Console tab for error messages
4. **Restart Browser**: Sometimes required after installation

### Audio Sounds Different Than Expected

1. **Check Target Level**: Click the extension icon to verify target level settings
2. **Volume Slider**: The YouTube volume slider still works - it scales the output naturally
3. **Reset Measurement**: Use "re-measure current video" if levels seem incorrect

### Extension Shows "Not on a YouTube Video"

1. **Navigate to Watch Page**: Ensure you're on `/watch` or `/video/*` paths
2. **Video Loaded**: Wait for the video element to fully load
3. **Browser Tab**: The extension only works in the active browser tab

### Performance Issues

1. **Reduce Polling**: Extension polls every 1000ms - this is lightweight but can be adjusted
2. **Disable Waveform**: Consider disabling waveform animation if needed
3. **Hardware Acceleration**: Ensure browser hardware acceleration is enabled

## Chrome Compatibility

The extension uses Manifest V3 which is compatible with both Firefox and Chrome:

- **Firefox**: Native support, recommended platform
- **Chrome**: Works but may have some limitations due to Web Audio API differences
- **Edge**: Should work as it's Chromium-based

For Chrome users, you may need to adjust the `strict_min_version` in `manifest.json`.

## Development

### Building

The extension requires no build step - source files are packaged directly.

To create a zip for distribution:

```powershell
Compress-Archive -Path yt-levelr/* -DestinationPath build/yt-levelr.zip -Force
```

### Testing

1. Load the extension temporarily in Firefox
2. Navigate to various YouTube videos (podcasts, interviews, etc.)
3. Check popup displays correct information
4. Verify audio levels are being adjusted smoothly
5. Test edge cases: muted video, paused video, very quiet content

### Contributing

Contributions welcome! See the [GitHub repository](https://github.com/AndyP2/yt-levelr) for:

- Issue tracking
- Feature requests
- Pull requests
- Development guidelines

## License

YT Levelr is open source. See the GitHub repository for licensing details.

## Credits

- **Developer**: APMicro
- **Design**: Minimalist dark theme inspired by YouTube's design language
- **Fonts**: DM Mono and DM Sans from Google Fonts

## Support

- **Issues**: [GitHub Issues](https://github.com/AndyP2/yt-levelr/issues)
- **Documentation**: See README, privacy policy, and reviewer notes
- **Questions**: Open an issue or pull request on GitHub

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Homepage**: https://github.com/AndyP2/yt-levelr
