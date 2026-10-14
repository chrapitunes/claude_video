// Renders src/reel.html frame-by-frame with headless Chromium and pipes the
// frames into ffmpeg.
//   node scripts/render.cjs                 -> out/reel_silent.mp4
//   node scripts/render.cjs --stills 0.5,2  -> out/stills/t_0.50.png ...
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

let playwright;
try { playwright = require('playwright'); } catch {
  playwright = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await playwright.chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(() => { window.__RENDER__ = true; });
  page.on('pageerror', e => { console.error('PAGE ERROR', e); process.exit(1); });
  await page.goto('file://' + path.join(ROOT, 'src', 'reel.html'));
  await page.evaluate(() => window.ready);
  const { FPS, FRAMES } = await page.evaluate(() => window.REEL);

  const grab = f => page.evaluate(f => {
    window.renderFrame(f);
    return document.getElementById('c').toDataURL('image/png');
  }, f).then(u => Buffer.from(u.split(',')[1], 'base64'));

  if (stillsArg) {
    const dir = path.join(OUT, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of stillsArg.split(',').map(Number)) {
      fs.writeFileSync(path.join(dir, `t_${t.toFixed(2)}.png`), await grab(Math.round(t * FPS)));
    }
    console.log('stills written to', dir);
    await browser.close();
    return;
  }

  const target = path.join(OUT, 'reel_silent.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', target],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

  const t0 = Date.now();
  for (let f = 0; f < FRAMES; f++) {
    const buf = await grab(f);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`frame ${f}/${FRAMES}  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  }
  ff.stdin.end();
  await done;
  await browser.close();
  console.log('wrote', target);
})();
