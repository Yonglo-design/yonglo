#!/usr/bin/env node
// Maakt voor elke gewone pagina een deelafbeelding (1200 x 630 px) in de stijl van de website:
// het plaatje dat LinkedIn, Facebook, WhatsApp, Slack enz. tonen als iemand een link deelt.
// Uitvoer: assets/deel/<naam>.jpg (Nederlands) en assets/deel/en-<naam>.jpg (Engels).
// De server zet de bijbehorende tags (og:image, twitter:image) vanzelf in elke pagina (src/paginas.ts).
//
// Opnieuw maken (bijv. na een nieuwe pagina of een andere kop): node tools/maak-deelbeelden.mjs
// De titel komt uit de <h1> van de pagina (het stuk in <em> wordt blauw); het kleine label erboven
// staat hieronder in LABELS. Een nieuwe pagina zonder label krijgt "Yonglo".
// Daarnaast (zie EXTRA en KOPPELINGEN hieronder):
//   - vaste afbeeldingen voor de pagina's uit het CMS zonder eigen beeld: werkgebied (NL en Engels),
//     help docs en een algemene voor de koppelingen;
//   - per koppeling (CMS-collectie Koppelingen) een eigen afbeelding met het logo: koppeling-<slug>.jpg
//     en en-koppeling-<slug>.jpg. Nieuwe koppeling? Draai: node tools/maak-deelbeelden.mjs koppelingen
// Blogberichten, projecten en de Nederlandse/Belgische regiopagina's hebben hun eigen deelafbeelding (uit Wix).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import opentype from "opentype.js";
import jpeg from "jpeg-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "deel");
const FONTS = ["400", "500", "600"].map((w) => join(ROOT, "tools", "fonts", `Outfit-${w}.ttf`));
const F600 = opentype.parse(readFileSync(FONTS[2]).buffer.slice(0));

// Pagina's die niet gedeeld worden (testpagina's en de bedankpagina).
const OVERSLAAN = new Set(["footer-lab", "home-b", "bedankt", "404"]);

// Klein label boven de titel: [Nederlands, Engels].
const LABELS = {
  index: ["Wix Partner · Websites & webshops", "Wix Partner · Websites & online stores"],
  webdesign: ["Webdesign", "Web design"],
  ecommerce: ["eCommerce", "eCommerce"],
  development: ["Development", "Development"],
  branding: ["Concept & branding", "Concept & branding"],
  seo: ["SEO & GEO", "SEO & GEO"],
  ai: ["AI-oplossingen", "AI solutions"],
  api: ["API-koppelingen", "API integrations"],
  wix: ["Wix & Wix Studio", "Wix & Wix Studio"],
  optimaal: ["Wix-optimalisatie", "Wix optimisation"],
  portfolio: ["Portfolio", "Portfolio"],
  klantgegevens: ["Klantgegevens", "Client details"],
  nieuws: ["Nieuws & inzichten", "News & insights"],
  "over-yonglo": ["Over Yonglo", "About Yonglo"],
  contact: ["Contact", "Contact"],
  spel: ["Spel", "Game"],
  disclaimer: ["Juridisch", "Legal"],
  privacybeleid: ["Juridisch", "Legal"],
  voorwaarden: ["Juridisch", "Legal"],
};
// Kop als de <h1> niet bruikbaar is (bijv. met wisselende begroeting).
const KOPPEN = {
  "over-yonglo": ["Yo, wij zijn <em>Yonglo</em>.", "Yo, we are <em>Yonglo</em>."],
};
const ONDER = ["Plan een kennismaking", "Book an intro call"];

// Het Yonglo-woordmerk uit de header.
const header = readFileSync(join(ROOT, "assets", "header.js"), "utf8");
const WORDMARK = (header.match(/<svg class="wordmark" viewBox="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/) || []);
if (!WORDMARK[2]) throw new Error("Woordmerk niet gevonden in assets/header.js");
const WM_VIEW = WORDMARK[1].split(/\s+/).map(Number);
const WM_PATHS = WORDMARK[2].replace(/\sstyle="[^"]*"/g, "");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ontsnap = (s) => s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

// <h1> → woorden met een vlag "accent" (binnen <em>).
function woorden(h1) {
  const schoon = h1.replace(/<br\s*\/?>/g, " ").replace(/<(?!\/?em\b)[^>]+>/g, "");
  const out = [];
  let accent = false;
  for (const deel of schoon.split(/(<\/?em>)/)) {
    if (deel === "<em>") { accent = true; continue; }
    if (deel === "</em>") { accent = false; continue; }
    for (const w of ontsnap(deel).split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) { if (out.length) out[out.length - 1].spatie = true; continue; }
      // Leesteken direct na </em> ("Yonglo</em>.") hoort bij het vorige woord, zonder spatie.
      if (out.length && !out[out.length - 1].spatie && /^[.,!?:;]+$/.test(w)) { out.push({ t: w, accent, plak: true }); continue; }
      out.push({ t: w, accent, plak: out.length > 0 && !out[out.length - 1].spatie });
    }
  }
  return out;
}

// Breedte van een tekst in px (letter voor letter, met kerning), zonder de OpenType-features die opentype.js niet kent.
function textW(t, size) {
  const gl = [...t].map((ch) => F600.charToGlyph(ch));
  let u = 0;
  gl.forEach((g, i) => { u += g.advanceWidth || 0; if (i) u += F600.getKerningValue(gl[i - 1], g) || 0; });
  return (u * size) / F600.unitsPerEm;
}
const breedte = (t, size) => textW(t, size) - (size * 0.02 * [...t].length); // letter-spacing -.02em

// Woorden over regels verdelen; lettergrootte zakt tot alles in maximaal 3 regels past.
function zet(ws, maxW) {
  for (let size = 84; size >= 48; size -= 2) {
    const spatie = breedte(" ", size);
    const regels = [[]];
    let x = 0;
    for (const w of ws) {
      const b = breedte(w.t, size);
      const extra = w.plak || regels.at(-1).length === 0 ? 0 : spatie;
      if (!w.plak && regels.at(-1).length && x + extra + b > maxW) { regels.push([]); x = 0; }
      const r = regels.at(-1);
      r.push({ ...w, x: x + (r.length && !w.plak ? spatie : 0) });
      x += (r.length > 1 && !w.plak ? spatie : 0) + b;
    }
    if (regels.length <= 3) return { size, regels };
  }
  throw new Error("Titel te lang voor de deelafbeelding: " + ws.map((w) => w.t).join(" "));
}

function svg({ label, h1, lang, onder, logo }) {
  const W = 1200, H = 630, L = 80;
  const { size, regels } = zet(woorden(h1), 720);
  const lh = Math.round(size * 1.06);
  const blokH = lh * regels.length;
  const top = 330 - blokH / 2 + size * 0.8; // titel verticaal rond het midden
  const titel = regels.map((r, i) =>
    `<text x="${L}" y="${Math.round(top + i * lh)}" font-family="Outfit" font-weight="600" font-size="${size}" letter-spacing="${-(size * 0.02).toFixed(2)}">` +
    r.map((w) => `<tspan x="${(L + w.x).toFixed(1)}" fill="${w.accent ? "#7A97FD" : "#FFFFFF"}">${esc(w.t)}</tspan>`).join("") +
    `</text>`).join("\n");
  const labelY = Math.round(top - size * 0.8 - 34);
  const wmH = 34, wmW = (WM_VIEW[2] / WM_VIEW[3]) * wmH;
  const knop = onder || ONDER[lang === "en" ? 1 : 0];
  const knopW = Math.round(textW(knop, 22) + 104);

  // Zwevende tegels rechts, zoals in de hero van de homepage.
  const tegel = (x, y, w, h, r, a, b, c, rot, id) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
    <g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" filter="url(#schaduw)">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${id})"/>
      <rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${r}" fill="none" stroke="#FFFFFF" stroke-opacity=".12"/>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="blob1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#325FFC" stop-opacity=".55"/><stop offset="1" stop-color="#325FFC" stop-opacity="0"/></radialGradient>
    <radialGradient id="blob2" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#7A97FD" stop-opacity=".28"/><stop offset="1" stop-color="#7A97FD" stop-opacity="0"/></radialGradient>
    <radialGradient id="blob3" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FF7A59" stop-opacity=".16"/><stop offset="1" stop-color="#FF7A59" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#FFFFFF" fill-opacity=".07"/></pattern>
    <filter id="schaduw" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="24" stdDeviation="26" flood-color="#000" flood-opacity=".45"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#0E0F1A"/>
  <circle cx="1010" cy="120" r="420" fill="url(#blob1)"/>
  <circle cx="160" cy="640" r="380" fill="url(#blob2)"/>
  <circle cx="760" cy="620" r="260" fill="url(#blob3)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  ${logo ? `
  ${tegel(930, 380, 150, 150, 22, "#325FFC", "#7A97FD", "#C9D5FF", 8, "g3")}
  <clipPath id="logoclip"><rect x="860" y="170" width="260" height="260" rx="36"/></clipPath>
  <g transform="rotate(-4 990 300)" filter="url(#schaduw)">
    <rect x="860" y="170" width="260" height="260" rx="36" fill="#FFFFFF"/>
    <image href="${logo}" x="860" y="170" width="260" height="260" preserveAspectRatio="xMidYMid slice" clip-path="url(#logoclip)"/>
    <rect x="860.5" y="170.5" width="259" height="259" rx="36" fill="none" stroke="#FFFFFF" stroke-opacity=".2"/>
  </g>` : `
  ${tegel(905, 140, 230, 150, 22, "#23265a", "#325FFC", "#99AFFE", -4, "g1")}
  ${tegel(965, 312, 190, 210, 22, "#1b1d2e", "#3b3f63", "#8a90c7", 5, "g2")}
  ${tegel(872, 452, 140, 140, 20, "#325FFC", "#7A97FD", "#C9D5FF", -7, "g3")}`}
  <g transform="translate(${L} 64) scale(${(wmH / WM_VIEW[3]).toFixed(4)})" fill="#FFFFFF">${WM_PATHS}</g>
  <g transform="translate(${W - 80 - 196} 60)">
    <rect width="196" height="44" rx="22" fill="#FFFFFF" fill-opacity=".08" stroke="#FFFFFF" stroke-opacity=".14"/>
    <text x="22" y="29" font-family="Outfit" font-weight="600" font-size="18" fill="#FFFFFF">5.0</text>
    ${[0, 1, 2, 3, 4].map((k) => `<path transform="translate(${60 + k * 23} 13) scale(.9)" fill="#FFC107" d="M10 0l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L10 14.9l-6.1 3.5 1.5-6.8L.2 7l6.9-.7z"/>`).join("")}
  </g>
  <text x="${L}" y="${labelY}" font-family="Outfit" font-weight="500" font-size="20" letter-spacing="3" fill="#7A97FD">${esc(label.toUpperCase())}</text>
  ${titel}
  <g transform="translate(${L} 510)">
    <rect width="${knopW}" height="56" rx="28" fill="#325FFC"/>
    <text x="32" y="36" font-family="Outfit" font-weight="600" font-size="22" fill="#FFFFFF">${esc(knop)}</text>
    <path transform="translate(${knopW - 52} 28)" d="M0 0h18M11 -7l7 7-7 7" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="${L + knopW + 28}" y="546" font-family="Outfit" font-weight="500" font-size="22" fill="#FFFFFF" fill-opacity=".72">yonglo.com</text>
</svg>`;
}

function render(svgText, file) {
  const img = new Resvg(svgText, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: "Outfit" },
  }).render();
  // JPEG (kwaliteit 88): ongeveer 10x kleiner dan PNG, dus sneller geladen door LinkedIn, WhatsApp enz.
  const { data } = jpeg.encode({ data: img.pixels, width: img.width, height: img.height }, 88);
  writeFileSync(file, data);
}

mkdirSync(OUT, { recursive: true });
const alleen = process.argv.slice(2).filter((a) => !a.startsWith("-"));
let n = 0;
for (const [lang, dir, prefix] of [["nl", ROOT, ""], ["en", join(ROOT, "en"), "en-"]]) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".html")) continue;
    const naam = file.slice(0, -5);
    if (OVERSLAAN.has(naam) || (alleen.length && !alleen.includes(naam))) continue;
    const html = readFileSync(join(dir, file), "utf8");
    const i = lang === "en" ? 1 : 0;
    const h1 = KOPPEN[naam]?.[i] || (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    if (!h1) { console.warn(`Geen <h1> in ${file}, overgeslagen.`); continue; }
    const label = LABELS[naam]?.[i] || "Yonglo";
    const svgText = svg({ label, h1, lang });
    if (process.argv.includes("--svg")) writeFileSync(join(OUT, `${prefix}${naam}.svg`), svgText);
    render(svgText, join(OUT, `${prefix}${naam}.jpg`));
    n++;
  }
}
// Vaste afbeeldingen voor CMS-pagina's zonder eigen beeld (src/regio.ts, src/helpdocs.ts, src/koppeling.ts).
const EXTRA = [
  { naam: "werkgebied", lang: "nl", label: "Werkgebied · Nederland & België", h1: "Jouw Wix-partner, <em>waar</em> je ook zit." },
  { naam: "en-werkgebied", lang: "en", label: "Wix web design across Europe", h1: "Your Wix partner, <em>wherever</em> you are." },
  { naam: "help-docs", lang: "en", label: "Help docs · Wix apps by Yonglo", h1: "How can we <em>help</em>?", onder: "Read the guides" },
  { naam: "koppelingen", lang: "nl", label: "Wix-koppelingen", h1: "Koppel Wix aan <em>elk systeem</em>." },
  { naam: "en-koppelingen", lang: "en", label: "Wix integrations", h1: "Connect Wix to <em>any system</em>." },
];
for (const x of EXTRA) {
  if (alleen.length && !alleen.includes(x.naam) && !alleen.includes("extra")) continue;
  render(svg(x), join(OUT, `${x.naam}.jpg`));
  n++;
}

// Per koppeling een eigen afbeelding met het logo (alleen met het argument "koppelingen" of zonder argumenten).
if (!alleen.length || alleen.includes("koppelingen")) {
  const cfg = readFileSync(join(ROOT, "assets", "wix", "wix-config.js"), "utf8");
  const clientId = cfg.match(/WIX_CLIENT_ID\s*=\s*"([^"]+)"/)[1];
  try {
    const tok = await fetch("https://www.wixapis.com/oauth2/token", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, grantType: "anonymous" }) }).then((r) => r.json());
    const res = await fetch("https://www.wixapis.com/wix-data/v2/items/query", { method: "POST",
      headers: { "Content-Type": "application/json", Authorization: tok.access_token },
      body: JSON.stringify({ dataCollectionId: "Koppelingen", query: { cursorPaging: { limit: 100 } } }) });
    if (!res.ok) throw new Error(`Wix Data ${res.status}`);
    const items = ((await res.json()).dataItems || []).map((x) => x.data).filter((k) => k.slug && k.title);
    for (const k of items) {
      // Logo als PNG ophalen (vierkant, 520 px) en in de afbeelding zetten.
      let logo = null;
      const id = (String(k.logo || "").match(/^wix:image:\/\/v1\/([^/]+)/) || [])[1];
      if (id) {
        const r = await fetch(`https://static.wixstatic.com/media/${id}/v1/fill/w_520,h_520,al_c,q_90/${id.replace(/\.[a-z]+$/i, "")}.png`);
        if (r.ok) logo = `data:${r.headers.get("content-type") || "image/png"};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
      }
      const titel = esc(k.title);
      render(svg({ lang: "nl", label: "Wix-koppeling", h1: `Wix koppelen met <em>${titel}</em>`, logo }), join(OUT, `koppeling-${k.slug}.jpg`));
      render(svg({ lang: "en", label: "Wix integration", h1: `Connect Wix with <em>${titel}</em>`, logo }), join(OUT, `en-koppeling-${k.slug}.jpg`));
      n += 2;
    }
  } catch (err) {
    console.warn("Koppelingen overgeslagen (CMS niet bereikbaar):", err.message);
  }
}
console.log(`${n} deelafbeeldingen gemaakt in assets/deel/.`);
