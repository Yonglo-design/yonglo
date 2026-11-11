/* Footer van de hele site.
   Elke pagina heeft alleen <footer class="fd" data-footer></footer>; dit script vult hem.
   Aanpassen aan de footer (links, teksten) doe je dus alleen hier, in FOOTER_HTML. */
/* Animatie: ontwerp (Marko) naast code (Joris). Elke getypte <path>-regel bouwt een letter van het logo. */
(() => {
'use strict';

// ---------- footer-inhoud ----------
const offerte = document.getElementById('contact') ? '#contact' : '/contact.html';
const FOOTER_HTML = `
  <div class="fd-in">
    <div class="fd-brand">
      <p class="fd-big">Zullen we iets<br>moois <em>bouwen?</em></p>
      <p class="fd-contact"><a href="mailto:contact@yonglo.com">contact@yonglo.com</a><a href="tel:+31852033223">085 20 33 223</a></p>
      <div class="fd-social"><a href="https://www.instagram.com/yonglo.design" target="_blank" rel="noopener" aria-label="Yonglo op Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg></a><a href="https://www.linkedin.com/company/yonglo" target="_blank" rel="noopener" aria-label="Yonglo op LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4z"/></svg></a></div>
      <div class="fd-ai" data-vraag>
        <p class="fd-ai-t"><span class="fd-ai-spark" aria-hidden="true">✦</span> Vraag je AI naar Yonglo</p>
        <div class="fd-ai-btns"><a data-ai="chatgpt" href="https://chatgpt.com/">ChatGPT</a><a data-ai="claude" href="https://claude.ai/new">Claude</a><a data-ai="perplexity" href="https://www.perplexity.ai/">Perplexity</a></div>
      </div>
    </div>
    <div class="fd-cols">
      <div><h2>Diensten</h2><a href="/webdesign.html">Webdesign</a><a href="/ecommerce.html">eCommerce</a><a href="/development.html">Development</a><a href="/branding.html">Concept &amp; Branding</a><a href="/wix.html">Wix websites</a><a href="/optimaal.html">Website verbeteren</a><a href="/seo.html">SEO, GEO &amp; succes</a><a href="/ai.html">AI oplossingen</a><a href="/api.html">API koppelingen</a></div>
      <div><h2>Yonglo</h2><a href="/over-yonglo.html">Over Yonglo</a><a href="/over-yonglo.html#locaties">Locaties</a><a href="/contact.html#faq">FAQ</a><a href="/nieuws.html">Nieuws</a><a href="/portfolio.html">Portfolio</a><a href="/spel.html">Speel Pixel Perfect</a><a href="/contact.html">Contact</a></div>
      <div><h2>Contact</h2><a href="https://wa.me/31638148565" target="_blank" rel="noopener">WhatsApp support</a><a href="${offerte}">Offerte aanvragen</a></div>
    </div>
  </div>
  <div class="fd-stage">
    <div class="fd-win fd-design">
      <div class="fd-bar"><i></i><i></i><i></i><span class="mono">ontwerp · yonglo-logo</span></div>
      <div class="fd-canvas" id="fd-canvas">
        <svg class="fd-svg" id="fd-svg" viewBox="-30 -24 537 156" aria-hidden="true">
          <g class="fd-guides">
            <line x1="-30" x2="507" y1="4.9" y2="4.9"/>
            <line x1="-30" x2="507" y1="97.5" y2="97.5"/>
            <line x1="-30" x2="507" y1="51.2" y2="51.2" class="faint"/>
          </g>
          <g class="fd-wire" id="fd-wire"></g>
          <g class="fd-solid" id="fd-solid"></g>
          <g class="fd-nodes" id="fd-nodes"></g>
          <g class="fd-red">
            <line x1="-14" x2="-14" y1="4.9" y2="97.5"/><line x1="-18" x2="-10" y1="4.9" y2="4.9"/><line x1="-18" x2="-10" y1="97.5" y2="97.5"/>
            <rect x="-24" y="45" width="20" height="11" rx="2"/><text x="-14" y="53">92</text>
            <line x1="62.8" x2="71.2" y1="110" y2="110"/><line x1="62.8" x2="62.8" y1="106" y2="114"/><line x1="71.2" x2="71.2" y1="106" y2="114"/>
            <rect x="57" y="115" width="20" height="10" rx="2"/><text x="67" y="122.5">8</text>
          </g>
        </svg>
        <div class="fd-cursor" data-who="marko" style="--c:#FF7A59"><svg viewBox="0 0 16 20"><path d="M1 1l13 8.2-6.1 1.2L5 18z"/></svg><span>Marko · design</span></div>
      </div>
    </div>
    <div class="fd-win fd-editor">
      <div class="fd-bar"><i></i><i></i><i></i><span class="mono">footer.html · Wix Velo</span></div>
      <div class="fd-code mono" id="fd-code" aria-hidden="true"></div>
      <div class="fd-status mono" id="fd-status"><span>Bouwen…</span></div>
    </div>
  </div>
  <div class="fd-bot"><span>© <span class="yr">2026</span> Yonglo · Think Wix, think Yonglo</span><span><a href="/disclaimer.html">Disclaimer</a> · <a href="/privacybeleid.html">Privacybeleid</a> · <a href="/voorwaarden.html">Voorwaarden</a></span></div>
`;
const host = document.querySelector('footer[data-footer]');
if (!host) return;
host.innerHTML = FOOTER_HTML;
host.querySelectorAll('.yr').forEach(e => { e.textContent = new Date().getFullYear(); });
// "Vraag je AI"-knoppen (ook gebruikt op ai.html)
if (window.ylVraagAI) window.ylVraagAI.zetLinks(host);
else if (!document.querySelector('script[src^="/assets/vraag-ai.js"]')) { const s = document.createElement('script'); s.src = '/assets/vraag-ai.js'; document.head.appendChild(s); }


const LOGO = [
  'M61.4,5.1h-13.8c-.8,0-1.4.6-1.4,1.4v36.6c0,5.7-1.5,15.4-11.2,15.4s-11.3-8.4-11.3-15.4V6.5c0-.8-.6-1.4-1.4-1.4h-13.8c-.8,0-1.4.6-1.4,1.4v36.6c0,15.4,7.3,26.5,19.6,30v22.8c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-22.8c12.3-3.6,19.6-14.6,19.6-30V6.5c0-.8-.6-1.4-1.4-1.4Z',
  'M121.8,5.1c-30.1-2.5-53,20.4-50.5,50.5,1.8,20.9,20.6,39.8,41.5,41.5,30.1,2.5,53-20.4,50.5-50.5-1.8-20.9-20.6-39.8-41.5-41.5ZM117.3,81.5c-17,0-29.9-13.1-29.9-30.4s12.8-30.4,29.9-30.4,29.9,13.1,29.9,30.4-12.8,30.4-29.9,30.4Z',
  'M206.1,5.4h0c-6.2-1.2-11.7-.1-12.4,0-13.5,2.9-21.5,14.3-21.5,30.5v60.1c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-60.1c0-5.7,1.5-15.4,11.2-15.4s11.3,8.4,11.3,15.4v60.1c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-60.1c0-16.3-8.2-27.8-21.8-30.5Z',
  'M327.3,42.9h-43c-.8,0-1.4.6-1.4,1.4v12.7c0,.8.6,1.4,1.4,1.4h26.2c.8,0,1.4.8,1.2,1.6-3.6,12.8-14.9,21.4-28.7,21.4s-29.9-13.1-29.9-30.4,12.8-30.4,29.9-30.4,17.7,3.9,23.2,10.8h0c1,1.2,2.7,1.3,3.9.3l7.9-7.4c1-1,1.1-2.6.2-3.6h0c-8.7-10.1-21.2-15.7-35.1-15.7-23.3,0-41.5,15.5-45.4,37.3-6.4,35.6,18.7,60.7,54.3,54.3,21.8-3.9,37.3-22.1,37.3-45.4s-.1-4-.4-5.9v-1.1c-.2-.7-.8-1.2-1.5-1.2Z',
  'M354.3,66.3V6.3c0-.8-.6-1.4-1.4-1.4h-13.8c-.8,0-1.4.6-1.4,1.4v60.1c0,16.3,8.2,27.8,21.8,30.5,1.9.4,4,.5,6.1.5,3.5,0,5.9-.5,6.2-.6l1-.2c.7-.1,1.1-.7,1.1-1.4v-12.1c0-.8-.6-1.4-1.4-1.4h-6.9c-9.4,0-11.3-8.4-11.3-15.4Z',
  'M428.2,5.1c-30.1-2.5-53,20.4-50.5,50.5,1.8,20.9,20.6,39.8,41.5,41.5,30.1,2.5,53-20.4,50.5-50.5-1.8-20.9-20.6-39.8-41.5-41.5ZM423.7,81.5c-17,0-29.9-13.1-29.9-30.4s12.8-30.4,29.9-30.4,29.9,13.1,29.9,30.4-12.8,30.4-29.9,30.4Z'
];
const NS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
    '<footer class="fd">',
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

initD();
})();
