# Contributing to YT Levelr

Thank you for your interest in contributing to YT Levelr! This document outlines the contribution guidelines and project structure.

## Project Structure

```
yt-levelr/
├── yt-levelr/              # Extension source files
│   ├── manifest.json       # Firefox extension manifest (Manifest V3)
│   ├── content.js          # Main audio processing logic
│   ├── popup.html          # Extension popup UI
│   ├── popup.js            # Popup functionality and state management
│   └── icons/              # Extension icon files
├── privacy.html            # Privacy policy documentation
├── README.md               # User documentation
├── CHANGELOG.md            # Version history
├── .github/
│   └── workflows/
│       └── release.yml     # CI/CD release automation
├── .vscode/
│   ├── settings.json       # VS Code configuration
│   └── tasks.json          # Build tasks
├── .gitignore              # Git ignore rules
├── screenshot.png          # Extension screenshot
└── reviewer-notes.md       # Technical implementation notes
```

## Development Setup

### Prerequisites

- **Git**: For version control
- **Node.js** (optional): For potential future tooling
- **Firefox**: For testing the extension

### Loading for Development

1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This tempory add-on"
4. Click "Load Add-on from File..."
5. Select the `yt-levelr/yt-levelr` folder

### Building

The extension requires no build step - source files are packaged directly.

To create a zip for distribution:

```powershell
Compress-Archive -Path yt-levelr/* -DestinationPath build/yt-levelr.zip -Force
```

## Code Style

### JavaScript/TypeScript

- **Indentation**: 2 spaces (configured in `.editorconfig`)
- **Line Length**: Maximum 120 characters
- **Semicolons**: Required
- **Braces**: Always use braces for control structures
- **Naming**: camelCase for variables/functions, PascalCase for classes

### HTML/CSS

- **Indentation**: 2 spaces
- **Class Naming**: BEM-style naming convention preferred
- **CSS Variables**: Use CSS custom properties for theming

### JSON

- **Indentation**: 2 spaces
- **Key Ordering**: Group related keys together
- **Trailing Commas**: Allowed (modern parsers support this)

## Code Quality

### Error Handling

Always wrap critical operations in try-catch blocks:

```javascript
try {
  // Critical operation
  audioCtx.resume();
} catch (err) {
  console.warn("[YT Levelr] Failed to resume AudioContext:", err);
}
```

### Logging

Use consistent logging patterns:

```javascript
function log(msg) {
  console.debug("[YT Levelr]", msg);
}

function error(msg, err) {
  console.error(`[YT Levelr] ${msg}:`, err);
}
```

### Performance

- **Debouncing**: Use debouncing for frequent operations (e.g., polling)
- **Rate Limiting**: Limit measurement updates to avoid excessive processing
- **Memory Management**: Clean up intervals and listeners on tab close

## Testing

### Manual Testing Checklist

- [ ] Navigate to various YouTube videos (podcasts, interviews, etc.)
- [ ] Verify gain adjustment works correctly
- [ ] Check popup displays accurate information
- [ ] Test edge cases: muted video, paused video, very quiet content
- [ ] Verify extension survives browser restart
- [ ] Test on different screen sizes
- [ ] Verify privacy policy is accessible

### Browser Compatibility

Test on:
- Firefox (primary platform)
- Chrome (experimental support)
- Edge (Chromium-based)

## Issue Guidelines

### Bug Reports

When reporting bugs, please include:

1. **Environment**: Browser version, OS, extension version
2. **Steps to Reproduce**: Clear, numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots/Logs**: Console errors or relevant screenshots

### Feature Requests

When requesting features, please include:

1. **Use Case**: Why this feature is needed
2. **Problem Solved**: What problem it addresses
3. **Alternatives Considered**: Other solutions tried
4. **Implementation Notes**: Any technical considerations

## Pull Request Guidelines

### Before Submitting

1. **Update Documentation**: Update README, CHANGELOG if needed
2. **Test Thoroughly**: Test on multiple videos and browsers
3. **Code Review**: Ensure code follows project style guidelines
4. **Commit Messages**: Use clear, descriptive commit messages

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(popup): add target level slider with persistence
fix(content): handle AudioContext suspension gracefully
docs(README): add troubleshooting section for common issues
```

## Architecture Overview

### Audio Processing Pipeline

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

### State Machine

```
┌─────────────┐
│  INITIALIZING │
└──────┬───────┘
       │ video loaded
       ↓
┌─────────────┐
│ MEASURING   │ ←→ [confidence builds]
└──────┬───────┘
       │ 30s elapsed
       ↓
┌─────────────┐
│ LOCKED      │ ←→ [drift correction every 3min]
└─────────────┘
```

### Message Protocol

Popup ↔ Content Script communication:

| Type | Direction | Purpose |
|-------|-----------|---------|
| `getState` | popup → content | Request current state |
| `setState` | popup → content | Enable/disable extension |
| `setTarget` | popup → content | Update target RMS level |
| `remeasure` | popup → content | Reset measurement for current video |

## Known Limitations

When contributing, be aware of these known limitations:

1. **Music Videos**: Extended quiet intros may not be handled correctly
2. **Very Quiet Audio**: Content below -48 dBFS may not trigger measurements
3. **Browser Compatibility**: Primarily Firefox, Chrome is experimental
4. **YouTube Changes**: May break on major YouTube UI redesigns

## Code of Conduct

### Principles

- **Respectful**: Be respectful and considerate in all interactions
- **Inclusive**: Create a welcoming environment for all contributors
- **Constructive**: Provide constructive feedback and receive it gracefully
- **Transparent**: Be open about your work and decisions

### Guidelines

- Use welcoming and inclusive language
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Help

If you need help contributing:

1. **Check Documentation**: README, reviewer-notes.md, privacy.html
2. **Open Issue**: Create an issue with your question
3. **GitHub Discussions**: Use GitHub Discussions for general questions
4. **Direct Contact**: Reach out to the maintainer via GitHub

## License

By contributing to YT Levelr, you agree that your contributions will be licensed under the project's license.

## Acknowledgments

Thank you for considering contributing to YT Levelr! Your help makes this project better for everyone.

---

**Maintained by**: APMicro  
**Repository**: https://github.com/AndyP2/yt-levelr  