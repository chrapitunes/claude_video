// Landscape master (1920x1080): boots the shared engine from reel-core.js on
// the page canvas. Used by scripts/render.cjs and for in-browser preview.
const reel = Reel.createReel(document.getElementById('c'));

window.REEL = { W: reel.W, H: reel.H, FPS: reel.FPS, DURATION: reel.DURATION, FRAMES: reel.FRAMES };
window.renderFrame = reel.renderFrame;
window.ready = Reel.loadReelFonts();

// Real-time preview when opened directly in a browser.
if (!window.__RENDER__) {
  window.ready.then(() => {
    const start = performance.now();
    const loop = now => {
      const f = Math.floor(((now - start) / 1000) * reel.FPS) % reel.FRAMES;
      reel.renderFrame(f, 1);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
