// Zoekfunctie in de header. Doorzoekt live de pagina's van de site (ze worden bij het eerste
// gebruik opgehaald, dus nieuwe teksten zijn meteen vindbaar), de projecten uit het Wix CMS en de blogberichten uit Wix Blog.
const d = document;
let box, input, res, trigger, pages = null, projects = null, posts = null, loading = null, sel = -1;

const norm = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function load() {
  if (loading) return loading;
  const a = indexPages().then(j => { pages = j; }).catch(() => { pages = []; });
  const b = import("/assets/projecten.js").then(m => m.fetchProjects().then(ps => {
    projects = ps.map(p => ({
      u: m.projectUrl(p), t: p.title, d: p.kortTekst || p.intro || "",
      h: [p.branche, p.platform, ...(p.diensten || [])].filter(Boolean), x: [p.intro, p.omschrijving, p.opdrachtgever].filter(Boolean).join(" "), proj: true,
    }));
  })).catch(() => { projects = []; });
  const c = import("/assets/blog.js").then(m => m.fetchPosts().then(ps => {
    posts = ps.map(p => ({ u: m.postUrl(p), t: p.title, d: p.excerpt, h: [p.cat], x: "" }));
  })).catch(() => { posts = []; });
  loading = Promise.all([a, b, c]);
  return loading;
}

// Pagina's die doorzocht worden (bedankt-, test- en losse projectpagina's niet).
const PAGES = ["/", "/webdesign", "/ecommerce", "/wix", "/seo", "/optimaal", "/branding",
  "/development", "/ai", "/api", "/portfolio", "/over-yonglo", "/contact", "/nieuws",
  "/spel", "/disclaimer", "/privacybeleid", "/voorwaarden"];
const clean = s => String(s || "").replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();

async function indexPages() {
  try { const c = JSON.parse(sessionStorage.getItem("yl-zoek") || "null"); if (c && c.length) return c; } catch (e) {}
  const parser = new DOMParser();
  const list = await Promise.all(PAGES.map(u => fetch(u).then(r => r.ok ? r.text() : "").then(html => {
    if (!html) return null;
    const doc = parser.parseFromString(html, "text/html");
    const main = doc.querySelector("main") || doc.body;
    main.querySelectorAll("script,style,svg,form,noscript").forEach(n => n.remove());
    const heads = [...new Set([...main.querySelectorAll("h1,h2,h3")].map(h => clean(h.textContent)).filter(Boolean))];
    const title = clean(doc.title).replace(/ \| Yonglo$/, "");
    return { u, t: u === "/" ? "Home" : title, d: clean(doc.querySelector('meta[name="description"]')?.content), h: heads.slice(0, 40), x: clean(main.textContent).slice(0, 6000) };
  }).catch(() => null)));
  const out = list.filter(Boolean);
  try { sessionStorage.setItem("yl-zoek", JSON.stringify(out)); } catch (e) {}
  return out;
}

function score(doc, terms) {
  const f = { t: norm(doc.t), h: norm((doc.h || []).join(" · ")), d: norm(doc.d), x: norm(doc.x) };
  let total = 0;
  for (const t of terms) {
    let s = 0;
    if (f.t.includes(t)) s += f.t.startsWith(t) ? 16 : 12;
    if (f.h.includes(t)) s += 6;
    if (f.d.includes(t)) s += 4;
    if (f.x.includes(t)) s += Math.min(3, f.x.split(t).length - 1);
    if (!s) return 0;
    total += s;
  }
  return total;
}

function snippet(doc, terms) {
  const src = [doc.d, doc.x].find(s => terms.some(t => norm(s).includes(t))) || doc.d || doc.x || "";
  const n = norm(src);
  let i = Math.min(...terms.map(t => n.indexOf(t)).filter(k => k >= 0));
  if (!isFinite(i)) i = 0;
  const start = Math.max(0, i - 60);
  let s = src.slice(start, start + 170);
  s = (start > 0 ? "…" : "") + s.replace(/\s\S*$/, "") + (start + 170 < src.length ? "…" : "");
  return mark(s, terms);
}

function mark(s, terms) {
  // markeer zoektermen, ook bij hoofdletters en accenten
  const n = norm(s), hits = [];
  terms.forEach(t => { let k = n.indexOf(t); while (k >= 0) { hits.push([k, k + t.length]); k = n.indexOf(t, k + t.length); } });
  hits.sort((a, b) => a[0] - b[0]);
  let out = "", pos = 0;
  hits.forEach(([a, b]) => { if (a < pos) return; out += esc(s.slice(pos, a)) + "<mark>" + esc(s.slice(a, b)) + "</mark>"; pos = b; });
  return out + esc(s.slice(pos));
}

function render() {
  const q = input.value.trim();
  const terms = norm(q).split(/\s+/).filter(Boolean);
  sel = -1;
  box.classList.toggle("has-q", !!terms.length);
  if (!terms.length) { res.innerHTML = ""; return; }
  if (!pages) { res.innerHTML = `<p class="srch-empty">Even zoeken…</p>`; load().then(render); return; }
  const rank = list => list.map(doc => ({ doc, s: score(doc, terms) })).filter(r => r.s).sort((a, b) => b.s - a.s);
  const pg = rank(pages).slice(0, 7), pj = rank(projects || []).slice(0, 4), nw = rank(posts || []).slice(0, 4);
  if (!pg.length && !pj.length && !nw.length) {
    res.innerHTML = `<p class="srch-empty">Geen resultaten voor “${esc(q)}”. Probeer een ander woord, of <a href="/contact">neem contact op</a>.</p>`;
    return;
  }
  const item = r => `<a class="srch-hit" href="${esc(r.doc.u)}"><b>${mark(r.doc.t, terms)}</b><span>${snippet(r.doc, terms)}</span></a>`;
  res.innerHTML =
    (pg.length ? `<p class="srch-lab">Pagina's</p>${pg.map(item).join("")}` : "") +
    (pj.length ? `<p class="srch-lab">Projecten</p>${pj.map(item).join("")}` : "") +
    (nw.length ? `<p class="srch-lab">Nieuws</p>${nw.map(item).join("")}` : "");
}

function hits() { return [...res.querySelectorAll(".srch-hit")]; }
function focusHit(i) {
  const h = hits();
  if (!h.length) return;
  sel = (i + h.length) % h.length;
  h[sel].focus();
}

function build() {
  box = d.createElement("div");
  box.className = "srch";
  box.id = "srch";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Zoeken op de website");
  box.innerHTML = `<div class="srch-panel">
    <form class="srch-form" role="search" action="#">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
      <input type="search" placeholder="Waar ben je naar op zoek?" aria-label="Zoekterm" autocomplete="off" enterkeyhint="search">
      <button type="button" class="srch-x" aria-label="Zoeken sluiten">Esc</button>
    </form>
    <div class="srch-tips"><span>Populair:</span><button type="button">Wix Studio</button><button type="button">Webshop</button><button type="button">SEO</button><button type="button">Branding</button><button type="button">Wix Optimaal</button></div>
    <div class="srch-res" aria-live="polite"></div>
  </div>`;
  d.body.appendChild(box);
  input = box.querySelector("input");
  res = box.querySelector(".srch-res");
  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(render, 90); });
  box.querySelector("form").addEventListener("submit", e => { e.preventDefault(); const h = hits()[0]; if (h) location.href = h.href; });
  box.querySelector(".srch-x").addEventListener("click", close);
  box.querySelectorAll(".srch-tips button").forEach(b => b.addEventListener("click", () => { input.value = b.textContent; render(); input.focus(); }));
  box.addEventListener("click", e => { if (e.target === box) close(); });
  box.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); focusHit(sel + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (sel <= 0) { sel = -1; input.focus(); } else focusHit(sel - 1); }
    else if (e.key === "Tab") {
      // focus binnen het zoekvenster houden
      const f = [...box.querySelectorAll("input,button,a[href]")].filter(x => x.offsetParent);
      if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
}

export function open(btn) {
  if (!box) build();
  trigger = btn;
  load();
  box.hidden = false;
  d.documentElement.classList.add("srch-open");
  if (btn) btn.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => { box.classList.add("on"); input.focus(); input.select(); });
}

export function close() {
  if (!box || box.hidden) return;
  box.classList.remove("on");
  d.documentElement.classList.remove("srch-open");
  if (trigger) { trigger.setAttribute("aria-expanded", "false"); trigger.focus(); }
  setTimeout(() => { box.hidden = true; }, 200);
}
