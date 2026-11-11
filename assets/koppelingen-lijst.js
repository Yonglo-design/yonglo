// Overzicht van alle koppelingen op /api (sectie #koppelingen), met filterknoppen per categorie.
// De tegels staan ook als vaste HTML in api.html (voor Google, AI-bots en als terugval); dit script
// vervangt ze door de actuele lijst uit de Wix CMS-collectie "Koppelingen", zodat een nieuwe koppeling
// vanzelf verschijnt.
import { queryDataItems } from "./wix/wix-cms.js";
import { COLLECTION, CATEGORIEEN, CATEGORIE_EN, inTaal, sorteer, tegel, ctaTegel } from "./koppelingen.js";

const root = document.querySelector("[data-koppelingen]");
const EN = document.documentElement.lang === "en";

async function laad() {
  const all = [];
  let cursor = null;
  do {
    const page = await queryDataItems(COLLECTION, cursor ? { cursor, limit: 100 } : { limit: 100 });
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return sorteer(all).map((k) => inTaal(k, EN ? "en" : "nl"));
}

function filters() {
  const bar = root.querySelector(".kp-filter");
  const grid = root.querySelector(".kp-tiles");
  if (!bar || !grid) return;
  const tiles = [...grid.children].filter((t) => !t.hasAttribute("data-cta"));
  const count = new Map();
  tiles.forEach((t) => count.set(t.dataset.cat, (count.get(t.dataset.cat) || 0) + 1));
  const cats = [...count.keys()].filter(Boolean).sort((a, b) => {
    const ia = CATEGORIEEN.indexOf(a), ib = CATEGORIEEN.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  const label = (c) => (EN ? CATEGORIE_EN[c] || c : c);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  bar.innerHTML = `<button type="button" aria-pressed="true" data-f="">${EN ? "All" : "Alle"} <small>${tiles.length}</small></button>` +
    cats.map((c) => `<button type="button" aria-pressed="false" data-f="${esc(c)}">${esc(label(c))} <small>${count.get(c)}</small></button>`).join("");
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    bar.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    tiles.forEach((t) => { t.hidden = !!b.dataset.f && t.dataset.cat !== b.dataset.f; });
  });
}

if (root) {
  laad()
    .then((list) => {
      if (!list.length) return;
      const grid = root.querySelector(".kp-tiles");
      grid.innerHTML = list.map(tegel).join("") + ctaTegel(EN);
      [...grid.children].forEach((t) => t.classList.add("in"));
    })
    .catch((err) => console.warn("Koppelingen uit het CMS niet geladen; de vaste lijst blijft staan.", err))
    .finally(filters);
}
