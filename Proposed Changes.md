# Proposed Changes for YT Levelr

## Overview
YouTube loudness levelling extension for Firefox. Currently a working prototype with Manifest V3, Web Audio API integration, and basic UI.

## 1. Code Quality & Architecture

### 1.1 Error Handling & Edge Cases - done
- **Content.js**: Add robust error handling for:
  - AudioContext lifecycle management (dev, mute, tab switch)
  - MediaElementSource connection failures
  - AnalyserNode measurement interruptions
- **Popup.js**: Handle timing inconsistencies when popup closes mid-poll
- Add `try-catch` blocks around sensitive operations with graceful fallbacks

### 1.2 Performance Optimizations - done
- **Popup polling**: Reduce update frequency from 800ms to 1000-1500ms on inactivity
- **Waveform rendering**: Add debouncing to avoid excessive canvas redraws
- **Measurement samples**: Rate-limit drift correction to 60 samples like current implementation
- **DOM updates**: Batch widget updates where possible

### 1.3 Code Consistency
- Standardise variable naming across content.js and popup.js
- Consider extracting shared utilities (conversion functions) to common module
- Maintain consistent error logging patterns
- Add JSDoc comments for complex functions

## 2. User Experience

### 2.1 Visual Feedback
- Add real-time gain level to both popup and overlay notifications
- Include on-progress feedback during initial 30s measurement period
- Visual indicator when in drift correction mode
- Better video overlay when audio is being affected (subtle gain meter near video controls)

### 2.2 Performance Indicator
- Show current measurement/update frequency
- Add "processing time" stats to popup
- Option to disable waveform animation for performance

### 2.3 Measurements
- Allow manual override during initial 30s period
- Show confidence percentage progress during measurement
- Display actual vs target RMS in real-time
- Option to export measurement stats (for debugging/social sharing)

### 2.4 Edge Case Handling
- Handle YouTube redesign changes gracefully
- Gracefully handle video preload buffering
- Maintain state restoration after browser restart
- Support multiple simultaneous YouTube tabs view

## 3. Advanced Features

### 3.1 Audio Hardware Detection
- Detect audio driver/aggregator latency
- Add audio hardware profile selection
- Quick save favourite target levels for different video types

### 3.2 Enhanced Audio Processing
- Add optional compression after gain for more impact
- Support intelligent silence detection thresholds
- Configurable attack/release for different content types
- Quick-snap preset for "music", "podcast", "loudness-calibrated" content

### 3.3 User Preferences
- Save multiple target profiles per video type
- Learn from user adjustments (auto-remember preferences)
- Export/import configuration for device transfer
- Track measurement consistency metrics

### 3.4 Display Enhancements
- Alternative color themes for accessibility
- High-contrast mode
- Expanded dB scale options (-60 to +12 dBFS)
- Toggle detailed vs minimal view

## 4. Technical Improvements

### 4.1 Requirements Clarification
- Verify Firefox minimum version compatibility
- Consider Chrome Manifest V3 compatibility
- Add Chrome extension ID registration
- Test with latest Firefox Nightly

### 4.2 Testing
- Basic unit tests for conversion utilities
- Basic integration tests for audio pipeline
- Manual testing checklist for:
  - Diverse video quality ranges
  - Physically noisy environments
  - Browser hardware acceleration
  - System audio test tones

### 4.3 Dependencies
- Remove unused CSS font imports (Google Fonts)
- Consider adding ESLint/Prettier for code consistency
- Add Husky for pre-commit hooks
- Consider manual test automation

### 4.4 Build Process
- Refactor release workflow to:
  - Include all extension files recursively
  - Exclude build directory from zip
  - Sign the Firefox extension
- Consider adding community build verification

## 5. Documentation

### 5.1 README Improvements
- Add technical implementation overview with architecture diagram
- Document known limitations and edge cases
- Add troubleshooting section for common problems
- Provide user experience guides for different scenarios

### 5.2 Developer Documentation
- Architecture documentation
- Audio processing pipeline explanation
- Extension manifest details
- Testing protocols
- How to extend with custom features

### 5.3 Release Notes Template
- Standard format for version history
- Feature highlights per version
- Bug fixes and known issues
- Breaking change notes

### 5.4 User Guide
- Quick start guide
- Configuration guide (all parameters explained)
- FAQ addressing common scenarios
- Privacy policy reference

## 6. Security & Privacy

### 6.1 Current State
- Already privacy-focused (no data collection)
- No network requests, no analytics
- Local processing only
- Minimal permissions

### 6.2 Enhancements
- Add manifest.json version update notification
- Implement content security policy
- Add phishing protection checks (if audio source detection needed)
- Document data retention policies (none)

## 7. Project Management

### 7.1 Issue Tracking
- Centralised issue tracking (GitHub Issues)
- Categorise by feature, bug, enhancement, question
- Tag with priority: urgent, high, medium, low
- Add bug bounty scope if appropriate

### 7.2 Versioning
- Adopt clear semantic versioning (currently 1.0.0)
- Add CHANGELOG.md
- Document breaking changes before release
- Consider pre-release versions

### 7.3 Analytics & Feedback
- Minimal usage statistics (performance, errors only)
- Anonymous crash reporting (optional Firefox add-on)
- User feedback mechanism
- Issue template for feature requests

## 8. User Value Proposition

### 8.1 Feature Priority (high to low)

**High Value:**
- Improved visual feedback during processing
- Target level presets (music/podcast/lively)
- Graceful error handling
- Chrome compatibility support

**Medium Value:**
- Audio hardware profiling
- Extended measurement period options
- Application restart persistence
- Usage statistics for performance monitoring

**Low Value:**
- Theme options
- Multiple target profiles
- Video type learning
- Advanced audio parameters

## 9. Implementation Approach

### Phase 1: Foundation Improvements (Recommended First)
1. Error handling enhancement in content.js
2. Budget-based popup polling optimization
3. UI responsiveness improvements
4. Documentation expansion

### Phase 2: Feature Additions
1. Target level presets functionality
2. Visual feedback enhancements
3. Performance monitoring
4. Chrome compatibility

### Phase 3: Advanced Features (Future)
1. Audio hardware detection
2. Community learning/adjustments
3. Comprehensive testing suite
4. Application restart state restoration

## 10. Risk Mitigation

### Potential Issues
- Web Audio API changes in browsers
- YouTube UI redesigns breaking listeners
- Performance impact on low-end devices
- Audio processing inconsistencies

### Mitigation Strategies
- Maintain compatibility with multiple browser versions
- Add graceful degradation for YouTube navigation changes
- Allow disabling features for performance
- Document known inconsistencies and limitations

### Testing Strategy
- Manual testing on diverse devices
- Error flow testing (mute, hardware failure, etc.)
- Performance benchmarking
- Cross-browser verification
- Video quality range testing

## 11. Success Metrics

### Immediate (Q1 2026)
- 10% response time improvement
- 50% reduction in popup-related errors
- 80% user satisfaction on existing features
- Privacy policy reviews from 3+ potential users

### Medium-term (Q2 2026)
- Add 2 high-value features based on user feedback
- 75% crash rate reduction
- Chrome extension availability
- 100 additional test videos tested across 5 scenarios

### Long-term (Q3 2026)
- 200+ downloads across platforms
- 5+ average user rating
- 10+ feature implementations below roadmap completion
- Cross-browser main branch availability
