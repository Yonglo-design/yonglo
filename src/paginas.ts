// De gewone pagina's van de site: elk HTML-bestand in de hoofdmap (index.html is de homepage op /).
// Ze staan op een adres zonder .html (/webdesign), net als op de oude yonglo.com.
// De Engelse versies staan in de map en/ (gemaakt door tools/maak-engels.mjs) en staan live op /en/<naam>.
// De lijst en de inhoud worden bij het bouwen in de server ingebouwd (Wix serveert vaste bestanden alleen
// op hun exacte pad, dus /webdesign moet door de server worden geleverd).
import config from "../wix.config.json";

declare const __PAGINAS__: string[];
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
  if (!html.includes('id="wix-site-script"')) head += SITE_SCRIPT;
  return html.replace("</head>", `${head}</head>`);
}

export const htmlResponse = (html: string) => new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
export const nietGevonden = (lang: "nl" | "en" = "nl") =>
  new Response(lang === "en" ? "Page not found" : "Pagina niet gevonden", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
