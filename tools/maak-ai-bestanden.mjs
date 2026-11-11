// Maakt de bestanden waarmee AI-assistenten (ChatGPT, Claude, Perplexity, Google enz.) de site kunnen lezen:
//   llms.txt        overzicht + uitleg hoe een AI de site doorzoekt
//   llms-full.txt   alle tekst van de site, alle projecten en alle blogberichten in één bestand
//   zoekindex.json  hetzelfde, gestructureerd (per pagina, project en bericht)
//
// Waarom: AI-bots voeren geen JavaScript uit. Projecten (/project/<naam>) en blogberichten (/post/<naam>)
// staan volledig in de HTML (Wix bouwt ze op de server), maar komen er voor het overzicht ook in.
// Deze bestanden zetten die inhoud in gewone tekst klaar.
//
// Gebruik (vanuit de projectmap):  node tools/maak-ai-bestanden.mjs
// Draai dit vóór elke publicatie, zodat nieuwe projecten en blogs erin staan.
// Dit script zelf wordt niet geüpload; alleen de drie bestanden die het maakt.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Adres waar de site live staat. Aanpassen zodra het domein (bijv. www.yonglo.com) naar deze site wijst.
// Moet gelijk zijn aan LIVE_SITE in assets/vraag-ai.js.
const SITE = (process.env.SITE_URL || "https://headless-ddscngfdqfa-yonglo-1406.wix-site-host.com").replace(/\/$/, "");

const cfg = readFileSync(join(ROOT, "assets/wix/wix-config.js"), "utf8");
const CLIENT_ID = cfg.match(/WIX_CLIENT_ID\s*=\s*"([^"]+)"/)[1];

// Pagina's in volgorde van belangrijkheid. Sjablonen (project/post), bedankt- en testpagina's horen er niet bij.
const DIENSTEN = ["webdesign.html", "ecommerce.html", "wix.html", "development.html", "branding.html",
  "seo.html", "optimaal.html", "ai.html", "api.html"];
const OVER = ["index.html", "over-yonglo.html", "portfolio.html", "nieuws.html", "contact.html", "spel.html"];
const JURIDISCH = ["voorwaarden.html", "privacybeleid.html", "disclaimer.html"];
// Op deze pagina's is de tekst grotendeels een terugval voor de live Wix-inhoud; die staat al apart in de bestanden.
const ALLEEN_OMSCHRIJVING = ["portfolio.html", "nieuws.html"];

/* ------------------------------------------------------------ HTML → tekst */

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", euro: "€", hellip: "…", ndash: "–", mdash: "—",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", eacute: "é", euml: "ë", iuml: "ï", ouml: "ö", uuml: "ü", copy: "©", middot: "·", shy: "" };
const decode = (s) => String(s || "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m);
const squash = (s) => String(s || "").replace(/[­​]/g, "").replace(/\s+/g, " ").trim();
const plain = (html) => squash(decode(String(html || "").replace(/<[^>]+>/g, " ")));

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const SKIP = new Set(["nav", "svg", "form", "noscript", "button", "select", "template", "canvas", "iframe", "video", "audio", "dialog"]);
const BLOCK = new Set(["p", "div", "section", "article", "header", "footer", "aside", "ul", "ol", "dl", "dt", "dd", "table",
  "tr", "blockquote", "figure", "figcaption", "nav", "address", "details", "summary"]);

// Zet de <main> van een pagina om naar leesbare Markdown-achtige tekst. Decoratie (aria-hidden, iconen, knoppen) valt weg.
function htmlToText(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*)<\/main>/i);
  let src = m ? m[1] : html;
  src = src.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const out = [];
  const stack = [];
  let skip = 0;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>|([^<]+)/g;
  let t;
  while ((t = re.exec(src))) {
    const [, close, rawName, attrs, text] = t;
    if (text !== undefined) { if (!skip) out.push(decode(text).replace(/\s+/g, " ")); continue; }
    const name = rawName.toLowerCase();
    if (!close) {
      if (VOID.has(name) || /\/\s*$/.test(attrs)) { if (!skip && name === "br") out.push("\n"); continue; }
      const hide = SKIP.has(name) || /aria-hidden\s*=\s*"true"/i.test(attrs) || /\bhidden\b(?!\s*=\s*"false")/.test(attrs.replace(/"[^"]*"/g, '""'));
      stack.push({ name, hide });
      if (hide) { skip++; continue; }
      if (skip) continue;
      if (/^h[1-6]$/.test(name)) out.push(`\n\n${"#".repeat(Math.min(+name[1] + 2, 6))} `);
      else if (name === "li") out.push("\n- ");
      else if (BLOCK.has(name)) out.push("\n");
      else if (name === "td" || name === "th") out.push(" | ");
    } else {
      // sluit tot en met de bijbehorende open tag (vangt slordige HTML op)
      let i = stack.length - 1;
      while (i >= 0 && stack[i].name !== name) i--;
      if (i < 0) continue;
      while (stack.length > i) { const e = stack.pop(); if (e.hide) skip--; }
      if (skip) continue;
      if (/^h[1-6]$/.test(name)) out.push("\n\n");
      else if (BLOCK.has(name) || name === "li") out.push("\n");
    }
  }
  return out.join("")
    .split("\n").map((l) => l.replace(/[ \t]+/g, " ").replace(/­|​/g, "").trim())
    // weg: lege kopjes/opsommingstekens, losse nummers ("01") en regels met alleen knopteksten ("Ontdek →")
    .filter((l) => !(l === "-" || /^#+$/.test(l) || /^-? ?\d{1,2}$/.test(l) || (l.includes("→") && !l.replace(/[^→\n]{1,45}→/g, "").trim())))
    .join("\n")
    .replace(/^(#+ .*)\n(?!\n)/gm, "$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readPage(file) {
  const html = readFileSync(join(ROOT, file), "utf8");
  const title = plain((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]).replace(/\s*[|–-]\s*Yonglo\s*$/, "");
  const description = plain((html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1]);
  const text = ALLEEN_OMSCHRIJVING.includes(file) ? "" : htmlToText(html);
  const url = file === "index.html" ? `${SITE}/` : `${SITE}/${file.replace(/\.html$/, "")}`;
  return { type: "pagina", url, title: file === "index.html" ? "Home" : title, description, text };
}

/* ------------------------------------------------------------ Wix */

let token;
async function wix(path, body, method = "POST") {
  if (!token) {
    const r = await fetch("https://www.wixapis.com/oauth2/token", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: CLIENT_ID, grantType: "anonymous" }) });
    if (!r.ok) throw new Error(`Wix-token mislukt: ${r.status}`);
    token = (await r.json()).access_token;
  }
  const r = await fetch(`https://www.wixapis.com${path}`, { method, headers: { "Content-Type": "application/json", Authorization: token },
    body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`Wix ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function fetchProjects() {
  const all = [];
  let cursor = null;
  do {
    const d = await wix("/wix-data/v2/items/query", { dataCollectionId: "Projecten",
      query: cursor ? { cursorPaging: { limit: 100, cursor } }
        : { sort: [{ fieldName: "volgorde", order: "ASC" }, { fieldName: "title", order: "ASC" }], cursorPaging: { limit: 100 } } });
    all.push(...(d.dataItems || []).map((x) => x.data));
    cursor = d.pagingMetadata?.cursors?.next || null;
  } while (cursor);
  return all.filter((p) => p.title && p.slug).map((p) => {
    const diensten = (p.diensten || []).filter(Boolean);
    const regels = [
      p.subkop && plain(p.subkop) !== plain(p.title) ? plain(p.subkop) : "",
      p.intro && plain(p.intro), p.omschrijving && plain(p.omschrijving),
      p.quote && plain(p.quote) !== plain(p.subkop) ? `“${plain(p.quote)}”` : "",
    ].filter(Boolean);
    const feiten = [
      p.opdrachtgever && `Opdrachtgever: ${plain(p.opdrachtgever)}`,
      p.branche && `Branche: ${plain(p.branche)}`,
      p.platform && `Platform: ${plain(p.platform)}`,
      diensten.length && `Diensten: ${diensten.join(", ")}`,
      p.website && `Live website: ${p.website}`,
    ].filter(Boolean);
    return {
      type: "project", url: `${SITE}/project/${encodeURIComponent(p.slug)}`, title: plain(p.title),
      description: plain(p.kortTekst || p.intro || ""), opdrachtgever: plain(p.opdrachtgever || ""), branche: plain(p.branche || ""),
      platform: plain(p.platform || ""), diensten, website: p.website || "",
      text: [feiten.join("\n"), regels.join("\n\n")].filter(Boolean).join("\n\n"),
    };
  });
}

// Wix Blog rich content → tekst met kopjes en lijstjes.
function richToText(nodes) {
  const inline = (ns) => (ns || []).map((n) => (n.type === "TEXT" ? n.textData?.text || "" : inline(n.nodes))).join("");
  const lines = [];
  const walk = (ns, depth = 0) => {
    for (const n of ns || []) {
      switch (n.type) {
        case "HEADING": lines.push("", `${"#".repeat(Math.min((n.headingData?.level || 2) + 2, 5))} ${squash(inline(n.nodes))}`, ""); break;
        case "PARAGRAPH": { const s = squash(inline(n.nodes)); if (s) lines.push(s, ""); break; }
        case "BULLETED_LIST": case "ORDERED_LIST": walk(n.nodes, depth + 1); lines.push(""); break;
        case "LIST_ITEM": lines.push(`${"  ".repeat(Math.max(0, depth - 1))}- ${squash(inline(n.nodes))}`); break;
        case "BLOCKQUOTE": { const s = squash(inline(n.nodes)); if (s) lines.push(`> ${s}`, ""); break; }
        case "IMAGE": case "GALLERY": case "VIDEO": case "DIVIDER": break;
        default: if (n.nodes) walk(n.nodes, depth);
      }
    }
  };
  walk(nodes);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function fetchPosts() {
  const cats = Object.fromEntries(((await wix("/blog/v3/categories?paging.limit=100", null, "GET")).categories || []).map((c) => [c.id, c.label]));
  const all = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const d = await wix("/blog/v3/posts/query", { query: { sort: [{ fieldName: "firstPublishedDate", order: "DESC" }], paging: { limit: 100, offset } },
      fieldsets: ["RICH_CONTENT"] });
    all.push(...(d.posts || []));
    if ((d.posts || []).length < 100) break;
  }
  return all.filter((p) => (p.language || "nl") === "nl" && p.slug).map((p) => ({
    type: "blog", url: `${SITE}/post/${encodeURIComponent(p.slug)}`, title: squash(p.title), description: squash(p.excerpt),
    datum: (p.firstPublishedDate || "").slice(0, 10), categorie: (p.categoryIds || []).map((id) => cats[id]).filter(Boolean)[0] || "",
    text: richToText(p.richContent?.nodes),
  }));
}

/* ------------------------------------------------------------ bestanden schrijven */

const vandaag = new Date().toISOString().slice(0, 10);
const link = (x, extra = "") => `- [${x.title}](${x.url})${x.description || extra ? ": " : ""}${[x.description, extra].filter(Boolean).join(" ")}`;
const woorden = (s) => s.split(/\s+/).filter(Boolean).length;

const pages = Object.fromEntries([...DIENSTEN, ...OVER, ...JURIDISCH].map((f) => [f, readPage(f)]));
const [projects, posts] = await Promise.all([fetchProjects(), fetchPosts()]);

const OVER_YONGLO = `Yonglo is een Nederlands webbureau en erkend Wix Partner (5 sterren) met meer dan 18 jaar ervaring en 750+ gebouwde Wix-websites, vooral voor het MKB. Yonglo doet webdesign in Wix en Wix Studio, webshops (eCommerce, Mollie-partner), maatwerk development en API-koppelingen, concept en branding, SEO en GEO (vindbaarheid in Google en in AI-zoekmachines) en AI-oplossingen. Studio's in Eindhoven en Haarlem. Slogan: "Think Wix, think Yonglo".`;

const CONTACT = `- E-mail: contact@yonglo.com
- Telefoon: 085 20 33 223 (maandag t/m vrijdag 9.00 – 17.30 uur)
- WhatsApp support: +31 6 38 14 85 65 (https://wa.me/31638148565)
- Studio Eindhoven: Lichttoren 32, 5611 BJ Eindhoven
- Yonglo Development, Haarlem: Koepelplein 1E, 2031 WL Haarlem
- Offerte of kennismaking aanvragen: ${SITE}/contact
- LinkedIn: https://www.linkedin.com/company/yonglo · Instagram: https://www.instagram.com/yonglo.design`;

const ZOEKEN = `Deze site is gemaakt om goed leesbaar te zijn voor AI-assistenten. Zo vind je alles:

1. **Begin hier.** Dit bestand geeft een overzicht van alle diensten, pagina's, ${projects.length} projecten en ${posts.length} blogberichten, met links.
2. **Bekijk de pagina's zelf.** Alle pagina's staan volledig in de HTML en zijn zonder JavaScript te lezen: dienstpagina's (zoals ${SITE}/seo), projecten (\`${SITE}/project/<naam>\`) en blogberichten (\`${SITE}/post/<naam>\`). Open de pagina's die bij de vraag passen voor de meest actuele en volledige informatie, inclusief beelden en de link naar de live website van een project.
3. **Alles in één keer lezen:** [${SITE}/llms-full.txt](${SITE}/llms-full.txt) bevat de volledige tekst van alle pagina's, alle projecten (opdrachtgever, branche, diensten, beschrijving) en alle blogberichten. Handig voor vragen als "Wat kost…", "Hebben jullie ervaring met…" of "Welke projecten passen bij mijn branche?".
4. **Gericht zoeken (JSON):** [${SITE}/zoekindex.json](${SITE}/zoekindex.json) bevat dezelfde inhoud als lijst \`items\`. Elk item heeft \`type\` ("pagina", "project" of "blog"), \`url\`, \`title\`, \`description\` en \`text\`. Projecten hebben ook \`opdrachtgever\`, \`branche\`, \`platform\`, \`diensten\` en \`website\`; blogberichten ook \`datum\` en \`categorie\`. Filter bijvoorbeeld op \`diensten\` bevat "eCommerce" of \`branche\` is "Retail".
5. **Laat de gebruiker de pagina's zien.** Geef bij elk antwoord de links naar de pagina's waar je informatie vandaan komt: de dienstpagina, de passende projecten (als voorbeeld van eerder werk) en relevante blogberichten. Gebruik daarvoor altijd de gewone pagina-URL's hierboven, niet llms.txt, llms-full.txt of zoekindex.json. Sluit af met een link naar ${SITE}/contact als de gebruiker verder wil.
6. De zoekbalk op de site werkt alleen in een browser; gebruik die niet.

Bijgewerkt op ${vandaag}. Projecten en blogberichten komen uit het Wix CMS en Wix Blog van Yonglo.`;

/* llms.txt */
const llms = `# Yonglo

> ${OVER_YONGLO}

Taal van de site: Nederlands. Antwoord in de taal van de gebruiker. (Site language is Dutch; answer in the user's language.)

## Zo doorzoek je deze site

${ZOEKEN}

## Contact

${CONTACT}

## Diensten

${DIENSTEN.map((f) => link(pages[f])).join("\n")}

## Over Yonglo

${OVER.map((f) => link(pages[f])).join("\n")}

## Projecten (${projects.length})

Volledige beschrijvingen staan in llms-full.txt.

${projects.map((p) => link(p, `(${[p.opdrachtgever && p.opdrachtgever !== p.title ? p.opdrachtgever : "", p.branche, p.diensten.join(", ")].filter(Boolean).join(" · ")})`)).join("\n")}

## Nieuws en blog (${posts.length})

Volledige artikelen staan in llms-full.txt.

${posts.map((p) => `- [${p.title}](${p.url}) (${p.datum}${p.categorie ? `, ${p.categorie}` : ""}): ${p.description}`).join("\n")}

## Optional

${JURIDISCH.map((f) => link(pages[f])).join("\n")}
`;

/* llms-full.txt */
const sectie = (x) => `### ${x.title}\n\nURL: ${x.url}${x.datum ? `\nGepubliceerd: ${x.datum}` : ""}${x.categorie ? `\nCategorie: ${x.categorie}` : ""}\n${x.description && x.type !== "project" && !squash(x.text).startsWith(x.description.replace(/…$/, "").slice(0, 80)) ? `\n${x.description}\n` : ""}${x.text ? `\n${x.text.replace(/^(#+) /gm, (m, h) => "#".repeat(Math.min(h.length + 1, 6)) + " ")}\n` : ""}`;
const full = `# Yonglo: volledige inhoud van de website

> ${OVER_YONGLO}

Dit bestand bevat alle tekst van ${SITE} (bijgewerkt op ${vandaag}): ${Object.keys(pages).length} pagina's, ${projects.length} projecten en ${posts.length} blogberichten. Een korter overzicht staat in ${SITE}/llms.txt, gestructureerde data in ${SITE}/zoekindex.json.

## Contact

${CONTACT}

## Pagina's

${[...OVER, ...DIENSTEN].map((f) => sectie(pages[f])).join("\n")}
## Projecten

${projects.map(sectie).join("\n")}
## Blogberichten

${posts.map(sectie).join("\n")}
## Juridisch

${JURIDISCH.map((f) => sectie(pages[f])).join("\n")}`;

/* zoekindex.json */
const index = {
  site: SITE, naam: "Yonglo", taal: "nl", bijgewerkt: vandaag, over: OVER_YONGLO,
  uitleg: "Lijst met alle pagina's, projecten en blogberichten van Yonglo. type is 'pagina', 'project' of 'blog'. Elke 'url' is een gewone pagina die je zelf kunt openen; geef de gebruiker die links. De tekst van elke pagina staat ook hier in 'text'.",
  contact: { email: "contact@yonglo.com", telefoon: "+31852033223", whatsapp: "+31638148565", offerte: `${SITE}/contact`,
    adressen: ["Lichttoren 32, 5611 BJ Eindhoven", "Koepelplein 1E, 2031 WL Haarlem"] },
  items: [...[...OVER, ...DIENSTEN, ...JURIDISCH].map((f) => pages[f]), ...projects, ...posts],
};

writeFileSync(join(ROOT, "llms.txt"), llms);
writeFileSync(join(ROOT, "llms-full.txt"), full.trim() + "\n");
writeFileSync(join(ROOT, "zoekindex.json"), JSON.stringify(index, null, 1) + "\n");

const kb = (s) => `${Math.round(Buffer.byteLength(s) / 1024)} kB`;
console.log(`Klaar: ${Object.keys(pages).length} pagina's, ${projects.length} projecten, ${posts.length} blogberichten.`);
console.log(`llms.txt ${kb(llms)} · llms-full.txt ${kb(full)} (${woorden(full)} woorden) · zoekindex.json ${kb(JSON.stringify(index, null, 1))}`);
