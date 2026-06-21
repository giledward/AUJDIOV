# AUJDIOV

AUJDIOV is a real-time audio visualizer designed to become a desktop music wallpaper: a background that reacts to music while you play, work, or focus.

## Vision

Most visualizers live inside a media player. AUJDIOV is different: the goal is to make the desktop itself feel alive.

The project starts as a browser-based visualizer because the Web Audio API is fast to prototype with, then moves into a desktop app using Electron/Tauri-style packaging. The long-term target is a real desktop background mode where music can generate waves, particles, rings, and custom scenes behind the user's windows.

## MVP Features

- Load a local audio file and visualize it in real time.
- Use microphone input for live audio reaction.
- Capture tab/system audio where the browser allows it.
- Switch between visual modes: nebula waves, cyber bars, particles, and bass ring.
- Adjust intensity and smoothing.
- Run as a full-screen background-style experience.

## Roadmap

### Phase 1 — Web Visualizer

Build the core renderer in HTML, CSS, and JavaScript.

- Canvas rendering engine
- Audio analyzer setup
- Multiple visual modes
- Responsive full-screen layout
- Portfolio-ready README and demo notes

### Phase 2 — Desktop App

Wrap the web visualizer as a local desktop app.

- Full-screen borderless window
- Auto-start option
- Click-through overlay mode
- Local settings saved on device
- Hotkeys for changing modes

### Phase 3 — Real Wallpaper Mode

Explore OS-specific wallpaper integration.

- Windows desktop background/WorkerW research
- macOS limitations and alternatives
- Performance tuning for gaming
- GPU-friendly rendering options

## Tech Stack

- HTML Canvas
- JavaScript
- Web Audio API
- Future: Electron or Tauri for desktop packaging

## Why this belongs in a portfolio

AUJDIOV shows front-end engineering, real-time rendering, audio processing, product thinking, and desktop-app ambition. It is personal, visual, and easy to demo in interviews.

## Status

Starting MVP.
