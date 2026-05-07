# Changelog

All notable changes to YT Levelr will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release with core loudness normalization features
- Confidence-based gain adjustment system
- Drift correction after 30-second lock period
- Real-time waveform visualization in popup
- Target level slider for user preference

### Changed
- Implemented asymmetric gain limits (cuts more aggressive than boosts)
- Gradual confidence building over 30 seconds of playback

### Fixed
- Initial audio graph setup and teardown
- YouTube SPA navigation event handling
- Measurement state reset on new video detection

## [1.0.0] - 2026-05-07

### Added
- **Core Features**: Automatic loudness normalization for YouTube videos
- **Audio Processing**: Web Audio API integration with RMS measurement
- **User Interface**: Popup extension with real-time gain display and waveform visualization
- **Privacy**: Zero data collection, local processing only
- **Documentation**: Comprehensive README, privacy policy, and troubleshooting guide

### Changed
- **Error Handling**: Added try-catch blocks around critical operations
- **Performance**: Optimized polling interval from 800ms to 1000ms with debouncing
- **Robustness**: Improved error handling for AudioContext lifecycle management
- **Code Quality**: Standardized logging patterns and added defensive programming

### Fixed
- **Message Handling**: Added error handling for popup-content script communication
- **Audio Context**: Improved suspension/resumption handling for browser autoplay policy
- **Gain Application**: Added error handling to prevent crashes on gain node failures
- **RMS Measurement**: Added error handling for analyser node data retrieval
- **Tab Lifecycle**: Added cleanup handlers for beforeunload events

### Security
- **Permissions**: Minimal permissions (storage, activeTab) with clear documentation
- **Privacy**: No network requests, no analytics, no telemetry
- **Data Collection**: Zero data collection policy enforced

### Documentation
- **README**: Comprehensive user guide with installation, usage, and troubleshooting
- **Privacy Policy**: Complete privacy documentation
- **Technical Docs**: Architecture overview and audio processing pipeline explanation
- **Troubleshooting**: Common issues and solutions documented

## [0.1.0] - 2026-04-01

### Added
- Basic loudness measurement functionality
- Simple gain adjustment system
- YouTube navigation event detection

### Changed
- Initial implementation of confidence-based approach

### Fixed
- Basic audio graph setup

---

## Version Numbering

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Release Tags

Releases are tagged with semantic version numbers (e.g., `v1.0.0`, `v1.1.0`).

The GitHub Actions workflow automatically creates releases when a tag matching the pattern `v*.*.*` is pushed.

## Changelog Format

This changelog follows the [Keep a Changelog](https://keepachangelog.com/) specification:

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Insecurity-related changes

## Contributing to Changelog

When submitting a pull request, please include your changes in the appropriate section of this file under the `[Unreleased]` section. Changes will be moved to the appropriate version section during release preparation.
