// ==================== MODULE STATE ====================
// These are kept module-level (not on window) to avoid polluting the global scope.
const _sessionApps = new Set();
let _isTermAnimRunning = false;

// ==================== SANITIZE HTML (P2 XSS Fix) ====================
// Allows safe formatting tags (bold, italic, paragraphs, lists, line breaks).
// Strips ALL event handlers, script tags, and javascript: href/src schemes.
function sanitizeHtml(dirty) {
  const ALLOWED_TAGS = new Set([
    "p",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "br",
    "ul",
    "ol",
    "li",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "blockquote",
  ]);

  // DOMParser creates an inert document — no scripts execute, no onerror fires,
  // no onload triggers. This is the only safe way to parse untrusted HTML.
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, "text/html");
  const root = doc.body;

  function clean(node) {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) {
          const text = doc.createTextNode(child.textContent);
          node.replaceChild(text, child);
          continue;
        }
      
        while (child.attributes.length > 0) {
          child.removeAttribute(child.attributes[0].name);
        }
        clean(child);
      } else {
        node.removeChild(child);
      }
    }
  }
  clean(root);
  return root.innerHTML;
}

// ==================== SAFE LOCALSTORAGE HELPERS (P5) ====================
// Prevents localStorage corruption from crashing startup.
function safeInt(key, fallback = 0) {
  try {
    const v = parseInt(localStorage.getItem(key) || String(fallback), 10);
    return isNaN(v) ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function safeFloat(key, fallback = 0) {
  try {
    const v = parseFloat(localStorage.getItem(key));
    return isNaN(v) ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function safeJsonParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

// ==================== AUDIO CONTEXT ====================
let audioCtx = null;
let audioAnalyser = null;
let audioSource = null;
let audioGain = null;
let audioBuffer = null;
let audioElement = null;
let activeAudioUrl = null;
let isAudioPlaying = false;
let musicAnimationId = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ==================== BOOT SEQUENCE ====================
function bootSequence() {
  const boot = document.getElementById("boot-screen");
  const desktop = document.getElementById("desktop");
  const fill = document.querySelector(".boot-fill");
  const status = document.querySelector(".boot-status");

  if (fill) {
    setTimeout(() => (fill.style.width = "100%"), 50);
  }
  const logs = [
    "Establishing reality anchors...",
    "Calibrating wormhole trajectory...",
    "Loading Explorer profile...",
    "Reality Integrity: 100%",
  ];
  let logIdx = 0;

  if (status) {
    const logInt = setInterval(() => {
      if (logIdx < logs.length) {
        status.textContent = logs[logIdx];
        logIdx++;
      } else {
        clearInterval(logInt);
      }
    }, 800);
  }

  setTimeout(() => {
    boot.style.transition =
      "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)";
    boot.style.opacity = "0";
    boot.style.transform = "scale(1.05)";

    setTimeout(() => {
      boot.style.display = "none";
      desktop.style.display = "block";
      desktop.style.animation = "fadeIn 0.8s ease";

      setTimeout(() => {
        spawnWelcomeWindow();
      }, 600);
    }, 1200);
  }, 3800);
}

// ==================== AUTO-SPAWN WINDOWS ====================
function spawnWelcomeWindow() {
  const win = document.getElementById("window-notes");
  if (!win) return;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const w = parseInt(win.dataset.defaultW || 360);
  const h = parseInt(win.dataset.defaultH || 420);

  win.style.left = cx - w / 2 - 60 + "px";
  win.style.top = cy - h / 2 - 40 + "px";
  win.style.width = w + "px";
  win.style.height = h + "px";
  win.style.display = "flex";
  win.classList.remove("maximized", "window-closing", "window-minimizing");
  win.classList.add("window-opening");
  setTimeout(() => win.classList.remove("window-opening"), 400);

  const editor = win.querySelector(".notes-editor");
  if (editor) {
    editor.innerHTML = `
            <p><b>🎉 Welcome to Nebula OS! 🎉</b></p>
            <p>You've successfully hacked into the mainframe... just kidding, this is a webOS. But you look very cool doing it. 😎</p>
            <p><b>How to survive here:</b></p>
            <p>• <b>Click things:</b> Specifically, those big chunky icons. They do stuff.</p>
            <p>• <b>Terminal:</b> Type random words in there. Who knows? You might summon a black hole.</p>
            <p>• <b>Wormhole:</b> Speaking of black holes, click the 🕳 Wormhole if you want to aggressively delete this reality.</p>
            <p>• <b>Bottom Dock:</b> Use it when you get lost in the sauce.</p>
            <p></p>
            <p><i>Status: 100% stable (unless you divide by zero). 🚀</i></p>
        `;
  }

  const title = win.querySelector(".window-title span:last-child");
  if (title) title.textContent = "Welcome.txt";

  bringToFront(win);
}

function spawnTerminalWindow() {
  const win = document.getElementById("window-terminal");
  if (!win) return;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const w = parseInt(win.dataset.defaultW || 520);
  const h = parseInt(win.dataset.defaultH || 380);

  win.style.left = cx - w / 2 + 80 + "px";
  win.style.top = cy - h / 2 + 60 + "px";
  win.style.width = w + "px";
  win.style.height = h + "px";
  win.style.display = "flex";
  win.classList.remove("maximized");

  resetTerminal();
  bringToFront(win);

  setTimeout(() => {
    const input = document.getElementById("term-input");
    if (input) input.focus();
  }, 300);
}

// ==================== CLOCK WITH FLASHING COLON ====================
let colonVisible = true;

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const dateStr = now
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();

  colonVisible = !colonVisible;
  const separator = colonVisible ? ":" : " ";

  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");

  if (clockEl) clockEl.textContent = `${h}${separator}${m}`;
  if (dateEl) dateEl.textContent = dateStr;
}

setInterval(updateClock, 1000);
updateClock();

// ==================== NEBULA WIDGETS ====================
const ALL_DISCOVERIES = {
  first_contact: {
    title: "FIRST CONTACT",
    desc: "Terminal access established.",
  },
  archivist: { title: "ARCHIVIST", desc: "Reality Archive updated." },
  cosmic_artist: { title: "COSMIC ARTIST", desc: "Visual data archived." },
  audio_engineer: {
    title: "AUDIO ENGINEER",
    desc: "Acoustic waveform initiated.",
  },
  reality_bender: {
    title: "REALITY BENDER",
    desc: "Universe successfully collapsed.",
  },
  anomaly_hunter: { title: "ANOMALY HUNTER", desc: "Hidden command executed." },
  paradox_found: {
    title: "PARADOX DETECTED",
    desc: "Mathematical boundaries exceeded.",
  },
  app_master: {
    title: "SYSTEM MASTER",
    desc: "All local applications accessed.",
  },
  master_explorer: {
    title: "MASTER EXPLORER",
    desc: "Nebula systems fully explored.",
  },
};

let activeMissions = [];

const NebulaState = {
  startTime: Date.now(),
  integrity: 100.0,
  anomalies: 0,
  wormholeStatus: "DORMANT",

  getSingularities: () => safeInt("nebula_singularity_count", 0),
  getTermCmds: () => safeInt("nebula_terminal_cmds", 0),
  getPaintSaves: () => safeInt("nebula_paint_saves", 0),
  getNotesCreated: () => safeInt("nebula_notes_created", 0),
  getAppsOpened: () => safeInt("nebula_apps_opened", 0),
  getMusicSessions: () => safeInt("nebula_music_sessions", 0),
  getLastEvent: () => {
    try {
      return (
        localStorage.getItem("nebula_last_event") || "Boot Sequence Complete"
      );
    } catch (e) {
      return "Boot Sequence Complete";
    }
  },

  addAnomaly: () => {
    NebulaState.anomalies++;
    NebulaState.integrity -= 2.5;
    if (NebulaState.integrity < 0) NebulaState.integrity = 0;
    updateRealityMonitor();
    if (typeof showNotification === "function")
      showNotification("Anomaly Detected. Threat level elevated.", "warning");
  },
  setLastEvent: (e) => {
    safeSetItem("nebula_last_event", e);
    updateRealityMonitor();
  },

  getUnlockedDiscoveries: () => {
    try {
      return JSON.parse(localStorage.getItem("nebula_discoveries") || "[]");
    } catch (e) {
      return [];
    }
  },

  unlockDiscovery: (id) => {
    const d = NebulaState.getUnlockedDiscoveries();
    if (!d.includes(id) && ALL_DISCOVERIES[id]) {
      d.push(id);
      safeSetItem("nebula_discoveries", JSON.stringify(d));

      if (typeof showNotification === "function") {
        showNotification(
          `DISCOVERY UNLOCKED<br><b>${ALL_DISCOVERIES[id].title}</b><br>${ALL_DISCOVERIES[id].desc}`,
          "success",
        );
      }

      if (activeMissions.includes(id)) {
        setTimeout(() => {
          if (typeof showNotification === "function") {
            showNotification(
              `MISSION COMPLETE<br><b>${ALL_DISCOVERIES[id].title}</b><br>Explorer progress increased.`,
              "success",
            );
          }
        }, 1000);
        activeMissions = activeMissions.filter((m) => m !== id);
        NebulaState.setLastEvent("Mission Accomplished");
      }

      if (id !== "master_explorer") {
        const totalKeys = Object.keys(ALL_DISCOVERIES).length - 1;
        if (d.length >= totalKeys && !d.includes("master_explorer")) {
          setTimeout(
            () => NebulaState.unlockDiscovery("master_explorer"),
            3000,
          );
        }
      }
    }
  },
};

function getExplorerRank() {
  let score =
    NebulaState.getTermCmds() +
    NebulaState.getSingularities() * 10 +
    NebulaState.getPaintSaves() * 2 +
    NebulaState.getNotesCreated() * 2 +
    NebulaState.getAppsOpened() +
    NebulaState.getMusicSessions() * 2;

  if (score >= 500) return "Reality Engineer";
  if (score >= 250) return "Architect";
  if (score >= 100) return "Explorer";
  if (score >= 50) return "Navigator";
  if (score >= 10) return "Cadet";
  return "Observer";
}

const bcHumor = [
  "Reality remains stable despite your choices.",
  "Explorer activity detected. Productivity not detected.",
  "Please stop creating gravitational incidents.",
  "Don't panic.",
  "Are you sure you want to click that?",
];

const bcMotivation = [
  "Small progress still bends spacetime.",
  "Build something today.",
  "The next breakthrough begins with curiosity.",
  "Exploration is a continuous state.",
];

const bcLore = [
  "Sector Alpha-7 remains under observation.",
  "Long-range scanners report no anomalies.",
  "Background radiation nominal.",
  "Wormhole fluctuations detected.",
];

const bcRare = [
  "UNKNOWN TRANSMISSION: Signal origin unavailable.",
  "ANOMALY DETECTED: Reality fluctuation observed.",
  "INTERCEPTED MESSAGE: Explorer activity acknowledged.",
  "SYSTEM OBSERVATION: Curiosity levels increasing.",
];

const bcSystem = [
  "Explorer session active.",
  "Nebula services online.",
  "Monitoring local reality.",
  "Awaiting directives...",
];

function updateTelemetry() {
  const timeEl = document.getElementById("tel-time");
  if (timeEl)
    timeEl.textContent = new Date().toLocaleTimeString("en-US", {
      hour12: false,
    });

  const uptimeSecs = Math.floor((Date.now() - NebulaState.startTime) / 1000);
  const hrs = Math.floor(uptimeSecs / 3600);
  const mins = Math.floor((uptimeSecs % 3600) / 60);
  const secs = uptimeSecs % 60;

  let upStr = "";
  if (hrs > 0) upStr += `${hrs}h `;
  if (mins > 0 || hrs > 0) upStr += `${mins}m `;
  upStr += `${secs}s`;

  const uptimeEl = document.getElementById("tel-uptime");
  if (uptimeEl) uptimeEl.textContent = upStr;

  NebulaState.integrity += Math.random() * 0.02 - 0.01;
  if (NebulaState.integrity > 100) NebulaState.integrity = 100;

  const intEl = document.getElementById("tel-integrity");
  if (intEl) {
    intEl.textContent = NebulaState.integrity.toFixed(2) + "%";
    intEl.style.color =
      NebulaState.integrity < 50
        ? "var(--red)"
        : NebulaState.integrity < 80
          ? "var(--yellow)"
          : "var(--green)";
  }
}

let currentExplorerRank = null;

function updateRealityMonitor() {
  const threatEl = document.getElementById("mon-threat");
  const realityWidget = document.querySelector(".widget-reality");
  let threat = "LOW";
  let tColor = "var(--green)";

  let r = getExplorerRank();
  if (currentExplorerRank !== null && r !== currentExplorerRank) {
    if (typeof showNotification === "function")
      showNotification("Explorer Rank Upgraded: " + r, "success");
  }
  currentExplorerRank = r;

  const activeApps = Array.from(document.querySelectorAll(".window")).filter(
    (w) => w.style.display === "flex",
  ).length;

  if (NebulaState.wormholeStatus === "ACTIVE") {
    threat = "CRITICAL";
    tColor = "var(--red)";
    if (realityWidget) realityWidget.classList.add("threat-pulse");
  } else if (
    NebulaState.anomalies > 3 ||
    activeApps >= 3 ||
    NebulaState.integrity < 70
  ) {
    threat = "ELEVATED";
    tColor = "var(--yellow)";
    if (realityWidget) realityWidget.classList.add("threat-pulse");
  } else if (activeApps >= 1) {
    threat = "MODERATE";
    tColor = "var(--mint)";
    if (realityWidget) realityWidget.classList.remove("threat-pulse");
  } else {
    if (realityWidget) realityWidget.classList.remove("threat-pulse");
  }

  if (threatEl) {
    threatEl.textContent = threat;
    threatEl.style.color = tColor;
  }

  const wormEl = document.getElementById("mon-wormhole");
  if (wormEl) wormEl.textContent = NebulaState.wormholeStatus;

  const anomEl = document.getElementById("mon-anomalies");
  if (anomEl) anomEl.textContent = NebulaState.anomalies;

  const lastEl = document.getElementById("mon-lastevent");
  if (lastEl) lastEl.textContent = NebulaState.getLastEvent();
}

function triggerInteractiveBroadcast() {
  const textEl = document.getElementById("bc-text");
  const actions = document.getElementById("bc-actions");
  const btn1 = document.getElementById("bc-btn-1");
  const btn2 = document.getElementById("bc-btn-2");
  if (!textEl || !actions) return;

  const rand = Math.random();
  if (rand < 0.5) {
    textEl.textContent = "TRANSMISSION RECEIVED: Unknown source detected.";
    btn1.textContent = "VIEW";
    btn2.textContent = "IGNORE";
    btn1.onclick = () =>
      setBroadcast("Transmission decoded: You are not alone.");
    btn2.onclick = () => setBroadcast("Transmission ignored.");
  } else {
    textEl.textContent = "ANOMALY DETECTED: Investigate Reality Monitor.";
    btn1.textContent = "INVESTIGATE";
    btn2.textContent = "IGNORE";
    btn1.onclick = () => setBroadcast("Investigating anomaly source...");
    btn2.onclick = () => setBroadcast("Anomaly ignored.");
  }

  actions.style.display = "flex";
}

function setBroadcast(text) {
  const textEl = document.getElementById("bc-text");
  const actions = document.getElementById("bc-actions");
  if (textEl) textEl.textContent = text;
  if (actions) actions.style.display = "none";
}

function rotateBroadcast() {
  const rand = Math.random();

  if (rand < 0.02) {
    setBroadcast(bcRare[Math.floor(Math.random() * bcRare.length)]);
    return;
  }

  if (rand < 0.1) {
    triggerInteractiveBroadcast();
    return;
  }

  if (rand < 0.4) {
    const d = NebulaState.getUnlockedDiscoveries();
    const available = Object.keys(ALL_DISCOVERIES).filter(
      (k) => k !== "master_explorer" && !d.includes(k),
    );

    if (available.length > 0) {
      const missionId = available[Math.floor(Math.random() * available.length)];
      const actions = {
        first_contact: "Open Terminal",
        archivist: "Create a Note",
        cosmic_artist: "Save a Painting",
        audio_engineer: "Play a Music File",
        reality_bender: "Trigger a Singularity",
        anomaly_hunter: "Discover a Hidden Command",
        paradox_found: "Trigger a Calculator Paradox",
        app_master: "Open Every App",
      };

      if (!activeMissions.includes(missionId)) {
        activeMissions.push(missionId);
      }
      setBroadcast(`Mission Available: ${actions[missionId]}`);
      return;
    }
  }

  // Random Reality Distortion
  if (Math.random() < 0.1) {
    const bg = document.getElementById("desktop-bg");
    if (bg) {
      bg.classList.add("reality-distorting");
      setTimeout(() => bg.classList.remove("reality-distorting"), 320);
    }
  }

  const categories = [bcHumor, bcMotivation, bcLore, bcSystem];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const msg = category[Math.floor(Math.random() * category.length)];
  setBroadcast(msg);
}

setInterval(updateTelemetry, 1000);
setInterval(rotateBroadcast, 25000);
updateTelemetry();
updateRealityMonitor();
rotateBroadcast();

// ==================== WINDOW MANAGEMENT ====================
let highestZ = 500;

function makeDraggable(win) {
  const header = win.querySelector(".window-header");
  if (!header) return;

  let dragging = false;
  let offX = 0,
    offY = 0;

  function startDrag(e, clientX, clientY) {
    if (e.target.closest(".win-btn") || win.classList.contains("maximized"))
      return;
    dragging = true;
    offX = clientX - win.offsetLeft;
    offY = clientY - win.offsetTop;
    win.style.transition = "none";
    bringToFront(win);
  }

  function doDrag(clientX, clientY) {
    if (!dragging) return;
    let x = clientX - offX;
    let y = clientY - offY;

    const winW = win.offsetWidth || parseInt(win.style.width) || 400;
    x = Math.max(-(winW - 50), Math.min(x, window.innerWidth - 50));
    y = Math.max(40, Math.min(y, window.innerHeight - 40));

    win.style.left = x + "px";
    win.style.top = y + "px";
  }

  function endDrag() {
    if (dragging) {
      safeSetItem(
        `nebula_winPos_${win.id}`,
        JSON.stringify({ left: win.style.left, top: win.style.top }),
      );
    }
    dragging = false;
    win.style.transition = "";
  }

  header.addEventListener("mousedown", (e) =>
    startDrag(e, e.clientX, e.clientY),
  );
  document.addEventListener("mousemove", (e) => doDrag(e.clientX, e.clientY));
  document.addEventListener("mouseup", endDrag);

  header.addEventListener(
    "touchstart",
    (e) => {
      if (!e.target.closest(".win-btn")) e.preventDefault();
      startDrag(e, e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false },
  );
  document.addEventListener(
    "touchmove",
    (e) => {
      if (dragging) e.preventDefault();
      doDrag(e.touches[0].clientX, e.touches[0].clientY);
    },
    { passive: false },
  );
  document.addEventListener("touchend", endDrag);
}

function bringToFront(win) {
  highestZ++;
  win.style.zIndex = highestZ;
  document
    .querySelectorAll(".window")
    .forEach((w) => w.classList.remove("active"));
  win.classList.add("active");
}

function enforceWindowBounds(win) {
  const rect = win.getBoundingClientRect();
  let x = parseInt(win.style.left) || rect.left;
  let y = parseInt(win.style.top) || rect.top;

  const winW = rect.width || parseInt(win.style.width) || 400;

  if (x < -(winW - 50)) x = -(winW - 50);
  if (x > window.innerWidth - 50) x = window.innerWidth - 50;
  if (y < 40) y = 40;
  if (y > window.innerHeight - 40) y = window.innerHeight - 40;

  win.style.left = x + "px";
  win.style.top = y + "px";
}

function openWindow(id, isRestore = false) {
  const win = document.getElementById(id);
  if (!win) return;

  if (win.style.display !== "flex") {
    if (!isRestore) {
      let opened = NebulaState.getAppsOpened();
      safeSetItem("nebula_apps_opened", opened + 1);

      _sessionApps.add(id);
      const totalApps = document.querySelectorAll(".window").length;
      if (_sessionApps.size >= totalApps && totalApps > 0) {
        NebulaState.unlockDiscovery("app_master");
      }
    }

    if (id === "window-paint")
      if (typeof setBroadcast === "function")
        setBroadcast("Creative activity detected.");
      else if (id === "window-terminal") {
        if (typeof setBroadcast === "function")
          setBroadcast("Command interface active.");
        if (!isRestore) NebulaState.unlockDiscovery("first_contact");
      } else if (id === "window-notes")
        if (typeof setBroadcast === "function")
          setBroadcast("Text recording module engaged.");
        else if (id === "window-music")
          if (typeof setBroadcast === "function")
            setBroadcast("Audio interface initialized.");

    if (id === "window-terminal") resetTerminal();
    if (id === "window-game") resetGameUI();
  }

  win.style.display = "flex";
  void win.offsetWidth; // Force reflow to ensure animation triggers consistently

  win.style.width = win.dataset.defaultW + "px";
  win.style.height = win.dataset.defaultH + "px";

  const savedPos = localStorage.getItem(`nebula_winPos_${id}`);
  if (savedPos && !win.classList.contains("maximized")) {
    try {
      const pos = JSON.parse(savedPos);
      win.style.left = pos.left;
      win.style.top = pos.top;
    } catch (e) {}
  }

  enforceWindowBounds(win);
  bringToFront(win);

  win.classList.remove("window-closing", "window-minimizing");
  win.classList.add("window-opening");
  setTimeout(() => win.classList.remove("window-opening"), 400);

  saveOpenWindows();

  if (id === "window-paint") setTimeout(initPaint, 50);
  if (id === "window-game") setTimeout(initGame, 50);
}

function closeWindow(win) {
  win.classList.remove("window-opening", "window-minimizing");
  win.classList.add("window-closing");

  setTimeout(() => {
    win.style.display = "none";
    win.classList.remove("active", "maximized", "window-closing");

    if (win.id === "window-terminal") resetTerminal();
    if (win.id === "window-music") stopMusic();
    if (win.id === "window-game") stopGame();

    saveOpenWindows();
  }, 150);
}

function saveOpenWindows() {
  const openWins = Array.from(document.querySelectorAll(".window"))
    .filter((w) => w.style.display === "flex")
    .map((w) => w.id);
  safeSetItem("nebula_open_windows", JSON.stringify(openWins));
  updateRealityMonitor();
}

function restoreOpenWindows() {
  const saved = localStorage.getItem("nebula_open_windows");
  if (saved) {
    try {
      const openWins = JSON.parse(saved);
      openWins.forEach((id) => {
        if (document.getElementById(id)) openWindow(id, true);
      });
    } catch (e) {}
  }
}

// ==================== MAIN INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  bootSequence();

  document.querySelectorAll(".window").forEach(makeDraggable);

  document.querySelectorAll(".window").forEach((win) => {
    win.addEventListener("mousedown", () => bringToFront(win));
    win.addEventListener("touchstart", () => bringToFront(win), {
      passive: true,
    });

    win
      .querySelector(".btn-close")
      ?.addEventListener("click", () => closeWindow(win));

    win.querySelector(".btn-min")?.addEventListener("click", () => {
      win.classList.remove("window-opening", "window-closing");
      win.classList.add("window-minimizing");
      setTimeout(() => {
        win.style.display = "none";
        win.classList.remove("window-minimizing", "active");
        saveOpenWindows();
      }, 250);
    });

    win.querySelector(".btn-max")?.addEventListener("click", () => {
      const btn = win.querySelector(".btn-max");
      if (win.classList.contains("maximized")) {
        win.classList.remove("maximized");
        win.style.width = win.dataset.defaultW + "px";
        win.style.height = win.dataset.defaultH + "px";
        win.style.top = win.dataset.prevTop || "100px";
        win.style.left = win.dataset.prevLeft || "100px";
        if (btn) btn.textContent = "□";
        if (win.id === "window-paint") setTimeout(initPaint, 100);
        if (win.id === "window-game") setTimeout(initGame, 100);
      } else {
        win.dataset.prevTop = win.style.top;
        win.dataset.prevLeft = win.style.left;
        win.classList.add("maximized");
        if (btn) btn.textContent = "◱";
        if (win.id === "window-paint") setTimeout(initPaint, 100);
        if (win.id === "window-game") setTimeout(initGame, 100);
      }
    });
  });

  // Desktop icons - SINGLE CLICK
  document.querySelectorAll(".desk-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      openWindow("window-" + icon.dataset.app);
    });
  });

  // Dock
  document.querySelectorAll(".dock-item[data-app]").forEach((item) => {
    item.addEventListener("click", () => {
      const winId = "window-" + item.dataset.app;
      openWindow(winId);
    });
  });

  // Wormhole
  document
    .getElementById("wormhole-trigger")
    ?.addEventListener("click", triggerWormhole);

  // Context menu
  const ctxMenu = document.getElementById("context-menu");
  const desktop = document.getElementById("desktop");

  desktop?.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 220) + "px";
    ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 200) + "px";
    ctxMenu.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!ctxMenu.contains(e.target)) ctxMenu.style.display = "none";
  });

  document.querySelectorAll(".ctx-item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action;
      if (action === "refresh") location.reload();
      else if (action === "arrange") arrangeWindows();
      else if (action === "about")
        alert(
          "NEBULA OS v1.0\nBuilt for Hack Club Stardance\n\nNeo-Brutalist WebOS",
        );
      else openWindow("window-" + action);
      ctxMenu.style.display = "none";
    });
  });

  // ==================== AMBIENT EFFECTS ====================
  // Desktop Ripple
  desktop?.addEventListener("mousedown", (e) => {
    if (
      e.target.closest(".window") ||
      e.target.closest("#context-menu") ||
      e.target.closest("#dock") ||
      e.target.closest("#topbar")
    )
      return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const ripple = document.createElement("div");
        ripple.className = "desktop-ripple";
        ripple.style.left = e.clientX - 60 + "px";
        ripple.style.top = e.clientY - 60 + "px";
        ripple.style.width = "120px";
        ripple.style.height = "120px";
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 1600);
      }, i * 150);
    }
  });

  // Gravity Rings
  const ambientRings = document.getElementById("ambient-rings");
  if (ambientRings) {
    setInterval(() => {
      if (Math.random() > 0.4) return;
      const ring = document.createElement("div");
      ring.className = "gravity-ring";
      const size = 50 + Math.random() * 200;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      ring.style.width = size + "px";
      ring.style.height = size + "px";
      ring.style.left = x - size / 2 + "px";
      ring.style.top = y - size / 2 + "px";
      const colors = ["#8FAEC4", "#C9887A", "#D4AF78", "#B8A9CC"];
      ring.style.color = colors[Math.floor(Math.random() * colors.length)];

      ring.animate(
        [
          { transform: "scale(0.5)", opacity: 0 },
          { opacity: 0.6, offset: 0.2 },
          { transform: "scale(2)", opacity: 0 },
        ],
        {
          duration: 3000 + Math.random() * 2000,
          easing: "ease-out",
        },
      ).onfinish = () => ring.remove();
      ambientRings.appendChild(ring);
    }, 3000);
  }

  // Dynamic Tint Cycle
  const tintEl = document.getElementById("desktop-tint");
  if (tintEl) {
    const tints = [
      "rgba(143, 174, 196, 0.05)",
      "rgba(201, 136, 122, 0.05)",
      "rgba(212, 175, 120, 0.05)",
      "rgba(184, 169, 204, 0.05)",
    ];
    let tintIdx = 0;
    setInterval(() => {
      tintEl.style.background = tints[tintIdx];
      tintIdx = (tintIdx + 1) % tints.length;
    }, 120000); // changes every 120s based on CSS transition
    tintEl.style.background = tints[0];
  }

  // Init apps
  initTerminal();
  initCalculator();
  initMusic();
  initNotes();
});

function arrangeWindows() {
  const wins = Array.from(document.querySelectorAll(".window")).filter(
    (w) => w.style.display === "flex",
  );
  if (!wins.length) return;

  const cols = Math.ceil(Math.sqrt(wins.length));
  const pad = 40;
  const w = Math.floor((window.innerWidth - pad * 2) / cols);
  const h = Math.floor(
    (window.innerHeight - 80) / Math.ceil(wins.length / cols),
  );

  wins.forEach((win, i) => {
    win.classList.remove("maximized");
    const col = i % cols;
    const row = Math.floor(i / cols);
    win.style.transition = "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
    win.style.left = pad + col * w + "px";
    win.style.top = 60 + row * h + "px";
    win.style.width = win.dataset.defaultW + "px";
    win.style.height = win.dataset.defaultH + "px";
    setTimeout(() => (win.style.transition = ""), 500);
  });
}

// ==================== WORMHOLE SYSTEM ====================
let wormholeAudioNodes = [];

function createWormholeSound() {
  const ctx = getAudioContext();
  wormholeAudioNodes = [];

  // Low rumble oscillator
  const rumble = ctx.createOscillator();
  const rumbleGain = ctx.createGain();
  rumble.type = "sawtooth";
  rumble.frequency.value = 40;
  rumbleGain.gain.value = 0;
  rumble.connect(rumbleGain);
  rumbleGain.connect(ctx.destination);
  rumble.start();
  wormholeAudioNodes.push({ osc: rumble, gain: rumbleGain });

  // Bass oscillator
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = "sine";
  bass.frequency.value = 80;
  bassGain.gain.value = 0;
  bass.connect(bassGain);
  bassGain.connect(ctx.destination);
  bass.start();
  wormholeAudioNodes.push({ osc: bass, gain: bassGain });

  // Resonance oscillator
  const resonance = ctx.createOscillator();
  const resGain = ctx.createGain();
  resonance.type = "square";
  resonance.frequency.value = 200;
  resGain.gain.value = 0;
  resonance.connect(resGain);
  resGain.connect(ctx.destination);
  resonance.start();
  wormholeAudioNodes.push({ osc: resonance, gain: resGain });

  // High whine
  const whine = ctx.createOscillator();
  const whineGain = ctx.createGain();
  whine.type = "sine";
  whine.frequency.value = 600;
  whineGain.gain.value = 0;
  whine.connect(whineGain);
  whineGain.connect(ctx.destination);
  whine.start();
  wormholeAudioNodes.push({ osc: whine, gain: whineGain });

  // Envelope automation
  const now = ctx.currentTime;

  // Rumble builds
  rumbleGain.gain.setValueAtTime(0, now);
  rumbleGain.gain.linearRampToValueAtTime(0.3, now + 1.5);
  rumbleGain.gain.linearRampToValueAtTime(0.5, now + 2.5);
  rumbleGain.gain.linearRampToValueAtTime(0, now + 3.2);

  // Bass grows
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(0.2, now + 1);
  bassGain.gain.linearRampToValueAtTime(0.4, now + 2);
  bassGain.gain.linearRampToValueAtTime(0, now + 3);

  // Resonance kicks in
  resGain.gain.setValueAtTime(0, now);
  resGain.gain.linearRampToValueAtTime(0.05, now + 1.5);
  resGain.gain.linearRampToValueAtTime(0.15, now + 2.5);
  resGain.gain.linearRampToValueAtTime(0, now + 3);

  // Whine at peak
  whineGain.gain.setValueAtTime(0, now);
  whineGain.gain.linearRampToValueAtTime(0, now + 2);
  whineGain.gain.linearRampToValueAtTime(0.1, now + 2.5);
  whineGain.gain.linearRampToValueAtTime(0, now + 3);

  // Frequency sweeps
  rumble.frequency.linearRampToValueAtTime(30, now + 3);
  bass.frequency.linearRampToValueAtTime(60, now + 3);
  resonance.frequency.linearRampToValueAtTime(400, now + 3);
  whine.frequency.linearRampToValueAtTime(1200, now + 3);
}

function stopWormholeSound() {
  wormholeAudioNodes.forEach((node) => {
    try {
      node.osc.stop();
      node.osc.disconnect();
    } catch (e) {}
  });
  wormholeAudioNodes = [];
}

// ==================== SINGULARITY SYSTEM ====================
// State variables
let singularityActive = false;
let singularityGhosts = [];
let singularityParticles = [];
let singularityFlashes = [];
let wormholeHardTimeout = null; // P4b: cleared on normal completion
let singularityRAF = null;
let singularityStartTime = null;
let clockGlitchInterval = null;

// ── entry point ──────────────────────────────────────────────────────────────
function triggerWormhole() {
  if (singularityActive) return;
  const confirmOverlay = document.getElementById("confirm-overlay");
  if (confirmOverlay && confirmOverlay.style.display !== "flex") {
    confirmOverlay.style.display = "flex";
    document.getElementById("confirm-yes").onclick = () => {
      confirmOverlay.style.display = "none";
      doWormhole();
    };
    document.getElementById("confirm-no").onclick = () => {
      confirmOverlay.style.display = "none";
      singularityActive = false; // P3 fix: reset so wormhole remains triggerable
    };
    return;
  }
}

function doWormhole() {
  singularityActive = true;

  // P4b: Resilience guard — if browser throttles rAF (tab switch, minimize),
  // a hard timeout ensures Nebula always reloads within 12 seconds.
  wormholeHardTimeout = setTimeout(() => {
    location.reload();
  }, 12000);

  // P4b: If user switches tabs mid-wormhole, force immediate reload on return
  // so they are never stuck in a broken half-wormhole state.
  function onVisibilityChange() {
    if (singularityActive) {
      clearTimeout(wormholeHardTimeout);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      location.reload();
    }
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Resume audio
  const actx = getAudioContext();
  if (actx.state === "suspended") actx.resume();
  createWormholeSound();

  // Show overlay TRANSPARENTLY — the desktop must show through completely
  const overlay = document.getElementById("wormhole-overlay");
  if (overlay) {
    overlay.style.display = "flex";
    overlay.style.background = "transparent";
    overlay.style.pointerEvents = "none";
    const stage = overlay.querySelector(".wormhole-stage");
    const txt = overlay.querySelector(".wormhole-text");
    const sub = overlay.querySelector(".wormhole-sub");
    if (stage) stage.classList.add("active");
    if (txt) {
      txt.style.opacity = "0";
      txt.style.transition = "none";
    }
    if (sub) {
      sub.style.opacity = "0";
      sub.style.transition = "none";
    }
  }

  // Start the canvas loop immediately so the singularity core is visible from frame 1
  const canvas = document.getElementById("wormhole-canvas");
  if (canvas) {
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  initAccretionParticles();
  singularityStartTime = Date.now();
  singularityRAF = requestAnimationFrame(singularityCoreLoop);

  // ── 0.3 s  BODY shake — shakes the entire page, not any overlay ────────
  setTimeout(() => {
    document.body.classList.add("sg-shake");
  }, 300);

  // ── 0.5 s  Widgets vibrate ─────────────────────────────────────────────
  setTimeout(() => {
    document
      .querySelectorAll(".widget")
      .forEach((w) => w.classList.add("sg-vibrate"));
    document.getElementById("bg-grid")?.classList.add("sg-grid-bend");
  }, 500);

  // ── 0.7 s  Windows tilt + clock glitch ────────────────────────────────
  setTimeout(() => {
    document.querySelectorAll(".window").forEach((w) => {
      if (getComputedStyle(w).display === "flex") w.classList.add("sg-tilt");
    });
    startClockGlitch();
  }, 700);

  // ── 1.0 s  Dock creep inward ──────────────────────────────────────────
  setTimeout(() => {
    document.getElementById("dock")?.classList.add("sg-dock-creep");
  }, 1000);

  // ── 1.2 s  Desktop icons slide ────────────────────────────────────────
  setTimeout(() => {
    document
      .querySelectorAll(".desk-icon")
      .forEach((ic) => ic.classList.add("sg-icon-slide"));
  }, 1200);


  setTimeout(() => {
    document.body.classList.remove("sg-shake");
    // Stop CSS animations — physics takes over
    document
      .querySelectorAll(".sg-vibrate,.sg-tilt,.sg-dock-creep,.sg-icon-slide")
      .forEach((el) =>
        el.classList.remove(
          "sg-vibrate",
          "sg-tilt",
          "sg-dock-creep",
          "sg-icon-slide",
        ),
      );
    stopClockGlitch();
    cancelAnimationFrame(singularityRAF);
    spawnGhostsAndBeginSuction();
  }, 1500);
}

// ── phase 1 loop: draw core only (desktop still visible beneath)
function singularityCoreLoop() {
  const canvas = document.getElementById("wormhole-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Very light trail — mostly transparent so desktop shows
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawAccretionGlow(
    ctx,
    canvas.width / 2,
    canvas.height / 2,
    (Date.now() - singularityStartTime) / 1000,
  );

  singularityRAF = requestAnimationFrame(singularityCoreLoop);
}

// ── clock glitch ─────────────────────────────────────────────────────────────
function startClockGlitch() {
  const cl = document.getElementById("clock");
  if (!cl) return;
  cl.classList.add("clock-glitch");
  const chars = "░▒▓█01✕Ø";
  clockGlitchInterval = setInterval(() => {
    let s = "";
    for (let i = 0; i < 5; i++)
      s += i === 2 ? ":" : chars[Math.floor(Math.random() * chars.length)];
    cl.textContent = s;
  }, 70);
}

function stopClockGlitch() {
  if (clockGlitchInterval) {
    clearInterval(clockGlitchInterval);
    clockGlitchInterval = null;
  }
  const cl = document.getElementById("clock");
  if (cl) cl.classList.remove("clock-glitch");
}

// ── accretion disk initialization ─────────────────────────────────────────────
function initAccretionParticles() {
  singularityParticles = [];
  for (let i = 0; i < 55; i++) {
    singularityParticles.push({
      angle: (Math.PI * 2 * i) / 55,
      radius: 85 + Math.random() * 75,
      speed: 0.018 + Math.random() * 0.026,
      size: 1.2 + Math.random() * 2.2,
      color: Math.random() > 0.5 ? "#FFDE4D" : "#00FFAB",
      trail: [],
    });
  }
}

// ── accretion glow shared draw ────────────────────────────────────────────────
function drawAccretionGlow(ctx, cx, cy, elapsed) {
  const coreR = 80;
  const pulse = Math.sin(Date.now() * 0.005);
  const outerR = coreR + 130 + pulse * 25;

  const grd = ctx.createRadialGradient(cx, cy, coreR - 10, cx, cy, outerR);
  grd.addColorStop(0, "rgba(255,222,77,0.85)");
  grd.addColorStop(0.15, "rgba(255,222,77,0.30)");
  grd.addColorStop(0.5, "rgba(0,255,171,0.08)");
  grd.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  singularityParticles.forEach((p) => {
    p.angle += p.speed * (1 + elapsed * 1.5);
    p.radius = Math.max(26, p.radius - 0.3);
    const px = cx + Math.cos(p.angle) * p.radius;
    const py = cy + Math.sin(p.angle) * p.radius;

    p.trail.push({ x: px, y: py, a: 1 });
    if (p.trail.length > 7) p.trail.shift();
    p.trail.forEach((t, i) => {
      t.a *= 0.88;
      ctx.beginPath();
      ctx.arc(t.x, t.y, p.size * (i / p.trail.length), 0, Math.PI * 2);
      ctx.fillStyle =
        p.color +
        Math.floor(t.a * 255)
          .toString(16)
          .padStart(2, "0");
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
}

// ── spawn fixed-position clones of real OS elements ───────────────────────────
function spawnGhostsAndBeginSuction() {
  singularityGhosts = [];
  singularityFlashes = [];

  // Collect every visible interface element
  const targets = [
    ...Array.from(document.querySelectorAll(".window")).filter(
      (w) => getComputedStyle(w).display === "flex",
    ),
    ...Array.from(document.querySelectorAll(".desk-icon")),
    ...Array.from(document.querySelectorAll(".widget")),
    document.getElementById("dock"),
    document.getElementById("topbar"),
    document.querySelector(".bg-starburst"),
    document.querySelector(".bg-circle-outline"),
    document.querySelector(".bg-diagonals"),
  ].filter((el) => el && el.offsetWidth > 0 && el.offsetHeight > 0);

  targets.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Deep-clone into a fixed-position ghost on body
    const ghost = el.cloneNode(true);

    // Strip ALL inherited sizing/positioning so our inline styles win
    ghost.removeAttribute("style");
    ghost.classList.remove(
      "maximized",
      "active",
      "gravity-distort",
      "gravity-lean",
      "gravity-rumble",
      "screen-shake",
    );

    // Apply fixed positioning exactly over the original element
    ghost.style.position = "fixed";
    ghost.style.left = rect.left + "px";
    ghost.style.top = rect.top + "px";
    ghost.style.width = rect.width + "px";
    ghost.style.height = rect.height + "px";
    ghost.style.margin = "0";
    ghost.style.padding = getComputedStyle(el).padding;
    ghost.style.transform = "none";
    ghost.style.transformOrigin = "50% 50%";
    ghost.style.transition = "none";
    ghost.style.animation = "none";
    ghost.style.zIndex = "99986";
    ghost.style.pointerEvents = "none";
    ghost.style.boxSizing = "border-box";
    ghost.style.overflow = "visible";
    ghost.style.opacity = "1";
    document.body.appendChild(ghost);

    // Immediately hide the original
    el.style.visibility = "hidden";
    el.style.opacity = "0";

    singularityGhosts.push({
      ghost: ghost,
      origEl: el,
      cx: cx, // current center x
      cy: cy, // current center y
      initLeft: rect.left,
      initTop: rect.top,
      vx: 0,
      vy: 0,
      color: getGhostTrailColor(el),
      isWindow: el.classList.contains("window"),
      status: "flying", // flying | collapsing | consumed
      collapseT: 0,
      trail: [],
    });
  });

  // Reset canvas & restart loop with suction physics
  const canvas = document.getElementById("wormhole-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  singularityStartTime = Date.now();
  singularityRAF = requestAnimationFrame(singularitySuctionLoop);
}

// ── color for trails / flashes ────────────────────────────────────────────────
function getGhostTrailColor(el) {
  if (el.classList.contains("window")) {
    const hdr = el.querySelector(".window-header");
    if (hdr) return getComputedStyle(hdr).backgroundColor;
  }
  if (el.id === "topbar") return "rgba(255,255,255,0.9)";
  if (el.id === "dock") return "rgba(255,255,255,0.9)";
  const ib = el.querySelector(".desk-icon-box");
  if (ib) return getComputedStyle(ib).backgroundColor;
  if (el.classList.contains("widget")) return "rgba(255,255,255,0.8)";
  return "#cccccc";
}

// ── main suction RAF loop ─────────────────────────────────────────────────────
function singularitySuctionLoop() {
  const canvas = document.getElementById("wormhole-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const elapsed = (Date.now() - singularityStartTime) / 1000;

  // Dark fade builds slowly — desktop ghosts are visible on top of this
  const fadeAlpha = Math.min(0.2, 0.03 + elapsed * 0.06);
  ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw accretion glow + disk
  drawAccretionGlow(ctx, cx, cy, elapsed);

  // ── ghost physics + rendering ────────────────────────────────────────
  let allConsumed = singularityGhosts.length > 0;

  singularityGhosts.forEach((g) => {
    if (g.status === "consumed") return;
    allConsumed = false;

    // Collapsing: shrink ghost to zero at the event horizon
    if (g.status === "collapsing") {
      g.collapseT += 0.1;
      if (g.collapseT >= 1) {
        g.status = "consumed";
        if (g.ghost.parentNode) g.ghost.remove();
        singularityFlashes.push({
          x: cx,
          y: cy,
          r: 8,
          maxR: 42 + Math.random() * 38,
          a: 1.0,
          color: g.color,
        });
        return;
      }
      const sc = 1 - g.collapseT;
      const opc = 1 - g.collapseT;
      // Translate ghost so its center is at the singularity, then shrink
      const tx = cx - g.initLeft - parseFloat(g.ghost.style.width) / 2;
      const ty = cy - g.initTop - parseFloat(g.ghost.style.height) / 2;
      g.ghost.style.opacity = opc;
      g.ghost.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
      return;
    }

    // Flying: apply gravitational acceleration toward center
    const dx = cx - g.cx;
    const dy = cy - g.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx);

    if (dist < 40) {
      g.status = "collapsing";
      g.collapseT = 0;
      return;
    }

    // Gravity strength grows quadratically; windows have more mass (resist more)
    const gStr = Math.pow(elapsed, 1.9) * 52;
    const mass = g.isWindow ? 2.0 : 0.9;
    const force = gStr / mass / Math.max(Math.sqrt(dist), 5);

    g.vx += Math.cos(ang) * force;
    g.vy += Math.sin(ang) * force;
    g.vx *= 0.89;
    g.vy *= 0.89;

    g.cx += g.vx;
    g.cy += g.vy;

    // Trail dots on canvas (lightweight)
    g.trail.push({ x: g.cx, y: g.cy });
    if (g.trail.length > 9) g.trail.shift();
    if (g.trail.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(g.trail[0].x, g.trail[0].y);
      for (let i = 1; i < g.trail.length; i++)
        ctx.lineTo(g.trail[i].x, g.trail[i].y);
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Move the ghost element on screen
    // Translate relative to ghost's original fixed position
    const offsetX = g.cx - g.initLeft - parseFloat(g.ghost.style.width) / 2;
    const offsetY = g.cy - g.initTop - parseFloat(g.ghost.style.height) / 2;

    // Spaghettification along pull direction
    const stretch = 1 + (120 / (dist + 16)) * Math.min(1.6, elapsed * 0.85);

    g.ghost.style.transform =
      `translate(${offsetX}px, ${offsetY}px)` +
      ` rotate(${ang}rad)` +
      ` scale(${stretch}, ${Math.max(0.1, 1 / stretch)})` +
      ` rotate(${-ang}rad)`;
  });

  // ── event horizon flashes ──────────────────────────────────────────────
  for (let i = singularityFlashes.length - 1; i >= 0; i--) {
    const f = singularityFlashes[i];
    f.r += (f.maxR - f.r) * 0.17;
    f.a -= 0.07;
    if (f.a <= 0) {
      singularityFlashes.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = f.a;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();
  }

  if (allConsumed) {
    finalConsumption();
  } else {
    singularityRAF = requestAnimationFrame(singularitySuctionLoop);
  }
}

// ── final consumption: core expands to eat the screen ────────────────────────
function finalConsumption() {
  // P4b: Clear the hard-timeout since the normal reload path is executing
  if (wormholeHardTimeout) {
    clearTimeout(wormholeHardTimeout);
    wormholeHardTimeout = null;
  }
  stopWormholeSound();

  const overlay = document.getElementById("wormhole-overlay");

  // Show the singularity text now that the OS is gone
  const txt = overlay?.querySelector(".wormhole-text");
  const sub = overlay?.querySelector(".wormhole-sub");
  if (txt) {
    txt.style.transition = "opacity 0.35s ease";
    txt.style.opacity = "1";
  }
  if (sub) {
    sub.style.transition = "opacity 0.35s ease 0.15s";
    sub.style.opacity = "1";
  }

  // Expand the core to fill the whole viewport
  const core = overlay?.querySelector(".wormhole-core");
  if (core) setTimeout(() => core.classList.add("expanding"), 150);

  // NOW darken the overlay — desktop is already gone
  setTimeout(() => {
    if (overlay) {
      overlay.style.transition = "background 0.35s ease";
      overlay.style.background = "#000000";
      overlay.style.pointerEvents = "auto";
    }
  }, 250);

  // Brief white flash
  setTimeout(() => {
    const flash = document.createElement("div");
    flash.className = "collapse-flash";
    flash.style.animation = "collapseFlash 0.45s ease forwards";
    document.body.appendChild(flash);
  }, 450);

  // Hard cut + reload
  setTimeout(() => {
    document.body.style.background = "#000";
    setTimeout(() => location.reload(), 200);
  }, 850);
}

// ==================== TERMINAL ====================
let termHistory = [];
let historyIndex = -1;

function getNebulaAscii() {
  return `<div class="term-ascii">    _   __     __          __     
   / | / /__  / /_  __  __/ /___ _
  /  |/ / _ \\/ __ \\/ / / / / __ \`/
 / /|  /  __/ /_/ / /_/ / / /_/ / 
/_/ |_/\\___/_.___/\\__,_/_/\\__,_/  
                                  </div>`;
}

function resetTerminal() {
  const output = document.getElementById("term-output");
  const input = document.getElementById("term-input");
  if (output) {
    output.innerHTML = `
            ${getNebulaAscii()}
            <div class="term-line term-welcome">NEBULA OS v1.0 — Welcome, Explorer.</div>
            <div class="term-line term-hint">Type <span class="term-cmd">help</span> to see available commands</div>
            <div class="term-line"></div>
        `;
  }
  if (input) input.value = "";
}

function redAlert() {
  const output = document.getElementById("term-output");
  document.body.classList.add("red-alert-flash");

  const msgs = [
    "WARNING: MULTIPLE CONTAINMENT BREACHES DETECTED",
    "SECURITY PROTOCOL OMEGA INITIATED",
    "EVACUATE FACILITY IMMEDIATELY",
    "...",
  ];

  msgs.forEach((m, i) => {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = "term-line term-alert term-ascii";
      line.textContent = m;
      if (output) {
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
      }
    }, i * 1000);
  });

  setTimeout(() => {
    document.body.classList.remove("red-alert-flash");
    if (output) {
      const line = document.createElement("div");
      line.className = "term-line term-warning";
      line.textContent = "System automatically restored. False alarm.";
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }
  }, 5000);
}
function playTerminalClick() {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.02);
  } catch (e) {}
}

function initTerminal() {
  const input = document.getElementById("term-input");
  if (!input) return;

  const commands = {
    help: () => `<div class="help-table">
            <span class="help-cmd">about</span><span class="help-desc">About Nebula OS</span>
            <span class="help-cmd">clear</span><span class="help-desc">Clear terminal screen</span>
            <span class="help-cmd">cowsay</span><span class="help-desc">Moo.</span>
            <span class="help-cmd">creator</span><span class="help-desc">Who made this?</span>
            <span class="help-cmd">credits</span><span class="help-desc">View credits</span>
            <span class="help-cmd">date</span><span class="help-desc">Show current date</span>
            <span class="help-cmd">echo</span><span class="help-desc">Echo text back</span>
            <span class="help-cmd">fortune</span><span class="help-desc">Print a random quote</span>
            <span class="help-cmd">hack</span><span class="help-desc">Simulate hacking</span>
            <span class="help-cmd">matrix</span><span class="help-desc">Trigger matrix rain</span>
            <span class="help-cmd">motd</span><span class="help-desc">Message of the day</span>
            <span class="help-cmd">neofetch</span><span class="help-desc">Display system info</span>
            <span class="help-cmd">reboot</span><span class="help-desc">Restart system</span>
            <span class="help-cmd">singularity</span><span class="help-desc">Trigger wormhole</span>
            <span class="help-cmd">stardust</span><span class="help-desc">Print stardust</span>
            <span class="help-cmd">time</span><span class="help-desc">Show current time</span>
            <span class="help-cmd">uptime</span><span class="help-desc">Show session uptime</span>
            <span class="help-cmd">version</span><span class="help-desc">Show OS version</span>
            <span class="help-cmd">whoami</span><span class="help-desc">Show user info</span>
        </div>`,
    about: () =>
      "Nebula OS is a neo-brutalist web-based operating system designed for exploration.",
    version: () => "Nebula OS version 1.0.0-rc1 (HTML5/CSS3/JS)",
    clear: () => {
      const out = document.getElementById("term-output");
      if (out) out.innerHTML = "";
      return null;
    },
    date: () => new Date().toDateString(),
    time: () => new Date().toLocaleTimeString(),
    uptime: () => `Up ${Math.floor(performance.now() / 1000)} seconds`,
    echo: (args) => escapeHtml(args.join(" ")) || "Usage: echo [text]",
    whoami: () => "explorer@nebula-os",
    neofetch: () => {
      const appsCount = document.querySelectorAll(".desk-icon").length;
      const resolution = `${window.screen.width}x${window.screen.height}`;
      const sigCount = safeInt("nebula_singularity_count", 0);
      const ua = navigator.userAgent.split(" ")[0] || "UnknownBrowser";
      return `${getNebulaAscii()}<div class="term-ascii">
    OS: NEBULA v1.0
    Kernel: HTML5/CSS3/JS
    Shell: nebula-sh
    Uptime: ${Math.floor(performance.now() / 1000)}s
    Packages: ${appsCount} (web apps)
    Resolution: ${resolution}
    Browser: ${ua}
    Discoveries: ${NebulaState.getUnlockedDiscoveries().length} / 8
    Singularities: ${sigCount}
</div>`;
    },
    fortune: () => {
      const quotes = [
        "A computer lets you make more mistakes faster than any invention in human history.",
        "To iterate is human, to recurse divine.",
        "There are 10 types of people: those who understand binary, and those who don't.",
        "The best way to predict the future is to invent it.",
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    },
    cowsay: (args) => {
      const text = escapeHtml(args.join(" ")) || "Moo";
      return `<div class="term-ascii">
  < ${text} >
    \\   ^__^
     \\  (oo)\\_______
        (__)\\       )\\/\\
            ||----w |
            ||     ||
</div>`;
    },
    credits: () => "Built with blood, sweat, and CSS gradients.",
    motd: () => "Welcome to Nebula OS! Keep your spacesuit on.",
    stardust: () => "✨ * . * . ✨ * . ✨ * .",
    creator: () => "Created by a wandering space explorer.",
    matrix: () => {
      if (_isTermAnimRunning) return "Sequence already active.";
      _isTermAnimRunning = true;
      if (typeof setBroadcast === "function")
        setBroadcast("Simulation layers exposed.");
      NebulaState.addAnomaly();
      NebulaState.unlockDiscovery("anomaly_hunter");
      startMatrix();
      setTimeout(() => {
        _isTermAnimRunning = false;
      }, 1500);
      return "Initiating matrix rain...";
    },
    hack: () => {
      if (_isTermAnimRunning) return "Sequence already active.";
      _isTermAnimRunning = true;
      if (typeof setBroadcast === "function")
        setBroadcast("Unauthorized access attempt detected.");
      NebulaState.addAnomaly();
      NebulaState.addAnomaly();
      NebulaState.unlockDiscovery("anomaly_hunter");
      simulateHack();
      setTimeout(() => {
        _isTermAnimRunning = false;
      }, 3000);
      return "Initiating hack sequence...";
    },
    singularity: () => {
      let c = safeInt("nebula_singularity_count", 0);
      safeSetItem("nebula_singularity_count", c + 1);
      if (typeof setBroadcast === "function")
        setBroadcast("Gravitational collapse imminent.");
      NebulaState.wormholeStatus = "ACTIVE";
      NebulaState.setLastEvent("Universe Collapse Successful");
      NebulaState.unlockDiscovery("reality_bender");
      updateRealityMonitor();
      setTimeout(triggerWormhole, 500);
      return '<span class="term-alert">SINGULARITY IMMINENT...</span>';
    },
    wormhole: () => commands.singularity(),
    reboot: () => {
      setTimeout(() => location.reload(), 1000);
      return "Rebooting...";
    },
    "sudo collapse-universe": () => commands.singularity(),
    "red-alert": () => {
      if (typeof setBroadcast === "function")
        setBroadcast("Emergency protocol activated.");
      NebulaState.addAnomaly();
      NebulaState.addAnomaly();
      NebulaState.unlockDiscovery("anomaly_hunter");
      redAlert();
      return null;
    },
    "developer-mode": () => {
      if (typeof setBroadcast === "function")
        setBroadcast("Restricted diagnostics unlocked.");
      NebulaState.addAnomaly();
      NebulaState.unlockDiscovery("anomaly_hunter");
      return "God mode unlocked. (Not really, but it sounds cool.)";
    },
    universe: () => {
      if (typeof setBroadcast === "function")
        setBroadcast("Observing local reality cluster.");
      return "It's quite large.";
    },
    42: () => {
      if (typeof setBroadcast === "function")
        setBroadcast("Answer received. Question still missing.");
      return "The answer to life, the universe, and everything.";
    },
    coffee: () => {
      if (typeof setBroadcast === "function")
        setBroadcast("Caffeine reserves replenished.");
      return "☕ Error 418: I'm a teapot.";
    },
    stats: () => commands.profile(),
    profile: () => {
      return `<div class="term-ascii" style="color:var(--mint)">
EXPLORER PROFILE
================
Rank: ${getExplorerRank()}

Discoveries Unlocked: ${NebulaState.getUnlockedDiscoveries().length} / 8
Apps Opened: ${NebulaState.getAppsOpened()}
Terminal Commands: ${NebulaState.getTermCmds()}
Universes Collapsed: ${NebulaState.getSingularities()}
Anomalies Triggered: ${NebulaState.anomalies}
Paint Exports: ${NebulaState.getPaintSaves()}
Notes Created: ${NebulaState.getNotesCreated()}
Music Sessions: ${NebulaState.getMusicSessions()}
</div>`;
    },
  };

  input.addEventListener("keydown", (e) => {
    playTerminalClick();
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (termHistory.length > 0) {
        historyIndex = Math.min(historyIndex + 1, termHistory.length - 1);
        input.value = termHistory[termHistory.length - 1 - historyIndex];
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        input.value = termHistory[termHistory.length - 1 - historyIndex];
      } else {
        historyIndex = -1;
        input.value = "";
      }
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const val = input.value;
      const matches = Object.keys(commands).filter((c) => c.startsWith(val));
      if (matches.length === 1) {
        input.value = matches[0] + " ";
      } else if (matches.length > 1) {
        const output = document.getElementById("term-output");
        const cmdLine = document.createElement("div");
        cmdLine.className = "term-line";
        cmdLine.innerHTML = `<span style="color:#38E54D">❯</span> <span style="color:#FFDE4D">${escapeHtml(val)}</span>`;
        output.appendChild(cmdLine);

        const matchLine = document.createElement("div");
        matchLine.className = "term-line";
        matchLine.textContent = matches.join("  ");
        output.appendChild(matchLine);
        output.scrollTop = output.scrollHeight;
      }
      return;
    }

    if (e.key !== "Enter") return;

    const cmd = input.value.trim();
    input.value = "";
    if (!cmd) return;

    termHistory.push(cmd);
    historyIndex = -1;

    const output = document.getElementById("term-output");
    if (!output) return;

    const parts = cmd.split(" ");
    const rawCommand = parts[0].toLowerCase();
    parts.shift();

    let matchedCmd = null;
    if (commands[cmd.toLowerCase()]) {
      matchedCmd = cmd.toLowerCase();
    } else {
      matchedCmd = rawCommand;
    }

    const cmdLine = document.createElement("div");
    cmdLine.className = "term-line";
    cmdLine.innerHTML = `<span style="color:#38E54D">❯</span> <span style="color:#FFDE4D">${escapeHtml(cmd)}</span>`;
    cmdLine.style.opacity = "1";
    output.appendChild(cmdLine);

    if (commands[matchedCmd]) {
      let cmds = NebulaState.getTermCmds();
      safeSetItem("nebula_terminal_cmds", cmds + 1);

      const result = commands[matchedCmd](parts);
      if (result !== null) {
        const res = document.createElement("div");
        res.className = "term-line";
        res.innerHTML = result;
        res.style.color = "#00FFAB";
        res.style.opacity = "1";
        output.appendChild(res);
      }
    } else {
      const err = document.createElement("div");
      err.className = "term-line";
      err.textContent = `Command not found: ${rawCommand}`;
      err.style.color = "#FF004D";
      err.style.opacity = "1";
      output.appendChild(err);
    }

    output.scrollTop = output.scrollHeight;
  });
}

function escapeHtml(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}

function startMatrix() {
  const output = document.getElementById("term-output");
  if (!output) return;
  const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = "term-line";
      line.style.color = "#38E54D";
      line.style.opacity = "0.8";
      line.textContent = Array(40)
        .fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join("");
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }, i * 80);
  }
}

function simulateHack() {
  const output = document.getElementById("term-output");
  if (!output) return;
  const steps = [
    { t: "Bypassing firewall...", c: "#FF6B6B" },
    { t: "Accessing mainframe...", c: "#FF6B6B" },
    { t: "Decrypting passwords...", c: "#FF6B6B" },
    { t: "Uploading payload...", c: "#FF6B6B" },
    { t: "ACCESS DENIED. Just kidding! 😄", c: "#FFDE4D" },
  ];
  steps.forEach((s, i) => {
    setTimeout(() => {
      const line = document.createElement("div");
      line.className = "term-line";
      line.textContent = `[${String(i + 1).padStart(2, "0")}/05] ${s.t}`;
      line.style.color = s.c;
      line.style.opacity = "1";
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }, i * 500);
  });
}

// ==================== CALCULATOR ====================
let calcCurrent = "0";
let calcPrev = null;
let calcOp = null;
let calcReset = false;

function initCalculator() {
  calcCurrent = "0";
  calcPrev = null;
  calcOp = null;
  calcReset = false;
  updateCalc();

  document.querySelectorAll(".c-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.val;
      const op = btn.dataset.op;

      if (val !== undefined) {
        if (calcReset) {
          calcCurrent = val;
          calcReset = false;
        } else {
          calcCurrent = calcCurrent === "0" ? val : calcCurrent + val;
        }
        if (calcCurrent.length > 12) calcCurrent = calcCurrent.slice(0, 12);
        updateCalc();
      } else if (op) {
        handleCalcOp(op);
      }
    });
  });
}

function handleCalcOp(op) {
  const curr = parseFloat(calcCurrent);

  if (op === "C") {
    calcCurrent = "0";
    calcPrev = null;
    calcOp = null;
    calcReset = false;
    updateCalc();
    return;
  }
  if (op === "±") {
    calcCurrent = String(curr * -1);
    updateCalc();
    return;
  }
  if (op === "%") {
    calcCurrent = String(curr / 100);
    updateCalc();
    return;
  }

  if (op === "=") {
    if (calcOp && calcPrev !== null) {
      const prev = parseFloat(calcPrev);
      let res;
      switch (calcOp) {
        case "+":
          res = prev + curr;
          break;
        case "−":
          res = prev - curr;
          break;
        case "×":
          res = prev * curr;
          break;
        case "÷":
          if (curr === 0) {
            res = "PARADOX";
            if (NebulaState && NebulaState.addAnomaly) NebulaState.addAnomaly();
            if (typeof showNotification === "function")
              showNotification("Division by zero paradox.", "error");
            NebulaState.unlockDiscovery("paradox_found");
          } else {
            res = prev / curr;
          }
          break;
      }
      if (res === "PARADOX") {
        calcCurrent = res;
      } else {
        calcCurrent =
          String(res).length > 12 ? String(res).toExponential(6) : String(res);
        if (res === 42) {
          if (NebulaState && NebulaState.addAnomaly) NebulaState.addAnomaly();
          if (typeof showNotification === "function")
            showNotification("The answer has been found.", "success");
          NebulaState.unlockDiscovery("paradox_found");
        }
      }
      calcPrev = null;
      calcOp = null;
      calcReset = true;
      updateCalc();
    }
    return;
  }

  if (calcOp && !calcReset) {
    const prev = parseFloat(calcPrev);
    let res;
    switch (calcOp) {
      case "+":
        res = prev + curr;
        break;
      case "−":
        res = prev - curr;
        break;
      case "×":
        res = prev * curr;
        break;
      case "÷":
        if (curr === 0) {
          res = "PARADOX";
          if (NebulaState && NebulaState.addAnomaly) NebulaState.addAnomaly();
          if (typeof showNotification === "function")
            showNotification("Division by zero paradox.", "error");
          NebulaState.unlockDiscovery("paradox_found");
        } else {
          res = prev / curr;
        }
        break;
    }
    calcPrev = String(res);
    calcCurrent = String(res);
  } else {
    calcPrev = calcCurrent;
  }
  calcOp = op;
  calcReset = true;
  updateCalc();
}

function updateCalc() {
  const d = document.getElementById("calc-current");
  const h = document.getElementById("calc-history");
  if (d) d.textContent = calcCurrent;
  if (h) h.textContent = calcPrev !== null ? `${calcPrev} ${calcOp || ""}` : "";
}

// ==================== MUSIC PLAYER ====================
let musicTrack = { name: "NO TRACK", artist: "DROP AUDIO FILES" };
let musicProgress = 0;
let musicDuration = 0;
let musicPlaylist = [];
let currentPlaylistIndex = -1;

function initMusic() {
  const fileInput = document.getElementById("music-file-input");
  const uploadBtn = document.getElementById("m-upload");
  const playBtn = document.getElementById("m-play");
  const prevBtn = document.getElementById("m-prev");
  const nextBtn = document.getElementById("m-next");
  const volumeSlider = document.getElementById("music-volume");
  const progressTrack = document.querySelector(".progress-track");
  const dropZone = document.getElementById("vinyl-drop-zone");
  const record = document.getElementById("vinyl-record");
  const clearBtn = document.getElementById("playlist-clear-btn");

  // Upload button
  uploadBtn?.addEventListener("click", () => fileInput?.click());

  // Clear playlist
  clearBtn?.addEventListener("click", () => {
    musicPlaylist = [];
    currentPlaylistIndex = -1;
    stopMusic(true);
    renderPlaylist();
  });

  // File input
  fileInput?.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      addFilesToPlaylist(Array.from(e.target.files));
    }
  });

  // Drag and drop on vinyl
  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    record?.classList.add("drag-over");
  });

  dropZone?.addEventListener("dragleave", () => {
    record?.classList.remove("drag-over");
  });

  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    record?.classList.remove("drag-over");
    if (e.dataTransfer.files.length > 0) {
      const audioFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("audio/"),
      );
      if (audioFiles.length > 0) addFilesToPlaylist(audioFiles);
    }
  });

  // Play/pause
  playBtn?.addEventListener("click", toggleMusicPlayback);

  // Prev/Next
  prevBtn?.addEventListener("click", () => {
    if (musicPlaylist.length > 0) {
      let nextIdx = currentPlaylistIndex - 1;
      if (nextIdx < 0) nextIdx = musicPlaylist.length - 1;
      playPlaylistTrack(nextIdx);
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (musicPlaylist.length > 0) {
      let nextIdx = currentPlaylistIndex + 1;
      if (nextIdx >= musicPlaylist.length) nextIdx = 0;
      playPlaylistTrack(nextIdx);
    }
  });

  // Volume
  const savedVol = safeFloat("nebula_music_volume", 0.8);
  if (volumeSlider) {
    volumeSlider.value = savedVol;
  }

  volumeSlider?.addEventListener("input", (e) => {
    if (audioGain) {
      audioGain.gain.value = e.target.value / 100;
    }
    safeSetItem("nebula_music_volume", e.target.value);
  });

  // Progress bar click
  progressTrack?.addEventListener("click", (e) => {
    if (!audioElement || !musicDuration) return;
    const rect = progressTrack.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioElement.currentTime = pct * musicDuration;
  });
}

function addFilesToPlaylist(files) {
  const startIdx = musicPlaylist.length;
  files.forEach((file) => {
    musicPlaylist.push({
      file: file,
      name: file.name.replace(/\.[^/.]+$/, "").toUpperCase(),
      duration: "...",
    });

    // Extract duration silently
    const tempUrl = URL.createObjectURL(file);
    const tempAudio = new Audio(tempUrl);
    tempAudio.addEventListener("loadedmetadata", () => {
      const track = musicPlaylist.find((t) => t.file === file);
      if (track) {
        const mins = Math.floor(tempAudio.duration / 60);
        const secs = Math.floor(tempAudio.duration % 60)
          .toString()
          .padStart(2, "0");
        track.duration = `${mins}:${secs}`;
        renderPlaylist();
      }
    });
  });

  renderPlaylist();

  if (currentPlaylistIndex === -1 && musicPlaylist.length > 0) {
    playPlaylistTrack(startIdx);
  }
}

function renderPlaylist() {
  const list = document.getElementById("playlist-tracks");
  const clearBtn = document.getElementById("playlist-clear-btn");
  if (!list) return;

  list.innerHTML = "";

  if (musicPlaylist.length === 0) {
    if (clearBtn) clearBtn.style.display = "none";
    list.innerHTML =
      '<li class="playlist-empty">Awaiting waveform input...</li>';
    document.getElementById("track-name").textContent =
      "ACOUSTIC VACUUM DETECTED";
    document.getElementById("track-artist").textContent =
      "AWAITING WAVEFORM INPUT";
    return;
  }

  if (clearBtn) clearBtn.style.display = "block";

  musicPlaylist.forEach((track, index) => {
    const li = document.createElement("li");
    li.className = "playlist-track";
    if (index === currentPlaylistIndex) li.classList.add("active");

    li.innerHTML = `
            <div class="track-info-left">
                <span class="track-number">${index + 1}.</span>
                <span class="track-title">${track.name}</span>
            </div>
            <div class="track-duration-right">
                <span class="track-duration">${track.duration}</span>
                <button class="track-remove" title="Remove track">✕</button>
            </div>
        `;

    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("track-remove")) {
        e.stopPropagation();
        removeTrack(index);
      } else {
        playPlaylistTrack(index);
      }
    });

    list.appendChild(li);
  });
}

function removeTrack(index) {
  musicPlaylist.splice(index, 1);
  if (musicPlaylist.length === 0) {
    currentPlaylistIndex = -1;
    stopMusic(true);
  } else if (index === currentPlaylistIndex) {
    if (index >= musicPlaylist.length) {
      playPlaylistTrack(0);
    } else {
      playPlaylistTrack(index);
    }
  } else if (index < currentPlaylistIndex) {
    currentPlaylistIndex--;
  }
  renderPlaylist();
}

function playPlaylistTrack(index) {
  if (index < 0 || index >= musicPlaylist.length) return;

  let sessions = NebulaState.getMusicSessions();
  safeSetItem("nebula_music_sessions", sessions + 1);
  NebulaState.unlockDiscovery("audio_engineer");

  const track = musicPlaylist[index];
  currentPlaylistIndex = index;
  renderPlaylist();

  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();

  stopMusic(false);

  const url = URL.createObjectURL(track.file);

  if (audioElement) {
    audioElement.pause();
    audioElement.src = "";
  }

  audioElement = new Audio(url);
  audioElement.crossOrigin = "anonymous";

  // Set up audio graph
  if (audioSource) audioSource.disconnect();
  audioSource = ctx.createMediaElementSource(audioElement);

  if (!audioAnalyser) audioAnalyser = ctx.createAnalyser();
  audioAnalyser.fftSize = 64;

  if (!audioGain) audioGain = ctx.createGain();
  const volSlider = document.getElementById("music-volume");
  audioGain.gain.value = volSlider ? volSlider.value / 100 : 0.7;

  audioSource.connect(audioAnalyser);
  audioAnalyser.connect(audioGain);
  audioGain.connect(ctx.destination);

  // Update UI
  const nameEl = document.getElementById("track-name");
  const artistEl = document.getElementById("track-artist");
  const dropHint = document.getElementById("vinyl-drop-hint");

  if (nameEl) nameEl.textContent = track.name;
  if (artistEl) artistEl.textContent = "LOCAL FILE";
  if (dropHint) dropHint.textContent = "▶ PLAYING";

  // Auto play
  audioElement
    .play()
    .then(() => {
      isAudioPlaying = true;
      const btn = document.getElementById("m-play");
      if (btn) btn.textContent = "⏸";
      document.getElementById("vinyl-record")?.classList.add("playing");
      document.getElementById("vinyl-arm")?.classList.add("playing");
      startRealVisualizer();
      updateMusicProgress();
    })
    .catch(() => {
      // Autoplay blocked
    });

  audioElement.addEventListener("ended", () => {
    if (musicPlaylist.length > 0) {
      let nextIdx = currentPlaylistIndex + 1;
      if (nextIdx >= musicPlaylist.length) nextIdx = 0;
      playPlaylistTrack(nextIdx);
    } else {
      stopMusic(true);
    }
  });

  audioElement.addEventListener("loadedmetadata", () => {
    musicDuration = audioElement.duration;
  });
}

function toggleMusicPlayback() {
  if (!audioElement || musicPlaylist.length === 0) {
    document.getElementById("music-file-input")?.click();
    return;
  }

  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();

  if (isAudioPlaying) {
    audioElement.pause();
    isAudioPlaying = false;
    const btn = document.getElementById("m-play");
    if (btn) btn.textContent = "▶";
    document.getElementById("vinyl-record")?.classList.remove("playing");
    document.getElementById("vinyl-arm")?.classList.remove("playing");
    if (musicAnimationId) cancelAnimationFrame(musicAnimationId);
  } else {
    audioElement.play();
    isAudioPlaying = true;
    const btn = document.getElementById("m-play");
    if (btn) btn.textContent = "⏸";
    document.getElementById("vinyl-record")?.classList.add("playing");
    document.getElementById("vinyl-arm")?.classList.add("playing");
    startRealVisualizer();
    updateMusicProgress();
  }
}

function updateMusicProgress() {
  if (!isAudioPlaying || !audioElement) return;

  const fill = document.getElementById("progress-fill");
  if (fill && musicDuration) {
    const pct = (audioElement.currentTime / musicDuration) * 100;
    fill.style.width = pct + "%";
  }

  requestAnimationFrame(updateMusicProgress);
}

function startRealVisualizer() {
  if (!audioAnalyser) return;

  const bars = document.querySelectorAll(".viz-bar");
  const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);

  function draw() {
    if (!isAudioPlaying) return;

    audioAnalyser.getByteFrequencyData(dataArray);

    bars.forEach((bar, i) => {
      const dataIndex = Math.floor((i / bars.length) * dataArray.length);
      const value = dataArray[dataIndex];
      const height = 4 + (value / 255) * 46;
      bar.style.height = height + "px";
      bar.classList.remove("active");
    });

    musicAnimationId = requestAnimationFrame(draw);
  }

  draw();
}

function stopMusic(fullReset = true) {
  isAudioPlaying = false;
  if (audioElement) {
    audioElement.pause();
    if (fullReset) audioElement.currentTime = 0;
  }
  if (musicAnimationId) cancelAnimationFrame(musicAnimationId);

  const btn = document.getElementById("m-play");
  if (btn) btn.textContent = "▶";
  document.getElementById("vinyl-record")?.classList.remove("playing");
  document.getElementById("vinyl-arm")?.classList.remove("playing");

  if (fullReset) {
    const fill = document.getElementById("progress-fill");
    if (fill) fill.style.width = "0%";

    document.querySelectorAll(".viz-bar").forEach((bar) => {
      bar.style.height = "6px";
      bar.classList.add("active");
    });

    const dropHint = document.getElementById("vinyl-drop-hint");
    if (dropHint) dropHint.textContent = "📁 DROP";
  }
}

let currentNoteEdited = false;
function initNotes() {
  const editor = document.querySelector(".notes-editor");
  if (editor) {
    const savedNotes = localStorage.getItem("nebula_notes_content");
    if (savedNotes) {
      editor.innerHTML = sanitizeHtml(savedNotes); // P2 fix: sanitize before restore
    }
    editor.addEventListener("input", () => {
      safeSetItem("nebula_notes_content", editor.innerHTML);
      if (!currentNoteEdited) {
        currentNoteEdited = true;
        let saves = NebulaState.getNotesCreated();
        safeSetItem("nebula_notes_created", saves + 1);
        NebulaState.unlockDiscovery("archivist");
      }
    });
  }

  document.querySelectorAll(".note-tool").forEach((tool) => {
    tool.addEventListener("click", () => {
      document.execCommand(tool.dataset.cmd, false, null);
      editor?.focus();
      if (editor) safeSetItem("nebula_notes_content", editor.innerHTML);
    });
  });
}

// ==================== PAINT ====================
let paintCtx = null;
let isPainting = false;
let paintColor = "#000000";
let paintSize = 5;
let currentPaintTool = "brush";
let paintStartX = 0;
let paintStartY = 0;
let paintHistory = [];
let paintTempImage = null;
let paintListenersBound = false;

function fillPaintWhite(canvas) {
  if (!paintCtx) return;
  paintCtx.fillStyle = "#ffffff";
  paintCtx.fillRect(0, 0, canvas.width, canvas.height);
}

function savePaintState() {
  const canvas = document.getElementById("paint-canvas");
  if (!canvas) return;
  if (paintHistory.length >= 15) paintHistory.shift();
  paintHistory.push(canvas.toDataURL());
  safeSetItem("nebula_paint_data", canvas.toDataURL());
}

function undoPaint() {
  if (paintHistory.length <= 1) return;
  paintHistory.pop();
  const previousState = paintHistory[paintHistory.length - 1];
  const canvas = document.getElementById("paint-canvas");
  const img = new Image();
  img.src = previousState;
  img.onload = () => {
    paintCtx.clearRect(0, 0, canvas.width, canvas.height);
    paintCtx.drawImage(img, 0, 0);
    safeSetItem("nebula_paint_data", previousState);
  };
}

function initPaint() {
  const canvas = document.getElementById("paint-canvas");
  if (!canvas) return;
  paintCtx = canvas.getContext("2d");

  function resizeCanvas() {
    if (!canvas.parentElement) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Save existing drawing
    let tempCanvas = null;
    if (canvas.width > 0 && canvas.height > 0) {
      tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext("2d").drawImage(canvas, 0, 0);
    }

    canvas.width = rect.width;
    canvas.height = rect.height;

    // Restore drawing
    if (tempCanvas) {
      paintCtx.drawImage(tempCanvas, 0, 0);
    } else {
      const saved = localStorage.getItem("nebula_paint_data");
      if (saved) {
        const img = new Image();
        img.src = saved;
        img.onload = () => {
          paintCtx.drawImage(img, 0, 0);
          paintHistory = [saved];
        };
      } else {
        fillPaintWhite(canvas);
        savePaintState();
      }
    }
  }

  resizeCanvas();

  if (paintListenersBound) return;
  paintListenersBound = true;

  // Use ResizeObserver to continuously track size changes
  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
  });
  resizeObserver.observe(canvas.parentElement);

  canvas.addEventListener("mousedown", startPosition);
  canvas.addEventListener("mouseup", endPosition);
  canvas.addEventListener("mousemove", drawPaint);
  canvas.addEventListener("mouseleave", endPosition);

  document.querySelectorAll(".paint-color").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".paint-color")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      paintColor = e.target.dataset.color;
    });
  });

  document.getElementById("brush-size")?.addEventListener("input", (e) => {
    paintSize = e.target.value;
  });

  document.getElementById("paint-clear")?.addEventListener("click", () => {
    fillPaintWhite(canvas);
    savePaintState();
  });

  document.querySelectorAll(".paint-btn[data-tool]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".paint-btn[data-tool]")
        .forEach((b) => b.classList.remove("active"));
      const target = e.target.closest(".paint-btn");
      target.classList.add("active");
      currentPaintTool = target.dataset.tool;
    });
  });

  document.getElementById("paint-undo")?.addEventListener("click", undoPaint);

  document.getElementById("paint-save")?.addEventListener("click", () => {
    let saves = NebulaState.getPaintSaves();
    safeSetItem("nebula_paint_saves", saves + 1);

    const link = document.createElement("a");
    link.download = "nebula_art.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    if (typeof showNotification === "function")
      showNotification("Reality Archive Saved", "success");
    NebulaState.unlockDiscovery("cosmic_artist");
  });

  document.addEventListener("keydown", (e) => {
    const win = document.getElementById("window-paint");
    if (e.ctrlKey && e.key === "z" && win && win.classList.contains("active")) {
      undoPaint();
    }
  });
}

function getPaintCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function startPosition(e) {
  isPainting = true;
  const coords = getPaintCoords(e, e.target);
  paintStartX = coords.x;
  paintStartY = coords.y;

  paintTempImage = new Image();
  paintTempImage.src = e.target.toDataURL();

  if (currentPaintTool === "brush") {
    paintCtx.beginPath();
    paintCtx.moveTo(paintStartX, paintStartY);
    drawPaint(e);
  }
}

function endPosition() {
  if (!isPainting) return;
  isPainting = false;
  paintCtx.beginPath();
  savePaintState();
}

function drawPaint(e) {
  if (!isPainting) return;
  const canvas = e.target;
  const coords = getPaintCoords(e, canvas);

  paintCtx.lineWidth = paintSize;
  paintCtx.lineCap = "round";
  paintCtx.lineJoin = "round";
  paintCtx.strokeStyle = paintColor;
  paintCtx.fillStyle = paintColor;

  if (currentPaintTool === "brush") {
    paintCtx.lineTo(coords.x, coords.y);
    paintCtx.stroke();
    paintCtx.beginPath();
    paintCtx.moveTo(coords.x, coords.y);
  } else {
    if (paintTempImage && paintTempImage.complete) {
      paintCtx.clearRect(0, 0, canvas.width, canvas.height);
      paintCtx.drawImage(paintTempImage, 0, 0);
    }

    paintCtx.beginPath();
    if (currentPaintTool === "line") {
      paintCtx.moveTo(paintStartX, paintStartY);
      paintCtx.lineTo(coords.x, coords.y);
    } else if (currentPaintTool === "rect") {
      paintCtx.rect(
        paintStartX,
        paintStartY,
        coords.x - paintStartX,
        coords.y - paintStartY,
      );
    } else if (currentPaintTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(coords.x - paintStartX, 2) +
          Math.pow(coords.y - paintStartY, 2),
      );
      paintCtx.arc(paintStartX, paintStartY, radius, 0, 2 * Math.PI);
    }
    paintCtx.stroke();
  }
}

// ==================== SNAKE GAME ====================
let gCtx = null;
let snake = [];
let food = {};
let gDir = "right";
let gNext = "right";
let gScore = 0;
let gHigh = safeInt("nebula_snake_high", 0);
let gLoop = null;
let gSpeed = 130;
let gRunning = false;

let gameListenersBound = false;
function initGame() {
  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;

  const wrap = canvas.parentElement;
  const rawSize = Math.min(wrap.clientWidth - 6, wrap.clientHeight - 6, 300);
  const size = Math.floor(rawSize / 15) * 15;
  canvas.width = size;
  canvas.height = size;

  gCtx = canvas.getContext("2d");
  const highEl = document.getElementById("game-high");
  if (highEl) highEl.textContent = gHigh;
  drawGame();

  if (gameListenersBound) return;
  gameListenersBound = true;

  document.getElementById("game-start")?.addEventListener("click", startGame);
  document.getElementById("game-stop")?.addEventListener("click", stopGame);

  document.addEventListener("keydown", (e) => {
    if (!gRunning) return;
    switch (e.key) {
      case "ArrowUp":
        if (gDir !== "down") gNext = "up";
        break;
      case "ArrowDown":
        if (gDir !== "up") gNext = "down";
        break;
      case "ArrowLeft":
        if (gDir !== "right") gNext = "left";
        break;
      case "ArrowRight":
        if (gDir !== "left") gNext = "right";
        break;
    }
  });
}

function resetGameUI() {
  gScore = 0;
  const scoreEl = document.getElementById("game-score");
  if (scoreEl) scoreEl.textContent = "0";
  const startBtn = document.getElementById("game-start");
  const stopBtn = document.getElementById("game-stop");
  if (startBtn) startBtn.style.display = "inline-block";
  if (stopBtn) stopBtn.style.display = "none";
  if (gLoop) {
    clearInterval(gLoop);
    gLoop = null;
  }
  gRunning = false;
}

function startGame() {
  if (gRunning) return;

  const canvas = document.getElementById("game-canvas");
  if (!canvas) return;
  const grid = 15;
  const tiles = Math.floor(canvas.width / grid);

  snake = [{ x: Math.floor(tiles / 2), y: Math.floor(tiles / 2) }];
  gDir = "right";
  gNext = "right";
  gScore = 0;
  gSpeed = 130;
  gRunning = true;

  const scoreEl = document.getElementById("game-score");
  if (scoreEl) scoreEl.textContent = "0";
  const startBtn = document.getElementById("game-start");
  const stopBtn = document.getElementById("game-stop");
  if (startBtn) startBtn.style.display = "none";
  if (stopBtn) stopBtn.style.display = "inline-block";

  placeFood(tiles);

  if (gLoop) clearInterval(gLoop);
  gLoop = setInterval(() => gameStep(tiles, grid), gSpeed);
}

function stopGame() {
  gRunning = false;
  if (gLoop) {
    clearInterval(gLoop);
    gLoop = null;
  }
  const startBtn = document.getElementById("game-start");
  const stopBtn = document.getElementById("game-stop");
  if (startBtn) startBtn.style.display = "inline-block";
  if (stopBtn) stopBtn.style.display = "none";
  snake = [];
  drawGame();
}

function placeFood(tiles) {
  do {
    food = {
      x: Math.floor(Math.random() * tiles),
      y: Math.floor(Math.random() * tiles),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
}

function gameStep(tiles, grid) {
  gDir = gNext;
  const head = { ...snake[0] };

  switch (gDir) {
    case "up":
      head.y--;
      break;
    case "down":
      head.y++;
      break;
    case "left":
      head.x--;
      break;
    case "right":
      head.x++;
      break;
  }

  if (head.x < 0) head.x = tiles - 1;
  if (head.x >= tiles) head.x = 0;
  if (head.y < 0) head.y = tiles - 1;
  if (head.y >= tiles) head.y = 0;

  if (snake.some((s) => s.x === head.x && s.y === head.y)) {
    gameOver();
    if (typeof showNotification === "function")
      showNotification("Temporal Worm terminated.", "warning");
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    gScore += 10;
    const scoreEl = document.getElementById("game-score");
    if (scoreEl) scoreEl.textContent = gScore;
    if (gScore > gHigh) {
      gHigh = gScore;
      const highEl = document.getElementById("game-high");
      if (highEl) highEl.textContent = gHigh;
      safeSetItem("nebula_snake_high", gHigh);
    }
    placeFood(tiles);
    if (gSpeed > 60) {
      gSpeed -= 3;
      clearInterval(gLoop);
      gLoop = setInterval(() => gameStep(tiles, grid), gSpeed);
    }
  } else {
    snake.pop();
  }

  drawGame(grid);
}

function drawGame(grid = 15) {
  if (!gCtx) return;
  const canvas = gCtx.canvas;

  gCtx.fillStyle = "#191A1F";
  gCtx.fillRect(0, 0, canvas.width, canvas.height);

  gCtx.strokeStyle = "rgba(255,255,255,0.03)";
  gCtx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += grid) {
    gCtx.beginPath();
    gCtx.moveTo(i, 0);
    gCtx.lineTo(i, canvas.height);
    gCtx.stroke();
    gCtx.beginPath();
    gCtx.moveTo(0, i);
    gCtx.lineTo(canvas.width, i);
    gCtx.stroke();
  }

  snake.forEach((seg, i) => {
    gCtx.fillStyle = i === 0 ? "#00FFAB" : "#38E54D";
    gCtx.fillRect(seg.x * grid + 1, seg.y * grid + 1, grid - 2, grid - 2);
    if (i === 0) {
      gCtx.fillStyle = "#000";
      gCtx.fillRect(seg.x * grid + 4, seg.y * grid + 4, 3, 3);
      gCtx.fillRect(seg.x * grid + 9, seg.y * grid + 4, 3, 3);
    }
  });

  gCtx.fillStyle = "#FF004D";
  gCtx.beginPath();
  gCtx.arc(
    food.x * grid + grid / 2,
    food.y * grid + grid / 2,
    grid / 2 - 2,
    0,
    Math.PI * 2,
  );
  gCtx.fill();
}

function gameOver() {
  gRunning = false;
  clearInterval(gLoop);
  gLoop = null;

  const canvas = gCtx.canvas;
  gCtx.fillStyle = "rgba(255,0,77,0.3)";
  gCtx.fillRect(0, 0, canvas.width, canvas.height);

  setTimeout(() => {
    const startBtn = document.getElementById("game-start");
    const stopBtn = document.getElementById("game-stop");
    if (startBtn) startBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";
    snake = [];
    drawGame();
  }, 1000);
}

// ==================== TOAST NOTIFICATIONS ====================
function showNotification(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "🔔";
  if (type === "error") icon = "⚠️";
  if (type === "warning") icon = "⚡";
  if (type === "success") icon = "💾";

  toast.innerHTML = `<span class="toast-icon">${icon}</span> <span class="toast-content">${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("leaving");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 5000);
}

window.addEventListener("beforeunload", () => {
  if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
});
