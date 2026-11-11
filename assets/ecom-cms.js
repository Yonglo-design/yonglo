// eCommerce "07 — Portfolio": projecten uit de Wix CMS-collectie "Projecten" met de dienst "eCommerce".
// Aanvullen gebeurt in het CMS (veld "Diensten"); de vaste voorbeelden blijven staan als het CMS niet laadt.
import { fetchProjects, projectUrl, img, esc, themeStyle, cardTags, reveal, mockVis, t } from "./projecten.js";

const grid = document.querySelector('[data-cms="ecom-grid"]');

function card(p, i) {
  const pf = !!p.portfolioImage;
  const src = pf ? img(p.portfolioImage, 700, 700, "c") : img(p.hoofdbeeld, 800, 600);
  const tags = cardTags(p).map(t => `<li>${esc(t)}</li>`).join("");
  return `<a href="${projectUrl(p)}" class="pcard rv" style="--d:${(i % 3) * 0.08}s">
    <div class="pcard-vis${src ? " has-img" : ""}${pf ? " pf" : ""}" style="${themeStyle(p)}">${src ? `<img src="${src}" alt="${esc(p.title)}" loading="lazy">` : mockVis(p)}</div>
    <div class="pcard-meta">${p.branche ? `<span class="pc-br">${esc(p.branche)}</span>` : ""}<h3>${esc(p.title)}</h3>${p.kortTekst ? `<p>${esc(p.kortTekst)}</p>` : ""}${tags ? `<ul class="pc-tags">${tags}</ul>` : ""}</div>
  </a>`;
}

if (grid) {
  try {
    const ps = await fetchProjects();
    const list = ps.filter(p => (p.diensten || []).some(d => String(d).toLowerCase() === "ecommerce"));
    if (list.length) {
      const sorted = [...list.filter(p => p.uitgelicht), ...list.filter(p => !p.uitgelicht)].slice(0, 5);
      grid.innerHTML = sorted.map(card).join("") +
        `<a href="#contact" class="pcard pcard-cta rv" style="--d:${(sorted.length % 3) * 0.08}s"><span>${t("Jouw webshop hier?", "Your online store here?")}</span><b>${t("Start jouw project →", "Start your project →")}</b></a>`;
      grid.removeAttribute("aria-busy");
      reveal(grid);
    }
  } catch (e) {
    console.error(e);
  }
}
