// "04 — Portfolio" (homepage, Webdesign): de projectrail komt uit de Wix CMS-collectie "Projecten".
// Optioneel op de rail: data-dienst="Webdesign|Wix Studio" toont alleen projecten met die dienst(en).
// De vaste projecten in de HTML blijven staan als de collectie niet geladen kan worden.
import { fetchProjects, projectUrl, img, esc, cardTags } from "./projecten.js";

const rail = document.querySelector(".work .rail");

function bg(p) {
  const hex = /^#[0-9a-f]{3,8}$/i;
  const a = hex.test(p.kleurDonker || "") ? p.kleurDonker : "#1b1d2e";
  const b = hex.test(p.kleurMidden || "") ? p.kleurMidden : "#325FFC";
  const c = hex.test(p.kleurLicht || "") ? p.kleurLicht : "#99AFFE";
  return `background:linear-gradient(150deg,${a},${b} 60%,${c})`;
}

function card(p) {
  const pf = p.portfolioImage ? img(p.portfolioImage, 800, 600, "c") : null;
  const src = pf ? null : img(p.hoofdbeeld, 900, 563);
  const body = src
    ? `<img src="${src}" alt="${esc(p.title)}" loading="lazy" draggable="false">`
    : `<div class="mbody"><span class="l w60"></span><span class="tile"></span><span class="tile"></span><span class="tile"></span></div>`;
  const vis = pf
    ? `<div class="proj-vis has-pf"><img src="${pf}" alt="${esc(p.title)}" loading="lazy" draggable="false"></div>`
    : `<div class="proj-vis"><div class="mock"><div class="bar"><i></i><i></i><i></i></div>${body}</div></div>`;
  const tags = cardTags(p, 2).join(" · ") || p.branche || "";
  return `<a href="${projectUrl(p)}" class="proj" style="${bg(p)}">
    ${vis}
    <div class="proj-meta">${tags ? `<span class="tags">${esc(tags)}</span>` : ""}<h3>${esc(p.title)}</h3>${p.kortTekst ? `<p>${esc(p.kortTekst)}</p>` : ""}</div>
  </a>`;
}

if (rail) {
  try {
    const all = await fetchProjects();
    const want = (rail.dataset.dienst || "").split("|").map(s => s.trim().toLowerCase()).filter(Boolean);
    const sel = want.length ? all.filter(p => (p.diensten || []).some(d => want.includes(String(d).toLowerCase()))) : all;
    const ps = sel.length ? sel : all;
    if (ps.length) {
      // Maximaal 10 projecten in de slider (uitgelichte eerst); de rest staat op de portfoliopagina.
      const max = Number(rail.dataset.max) || 10;
      const list = [...ps.filter(p => p.uitgelicht), ...ps.filter(p => !p.uitgelicht)].slice(0, max);
      // Veel projecten: de rail beweegt sneller, zodat de sectie niet eindeloos lang wordt.
      rail.dataset.speed = String(Math.max(0.2, Math.min(1, 10 / (list.length + 1))));
      rail.innerHTML = list.map(card).join("") +
        `<a href="/portfolio" class="proj proj-cta"><span>Alle ${all.length} projecten op een rij</span><b>Bekijk al ons werk →</b></a>`;
      window.dispatchEvent(new Event("resize"));
    }
  } catch (e) {
    console.error(e);
  }
}
