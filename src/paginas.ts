// De gewone pagina's van de site: elk HTML-bestand in de hoofdmap (behalve index.html, dat is de homepage op /).
// Ze staan op een adres zonder .html (/webdesign), net als op de oude yonglo.com.
// De lijst en de inhoud worden bij het bouwen in de server ingebouwd (Wix serveert vaste bestanden alleen
// op hun exacte pad, dus /webdesign moet door de server worden geleverd).
import config from "../wix.config.json";

declare const __PAGINAS__: string[];
export const PAGINAS: string[] = __PAGINAS__;

const RAW = import.meta.glob("/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

// Het Wix-sitescript (statistieken, cookiemelding, SEO-instellingen uit het dashboard), zoals
// tools/site-bestanden.mjs dat ook in index.html zet.
const SITE_SCRIPT = `<script id="wix-site-script" src="https://manage.wix.com/_api/headless-business-setup/v1/headless-business/site-script.js" data-client-id="${config.appId}" async></script>`;

export function paginaHtml(naam: string): string | null {
  const html = RAW[`/${naam}.html`];
  if (!html || naam === "index") return null;
  if (html.includes('id="wix-site-script"') || !html.includes("</head>")) return html;
  return html.replace("</head>", `${SITE_SCRIPT}</head>`);
}
