// Portfolio: vult de pagina met projecten uit de Wix CMS-collectie "Projecten".
import { fetchProjects, projectUrl, img, esc, themeStyle, dienstKey, filterDiensten, cardTags, reveal, loadScript, mockVis } from "./projecten.js";

const $ = s => document.querySelector(`[data-cms="${s}"]`);

function tile(p) {
  const src = p.portfolioImage ? img(p.portfolioImage, 320, 400, "c") : img(p.hoofdbeeld, 320, 400);
  return `<div class="tile${src ? " has-img" : ""}" style="${themeStyle(p)}">${src ? `<img src="${src}" alt="" loading="lazy">` : ""}<i class="tb"></i><b>${esc(p.title)}</b><span></span></div>`;
}

function renderWall(ps) {
  const el = $("wall");
  if (!el || !ps.length) return;
  const cols = [[], [], []];
  // minstens 4 tegels per kolom, zodat de kolommen gevuld zijn
  const pool = ps.length >= 12 ? ps : Array.from({ length: 12 }, (_, i) => ps[i % ps.length]);
  pool.slice(0, 12).forEach((p, i) => cols[i % 3].push(p));
  const cls = ["", " rev", " slow"];
  el.innerHTML = cols.map((c, i) => `<div class="wcol"><div class="wtrack${cls[i]}">${[...c, ...c].map(tile).join("")}</div></div>`).join("");
}

function renderSpotlight(ps) {
  const el = $("spotlight");
  if (!el) return;
  const list = ps.filter(p => p.uitgelicht).slice(0, 3);
  if (!list.length) { el.closest("section").hidden = true; return; }
  el.classList.add("spot-grid");
  el.innerHTML = list.map((p, i) => {
    const pf = !!p.portfolioImage;
    const src = pf ? img(p.portfolioImage, 900, 675, "c") : img(p.hoofdbeeld, 900, 675, "c");
    const tags = (p.diensten || []).slice(0, 3).map(t => `<li>${esc(t)}</li>`).join("");
    const intro = p.intro || p.kortTekst || "";
    const vis = src
      ? `<img src="${src}" alt="${esc(p.title)}" loading="lazy">`
      : `<span class="sc-mock">${esc(p.title)}</span>`;
    return `<div class="spot-cell rv" style="--d:${(i * 0.12).toFixed(2)}s"><a class="spot-card" href="${projectUrl(p)}" style="${themeStyle(p)}">
      <div class="sc-vis">${vis}<span class="sc-badge"><i>★</i> Uitgelicht</span></div>
      <div class="sc-body">
        ${p.branche ? `<span class="sc-cat">${esc(p.branche)}</span>` : ""}
        <h3>${esc(p.title)}</h3>
        ${intro ? `<p>${esc(intro)}</p>` : ""}
        ${tags ? `<ul class="sc-tags">${tags}</ul>` : ""}
        <span class="sc-go">Bekijk het project <i aria-hidden="true">→</i></span>
      </div>
    </a></div>`;
  }).join("");
}

function renderFilters(ps) {
  const el = $("filters");
  if (!el) return;
  const ds = filterDiensten(ps);
  el.innerHTML = `<button class="fbtn" aria-pressed="true" data-f="all">Alles <sup></sup></button>` +
    ds.map(d => `<button class="fbtn" aria-pressed="false" data-f="${dienstKey(d)}">${esc(d)} <sup></sup></button>`).join("");
  el.hidden = !ds.length;
}

function renderGrid(ps) {
  const el = $("grid");
  if (!el) return;
  const allKeys = [...new Set(ps.flatMap(p => (p.diensten || []).map(dienstKey)))].join(" ");
  el.innerHTML = ps.map(p => {
    const pf = !!p.portfolioImage;
    const src = pf ? img(p.portfolioImage, 700, 700, "c") : img(p.hoofdbeeld, 800, 600);
    const tags = cardTags(p).map(t => `<li>${esc(t)}</li>`).join("");
    return `<a href="${projectUrl(p)}" class="pcard" data-cat="${(p.diensten || []).map(dienstKey).join(" ")}">
      <div class="pcard-vis${src ? " has-img" : ""}${pf ? " pf" : ""}" style="${themeStyle(p)}">${src ? `<img src="${src}" alt="${esc(p.title)}" loading="lazy">` : mockVis(p)}</div>
      <div class="pcard-meta">${p.branche ? `<span class="pc-br">${esc(p.branche)}</span>` : ""}<h3>${esc(p.title)}</h3>${p.kortTekst ? `<p>${esc(p.kortTekst)}</p>` : ""}${tags ? `<ul class="pc-tags">${tags}</ul>` : ""}</div>
    </a>`;
  }).join("") + `<a href="#contact" class="pcard pcard-cta" data-cat="${allKeys}"><span>Jouw project hier?</span><b>Laten we kennismaken →</b></a>`;
  el.removeAttribute("aria-busy");
}

function renderError() {
  const el = $("grid");
  if (el) {
    el.removeAttribute("aria-busy");
    el.innerHTML = `<div class="pf-error"><b>De projecten konden niet worden geladen.</b><span>Ververs de pagina of probeer het later nog eens.</span></div>`;
  }
  const s = $("spotlight");
  if (s) s.closest("section").hidden = true;
  const f = $("filters");
  if (f) f.hidden = true;
}

try {
  const ps = await fetchProjects();
  renderWall(ps);
  renderSpotlight(ps);
  renderFilters(ps);
  if (ps.length) renderGrid(ps);
  else {
    const el = $("grid");
    el.removeAttribute("aria-busy");
    el.innerHTML = `<a href="#contact" class="pcard pcard-cta"><span>Binnenkort meer projecten</span><b>Laten we kennismaken →</b></a>`;
  }
  reveal(document.querySelector("main"));
  await loadScript("/assets/portfolio.js");
} catch (e) {
  console.error(e);
  renderError();
}
