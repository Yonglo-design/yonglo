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
  const list = ps.filter(p => p.uitgelicht).slice(0, 4);
  if (!list.length) { el.closest("section").hidden = true; return; }
  el.innerHTML = list.map((p, i) => {
    const pf = !!p.portfolioImage;
    const src = pf ? img(p.portfolioImage, 900, 900, "c") : img(p.hoofdbeeld, 1200, 900);
    const tags = (p.diensten || []).slice(0, 4).map(t => `<li>${esc(t)}</li>`).join("");
    const vis = src
      ? `<a class="cv-shot${pf ? " pf" : ""}" href="${projectUrl(p)}" tabindex="-1"><img src="${src}" alt="${esc(p.title)}" loading="lazy"></a>`
      : `<div class="cv-win"><div class="bar"><i></i><i></i><i></i></div><div class="cv-body"><span class="cv-logo">${esc(p.title)}</span><span class="cv-h">${esc(p.subkop || p.branche || p.title)}</span><span class="cv-btn"></span><div class="cv-row"><i></i><i></i><i></i></div></div></div><div class="cv-phone"><span class="cv-logo">${esc(p.title)}</span><i></i><i></i></div>`;
    return `<article class="case" style="${themeStyle(p)}">
      <div class="case-txt">
        <span class="case-num rv">${String(i + 1).padStart(2, "0")}</span>
        ${p.branche ? `<span class="case-cat rv">${esc(p.branche)}</span>` : ""}
        <h3 class="rv">${esc(p.title)}</h3>
        ${p.intro || p.kortTekst ? `<p class="rv">${esc(p.intro || p.kortTekst)}</p>` : ""}
        ${tags ? `<ul class="case-tags rv">${tags}</ul>` : ""}
        <a href="${projectUrl(p)}" class="link rv">Bekijk het project →</a>
      </div>
      <div class="case-vis rv">${vis}</div>
    </article>`;
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
