// script-rework.js
// runs after ../script.js — patches a few things without touching the original

// 1. silence wormhole sound
window.createWormholeSound = function() {};
window.stopWormholeSound = function() {
  if (window.wormholeAudioNodes && window.wormholeAudioNodes.length) {
    window.wormholeAudioNodes.forEach(node => {
      try { node.osc.stop(); node.osc.disconnect(); } catch(e) {}
    });
    window.wormholeAudioNodes = [];
  }
};

// 2. fix paint — mouseup on document so releasing outside canvas still stops drawing
//    the original only listened on the canvas itself, so fast strokes that leave the
//    canvas boundary left isPainting stuck as true forever
document.addEventListener('mouseup', function() {
  if (window.isPainting) {
    window.isPainting = false;
    if (window.paintCtx) window.paintCtx.beginPath();
    // save state if the function exists
    if (typeof savePaintState === 'function') savePaintState();
  }
});

// 3. fix wormhole canvas going fully black
//    the core loop does fillRect with rgba(0,0,0,0.06) each frame
//    after ~60 frames that accumulates to solid black covering the CSS rings/overlay
//    we replace the loop to cap the background opacity so the CSS overlay stays visible
window.singularityCoreLoop = function() {
  const canvas = document.getElementById('wormhole-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const elapsed = (Date.now() - window.singularityStartTime) / 1000;

  // clear completely each frame instead of accumulating — keeps the overlay visible
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw a subtle dark vignette only in the first 2 seconds so desktop is still visible
  if (elapsed < 2) {
    const alpha = Math.min(0.4, elapsed * 0.2);
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 60, canvas.width/2, canvas.height/2, canvas.width * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (typeof drawAccretionGlow === 'function') {
    drawAccretionGlow(ctx, canvas.width / 2, canvas.height / 2, elapsed);
  }

  window.singularityRAF = requestAnimationFrame(window.singularityCoreLoop);
};
