// Projectslider (zoals "Merken die we tot leven brachten" op Concept & Branding), gedeeld door
// Branding, de homepage en Webdesign. De kaarten komen uit de Wix CMS-collectie "Projecten".
// Per sectie [data-cms-section="proj-slider"] (of "brand-slider"):
//   data-dienst="Webdesign|Wix Studio"  alleen projecten met (een van) deze diensten
//   data-max="10"                        maximaal aantal projecten (uitgelichte projecten eerst)
import { fetchProjects, projectUrl, img, esc, themeStyle, cardTags } from "./projecten.js";

const sections = [...document.querySelectorAll('[data-cms-section="proj-slider"],[data-cms-section="brand-slider"]')];

// Snelheid: beeld precies zo groot laden als de kaart op dit scherm (max. 640 px, scherp op retina)
const CARD_PX = (() => {
  if (typeof window === "undefined") return 640;
  const css = innerWidth <= 767 ? innerWidth * 0.78 : Math.min(360, Math.max(260, innerWidth * 0.26));
  return Math.min(640, Math.ceil((css * Math.min(devicePixelRatio || 1, 2)) / 20) * 20);
})();

function card(p, i) {
  const src = p.portfolioImage ? img(p.portfolioImage, CARD_PX, CARD_PX, "c") : img(p.hoofdbeeld, CARD_PX, CARD_PX);
  const tags = cardTags(p, 2).join(" · ");
  return `<a href="${projectUrl(p)}" class="bs-card" style="${themeStyle(p)};--i:${i}" draggable="false">
    <div class="bs-vis">${src ? (i < 2 ? `<img src="${src}" alt="${esc(p.title)}" decoding="async" draggable="false">` : `<img data-src="${src}" alt="${esc(p.title)}" decoding="async" draggable="false">`) : `<b class="bs-ph">${esc(p.title)}</b>`}</div>
    <div class="bs-meta">${p.branche ? `<span>${esc(p.branche)}</span>` : ""}<h3>${esc(p.title)}</h3>${tags ? `<small>${esc(tags)}</small>` : ""}</div>
    <span class="bs-go" aria-hidden="true">→</span>
  </a>`;
}

function controls(section, track) {
  const vp = track.parentElement;
  const bar = section.querySelector(".bs-bar i");
  const step = () => (track.querySelector(".bs-card")?.offsetWidth || 320) + 20;
  section.querySelectorAll(".bs-btn").forEach(b => b.addEventListener("click", () => {
    vp.scrollBy({ left: step() * Number(b.dataset.dir), behavior: "smooth" });
  }));
  const prev = section.querySelector('[data-dir="-1"]'), next = section.querySelector('[data-dir="1"]');
  const upd = () => {
    const max = vp.scrollWidth - vp.clientWidth;
    const r = max > 0 ? vp.scrollLeft / max : 1;
    if (bar) bar.style.transform = `scaleX(${Math.max(.08, r)})`;
    if (prev) prev.disabled = vp.scrollLeft < 4;
    if (next) next.disabled = vp.scrollLeft > max - 4;
  };
  vp.addEventListener("scroll", upd, { passive: true });
  window.addEventListener("resize", upd);
  upd();
  // slepen met de muis
  let down = false, x0 = 0, s0 = 0, moved = false;
  vp.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = vp.scrollLeft; vp.classList.add("drag"); });
  window.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; vp.scrollLeft = s0 - dx; });
  window.addEventListener("pointerup", () => { down = false; vp.classList.remove("drag"); });
  vp.addEventListener("click", e => { if (moved) { e.preventDefault(); moved = false; } }, true);
}

// Beelden zelf laden zodra ze (bijna) in beeld komen. Het standaard "lazy" laden
// werkt op sommige telefoons (Safari) niet goed in een horizontale scroller.
function loadImages(track) {
  const imgs = [...track.querySelectorAll("img[data-src]")];
  const load = im => { if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute("data-src"); } };
  if (!("IntersectionObserver" in window)) { imgs.forEach(load); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } }),
    { root: track.parentElement, rootMargin: "0px 120% 0px 120%" });
  imgs.forEach(im => io.observe(im));
  // vangnet: na het laden van de pagina alles alsnog ophalen
  const all = () => setTimeout(() => imgs.forEach(load), 1500);
  if (document.readyState === "complete") all(); else addEventListener("load", all, { once: true });
}

function pick(all, section) {
  const dienst = section.dataset.dienst || (section.dataset.cmsSection === "brand-slider" ? "branding" : "");
  const want = dienst.split("|").map(s => s.trim().toLowerCase()).filter(Boolean);
  let list = want.length ? all.filter(p => (p.diensten || []).some(d => want.some(w => String(d).toLowerCase().includes(w)))) : all;
  const max = Number(section.dataset.max) || 0;
  if (max) list = [...list.filter(p => p.uitgelicht), ...list.filter(p => !p.uitgelicht)].slice(0, max);
  return list;
}

if (sections.length) {
  let all = null;
  try { all = await fetchProjects(); } catch (e) { console.error(e); }
  for (const section of sections) {
    const track = section.querySelector(".bs-track");
    const list = all && track ? pick(all, section) : [];
    if (!list.length) { section.hidden = true; continue; }
    track.innerHTML = list.map(card).join("");
    track.removeAttribute("aria-busy");
    requestAnimationFrame(() => track.classList.add("on"));
    controls(section, track);
    loadImages(track);
  }
}
