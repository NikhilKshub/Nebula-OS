# Nebula OS

**A browser-based desktop experience inspired by operating-system interfaces — built entirely with HTML, CSS, and vanilla JavaScript.**

Nebula OS is a fully self-contained web desktop that runs in any modern browser. No frameworks, no build tools, no installation required. It features a suite of interactive apps, a working terminal, persistent state via `localStorage`, and a wormhole singularity effect that pulls the entire desktop into a black hole.

**[Live Demo](https://nikhilkshub.github.io/Nebula-OS/)**

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


## What is Nebula OS?

Nebula OS is **not a real operating system**. It is a browser-based desktop.
Everything runs inside the browser, so there is nothing to install and no backend running behind it. I built the interface to behave more like a desktop than a normal website, with draggable windows, a dock, a terminal, desktop icons and small system-style interactions.
The project started as a simple space-themed idea. As I kept working on it, I felt that it looked more like a collection of web pages than an operating system. I ended up rebuilding a large part of it and focused much more on the desktop experience itself.
The final version uses a neo-brutalist visual style.

## Features

### Desktop
The desktop is the main part of the project.
- Draggable application windows
- Minimize, maximize/restore and close controls
- Window focus and z-index handling
- Bottom application dock
- Custom wallpaper support
- Animated boot sequence
- and almost similar to how a basic desktop works

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
- Load local music files directly from the browser
- Drag and drop audio files
- Play, pause, previous and next controls and volume control
- Vinyl-style player animation

### Calculator
- Standard desktop calculator
- Basic arithmetic
- Decimal numbers
- Percentage

### Notes
- Rich text editor with **Bold**, *Italic*, and _Underline_ formatting

### Paint
- Canvas-based drawing app
- Tools like Brush, Line, Rectangle and Circle
- Multiple color options
- Adjustable brush size 
- Clear canvas feature to complete remove everything on canvas
- You can also save the current canvas as a PNG file downloaded to your device

### Snake Game
- Classic snake game
- Arrow key controls
- Score tracking with a Persistent high score
  
### Focus Timer (Pomodoro)
- Four modes: **Focus** (25 min), **Short Break** (5 min), **Long Break** (15 min), and **Custom**
- Custom mode lets you set hours, minutes, and seconds independently for either a focus or break session
- Progress bar
- Session counter tracks completed focus sessions

### Custom Wallpaper
- Right-click the desktop → **Replace Wallpaper** to pick your own choice of wallpaper
- The image file never leaves your browser

### Desktop Widgets
- **Telemetry widget** — shows live clock, session uptime, and system status
- **Quick Notes widget** — a sticky-note on the desktop that lets you write anything
  
### Wormhole / Singularity
This is the most unusual part of the project.
The singularity is a full-screen effect where the desktop gets pulled towards a black hole.
It can be triggered from the dock or through the terminal.
I wanted this to feel less like a normal page transition and more like the desktop itself was breaking apart.

## How I built it
There is no React, no backend and no build system.
The three main files are:

- `index.html` for the desktop and application structure
- `style.css` for the visual design and animations
- `script.js` for the application logic and interactions

Most of the work went into making these three files work together.
The project uses browser APIs where they actually make sense. For example, Paint and Snake use `<canvas>`, the music visualizer uses the Web Audio API, and local files are handled with the browser's File API. 

## Technology Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 |
| Logic | Vanilla JavaScript |
| Audio | Web Audio API |
| Graphics | Canvas API |
| Persistence | `localStorage` |
| File handling | File API / FileReader |
| Fonts | Google Fonts
| Deployment | GitHub Pages |

## Running Locally
Nebula OS does not have any dependencies or a build step.
Clone the repository, open `index.html` in a web browser, and launch Nebula OS.

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
        └── wormhole.png
```

## Privacy & Local Data
Nebula OS does not have a backend and does not send user data to a server.
- Music files are loaded locally through the browser
- Notes, wallpaper data and game data are stored locally in the browser
- No analytics or tracking are included
- The finished application does not use external AI or other API services

## AI Usage
I used AI during the development of Nebula OS, but the application itself does not use an AI API.
I used ChatGPT and Gemini at different points as development assistants. They were mainly useful for:
Brainstorming ideas and features
Helping me implement features like the Singularity feature , vinyl animation in music app
Explaining JavaScript and browser APIs when I got stuck
Finding bugs and suggesting fixes
Reviewing parts of the code
Helping with refactoring and cleanup

AI also suggested code in some parts of the project. Which i was able to use but in many of them it was either not working perfectly with the other codes in the files , sometimes showing console errors , getting stuck on animation and other things so i had to solve it somehow also taking the help of the AI so no more errors get created 

The design direction, feature decisions, how the applications should behave, the visual style, and the final integration and testing were decisions I made while building the project. Though there were designs/animations , features that were suggested by the AI but I was the one deciding what to implement or not 

AI was a great help for me helping me figure out animations , solving bugs that were causing problems , helping brainstorm features/app ideas and other thing 
I am including this section because I think it is more useful to be clear about where AI helped rather than pretending I never used it.

## License
[MIT](LICENSE) — free to use, modify, and distribute.

