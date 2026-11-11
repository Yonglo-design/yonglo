// De gewone pagina's van de site: elk HTML-bestand in de hoofdmap (behalve index.html, dat is de homepage op /).
// Ze staan op een adres zonder .html (/webdesign), net als op de oude yonglo.com.
// De lijst wordt bij het bouwen vastgelegd in astro.config.mjs (__PAGINAS__), zodat hij ook op de server bekend is.
import { readFileSync } from "node:fs";
import { join } from "node:path";

declare const __PAGINAS__: string[];
export const PAGINAS: string[] = __PAGINAS__;

// Het Wix-sitescript (statistieken, cookiemelding, SEO-instellingen uit het dashboard), zoals
// tools/site-bestanden.mjs dat ook in index.html zet. Alleen bij het bouwen gebruikt (vooraf gemaakte pagina's).
export function paginaHtml(naam: string): string {
  const root = process.cwd();
  const html = readFileSync(join(root, `${naam}.html`), "utf8");
  if (html.includes('id="wix-site-script"') || !html.includes("</head>")) return html;
  const { appId } = JSON.parse(readFileSync(join(root, "wix.config.json"), "utf8"));
  const script = `<script id="wix-site-script" src="https://manage.wix.com/_api/headless-business-setup/v1/headless-business/site-script.js" data-client-id="${appId}" async></script>`;
  return html.replace("</head>", `${script}</head>`);
}
