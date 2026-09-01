let termAnimBusy=false;
function lsGet(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}
function lsInt(key, fallback = 0) {
  const v = parseInt(lsGet(key, fallback));
  return isNaN(v) ? fallback : v;
}
function lsFloat(key, fallback = 0) {
  const v = parseFloat(lsGet(key, fallback));
  return isNaN(v) ? fallback : v;
}
function lsJson(key, fallback) {
  try {
    const raw = lsGet(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

let audioCtx=null;
let audioAnalyser=null;
let audioSource=null;
let audioGain=null;
let audioElement=null;
let isAudioPlaying=false;
let musicAnimationId=null;
let musicDuration= 0;

function getAudioCtx(){
  if(!audioCtx) audioCtx=new(window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// boot
function bootSequence(){
  const boot=document.getElementById('boot-screen');
  const desktop=document.getElementById('desktop');
  const fill=document.querySelector('.boot-fill');
  const status=document.querySelector('.boot-status');
  
  if(fill) setTimeout(() => fill.style.width='100%',50);

  const logs = [
    'Establishing reality anchors...',
    'Calibrating wormhole trajectory...',
    'Loading Explorer profile...',
    'Reality Integrity: 100%',
  ];
  let i = 0;
  if (status) {
    const t = setInterval(() => {
      if (i < logs.length) status.textContent = logs[i++];
      else clearInterval(t);
    }, 800);
  }

  setTimeout(() => {
    boot.style.transition = 'opacity 1.2s cubic-bezier(0.22,1,0.36,1), transform 1.2s cubic-bezier(0.22,1,0.36,1)';
    boot.style.opacity = '0';
    boot.style.transform = 'scale(1.05)';
    setTimeout(() => {
      boot.style.display = 'none';
      desktop.style.display = 'block';
      desktop.style.animation = 'fadeIn 0.8s ease';
      setTimeout(spawnWelcomeWindow, 600);
    }, 1200);
  }, 3800);
}

function spawnWelcomeWindow(){
  const win= document.getElementById('window-notes');
  if(!win) return;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const w = parseInt(win.dataset.defaultW || 360);
  const h = parseInt(win.dataset.defaultH || 420);

  win.style.left = cx-w/2-60+'px';
  win.style.top = cy-h/2-40+'px';
  win.style.width=w+'px';
  win.style.height=h+'px';
  win.style.display='flex';
  win.classList.remove('maximized','window-closing','window-minimizing');
  win.classList.add('window-opening');
  setTimeout(()=> win.classList.remove('window-opening'),400);

  const editor=win.querySelector('.notes-editor');
  if (editor) {
    editor.innerHTML = `
      <p><b>🎉 Welcome to Nebula OS! 🎉</b></p>
      <p>You've successfully hacked into the mainframe... just kidding, this is a webOS. But you look very cool doing it. 😎</p>
      <p><b>How to survive here:</b></p>
      <p>• <b>Click things:</b> Specifically, those big chunky icons. They do stuff.</p>
      <p>• <b>Terminal:</b> Type random words in there. Who knows? You might summon a black hole.</p>
      <p>• <b>Wormhole:</b> Speaking of black holes, click the 🕳 Wormhole if you want to aggressively delete this reality.</p>
      <p>• <b>Bottom Dock:</b> Use it when you get lost in the sauce.</p>
      <p><i>Status: 100% stable (unless you divide by zero). 🚀</i></p>
    `;
  }

  const title=win.querySelector('.window-title span:last-child');
  if(title)title.textContent='Welcome.txt';
  bringToFront(win);
}

// clock
let colonOn=true;
function updateClock(){
  const now=new Date();
  const h =String(now.getHours()).padStart(2,'0');
  const m =String(now.getMinutes()).padStart(2,'0');
  colonOn = !colonOn;
 
  const clockE1=document.getElementById('clock');
  const dateE1 = document.getElementById('date');
  if (clockE1) clockE1.textContent = `${h}${colonOn ? ':' : ' '}${m}`;
  if (dateE1) dateE1.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

setInterval(updateClock,1000);
updateClock();

// widgets
let sessionStart=Date.now();
let sysIntegrity=100;
function updateTelemetry(){
  const timeE1= document.getElementById('tel-time');
  if(timeE1) timeE1.textContent=new Date().toLocaleTimeString('en-US',{hour12:false});
  const secs=Math.floor((Date.now()-sessionStart)/1000);
  const hrs=Math.floor(secs / 3600);
  const mins=Math.floor((secs % 3600)/60);
  let upStr='';
  if(hrs>0) upStr += hrs+'h';
  if(mins>0 || hrs>0 ) upStr+=mins + 'm';
  upStr+=(secs%60)+'s';

  const uptimeE1=document.getElementById('tel-uptime');
  if(uptimeE1) uptimeE1.textContent=upStr;
  sysIntegrity=Math.min(100,sysIntegrity+Math.random()*0.02-0.01);
  const intE1=document.getElementById('tel-integrity');
  if(intE1){
    intE1.textContent=sysIntegrity.toFixed(2)+'%';
    intE1.style.color=sysIntegrity < 50 ? 'var(--red)':sysIntegrity <80 ? 'var(--yellow)':'var(--green)';
  }
}

// window management
let highestZ=500;
function makeDraggable(win){
  const header=win.querySelector('.window-header');
  if(!header)return;
  let dragging = false;
  let offX = 0;
  let offY = 0;

  function startDrag(e,cx,cy){
    if(e.target.closest('.win-btn') || win.classList.contains('maximized')) return;
    dragging=true;
    offX=cx-win.offsetLeft;
    offY=cy-win.offsetTop;
    win.style.transition='none';
    bringToFront(win);
  }

  function doDrag(cx, cy) {
    if (!dragging) return;
    const winW = win.offsetWidth || parseInt(win.style.width) || 400;
    const x = Math.max(-(winW - 50), Math.min(cx - offX, window.innerWidth - 50));
    const y = Math.max(40, Math.min(cy - offY, window.innerHeight - 40));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  }
  function endDrag() {
    if (dragging) lsSet(`nebula_winPos_${win.id}`, JSON.stringify({ left: win.style.left, top: win.style.top }));
    dragging = false;
    win.style.transition = '';
  }

  header.addEventListener('mousedown', e => startDrag(e, e.clientX, e.clientY));
  document.addEventListener('mousemove', e => doDrag(e.clientX, e.clientY));
  document.addEventListener('mouseup', endDrag);

  header.addEventListener('touchstart', e => {
    if (!e.target.closest('.win-btn')) e.preventDefault();
    startDrag(e, e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  document.addEventListener('touchmove', e => {
    if (dragging) e.preventDefault();
    doDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  document.addEventListener('touchend', endDrag);
}

function bringToFront(win){
  highestZ++;
  win.style.zIndex=highestZ;
  document.querySelectorAll('.window').forEach(w=>w.classList.remove('active'));
  win.classList.add('active');
}

function enforceWindowBounds(win){
  let x =parseInt(win.style.left) || win.getBoundingClientRect().left;
  let y =parseInt(win.style.top) || win.getBoundingClientRect().top;
  const w = win.getBoundingClientRect().width || parseInt(win.style.width) || 400;
  x= Math.max(-(w-50),Math.min(x,window.innerWidth-50));
  y=Math.max(40,Math.min(y,window.innerHeight-40));
  win.style.left=x+'px';
  win.style.top=y+'px';
}

function openWindow(id){
  const win=document.getElementById(id);
  if(!win) return;

  if(win.style.display !== 'flex'){
    if(id==='window-terminal') resetTerminal();
    if(id==='window-game') resetGameUI();
  }

  win.style.display='flex';
  void win.offsetWidth;
  
  if (!win.classList.contains('maximized')) {
    win.style.width = win.dataset.defaultW + 'px';
    win.style.height = win.dataset.defaultH + 'px';

    const savedPos = lsJson(`nebula_winPos_${id}`);

    if (savedPos) {
        win.style.left = savedPos.left;
        win.style.top = savedPos.top;
    }

    enforceWindowBounds(win);
}
  bringToFront(win);
  win.classList.remove('window-closing','window-minimizing');
  win.classList.add('window-opening');
  setTimeout(()=> win.classList.remove('window-opening'),400);
  saveOpenWindows();
  if(id==='window-paint') setTimeout(initPaint,50);
  if(id==='window-game') setTimeout(initGame,50);
}

function closeWindow(win){
  win.classList.remove('window-opening','window-minimizing');
  win.classList.add('window-closing');
  setTimeout(()=>{
    win.style.display='none';
    win.classList.remove('active','maximized','window-closing');
    if(win.id==='window-terminal') resetTerminal();
    if(win.id==='window-music') stopMusic();
    if(win.id==='window-game') stopGame();
    saveOpenWindows();
    },150)
}

function saveOpenWindows(){
  const open=Array.from(document.querySelectorAll('.window'))
    .filter(w => w.style.display==='flex')
    .map(w=>w.id);
  lsSet('nebula_open_windows',JSON.stringify(open));
}

// sticky notes
function initStickyNotes(){
  const textarea=document.getElementById('sticky-notes-input');
  const clearBtn=document.getElementById('sticky-notes-clear');
  const charCount=document.getElementById('sticky-char-count');
  if(!textarea) return;

  const saved=lsGet('nebula_sticky_notes');
  if(saved) textarea.value=saved;
  if(charCount) charCount.textContent=textarea.value.length + 'chars';
  textarea.addEventListener('input',()=>{
    lsSet('nebula_sticky_notes',textarea.value);
    if(charCount) charCount.textContent=textarea.value.length + 'chars';
  });

  clearBtn?.addEventListener('click',()=>{
    textarea.value='';
    lsSet('nebula_sticky_notes','');
    if(charCount) charCount.textContent='0 chars';
    textarea.focus();
  });
}

function arrangeWindows(){
  const wins=Array.from(document.querySelectorAll('.window')).filter(w=> w.style.display === 'flex');
  if(!wins.length) return;
  const cols=Math.ceil(Math.sqrt(wins.length));
  const pad=40;
  const w= Math.floor((window.innerWidth - pad *2)/cols);
  const h= Math.floor((window.innerHeight-80)/ Math.ceil(wins.length/cols));
  wins.forEach((win,i)=>{
    win.classList.remove('maximized');
    win.style.transition='all 0.5s cubic-bezier(0.22,1,0.36,1)';
    win.style.left=pad + (i%cols) * w + 'px';
    win.style.top=60 + Math.floor(i/cols)*h + 'px';
    win.style.width= win.dataset.defaultW + 'px';
    win.style.height= (win.dataset.defaultH || 420) + 'px';
    setTimeout(()=> win.style.transition='' ,500);
  });
}

// walpaper;
function applyWallpaper(url){
  const bg=document.getElementById('desktop-bg');
  if(!bg) return;
  bg.style.backgroundImage = `url("${url}")`;
  bg.style.backgroundSize='cover';
  bg.style.backgroundPosition='center';
  bg.style.backgroundRepeat='no-repeat';
}

function initWallpaper() {
  const saved = lsGet('nebula_wallpaper');
  if (saved) applyWallpaper(saved);
  const input=document.getElementById('wallpaper-input');
  if(!input) return;
  input.addEventListener('change',e => {
    const file = e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=evt => {
      try { localStorage.setItem('nebula_wallpaper', evt.target.result); } catch {}
      applyWallpaper(evt.target.result);
      showNotification('Wallpaper updated! ✨', 'success');
    };
    reader.readAsDataURL(file);
    input.value = '';
  });
}

// wormhole system
let singularityActive=false;
let singularityGhosts=[];
let singularityParticles=[];
let singularityFlashes=[];
let wormholeTimeout=null;
let singularityRAF=null;
let singularityStartTime=null;
let clockGlitchInterval=null;

function fakeReboot(){
  const fade=document.createElement('div');
  Object.assign(fade.style,{
    position: 'fixed',inset:'0',
    background:'#000',zIndex:'999999',
    transition:'opacity 0.8s ease' ,opacity:'0'
  });
  document.body.appendChild(fade);
  setTimeout(()=> {
    fade.style.opacity='1';
    setTimeout(()=> {
      cancelAnimationFrame(singularityRAF);
      clearInterval(clockGlitchInterval);
      singularityGhosts.forEach(g => g.ghost?.parentNode?.removeChild(g.ghost));
      singularityGhosts=[];
      singularityFlashes=[];
      
      const canvas=document.getElementById('wormhole-canvas');
      if(canvas){
        canvas.style.display='none';
        canvas.getContext('2d').clearRect(0,0,canvas.width, canvas.height);
      }

      const overlay = document.getElementById('wormhole-overlay');
      if (overlay) {
        overlay.style.display = 'none';
        overlay.style.background = '';
        overlay.style.transition = '';
        overlay.style.pointerEvents = '';
        const stage = overlay.querySelector('.wormhole-stage');
        if (stage) stage.classList.remove('active');
        const core = overlay.querySelector('.wormhole-core');
        if (core) { core.classList.remove('expanding'); core.style.transform = ''; }
        const txt = overlay.querySelector('.wormhole-text');
        if (txt) { txt.style.opacity = ''; txt.style.transition = ''; }
        const sub = overlay.querySelector('.wormhole-sub');
        if (sub) { sub.style.opacity = ''; sub.style.transition = ''; }
      }

      singularityActive=false;
      const desktop=document.getElementById('desktop');
      desktop.style.display='none';
      desktop.style.animation='none';

      document.querySelectorAll('.window').forEach(w  => w.style.display='none');
      document.querySelectorAll('.window, .desk-icon, .widget, #dock, #topbar').forEach(el => {
        el.style.visibility='';
        el.style.opacity='';
      });

      lsSet('nebula_open_windows',JSON.stringify([]));
      const boot = document.getElementById('boot-screen');
      const fill = document.querySelector('.boot-fill');
      const status= document.querySelector('.boot-status');
      if(boot){
        Object.assign(boot.style, {display:'flex', opacity: '1', transform:'none'});
        void boot.offsetWidth;
      }
      if(fill){
        fill.style.transition='none';
        fill.style.width='0%';
        void fill.offsetWidth;
        fill.style.transition='width 3s cubic-bezier(0.4,0,0.2,1)';
      }
      if(status) status.textContent='INITIALIZING...';

      fade.remove();
      bootSequence();
    },1200);
  },50);
}

function triggerWormhole(){
  if(singularityActive) return;
  const overlay=document.getElementById('confirm-overlay');
  if(overlay && overlay.style.display !== 'flex'){
    overlay.style.display='flex';
    document.getElementById('confirm-yes').onclick=()=> {overlay.style.display='none'; doWormhole();};
    document.getElementById('confirm-no').onclick=()=> {overlay.style.display='none'; singularityActive=false;};
  }
}

function doWormhole(){
  singularityActive=true;

  wormholeTimeout=setTimeout(fakeReboot,12000);
  document.addEventListener('visibilitychange',function onVis(){
    if(singularityActive){
      clearTimeout(wormholeTimeout);
      document.removeEventListener('visibilitychange',onVis);
      fakeReboot();
    }
  });

  const overlay=document.getElementById('wormhole-overlay');
  if(overlay){
    overlay.style.display='flex';
    overlay.style.background='transparent';
    overlay.style.pointerEvents='none';
    overlay.querySelector('.wormhole-stage')?.classList.add('active');
    const txt = overlay.querySelector('.wormhole-text');
    const sub = overlay.querySelector('.wormhole-sub');
    if(txt){txt.style.opacity='0'; txt.style.transition='none';}
    if(sub){sub.style.opacity='0'; sub.style.transition='none';} 
  }

  const canvas = document.getElementById('wormhole-canvas');
  if(canvas){
    canvas.style.display='block';
    canvas.width= window.innerWidth;
    canvas.height=window.innerHeight;
  }
  initAccretionParticles();
  singularityStartTime=Date.now();
  singularityRAF=requestAnimationFrame(singularityCoreLoop);
  setTimeout(startClockGlitch,700);
  setTimeout(()=> {
    stopClockGlitch();
    cancelAnimationFrame(singularityRAF);
    spawnGhostsAndBeginSuction();
  },1500);
}

function singularityCoreLoop(){
  const canvas = document.getElementById('wormhole-canvas');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawAccretionGlow(ctx,canvas.width /2 , canvas.height /2, (Date.now() - singularityStartTime)/1000);
  singularityRAF=requestAnimationFrame(singularityCoreLoop);
}

function startClockGlitch() {
  const cl = document.getElementById('clock');
  if (!cl) return;
  cl.classList.add('clock-glitch');
  const chars = '░▒▓█01✕Ø';
  clockGlitchInterval = setInterval(() => {
    let s = '';
    for (let i = 0; i < 5; i++) s += i === 2 ? ':' : chars[Math.floor(Math.random() * chars.length)];
    cl.textContent = s;
  }, 70);
}

function stopClockGlitch() {
  clearInterval(clockGlitchInterval);
  clockGlitchInterval = null;
  document.getElementById('clock')?.classList.remove('clock-glitch');
}

function initAccretionParticles() {
  singularityParticles = [];
  for (let i = 0; i < 100; i++) {
    singularityParticles.push({
      angle: (Math.PI * 2 * i) / 55,
      radius: 85 + Math.random() * 75,
      speed: 0.018 + Math.random() * 0.026,
      size: 1.2 + Math.random() * 2.2,
      color: ['#FFDE4D', '#00FFAB', '#B98EFF'][Math.floor(Math.random() * 3)],
      trail: [],
    });
  }
}

function drawAccretionGlow(ctx, cx, cy, elapsed) {
  const coreR = 80;
  const pulse = Math.sin(Date.now() * 0.005);
  const outerR = coreR + 130 + pulse * 45;

  const grd = ctx.createRadialGradient(cx, cy, coreR - 10, cx, cy, outerR);
  grd.addColorStop(0, 'rgba(255,222,77,0.85)');
  grd.addColorStop(0.15, 'rgba(255,222,77,0.30)');
  grd.addColorStop(0.5, 'rgba(0,255,171,0.08)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  singularityParticles.forEach(p => {
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
      ctx.fillStyle = p.color + Math.floor(t.a * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  });
}

function spawnGhostsAndBeginSuction() {
  singularityGhosts = [];
  singularityFlashes = [];

  const targets = [
    ...Array.from(document.querySelectorAll('.window')).filter(w => getComputedStyle(w).display === 'flex'),
    ...Array.from(document.querySelectorAll('.desk-icon, .widget')),
    document.getElementById('dock'),
    document.getElementById('topbar'),
  ].filter(el => el && el.offsetWidth > 0 && el.offsetHeight > 0);

  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ghost = el.cloneNode(true);
    ghost.removeAttribute('style');
    ghost.classList.remove('maximized', 'active', 'screen-shake');
    Object.assign(ghost.style, {
      position: 'fixed',
      left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px',
      margin: '0', padding: getComputedStyle(el).padding,
      transform: 'none', transformOrigin: '50% 50%',
      transition: 'none', animation: 'none',
      zIndex: '99986', pointerEvents: 'none',
      boxSizing: 'border-box', opacity: '1',
    });
    document.body.appendChild(ghost);

    el.style.visibility = 'hidden';
    el.style.opacity = '0';

    singularityGhosts.push({
      ghost, origEl: el,
      cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2,
      initLeft: rect.left, initTop: rect.top,
      vx: 0, vy: 0,
      color: getGhostColor(el),
      isWindow: el.classList.contains('window'),
      status: 'flying', collapseT: 0, trail: [],
    });
  });

  const canvas = document.getElementById('wormhole-canvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

  singularityStartTime = Date.now();
  singularityRAF = requestAnimationFrame(singularitySuctionLoop);
}

function getGhostColor(el) {
  if (el.classList.contains('window')) {
    const hdr = el.querySelector('.window-header');
    if (hdr) return getComputedStyle(hdr).backgroundColor;
  }
  if (el.id === 'topbar' || el.id === 'dock') return 'rgba(255,255,255,0.9)';
  const ib = el.querySelector('.desk-icon-box');
  if (ib) return getComputedStyle(ib).backgroundColor;
  if (el.classList.contains('widget')) return 'rgba(255,255,255,0.8)';
  return '#ccc';
}

function singularitySuctionLoop() {
  const canvas = document.getElementById('wormhole-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const elapsed = (Date.now() - singularityStartTime) / 1000;

  const fadeAlpha = Math.min(0.2, 0.03 + elapsed * 0.06);
  ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawAccretionGlow(ctx, cx, cy, elapsed);

  let allDone = singularityGhosts.length > 0;

  singularityGhosts.forEach(g => {
    if (g.status === 'consumed') return;
    allDone = false;

    if (g.status === 'collapsing') {
      g.collapseT += 0.1;
      if (g.collapseT >= 1) {
        g.status = 'consumed';
        g.ghost?.remove();
        singularityFlashes.push({ x: cx, y: cy, r: 8, maxR: 42 + Math.random() * 38, a: 1.0, color: g.color });
        return;
      }
      const sc = 1 - g.collapseT;
      const tx = cx - g.initLeft - parseFloat(g.ghost.style.width) / 2;
      const ty = cy - g.initTop - parseFloat(g.ghost.style.height) / 2;
      g.ghost.style.opacity = sc;
      g.ghost.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
      return;
    }

    const dx = cx - g.cx, dy = cy - g.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ang = Math.atan2(dy, dx);

    if (dist < 40) { g.status = 'collapsing'; g.collapseT = 0; return; }

    const force = Math.pow(elapsed, 1.9) * 52 / (g.isWindow ? 2.0 : 0.9) / Math.max(Math.sqrt(dist), 5);
    g.vx = (g.vx + Math.cos(ang) * force) * 0.89;
    g.vy = (g.vy + Math.sin(ang) * force) * 0.89;
    g.cx += g.vx;
    g.cy += g.vy;

    g.trail.push({ x: g.cx, y: g.cy });
    if (g.trail.length > 9) g.trail.shift();
    if (g.trail.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(g.trail[0].x, g.trail[0].y);
      for (let i = 1; i < g.trail.length; i++) ctx.lineTo(g.trail[i].x, g.trail[i].y);
      ctx.strokeStyle = g.color;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const stretch = 1 + (120 / (dist + 16)) * Math.min(1.6, elapsed * 0.85);
    const offX = g.cx - g.initLeft - parseFloat(g.ghost.style.width) / 2;
    const offY = g.cy - g.initTop - parseFloat(g.ghost.style.height) / 2;
    g.ghost.style.transform = `translate(${offX}px,${offY}px) rotate(${ang}rad) scale(${stretch},${Math.max(0.1, 1 / stretch)}) rotate(${-ang}rad)`;
  });

  for (let i = singularityFlashes.length - 1; i >= 0; i--) {
    const f = singularityFlashes[i];
    f.r += (f.maxR - f.r) * 0.17;
    f.a -= 0.07;
    if (f.a <= 0) { singularityFlashes.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = f.a;
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }

  if (allDone) finalConsumption();
  else singularityRAF = requestAnimationFrame(singularitySuctionLoop);
}

function finalConsumption() {
  clearTimeout(wormholeTimeout);
  wormholeTimeout = null;

  const overlay = document.getElementById('wormhole-overlay');
  const txt = overlay?.querySelector('.wormhole-text');
  const sub = overlay?.querySelector('.wormhole-sub');
  if (txt) { txt.style.transition = 'opacity 0.35s ease'; txt.style.opacity = '1'; }
  if (sub) { sub.style.transition = 'opacity 0.35s ease 0.15s'; sub.style.opacity = '1'; }

  const core = overlay?.querySelector('.wormhole-core');
  if (core) setTimeout(() => core.classList.add('expanding'), 150);

  setTimeout(() => {
    if (overlay) {
      overlay.style.transition = 'background 0.35s ease';
      overlay.style.background = '#000';
      overlay.style.pointerEvents = 'auto';
    }
  }, 250);

  setTimeout(() => {
    const flash = document.createElement('div');
    flash.className = 'collapse-flash';
    flash.style.animation = 'collapseFlash 0.45s ease forwards';
    document.body.appendChild(flash);
  }, 450);

  setTimeout(() => { if (!document.hidden) setTimeout(fakeReboot, 200); }, 1200);
}

// --- terminal ---
let termHistory = [];
let historyIdx = -1;

function nebulaAscii() {
  return `<div class="term-ascii">    _   __     __          __     
   / | / /__  / /_  __  __/ /___ _
  /  |/ / _ \\/ __ \\/ / / / / __ \`/
 / /|  /  __/ /_/ / /_/ / / /_/ / 
/_/ |_/\\___/_.___/\\__,_/_/\\__,_/  
                                  </div>`;
}

function resetTerminal() {
  const output = document.getElementById('term-output');
  const input = document.getElementById('term-input');
  if (output) output.innerHTML = `
    ${nebulaAscii()}
    <div class="term-line term-welcome">NEBULA OS v1.0 — Welcome, Explorer.</div>
    <div class="term-line term-hint">Type <span class="term-cmd">help</span> to see available commands</div>
    <div class="term-line"></div>
  `;
  if (input) input.value = '';
}

function redAlert() {
  const output = document.getElementById('term-output');
  document.body.classList.add('red-alert-flash');
  const msgs = [
    'WARNING: MULTIPLE CONTAINMENT BREACHES DETECTED',
    'SECURITY PROTOCOL OMEGA INITIATED',
    'EVACUATE FACILITY IMMEDIATELY',
    '...',
  ];
  msgs.forEach((m, i) => setTimeout(() => {
    const line = document.createElement('div');
    line.className = 'term-line term-alert term-ascii';
    line.textContent = m;
    if (output) { output.appendChild(line); output.scrollTop = output.scrollHeight; }
  }, i * 1000));
  setTimeout(() => {
    document.body.classList.remove('red-alert-flash');
    if (output) {
      const line = document.createElement('div');
      line.className = 'term-line term-warning';
      line.textContent = 'System automatically restored. False alarm.';
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }
  }, 5000);
}

function initTerminal() {
  const input = document.getElementById('term-input');
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
    about: () => 'Nebula OS is a neo-brutalist web-based operating system designed for exploration.',
    version: () => 'Nebula OS version 1.0.0-rc1 (HTML5/CSS3/JS)',
    clear: () => { document.getElementById('term-output').innerHTML = ''; return null; },
    date: () => new Date().toDateString(),
    time: () => new Date().toLocaleTimeString(),
    uptime: () => `Up ${Math.floor(performance.now() / 1000)} seconds`,
    echo: args => escapeHtml(args.join(' ')) || 'Usage: echo [text]',
    whoami: () => 'explorer@nebula-os',
    neofetch: () => {
      const icons = document.querySelectorAll('.desk-icon').length;
      return `${nebulaAscii()}<div class="term-ascii">
    OS: NEBULA v1.0
    Kernel: HTML5/CSS3/JS
    Shell: nebula-sh
    Uptime: ${Math.floor(performance.now() / 1000)}s
    Packages: ${icons} (web apps)
    Resolution: ${window.screen.width}x${window.screen.height}
</div>`;
    },
    fortune: () => {
      const q = [
        'A computer lets you make more mistakes faster than any invention in human history.',
        'To iterate is human, to recurse divine.',
        "There are 10 types of people: those who understand binary, and those who don't.",
        'The best way to predict the future is to invent it.',
      ];
      return q[Math.floor(Math.random() * q.length)];
    },
    cowsay: args => {
      const text = escapeHtml(args.join(' ')) || 'Moo';
      return `<div class="term-ascii">
  < ${text} >
    \\   ^__^
     \\  (oo)\\_______
        (__)\\       )\\/\\
            ||----w |
            ||     ||
</div>`;
    },
    credits: () => 'Built with blood, sweat, and CSS gradients.',
    motd: () => 'Welcome to Nebula OS! Keep your spacesuit on.',
    stardust: () => '✨ * . * . ✨ * . ✨ * .',
    creator: () => 'Created by a wandering space explorer.',
    matrix: () => {
      if (termAnimBusy) return 'Sequence already active.';
      termAnimBusy = true;
      startMatrix();
      setTimeout(() => termAnimBusy = false, 1500);
      return 'Initiating matrix rain...';
    },
    hack: () => {
      if (termAnimBusy) return 'Sequence already active.';
      termAnimBusy = true;
      simulateHack();
      setTimeout(() => termAnimBusy = false, 3000);
      return 'Initiating hack sequence...';
    },
    singularity: () => { setTimeout(triggerWormhole, 500); return '<span class="term-alert">SINGULARITY IMMINENT...</span>'; },
    wormhole: () => commands.singularity(),
    reboot: () => { setTimeout(fakeReboot, 1000); return 'Rebooting...'; },
    'sudo collapse-universe': () => commands.singularity(),
    'red-alert': () => { redAlert(); return null; },
    'developer-mode': () => 'God mode unlocked. (Not really, but it sounds cool.)',
    universe: () => "It's quite large.",
    42: () => 'The answer to life, the universe, and everything.',
    coffee: () => '☕ Error 418: I\'m a teapot.',
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (termHistory.length > 0) {
        historyIdx = Math.min(historyIdx + 1, termHistory.length - 1);
        input.value = termHistory[termHistory.length - 1 - historyIdx];
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) { historyIdx--; input.value = termHistory[termHistory.length - 1 - historyIdx]; }
      else { historyIdx = -1; input.value = ''; }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const val = input.value;
      const matches = Object.keys(commands).filter(c => c.startsWith(val));
      if (matches.length === 1) input.value = matches[0] + ' ';
      else if (matches.length > 1) {
        const output = document.getElementById('term-output');
        const l = document.createElement('div');
        l.className = 'term-line';
        l.textContent = matches.join('  ');
        output.appendChild(l);
        output.scrollTop = output.scrollHeight;
      }
      return;
    }
    if (e.key !== 'Enter') return;

    const cmd = input.value.trim();
    input.value = '';
    if (!cmd) return;

    termHistory.push(cmd);
    historyIdx = -1;

    const output = document.getElementById('term-output');
    if (!output) return;

    const cmdLine = document.createElement('div');
    cmdLine.className = 'term-line';
    cmdLine.innerHTML = `<span style="color:#38E54D">❯</span> <span style="color:#FFDE4D">${escapeHtml(cmd)}</span>`;
    cmdLine.style.opacity = '1';
    output.appendChild(cmdLine);

    const key = commands[cmd.toLowerCase()] ? cmd.toLowerCase() : cmd.split(' ')[0].toLowerCase();
    if (commands[key]) {
      const result = commands[key](cmd.split(' ').slice(1));
      if (result !== null) {
        const res = document.createElement('div');
        res.className = 'term-line';
        res.innerHTML = result;
        res.style.color = '#00FFAB';
        res.style.opacity = '1';
        output.appendChild(res);
      }
    } else {
      const err = document.createElement('div');
      err.className = 'term-line';
      err.textContent = `Command not found: ${cmd.split(' ')[0]}`;
      err.style.color = '#FF004D';
      err.style.opacity = '1';
      output.appendChild(err);
    }

    output.scrollTop = output.scrollHeight;
  });
}

function escapeHtml(t){
  const d = document.createElement('div');
  d.textContent=t;
  return d.innerHTML;
}

function startMatrix() {
  const output = document.getElementById('term-output');
  if (!output) return;
  const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const line = document.createElement('div');
      line.className = 'term-line';
      line.style.color = '#38E54D';
      line.textContent = Array(40).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    }, i * 80);
  }
}

function simulateHack(){
  const output= document.getElementById('term-output');
  if(!output) return;
  const steps=[
    {t:'Bypassing firewall...', c:'#ff6868'},
    {t:'Accessing mainframe...', c:'#ff6b6b'},
    {t:'Decrypting passwords...', c:'#ff6b6b'},
    {t:'Uploading payload...', c:'#ff6b6b'},
    {t: 'ACCESS DENIED. Just kidding! 😄', c: '#FFDE4D' },
  ];
  steps.forEach((s, i) => setTimeout(() => {
    const line = document.createElement('div');
    line.className = 'term-line';
    line.textContent = `[${String(i + 1).padStart(2, '0')}/05] ${s.t}`;
    line.style.color = s.c;
    line.style.opacity = '1';
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }, i * 500));
}

// --- calculator ---
let calcCurrent = '0', calcPrev = null, calcOp = null, calcReset = false;

function initCalculator() {
  calcCurrent = '0'; calcPrev = null; calcOp = null; calcReset = false;
  updateCalc();
  document.querySelectorAll('.c-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.val;
      const op = btn.dataset.op;
      if (val !== undefined) {
        calcCurrent = calcReset ? val : (calcCurrent === '0' ? val : calcCurrent + val);
        calcReset = false;
        if (calcCurrent.length > 12) calcCurrent = calcCurrent.slice(0, 12);
        updateCalc();
      } else if (op) {
        handleCalcOp(op);
      }
    });
  });
}

function doCalc(op, prev, curr) {
  switch (op) {
    case '+': return prev + curr;
    case '−': return prev - curr;
    case '×': return prev * curr;
    case '÷': return curr === 0 ? 'PARADOX' : prev / curr;
  }
}

function handleCalcOp(op) {
  const curr = parseFloat(calcCurrent);
  if (op === 'C') { calcCurrent = '0'; calcPrev = null; calcOp = null; calcReset = false; updateCalc(); return; }
  if (op === '±') { calcCurrent = String(curr * -1); updateCalc(); return; }
  if (op === '%') { calcCurrent = String(curr / 100); updateCalc(); return; }

  if (op === '=') {
    if (calcOp && calcPrev !== null) {
      const res = doCalc(calcOp, parseFloat(calcPrev), curr);
      if (res === 'PARADOX') { calcCurrent = res; showNotification('Division by zero paradox.', 'error'); }
      else {
        calcCurrent = String(res).length > 12 ? String(res).toExponential(6) : String(res);
        if (res === 42) showNotification('The answer has been found.', 'success');
      }
      calcPrev = null; calcOp = null; calcReset = true;
    }
    updateCalc(); return;
  }

  if (calcOp && !calcReset) {
    const res = doCalc(calcOp, parseFloat(calcPrev), curr);
    calcPrev = String(res); calcCurrent = String(res);
    if (res === 'PARADOX') showNotification('Division by zero paradox.', 'error');
  } else { calcPrev = calcCurrent; }
  calcOp = op; calcReset = true;
  updateCalc();
}

function updateCalc() {
  const d = document.getElementById('calc-current');
  const h = document.getElementById('calc-history');
  if (d) d.textContent = calcCurrent;
  if (h) h.textContent = calcPrev !== null ? `${calcPrev} ${calcOp || ''}` : '';
}


// music player
let musicPlaylist=[];
let currentTrackIdx=-1;

function initMusic(){
  const fileInput= document.getElementById('music-file-input');
  const dropZone = document.getElementById('vinyl-drop-zone');
  const record = document.getElementById('vinyl-record');
  document.getElementById('m-upload')?.addEventListener('click',() => fileInput?.click());
  document.getElementById('playlist-clear-btn')?.addEventListener('click', () => {
    musicPlaylist=[]; currentTrackIdx= -1; stopMusic(true); renderPlaylist();
  });
  fileInput?.addEventListener('change',e => {
    if(e.target.files.length>0) addToPlaylist(Array.from(e.target.files));
  });

  dropZone?.addEventListener('dragover', e=>{e.preventDefault(); record?.classList.add('drag-over');});
  dropZone?.addEventListener('dragleave', () => record?.classList.remove('drag-over'));
  dropZone?.addEventListener('drop', e=>{
    record?.classList.remove('drag-over');
    const audiofiles=Array.from(e.dataTransfer.files).filter(f=> f.type.startsWith('audio/'));
    if(audiofiles.length>0) addToPlaylist(audiofiles);
  });

  document.getElementById('m-play')?.addEventListener('click',toggleMusic);
  document.getElementById('m-prev')?.addEventListener('click', () => {
    if (musicPlaylist.length > 0) playTrack(currentTrackIdx <= 0 ? musicPlaylist.length - 1 : currentTrackIdx - 1);
  });
  document.getElementById('m-next')?.addEventListener('click', () => {
    if (musicPlaylist.length > 0) playTrack((currentTrackIdx + 1) % musicPlaylist.length);
  });

  const vol = lsFloat('nebula_music_volume', 0.8);
  const volSlider = document.getElementById('music-volume');
  if (volSlider) volSlider.value = vol;
  volSlider?.addEventListener('input', e => {
    if (audioGain) audioGain.gain.value = e.target.value / 100;
    lsSet('nebula_music_volume', e.target.value);
  });

  document.querySelector('.progress-track')?.addEventListener('click', e=> {
    if(!audioElement || !musicDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioElement.currentTime = ((e.clientX - rect.left) / rect.width) * musicDuration;
  });
}

function addToPlaylist(files) {
  const startIdx = musicPlaylist.length;
  files.forEach(file => {
    musicPlaylist.push({ file, name: file.name.replace(/\.[^/.]+$/, '').toUpperCase(), duration: '...' });
    const tmp = new Audio(URL.createObjectURL(file));
    tmp.addEventListener('loadedmetadata', () => {
      const track = musicPlaylist.find(t => t.file === file);
      if (track) {
        track.duration = `${Math.floor(tmp.duration / 60)}:${String(Math.floor(tmp.duration % 60)).padStart(2, '0')}`;
        renderPlaylist();
      }
    });
  });
  renderPlaylist();
  if (currentTrackIdx === -1 && musicPlaylist.length > 0) playTrack(startIdx);
}

function renderPlaylist(){
  const list = document.getElementById('playlist-tracks');
  const clearBtn=document.getElementById('playlist-clear-btn');
  if(!list)return;
  if (musicPlaylist.length === 0) {
    if (clearBtn) clearBtn.style.display = 'none';
    list.innerHTML = '<li class="playlist-empty">Awaiting waveform input...</li>';
    document.getElementById('track-name').textContent = 'ACOUSTIC VACUUM DETECTED';
    document.getElementById('track-artist').textContent = 'AWAITING WAVEFORM INPUT';
    return;
  }

  if (clearBtn) clearBtn.style.display = 'block';
  list.innerHTML = '';
  musicPlaylist.forEach((track, idx) => {
    const li = document.createElement('li');
    li.className = 'playlist-track' + (idx === currentTrackIdx ? ' active' : '');
    li.innerHTML = `
      <div class="track-info-left">
        <span class="track-number">${idx + 1}.</span>
        <span class="track-title">${track.name}</span>
      </div>
      <div class="track-duration-right">
        <span class="track-duration">${track.duration}</span>
        <button class="track-remove" title="Remove">✕</button>
      </div>`;
    li.addEventListener('click', e => e.target.classList.contains('track-remove') ? (e.stopPropagation(), removeTrack(idx)) : playTrack(idx));
    list.appendChild(li);
  });
}

function removeTrack(idx){
  musicPlaylist.splice(idx,1);
  if(musicPlaylist.length === 0){currentTrackIdx = -1; stopMusic(true);}
  else if (idx === currentTrackIdx) playTrack(idx >= musicPlaylist.length ? 0 : idx);
  else if (idx < currentTrackIdx) currentTrackIdx--;
  renderPlaylist();
}

function playTrack(idx){
  if(idx<0 || idx >= musicPlaylist.length) return;
  const track = musicPlaylist[idx];
  currentTrackIdx=idx;
  renderPlaylist();

  const ctx = getAudioCtx();
  if(ctx.state === 'suspended') ctx.resume();
  stopMusic(false);

  if(audioElement) { audioElement.pause(); audioElement.src = '';}
  audioElement = new Audio(URL.createObjectURL(track.file));
  audioElement.crossOrigin='anonymous';

  if (audioSource) audioSource.disconnect();
  audioSource = ctx.createMediaElementSource(audioElement);
  if (!audioAnalyser) { audioAnalyser = ctx.createAnalyser(); audioAnalyser.fftSize = 64; }
  if (!audioGain) audioGain = ctx.createGain();
  const volSlider = document.getElementById('music-volume');
  audioGain.gain.value = volSlider ? volSlider.value / 100 : 0.7;
  audioSource.connect(audioAnalyser);
  audioAnalyser.connect(audioGain);
  audioGain.connect(ctx.destination);


  const nameE1 = document.getElementById('track-name');
  if (nameE1) nameE1.textContent = track.name;
  const artistE1 = document.getElementById('track-artist');
  if(artistE1) artistE1.textContent = 'LOCAL FILE';

  audioElement.play().then(() => {
    isAudioPlaying=true;
    const btn = document.getElementById('m-play');
    if(btn) btn.textContent = '⏸';
    document.getElementById('vinyl-record')?.classList.add('playing');
    document.getElementById('vinyl-arm')?.classList.add('playing');
    startVisualizer();
    updateProgress();
  }).catch(() => {});

  audioElement.addEventListener('ended', () => playTrack((currentTrackIdx + 1) % musicPlaylist.length));
  audioElement.addEventListener('loadedmetadata', () => musicDuration = audioElement.duration);
}

function toggleMusic(){
  if(!audioElement || musicPlaylist.length === 0){document.getElementById('music-file-input')?.click(); return;}
  const ctx = getAudioCtx();
  if(ctx.state === 'suspended') ctx.resume();


  if (isAudioPlaying) {
    audioElement.pause();
    isAudioPlaying = false;
    document.getElementById('m-play').textContent = '▶';
    document.getElementById('vinyl-record')?.classList.remove('playing');
    document.getElementById('vinyl-arm')?.classList.remove('playing');
    if (musicAnimationId) cancelAnimationFrame(musicAnimationId);
  } else {
    audioElement.play();
    isAudioPlaying = true;
    document.getElementById('m-play').textContent = '⏸';
    document.getElementById('vinyl-record')?.classList.add('playing');
    document.getElementById('vinyl-arm')?.classList.add('playing');
    startVisualizer();
    updateProgress();
  }
}

function updateProgress(){
  if(!isAudioPlaying || !audioElement) return;
  const fill = document.getElementById('progress-fill');
  if(fill && musicDuration) fill.style.width = (audioElement.currentTime / musicDuration *100) + '%';
  requestAnimationFrame(updateProgress);
}

function startVisualizer() {
  if (!audioAnalyser) return;
  const bars = document.querySelectorAll('.viz-bar');
  const data = new Uint8Array(audioAnalyser.frequencyBinCount);
  function draw() {
    if (!isAudioPlaying) return;
    audioAnalyser.getByteFrequencyData(data);
    bars.forEach((bar, i) => {
      const val = data[Math.floor((i / bars.length) * data.length)];
      bar.style.height = (4 + (val / 255) * 46) + 'px';
      bar.classList.remove('active');
    });
    musicAnimationId = requestAnimationFrame(draw);
  }
  draw();
}

function stopMusic(fullReset = true) {
  isAudioPlaying = false;
  if (audioElement) { audioElement.pause(); if (fullReset) audioElement.currentTime = 0; }
  if (musicAnimationId) cancelAnimationFrame(musicAnimationId);
  const btn = document.getElementById('m-play');
  if (btn) btn.textContent = '▶';
  document.getElementById('vinyl-record')?.classList.remove('playing');
  document.getElementById('vinyl-arm')?.classList.remove('playing');
  if (fullReset) {
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = '0%';
    document.querySelectorAll('.viz-bar').forEach(b => { b.style.height = '6px'; b.classList.add('active'); });
  }
}

// notess

function initNotes(){
  const editor=document.querySelector('.notes-editor');
  if(!editor) return;
  const saved= lsGet('nebula_notes_content');
  if(saved) editor.innerHTML=saved;
  editor.addEventListener('input',() => lsSet('nebula_notes_content',editor.innerHTML));
  document.querySelectorAll('.note-tool').forEach(tool => {
    tool.addEventListener('click',() => {
      document.execCommand(tool.dataset.cmd , false , null);
      editor.focus();
      lsSet('nebula_notes_content', editor.innerHTML);
    })
  })
}


// paint

let paintCtx = null;
let isPainting = false;
let paintColor = '#000000';
let paintSize = 5;
let currentPaintTool = 'brush';
let paintStartX = 0, paintStartY = 0;
let paintHistory = [];
let paintTempImage = null;
let paintListenersBound = false;

function initPaint(){
  const canvas = document.getElementById('paint-canvas');
  if(!canvas) return;
  paintCtx = canvas.getContext('2d');

  function resizeCanvas(){
    const parent = canvas.parentElement;
    if(!parent) return;
    const w = parent.clientWidth, h = parent.clientHeight;
    if(!w || !h)return;

    let saved = null;
    if(canvas.width > 0 && canvas.height > 0 ){
      saved=document.createElement('canvas');
      saved.width = canvas.width;
      saved.height = canvas.height;
      saved.getContext('2d').drawImage(canvas,0,0);
    } 
    canvas.width=w;
    canvas.height=h;

    if(saved){
      paintCtx.drawImage(saved,0,0);
    } else{
      const stored = localStorage.getItem('nebula_paint_data');
      if(stored){
        const img =new Image();
        img.src = stored;
        img.onload=() => {paintCtx.drawImage(img,0,0); paintHistory=[stored];};
      } else {
        paintCtx.fillStyle='#fff';
        paintCtx.fillRect(0,0,canvas.width,canvas.height);
        savePaintState();
      }
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(resizeCanvas));

  if(paintListenersBound) return;
  paintListenersBound =true;
  new ResizeObserver(() => requestAnimationFrame(resizeCanvas)).observe(canvas.parentElement);

  canvas.addEventListener('mousedown', startPainting);
  canvas.addEventListener('mousemove', drawPaint);
  canvas.addEventListener('mouseleave', stopPainting);

  document.querySelectorAll('.paint-color').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.paint-color').forEach(b => b.classList.remove('active'));
      const t = e.target.closest('.paint-color') || e.target;
      t.classList.add('active');
      paintColor = t.dataset.color;
    });
  });

  document.getElementById('brush-size')?.addEventListener('input', e => paintSize = e.target.value);
  document.getElementById('paint-clear')?.addEventListener('click', () => {
    paintCtx.fillStyle = '#fff';
    paintCtx.fillRect(0, 0, canvas.width, canvas.height);
    savePaintState();
  });

  document.querySelectorAll('.paint-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.paint-btn[data-tool]').forEach(b => b.classList.remove('active'));
      const t = e.target.closest('.paint-btn');
      t.classList.add('active');
      currentPaintTool = t.dataset.tool;
    });
  });

  document.getElementById('paint-undo')?.addEventListener('click',undoPaint);
  document.getElementById('paint-save')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'nebula_art.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification('Reality Archive Saved','success');
  });

  document.addEventListener('keydown', e=> {
    const win = document.getElementById('window-paint');
    if(e.ctrlKey && e.key === 'z' && win?.classList.contains('active')) undoPaint();
  });
}

function savePaintState(){
  const canvas = document.getElementById('paint-canvas');
  if(!canvas) return;
  if(paintHistory.length >= 15) paintHistory.shift();
  const url = canvas.toDataURL();
  paintHistory.push(url);
  lsSet('nebula_paint_data', url);
}

function undoPaint(){
  if(paintHistory.length <= 1) return;
  paintHistory.pop();
  const prev = paintHistory[paintHistory.length - 1];
  const canvas = document.getElementById('paint-canvas');
  const img = new Image();
  img.src=prev;
  img.onload = () => { paintCtx.clearRect(0,0,canvas.width,canvas.height); paintCtx.drawImage(img,0,0); lsSet('nebula_paint_data',prev);};
}

function getPaintCoords(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

function startPainting(e){
  isPainting = true;
  const coords = getPaintCoords(e,e.target);
  paintStartX = coords.x;
  paintStartY= coords.y;
  paintTempImage = new Image();
  paintTempImage.src = e.target.toDataURL();
  if(currentPaintTool === 'brush'){
    paintCtx.beginPath();
    paintCtx.moveTo(coords.x,coords.y);
    drawPaint(e);
  }
}

function stopPainting() {
  if (!isPainting) return;
  isPainting = false;
  paintCtx?.beginPath();
  savePaintState();
}

document.addEventListener('mouseup', stopPainting);

function drawPaint(e) {
  if (!isPainting) return;
  const canvas = e.target;
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
    if (paintTempImage?.complete) {
      paintCtx.clearRect(0, 0, canvas.width, canvas.height);
      paintCtx.drawImage(paintTempImage, 0, 0);
    }
    paintCtx.beginPath();
    if (currentPaintTool === 'line') {
      paintCtx.moveTo(paintStartX, paintStartY);
      paintCtx.lineTo(coords.x, coords.y);
    } else if (currentPaintTool === 'rect') {
      paintCtx.rect(paintStartX, paintStartY, coords.x - paintStartX, coords.y - paintStartY);
    } else if (currentPaintTool === 'circle') {
      const r = Math.sqrt(Math.pow(coords.x - paintStartX, 2) + Math.pow(coords.y - paintStartY, 2));
      paintCtx.arc(paintStartX, paintStartY, r, 0, 2 * Math.PI);
    }
    paintCtx.stroke();
  }
}

// snake

let gCtx = null;
let snake = [], food = {};
let gDir = 'right', gNext = 'right';
let gScore = 0, gHigh = lsInt('nebula_snake_high', 0);
let gLoop = null, gSpeed = 130, gRunning = false;
let gameListenersBound = false;

function initGame(){
  const canvas = document.getElementById('game-canvas');
  if(!canvas) return;
  const wrap = canvas.parentElement;
  const size = Math.floor(Math.min(wrap.clientWidth - 6, wrap.clientHeight - 6, 300) / 15) *15;
  canvas.width =size;
  canvas.height=size;
  gCtx=canvas.getContext('2d');
  const highE1 = document.getElementById('game-high');
  if(highE1) highE1.textContent = gHigh;
  drawGame ();

  if (gameListenersBound) return;
  gameListenersBound = true;
  document.getElementById('game-start')?.addEventListener('click', startGame);
  document.getElementById('game-stop')?.addEventListener('click', stopGame);
  document.addEventListener('keydown', e => {
    if (!gRunning) return;
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
    if (map[e.key] && gDir !== opp[map[e.key]]) gNext = map[e.key];
  });
}

function resetGameUI(){
  gScore = 0;
  const score = document.getElementById('game-score');
  if(score) score.textContent = '0';
  document.getElementById('game-start').style.display = 'inline-block';
  document.getElementById('game-stop').style.display = 'none';
  if(gLoop) {clearInterval(gLoop); gLoop=null;}
  gRunning = false;
}

function startGame(){
  if(gRunning) return;
  const canvas = document.getElementById('game-canvas');
  if(!canvas) return;
  const tiles = 15;
  const grid = Math.floor(canvas.width / tiles);
  snake = [{x: Math.floor(tiles/2), y: Math.floor(tiles/2)}];
  gDir = 'right'; gNext='right'; gScore=0; gSpeed=130; gRunning = true;
  document.getElementById('game-score').textContent ='0';
  document.getElementById('game-start').style.display = 'none';
  document.getElementById('game-stop').style.display = 'inline-block';
  placeFood(tiles);
  if (gLoop) clearInterval(gLoop);
  gLoop = setInterval(() => gameStep(tiles,grid), gSpeed);
}

function stopGame() {
  gRunning = false;
  if (gLoop) { clearInterval(gLoop); gLoop = null; }
  document.getElementById('game-start').style.display = 'inline-block';
  document.getElementById('game-stop').style.display = 'none';
  snake = [];
  drawGame();
}

function placeFood(tiles){
  do{ food = { x:Math.floor(Math.random() * tiles), y:Math.floor(Math.random()*tiles)};}
  while (snake.some(s => s.x === food.x && s.y === food.y));
}
function gameStep(tiles, grid) {
  gDir = gNext;
  const head = { ...snake[0] };
  if (gDir === 'up') head.y--;
  else if (gDir === 'down') head.y++;
  else if (gDir === 'left') head.x--;
  else head.x++;

  if (head.x < 0) head.x = tiles - 1;
  if (head.x >= tiles) head.x = 0;
  if (head.y < 0) head.y = tiles - 1;
  if (head.y >= tiles) head.y = 0;

  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver();
    showNotification('Temporal Worm terminated.', 'warning');
    return;
  }


  snake.unshift(head);
  if(head.x === food.x && head.y === food.y){
    gScore +=10;
    document.getElementById('game-score').textContent = gScore;
    if(gScore > gHigh){
      gHigh = gScore;
      const highEl = document.getElementById('game-high');
      if(highEl) highEl.textContent = gHigh;
      lsSet('nebula_snake_high' , gHigh);
    }
    placeFood(tiles);
    if(gSpeed>60) {gSpeed -=3; clearInterval(gLoop); gLoop = setInterval(() => gameStep(tiles,grid), gSpeed);}
  } else {
    snake.pop();
  }
  drawGame(grid);
}

function drawGame(grid = 15) {
  if (!gCtx) return;
  const canvas = gCtx.canvas;
  gCtx.fillStyle = '#191A1F';
  gCtx.fillRect(0, 0, canvas.width, canvas.height);

  gCtx.strokeStyle = 'rgba(255,255,255,0.03)';
  gCtx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += grid) {
    gCtx.beginPath(); gCtx.moveTo(i, 0); gCtx.lineTo(i, canvas.height); gCtx.stroke();
    gCtx.beginPath(); gCtx.moveTo(0, i); gCtx.lineTo(canvas.width, i); gCtx.stroke();
  }

  snake.forEach((seg, i) => {
    gCtx.fillStyle = i === 0 ? '#00FFAB' : '#38E54D';
    gCtx.fillRect(seg.x * grid + 1, seg.y * grid + 1, grid - 2, grid - 2);
    if (i === 0) {
      gCtx.fillStyle = '#000';
      gCtx.fillRect(seg.x * grid + 4, seg.y * grid + 4, 3, 3);
      gCtx.fillRect(seg.x * grid + 9, seg.y * grid + 4, 3, 3);
    }
  });

  if (food.x !== undefined) {
    gCtx.fillStyle = '#FF004D';
    gCtx.beginPath();
    gCtx.arc(food.x * grid + grid / 2, food.y * grid + grid / 2, grid / 2 - 2, 0, Math.PI * 2);
    gCtx.fill();
  }
}


function gameOver() {
  gRunning = false;
  clearInterval(gLoop);
  gLoop = null;
  gCtx.fillStyle = 'rgba(255,0,77,0.3)';
  gCtx.fillRect(0, 0, gCtx.canvas.width, gCtx.canvas.height);
  setTimeout(() => {
    document.getElementById('game-start').style.display = 'inline-block';
    document.getElementById('game-stop').style.display = 'none';
    snake = [];
    drawGame();
  }, 1000);
}


// toasts
function showNotification(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '💾', error: '⚠️', warning: '⚡' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '🔔'}</span> <span class="toast-content">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('leaving'); toast.addEventListener('animationend', () => toast.remove()); }, 5000);
}

// pomodoro ( focus timer )

const POMO_DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60, custom: 10 * 60 };
const POMO_LABELS = { focus: 'FOCUS SESSION', short: 'SHORT BREAK', long: 'LONG BREAK', custom: 'CUSTOM TIMER' };

let pomoState = {
  mode: 'focus',
  timeLeft: POMO_DURATIONS.focus,
  totalTime: POMO_DURATIONS.focus,
  isRunning: false,
  sessions: 0,
  interval: null,
  customType: 'focus',
};

function pomoFormatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function pomoUpdateDisplay() {
  const display = document.getElementById('pomo-display');
  const label = document.getElementById('pomo-label');
  const progress = document.getElementById('pomo-progress');
  const sessions = document.getElementById('pomo-sessions');
  if (display) display.textContent = pomoFormatTime(pomoState.timeLeft);
  if (label) label.textContent = POMO_LABELS[pomoState.mode];
  if (progress) progress.style.width = (pomoState.timeLeft / pomoState.totalTime * 100) + '%';
  if (sessions) sessions.textContent = pomoState.sessions;
}

function pomoBeep() {
  try{
    const ctx =new(window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain =ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value=880; osc.type='sine';
    gain.gain.setValueAtTime(0.3,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001 , ctx.currentTime + 0.8);
    osc.start(); osc.stop(ctx.currentTime + 0.8); 
  } catch {}
}

function pomoTick() {
  if (pomoState.timeLeft <= 0) {
    clearInterval(pomoState.interval);
    pomoState.interval = null;
    pomoState.isRunning = false;
    pomoBeep();
    document.getElementById('pomo-start').textContent = 'START';

    const isFocus = pomoState.mode === 'focus' || (pomoState.mode === 'custom' && pomoState.customType === 'focus');
    if (isFocus) {
      pomoState.sessions++;
      showNotification('Focus session complete! Take a break. 🎉', 'success');
      pomoSetMode('short');
    } else {
      showNotification('Break over! Time to focus. ⚡', 'warning');
      pomoSetMode('focus');
    }
    return;
  }
  pomoState.timeLeft--;
  pomoUpdateDisplay();
}

function pomoStart(){
  const btn = document.getElementById('pomo-start');
  if(pomoState.isRunning){
    clearInterval(pomoState.interval);
    pomoState.interval=null;
    pomoState.isRunning=false;
    if(btn) btn.textContent = 'RESUME';
  } else {
    pomoState.isRunning = true;
    pomoState.interval = setInterval(pomoTick,1000);
    if (btn) btn.textContent = 'PAUSE';
  }
}

function pomoReset() {
  clearInterval(pomoState.interval);
  pomoState.interval = null;
  pomoState.isRunning = false;
  pomoState.timeLeft = pomoState.totalTime;
  document.getElementById('pomo-start').textContent = 'START';
  pomoUpdateDisplay();
}

function pomoSetMode(mode) {
  clearInterval(pomoState.interval);
  pomoState.interval = null;
  pomoState.isRunning = false;
  pomoState.mode = mode;
  pomoState.timeLeft = POMO_DURATIONS[mode];
  pomoState.totalTime = POMO_DURATIONS[mode];
  document.querySelectorAll('.pomo-mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
  document.getElementById('pomo-start').textContent = 'START';
  pomoUpdateDisplay();
}

function pomoSwitchMode(mode) {
  if (mode === 'custom') {
    const overlay = document.getElementById('pomo-custom-overlay');
    const hIn = document.getElementById('pomo-custom-h');
    const mIn = document.getElementById('pomo-custom-m');
    const sIn = document.getElementById('pomo-custom-s');
    if (overlay && hIn && mIn && sIn) {
      const t = POMO_DURATIONS.custom || 600;
      hIn.value = Math.floor(t / 3600);
      mIn.value = Math.floor((t % 3600) / 60);
      sIn.value = t % 60;
      overlay.style.display = 'flex';
      setTimeout(() => mIn.focus(), 100);
    }
    return;
  }
  pomoSetMode(mode);
}

function initPomodoro() {
  document.getElementById('pomo-start')?.addEventListener('click', pomoStart);
  document.getElementById('pomo-reset')?.addEventListener('click', pomoReset);
  document.querySelectorAll('.pomo-mode-btn').forEach(btn => btn.addEventListener('click', () => pomoSwitchMode(btn.dataset.mode)));

  document.getElementById('pomo-custom-cancel')?.addEventListener('click', () => {
    document.getElementById('pomo-custom-overlay').style.display = 'none';
  });
  document.getElementById('pomo-custom-set')?.addEventListener('click', () => {
    const h = parseInt(document.getElementById('pomo-custom-h').value) || 0;
    const m = parseInt(document.getElementById('pomo-custom-m').value) || 0;
    const s = parseInt(document.getElementById('pomo-custom-s').value) || 0;
    const total = h * 3600 + m * 60 + s;
    if (total <= 0) return;
    const isBreak = document.getElementById('ctype-break')?.checked;
    pomoState.customType = isBreak ? 'break' : 'focus';
    POMO_LABELS.custom = isBreak ? 'CUSTOM BREAK' : 'CUSTOM FOCUS';
    POMO_DURATIONS.custom = total;
    document.getElementById('pomo-custom-overlay').style.display = 'none';
    pomoSetMode('custom');
  });
  pomoUpdateDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
  bootSequence();

  document.querySelectorAll('.window').forEach(win => {
    makeDraggable(win);
    win.addEventListener('mousedown', () => bringToFront(win));
    win.addEventListener('touchstart', () => bringToFront(win), { passive: true });

    win.querySelector('.btn-close')?.addEventListener('click', () => closeWindow(win));

    win.querySelector('.btn-min')?.addEventListener('click', () => {
      win.classList.remove('window-opening', 'window-closing');
      win.classList.add('window-minimizing');
      setTimeout(() => { win.style.display = 'none'; win.classList.remove('window-minimizing', 'active'); saveOpenWindows(); }, 250);
    });

    win.querySelector('.btn-max')?.addEventListener('click', () => {
      const btn = win.querySelector('.btn-max');

      if (win.classList.contains('maximized')) {
        // Restore the exact size and position from before maximizing.
        win.classList.remove('maximized');

        win.style.width = win.dataset.prevWidth || win.dataset.defaultW + 'px';
        win.style.height = win.dataset.prevHeight || win.dataset.defaultH + 'px';
        win.style.top = win.dataset.prevTop || '100px';
        win.style.left = win.dataset.prevLeft || '100px';

        if (btn) btn.textContent = '□';

        enforceWindowBounds(win);
      } else {
        // Save the complete normal-window geometry before maximizing.
        win.dataset.prevTop = win.style.top || win.offsetTop + 'px';
        win.dataset.prevLeft = win.style.left || win.offsetLeft + 'px';
        win.dataset.prevWidth = win.style.width || win.offsetWidth + 'px';
        win.dataset.prevHeight = win.style.height || win.offsetHeight + 'px';

        win.classList.add('maximized');

        if (btn) btn.textContent = '◱';
      }

      bringToFront(win);

      // Canvas apps need a frame to recalculate their new dimensions.
      if (win.id === 'window-paint') setTimeout(initPaint, 100);
      if (win.id === 'window-game') setTimeout(initGame, 100);
    });
  });

  document.querySelectorAll('.desk-icon').forEach(icon => icon.addEventListener('click', () => openWindow('window-' + icon.dataset.app)));
  document.querySelectorAll('.dock-item[data-app]').forEach(item => item.addEventListener('click', () => openWindow('window-' + item.dataset.app)));
  document.getElementById('wormhole-trigger')?.addEventListener('click', triggerWormhole);

// right-click context menu
  const ctxMenu = document.getElementById('context-menu');
  const desktop = document.getElementById('desktop');
  desktop?.addEventListener('contextmenu', e => {
    e.preventDefault();
    ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 220) + 'px';
    ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 200) + 'px';
    ctxMenu.style.display = 'block';
  });
  document.addEventListener('click', e => { if (!ctxMenu.contains(e.target)) ctxMenu.style.display = 'none'; });

  document.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'refresh') fakeReboot();
      else if (action === 'arrange') arrangeWindows();
      else if (action === 'wallpaper') document.getElementById('wallpaper-input')?.click();
      else if (action === 'about') alert('NEBULA OS v1.0\nBuilt for Hack Club Stardance\n\nNeo-Brutalist WebOS');
      else openWindow('window-' + action);
      ctxMenu.style.display = 'none';
    });
  });

  initTerminal();
  initCalculator();
  initMusic();
  initNotes();
  initPomodoro();
  initWallpaper();
  initStickyNotes();
  setInterval(updateTelemetry, 1000);
  updateTelemetry();
});

window.addEventListener('beforeunload', () => {
  if (audioElement?.src) URL.revokeObjectURL(audioElement.src);
});
