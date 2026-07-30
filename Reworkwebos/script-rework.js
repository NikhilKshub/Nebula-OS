/* nebula os - main script
   built june 2026. window manager, desktop apps, pomodoro & singularity.
*/

const sessionApps = new Set();
let isTermAnimRunning = false, audioCtx = null, topZ = 600;
let dragWin = null, dragOffsetX = 0, dragOffsetY = 0, bootTime = Date.now();

// storage & helpers
function safeInt(key, fallback = 0) {
  try { const v = parseInt(localStorage.getItem(key) || String(fallback), 10); return isNaN(v) ? fallback : v; } catch (e) { return fallback; }
}
function safeSetItem(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
function escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function showNotification(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'error' ? '⚠️' : type === 'success' ? '✓' : 'ℹ️'}</span><div class="toast-content">${escapeHtml(msg)}</div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('leaving'); setTimeout(() => toast.remove(), 250); }, 3000);
}

// boot sequence
function bootSequence() {
  const boot = document.getElementById('boot-screen'), fill = document.querySelector('.boot-fill'), status = document.querySelector('.boot-status'), desktop = document.getElementById('desktop');
  if (!boot || !fill) return;
  fill.style.width = '0%';
  setTimeout(() => { fill.style.width = '100%'; }, 100);
  setTimeout(() => { if (status) status.textContent = 'MOUNTING FILE SYSTEM...'; }, 1200);
  setTimeout(() => { if (status) status.textContent = 'STARTING USER INTERFACE...'; }, 2400);
  setTimeout(() => {
    boot.style.transition = 'opacity .6s ease'; boot.style.opacity = '0';
    if (desktop) desktop.style.display = 'block';
    setTimeout(() => { boot.style.display = 'none'; restoreOpenWindows(); if (sessionApps.size === 0) openWindow('notes'); }, 600);
  }, 3400);
}

// clock & telemetry
function updateClock() {
  const now = new Date(), dateEl = document.getElementById('date'), clockEl = document.getElementById('clock');
  if (dateEl) {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  }
  if (clockEl) clockEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function updateTelemetry() {
  const timeEl = document.getElementById('tel-time'), uptimeEl = document.getElementById('tel-uptime'), now = new Date();
  if (timeEl) timeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  if (uptimeEl) {
    const sec = Math.floor((Date.now() - bootTime) / 1000), m = Math.floor(sec / 60), s = sec % 60;
    uptimeEl.textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}

// window manager
function makeDraggable(win) {
  const header = win.querySelector('.window-header');
  if (!header) return;
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('win-btn')) return;
    bringToFront(win); dragWin = win;
    const rect = win.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left; dragOffsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);
  });
}

function doDrag(e) {
  if (!dragWin || dragWin.classList.contains('maximized')) return;
  dragWin.style.left = `${Math.max(-100, Math.min(window.innerWidth - 100, e.clientX - dragOffsetX))}px`;
  dragWin.style.top = `${Math.max(40, Math.min(window.innerHeight - 60, e.clientY - dragOffsetY))}px`;
}

function endDrag() { dragWin = null; document.removeEventListener('mousemove', doDrag); document.removeEventListener('mouseup', endDrag); }

function bringToFront(win) {
  topZ++; win.style.zIndex = topZ;
  document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
  win.classList.add('active');
}

function openWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;
  win.style.display = 'flex';
  win.classList.remove('window-minimizing', 'window-closing');
  win.classList.add('window-opening');
  bringToFront(win); sessionApps.add(appId); saveOpenWindows();
  if (appId === 'paint') setTimeout(initPaint, 50);
  if (appId === 'terminal') { const input = document.getElementById('term-input'); if (input) setTimeout(() => input.focus(), 100); }
}

function closeWindow(appId) {
  const win = document.getElementById(`window-${appId}`);
  if (!win) return;
  win.classList.add('window-closing');
  setTimeout(() => { win.style.display = 'none'; win.classList.remove('window-closing'); sessionApps.delete(appId); saveOpenWindows(); }, 150);
}

function saveOpenWindows() { safeSetItem('nebula_session', JSON.stringify(Array.from(sessionApps))); }

function restoreOpenWindows() {
  try {
    const raw = localStorage.getItem('nebula_session');
    if (!raw) return;
    const apps = JSON.parse(raw);
    if (Array.isArray(apps)) apps.forEach(appId => { if (document.getElementById(`window-${appId}`)) openWindow(appId); });
  } catch (e) {}
}

function arrangeWindows() {
  const openWins = Array.from(document.querySelectorAll('.window')).filter(w => w.style.display === 'flex');
  let x = 60, y = 60;
  openWins.forEach((win) => { win.style.left = `${x}px`; win.style.top = `${y}px`; x += 30; y += 30; bringToFront(win); });
}

// context menu & wallpaper
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

function initWallpaper() {
  const input = document.getElementById('wallpaper-input');
  if (!input) return;
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => { const bg = document.getElementById('desktop-bg'); if (bg) bg.style.background = `url(${evt.target.result}) center/cover no-repeat`; };
    reader.readAsDataURL(file);
  });
}

// sticky notes
function initStickyNotes() {
  const area = document.getElementById('sticky-notes-input'), count = document.getElementById('sticky-char-count'), clearBtn = document.getElementById('sticky-notes-clear');
  if (!area) return;
  const saved = localStorage.getItem('nebula_sticky_note');
  if (saved) { area.value = saved; if (count) count.textContent = `${saved.length} chars`; }
  area.addEventListener('input', () => { safeSetItem('nebula_sticky_note', area.value); if (count) count.textContent = `${area.value.length} chars`; });
  if (clearBtn) {
    clearBtn.addEventListener('click', () => { area.value = ''; safeSetItem('nebula_sticky_note', ''); if (count) count.textContent = '0 chars'; });
  }
}

// terminal app
let termHistory = [], termHistIdx = -1;

function initTerminal() {
  const input = document.getElementById('term-input'), output = document.getElementById('term-output');
  if (!input || !output) return;
  output.innerHTML = `<div class="term-line term-welcome">NEBULA OS Mainframe Terminal v1.0</div><div class="term-line term-hint">Type 'help' to view available system commands.</div>`;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = input.value.trim(); input.value = ''; if (!cmd) return;
      termHistory.push(cmd); termHistIdx = termHistory.length;
      appendTermLine(`❯ ${cmd}`, 'term-cmd'); execTermCmd(cmd);
    } else if (e.key === 'ArrowUp' && termHistIdx > 0) {
      termHistIdx--; input.value = termHistory[termHistIdx] || '';
    } else if (e.key === 'ArrowDown') {
      if (termHistIdx < termHistory.length - 1) { termHistIdx++; input.value = termHistory[termHistIdx] || ''; }
      else { termHistIdx = termHistory.length; input.value = ''; }
    }
  });
}

function appendTermLine(text, className = '') {
  const output = document.getElementById('term-output');
  if (!output) return;
  const line = document.createElement('div');
  line.className = `term-line ${className}`; line.innerHTML = text;
  output.appendChild(line); output.scrollTop = output.scrollHeight;
}

function execTermCmd(cmdStr) {
  const parts = cmdStr.split(' '), cmd = parts[0].toLowerCase();
  switch (cmd) {
    case 'help':
      appendTermLine(`<div class="help-table"><span class="help-cmd">help</span><span class="help-desc">List commands</span><span class="help-cmd">clear</span><span class="help-desc">Clear screen</span><span class="help-cmd">status</span><span class="help-desc">System diagnostic</span><span class="help-cmd">time</span><span class="help-desc">Current timestamp</span><span class="help-cmd">reboot</span><span class="help-desc">Restart session</span><span class="help-cmd">collapse</span><span class="help-desc">Trigger singularity</span></div>`);
      break;
    case 'clear': document.getElementById('term-output').innerHTML = ''; break;
    case 'status':
      appendTermLine('SYSTEM STATUS: NOMINAL', 'term-welcome');
      appendTermLine(`Active Windows: ${sessionApps.size}`);
      appendTermLine(`Uptime: ${Math.floor((Date.now() - bootTime) / 1000)} seconds`);
      break;
    case 'time': appendTermLine(new Date().toString()); break;
    case 'reboot': location.reload(); break;
    case 'collapse': triggerWormhole(); break;
    default: appendTermLine(`Unknown command: '${cmd}'. Type 'help' for available options.`, 'term-alert');
  }
}

// calculator app
let calcVal = '0', calcHist = '', calcOp = null, calcReset = false;

function initCalculator() {
  const display = document.getElementById('calc-current'), hist = document.getElementById('calc-history'), keypad = document.querySelector('.calc-keypad');
  if (!keypad) return;
  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.c-btn');
    if (!btn) return;
    const val = btn.dataset.val, op = btn.dataset.op;

    if (val !== undefined) { calcVal = (calcVal === '0' || calcReset) ? val : calcVal + val; calcReset = false; }
    else if (op !== undefined) { handleCalcOp(op); }
    if (display) display.textContent = calcVal;
    if (hist) hist.textContent = calcHist;
  });
}

function handleCalcOp(op) {
  if (op === 'C') { calcVal = '0'; calcHist = ''; calcOp = null; calcReset = false; }
  else if (op === '=') {
    if (calcOp && calcHist) {
      try {
        const expr = (calcHist + ' ' + calcVal).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        calcVal = String(Function(`'use strict'; return (${expr})`)());
        calcHist = ''; calcOp = null; calcReset = true;
      } catch (e) { calcVal = 'ERROR'; calcReset = true; }
    }
  } else { calcOp = op; calcHist = `${calcVal} ${op}`; calcReset = true; }
}

// music player app
let musicTracks = [], musicIdx = 0, isPlaying = false, audioEl = new Audio();

function initMusic() {
  const playBtn = document.getElementById('m-play'), prevBtn = document.getElementById('m-prev'), nextBtn = document.getElementById('m-next');
  const fileInput = document.getElementById('music-file-input'), uploadBtn = document.getElementById('m-upload'), volInput = document.getElementById('music-volume');

  if (playBtn) playBtn.addEventListener('click', toggleMusic);
  if (prevBtn) prevBtn.addEventListener('click', () => playTrack(musicIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => playTrack(musicIdx + 1));
  if (uploadBtn && fileInput) uploadBtn.addEventListener('click', () => fileInput.click());

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      files.forEach(f => musicTracks.push({ name: f.name.replace(/\.[^/.]+$/, ''), url: URL.createObjectURL(f) }));
      renderPlaylist();
      if (!isPlaying && musicTracks.length > 0) playTrack(musicTracks.length - files.length);
    });
  }

  if (volInput) volInput.addEventListener('input', (e) => { audioEl.volume = e.target.value / 100; });
  audioEl.addEventListener('ended', () => playTrack(musicIdx + 1));
  audioEl.addEventListener('timeupdate', () => {
    const fill = document.getElementById('progress-fill');
    if (fill && audioEl.duration) fill.style.width = `${(audioEl.currentTime / audioEl.duration) * 100}%`;
  });
}

function toggleMusic() {
  if (musicTracks.length === 0) { showNotification('No audio loaded. Click 📁 to upload songs!', 'warning'); return; }
  isPlaying ? audioEl.pause() : audioEl.play();
  isPlaying = !isPlaying;
  updateMusicUI();
}

function playTrack(idx) {
  if (musicTracks.length === 0) return;
  musicIdx = (idx + musicTracks.length) % musicTracks.length;
  audioEl.src = musicTracks[musicIdx].url;
  audioEl.play(); isPlaying = true;
  updateMusicUI(); renderPlaylist();
}

function updateMusicUI() {
  const playBtn = document.getElementById('m-play'), nameEl = document.getElementById('track-name');
  const record = document.getElementById('vinyl-record'), arm = document.getElementById('vinyl-arm');
  if (playBtn) playBtn.textContent = isPlaying ? '⏸' : '▶';
  if (nameEl && musicTracks[musicIdx]) nameEl.textContent = musicTracks[musicIdx].name;
  if (record) record.classList.toggle('playing', isPlaying);
  if (arm) arm.classList.toggle('playing', isPlaying);
}

function renderPlaylist() {
  const list = document.getElementById('playlist-tracks');
  if (!list) return;
  if (musicTracks.length === 0) { list.innerHTML = '<li class="playlist-empty">Awaiting waveform input...</li>'; return; }
  list.innerHTML = musicTracks.map((t, i) => `
    <li class="playlist-track ${i === musicIdx ? 'active' : ''}" onclick="playTrack(${i})">
      <div class="track-info-left"><span class="track-number">${i + 1}</span><span>${escapeHtml(t.name)}</span></div>
    </li>
  `).join('');
}

// notes app
function initNotes() {
  document.querySelectorAll('.note-tool').forEach(btn => {
    btn.addEventListener('click', () => { const cmd = btn.dataset.cmd; if (cmd) document.execCommand(cmd, false, null); });
  });
}

// paint app
let paintCtx = null, isPainting = false, paintColor = '#000000', paintSize = 4, currentPaintTool = 'brush';
let paintStartX = 0, paintStartY = 0, paintHistory = [], paintTempImg = null;

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
    canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
    if (temp.width > 0) paintCtx.drawImage(temp, 0, 0);
    else fillPaintWhite();
  }

  resize();

  canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    const coords = getPaintCoords(e, canvas);
    paintStartX = coords.x; paintStartY = coords.y;
    paintTempImg = new Image(); paintTempImg.src = canvas.toDataURL();
    if (currentPaintTool === 'brush') { paintCtx.beginPath(); paintCtx.moveTo(paintStartX, paintStartY); }
  });

  canvas.addEventListener('mousemove', drawPaint);

  // global mouseup fix so drawing stops even if mouse is released outside canvas
  document.addEventListener('mouseup', () => {
    if (isPainting) { isPainting = false; if (paintCtx) paintCtx.beginPath(); savePaintState(); }
  });

  document.querySelectorAll('.paint-color').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.paint-color').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); paintColor = btn.dataset.color;
    });
  });

  document.querySelectorAll('.paint-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.paint-btn[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); currentPaintTool = btn.dataset.tool;
    });
  });

  document.getElementById('brush-size')?.addEventListener('input', (e) => { paintSize = e.target.value; });
  document.getElementById('paint-clear')?.addEventListener('click', fillPaintWhite);
  document.getElementById('paint-undo')?.addEventListener('click', undoPaint);
  document.getElementById('paint-save')?.addEventListener('click', () => {
    const link = document.createElement('a'); link.download = 'nebula_art.png'; link.href = canvas.toDataURL(); link.click();
  });
}

function getPaintCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
}

function drawPaint(e) {
  if (!isPainting) return;
  const canvas = document.getElementById('paint-canvas');
  const coords = getPaintCoords(e, canvas);

  paintCtx.lineWidth = paintSize; paintCtx.lineCap = 'round'; paintCtx.lineJoin = 'round';
  paintCtx.strokeStyle = paintColor; paintCtx.fillStyle = paintColor;

  if (currentPaintTool === 'brush') {
    paintCtx.lineTo(coords.x, coords.y); paintCtx.stroke(); paintCtx.beginPath(); paintCtx.moveTo(coords.x, coords.y);
  } else {
    if (paintTempImg && paintTempImg.complete) {
      paintCtx.clearRect(0, 0, canvas.width, canvas.height);
      paintCtx.drawImage(paintTempImg, 0, 0);
    }
    paintCtx.beginPath();
    if (currentPaintTool === 'line') {
      paintCtx.moveTo(paintStartX, paintStartY); paintCtx.lineTo(coords.x, coords.y);
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
  paintCtx.fillStyle = '#ffffff'; paintCtx.fillRect(0, 0, canvas.width, canvas.height);
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
  const img = new Image(); img.src = prev;
  img.onload = () => {
    const canvas = document.getElementById('paint-canvas');
    paintCtx.clearRect(0, 0, canvas.width, canvas.height);
    paintCtx.drawImage(img, 0, 0);
  };
}

// snake game
let snake = [], food = {x: 0, y: 0}, gDir = 'right', gNext = 'right';
let gScore = 0, gHigh = safeInt('nebula_snake_high', 0), gLoop = null, gRunning = false;

function initGame() {
  const startBtn = document.getElementById('game-start'), stopBtn = document.getElementById('game-stop'), highEl = document.getElementById('game-high');
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
  gRunning = false; if (gLoop) clearInterval(gLoop);
  document.getElementById('game-start').style.display = 'inline-block';
  document.getElementById('game-stop').style.display = 'none';
}

function placeFood() { food = { x: Math.floor(Math.random() * 15), y: Math.floor(Math.random() * 15) }; }

function gameStep() {
  if (!gRunning) return;
  gDir = gNext;
  const head = { ...snake[0] };
  if (gDir === 'up') head.y--;
  else if (gDir === 'down') head.y++;
  else if (gDir === 'left') head.x--;
  else if (gDir === 'right') head.x++;

  if (head.x < 0 || head.x >= 15 || head.y < 0 || head.y >= 15 || snake.some(s => s.x === head.x && s.y === head.y)) {
    stopGame(); showNotification(`Game Over! Score: ${gScore}`, 'error'); return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    gScore += 10; document.getElementById('game-score').textContent = gScore;
    if (gScore > gHigh) { gHigh = gScore; safeSetItem('nebula_snake_high', gHigh); document.getElementById('game-high').textContent = gHigh; }
    placeFood();
  } else { snake.pop(); }
  drawGame();
}

function drawGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), sz = 20;
  ctx.fillStyle = '#191a1f'; ctx.fillRect(0, 0, 300, 300);
  ctx.fillStyle = '#ff004d'; ctx.fillRect(food.x * sz + 2, food.y * sz + 2, sz - 4, sz - 4);
  snake.forEach((seg, i) => { ctx.fillStyle = i === 0 ? '#38e54d' : '#00ffab'; ctx.fillRect(seg.x * sz + 1, seg.y * sz + 1, sz - 2, sz - 2); });
}

// focus timer app
let pomoTime = 1500, pomoMax = 1500, pomoTimer = null, pomoRunning = false;
let pomoMode = 'focus', pomoSessions = safeInt('nebula_pomo_sessions', 0);

function initPomodoro() {
  const display = document.getElementById('pomo-display'), startBtn = document.getElementById('pomo-start');
  const resetBtn = document.getElementById('pomo-reset'), countEl = document.getElementById('pomo-sessions');
  if (countEl) countEl.textContent = pomoSessions;

  document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === 'custom') document.getElementById('pomo-custom-overlay').style.display = 'flex';
      else switchPomoMode(mode);
    });
  });

  if (startBtn) startBtn.addEventListener('click', togglePomo);
  if (resetBtn) resetBtn.addEventListener('click', resetPomo);
  document.getElementById('pomo-custom-cancel')?.addEventListener('click', () => { document.getElementById('pomo-custom-overlay').style.display = 'none'; });

  document.getElementById('pomo-custom-set')?.addEventListener('click', () => {
    const h = parseInt(document.getElementById('pomo-custom-h').value || '0', 10);
    const m = parseInt(document.getElementById('pomo-custom-m').value || '0', 10);
    const s = parseInt(document.getElementById('pomo-custom-s').value || '0', 10);
    const total = h * 3600 + m * 60 + s;
    if (total > 0) { pomoMax = total; pomoTime = total; updatePomoDisplay(); document.getElementById('pomo-custom-overlay').style.display = 'none'; }
  });
  updatePomoDisplay();
}

function switchPomoMode(mode) {
  pomoMode = mode;
  document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'focus') pomoMax = 1500;
  else if (mode === 'short') pomoMax = 300;
  else if (mode === 'long') pomoMax = 900;
  pomoTime = pomoMax; resetPomo();
}

function togglePomo() {
  const startBtn = document.getElementById('pomo-start');
  if (pomoRunning) { clearInterval(pomoTimer); pomoRunning = false; if (startBtn) startBtn.textContent = 'START'; }
  else { pomoRunning = true; if (startBtn) startBtn.textContent = 'PAUSE'; pomoTimer = setInterval(pomoTick, 1000); }
}

function pomoTick() {
  if (pomoTime > 0) { pomoTime--; updatePomoDisplay(); }
  else {
    clearInterval(pomoTimer); pomoRunning = false; document.getElementById('pomo-start').textContent = 'START';
    if (pomoMode === 'focus') {
      pomoSessions++; safeSetItem('nebula_pomo_sessions', pomoSessions);
      document.getElementById('pomo-sessions').textContent = pomoSessions;
      showNotification('Focus session complete! Take a break.', 'success');
    } else { showNotification('Break ended! Ready to focus?', 'info'); }
  }
}

function resetPomo() {
  if (pomoTimer) clearInterval(pomoTimer);
  pomoRunning = false; pomoTime = pomoMax;
  const startBtn = document.getElementById('pomo-start'); if (startBtn) startBtn.textContent = 'START';
  updatePomoDisplay();
}

function updatePomoDisplay() {
  const display = document.getElementById('pomo-display'), bar = document.getElementById('pomo-progress');
  const m = Math.floor(pomoTime / 60), s = pomoTime % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  if (display) display.textContent = str;
  if (bar) bar.style.width = `${(pomoTime / pomoMax) * 100}%`;
}

// wormhole / singularity system (audio code completely removed)
let singularityActive = false, singularityParticles = [], singularityRAF = null, singularityStartTime = 0;

function triggerWormhole() {
  if (singularityActive) return;
  const confirm = document.getElementById('confirm-overlay');
  if (confirm) {
    confirm.style.display = 'flex';
    document.getElementById('confirm-yes').onclick = () => { confirm.style.display = 'none'; doWormhole(); };
    document.getElementById('confirm-no').onclick = () => { confirm.style.display = 'none'; };
  }
}

function doWormhole() {
  singularityActive = true;
  const overlay = document.getElementById('wormhole-overlay'), canvas = document.getElementById('wormhole-canvas');

  if (overlay) {
    overlay.style.display = 'flex';
    const stage = overlay.querySelector('.wormhole-stage'), txt = overlay.querySelector('.wormhole-text'), sub = overlay.querySelector('.wormhole-sub');
    if (stage) stage.classList.add('active');
    if (txt) txt.classList.add('active');
    if (sub) sub.classList.add('active');
  }

  if (canvas) {
    canvas.style.display = 'block'; canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  }

  initAccretionParticles();
  singularityStartTime = Date.now();
  singularityRAF = requestAnimationFrame(singularityCoreLoop);
  setTimeout(fakeReboot, 5000);
}

function initAccretionParticles() {
  singularityParticles = [];
  for (let i = 0; i < 80; i++) {
    singularityParticles.push({
      angle: (Math.PI * 2 * i) / 40, radius: 80 + Math.random() * 80, speed: 0.02 + Math.random() * 0.03,
      size: 1.5 + Math.random() * 2, color: ['#FFDE4D', '#00FFAB', '#B98EFF'][Math.floor(Math.random() * 3)]
    });
  }
}

function singularityCoreLoop() {
  const canvas = document.getElementById('wormhole-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;

  singularityParticles.forEach(p => {
    p.angle += p.speed; p.radius = Math.max(20, p.radius - 0.2);
    const px = cx + Math.cos(p.angle) * p.radius, py = cy + Math.sin(p.angle) * p.radius;
    ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
  });

  if (singularityActive) singularityRAF = requestAnimationFrame(singularityCoreLoop);
}

function fakeReboot() {
  singularityActive = false;
  if (singularityRAF) cancelAnimationFrame(singularityRAF);

  const overlay = document.getElementById('wormhole-overlay'), canvas = document.getElementById('wormhole-canvas');
  const stage = overlay?.querySelector('.wormhole-stage'), txt = overlay?.querySelector('.wormhole-text'), sub = overlay?.querySelector('.wormhole-sub');

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

// initialization
document.addEventListener('DOMContentLoaded', () => {
  bootSequence();
  updateClock(); setInterval(updateClock, 1000);
  updateTelemetry(); setInterval(updateTelemetry, 1000);

  initContextMenu(); initWallpaper(); initStickyNotes(); initTerminal();
  initCalculator(); initMusic(); initNotes(); initPaint(); initGame(); initPomodoro();

  document.querySelectorAll('.desk-icon[data-app]').forEach(icon => {
    icon.addEventListener('click', () => openWindow(icon.dataset.app));
  });
  document.querySelectorAll('.dock-item[data-app]').forEach(item => {
    item.addEventListener('click', () => openWindow(item.dataset.app));
  });

  document.getElementById('wormhole-trigger')?.addEventListener('click', triggerWormhole);

  document.querySelectorAll('.window').forEach(win => {
    makeDraggable(win);
    win.querySelector('.btn-close')?.addEventListener('click', () => closeWindow(win.id.replace('window-', '')));
    win.querySelector('.btn-min')?.addEventListener('click', () => { win.classList.add('window-minimizing'); setTimeout(() => { win.style.display = 'none'; }, 200); });
    win.querySelector('.btn-max')?.addEventListener('click', () => win.classList.toggle('maximized'));
  });
});
