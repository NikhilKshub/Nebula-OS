// script-rework.js
// overrides a few things from the parent script.js without touching it.
// loaded after ../script.js in index-rework.html

// silence the wormhole sound — user asked to remove it
// just replace the function with an empty one
window.createWormholeSound = function() {};
window.stopWormholeSound = function() {
  // also clear any already-running nodes just in case
  if (window.wormholeAudioNodes && window.wormholeAudioNodes.length) {
    window.wormholeAudioNodes.forEach(node => {
      try { node.osc.stop(); node.osc.disconnect(); } catch(e) {}
    });
    window.wormholeAudioNodes = [];
  }
};
