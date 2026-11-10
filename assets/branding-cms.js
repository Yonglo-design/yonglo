// Concept & Branding: slider met voorbeeldprojecten uit de CMS-collectie "Projecten".
// Toont projecten met de dienst "Branding"; aanvullen gebeurt via het CMS (veld "Diensten").
import { fetchProjects, projectUrl, img, esc, themeStyle, cardTags } from "./projecten.js";

const track = document.querySelector('[data-cms="brand-slider"]');
const section = document.querySelector('[data-cms-section="brand-slider"]');

function card(p, i) {
  const src = p.portfolioImage ? img(p.portfolioImage, 640, 640, "c") : img(p.hoofdbeeld, 640, 640);
  const tags = cardTags(p, 2).join(" · ");
  return `<a href="${projectUrl(p)}" class="bs-card" style="${themeStyle(p)};--i:${i}" draggable="false">
    <div class="bs-vis">${src ? `<img src="${src}" alt="${esc(p.title)}" loading="lazy" draggable="false">` : `<b class="bs-ph">${esc(p.title)}</b>`}</div>
    <div class="bs-meta">${p.branche ? `<span>${esc(p.branche)}</span>` : ""}<h3>${esc(p.title)}</h3>${tags ? `<small>${esc(tags)}</small>` : ""}</div>
    <span class="bs-go" aria-hidden="true">→</span>
  </a>`;
}

function controls() {
  const vp = track.parentElement;
  const bar = section.querySelector(".bs-bar i");
  const step = () => (track.querySelector(".bs-card")?.offsetWidth || 320) + 20;
  section.querySelectorAll(".bs-btn").forEach(b => b.addEventListener("click", () => {
    vp.scrollBy({ left: step() * Number(b.dataset.dir), behavior: "smooth" });
  }));
  const upd = () => {
    const max = vp.scrollWidth - vp.clientWidth;
    const r = max > 0 ? vp.scrollLeft / max : 1;
    if (bar) bar.style.transform = `scaleX(${Math.max(.08, r)})`;
    section.querySelector('[data-dir="-1"]').disabled = vp.scrollLeft < 4;
    section.querySelector('[data-dir="1"]').disabled = vp.scrollLeft > max - 4;
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

if (track && section) {
  try {
    const ps = await fetchProjects();
    const list = ps.filter(p => (p.diensten || []).some(d => /branding/i.test(d)));
    if (!list.length) section.hidden = true;
    else {
      track.innerHTML = list.map(card).join("");
      track.removeAttribute("aria-busy");
      requestAnimationFrame(() => track.classList.add("on"));
      controls();
    }
  } catch (e) {
    console.error(e);
    section.hidden = true;
  }
}
