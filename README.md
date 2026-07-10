# **Nebula OS**

\>Built for the **Hack Club Stardance WebOS Challenge**

Nebula OS is a browser-based desktop experience inspired by operating systems — built as a playful, colorful desktop full of working apps, hidden details, and one feature that pulls the whole thing into a blackhole. 

## **Features**

* **Window Management** — draggable windows with minimize, maximize, restore, focus tracking, and persistent position  
* **Terminal** — functional command-line interface, try `help` to see available commands  
* **Music Player** — vinyl-style player with real-time audio visualization (Web Audio API), load your own local audio files  
* **Calculator** — desktop calculator app  
* **Notes** — persistent text editor with local saving  
* **Paint** — canvas-based drawing app with tools/colors, save your creations  
* **Snake Game** — classic snake, built directly into the OS  
* **Custom Wallpapers** — replace the desktop background with your own image, persists across sessions  
* **Quick Notes Widget** — sticky-note style widget on the desktop, live character counter, autosaves every keystroke  
* **Pomodoro Timer** — default 25-minute focus/break cycle, plus a custom timer mode for both focus and break sessions  
* **Boot Sequence** — animated startup sequence  
* **Wormhole / Singularity** — hidden in the dock, pulls the entire desktop into a blackhole

## **Why I built this**

I got to know about Stardance from Hack Club through a friend. He suggested I create projects, since I always liked creating and experimenting with things — hardware, apps, websites — but never actually finished most of them because of various issues. When my friend told me I could create things and earn rewards, it got me excited, so I joined the platform. I looked around for a while before understanding how it works, and found the Missions section. At that time, I really liked the idea of a webOS project — it sounded interesting. Around the same time, I saw a reel of someone creating a space-themed website that also had a blackhole feature. Because of these two things, I got into building a webOS, and my first real goal was to implement a blackhole feature — I just thought it would look so cool. That's how I got into this project.

## **The Redesign Journey**

At the start of the project, I wanted to create something inspired by space — a desktop background with orbiting planets and stars. I also built a calculator inspired by space and orbital rotation (this concept idea was mine and I actually did so much brainstorming on how to use it). But working on the project started to feel boring, because the simple, minimal space theme wasn't landing the way I wanted, and the calculator design also had a lot of usability flaws. So I completely redesigned it into something different, then redesigned it again into a neo-brutalist theme — though I was still inspired by that original space-themed blackhole website. That's why I named it "Nebula," and kept the wormhole/blackhole as a core feature.

## **The Hardest Part**

Honestly, at the start, the hardest thing was building the space-inspired calculator. I made the numbers and operators rotate in orbit around a center screen, but the rotation actually made me dizzy, so I abandoned that direction and moved on to Nebula OS. Within Nebula OS, the hardest part was getting the wormhole feature right — giving it a proper visual feel of an actual blackhole. I still haven't fully captured that realistic feel, but I think I've gotten somewhat closer to it.

## **What My WebOS Does**

My webOS has the features, apps, and widgets you'd expect from most webOS projects, but the standout feature — one very few or no other webOS projects have — is a blackhole that sucks the entire system into it. It's a genuinely cool moment, and I think it makes the OS feel more engaging and lively overall.

You can open several different types of apps, like Paint, Snake Game, Calculator, Pomodoro Timer, Terminal, and Music Player. You can change the desktop wallpaper to your liking, and there's also a Quick Notes widget that lets you write things down and auto-saves as you type. And of course, there's the wormhole feature — best experienced yourself.

## **What I'd Still Improve**

That said, I'm not fully happy with everything yet. The wormhole still isn't where I want it visually. The font system — especially for app labels — doesn't feel very refined, and the OS overall doesn't quite have a "premium" feel yet. Right now it's closer to a rainbow of colors, since every app has its own distinct color/theme, which is fun but not fully cohesive.

## **Where to Start Exploring**

I want people to test things out themselves. The first thing I'd suggest trying is the Terminal, since it's genuinely engaging. The second is the Snake game — it's simple, but still fun. Not exactly in the heavy AAA-game world, haha.

## **Tech Stack**

* **HTML5** — semantic structure, canvas  
* **CSS3** — custom properties/variables, flexbox/grid, no external frameworks  
* **Vanilla JavaScript** — DOM manipulation, event handling, window management, no external libraries/frameworks  
* **Web Audio API** — music player visualizer  
* **Web Canvas API** — paint, snake, wormhole effects  
* **LocalStorage** — notes, wallpaper, pomodoro sessions, window state persistence

## **Installation**

Nebula OS is completely self-contained. There are no build tools or dependencies required.

1. Clone or download the repository.  
2. Open `index.html` in any modern web browser.  
3. No installation, package manager, or build step is required.

That's it\!

## **AI Usage**

**Early Ideas:** AI was used heavily during the initial brainstorming phase to throw around wild concepts. For example, I thought of a calculator inspired by a space theme, with rotating orbits, and AI helped me develop the UI layout for that orbit-rotation calculator concept. I actually tried implementing it, but it made me physically dizzy to look at, and picking numbers on a rotating circle was almost frustrating, so I scrapped it immediately. Using AI to rapidly prototype and test these ideas helped me quickly figure out what didn't work.

**Antigravity / Gemini Sessions:** I used Google's Antigravity agent and Gemini as an active pair-programming partner to build out substantial, complex systems within the OS, test many different ideas, and brainstorm. I directed the architecture and made the final calls. Specifically, the AI wrote the logic for a few features, like the wormhole and quick notes widget, and explained it to me. It also helped me remove a few features and clean up the code (including fixing a complex infinite-hang bug during the wormhole singularity sequence, and several other serious bugs).

**Debugging Help:** AI was my primary debugging tool for frustrating structural issues. At one point, I attempted to split my massive CSS into multiple smaller files, which completely broke the styling across the entire OS. I also ran into a persistent folder-name and path mismatch bug that broke my assets. In both cases, I fed the errors and file structures to the AI to help diagnose the root cause. Once the AI pointed out exactly where the logic was failing, I went in and personally executed the fixes and restructured the paths to get the OS stable again. It helped me fix a lot of bugs along the way, and made implementing new features smoother.

**What Was Actually Mine:** While the AI did a lot of work alongside me like testing ideas, giving suggestions, and helping map out how to implement things , the product vision was entirely mine. I made all the core product decisions: choosing which features stayed and which were cut, enforcing the neo-brutalist UI redesign, and choosing the "Nebula" naming convention. I decided exactly which apps to include, how the layout should feel, and dictated the exact visual and pacing requirements for the wormhole singularity effect. I wrote codes for the implementation of features and apps , tried things and yea it was fun kind of doing it also frustrating how the bugs are coming one by one , one after another.

