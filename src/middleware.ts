// Blogberichten (/post/<naam>) en projecten (/project/<naam>) zetten hun eigen SEO-tags: de blog via
// de SEO-service van Wix (gemarkeerd met wix-seo-tags="true"), projecten zelf (data-eigen-seo).
// Wix voegt daarnaast standaardtags toe voor een pagina die het niet kent (gemarkeerd met
// wix-seo-tag="true", zoals de titel "Post | Yonglo"). Twee titels en twee canonicals zijn slecht voor
// SEO, dus op deze pagina's halen we die standaardtags weg zolang de echte er staan. Dat geldt ook voor de
// gewone pagina's op een adres zonder .html (src/pages/[pagina].astro).
import { defineMiddleware } from "astro:middleware";
import { PAGINAS } from "./paginas";

const FALLBACK = [
  /<title\b[^>]*\swix-seo-tag="true"[^>]*>[\s\S]*?<\/title>/g,
  /<(?:meta|link)\b[^>]*\swix-seo-tag="true"[^>]*>/g,
  /<script\b[^>]*\swix-seo-tag="true"[^>]*>[\s\S]*?<\/script>/g,
];

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const path = context.url.pathname;
  // Gewone pagina's (/webdesign …) hebben hun eigen titel, omschrijving en canonical al in de HTML.
  const pagina = PAGINAS.includes(path.replace(/^\/|\/$/g, ""));
  if (!pagina && !path.startsWith("/post/") && !path.startsWith("/project/")) return response;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  const html = await response.text();
  // Alleen opruimen als de eigen tags er staan, of op een eigen foutpagina (die heeft een eigen titel).
  const ownTags = pagina || html.includes('wix-seo-tags="true"') || html.includes("data-eigen-seo") || response.status >= 400;
  const cleaned = ownTags ? FALLBACK.reduce((h, re) => h.replace(re, ""), html) : html;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(cleaned, { status: response.status, statusText: response.statusText, headers });
});
