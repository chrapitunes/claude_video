// Claude — Motion Design Showreel 2026
// Every frame is a pure function of time t (seconds), so frames can be
// rendered in any order. Motion blur comes from averaging sub-frames.

const W = 1920, H = 1080, FPS = 60, DURATION = 15;
const SUBFRAMES = 5;      // motion blur samples per frame
const SHUTTER = 0.5;      // 180° shutter
const TAU = Math.PI * 2;

const C = {
  bg: '#0B0B10', ink: '#F4F0E8', cream: '#F4F0E8',
  coral: '#FF5B2E', violet: '#7A5CFF', lime: '#D7FF3B', cyan: '#38E1FF', pink: '#FF4FA3',
};
const PALETTE = [C.coral, C.violet, C.lime, C.cyan, C.pink];
const FONT = '"Inter Display", "Inter", sans-serif';
const font = (w, s) => `${w} ${s}px ${FONT}`;

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const E = {
  outExpo: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: t => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: t => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: t => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
};
function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mixRgb = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// Beat-synced impacts drive camera shake + chromatic aberration.
const IMPACTS = [[0.5, 1], [1.5, 0.45], [2.0, 0.45], [2.5, 0.6], [3.5, 0.35], [6.0, 1], [8.55, 0.7], [10.5, 0.35], [11.9, 0.4], [13.0, 1]];
function impact(t) {
  let s = 0;
  for (const [it, a] of IMPACTS) { const d = t - it; if (d >= 0 && d < 0.6) s = Math.max(s, a * Math.exp(-d * 9)); }
  return s;
}

// Masked per-letter text reveal (and optional exit).
function revealText(ctx, text, x, y, size, weight, color, t, t0, o = {}) {
  const { stagger = 0.035, dur = 0.7, align = 'left', tracking = 0, ease = E.outExpo,
    out = null, outStagger = 0.025, outDur = 0.4, wobble = null, stroke = 0 } = o;
  ctx.save();
  ctx.font = font(weight, size);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const chars = [...text];
  const ws = chars.map(c => ctx.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  ctx.beginPath();
  ctx.rect(x0 - size, y - size * 0.92, total + size * 2, size * 1.0);
  ctx.clip();
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = stroke;
  let cx = x0;
  chars.forEach((ch, i) => {
    const p = ease(prog(t, t0 + i * stagger, t0 + i * stagger + dur));
    const q = out != null ? E.inExpo(prog(t, out + i * outStagger, out + i * outStagger + outDur)) : 0;
    if (p > 0 && q < 1) {
      let dy = (1 - p) * size - q * size, rot = 0;
      if (wobble) { const w = wobble(t, i); dy += w[0]; rot = w[1]; }
      ctx.save();
      ctx.translate(cx + ws[i] / 2, y + dy);
      ctx.rotate(rot);
      if (stroke) ctx.strokeText(ch, -ws[i] / 2, 0); else ctx.fillText(ch, -ws[i] / 2, 0);
      ctx.restore();
    }
    cx += ws[i] + tracking;
  });
  ctx.restore();
  return { x0, total, ws };
}

function asterisk(ctx, x, y, r, rot, color) {
  if (r <= 0) return;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color;
  const w = r * 0.34;
  for (let k = 0; k < 3; k++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath(); ctx.roundRect(-r, -w / 2, r * 2, w, w / 2); ctx.fill();
  }
  ctx.restore();
}

function circleText(ctx, text, x, y, R, rot, size, color, alpha) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = font(700, size); ctx.fillStyle = color; ctx.globalAlpha = alpha;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const chars = [...text];
  chars.forEach((ch, i) => {
    ctx.save(); ctx.rotate((i / chars.length) * TAU); ctx.fillText(ch, 0, -R); ctx.restore();
  });
  ctx.restore();
}

function diagPath(ctx, p, slant = 420) {
  const x = lerp(-slant, W + slant, p);
  ctx.beginPath();
  ctx.moveTo(-slant * 2 - 10, 0); ctx.lineTo(x, 0); ctx.lineTo(x - slant, H); ctx.lineTo(-slant * 2 - 10, H);
  ctx.closePath();
}

// ================================================================ SCENES

// 01 — Ignition: a dot pops, detonates on the first beat.
const burst = (() => {
  const r = rng(7), a = [];
  for (let i = 0; i < 90; i++) a.push({ ang: r() * TAU, sp: 500 + r() * 1300, sz: 3 + r() * 9, c: PALETTE[i % 5] });
  return a;
})();
function sceneIgnition(ctx, t) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;

  for (const [d, col, maxR] of [[0, C.coral, 720], [0.07, C.violet, 980], [0.14, C.lime, 1250]]) {
    const p = prog(t, 0.5 + d, 1.35 + d);
    if (p > 0 && p < 1) {
      ctx.beginPath(); ctx.arc(cx, cy, E.outExpo(p) * maxR, 0, TAU);
      ctx.lineWidth = lerp(70, 0, E.outCubic(p)); ctx.strokeStyle = col; ctx.stroke();
    }
  }
  const lp = prog(t, 0.5, 1.2);
  if (lp > 0 && lp < 1) {
    ctx.lineCap = 'round'; ctx.lineWidth = 5;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU + t * 0.4;
      const r1 = 70 + E.outExpo(lp) * 950, r0 = 70 + E.outExpo(prog(t, 0.6, 1.25)) * 950;
      ctx.strokeStyle = PALETTE[i % 5];
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
    }
  }
  if (t > 0.5) {
    const dt = t - 0.5, k = 3.5, dist = (1 - Math.exp(-k * dt)) / k;
    for (const b of burst) {
      const s = b.sz * Math.max(0, 1 - dt / 1.1);
      if (s <= 0) continue;
      ctx.fillStyle = b.c;
      ctx.beginPath(); ctx.arc(cx + Math.cos(b.ang) * b.sp * dist, cy + Math.sin(b.ang) * b.sp * dist, s, 0, TAU); ctx.fill();
    }
  }
  let r = 28 * E.outBack(prog(t, 0.05, 0.35));
  r *= 1 - 0.4 * E.inOutCubic(prog(t, 0.3, 0.5));
  if (t >= 0.5) r = lerp(16, 40, E.outElastic(prog(t, 0.5, 1.3)));
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();

  const tp = E.outExpo(prog(t, 0.75, 1.3));
  if (tp > 0) {
    ctx.save();
    ctx.globalAlpha = tp; ctx.fillStyle = C.ink; ctx.font = font(500, 28);
    ctx.textAlign = 'center'; ctx.letterSpacing = lerp(60, 18, tp) + 'px';
    ctx.fillText('SHOWREEL — 2026', cx + 9, cy + 130);
    ctx.restore();
  }
}

// 02 — Kinetic type on coral.
function sceneType(ctx, t) {
  const p = E.inOutCubic(prog(t, 1.25, 1.6));
  ctx.save();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, p * Math.hypot(W, H) / 2 + 1, 0, TAU); ctx.clip();
  ctx.fillStyle = C.coral; ctx.fillRect(0, 0, W, H);

  const z = 1 + 0.06 * prog(t, 1.4, 3.6);
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);

  ctx.strokeStyle = 'rgba(0,0,0,0.07)'; ctx.lineWidth = 3;
  const off = (t * 80) % 60;
  for (let x = -H - 60; x < W + 60; x += 60) {
    ctx.beginPath(); ctx.moveTo(x + off, 0); ctx.lineTo(x + off + H, H); ctx.stroke();
  }

  const S = 250, X = 150;
  revealText(ctx, 'I MAKE', X, 370, S, 900, C.bg, t, 1.5);
  revealText(ctx, 'THINGS', X, 620, S, 900, C.bg, t, 2.0);
  revealText(ctx, 'MOVE.', X, 870, S, 900, C.ink, t, 2.5, {
    wobble: (tt, i) => {
      const a = clamp((tt - 2.9) * 4), ph = (tt - 2.9) * 13 - i * 0.8;
      return [Math.sin(ph) * 32 * a, Math.sin(ph - 0.6) * 0.09 * a];
    },
  });

  const s = E.outBack(prog(t, 1.7, 2.2));
  const beatKick = E.outExpo(prog(t % 0.5, 0, 0.3));
  asterisk(ctx, 1530, 330, 150 * s, t * 1.2 + beatKick * 0.4, C.lime);

  const ca = E.outCubic(prog(t, 2.2, 2.7));
  if (ca > 0) {
    ctx.save(); ctx.translate(1530, 790); ctx.scale(lerp(0.7, 1, ca), lerp(0.7, 1, ca));
    ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(0, 0, 175 * ca, 0, TAU); ctx.fill();
    circleText(ctx, 'MOTION • DESIGN • ANIMATION • TYPE • ', 0, 0, 135, -t * 0.9, 26, C.ink, ca);
    asterisk(ctx, 0, 0, 46 * ca, t * 2, C.coral);
    ctx.restore();
  }
  ctx.restore();
}

// 03 — Rhythm: a grid of morphing shapes driven by a radial wave.
function sceneGrid(ctx, t) {
  const pLead = E.inOutExpo(prog(t, 3.1, 3.5)), pMain = E.inOutExpo(prog(t, 3.18, 3.6));
  ctx.save();
  diagPath(ctx, pLead); ctx.fillStyle = C.lime; ctx.fill();
  diagPath(ctx, pMain); ctx.clip();
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

  const cs = 120, cols = 16, rows = 9;
  const camE = E.inOutCubic(prog(t, 4.7, 5.6));
  const q = E.inExpo(prog(t, 5.55, 6.0));
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(camE * 0.35 + q * 1.2); ctx.scale(1 + camE * 0.45, 1 + camE * 0.45); ctx.translate(-W / 2, -H / 2);
  for (let j = -2; j < rows + 2; j++) {
    for (let i = -3; i < cols + 3; i++) {
      const cx0 = (i + 0.5) * cs, cy0 = (j + 0.5) * cs;
      const dx = (cx0 - W / 2) / cs, dy = (cy0 - H / 2) / cs, d = Math.hypot(dx, dy);
      const intro = E.outBack(prog(t, 3.3 + d * 0.04, 3.8 + d * 0.04));
      if (intro <= 0) continue;
      const ph = (t - 3.4) * 5.5 - d * 0.7;
      const v = 0.5 + 0.5 * Math.sin(ph);
      const size = lerp(12, 94, v) * intro * (1 - q * 0.7);
      const m = 0.5 + 0.5 * Math.sin(ph * 0.5 + 1.2);
      const rad = lerp(size / 2, size * 0.06, m * m * (3 - 2 * m));
      const ang = v * Math.PI * 0.5 + (t - 3.4) * 0.6;
      const px = lerp(cx0, W / 2, q), py = lerp(cy0, H / 2, q);
      const ci = ((Math.floor(d * 0.8 - (t - 3.4) * 3) % 5) + 5) % 5;
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
      ctx.fillStyle = PALETTE[ci];
      ctx.beginPath(); ctx.roundRect(-size / 2, -size / 2, size, size, Math.max(0, rad)); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();

  ctx.globalCompositeOperation = 'difference';
  revealText(ctx, 'RHYTHM', W / 2, 650, 300, 900, '#FFFFFF', t, 3.85, { align: 'center', stagger: 0.045, out: 5.3 });
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// 04 — Dimension: 3D particle sculpture morphing sphere → cube → torus.
const P3 = (() => {
  const r = rng(42), N = 1100, pts = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963;
    const sphere = [Math.cos(th) * rr, y, Math.sin(th) * rr];
    const face = Math.floor(r() * 6), a = r() * 2 - 1, b = r() * 2 - 1, s = 0.78;
    const cube = [[s, a * s, b * s], [-s, a * s, b * s], [a * s, s, b * s], [a * s, -s, b * s], [a * s, b * s, s], [a * s, b * s, -s]][face];
    const u = r() * TAU, v = r() * TAU, R = 1.0, rt = 0.36;
    const torus = [(R + rt * Math.cos(v)) * Math.cos(u), rt * Math.sin(v), (R + rt * Math.cos(v)) * Math.sin(u)];
    pts.push({ sphere, cube, torus, d: r() * 0.3, accent: r() < 0.07 });
  }
  return pts;
})();
const RGB = { cyan: hexRgb(C.cyan), violet: hexRgb(C.violet), lime: hexRgb(C.lime), ink: hexRgb(C.ink) };
function sceneDepth(ctx, t) {
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1100);
  g.addColorStop(0, '#1C1640'); g.addColorStop(1, '#050508');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const burstE = E.outBack(prog(t, 6.0, 6.7));
  const R = 390 * burstE;
  const yaw = (t - 6) * 0.9 + 0.6, pitch = 0.35 + 0.18 * Math.sin(t * 1.3);
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const f = 1000, D = 1250 - E.inExpo(prog(t, 8.1, 8.58)) * 1300;
  const proj = (x, y, z) => {
    const x1 = x * cyw - z * syw, z1 = x * syw + z * cyw;
    const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    const zc = z2 + D;
    return zc > 20 ? [W / 2 + (x1 * f) / zc, H / 2 + (y1 * f) / zc, zc, z2] : null;
  };

  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 600);
  glow.addColorStop(0, 'rgba(122,92,255,0.35)'); glow.addColorStop(1, 'rgba(122,92,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // orbit rings
  ctx.lineWidth = 2;
  for (const [tilt, rr, a] of [[0.5, 1.55, 0.3], [-0.9, 1.85, 0.18]]) {
    ctx.strokeStyle = `rgba(244,240,232,${a * burstE})`;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const u = (i / 120) * TAU;
      const x = Math.cos(u) * rr * R, z = Math.sin(u) * rr * R;
      const p = proj(x, -z * Math.sin(tilt), z * Math.cos(tilt));
      if (!p) continue;
      i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
    const u = t * 2.2 + tilt;
    const sat = proj(Math.cos(u) * rr * R, -Math.sin(u) * rr * R * Math.sin(tilt), Math.sin(u) * rr * R * Math.cos(tilt));
    if (sat) { ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(sat[0], sat[1], (9 * f) / sat[2], 0, TAU); ctx.fill(); }
  }

  ctx.globalCompositeOperation = 'lighter';
  for (const pt of P3) {
    const m1 = E.inOutCubic(prog(t, 6.9 + pt.d, 7.35 + pt.d));
    const m2 = E.inOutCubic(prog(t, 7.6 + pt.d, 8.05 + pt.d));
    const p = [0, 1, 2].map(k => lerp(lerp(pt.sphere[k], pt.cube[k], m1), pt.torus[k], m2) * R);
    const pr = proj(p[0], p[1], p[2]);
    if (!pr) continue;
    const depth = clamp((pr[3] / Math.max(R, 1) + 1) / 2);
    const col = pt.accent ? RGB.lime : mixRgb(RGB.cyan, RGB.violet, depth);
    const sz = (3.2 * f) / pr[2];
    ctx.fillStyle = rgba(col, lerp(1, 0.35, depth));
    ctx.beginPath(); ctx.arc(pr[0], pr[1], sz, 0, TAU); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  revealText(ctx, 'DIMENSION', 150, 960, 110, 200, C.ink, t, 6.3, { tracking: 34, stagger: 0.03, out: 8.0 });

  const fl = t >= 6.0 ? Math.pow(1 - prog(t, 6.0, 6.3), 2) : 0;
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
}

// 05 — Data: Swiss-style infographics on cream.
const D1 = [0.35, 0.5, 0.42, 0.62, 0.55, 0.7, 0.48, 0.8, 0.66, 0.92, 0.74, 0.58, 0.85, 0.68];
const D2 = [0.55, 0.38, 0.66, 0.48, 0.78, 0.52, 0.88, 0.6, 0.95, 0.7, 0.62, 0.9, 0.72, 0.97];
function sceneData(ctx, t) {
  ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);
  const base = 940, x0 = 150, bw = 52, gap = 22, maxH = 430;

  ctx.strokeStyle = 'rgba(11,11,16,0.12)'; ctx.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    const p = E.outExpo(prog(t, 8.6 + k * 0.04, 9.2 + k * 0.04));
    ctx.strokeStyle = k === 0 ? 'rgba(11,11,16,0.6)' : 'rgba(11,11,16,0.12)';
    ctx.beginPath(); ctx.moveTo(x0, base - k * 110); ctx.lineTo(x0 + p * 1040, base - k * 110); ctx.stroke();
  }

  const hs = D1.map((v, i) => {
    const grow = E.outExpo(prog(t, 8.7 + i * 0.035, 9.3 + i * 0.035));
    const swap = E.outBack(prog(t, 9.85 + i * 0.02, 10.25 + i * 0.02));
    return lerp(v, D2[i], swap) * maxH * grow;
  });
  hs.forEach((h, i) => {
    if (h <= 0.5) return;
    ctx.fillStyle = i === 8 ? C.coral : C.bg;
    ctx.beginPath(); ctx.roundRect(x0 + i * (bw + gap), base - h, bw, h, [10, 10, 0, 0]); ctx.fill();
  });

  const lp = prog(t, 9.0, 9.7);
  if (lp > 0) {
    const pts = hs.map((h, i) => [x0 + i * (bw + gap) + bw / 2, base - h - 70]);
    const L = lp * (pts.length - 1), n = Math.floor(L);
    ctx.strokeStyle = C.violet; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    let head = pts[n];
    if (n < pts.length - 1) {
      const fr = L - n;
      head = [lerp(pts[n][0], pts[n + 1][0], fr), lerp(pts[n][1], pts[n + 1][1], fr)];
      ctx.lineTo(head[0], head[1]);
    }
    ctx.stroke();
    ctx.fillStyle = C.cream; ctx.beginPath(); ctx.arc(head[0], head[1], 14, 0, TAU); ctx.fill();
    ctx.fillStyle = C.violet; ctx.beginPath(); ctx.arc(head[0], head[1], 8, 0, TAU); ctx.fill();
  }

  const rx = 1530, ry = 560;
  [[230, 0.82, C.coral], [170, 0.64, C.violet], [110, 0.93, C.bg]].forEach(([r, v, col], k) => {
    const p = E.outExpo(prog(t, 8.8 + k * 0.12, 9.9 + k * 0.12));
    ctx.lineWidth = 40; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(11,11,16,0.07)';
    ctx.beginPath(); ctx.arc(rx, ry, r, 0, TAU); ctx.stroke();
    if (p > 0.001) {
      ctx.strokeStyle = col;
      ctx.beginPath(); ctx.arc(rx, ry, r, -Math.PI / 2, -Math.PI / 2 + TAU * v * p); ctx.stroke();
    }
  });
  const cnt = Math.round(98 * E.outExpo(prog(t, 8.8, 9.9)));
  ctx.fillStyle = C.bg; ctx.font = font(900, 64); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(cnt + '%', rx, ry + 4);
  ctx.textBaseline = 'alphabetic';

  revealText(ctx, 'DATA THAT MOVES', x0, 250, 104, 900, C.bg, t, 8.62, { stagger: 0.025 });
  const sa = E.outCubic(prog(t, 9.1, 9.6));
  ctx.save(); ctx.globalAlpha = sa * 0.6; ctx.fillStyle = C.bg; ctx.font = font(400, 32); ctx.textAlign = 'left';
  ctx.fillText('Turning numbers into narratives.', x0 + lerp(-30, 0, sa), 320);
  ctx.globalAlpha = sa; ctx.font = font(700, 24); ctx.letterSpacing = '6px'; ctx.textAlign = 'center';
  ctx.fillText('+312% ENGAGEMENT', rx, ry + 330);
  ctx.restore();

  const fl = t >= 8.55 ? Math.pow(1 - prog(t, 8.55, 8.85), 2) : 0;
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
}

// 06 — Fluid: screen-blended morphing blobs + echo typography.
const BLOBS = [[C.coral, C.pink], [C.violet, C.cyan], [C.lime, C.cyan]];
function blobPath(ctx, cx, cy, R, t, k) {
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * TAU;
    const r = R * (1 + 0.13 * Math.sin(3 * a + t * 2.1 + k) + 0.08 * Math.sin(5 * a - t * 1.7 + 2 * k) + 0.04 * Math.sin(8 * a + t * 3.1));
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function sceneFluid(ctx, t) {
  const strips = 12, sw = W / strips;
  ctx.save();
  ctx.fillStyle = C.violet;
  for (let i = 0; i < strips; i++) {
    const p = E.inOutExpo(prog(t, 10.2 + i * 0.022, 10.48 + i * 0.022));
    ctx.fillRect(i * sw - 1, H - H * p, sw + 2, H * p);
  }
  ctx.beginPath();
  for (let i = 0; i < strips; i++) {
    const p = E.inOutExpo(prog(t, 10.27 + i * 0.022, 10.55 + i * 0.022));
    ctx.rect(i * sw - 1, H - H * p, sw + 2, H * p);
  }
  ctx.clip();
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = 'screen';
  BLOBS.forEach(([a, b], k) => {
    const s = E.outElastic(prog(t, 10.45 + k * 0.08, 11.4 + k * 0.08));
    if (s <= 0) return;
    const cx = W / 2 + Math.cos(t * 0.8 + k * 2.1) * 360, cy = H / 2 + Math.sin(t * 1.1 + k * 2.1) * 190;
    const R = 300 * s;
    const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    g.addColorStop(0, a); g.addColorStop(1, b);
    ctx.fillStyle = g; blobPath(ctx, cx, cy, R, t, k); ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';

  const amp = E.outExpo(prog(t, 11.0, 11.5));
  if (amp > 0) {
    ctx.font = font(900, 360); ctx.textAlign = 'center'; ctx.lineWidth = 2.5;
    for (let e = 6; e >= 1; e--) {
      const dy = e * 44 * amp * (0.6 + 0.4 * Math.sin(t * 4 - e * 0.5));
      ctx.strokeStyle = `rgba(244,240,232,${(1 - e / 7) * 0.55})`;
      ctx.strokeText('FLUID', W / 2, 670 - dy);
      ctx.strokeText('FLUID', W / 2, 670 + dy);
    }
  }
  ctx.globalCompositeOperation = 'difference';
  revealText(ctx, 'FLUID', W / 2, 670, 360, 900, '#FFFFFF', t, 10.65, { align: 'center', stagger: 0.05 });
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// 07 — Montage: rapid-fire recap cuts.
const CUTS = [['TYPE', C.coral, C.bg], ['SHAPE', C.lime, C.bg], ['DEPTH', C.violet, C.ink], ['DATA', C.cream, C.bg], ['FLUID', C.cyan, C.bg], ['MOTION', C.pink, C.bg]];
function sceneMontage(ctx, t) {
  const k = Math.min(CUTS.length - 1, Math.floor((t - 11.9) / 0.1));
  const u = ((t - 11.9) - k * 0.1) / 0.1;
  const [word, bg, fg] = CUTS[k];
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  const s = lerp(1.25, 1, E.outExpo(u));
  ctx.scale(s, s);
  ctx.strokeStyle = fg; ctx.globalAlpha = 0.18; ctx.lineWidth = 6;
  ctx.save(); ctx.rotate(k * 0.7 + u * 0.3);
  if (k % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, 420, 0, TAU); ctx.stroke(); }
  else if (k % 3 === 1) { ctx.strokeRect(-380, -380, 760, 760); }
  else { ctx.beginPath(); ctx.moveTo(0, -460); ctx.lineTo(400, 230); ctx.lineTo(-400, 230); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
  ctx.globalAlpha = 1; ctx.fillStyle = fg; ctx.font = font(900, 360); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(word, 0, 10);
  ctx.restore();
}

// 08 — Identity: the name resolve.
const DUST = (() => { const r = rng(9), a = []; for (let i = 0; i < 140; i++) a.push([r() * W, r() * H, 1 + r() * 2.5, r() * TAU, 10 + r() * 30]); return a; })();
const STREAKS = (() => { const r = rng(3), a = []; for (let i = 0; i < 46; i++) a.push({ y: 140 + r() * 800, len: 200 + r() * 800, d: r() * 0.18, side: i % 2, c: PALETTE[i % 5], w: 2 + r() * 6 }); return a; })();
function sceneIdentity(ctx, t) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  const z = 1 + 0.035 * prog(t, 13.0, 15.0);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);

  const ra = E.outCubic(prog(t, 13.0, 13.8));
  if (ra > 0) {
    ctx.lineWidth = 1.5;
    [[380, 0.25], [520, -0.18], [680, 0.12]].forEach(([r, sp], i) => {
      ctx.strokeStyle = `rgba(244,240,232,${0.13 * ra})`;
      ctx.setLineDash([4 + i * 4, 14 + i * 6]);
      ctx.save(); ctx.translate(cx, 540); ctx.rotate(t * sp);
      ctx.beginPath(); ctx.arc(0, 0, r * lerp(0.6, 1, ra), 0, TAU); ctx.stroke(); ctx.restore();
    });
    ctx.setLineDash([]);
    for (const [x, y, s, ph, sp] of DUST) {
      ctx.fillStyle = `rgba(244,240,232,${0.35 * ra * (0.5 + 0.5 * Math.sin(t * 2 + ph))})`;
      ctx.beginPath(); ctx.arc(x + Math.sin(t * 0.5 + ph) * sp, y - (t - 13) * sp, s, 0, TAU); ctx.fill();
    }
  }

  ctx.lineCap = 'round';
  for (const s of STREAKS) {
    const p = E.inOutCubic(prog(t, 12.45 + s.d * 0.6, 13.0));
    if (p <= 0 || p >= 1) continue;
    const head = s.side ? lerp(W + s.len, cx, p) : lerp(-s.len, cx, p);
    const tail = s.side ? head + s.len * (1 - p * 0.7) : head - s.len * (1 - p * 0.7);
    const y = lerp(s.y, 540, p * p);
    ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.globalAlpha = 1 - p * 0.4;
    ctx.beginPath(); ctx.moveTo(tail, y); ctx.lineTo(head, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const sw = prog(t, 13.0, 13.7);
  if (sw > 0 && sw < 1) {
    ctx.beginPath(); ctx.arc(cx, 540, E.outExpo(sw) * 1200, 0, TAU);
    ctx.lineWidth = lerp(50, 0, sw); ctx.strokeStyle = C.coral; ctx.stroke();
  }

  // name with per-letter color-block wipes
  const S = 280, base = 610, name = 'CLAUDE';
  ctx.font = font(900, S);
  const ws = [...name].map(c => ctx.measureText(c).width);
  const tr = -6, total = ws.reduce((a, b) => a + b, 0) + tr * (name.length - 1);
  let lx = cx - total / 2;
  [...name].forEach((ch, i) => {
    const t0 = 13.0 + i * 0.055;
    const p1 = E.inOutExpo(prog(t, t0, t0 + 0.24)), p2 = E.inOutExpo(prog(t, t0 + 0.24, t0 + 0.5));
    const top = base - S * 0.76, hgt = S * 0.8, w = ws[i] + 4;
    if (p1 >= 1) {
      ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(ch, lx, base);
    }
    if (p1 > 0 && p2 < 1) {
      ctx.fillStyle = PALETTE[i % 5];
      const a = lx - 2 + w * p2, b = lx - 2 + w * p1;
      ctx.fillRect(a, top, b - a, hgt);
    }
    lx += ws[i] + tr;
  });

  const ap = E.outBack(prog(t, 13.35, 13.85));
  asterisk(ctx, cx, 215, 58 * ap, t * 1.4, C.lime);

  const ul = E.outExpo(prog(t, 13.5, 14.1));
  if (ul > 0) { ctx.fillStyle = C.coral; ctx.fillRect(cx - 520 * ul, 668, 1040 * ul, 7); }

  const st = E.outExpo(prog(t, 13.6, 14.2));
  if (st > 0) {
    ctx.save(); ctx.globalAlpha = st; ctx.fillStyle = C.ink; ctx.textAlign = 'center';
    ctx.font = font(600, 42); ctx.letterSpacing = lerp(40, 22, st) + 'px';
    ctx.fillText('MOTION DESIGNER', cx + 11, 760);
    ctx.globalAlpha = st * 0.55; ctx.font = font(400, 24); ctx.letterSpacing = '10px';
    ctx.fillText('SHOWREEL — 2026', cx + 5, 815);
    ctx.restore();
  }
  ctx.restore();

  const fo = prog(t, 14.55, 15.0);
  if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${E.inOutCubic(fo)})`; ctx.fillRect(0, 0, W, H); }
}

const SCENES = [
  [0, 1.6, sceneIgnition],
  [1.25, 3.6, sceneType],
  [3.1, 6.0, sceneGrid],
  [6.0, 8.6, sceneDepth],
  [8.55, 10.6, sceneData],
  [10.2, 11.9, sceneFluid],
  [11.9, 12.5, sceneMontage],
  [12.5, 15.01, sceneIdentity],
];
const LABELS = [[0, '01 — IGNITION'], [1.25, '02 — KINETIC TYPE'], [3.35, '03 — RHYTHM'], [6.0, '04 — DIMENSION'], [8.55, '05 — DATA'], [10.4, '06 — FLUID'], [11.9, '07 — CUTS'], [12.5, '08 — IDENTITY']];

// ================================================================ RENDERER
const out = document.getElementById('c');
const octx = out.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
const [scratch, sctx] = mk(), [acc, actx] = mk(), [rC, rctx] = mk(), [gC, gctx] = mk();

const grain = Array.from({ length: 4 }, (_, n) => {
  const c = document.createElement('canvas'); c.width = 960; c.height = 540;
  const x = c.getContext('2d'), img = x.createImageData(960, 540), r = rng(100 + n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
});
const vignette = (() => {
  const [c, x] = mk();
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
})();

function drawWorld(ctx, t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const imp = impact(t);
  ctx.save();
  if (imp > 0.002) {
    const a = imp * 26;
    ctx.translate(W / 2 + Math.sin(t * 97.3) * a, H / 2 + Math.cos(t * 83.1 + 1.3) * a);
    ctx.rotate(Math.sin(t * 61.7) * imp * 0.012);
    ctx.scale(1 + imp * 0.05, 1 + imp * 0.05);
    ctx.translate(-W / 2, -H / 2);
  }
  for (const [a, b, fn] of SCENES) if (t >= a && t < b) fn(ctx, t);
  ctx.restore();
}

function hud(ctx, t, f) {
  const a = E.outCubic(prog(t, 0.6, 1.1)) * (1 - prog(t, 12.9, 13.3));
  if (a <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.globalAlpha = a * 0.85;
  ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2;
  const m = 48, L = 34;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
  }
  ctx.font = font(700, 17); ctx.letterSpacing = '4px'; ctx.textBaseline = 'middle';
  ctx.textAlign = 'left'; ctx.fillText('CLAUDE  ✳  MOTION REEL', m + 24, m + 22);
  let label = LABELS[0][1]; for (const [lt, l] of LABELS) if (t >= lt) label = l;
  ctx.fillText(label, m + 24, H - m - 22);
  ctx.font = '400 17px "DejaVu Sans Mono", monospace'; ctx.letterSpacing = '2px'; ctx.textAlign = 'right';
  const ss = Math.floor(t), ff = f % FPS;
  ctx.fillText(`TC 00:00:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`, W - m - 24, m + 22);
  const bw = 220, bx = W - m - 24 - bw, by = H - m - 22;
  ctx.globalAlpha = a * 0.3; ctx.fillRect(bx, by - 1, bw, 2);
  ctx.globalAlpha = a * 0.85; ctx.fillRect(bx, by - 2, bw * (t / DURATION), 4);
  ctx.restore();
}

function chroma(amt) {
  rctx.globalCompositeOperation = 'copy'; rctx.drawImage(out, 0, 0);
  rctx.globalCompositeOperation = 'multiply'; rctx.fillStyle = '#f00'; rctx.fillRect(0, 0, W, H);
  gctx.globalCompositeOperation = 'copy'; gctx.drawImage(out, 0, 0);
  gctx.globalCompositeOperation = 'multiply'; gctx.fillStyle = '#0ff'; gctx.fillRect(0, 0, W, H);
  octx.globalCompositeOperation = 'copy'; octx.drawImage(rC, amt, 0);
  octx.globalCompositeOperation = 'lighter'; octx.drawImage(gC, -amt, 0);
  octx.globalCompositeOperation = 'source-over';
}

function renderFrame(f, sub = SUBFRAMES) {
  const t0 = f / FPS;
  for (let i = 0; i < sub; i++) {
    drawWorld(sctx, t0 + (i / sub) * (SHUTTER / FPS));
    actx.globalAlpha = 1 / (i + 1);
    actx.drawImage(scratch, 0, 0);
  }
  actx.globalAlpha = 1;
  octx.globalCompositeOperation = 'copy';
  octx.drawImage(acc, 0, 0);
  octx.globalCompositeOperation = 'source-over';
  const imp = impact(t0);
  if (imp > 0.03) chroma(Math.round(imp * 16));
  octx.drawImage(vignette, 0, 0);
  octx.save();
  octx.imageSmoothingEnabled = false;
  octx.globalCompositeOperation = 'overlay'; octx.globalAlpha = 0.07;
  octx.drawImage(grain[f % 4], 0, 0, W, H);
  octx.restore();
  hud(octx, t0, f);
}

window.REEL = { W, H, FPS, DURATION, FRAMES: Math.round(FPS * DURATION) };
window.renderFrame = renderFrame;
window.ready = (async () => {
  await Promise.all([200, 400, 500, 600, 700, 900].map(w => document.fonts.load(font(w, 100), 'A')));
  await document.fonts.ready;
})();

// Real-time preview when opened directly in a browser.
if (!window.__RENDER__) {
  window.ready.then(() => {
    const start = performance.now();
    const loop = now => {
      const f = Math.floor(((now - start) / 1000) * FPS) % window.REEL.FRAMES;
      renderFrame(f, 1);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
