// Blogberichten (/post/<naam>) en projecten (/project/<naam>) zetten hun eigen SEO-tags: de blog via
// de SEO-service van Wix (gemarkeerd met wix-seo-tags="true"), projecten, koppelingen en help docs zelf (data-eigen-seo).
// Wix voegt daarnaast standaardtags toe voor een pagina die het niet kent (gemarkeerd met
// wix-seo-tag="true", zoals de titel "Post | Yonglo"). Twee titels en twee canonicals zijn slecht voor
// SEO, dus op deze pagina's halen we die standaardtags weg zolang de echte er staan. Dat geldt ook voor de
// gewone pagina's op een adres zonder .html (src/pages/[pagina].astro).
import { defineMiddleware } from "astro:middleware";
import { PAGINAS, PAGINAS_EN } from "./paginas";

// Header (menu) en footer staan in de pagina's als lege <header data-header> en <footer data-footer>; assets/header.js
// en assets/footer.js vullen ze in de browser. Zoekmachines lezen eerst alleen de HTML van de server en zagen dan
// geen menu- en footerlinks. Daarom zetten we hier dezelfde inhoud er al in (gemaakt bij het bouwen door
// tools/kop-voet.mjs uit die twee scripts). In de browser vullen de scripts ze daarna gewoon opnieuw.
declare const __KOPVOET__: Record<"nl" | "en", { header: string; footer: string }>;
const LEGE_HEADER = /(<header\b[^>]*\sdata-header\b[^>]*>)\s*(<\/header>)/;
const LEGE_FOOTER = /(<footer\b[^>]*\sdata-footer\b[^>]*>)\s*(<\/footer>)/;
const vulKopVoet = (html: string) => {
  if (!LEGE_HEADER.test(html) && !LEGE_FOOTER.test(html)) return html;
  const kv = __KOPVOET__[/<html\b[^>]*\slang="en/i.test(html) ? "en" : "nl"];
  return html.replace(LEGE_HEADER, (_, open, close) => open + kv.header + close).replace(LEGE_FOOTER, (_, open, close) => open + kv.footer + close);
};

const FALLBACK = [
  /<title\b[^>]*\swix-seo-tag="true"[^>]*>[\s\S]*?<\/title>/g,
  /<(?:meta|link)\b[^>]*\swix-seo-tag="true"[^>]*>/g,
  /<script\b[^>]*\swix-seo-tag="true"[^>]*>[\s\S]*?<\/script>/g,
];

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const path = context.url.pathname;
  if (!(response.headers.get("content-type") || "").includes("text/html") || (response.status >= 300 && response.status < 400)) return response;
  // Gewone pagina's (/, /webdesign, /en, /en/webdesign …) hebben hun eigen titel, omschrijving en canonical al in de HTML.
  const naam = path.replace(/^\/|\/$/g, "");
  const pagina = naam === "" || naam === "en" || PAGINAS.includes(naam) || (naam.startsWith("en/") && PAGINAS_EN.includes(naam.slice(3)));
  // Ook elke 404 (src/pages/404.astro toont dan 404.html): die heeft zijn eigen titel.
  const opruimen = pagina || response.status === 404 || path.startsWith("/post/") || /^(\/en)?\/(project|wix-koppeling)\//.test(path) || /^\/(help-docs|wix-website|wix-websites|wix-expert|wix-design-development)(\/|$)/.test(path);

  const html = await response.text();
  // Alleen opruimen als de eigen tags er staan, of op een eigen foutpagina (die heeft een eigen titel).
  const ownTags = opruimen && (pagina || html.includes('wix-seo-tags="true"') || html.includes("data-eigen-seo") || response.status >= 400);
  const cleaned = vulKopVoet(ownTags ? FALLBACK.reduce((h, re) => h.replace(re, ""), html) : html);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(cleaned, { status: response.status, statusText: response.statusText, headers });
});
