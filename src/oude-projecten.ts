// Oude projectadressen van yonglo.com (/project/<naam> en /projecten/<naam>) die nu anders heten of niet meer bestaan.
// Gebruikt door src/pages/project/[slug].astro (en de Engelse versie) en src/pages/projecten/[...pad].astro.

// Oude naam → huidige naam (slug) in het CMS.
export const PROJECT_ALIASES: Record<string, string> = {
  "ad-design": "ad-design-studio",
  "jus-add-wine": "just-add-wine",
  "mankind": "mankind-coach",
  "mplusr": "m-r-interior-architecture",
  "burgstate-projectontwikkeling": "burgstate",
  "tenerife": "tenerife-online",
  "vogelgids": "slimste-vogelgids",
  "wongperspectief": "woningperspectief",
};

// Projecten die niet meer in het portfolio staan: blijvend door naar het portfolio.
export const VERVALLEN_PROJECTEN = new Set([
  "amg-mode", "bail-out-bbq", "baristocraat", "blue-rebel", "bms-moerdijk", "bms-sunward", "designathon",
  "destination-explorer", "igh", "lebe-group", "logistics", "mrs-flower", "prancing-classics", "ratho", "rewild",
  "sms-solutions", "storagepark", "topdesk", "total-company-scan",
]);

// Waar moet een oud projectadres heen? null = het project bestaat gewoon.
export function oudProject(slug: string, en = false): string | null {
  const pre = en ? "/en" : "";
  const s = String(slug || "").toLowerCase().replace(/\/+$/, "");
  if (VERVALLEN_PROJECTEN.has(s)) return `${pre}/portfolio`;
  if (PROJECT_ALIASES[s]) return `${pre}/project/${PROJECT_ALIASES[s]}`;
  return null;
}
