// Header (menu) en footer als vaste HTML, zodat ze al in de pagina staan die de server stuurt.
// Zoekmachines lezen eerst alleen die HTML; zonder dit zagen ze geen menu- en footerlinks (bijv. naar het
// werkgebied), omdat assets/header.js en assets/footer.js die pas in de browser invullen.
// Er is geen tweede kopie van het menu: dit draait die twee scripts zelf (in een nagebootste pagina) en vangt de
// HTML op die ze in <header data-header> en <footer data-footer> zetten. Menu of footer aanpassen doe je dus
// nog steeds alleen in die scripts. In de browser vullen de scripts header en footer daarna opnieuw (met dezelfde
// inhoud) en zetten ze de dingen die per pagina verschillen (actieve link, taalknop, mobiel menu, animatie).
// Gebruikt door astro.config.mjs (bij het bouwen en bij npm run dev).
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const KLAAR = Symbol("klaar");

function vang(script, selector, lang) {
  let html = null;
  const host = { set innerHTML(v) { html = v; throw KLAAR; } };
  const leeg = () => null;
  const document = {
    documentElement: { lang },
    querySelector: (s) => (s === selector ? host : null),
    querySelectorAll: () => [],
    getElementById: leeg,
    addEventListener: () => {},
    createElement: () => ({ setAttribute() {}, appendChild() {} }),
    head: { appendChild() {} },
  };
  const location = { pathname: lang === "en" ? "/en" : "/", search: "", hash: "" };
  try {
    runInNewContext(readFileSync(new URL(`../assets/${script}`, import.meta.url), "utf8"), { document, location, window: {}, navigator: {}, console });
  } catch (e) {
    if (e !== KLAAR) throw e;
  }
  if (typeof html !== "string" || !html.includes("<a ")) throw new Error(`kop-voet: geen HTML uit assets/${script} (${lang})`);
  return html;
}

export function kopVoet() {
  const uit = {};
  for (const lang of ["nl", "en"]) {
    uit[lang] = { header: vang("header.js", "header[data-header]", lang), footer: vang("footer.js", "footer[data-footer]", lang) };
  }
  return uit;
}
