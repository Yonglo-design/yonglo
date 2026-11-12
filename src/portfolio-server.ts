// Portfolio (/portfolio en /en/portfolio): de lijst met alle projecten wordt al op de server in de HTML gezet.
// Zo zien zoekmachines en AI-assistenten (die geen JavaScript uitvoeren) alle projecten met links, in plaats
// van lege laadkaarten. In de browser bouwt assets/portfolio-cms.js de lijst daarna opnieuw op (met filters);
// de kaarten zijn hetzelfde (gridHtml uit assets/projecten.js).
// Lukt het ophalen niet snel genoeg, dan blijft de pagina zoals hij was en vult de browser de lijst, net als vroeger.
import { projecten } from "./hero-tegels";
import { gridHtml, inTaal } from "../assets/projecten.js";

export async function vulPortfolio(html: string | null, lang: "nl" | "en"): Promise<string | null> {
  if (!html) return html;
  const start = html.indexOf('<div class="pgrid" data-cms="grid" aria-busy="true">');
  if (start < 0) return html;
  const ruw = await projecten();
  if (!ruw || !ruw.length) return html;
  // Einde van de grid-div: de laadkaarten zijn <div class="sk-card">…</div> zonder verdere nesting.
  const eind = html.indexOf('<p class="pf-empty"', start);
  if (eind < 0) return html;
  const ps = ruw.map((p) => inTaal(p, lang));
  const grid = `<div class="pgrid" data-cms="grid">${gridHtml(ps, lang)}</div>\n    `;
  return html.slice(0, start) + grid + html.slice(eind);
}
