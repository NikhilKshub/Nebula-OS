# Nebula OS

**A browser-based desktop experience inspired by operating-system interfaces**

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
| `about` | Show information about Nebula OS |
| `clear` | Clear the terminal screen |
| `cowsay` | Display a cow saying "Moo." |
| `creator` | Show information about the creator |
| `credits` | View project credits |
| `date` | Show the current date |
| `echo [text]` | Echo text back |
| `fortune` | Print a random quote |
| `hack` | Trigger a simulated hacking animation |
| `matrix` | Trigger Matrix rain |
| `motd` | Display the message of the day |
| `neofetch` | Display system information |
| `reboot` | Restart the system |
| `singularity` | Trigger the wormhole effect |
| `stardust` | Print stardust |
| `time` | Show the current time |
| `uptime` | Show session uptime |
| `version` | Show the OS version |
| `whoami` | Show user information |

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
- Clear canvas feature to completely remove everything from the canvas
- Save the current canvas as a PNG file

### Snake Game
- Classic snake game
- Arrow key controls
- Score tracking with a persistent high score
  
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

- Brainstorming ideas and features
- Helping me implement features like the Singularity effect and vinyl animation in the music app
- Explaining JavaScript and browser APIs when I got stuck
- Finding bugs and suggesting fixes
- Reviewing parts of the code
- Helping with refactoring and cleanup

AI also suggested code for some parts of the project. I was able to use some of those suggestions, but sometimes they did not always work correctly with the rest of my code. Some caused console errors, broke animations, or needed changes to fit the existing project. I had to test the suggestions, debug the problems, and adapt the code to make everything work together.

The design direction, feature decisions, application behavior, visual style, and final integration and testing were decisions I made while building the project. AI suggested some ideas and implementations, but I decided what to keep, change, or remove.
AI was a great help in figuring out animations, solving bugs, brainstorming features and app ideas, and understanding parts of the code.
I am including this section because I think it is more useful to be clear about where AI helped rather than pretending I never used it.
The finished application does not use OpenAI, Gemini, or any other AI API. It runs as a normal client-side website.

## License
[MIT](LICENSE) — free to use, modify, and distribute.

