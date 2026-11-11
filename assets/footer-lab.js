/* Footer-lab: vier experimentele footers (A t/m D). Niet live. */
(() => {
'use strict';

/* ---------- gedeeld ---------- */
const LOGO = [
  'M61.4,5.1h-13.8c-.8,0-1.4.6-1.4,1.4v36.6c0,5.7-1.5,15.4-11.2,15.4s-11.3-8.4-11.3-15.4V6.5c0-.8-.6-1.4-1.4-1.4h-13.8c-.8,0-1.4.6-1.4,1.4v36.6c0,15.4,7.3,26.5,19.6,30v22.8c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-22.8c12.3-3.6,19.6-14.6,19.6-30V6.5c0-.8-.6-1.4-1.4-1.4Z',
  'M121.8,5.1c-30.1-2.5-53,20.4-50.5,50.5,1.8,20.9,20.6,39.8,41.5,41.5,30.1,2.5,53-20.4,50.5-50.5-1.8-20.9-20.6-39.8-41.5-41.5ZM117.3,81.5c-17,0-29.9-13.1-29.9-30.4s12.8-30.4,29.9-30.4,29.9,13.1,29.9,30.4-12.8,30.4-29.9,30.4Z',
  'M206.1,5.4h0c-6.2-1.2-11.7-.1-12.4,0-13.5,2.9-21.5,14.3-21.5,30.5v60.1c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-60.1c0-5.7,1.5-15.4,11.2-15.4s11.3,8.4,11.3,15.4v60.1c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-60.1c0-16.3-8.2-27.8-21.8-30.5Z',
  'M327.3,42.9h-43c-.8,0-1.4.6-1.4,1.4v12.7c0,.8.6,1.4,1.4,1.4h26.2c.8,0,1.4.8,1.2,1.6-3.6,12.8-14.9,21.4-28.7,21.4s-29.9-13.1-29.9-30.4,12.8-30.4,29.9-30.4,17.7,3.9,23.2,10.8h0c1,1.2,2.7,1.3,3.9.3l7.9-7.4c1-1,1.1-2.6.2-3.6h0c-8.7-10.1-21.2-15.7-35.1-15.7-23.3,0-41.5,15.5-45.4,37.3-6.4,35.6,18.7,60.7,54.3,54.3,21.8-3.9,37.3-22.1,37.3-45.4s-.1-4-.4-5.9v-1.1c-.2-.7-.8-1.2-1.5-1.2Z',
  'M354.3,66.3V6.3c0-.8-.6-1.4-1.4-1.4h-13.8c-.8,0-1.4.6-1.4,1.4v60.1c0,16.3,8.2,27.8,21.8,30.5,1.9.4,4,.5,6.1.5,3.5,0,5.9-.5,6.2-.6l1-.2c.7-.1,1.1-.7,1.1-1.4v-12.1c0-.8-.6-1.4-1.4-1.4h-6.9c-9.4,0-11.3-8.4-11.3-15.4Z',
  'M428.2,5.1c-30.1-2.5-53,20.4-50.5,50.5,1.8,20.9,20.6,39.8,41.5,41.5,30.1,2.5,53-20.4,50.5-50.5-1.8-20.9-20.6-39.8-41.5-41.5ZM423.7,81.5c-17,0-29.9-13.1-29.9-30.4s12.8-30.4,29.9-30.4,29.9,13.1,29.9,30.4-12.8,30.4-29.9,30.4Z'
];
const VBW = 476.9, VBH = 102.4;
const NS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

document.querySelectorAll('.yr').forEach(e => { e.textContent = new Date().getFullYear(); });
const logoMarkup = `<svg class="wordmark" viewBox="0 0 ${VBW} ${VBH}" aria-hidden="true" focusable="false">${LOGO.map(d => `<path d="${d}"/>`).join('')}</svg>`;
document.querySelectorAll('[data-logo]').forEach(e => { e.innerHTML = logoMarkup; });

// Het logo rasteren naar een grid: per cel de dekking (0..1). aspect = celhoogte / celbreedte.
function rasterLogo(cols, aspect = 1) {
  const ss = 4, rows = Math.max(1, Math.round(cols * VBH / VBW / aspect));
  const cv = document.createElement('canvas');
  cv.width = cols * ss; cv.height = rows * ss;
  const x = cv.getContext('2d', { willReadFrequently: true });
  x.scale(cv.width / VBW, cv.height / VBH);
  LOGO.forEach(d => x.fill(new Path2D(d)));
  const px = x.getImageData(0, 0, cv.width, cv.height).data;
  const g = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let sum = 0;
    for (let j = 0; j < ss; j++) for (let i = 0; i < ss; i++) sum += px[((r * ss + j) * cv.width + c * ss + i) * 4 + 3];
    g[r * cols + c] = sum / (255 * ss * ss);
  }
  return { cols, rows, g };
}

function fitCanvas(cv) {
  const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(r.width * dpr));
  cv.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

// Animatie alleen laten lopen als het element in beeld is.
function whileVisible(el, frame, onEnter) {
  let vis = false, raf = 0;
  const tick = t => { frame(t); raf = vis ? requestAnimationFrame(tick) : 0; };
  new IntersectionObserver(([e]) => {
    vis = e.isIntersecting;
    if (vis && onEnter) onEnter();
    if (vis && !raf) raf = requestAnimationFrame(tick);
  }, { rootMargin: '80px', threshold: 0.15 }).observe(el);
}

function pointer(el) {
  const m = { x: -1e4, y: -1e4, in: false };
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; m.in = true; });
  el.addEventListener('pointerleave', () => { m.in = false; });
  return m;
}

const resizers = [];
let rzT;
window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => resizers.forEach(f => f()), 150); });

/* =========================================================
   A · Bouwstenen: logo als 3D-blokken die op hun plek vallen
   ========================================================= */
function initA() {
  const cv = document.getElementById('fa-canvas'); if (!cv) return;
  const stage = cv.parentElement, m = pointer(stage);
  const COLS = 64, D = 1.5, KX = 0.62, KY = 0.42, CROP = 0.2;
  const { rows, g } = rasterLogo(COLS, 1);
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < COLS; c++) {
    if (g[r * COLS + c] > 0.42) {
      const y = rows - 1 - r;
      cells.push({ c, y, lift: 0, delay: c * 16 + y * 55 + Math.random() * 120 });
    }
  }
  cells.sort((a, b) => (a.c + a.y) - (b.c + b.y) || a.y - b.y);
  let ctx, W, H, s, ox, base, start = reduce ? -1e6 : null;

  function size() {
    W = stage.clientWidth;
    s = Math.min(W - 48, 1440) / (COLS + D * KX);
    stage.style.height = Math.round((rows * (1 - CROP) + D * KY + 2.5) * s) + 'px';
    ({ ctx, w: W, h: H } = fitCanvas(cv));
    ox = (W - s * (COLS + D * KX)) / 2;
    base = H + rows * CROP * s;
  }
  size(); resizers.push(size);

  const X = (x, z) => ox + (x + z * KX) * s;
  const Y = (y, z) => base - (y + z * KY) * s;
  const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
  const FRONT = [24, 25, 34], TOP = [78, 80, 96], RIGHT = [40, 41, 54], SPARK = [50, 95, 252], SPARK2 = [122, 151, 253];
  const bounce = p => { const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + .75; if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + .9375; return n * (p -= 2.625 / d) * p + .984375; };
  const quad = (a, b, c, d, e, f, g2, h) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.lineTo(e, f); ctx.lineTo(g2, h); ctx.closePath(); ctx.fill(); };

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    if (start === null) return;
    const mc = (m.x - ox) / s - D * KX * 0.5, my = (base - m.y) / s;
    for (const k of cells) {
      const p = clamp((now - start - k.delay) / 900, 0, 1);
      if (p <= 0) continue;
      let target = 0;
      if (m.in) { const dx = k.c + .5 - mc, dy = (k.y + .5 - my) * .6; target = 1.1 * Math.exp(-(dx * dx + dy * dy) / 9); }
      k.lift += (target - k.lift) * 0.14;
      const y = k.y + (1 - bounce(p)) * 16 + k.lift, c = k.c, hl = clamp(k.lift, 0, 1);
      ctx.fillStyle = mix(RIGHT, SPARK, hl * .7);
      quad(X(c + 1, 0), Y(y, 0), X(c + 1, 0), Y(y + 1, 0), X(c + 1, D), Y(y + 1, D), X(c + 1, D), Y(y, D));
      ctx.fillStyle = mix(TOP, SPARK2, hl);
      quad(X(c, 0), Y(y + 1, 0), X(c + 1, 0), Y(y + 1, 0), X(c + 1, D), Y(y + 1, D), X(c, D), Y(y + 1, D));
      ctx.fillStyle = mix(FRONT, SPARK, hl * .85);
      ctx.fillRect(X(c, 0), Y(y + 1, 0), s + .5, s + .5);
    }
  }
  whileVisible(stage, frame, () => { if (start === null) start = performance.now(); });
  document.querySelector('[data-replay="a"]')?.addEventListener('click', () => { start = performance.now(); cells.forEach(k => { k.delay = k.c * 16 + k.y * 55 + Math.random() * 120; }); });
}

/* =========================================================
   B · Polder in pixels: halftoon-landschap Haarlem + Eindhoven
   ========================================================= */
function initB() {
  const cv = document.getElementById('fb-canvas'); if (!cv) return;
  const stage = cv.parentElement, m = pointer(stage);
  const off = document.createElement('canvas'), oc = off.getContext('2d', { willReadFrequently: true });
  let ctx, W, H, P, cw, ch;
  function size() {
    ({ ctx, w: W, h: H } = fitCanvas(cv));
    P = W < 640 ? 5 : 7;
    cw = Math.ceil(W / P) + 1; ch = Math.ceil(H / P) + 1;
    off.width = cw; off.height = ch;
  }
  size(); resizers.push(size);

  const gray = a => { const n = Math.round(clamp(a, 0, 1) * 255); return `rgb(${n},${n},${n})`; };
  const hash = i => { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); };
  function ell(x, y, rx, ry, a0 = 0, a1 = Math.PI * 2) { oc.beginPath(); oc.ellipse(x, y, Math.max(rx, .1), Math.max(ry, .1), 0, a0, a1); oc.fill(); }
  function cloud(x, y, r) { ell(x, y, r * 1.9, r * .55); ell(x - r * .6, y - r * .3, r * .8, r * .55); ell(x + r * .45, y - r * .42, r * .95, r * .7); }

  // Tekent het landschap als "donkerte" (wit = donker) op lage resolutie.
  function scene(w, h, t) {
    const c = oc, U = h, y0 = h * .8;
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    // zon met strepen
    const sx = w * .8, sy = h * .34, sr = h * .21;
    c.fillStyle = gray(.5); ell(sx, sy, sr, sr);
    c.fillStyle = '#000';
    for (let i = 0; i < 4; i++) c.fillRect(sx - sr - 2, sy + sr * (.18 + i * .2), sr * 2 + 4, Math.max(1, sr * (.05 + i * .03)));
    // wolken
    c.fillStyle = gray(.3);
    [[.1, .22, 1], [.36, .4, .7], [.58, .14, .55]].forEach(([x, y, k], i) => {
      const cx = ((x * w + t * (1 + i * .45)) % (w + 60)) - 30;
      cloud(cx, y * h, h * .085 * k);
    });
    // vogels
    c.strokeStyle = gray(.75); c.lineWidth = .9;
    [[.63, .2], [.67, .12]].forEach(([x, y], i) => {
      const bx = x * w + Math.sin(t * .3 + i) * 6, by = y * h + Math.sin(t * .5 + i * 2) * 2, f = Math.sin(t * 5 + i * 1.7) * U * .018, s2 = U * .04;
      c.beginPath(); c.moveTo(bx - s2, by + f); c.quadraticCurveTo(bx - s2 * .4, by - s2 * .5, bx, by); c.quadraticCurveTo(bx + s2 * .4, by - s2 * .5, bx + s2, by + f); c.stroke();
    });
    // duinen (hoger aan de Haarlemse kant)
    c.fillStyle = gray(.2); c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w + 2; x += 2) {
      const u = x / w, ramp = 1 - clamp((u - .3) / .4, 0, 1) * .7;
      c.lineTo(x, y0 - U * (.07 + .05 * Math.sin(u * 9 + 1) + .03 * Math.sin(u * 23)) * ramp - U * .02);
    }
    c.lineTo(w, h); c.fill();
    c.fillStyle = gray(.32); c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w + 2; x += 2) {
      const u = x / w, ramp = 1 - clamp((u - .2) / .3, 0, 1);
      c.lineTo(x, y0 - U * (.03 + .03 * Math.sin(u * 14 + 2)) * ramp);
    }
    c.lineTo(w, h); c.fill();

    // Haarlem: Grote of St.-Bavokerk
    const bx = w * .17;
    c.fillStyle = gray(.5);
    c.fillRect(bx - U * .2, y0 - U * .1, U * .4, U * .1);
    c.beginPath(); c.moveTo(bx - U * .2, y0 - U * .1); c.lineTo(bx - U * .16, y0 - U * .17); c.lineTo(bx + U * .16, y0 - U * .17); c.lineTo(bx + U * .2, y0 - U * .1); c.fill();
    c.fillRect(bx - U * .03, y0 - U * .25, U * .06, U * .09);
    c.fillRect(bx - U * .022, y0 - U * .32, U * .044, U * .08);
    c.beginPath(); c.moveTo(bx - U * .026, y0 - U * .32); c.lineTo(bx, y0 - U * .45); c.lineTo(bx + U * .026, y0 - U * .32); c.fill();

    // Haarlem: Molen De Adriaan (draaiende wieken)
    const mx = w * .32, hubY = y0 - U * .33;
    c.fillStyle = gray(.55); c.fillRect(mx - U * .09, y0 - U * .1, U * .18, U * .1);
    c.fillStyle = gray(.72);
    c.beginPath(); c.moveTo(mx - U * .06, y0 - U * .1); c.lineTo(mx - U * .032, hubY + U * .02); c.lineTo(mx + U * .032, hubY + U * .02); c.lineTo(mx + U * .06, y0 - U * .1); c.fill();
    c.fillRect(mx - U * .1, y0 - U * .15, U * .2, Math.max(1, U * .012));
    ell(mx, hubY + U * .015, U * .04, U * .03, Math.PI, Math.PI * 2);
    const L = U * .26, ang = reduce ? .4 : t * .45;
    for (let k = 0; k < 4; k++) {
      c.save(); c.translate(mx, hubY); c.rotate(ang + k * Math.PI / 2);
      c.fillStyle = gray(.8); c.fillRect(-U * .005, 0, U * .01, L);
      c.fillStyle = gray(.5); c.fillRect(U * .005, L * .22, U * .04, L * .78);
      c.restore();
    }

    // Eindhoven: Evoluon
    const ex = w * .58, ey = y0 - U * .13;
    c.fillStyle = gray(.38); c.fillRect(ex - U * .07, y0 - U * .09, U * .14, U * .09);
    c.fillStyle = gray(.6);
    ell(ex, ey, U * .13, U * .035, 0, Math.PI);
    ell(ex, ey, U * .15, U * .075, Math.PI, Math.PI * 2);
    c.fillStyle = gray(.8); ell(ex, ey, U * .165, U * .016);
    c.fillStyle = gray(.6);
    for (let i = -2; i <= 2; i++) c.fillRect(ex + i * U * .05 - U * .004, ey, U * .008, y0 - ey);

    // Eindhoven: Lichttoren
    const lx = w * .7;
    c.fillStyle = gray(.48); c.fillRect(lx - U * .13, y0 - U * .13, U * .26, U * .13);
    c.fillStyle = gray(.6); c.fillRect(lx - U * .035, y0 - U * .31, U * .07, U * .18);
    c.fillRect(lx - U * .05, y0 - U * .34, U * .1, U * .035);
    ell(lx, y0 - U * .34, U * .045, U * .045, Math.PI, Math.PI * 2);
    c.fillStyle = '#000'; for (let i = 0; i < 4; i++) c.fillRect(lx - U * .02, y0 - U * (.29 - i * .04), U * .04, Math.max(.6, U * .01));

    // bomenrij op de horizon
    c.fillStyle = gray(.78);
    const keep = [[bx, .24], [mx, .12], [ex, .2], [lx, .16]];
    for (let i = 0, x = 0; x < w; i++) {
      const r = U * (.018 + hash(i) * .022);
      if (!keep.some(([kx, kr]) => Math.abs(x - kx) < kr * U)) ell(x, y0 - r * 1.1, r * .75, r * 1.25);
      x += U * (.03 + hash(i + 99) * .05);
    }

    // polder met sloten in perspectief
    const grd = c.createLinearGradient(0, y0, 0, h); grd.addColorStop(0, gray(.42)); grd.addColorStop(1, gray(.7));
    c.fillStyle = grd; c.fillRect(0, y0, w, h - y0);
    c.strokeStyle = gray(.82); c.lineWidth = .6;
    for (let i = 1; i < 7; i++) { const yy = y0 + (h - y0) * (i / 7) ** 1.7; c.beginPath(); c.moveTo(0, yy); c.lineTo(w, yy); c.stroke(); }
    c.strokeStyle = gray(.18); c.lineWidth = .9;
    const vx = w * .5;
    for (let i = -16; i <= 16; i++) { c.beginPath(); c.moveTo(vx + i * w * .015, y0); c.lineTo(vx + i * w * .12, h + 2); c.stroke(); }
  }

  function frame(now) {
    const t = reduce ? 0 : now / 1000;
    scene(cw, ch, t);
    const d = oc.getImageData(0, 0, cw, ch).data;
    const pn = new Path2D(), ph = new Path2D(), R = Math.min(130, W * .12), R2 = R * R;
    for (let j = 0; j < ch; j++) {
      const y = j * P, sh = (j & 1) ? P / 2 : 0;
      for (let i = 0; i < cw; i++) {
        const v = d[(j * cw + i) * 4] / 255;
        if (v < .04) continue;
        const x = i * P + sh;
        let sz = Math.sqrt(v) * P * .46, hot = false;
        if (m.in) {
          const dx = x - m.x, dy = y - m.y, q = dx * dx + dy * dy;
          if (q < R2) { const f = 1 - q / R2; sz *= 1 + f * .55; hot = f > .2; }
        }
        const pp = hot ? ph : pn; pp.moveTo(x + sz, y); pp.arc(x, y, sz, 0, 6.2832);
      }
    }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#23252f'; ctx.fill(pn);
    ctx.fillStyle = '#325FFC'; ctx.fill(ph);
  }
  whileVisible(stage, frame);

  // live meetwaarden
  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const tick = () => { clock.textContent = new Date().toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour12: false }); };
    tick(); setInterval(tick, 1000);
  }
  window.addEventListener('load', () => setTimeout(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const lt = document.querySelector('[data-loadtime]'), wt = document.querySelector('[data-weight]');
    if (nav && lt) lt.textContent = ((nav.loadEventEnd || performance.now()) / 1000).toFixed(2).replace('.', ',') + 's';
    if (wt) {
      const all = [nav, ...performance.getEntriesByType('resource')].filter(Boolean);
      const bytes = all.reduce((a, e) => a + (e.transferSize || e.encodedBodySize || 0), 0);
      wt.textContent = bytes ? Math.round(bytes / 1024) + ' KB' : '–';
    }
  }, 0));
}

/* =========================================================
   C · Broncode: logo opgebouwd uit de HTML van deze pagina
   ========================================================= */
function initC() {
  const cv = document.getElementById('fc-canvas'); if (!cv) return;
  const stage = cv.parentElement, m = pointer(stage);
  const clean = s => s.replace(/\s+/g, ' ').trim();
  let src = clean(document.documentElement.outerHTML), dense = src.replace(/ /g, '');
  fetch(location.href).then(r => r.text()).then(t => { src = clean(t); dense = src.replace(/ /g, ''); }).catch(() => {});
  const GLITCH = '<>/{}[]=;:*#$01';
  let ctx, W, H, CW, CH, FS, cols, rows, cover, heat, glitch, revealAt = null;

  function size() {
    const small = stage.clientWidth < 700;
    CW = small ? 6 : 9; CH = small ? 11 : 16; FS = small ? 9 : 13;
    cols = Math.floor(stage.clientWidth / CW);
    const pad = Math.round(cols * .04), lc = cols - pad * 2;
    const r = rasterLogo(lc, CH / CW);
    const visible = Math.round(r.rows * .84);
    rows = visible + 3;
    stage.style.height = rows * CH + 'px';
    ({ ctx, w: W, h: H } = fitCanvas(cv));
    cover = new Float32Array(cols * rows); heat = new Float32Array(cols * rows); glitch = new Array(cols * rows).fill('');
    const top = rows - visible;
    for (let rr = 0; rr < r.rows; rr++) {
      const row = top + rr; if (row >= rows) break;
      for (let c = 0; c < lc; c++) cover[row * cols + pad + c] = r.g[rr * lc + c];
    }
  }
  size(); resizers.push(size);

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    if (revealAt === null) return;
    const shown = reduce ? Infinity : (now - revealAt) / 1400 * cols * rows;
    const offset = reduce ? 0 : Math.floor(now / 110);
    const len = src.length || 1, R = 6;
    const mc = m.x / CW, mr = m.y / CH;
    ctx.font = `500 ${FS}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textBaseline = 'top';
    const buckets = [[], [], [], []]; // bg, rand, logo, heet
    const fillIn = new Path2D(), fillEdge = new Path2D();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (i > shown) break;
      if (m.in) {
        const dc = c - mc, dr = (r - mr) * (CH / CW), q = Math.sqrt(dc * dc + dr * dr);
        if (q < R) heat[i] = Math.max(heat[i], 1 - q / R);
      }
      heat[i] *= .955;
      const cvg = cover[i];
      if (cvg > .5) fillIn.rect(c * CW, r * CH, CW, CH); else if (cvg > .15) fillEdge.rect(c * CW, r * CH, CW, CH);
      let ch = cvg > .15 ? dense[(i + offset) % dense.length] : src[(i + offset) % len];
      if (heat[i] > .25) { if (!glitch[i] || Math.random() < .25) glitch[i] = GLITCH[(Math.random() * GLITCH.length) | 0]; ch = glitch[i]; }
      else glitch[i] = '';
      if (!ch || ch === ' ') continue;
      buckets[heat[i] > .25 ? 3 : cvg > .5 ? 2 : cvg > .15 ? 1 : 0].push(c, r, ch);
    }
    ctx.fillStyle = 'rgba(50,95,252,.32)'; ctx.fill(fillIn);
    ctx.fillStyle = 'rgba(50,95,252,.13)'; ctx.fill(fillEdge);
    const styles = ['rgba(255,255,255,.055)', 'rgba(122,151,253,.75)', '#ffffff', '#FF7A59'];
    buckets.forEach((b, k) => {
      ctx.fillStyle = styles[k];
      for (let n = 0; n < b.length; n += 3) ctx.fillText(b[n + 2], b[n] * CW, b[n + 1] * CH + 1);
    });
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    whileVisible(stage, frame, () => { if (revealAt === null) revealAt = performance.now(); });
  });

  // terminal die "publiceert"
  const typeEl = document.querySelector('[data-type]'), outEl = document.querySelector('[data-out]');
  if (typeEl && outEl) {
    const sites = ['jouwbedrijf.nl', 'nieuwe-webshop.nl', 'bakkerij-devries.nl', 'jouw-volgende-idee.nl'];
    let n = 0;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    (async function loop() {
      for (;;) {
        const site = sites[n++ % sites.length], cmd = `yonglo publiceer ${site}`;
        outEl.innerHTML = '&nbsp;'; typeEl.textContent = '';
        if (reduce) typeEl.textContent = cmd;
        else for (let i = 1; i <= cmd.length; i++) { typeEl.textContent = cmd.slice(0, i); await wait(45 + Math.random() * 60); }
        await wait(500);
        outEl.textContent = '… bouwen, testen, optimaliseren';
        await wait(1100);
        outEl.textContent = `✓ live op ${site} in ${(1 + Math.random() * 1.5).toFixed(1).replace('.', ',')}s`;
        await wait(3200);
      }
    })();
  }
}

/* =========================================================
   D · Schets → live: wireframe met ankerpunten vs. af logo
   ========================================================= */
function parsePath(d) {
  const tok = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g) || [];
  const anchors = [], handles = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lc = null;
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'Z') { x = sx; y = sy; lc = null; continue; }
    if (C === 'M') { const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; sx = x; sy = y; anchors.push([x, y]); cmd = rel ? 'l' : 'L'; lc = null; continue; }
    if (C === 'L') { const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; }
    else if (C === 'H') { const a = num(); x = rel ? x + a : a; }
    else if (C === 'V') { const a = num(); y = rel ? y + a : a; }
    else if (C === 'C' || C === 'S') {
      let x1, y1;
      if (C === 'C') { const a = num(), b = num(); x1 = rel ? x + a : a; y1 = rel ? y + b : b; }
      else { x1 = lc ? 2 * x - lc[0] : x; y1 = lc ? 2 * y - lc[1] : y; }
      const c2 = num(), d2 = num(), e = num(), f = num();
      const x2 = rel ? x + c2 : c2, y2 = rel ? y + d2 : d2, nx = rel ? x + e : e, ny = rel ? y + f : f;
      handles.push([x, y, x1, y1], [nx, ny, x2, y2]);
      x = nx; y = ny; lc = [x2, y2]; anchors.push([x, y]); continue;
    } else { i++; continue; }
    lc = null; anchors.push([x, y]);
  }
  return { anchors, handles };
}

function initD() {
  const svg = document.getElementById('fd-svg'); if (!svg) return;
  const canvas = document.getElementById('fd-canvas'), codeEl = document.getElementById('fd-code'), status = document.getElementById('fd-status');
  const wire = svg.querySelector('#fd-wire'), solid = svg.querySelector('#fd-solid'), nodes = svg.querySelector('#fd-nodes');
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent && parent.appendChild(n); return n; };
  const attrs = (n, o) => { for (const k in o) n.setAttribute(k, o[k]); };
  const NAMES = ['y', 'o', 'n', 'g', 'l', 'o2'];
  const letters = [], wires = [], nodeGroups = [];
  let hoverI = -1;

  // ontwerp: wireframe, gevulde versie (verborgen tot gebouwd) en ankerpunten
  LOGO.forEach((d, i) => {
    const w = el('path', { d }, wire); wires.push(w);
    w.addEventListener('pointerenter', () => { hoverI = i; });
    w.addEventListener('pointerleave', () => { hoverI = -1; });
    letters.push(el('path', { d }, solid));
    const ng = el('g', {}, nodes); nodeGroups.push(ng);
    const { anchors, handles } = parsePath(d);
    handles.forEach(([ax, ay, hx, hy]) => {
      if (Math.hypot(hx - ax, hy - ay) < 1.5) return;
      el('line', { x1: ax, y1: ay, x2: hx, y2: hy, class: 'h' }, ng);
      el('circle', { cx: hx, cy: hy, r: .9, class: 'hn' }, ng);
    });
    const seen = new Set();
    anchors.forEach(([x, y]) => {
      const k = Math.round(x) + ',' + Math.round(y); if (seen.has(k)) return; seen.add(k);
      el('rect', { x: x - 1.3, y: y - 1.3, width: 2.6, height: 2.6, class: 'n' }, ng);
    });
  });

  // DevTools-inspectie (van Joris) op een letter
  const dev = el('g', { class: 'fd-dev', opacity: 0 }, svg);
  const mg = el('rect', { class: 'mg' }, dev), ct = el('rect', { class: 'ct' }, dev);
  const tip = el('rect', { class: 'tip', rx: 1.5, height: 12 }, dev), tt = el('text', {}, dev);
  let shown = -2;
  function inspect(i) {
    if (i === shown) return; shown = i;
    rows.forEach((r, k) => r.classList.toggle('on', i >= 0 && k === PATH0 + i));
    if (i < 0) { dev.setAttribute('opacity', 0); return; }
    const b = letters[i].getBBox(), m = 4;
    attrs(mg, { x: b.x - m, y: b.y - m, width: b.width + m * 2, height: b.height + m * 2 });
    attrs(ct, { x: b.x, y: b.y, width: b.width, height: b.height });
    tt.textContent = '';
    el('tspan', { class: 'tn' }, tt).textContent = `path.${NAMES[i]}`;
    el('tspan', {}, tt).textContent = `  ${Math.round(b.width)} × ${Math.round(b.height)}`;
    attrs(tt, { x: b.x - m + 3, y: b.y - m - 5.6 });
    attrs(tip, { x: b.x - m, y: b.y - m - 14, width: tt.getComputedTextLength() + 6 });
    dev.setAttribute('opacity', 1);
  }

  // code-editor
  const LINES = [
    '<footer class="ftr">',
    '  <svg class="logo" viewBox="0 0 477 102">',
    ...LOGO.map((d, i) => `    <path class="${NAMES[i]}" d="${d.slice(0, 16)}…"/>`),
    '  </svg>',
    '</footer>',
    '',
    '// Wix Velo · portfolio.js',
    '$w.onReady(async () => {',
    '  const items = await getProjects();',
    "  $w('#portfolio').data = items;",
    '});',
    "await publiceer('yonglo.com');"
  ];
  const PATH0 = 2;
  const RX = /(<!--.*?-->|\/\/.*$)|("[^"]*"|'[^']*')|(<\/?[a-z]+|\/?>)|\b(import|from|const|await|async)\b/g;
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hlHTML = str => {
    let out = '', at = 0;
    str.replace(RX, (m, cm, st, tg, kw, off) => {
      out += esc(str.slice(at, off)) + `<span class="${cm ? 'cm' : st ? 'st' : tg ? 'tg' : 'kw'}">${esc(m)}</span>`;
      at = off + m.length; return m;
    });
    return out + esc(str.slice(at));
  };
  const rows = LINES.map((str, i) => {
    const r = document.createElement('div');
    r.className = 'l';
    r.innerHTML = `<span class="no">${i + 1}</span><span class="tx"></span>`;
    const li = i - PATH0;
    if (li >= 0 && li < LOGO.length) {
      r.dataset.letter = li;
      r.addEventListener('pointerenter', () => { hoverI = li; });
      r.addEventListener('pointerleave', () => { hoverI = -1; });
    }
    codeEl.appendChild(r);
    return r;
  });
  const CURSOR = '<span class="fd-cur"><i class="fd-caret"></i><span class="fd-who">Joris · development</span></span>';

  // tijdlijn: Joris typt regel voor regel; elke <path>-regel bouwt een letter
  const CHAR = 32, PAUSE = 260, HOLD = 4500, RESET = 800;
  const starts = []; let tt0 = 700;
  LINES.forEach(str => { starts.push(tt0); tt0 += str.length * CHAR + PAUSE; });
  const END = tt0, CYCLE = END + HOLD + RESET;
  const doneAt = i => starts[i] + LINES[i].length * CHAR;
  let t0 = null, lastKey = '';

  // Marko ontwerpt mee (Figma-selectie)
  const mk = canvas.querySelector('.fd-cursor[data-who="marko"]');
  const mColor = '#FF7A59';
  const sel = el('g', { class: 'fd-sel', opacity: 0 }, svg);
  const box = el('rect', { class: 'box', stroke: mColor }, sel);
  const hds = [0, 1, 2, 3].map(() => el('rect', { class: 'hd', width: 2.4, height: 2.4, stroke: mColor }, sel));
  const lab = el('text', { fill: mColor }, sel);
  const mc = { x: 60, y: -10, tx: 60, ty: -10, letter: -1, until: 0, next: 0 };
  function pickM(now) {
    let li; do { li = (Math.random() * letters.length) | 0; } while (li === mc.letter);
    const b = letters[li].getBBox();
    mc.letter = li; mc.b = b;
    mc.tx = b.x + b.width * (.3 + Math.random() * .5); mc.ty = b.y + b.height * (.3 + Math.random() * .5);
    mc.until = 0; sel.setAttribute('opacity', 0); mc.next = now + 500 + Math.random() * 700;
  }
  function selectM() {
    const b = mc.b, p = 2.5;
    attrs(box, { x: b.x - p, y: b.y - p, width: b.width + p * 2, height: b.height + p * 2 });
    [[b.x - p, b.y - p], [b.x + b.width + p, b.y - p], [b.x - p, b.y + b.height + p], [b.x + b.width + p, b.y + b.height + p]].forEach(([x, y], i) => attrs(hds[i], { x: x - 1.2, y: y - 1.2 }));
    attrs(lab, { x: b.x - p, y: b.y - p - 3 });
    lab.textContent = `${Math.round(b.width)} × ${Math.round(b.height)}`;
    sel.setAttribute('opacity', 1);
  }

  function frame(now) {
    if (t0 === null) t0 = now;
    const e = reduce ? END + 1 : (now - t0) % CYCLE;
    const resetting = e > END + HOLD;
    let L = LINES.length, n = 0;
    for (let i = 0; i < LINES.length; i++) if (e < doneAt(i)) { L = i; n = Math.max(0, Math.floor((e - starts[i]) / CHAR)); break; }
    const key = resetting ? 'reset' : L + ':' + n;
    if (key !== lastKey) {
      lastKey = key;
      rows.forEach((r, i) => {
        const str = resetting ? '' : i < L ? LINES[i] : i === L ? LINES[i].slice(0, n) : '';
        r.children[0].style.opacity = resetting || i > L ? 0 : 1;
        r.children[1].innerHTML = hlHTML(str) + (!resetting && (i === L || (L === LINES.length && i === L - 1)) ? CURSOR : '');
      });
      LOGO.forEach((_, i) => {
        const built = !resetting && L > PATH0 + i;
        letters[i].classList.toggle('built', built);
        nodeGroups[i].classList.toggle('built', built);
      });
      const live = !resetting && L === LINES.length;
      status.classList.toggle('ok', live);
      status.textContent = resetting ? '↻ Opnieuw' : live ? '✓ Live op yonglo.com · 0,6s' : `● Bouwen · regel ${Math.min(L + 1, LINES.length)}/${LINES.length}`;
    }
    // net gebouwde letter kort inspecteren, of de letter/regel waar de bezoeker overheen beweegt
    let flash = -1;
    if (!resetting) for (let i = 0; i < LOGO.length; i++) { const d = e - doneAt(PATH0 + i); if (d >= 0 && d < 1300) flash = i; }
    inspect(hoverI >= 0 ? hoverI : flash);

    const ctm = svg.getScreenCTM(), cr = canvas.getBoundingClientRect();
    if (!ctm || !mk) return;
    if (mc.letter < 0) pickM(now);
    if (now > mc.next) {
      const k = reduce ? 1 : .045;
      mc.x += (mc.tx - mc.x) * k; mc.y += (mc.ty - mc.y) * k;
      if (!mc.until && Math.hypot(mc.tx - mc.x, mc.ty - mc.y) < .8) { mc.until = now + 1800 + Math.random() * 900; selectM(); }
      if (mc.until && now > mc.until) pickM(now);
    }
    mk.style.transform = `translate(${(ctm.a * mc.x + ctm.e - cr.left).toFixed(1)}px,${(ctm.d * mc.y + ctm.f - cr.top).toFixed(1)}px)`;
  }
  whileVisible(canvas, frame);
}

initA(); initB(); initC(); initD();
})();
