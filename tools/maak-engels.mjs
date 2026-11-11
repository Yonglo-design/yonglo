#!/usr/bin/env node
// Maakt de Engelse website (map en/) uit de Nederlandse pagina's in de hoofdmap.
//
//   node tools/maak-engels.mjs            → schrijft en/<pagina>.html voor elke pagina
//   node tools/maak-engels.mjs --check    → schrijft niets, meldt alleen ontbrekende vertalingen
//
// Hoe het werkt: de opmaak (HTML, CSS, scripts) komt altijd uit de Nederlandse pagina. Alleen de teksten
// worden vervangen, met het woordenboek tools/engels.json ({ "Nederlandse tekst": "English text" }).
// Een tekst is een blok zonder andere blokken erin (een kop, alinea, knop, lijstitem …). Opmaak binnen de
// tekst (<em>, <a>, <b> …) staat in het woordenboek als {1}…{/1}; een icoon of afbeelding als {2/}.
// Ontbreekt een vertaling, dan blijft die tekst Nederlands en staat hij in tools/engels-ontbrekend.json,
// zodat hij vertaald kan worden. Links naar pagina's worden /en/<pagina>.
// Dit bestand hoort niet bij de website en wordt niet geüpload.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "en");
const DICT_FILE = join(ROOT, "tools", "engels.json");
const MISSING_FILE = join(ROOT, "tools", "engels-ontbrekend.json");
// Test- en tussenpagina's krijgen geen Engelse versie.
const SKIP = new Set(["home-b.html", "footer-lab.html"]);
const CHECK = process.argv.includes("--check");

const PAGES = readdirSync(ROOT).filter((n) => n.endsWith(".html") && !SKIP.has(n)).sort();
const PAGE_NAMES = new Set(PAGES.map((n) => n.slice(0, -5)));
const dict = existsSync(DICT_FILE) ? JSON.parse(readFileSync(DICT_FILE, "utf8")) : {};

// ---------- HTML in een eenvoudige boom ----------
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea"]);
const OPAQUE = new Set(["svg", "img", "br", "input", "canvas", "video", "picture", "iframe"]);
const INLINE = new Set(["a", "em", "strong", "b", "i", "span", "small", "mark", "kbd", "sup", "sub", "abbr", "code", "u", "s", "time", "q", "cite", "label", "bdi"]);

function parse(html) {
  const root = { name: "#root", children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/?([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/gi;
  let pos = 0, m;
  const top = () => stack[stack.length - 1];
  const text = (s) => { if (s) top().children.push({ name: "#text", text: s }); };
  while ((m = re.exec(html))) {
    text(html.slice(pos, m.index));
    pos = re.lastIndex;
    const tag = m[0];
    if (!m[1]) { top().children.push({ name: "#raw", text: tag }); continue; }
    const name = m[1].toLowerCase();
    if (tag[1] === "/") {
      // sluittag: terug naar het bijbehorende element
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].name === name) { stack[i].close = tag; stack.length = i; break; }
      }
      continue;
    }
    const el = { name, open: tag, children: [], close: "" };
    top().children.push(el);
    if (RAW.has(name)) {
      const end = html.toLowerCase().indexOf(`</${name}`, pos);
      const stop = end < 0 ? html.length : end;
      el.children.push({ name: "#raw", text: html.slice(pos, stop) });
      const close = html.slice(stop).match(new RegExp(`^</${name}\\s*>`, "i"));
      el.close = close ? close[0] : "";
      pos = stop + (close ? close[0].length : 0);
      re.lastIndex = pos;
      continue;
    }
    if (VOID.has(name) || m[3] === "/") continue;
    stack.push(el);
  }
  text(html.slice(pos));
  return root;
}

const outer = (n) => n.name === "#text" || n.name === "#raw" ? n.text : n.open + n.children.map(outer).join("") + (n.close || "");
const hasLetters = (s) => /[A-Za-zÀ-ÿ]/.test(s.replace(/&[a-z#0-9]+;/gi, ""));
const textOf = (n) => n.name === "#text" ? n.text : n.name === "#raw" || OPAQUE.has(n.name) ? "" : n.children.map(textOf).join("");

// Alleen tekst en inline opmaak (geen blokken) erin?
function inlineOnly(n) {
  return n.children.every((c) => c.name === "#text" || (c.name === "#raw" && c.text.startsWith("<!--")) || OPAQUE.has(c.name) || (INLINE.has(c.name) && inlineOnly(c)));
}

// Sleutel van een tekstblok: tekst met {1}…{/1} voor opmaak en {2/} voor iconen/afbeeldingen.
function keyOf(n) {
  const parts = [];
  let k = 0;
  (function walk(node) {
    for (const c of node.children) {
      if (c.name === "#text") parts.push({ t: c.text });
      else if (c.name === "#raw") continue;
      else if (OPAQUE.has(c.name) || !c.children.length && !c.close) { k++; parts.push({ ph: `{${k}/}`, node: c, whole: true }); }
      else { k++; const id = k; parts.push({ ph: `{${id}}`, open: c }); walk(c); parts.push({ ph: `{/${id}}`, close: c }); }
    }
  })(n);
  const raw = parts.map((p) => p.t ?? p.ph).join("");
  const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
  const key = raw.replace(/\s+/g, " ").trim();
  return { key, lead, trail, parts };
}

function rebuild(value, parts) {
  const map = {};
  for (const p of parts) {
    if (p.whole) map[p.ph] = outer(p.node);
    else if (p.open) map[p.ph] = p.open.open;
    else if (p.close) map[p.ph] = p.close.close;
  }
  return value.replace(/\{\/?\d+\/?\}/g, (ph) => map[ph] ?? "");
}

// ---------- vertalen ----------
const missing = {};
function need(key, page) { (missing[key] ||= []).includes(page) || missing[key].push(page); }
function tr(key, page) {
  if (!key || !hasLetters(key.replace(/\{\/?\d+\/?\}/g, ""))) return null;
  if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  need(key, page);
  return null;
}

function translateTree(node, page) {
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i];
    if (c.name === "#text") {
      const key = c.text.replace(/\s+/g, " ").trim();
      const v = tr(key, page);
      if (v != null) c.text = c.text.match(/^\s*/)[0] + v + c.text.match(/\s*$/)[0];
      continue;
    }
    if (c.name === "#raw" || RAW.has(c.name) || OPAQUE.has(c.name) || c.name === "option" && false) continue;
    if (c.children.length && inlineOnly(c) && hasLetters(textOf(c))) {
      const { key, lead, trail, parts } = keyOf(c);
      const v = tr(key, page);
      if (v != null) c.children = [{ name: "#text", text: lead + rebuild(v, parts) + trail }];
      continue;
    }
    translateTree(c, page);
  }
}

// Attributen met tekst (alt, title, aria-label, placeholder, meta-omschrijvingen) en links naar /en.
const ATTRS = ["alt", "title", "aria-label", "placeholder", "data-label", "data-text"];
function fixTags(html, page) {
  // scripts en styles overslaan
  return html.replace(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>)|<([a-zA-Z][\w-]*)(\s[^<>]*?)?(\/?)>/g, (all, rawBlock, name, attrs = "", slash) => {
    if (rawBlock) return rawBlock;
    let a = attrs;
    for (const at of ATTRS) {
      a = a.replace(new RegExp(`(\\s${at}=")([^"]*)(")`, "g"), (x, p1, val, p3) => { const v = tr(val.trim(), page); return v != null ? p1 + v + p3 : x; });
    }
    if (name.toLowerCase() === "meta" && /\s(name|property)="(description|og:title|og:description|twitter:title|twitter:description)"/.test(a)) {
      a = a.replace(/(\scontent=")([^"]*)(")/, (x, p1, val, p3) => { const v = tr(val.trim(), page); return v != null ? p1 + v + p3 : x; });
    }
    if (name.toLowerCase() === "input" && /\stype="(radio|checkbox|submit|button)"/.test(a)) {
      a = a.replace(/(\svalue=")([^"]*)(")/, (x, p1, val, p3) => { const v = tr(val.trim(), page); return v != null ? p1 + v + p3 : x; });
    }
    // links naar Nederlandse pagina's → Engelse pagina's
    a = a.replace(/(\shref=")([^"]*)(")/, (x, p1, href, p3) => p1 + enHref(href) + p3);
    // relatieve paden (assets/…) werken niet vanuit /en/: maak ze absoluut
    a = a.replace(/(\s(?:src|href)=")(assets\/)/g, "$1/$2");
    return `<${name}${a}${slash}>`;
  });
}

export function enHref(href) {
  const m = href.match(/^\/([^?#]*)([?#].*)?$/);
  if (!m) return href;
  const path = m[1].replace(/\.html$/, "").replace(/\/$/, ""), rest = m[2] || "";
  if (path === "" || path === "index") return "/en" + rest;
  if (PAGE_NAMES.has(path)) return `/en/${path}${rest}`;
  if (path.startsWith("project/") || path === "project") return `/en/${path}${rest}`;
  return href;
}

// Teksten in scripts op de pagina zelf (die worden niet automatisch vertaald): [Nederlands, Engels], letterlijk.
const SCRIPT_EN = [
  ["textContent=open?'Nu bereikbaar':'Nu gesloten'", "textContent=open?'Available now':'Closed now'"],
];

// Gestructureerde gegevens (JSON-LD voor Google): teksten vertalen, paginalinks naar /en.
const LD_TEXT = new Set(["name", "serviceType", "description", "slogan", "headline"]);
function ldEnglish(o, page, key) {
  if (Array.isArray(o)) return o.map((v) => ldEnglish(v, page, key));
  if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ldEnglish(v, page, k)]));
  if (typeof o !== "string") return o;
  if (key === "inLanguage") return "en";
  if ((key === "item" || key === "url" || key === "@id") && /^https:\/\/www\.yonglo\.com\/[^#]/.test(o)) {
    const u = new URL(o);
    const en = enHref(u.pathname);
    return en === u.pathname ? o : u.origin + en + u.hash;
  }
  if (LD_TEXT.has(key) && !/^(Yonglo|Home)$/.test(o)) { const v = tr(o, page); return v ?? o; }
  return o;
}

// ---------- pagina's maken ----------
let written = 0;
if (!CHECK) { rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true }); }
for (const file of PAGES) {
  const page = file.slice(0, -5);
  let html = readFileSync(join(ROOT, file), "utf8");
  const tree = parse(html);
  translateTree(tree, page);
  html = tree.children.map(outer).join("");
  html = fixTags(html, page);
  html = html.replace(/<html lang="nl"/, '<html lang="en"');
  // teksten in losse scripts op de pagina (zie SCRIPT_EN)
  for (const [nl, en] of SCRIPT_EN) html = html.split(nl).join(en);
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (all, a, json, b) => {
    try { return a + JSON.stringify(ldEnglish(JSON.parse(json), page)).replace(/</g, "\\u003c") + b; } catch { return all; }
  });
  // oude canonical weg; de server zet canonical + taalversies (hreflang) bij elke pagina
  html = html.replace(/\s*<link rel="canonical"[^>]*>/g, "");
  if (!CHECK) { writeFileSync(join(OUT, file), html); written++; }
}

const keys = Object.keys(missing);
if (process.argv.includes("--paginas")) writeFileSync(MISSING_FILE + ".paginas", JSON.stringify(missing));
if (keys.length) writeFileSync(MISSING_FILE, JSON.stringify(Object.fromEntries(keys.map((k) => [k, ""])), null, 1) + "\n");
else if (existsSync(MISSING_FILE)) rmSync(MISSING_FILE);
console.log(`${CHECK ? "Gecontroleerd" : written + " Engelse pagina's gemaakt in en/"}; ${keys.length} tekst(en) zonder vertaling${keys.length ? " (zie tools/engels-ontbrekend.json)" : ""}.`);
