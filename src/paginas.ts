// De gewone pagina's van de site: elk HTML-bestand in de hoofdmap (index.html is de homepage op /).
// Ze staan op een adres zonder .html (/webdesign), net als op de oude yonglo.com.
// De Engelse versies staan in de map en/ (gemaakt door tools/maak-engels.mjs) en staan live op /en/<naam>.
// De lijst en de inhoud worden bij het bouwen in de server ingebouwd (Wix serveert vaste bestanden alleen
// op hun exacte pad, dus /webdesign moet door de server worden geleverd).
import config from "../wix.config.json";

declare const __PAGINAS__: string[];
declare const __DEELBEELDEN__: string[];
// Deelafbeelding per pagina (assets/deel/<naam>.jpg en en-<naam>.jpg, gemaakt door tools/maak-deelbeelden.mjs).
const DEELBEELDEN = new Set<string>(__DEELBEELDEN__);
export const PAGINAS: string[] = __PAGINAS__;

const RAW = import.meta.glob("/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const RAW_EN = import.meta.glob("/en/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
// Engelse pagina's (zonder index): /en/webdesign …
export const PAGINAS_EN: string[] = Object.keys(RAW_EN).map((k) => k.slice(4, -5)).filter((n) => n !== "index").sort();

// Het Wix-sitescript (statistieken, cookiemelding, SEO-instellingen uit het dashboard), zoals
// tools/site-bestanden.mjs dat vroeger ook in index.html zette.
const SITE_SCRIPT = `<script id="wix-site-script" src="https://manage.wix.com/_api/headless-business-setup/v1/headless-business/site-script.js" data-client-id="${config.appId}" async></script>`;

// Het adres waarop de bezoeker de site ziet (achter Wix staat het echte adres in x-wix-forwarded-url).
export function siteOrigin(request: Request, url: URL): string {
  const fw = request.headers.get("x-wix-forwarded-url");
  try { if (fw && /^https?:$/.test(new URL(fw).protocol)) return new URL(fw).origin; } catch { /* ongeldig adres */ }
  return url.origin;
}

const pad = (naam: string, lang: "nl" | "en") => (lang === "en" ? (naam === "index" ? "/en" : `/en/${naam}`) : naam === "index" ? "/" : `/${naam}`);

// HTML van een pagina, met het Wix-sitescript en de SEO-links: canonical en de taalversies (hreflang),
// zodat Google weet dat /webdesign en /en/webdesign dezelfde pagina in twee talen zijn.
export function paginaHtml(naam: string, lang: "nl" | "en" = "nl", origin = ""): string | null {
  const html = (lang === "en" ? RAW_EN : RAW)[lang === "en" ? `/en/${naam}.html` : `/${naam}.html`];
  if (!html || !html.includes("</head>")) return html ?? null;
  const tweeTalen = !!RAW[`/${naam}.html`] && !!RAW_EN[`/en/${naam}.html`];
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/i.test(html);
  let head = "";
  if (origin && !noindex) {
    if (!/<link rel="canonical"/.test(html)) head += `<link rel="canonical" href="${origin}${pad(naam, lang)}">`;
    if (tweeTalen) {
      head += `<link rel="alternate" hreflang="nl" href="${origin}${pad(naam, "nl")}">`;
      head += `<link rel="alternate" hreflang="en" href="${origin}${pad(naam, "en")}">`;
      head += `<link rel="alternate" hreflang="x-default" href="${origin}${pad(naam, "nl")}">`;
    }
    head += `<meta property="og:locale" content="${lang === "en" ? "en_GB" : "nl_NL"}">`;
  }
  // Deelafbeelding (LinkedIn, Facebook, WhatsApp, X …): onze eigen afbeelding in de stijl van de site.
  let doc = html;
  const beeld = (lang === "en" ? "en-" : "") + naam;
  if (origin && !noindex && DEELBEELDEN.has(beeld)) {
    doc = doc.replace(/<meta (?:property|name)="(?:og:image(?::[a-z]+)?|twitter:image(?::[a-z]+)?)"[^>]*>\n?/g, "");
    const url = `${origin}/assets/deel/${beeld}.jpg`;
    const alt = (doc.match(/<title>([^<]*)<\/title>/) || [])[1] || "Yonglo";
    head += `<meta property="og:image" content="${url}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`;
    head += `<meta property="og:image:type" content="image/jpeg"><meta property="og:image:alt" content="${alt}">`;
    if (!/<meta (?:property|name)="og:type"/.test(doc)) head += `<meta property="og:type" content="website">`;
    if (!/<meta name="twitter:card"/.test(doc)) head += `<meta name="twitter:card" content="summary_large_image">`;
    head += `<meta name="twitter:image" content="${url}">`;
  }
  if (!doc.includes('id="wix-site-script"')) head += SITE_SCRIPT;
  return doc.replace("</head>", `${head}</head>`);
}

export const htmlResponse = (html: string) => new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
export const nietGevonden = (lang: "nl" | "en" = "nl") =>
  new Response(lang === "en" ? "Page not found" : "Pagina niet gevonden", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
