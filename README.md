# Nebula OS

A browser-based desktop(Web-OS) I built with plain HTML, CSS and JavaScript.

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


## What it is

Nebula OS is my attempt at making a small desktop environment that runs entirely in the browser.

It has draggable windows, a dock, desktop icons, a terminal, music player, calculator, notes, Paint, Snake, and a focus timer. Everything runs locally in the browser.
The project started as a simple space-themed idea. As I kept working on it, I felt that it did not really feel like a WebOS, and I kept running into problems trying to build the interface around the space theme. So, I ended up rebuilding a large part of it and focused much more on the desktop experience itself.
The final version uses a neo-brutalist visual style.

## Features
- **Desktop Environment** — A browser-based desktop with draggable, resizable, minimize/maximize windows, desktop icons, widgets, and a dock.
- **Terminal** — A small command-line interface with built-in commands, history, tab completion, ASCII output, and a few hidden surprises.
- **Music Player** — Load local audio files into a playlist, switch between tracks, control playback and volume, and watch the visualizer react to the music.
- **Notes & Quick Notes** — Write, format, and save notes directly in the browser, with a separate quick-notes widget always available on the desktop.
- **Paint** — Draw with different tools, colors, and brush sizes, undo changes, clear the canvas, and save your work as a PNG.
- **Snake & Focus Timer** — Play Snake with a saved high score or use the built-in focus timer with focus, short break, long break, and custom modes.
- **Customization & Persistence** — Change the wallpaper and keep personal data such as notes, settings, window positions, and game scores between sessions.
- **Wormhole** — Trigger Nebula's hidden wormhole effect and watch the desktop get pulled apart before the system resets.

## How I built it
There is no React, no backend and no build system.
The three main files are:

- `index.html` for the desktop and application structure
- `style.css` for the visual design and animations
- `script.js` for the application logic and interactions

Most of the work went into making these three files work together.

## How it works
There is no React, no backend and no build system. Nebula OS is built with plain HTML, CSS, and JavaScript.
The three main files are:
- `index.html` for the desktop and application structure
- `style-rework.css` for the visual design and animations
- `script-rework.js` for the application logic and interactions

The desktop is made from normal HTML elements, and JavaScript handles things like opening windows, dragging them around, focusing them, and controlling the apps inside them.
Each app has its own logic. The terminal handles commands and history, the music player uses local audio files and the browser's Web Audio API, while Paint and Snake use the Canvas API.
I use localStorage for things that should stay after a refresh, such as notes, the wallpaper, the Snake high score, and window positions.
Everything runs in the browser, so there is nothing to install or configure on a server. Open the site and the desktop is ready to use.

## Running it locally
Clone the repository and open `index.html` in a browser.
That's it.

## Why I made it

I wanted to build something that felt more like a small world than a normal website.
Most of the fun came from trying to make the individual parts work together: windows need to behave like windows, apps need to remember things, and the whole interface should still feel like one system.
I ended up rebuilding a lot of the project during development because some early versions worked technically but did not feel like an operating system yet.

## AI usage

I used AI tools during development, mainly ChatGPT, Claude and Gemini.
I used them for brainstorming, debugging, investigating issues, discussing architecture and edge cases, reviewing/refactoring code, and getting help when I was stuck.
The wormhole effect was one area where I relied more heavily on AI assistance. I used AI to help work through the animation logic, particle effects, DOM transformations, timing, and cleanup, then integrated and tested the result as part of the project.
I still made the design, feature and implementation decisions for the project, tested the changes, and decided what actually stayed in the final version.
AI was part of my development process, but Nebula OS is not an AI-powered application and does not depend on an AI API.

## Built with
HTML5 · CSS3 · JavaScript · Canvas API · Web Audio API · File API · localStorage

## Credits
Built by Nikhil.

## License
[MIT](LICENSE) — free to use, modify, and distribute.
