# Desktop Wallpaper Roadmap

AUJDIOV's final form is a desktop audio wallpaper: music creates visuals in the user's background while they play games, study, or work.

## Product Direction

The app should feel like a personal audio world, not just a media player plugin.

Target experience:

1. User opens AUJDIOV.
2. User chooses an audio source: local file, microphone, browser tab, or future system audio.
3. User chooses a visual style.
4. AUJDIOV goes full-screen/background mode.
5. The desktop reacts to music without blocking normal work or gaming.

## Implementation Strategy

### 1. Browser MVP

This is the first version in the repo.

Purpose:

- Prove the audio analysis works.
- Prove the renderer looks good.
- Create a demo that is easy to show in a portfolio.

Current implementation:

- `index.html`
- `styles.css`
- `script.js`
- Web Audio API analyzer
- HTML Canvas rendering

### 2. Desktop Shell

Next step after the web MVP works.

Options:

- Electron: easier web-to-desktop path, heavier app size.
- Tauri: lighter, more native, more setup.

Desktop MVP requirements:

- Borderless full-screen window
- Optional always-on-top mode
- Optional click-through mode
- Save user settings locally
- Hotkeys for switching modes
- Launch at startup toggle

### 3. Wallpaper Mode

True wallpaper behavior is OS-specific.

Windows path:

- Research WorkerW/desktop-window attachment.
- Create a native helper if needed.
- Keep renderer separate from OS integration.

macOS path:

- True interactive desktop wallpaper is more restricted.
- Best fallback may be borderless behind-workflow mode or screensaver-style mode.

Linux path:

- Depends heavily on window manager/desktop environment.
- Treat as later support.

## Portfolio Story

Problem: I listen to music while playing games, but music is invisible.

Solution: Build a desktop background that turns music into a visual environment.

Technical proof:

- Audio processing
- Canvas rendering
- Real-time animation
- Browser APIs
- Desktop app roadmap
- Product thinking

## Next Milestones

- Fix local-file playback across browsers.
- Add keyboard shortcuts.
- Add settings persistence.
- Add performance meter.
- Add Electron prototype.
- Package a Windows build.
