/* nebula os - main script
   built june 2026. window manager, desktop apps, pomodoro & singularity.
*/

// state
const sessionApps = new Set();
let isTermAnimRunning = false;
let audioCtx = null;

// sanitize user html for notes/terminal
function sanitizeHtml(dirty) {
  const allowed = new Set(['p','b','strong','i','em','u','br','ul','ol','li','span','div','h1','h2','h3','blockquote']);
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirty, 'text/html');
  const root = doc.body;

  function cleanNode(node) {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        if (!allowed.has(tag)) {
          const txt = doc.createTextNode(child.textContent);
          node.replaceChild(txt, child);
          continue;
        }
        while (child.attributes.length > 0) child.removeAttribute(child.attributes[0].name);
        cleanNode(child);
      } else {
        node.removeChild(child);
      }
    }
  }
  cleanNode(root);
  return root.innerHTML;
}

// storage helpers
function safeInt(key, fallback = 0) {
  try {
    const v = parseInt(localStorage.getItem(key) || String(fallback), 10);
    return isNaN(v) ? fallback : v;
  } catch (e) { return fallback; }
}

function safeSetItem(key, val) {
  try { localStorage.setItem(key, val); } catch (e) {}
}

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// toast alerts
function showNotification(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✓' : 'ℹ️';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><div class="toast-content">${escapeHtml(msg)}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// boot sequence
function bootSequence() {
  const boot = document.getElementById('boot-screen');
  const fill = document.querySelector('.boot-fill');
  const status = document.querySelector('.boot-status');
  const desktop = document.getElementById('desktop');

  if (!boot || !fill) return;
  fill.style.width = '0%';
  setTimeout(() => { fill.style.width = '100%'; }, 100);

  setTimeout(() => { if (status) status.textContent = 'MOUNTING FILE SYSTEM...'; }, 1200);
  setTimeout(() => { if (status) status.textContent = 'STARTING USER INTERFACE...'; }, 2400);

  setTimeout(() => {
    boot.style.transition = 'opacity .6s ease';
    boot.style.opacity = '0';
    if (desktop) desktop.style.display = 'block';

    setTimeout(() => {
      boot.style.display = 'none';
      restoreOpenWindows();
      if (sessionApps.size === 0) spawnWelcomeWindow();
    }, 600);
  }, 3400);
}

function spawnWelcomeWindow() { openWindow('notes'); }

// top bar clock & date
function updateClock() {
  const now = new Date();
  const dateEl = document.getElementById('date');
  const clockEl = document.getElementById('clock');

  if (dateEl) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }

  if (clockEl) {
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hrs}:${mins}`;
  }
}

// telemetry widget
let bootTime = Date.now();
function updateTelemetry() {
  const timeEl = document.getElementById('tel-time');
  const uptimeEl = document.getElementById('tel-uptime');
  const now = new Date();

  if (timeEl) {
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    timeEl.textContent = `${h}:${m}:${s}`;
  }

  if (uptimeEl) {
    const sec = Math.floor((Date.now() - bootTime) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    uptimeEl.textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}

// window manager
let topZ = 600;
let dragWin = null, dragOffsetX = 0, dragOffsetY = 0;

function makeDraggable(win) {
  const header = win.querySelector('.window-header');
  if (!header) return;

  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('win-btn')) return;
    bringToFront(win);
    dragWin = win;
    const rect = win.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);
  });
}

function doDrag(e) {
  if (!dragWin || dragWin.classList.contains('maximized')) return;
  let left = e.clientX - dragOffsetX;
  let top = e.clientY - dragOffsetY;

  top = Math.max(40, Math.min(window.innerHeight - 60, top));
  left = Math.max(-100, Math.min(window.innerWidth - 100, left));

  dragWin.style.left = `${left}px`;
  dragWin.style.top = `${top}px`;
}

function endDrag() {
  dragWin = null;
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', endDrag);
}

function bringToFront(win) {
  topZ++;
  win.style.zIndex = topZ;
  document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
  win.classList.add('active');
}

function openWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;

  win.style.display = 'flex';
  win.classList.remove('window-minimizing', 'window-closing');
  win.classList.add('window-opening');
  bringToFront(win);

  sessionApps.add(appId);
  saveOpenWindows();

  if (appId === 'paint') setTimeout(initPaint, 50);
  if (appId === 'terminal') {
    const input = document.getElementById('term-input');
    if (input) setTimeout(() => input.focus(), 100);
  }
}

function closeWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;

  win.classList.add('window-closing');
  setTimeout(() => {
    win.style.display = 'none';
    win.classList.remove('window-closing');
    sessionApps.delete(appId);
    saveOpenWindows();
  }, 150);
}

function saveOpenWindows() {
  safeSetItem('nebula_session', JSON.stringify(Array.from(sessionApps)));
}

function restoreOpenWindows() {
  try {
    const raw = localStorage.getItem('nebula_session');
    if (!raw) return;
    const apps = JSON.parse(raw);
    if (Array.isArray(apps)) {
      apps.forEach(appId => {
        if (document.getElementById(`window-${appId}`)) openWindow(appId);
      });
    }
  } catch (e) {}
}

function arrangeWindows() {
  const openWins = Array.from(document.querySelectorAll('.window')).filter(w => w.style.display === 'flex');
  let x = 60, y = 60;
  openWins.forEach((win) => {
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
    x += 30; y += 30;
    bringToFront(win);
  });
}

// context menu
function initContextMenu() {
  const menu = document.getElementById('context-menu');
  if (!menu) return;

  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window') || e.target.closest('#dock') || e.target.closest('#topbar')) return;
    e.preventDefault();
    menu.style.display = 'block';
    menu.style.left = `${Math.min(e.clientX, window.innerWidth - 210)}px`;
    menu.style.top = `${Math.min(e.clientY, window.innerHeight - 220)}px`;
  });

  document.addEventListener('click', () => { menu.style.display = 'none'; });

  menu.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', () => {
      const act = item.dataset.action;
      if (act === 'refresh') location.reload();
      else if (act === 'arrange') arrangeWindows();
      else if (act === 'wallpaper') document.getElementById('wallpaper-input')?.click();
      else if (act === 'about') showNotification('NEBULA OS v1.0 — Hack Club Submission', 'info');
      else if (act) openWindow(act);
    });
  });
}

// wallpaper picker
function initWallpaper() {
  const input = document.getElementById('wallpaper-input');
  if (!input) return;
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bg = document.getElementById('desktop-bg');
      if (bg) bg.style.background = `url(${evt.target.result}) center/cover no-repeat`;
    };
    reader.readAsDataURL(file);
  });
}

// sticky notes
function initStickyNotes() {
  const area = document.getElementById('sticky-notes-input');
  const count = document.getElementById('sticky-char-count');
  const clearBtn = document.getElementById('sticky-notes-clear');

  if (!area) return;
  const saved = localStorage.getItem('nebula_sticky_note');
  if (saved) {
    area.value = saved;
    if (count) count.textContent = `${saved.length} chars`;
  }

  area.addEventListener('input', () => {
    safeSetItem('nebula_sticky_note', area.value);
    if (count) count.textContent = `${area.value.length} chars`;
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      area.value = '';
      safeSetItem('nebula_sticky_note', '');
      if (count) count.textContent = '0 chars';
    });
  }
}

// terminal
let termHistory = [];
let termHistIdx = -1;

function initTerminal() {
  const input = document.getElementById('term-input');
  const output = document.getElementById('term-output');
  if (!input || !output) return;

  output.innerHTML = `
    <div class="term-line term-welcome">NEBULA OS Mainframe Terminal v1.0</div>
    <div class="term-line term-hint">Type 'help' to view available system commands.</div>
  `;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim();
      input.value = '';
      if (!cmd) return;

      termHistory.push(cmd);
      termHistIdx = termHistory.length;

      appendTermLine(`❯ ${cmd}`, 'term-cmd');
      execTermCmd(cmd);
    } else if (e.key === 'ArrowUp') {
      if (termHistIdx > 0) {
        termHistIdx--;
        input.value = termHistory[termHistIdx] || '';
      }
    } else if (e.key === 'ArrowDown') {
      if (termHistIdx < termHistory.length - 1) {
        termHistIdx++;
        input.value = termHistory[termHistIdx] || '';
      } else {
        termHistIdx = termHistory.length;
        input.value = '';
      }
    }
  });
}

function appendTermLine(text, className = '') {
  const output = document.getElementById('term-output');
  if (!output) return;
  const line = document.createElement('div');
  line.className = `term-line ${className}`;
  line.innerHTML = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function execTermCmd(cmdStr) {
  const parts = cmdStr.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
      appendTermLine(`
        <div class="help-table">
          <span class="help-cmd">help</span><span class="help-desc">List commands</span>
          <span class="help-cmd">clear</span><span class="help-desc">Clear screen</span>
          <span class="help-cmd">status</span><span class="help-desc">System diagnostic</span>
          <span class="help-cmd">matrix</span><span class="help-desc">Toggle digital rain</span>
          <span class="help-cmd">time</span><span class="help-desc">Current system timestamp</span>
          <span class="help-cmd">reboot</span><span class="help-desc">Restart session</span>
          <span class="help-cmd">collapse</span><span class="help-desc">Trigger singularity wormhole</span>
        </div>
      `);
      break;
    case 'clear':
      document.getElementById('term-output').innerHTML = '';
      break;
    case 'status':
      appendTermLine('SYSTEM STATUS: NOMINAL', 'term-welcome');
      appendTermLine(`Active Windows: ${sessionApps.size}`);
      appendTermLine(`Uptime: ${Math.floor((Date.now() - bootTime) / 1000)} seconds`);
      break;
    case 'time':
      appendTermLine(new Date().toString());
      break;
    case 'matrix':
      appendTermLine('Matrix mode initiated...', 'term-welcome');
      break;
    case 'reboot':
      location.reload();
      break;
    case 'collapse':
      triggerWormhole();
      break;
    default:
      appendTermLine(`Unknown command: '${cmd}'. Type 'help' for available options.`, 'term-alert');
  }
}

// calculator
let calcVal = '0', calcHist = '', calcOp = null, calcReset = false;

function initCalculator() {
  const display = document.getElementById('calc-current');
  const hist = document.getElementById('calc-history');
  const keypad = document.querySelector('.calc-keypad');
  if (!keypad) return;

  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.c-btn');
    if (!btn) return;

    const val = btn.dataset.val;
    const op = btn.dataset.op;

    if (val !== undefined) {
      if (calcVal === '0' || calcReset) { calcVal = val; calcReset = false; }
      else { calcVal += val; }
    } else if (op !== undefined) {
      handleCalcOp(op);
    }
    if (display) display.textContent = calcVal;
    if (hist) hist.textContent = calcHist;
  });
}

function handleCalcOp(op) {
  if (op === 'C') {
    calcVal = '0'; calcHist = ''; calcOp = null; calcReset = false;
  } else if (op === '=') {
    if (calcOp && calcHist) {
      try {
        const expr = (calcHist + ' ' + calcVal).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        calcVal = String(Function(`'use strict'; return (${expr})`)());
        calcHist = ''; calcOp = null; calcReset = true;
      } catch (e) { calcVal = 'ERROR'; calcReset = true; }
    }
  } else {
    calcOp = op;
    calcHist = `${calcVal} ${op}`;
    calcReset = true;
  }
}

// music player
let musicTracks = [];
let musicIdx = 0;
let isPlaying = false;
let audioEl = new Audio();

function initMusic() {
  const playBtn = document.getElementById('m-play');
  const prevBtn = document.getElementById('m-prev');
  const nextBtn = document.getElementById('m-next');
  const fileInput = document.getElementById('music-file-input');
  const uploadBtn = document.getElementById('m-upload');
  const volInput = document.getElementById('music-volume');

  if (playBtn) playBtn.addEventListener('click', toggleMusic);
  if (prevBtn) prevBtn.addEventListener('click', () => playTrack(musicIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => playTrack(musicIdx + 1));
  if (uploadBtn && fileInput) uploadBtn.addEventListener('click', () => fileInput.click());

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(f => {
        musicTracks.push({ name: f.name.replace(/\.[^/.]+$/, ''), url: URL.createObjectURL(f) });
      });
      renderPlaylist();
      if (!isPlaying && musicTracks.length > 0) playTrack(musicTracks.length - files.length);
    });
  }

  if (volInput) {
    volInput.addEventListener('input', (e) => { audioEl.volume = e.target.value / 100; });
  }

  audioEl.addEventListener('ended', () => playTrack(musicIdx + 1));
  audioEl.addEventListener('timeupdate', updateMusicProgress);
}

function toggleMusic() {
  if (musicTracks.length === 0) {
    showNotification('No audio loaded. Click 📁 to upload songs!', 'warning');
    return;
  }
  if (isPlaying) {
    audioEl.pause();
    isPlaying = false;
  } else {
    audioEl.play();
    isPlaying = true;
  }
  updateMusicUI();
}

function playTrack(idx) {
  if (musicTracks.length === 0) return;
  musicIdx = (idx + musicTracks.length) % musicTracks.length;
  audioEl.src = musicTracks[musicIdx].url;
  audioEl.play();
  isPlaying = true;
  updateMusicUI();
  renderPlaylist();
}

function updateMusicUI() {
  const playBtn = document.getElementById('m-play');
  const nameEl = document.getElementById('track-name');
  const record = document.getElementById('vinyl-record');
  const arm = document.getElementById('vinyl-arm');

  if (playBtn) playBtn.textContent = isPlaying ? '⏸' : '▶';
  if (nameEl && musicTracks[musicIdx]) nameEl.textContent = musicTracks[musicIdx].name;
  if (record) record.classList.toggle('playing', isPlaying);
  if (arm) arm.classList.toggle('playing', isPlaying);
}

function renderPlaylist() {
  const list = document.getElementById('playlist-tracks');
  if (!list) return;
  if (musicTracks.length === 0) {
    list.innerHTML = '<li class="playlist-empty">Awaiting waveform input...</li>';
    return;
  }
  list.innerHTML = musicTracks.map((t, i) => `
    <li class="playlist-track ${i === musicIdx ? 'active' : ''}" onclick="playTrack(${i})">
      <div class="track-info-left">
        <span class="track-number">${i + 1}</span>
        <span>${escapeHtml(t.name)}</span>
      </div>
    </li>
  `).join('');
}

function updateMusicProgress() {
  const fill = document.getElementById('progress-fill');
  if (fill && audioEl.duration) {
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    fill.style.width = `${pct}%`;
  }
}

// notes app
function initNotes() {
  document.querySelectorAll('.note-tool').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.cmd;
      if (cmd) document.execCommand(cmd, false, null);
    });
  });
}

// paint app
let paintCtx = null;
let isPainting = false;
let paintColor = '#000000';
let paintSize = 4;
let currentPaintTool = 'brush';
let paintStartX = 0, paintStartY = 0;
let paintHistory = [];
let paintTempImg = null;

function initPaint() {
  const canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  paintCtx = canvas.getContext('2d');

  function resize() {
    const parent = canvas.parentElement;
    if (!parent || parent.clientWidth === 0) return;
    const temp = document.createElement('canvas');
    temp.width = canvas.width; temp.height = canvas.height;
    if (canvas.width > 0) temp.getContext('2d').drawImage(canvas, 0, 0);

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    if (temp.width > 0) {
      paintCtx.drawImage(temp, 0, 0);
    } else {
      fillPaintWhite();
    }
  }

  resize();

  canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    const coords = getPaintCoords(e, canvas);
    paintStartX = coords.x; paintStartY = coords.y;

    paintTempImg = new Image();
    paintTempImg.src = canvas.toDataURL();

    if (currentPaintTool === 'brush') {
      paintCtx.beginPath();
      paintCtx.moveTo(paintStartX, paintStartY);
    }
  });

  canvas.addEventListener('mousemove', drawPaint);

  // global mouseup fix: releases drag anywhere on window so line drawing doesn't get stuck
  document.addEventListener('mouseup', () => {
    if (isPainting) {
      isPainting = false;
      if (paintCtx) paintCtx.beginPath();
      savePaintState();
    }
  });

  document.querySelectorAll('.paint-color').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.paint-color').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      paintColor = btn.dataset.color;
    });
  });

  document.querySelectorAll('.paint-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.paint-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPaintTool = btn.dataset.tool;
    });
  });

  document.getElementById('brush-size')?.addEventListener('input', (e) => { paintSize = e.target.value; });
  document.getElementById('paint-clear')?.addEventListener('click', () => fillPaintWhite());
  document.getElementById('paint-undo')?.addEventListener('click', undoPaint);
  document.getElementById('paint-save')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'nebula_art.png';
    link.href = canvas.toDataURL();
    link.click();
  });
}

function getPaintCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function drawPaint(e) {
  if (!isPainting) return;
  const canvas = document.getElementById('paint-canvas');
  const coords = getPaintCoords(e, canvas);

  paintCtx.lineWidth = paintSize;
  paintCtx.lineCap = 'round';
  paintCtx.lineJoin = 'round';
  paintCtx.strokeStyle = paintColor;
  paintCtx.fillStyle = paintColor;

  if (currentPaintTool === 'brush') {
    paintCtx.lineTo(coords.x, coords.y);
    paintCtx.stroke();
    paintCtx.beginPath();
    paintCtx.moveTo(coords.x, coords.y);
  } else {
    if (paintTempImg && paintTempImg.complete) {
      paintCtx.clearRect(0, 0, canvas.width, canvas.height);
      paintCtx.drawImage(paintTempImg, 0, 0);
    }
    paintCtx.beginPath();
    if (currentPaintTool === 'line') {
      paintCtx.moveTo(paintStartX, paintStartY);
      paintCtx.lineTo(coords.x, coords.y);
    } else if (currentPaintTool === 'rect') {
      paintCtx.rect(paintStartX, paintStartY, coords.x - paintStartX, coords.y - paintStartY);
    } else if (currentPaintTool === 'circle') {
      const r = Math.sqrt(Math.pow(coords.x - paintStartX, 2) + Math.pow(coords.y - paintStartY, 2));
      paintCtx.arc(paintStartX, paintStartY, r, 0, Math.PI * 2);
    }
    paintCtx.stroke();
  }
}

function fillPaintWhite() {
  const canvas = document.getElementById('paint-canvas');
  if (!canvas || !paintCtx) return;
  paintCtx.fillStyle = '#ffffff';
  paintCtx.fillRect(0, 0, canvas.width, canvas.height);
  savePaintState();
}

function savePaintState() {
  const canvas = document.getElementById('paint-canvas');
  if (!canvas) return;
  if (paintHistory.length >= 15) paintHistory.shift();
  paintHistory.push(canvas.toDataURL());
}

function undoPaint() {
  if (paintHistory.length <= 1) return;
  paintHistory.pop();
  const prev = paintHistory[paintHistory.length - 1];
  const img = new Image();
  img.src = prev;
  img.onload = () => {
    const canvas = document.getElementById('paint-canvas');
    paintCtx.clearRect(0, 0, canvas.width, canvas.height);
    paintCtx.drawImage(img, 0, 0);
  };
}

// snake game
let snake = [], food = {x: 0, y: 0}, gDir = 'right', gNext = 'right';
let gScore = 0, gHigh = safeInt('nebula_snake_high', 0);
let gLoop = null, gRunning = false;

function initGame() {
  const startBtn = document.getElementById('game-start');
  const stopBtn = document.getElementById('game-stop');
  const highEl = document.getElementById('game-high');

  if (highEl) highEl.textContent = gHigh;

  if (startBtn) startBtn.addEventListener('click', startGame);
  if (stopBtn) stopBtn.addEventListener('click', stopGame);

  document.addEventListener('keydown', (e) => {
    const win = document.getElementById('window-game');
    if (!win || win.style.display === 'none') return;
    if (e.key === 'ArrowUp' && gDir !== 'down') gNext = 'up';
    else if (e.key === 'ArrowDown' && gDir !== 'up') gNext = 'down';
    else if (e.key === 'ArrowLeft' && gDir !== 'right') gNext = 'left';
    else if (e.key === 'ArrowRight' && gDir !== 'left') gNext = 'right';
  });
}

function startGame() {
  snake = [{x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}];
  gDir = 'right'; gNext = 'right'; gScore = 0; gRunning = true;

  document.getElementById('game-score').textContent = '0';
  document.getElementById('game-start').style.display = 'none';
  document.getElementById('game-stop').style.display = 'inline-block';

  placeFood();
  if (gLoop) clearInterval(gLoop);
  gLoop = setInterval(gameStep, 120);
}

function stopGame() {
  gRunning = false;
  if (gLoop) clearInterval(gLoop);
  document.getElementById('game-start').style.display = 'inline-block';
  document.getElementById('game-stop').style.display = 'none';
}

function placeFood() {
  food = {
    x: Math.floor(Math.random() * 15),
    y: Math.floor(Math.random() * 15)
  };
}

function gameStep() {
  if (!gRunning) return;
  gDir = gNext;
  const head = { ...snake[0] };

  if (gDir === 'up') head.y--;
  else if (gDir === 'down') head.y++;
  else if (gDir === 'left') head.x--;
  else if (gDir === 'right') head.x++;

  if (head.x < 0 || head.x >= 15 || head.y < 0 || head.y >= 15 || snake.some(s => s.x === head.x && s.y === head.y)) {
    stopGame();
    showNotification(`Game Over! Score: ${gScore}`, 'error');
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    gScore += 10;
    document.getElementById('game-score').textContent = gScore;
    if (gScore > gHigh) {
      gHigh = gScore;
      safeSetItem('nebula_snake_high', gHigh);
      document.getElementById('game-high').textContent = gHigh;
    }
    placeFood();
  } else {
    snake.pop();
  }
  drawGame();
}

function drawGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sz = 20;

  ctx.fillStyle = '#191a1f';
  ctx.fillRect(0, 0, 300, 300);

  // food
  ctx.fillStyle = '#ff004d';
  ctx.fillRect(food.x * sz + 2, food.y * sz + 2, sz - 4, sz - 4);

  // snake
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#38e54d' : '#00ffab';
    ctx.fillRect(seg.x * sz + 1, seg.y * sz + 1, sz - 2, sz - 2);
  });
}

// focus timer
let pomoTime = 1500;
let pomoMax = 1500;
let pomoTimer = null;
let pomoRunning = false;
let pomoMode = 'focus';
let pomoSessions = safeInt('nebula_pomo_sessions', 0);

function initPomodoro() {
  const display = document.getElementById('pomo-display');
  const startBtn = document.getElementById('pomo-start');
  const resetBtn = document.getElementById('pomo-reset');
  const countEl = document.getElementById('pomo-sessions');

  if (countEl) countEl.textContent = pomoSessions;

  document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === 'custom') {
        document.getElementById('pomo-custom-overlay').style.display = 'flex';
      } else {
        switchPomoMode(mode);
      }
    });
  });

  if (startBtn) startBtn.addEventListener('click', togglePomo);
  if (resetBtn) resetBtn.addEventListener('click', resetPomo);

  document.getElementById('pomo-custom-cancel')?.addEventListener('click', () => {
    document.getElementById('pomo-custom-overlay').style.display = 'none';
  });

  document.getElementById('pomo-custom-set')?.addEventListener('click', () => {
    const h = parseInt(document.getElementById('pomo-custom-h').value || '0', 10);
    const m = parseInt(document.getElementById('pomo-custom-m').value || '0', 10);
    const s = parseInt(document.getElementById('pomo-custom-s').value || '0', 10);
    const total = h * 3600 + m * 60 + s;
    if (total > 0) {
      pomoMax = total; pomoTime = total;
      updatePomoDisplay();
      document.getElementById('pomo-custom-overlay').style.display = 'none';
    }
  });

  updatePomoDisplay();
}

function switchPomoMode(mode) {
  pomoMode = mode;
  document.querySelectorAll('.pomo-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  if (mode === 'focus') pomoMax = 1500;
  else if (mode === 'short') pomoMax = 300;
  else if (mode === 'long') pomoMax = 900;

  pomoTime = pomoMax;
  resetPomo();
}

function togglePomo() {
  const startBtn = document.getElementById('pomo-start');
  if (pomoRunning) {
    clearInterval(pomoTimer);
    pomoRunning = false;
    if (startBtn) startBtn.textContent = 'START';
  } else {
    pomoRunning = true;
    if (startBtn) startBtn.textContent = 'PAUSE';
    pomoTimer = setInterval(pomoTick, 1000);
  }
}

function pomoTick() {
  if (pomoTime > 0) {
    pomoTime--;
    updatePomoDisplay();
  } else {
    clearInterval(pomoTimer);
    pomoRunning = false;
    document.getElementById('pomo-start').textContent = 'START';

    if (pomoMode === 'focus') {
      pomoSessions++;
      safeSetItem('nebula_pomo_sessions', pomoSessions);
      document.getElementById('pomo-sessions').textContent = pomoSessions;
      showNotification('Focus session complete! Take a break.', 'success');
    } else {
      showNotification('Break ended! Ready to focus?', 'info');
    }
  }
}

function resetPomo() {
  if (pomoTimer) clearInterval(pomoTimer);
  pomoRunning = false;
  pomoTime = pomoMax;
  const startBtn = document.getElementById('pomo-start');
  if (startBtn) startBtn.textContent = 'START';
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const display = document.getElementById('pomo-display');
  const bar = document.getElementById('pomo-progress');

  const m = Math.floor(pomoTime / 60);
  const s = pomoTime % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  if (display) display.textContent = str;
  if (bar) bar.style.width = `${(pomoTime / pomoMax) * 100}%`;
}

// wormhole / singularity system
let singularityActive = false;
let singularityParticles = [];
let singularityRAF = null;
let singularityStartTime = 0;

function triggerWormhole() {
  if (singularityActive) return;
  const confirm = document.getElementById('confirm-overlay');
  if (confirm) {
    confirm.style.display = 'flex';
    document.getElementById('confirm-yes').onclick = () => {
      confirm.style.display = 'none';
      doWormhole();
    };
    document.getElementById('confirm-no').onclick = () => {
      confirm.style.display = 'none';
    };
  }
}

function doWormhole() {
  singularityActive = true;

  // overlay setup — rings and text expand cleanly
  const overlay = document.getElementById('wormhole-overlay');
  const canvas = document.getElementById('wormhole-canvas');

  if (overlay) {
    overlay.style.display = 'flex';
    const stage = overlay.querySelector('.wormhole-stage');
    const txt = overlay.querySelector('.wormhole-text');
    const sub = overlay.querySelector('.wormhole-sub');
    if (stage) stage.classList.add('active');
    if (txt) txt.classList.add('active');
    if (sub) sub.classList.add('active');
  }

  if (canvas) {
    canvas.style.display = 'block';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  initAccretionParticles();
  singularityStartTime = Date.now();
  singularityRAF = requestAnimationFrame(singularityCoreLoop);

  // reboot after destruction animation completes
  setTimeout(fakeReboot, 5000);
}

function initAccretionParticles() {
  singularityParticles = [];
  for (let i = 0; i < 80; i++) {
    singularityParticles.push({
      angle: (Math.PI * 2 * i) / 40,
      radius: 80 + Math.random() * 80,
      speed: 0.02 + Math.random() * 0.03,
      size: 1.5 + Math.random() * 2,
      color: ['#FFDE4D', '#00FFAB', '#B98EFF'][Math.floor(Math.random() * 3)]
    });
  }
}

function singularityCoreLoop() {
  const canvas = document.getElementById('wormhole-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // original accumulating dark background so destruction is pitch black
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const elapsed = (Date.now() - singularityStartTime) / 1000;

  // draw particle accretion ring
  singularityParticles.forEach(p => {
    p.angle += p.speed;
    p.radius = Math.max(20, p.radius - 0.2);
    const px = cx + Math.cos(p.angle) * p.radius;
    const py = cy + Math.sin(p.angle) * p.radius;

    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });

  if (singularityActive) {
    singularityRAF = requestAnimationFrame(singularityCoreLoop);
  }
}

function fakeReboot() {
  singularityActive = false;
  if (singularityRAF) cancelAnimationFrame(singularityRAF);

  const overlay = document.getElementById('wormhole-overlay');
  const canvas = document.getElementById('wormhole-canvas');
  const stage = overlay?.querySelector('.wormhole-stage');
  const txt = overlay?.querySelector('.wormhole-text');
  const sub = overlay?.querySelector('.wormhole-sub');

  if (overlay) overlay.style.display = 'none';
  if (canvas) canvas.style.display = 'none';
  if (stage) stage.classList.remove('active');
  if (txt) txt.classList.remove('active');
  if (sub) sub.classList.remove('active');

  document.querySelectorAll('.window').forEach(w => w.style.display = 'none');
  sessionApps.clear();
  saveOpenWindows();

  bootSequence();
}

// global initialization
document.addEventListener('DOMContentLoaded', () => {
  bootSequence();
  updateClock(); setInterval(updateClock, 1000);
  updateTelemetry(); setInterval(updateTelemetry, 1000);

  initContextMenu();
  initWallpaper();
  initStickyNotes();
  initTerminal();
  initCalculator();
  initMusic();
  initNotes();
  initPaint();
  initGame();
  initPomodoro();

  // desktop icon clicks
  document.querySelectorAll('.desk-icon[data-app]').forEach(icon => {
    icon.addEventListener('click', () => openWindow(icon.dataset.app));
  });

  // dock item clicks
  document.querySelectorAll('.dock-item[data-app]').forEach(item => {
    item.addEventListener('click', () => openWindow(item.dataset.app));
  });

  document.getElementById('wormhole-trigger')?.addEventListener('click', triggerWormhole);

  // window control buttons
  document.querySelectorAll('.window').forEach(win => {
    makeDraggable(win);

    win.querySelector('.btn-close')?.addEventListener('click', () => {
      const appId = win.id.replace('window-', '');
      closeWindow(appId);
    });

    win.querySelector('.btn-min')?.addEventListener('click', () => {
      win.classList.add('window-minimizing');
      setTimeout(() => { win.style.display = 'none'; }, 200);
    });

    win.querySelector('.btn-max')?.addEventListener('click', () => {
      win.classList.toggle('maximized');
    });
  });
});
