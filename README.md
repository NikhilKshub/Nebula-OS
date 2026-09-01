# Nebula OS

**A browser-based desktop experience inspired by operating-system interfaces — built entirely with HTML, CSS, and vanilla JavaScript.**

Nebula OS is a fully self-contained web desktop that runs in any modern browser. No frameworks, no build tools, no installation required. It features a suite of interactive apps, a working terminal, persistent state via `localStorage`, and a wormhole singularity effect that pulls the entire desktop into a black hole.

---

## Screenshots

| Desktop | Terminal | Music Player |
|---|---|---|
| ![Desktop](assets/latest%20webos%20images/main1.png) | ![Terminal](assets/latest%20webos%20images/terminal.png) | ![Music](assets/latest%20webos%20images/music.png) |

| Calculator | Notes | Paint |
|---|---|---|
| ![Calculator](assets/latest%20webos%20images/calc.png) | ![Notes](assets/latest%20webos%20images/notes.png) | ![Paint](assets/latest%20webos%20images/paint.png) |

| Snake | Focus Timer | Wormhole |
|---|---|---|
| ![Snake](assets/latest%20webos%20images/snake.png) | ![Timer](assets/latest%20webos%20images/timer.png) | ![Wormhole](assets/latest%20webos%20images/wormhole.png) |

---

## What Is Nebula OS?

Nebula OS is **not** a real operating system. It is a web desktop simulation — a creative, browser-based project designed to look and feel like a desktop OS. Everything runs inside a single browser tab. It is built in a neo-brutalist visual style and named "Nebula" in reference to its space-inspired wormhole feature.

---

## Features

### Window System
- All apps open as draggable windows
- Each window supports **minimize**, **maximize/restore**, and **close**
- Windows have proper focus and z-index management (clicking a window brings it to front)
- A **bottom dock** provides quick-launch access to all apps
- **Desktop icons** launch apps on double-click
- A **right-click context menu** on the desktop offers quick actions: refresh, arrange icons, replace wallpaper, launch terminal/calculator, and an About panel

### Terminal
The terminal accepts typed commands and responds with formatted output. Available commands:

| Command | Description |
|---|---|
| `help` | List all available commands |
| `about` | Show OS info and version |
| `whoami` | Display current user |
| `date` | Show current date and time |
| `uptime` | Show session uptime |
| `ls` | List simulated filesystem entries |
| `clear` | Clear the terminal output |
| `echo [text]` | Print text back |
| `hack` | Trigger a simulated hack animation |
| `reboot` | Trigger the wormhole/reboot sequence |
| `calc` | Open the Calculator app |
| `music` | Open the Music Player |
| `notes` | Open the Notes app |
| `paint` | Open the Paint app |
| `snake` | Open the Snake game |
| `pomodoro` | Open the Focus Timer |
| `matrix` | Toggle a Matrix rain effect in the terminal |
| `neofetch` | Display a neofetch-style OS info panel |

### Music Player
- Load local audio files from your device (`.mp3`, `.flac`, `.wav`, etc.)
- Files are handled entirely in-browser using the File API — nothing is uploaded to any server
- Vinyl-style rotating record animation while playing
- Real-time CSS audio visualizer driven by the Web Audio API
- Playlist with track selection; supports multiple files loaded at once
- Drag-and-drop audio loading onto the vinyl player area
- Previous / Play-Pause / Next controls plus a volume slider
- Playlist can be cleared at any time

### Calculator
- Standard desktop calculator (AC, ±, %, ÷, ×, −, +, =)
- Decimal support
- Calculation history display above the current value

### Notes
- Rich text editor with **Bold**, *Italic*, and _Underline_ formatting
- Content is **saved automatically to `localStorage`** and restored on next visit

### Paint
- Canvas-based drawing app
- Tools: Brush, Line, Rectangle, Circle
- Colour palette with 7 preset colours
- Adjustable brush size (slider)
- Undo (up to 20 steps; also Ctrl+Z)
- Clear canvas
- Save the current canvas as a PNG file downloaded to your device

### Snake Game
- Classic snake game on an HTML5 canvas
- Arrow key controls
- Score tracking with a persistent **high score** saved in `localStorage`
- Start / Stop controls

### Focus Timer (Pomodoro)
- Four modes: **Focus** (25 min), **Short Break** (5 min), **Long Break** (15 min), and **Custom**
- Custom mode lets you set hours, minutes, and seconds independently for either a focus or break session
- Progress bar shows time elapsed within the current session
- Session counter tracks completed focus sessions; count persists via `localStorage`
- Browser notification on session completion (requires notification permission)

### Custom Wallpaper
- Right-click the desktop → **Replace Wallpaper** to pick a local image file
- The image is stored in `localStorage` as a data URL and automatically restored on every visit
- The image file never leaves your browser

### Desktop Widgets
- **Telemetry widget** — shows live clock, session uptime, and system status
- **Quick Notes widget** — a sticky-note textarea on the desktop; auto-saves every keystroke to `localStorage`, with a live character counter and a clear button

### Boot Sequence
- An animated NEBULA boot screen with a loading bar plays on every page load before the desktop appears

### Wormhole / Singularity Effect
- Accessible from the **🕳** button in the dock, or by typing `reboot` in the terminal
- Triggers a full-screen animated wormhole/black-hole visual effect
- A confirmation dialog warns you before any data is deleted
- After the animation, the OS performs a simulated reboot: all windows close, `localStorage` is cleared, and the boot sequence replays

---

## Technology Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic elements, `<canvas>`) |
| Styling | CSS3 (custom properties, flexbox, grid, keyframe animations) |
| Logic | Vanilla JavaScript — no frameworks or libraries |
| Audio | Web Audio API (music visualizer) |
| Graphics | Canvas API (Paint, Snake, wormhole canvas layer) |
| Persistence | `localStorage` (notes, wallpaper, high score, pomodoro sessions) |
| File handling | File API / FileReader (music and wallpaper — local browser only) |
| Fonts | Google Fonts (Archivo Black, Inter, JetBrains Mono, Syne) |
| Deployment | GitHub Pages |

---

## Running Locally

Nebula OS has **no dependencies, no build step, and no server required.**

```bash
git clone https://github.com/NikhilKshub/Nebula-OS.git
cd Nebula-OS
```

Then open `index.html` directly in any modern browser. That's it.

> **Tip:** For the best experience use a Chromium-based browser (Chrome, Edge, Brave) or Firefox.

---

## Project Structure

```
Nebula-OS/
├── index.html                      # All app windows and UI structure
├── style.css                       # Design system, windows, apps, animations
├── script.js                       # Window management, apps, terminal, wormhole logic
├── .gitignore
├── LICENSE
├── .github/
│   └── workflows/
│       └── pages.yml               # GitHub Pages deployment workflow
└── assets/
    └── latest webos images/        # Screenshots used in this README
        ├── main1.png
        ├── terminal.png
        ├── music.png
        ├── calc.png
        ├── notes.png
        ├── paint.png
        ├── snake.png
        ├── timer.png
        ├── wormhole.png
        └── contextmenu.png
```

---

## Privacy & Local File Handling

Nebula OS does **not** collect, transmit, or store any user data externally.

- **Music files** you load are processed in-memory by the browser's File API and are never uploaded anywhere.
- **Wallpaper images** you set are stored as data URLs in your browser's `localStorage` on your own device only.
- **Notes** and all other persistent data are stored in your browser's `localStorage` on your own device only.
- There are no analytics, tracking scripts, or external API calls (except Google Fonts for typography).

---

## Browser Requirements

| Browser | Minimum version |
|---|---|
| Chrome / Edge / Brave | 90+ |
| Firefox | 88+ |
| Safari | 14+ |

Features used: CSS custom properties, CSS `backdrop-filter`, Web Audio API, Canvas API, File API, `localStorage`, CSS keyframe animations, `contenteditable`.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

*Built with HTML, CSS, and vanilla JavaScript. No frameworks. No build tools. Just the web.*
