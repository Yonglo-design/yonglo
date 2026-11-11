// Hero C: zwevende tegels met echt werk uit de CMS-collectie "Projecten" + muis-parallax.
import { fetchProjects, projectUrl, img, esc, themeStyle } from "./projecten.js";

const hero = document.querySelector(".hc");
if (hero) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tiles = [...hero.querySelectorAll("[data-tile]")];
  const ai = hero.querySelector(".hc-ai .img");
  const show = () => requestAnimationFrame(() => hero.classList.add("on"));

  // Beeldformaat per tegel (2x voor scherpte)
  const size = el => {
    const r = el.getBoundingClientRect();
    const w = Math.max(320, Math.round((r.width || 240) * 2));
    return [w, Math.round(w / (r.width && r.height ? r.width / r.height : 1))];
  };

  setTimeout(show, 120); // tegels direct tonen; beelden komen erin zodra het CMS antwoordt
  try {
    const all = await fetchProjects();
    const withImg = all.filter(p => p.portfolioImage || p.hoofdbeeld);
    const list = [...withImg.filter(p => p.uitgelicht), ...withImg.filter(p => !p.uitgelicht)];
    tiles.forEach((el, i) => {
      if (el.hasAttribute("data-video")) return; // vaste video-tegel
      const p = list[i];
      if (!p) return;
      const [w, h] = size(el);
      const pf = !!p.portfolioImage;
      const src = pf ? img(p.portfolioImage, w, h, "c") : img(p.hoofdbeeld, w, h);
      el.href = projectUrl(p);
      el.setAttribute("aria-label", "Project: " + p.title);
      el.setAttribute("style", (el.getAttribute("style") || "") + ";" + themeStyle(p));
      el.classList.toggle("pf", pf);
      el.querySelector(".f").innerHTML = `${src ? `<img src="${src}" alt="" loading="eager" decoding="async">` : `<b class="ph">${esc(p.title)}</b>`}<span class="cap">${esc(p.title)}</span>`;
    });
    const extra = list[tiles.length];
    if (ai && extra) {
      const src = extra.portfolioImage ? img(extra.portfolioImage, 600, 600, "c") : img(extra.hoofdbeeld, 600, 600);
      if (src) ai.style.backgroundImage = `url("${src}")`;
    }
  } catch (e) {
    console.error(e);
  }
  setTimeout(() => hero.classList.add("ready"), 2200);

  // AI-prompt typt zichzelf
  const typed = hero.querySelector(".hc-ai .typed");
  if (typed) {
    const full = typed.dataset.text || "";
    if (reduce) typed.textContent = full;
    else {
      let k = 0;
      const tick = () => { typed.textContent = full.slice(0, ++k); if (k < full.length) setTimeout(tick, 38); else setTimeout(() => { k = 0; tick(); }, 4200); };
      setTimeout(tick, 1600);
    }
  }

  // Parallax: tegels verschuiven licht met de muis (dieper = meer)
  if (!reduce) {
    const items = [...hero.querySelectorAll(".hc-t,.hc-ico")];
    let raf = 0, mx = 0, my = 0;
    const apply = () => {
      raf = 0;
      if (innerWidth < 1024) return;
      items.forEach((el, i) => {
        const d = parseFloat(el.dataset.depth || (0.6 + (i % 3) * 0.35));
        el.style.setProperty("--px", (-mx * 18 * d).toFixed(1) + "px");
        el.style.setProperty("--py", (-my * 14 * d).toFixed(1) + "px");
      });
    };
    hero.addEventListener("pointermove", e => {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener("pointerleave", () => { mx = my = 0; if (!raf) raf = requestAnimationFrame(apply); });
  }
}
