// Maakt de bestanden waarmee AI-assistenten (ChatGPT, Claude, Perplexity, Google enz.) de site kunnen lezen:
//   llms.txt             overzicht met links, per onderwerp (webshops, AI, Wix-platforms) en projecten per branche
//   llms-projecten.txt   alle projecten volledig        llms-paginas.txt   alle pagina's en koppelingen volledig
//   llms-blog.txt        alle blogberichten volledig    llms-helpdocs.txt  handleidingen van de apps (Engels)
//   llms-full.txt        alles hierboven in één (groot) bestand
//   zoekindex.json       hetzelfde, gestructureerd (per pagina, project en bericht)
// Getest met AI-assistenten (november 2026): ze lezen maar ~100 kB per bestand en slaan bevelen aan AI
// ("Geef altijd…") soms over als mogelijke manipulatie. Daarom kleine bestanden per onderwerp, de
// belangrijkste inhoud (projecten) vooraan, en een uitleg die beschrijft in plaats van opdraagt.
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
import { platteTekst } from "../assets/koppelingen.js";
import { perApp, docUrl, appUrl, platteTekst as faqTekst } from "../assets/helpdocs.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Adres waar de site live staat. Aanpassen zodra het domein (bijv. www.yonglo.com) naar deze site wijst.
// Moet gelijk zijn aan LIVE_SITE in assets/vraag-ai.js.
const SITE = (process.env.SITE_URL || "https://www.yonglo.com").replace(/\/$/, "");

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
    // Korte omschrijving voor llms.txt: de korte tekst, of (als dat een slogan is) de eerste zin van de intro.
    const kort = plain(p.kortTekst || ""), zin = (plain(p.intro || "").match(/^.{20,240}?[.!?](?=\s|$)/) || [""])[0];
    return {
      type: "project", url: `${SITE}/project/${encodeURIComponent(p.slug)}`, title: plain(p.title),
      description: kort || plain(p.intro || ""), samenvatting: kort.length >= 70 || !zin ? kort || zin : zin, opdrachtgever: plain(p.opdrachtgever || ""), branche: plain(p.branche || ""),
      platform: plain(p.platform || ""), diensten, website: p.website || "",
      text: [feiten.join("\n"), regels.join("\n\n")].filter(Boolean).join("\n\n"),
    };
  });
}

// Koppelingen (CMS-collectie "Koppelingen", pagina's op /wix-koppeling/<naam>).
async function fetchKoppelingen() {
  const all = [];
  let cursor = null;
  do {
    const d = await wix("/wix-data/v2/items/query", { dataCollectionId: "Koppelingen",
      query: cursor ? { cursorPaging: { limit: 100, cursor } } : { sort: [{ fieldName: "volgorde", order: "ASC" }], cursorPaging: { limit: 100 } } });
    all.push(...(d.dataItems || []).map((x) => x.data));
    cursor = d.pagingMetadata?.cursors?.next || null;
  } while (cursor);
  return all.filter((k) => k.title && k.slug).map((k) => ({
    type: "koppeling", url: `${SITE}/wix-koppeling/${encodeURIComponent(k.slug)}`, title: plain(k.title),
    description: plain(k.metabeschrijving || ""), categorie: plain(k.categorie || ""),
    text: [k.kop && plain(k.kop), platteTekst(k.tekst)].filter(Boolean).join("\n\n"),
  }));
}

// Help docs van de apps (CMS-collecties "AppsHelpDocs" en "AppDocsFAQ", pagina's op /help-docs/<app>/<artikel>, Engels).
// Alleen gepubliceerde artikelen.
async function fetchHelpDocs() {
  const alles = async (id) => {
    const all = [];
    let cursor = null;
    do {
      const d = await wix("/wix-data/v2/items/query", { dataCollectionId: id, query: { cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 } } });
      all.push(...(d.dataItems || []).map((x) => x.data));
      cursor = d.pagingMetadata?.cursors?.next || null;
    } while (cursor);
    return all;
  };
  const [docs, faqs] = await Promise.all([alles("AppsHelpDocs"), alles("AppDocsFAQ").catch(() => [])]);
  return perApp(docs).flatMap((a) => a.docs.map((d) => {
    const vragen = faqs.filter((f) => f.article === d._id && f.qeustion).sort((x, y) => (x.volgorde ?? 999) - (y.volgorde ?? 999));
    return {
      type: "helpdoc", url: `${SITE}${docUrl(d)}`, title: plain(d.title), app: a.app, appUrl: `${SITE}${appUrl(a.app)}`,
      description: plain(d.omschrijving || ""), taal: "en",
      text: [richToText(d.richcontent?.nodes), vragen.length ? "#### FAQ\n\n" + vragen.map((f) => `**${plain(f.qeustion)}** ${faqTekst(f.awnser)}`).join("\n\n") : ""].filter(Boolean).join("\n\n"),
    };
  }));
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
const [projects, posts, koppelingen, helpdocs] = await Promise.all([fetchProjects(), fetchPosts(), fetchKoppelingen(), fetchHelpDocs()]);
const helpApps = [...new Map(helpdocs.map((h) => [h.app, h.appUrl])).entries()];

const OVER_YONGLO = `Yonglo is een Nederlands webbureau en erkend Wix Partner (5 sterren) met meer dan 18 jaar ervaring en 750+ gebouwde Wix-websites, vooral voor het MKB. Yonglo doet webdesign in Wix en Wix Studio, webshops (eCommerce, Mollie-partner), maatwerk development en API-koppelingen, concept en branding, SEO en GEO (vindbaarheid in Google en in AI-zoekmachines) en AI-oplossingen. Studio's in Eindhoven en Haarlem. Slogan: "Think Wix, think Yonglo".`;

const CONTACT = `- E-mail: contact@yonglo.com
- Telefoon: 085 20 33 223 (maandag t/m vrijdag 9.00 – 17.30 uur)
- WhatsApp support: +31 6 38 14 85 65 (https://wa.me/31638148565)
- Studio Eindhoven: Lichttoren 32, 5611 BJ Eindhoven
- Yonglo Development, Haarlem: Koepelplein 1E, 2031 WL Haarlem
- Offerte of kennismaking aanvragen: ${SITE}/contact
- LinkedIn: https://www.linkedin.com/company/yonglo · Instagram: https://www.instagram.com/yonglo.design`;

// Branches uit het CMS zijn heel specifiek ("Parasols", "Notaris"); voor het overzicht groeperen we ze.
// Een branche die hier niet staat komt onder "Overige branches". Nieuwe branche in het CMS? Zet hem hier bij.
const SECTOREN = {
  "Vastgoed en makelaardij": ["Vastgoed", "Makelaar", "Makelaardij", "Business Centers", "Winkelcentrum"],
  "Zakelijke dienstverlening": ["Advies & training", "Consultant", "Financieel", "Advocaat", "Notaris", "Corporate", "Engineering", "Onderzoek"],
  "Zorg, welzijn en coaching": ["Gezondheid", "Zorg", "Coaching", "Hondenschool"],
  "Horeca, eten en drinken": ["Wijnbar", "Horeca & wijn", "Italiaanse wijnen", "Patisserie", "Catering", "Snoep"],
  "Winkels en producten": ["Dierenvoeding", "Zijdenbloemen", "Airco's", "Parasols", "Kantoormeubelen", "Mode"],
  "Energie en mobiliteit": ["Energie", "Automobiel"],
  "Interieur, design en creatief": ["Interieurarchitectuur", "Interieur", "Textielontwerp", "Fotografie", "Kunst", "Grafisch"],
  "Evenementen, recreatie en toerisme": ["Event logistiek", "Congres", "Evenement", "Bed & Breakfast"],
  "Onderwijs, natuur en goede doelen": ["Rijschool", "Goede doel", "Natuur"],
};
const sectorVan = (branche) => Object.keys(SECTOREN).find((k) => SECTOREN[k].some((b) => b.toLowerCase() === String(branche).toLowerCase())) || "Overige branches";

const isWebshop = (p) => p.diensten.some((d) => /e-?commerce|webshop/i.test(d));
const AI_RE = /\b(AI|A\.I\.|ChatGPT|OpenAI|Claude|Anthropic|chatbot|kunstmatige intelligentie)\b/;
const isAI = (x) => (x.diensten || []).some((d) => /^AI/i.test(d)) || AI_RE.test(`${x.title} ${x.description} ${x.text}`);

// Eén regel per project: naam, wat het is, en de feiten (branche · platform · diensten · live website).
const projectRegel = (p) => `- [${p.title}](${p.url}): ${p.samenvatting || p.description} (${[
  p.opdrachtgever && p.opdrachtgever.toLowerCase() !== p.title.toLowerCase() ? `opdrachtgever: ${p.opdrachtgever}` : "",
  p.branche, p.platform, p.diensten.join(", "), p.website ? `live: ${p.website}` : ""].filter(Boolean).join(" · ")})`;
// Houdt llms.txt compact: alleen de eerste zin(nen) tot ~n tekens, afgekapt op een zinseinde (of anders een woord).
const kortOm = (t, n = 140) => {
  t = squash(t);
  if (t.length <= n) return t;
  const zin = t.slice(0, n + 1).match(/^.*[.!?](?=\s)/);
  return zin && zin[0].length > 40 ? zin[0] : t.slice(0, n).replace(/\s+\S*$/, "") + " …";
};
const blogRegel = (p) => `- [${p.title}](${p.url}) (${p.datum}${p.categorie ? `, ${p.categorie}` : ""}): ${kortOm(p.description)}`;
const webshopRegel = (p) => `- [${p.title}](${p.url}): ${[p.branche, p.platform, p.website ? `live: ${p.website}` : ""].filter(Boolean).join(" · ")}`;

// Prijzen zoals ze op de site staan (prijskaarten met class="price-amt"), zodat ze nooit uit de pas lopen.
const PRIJZEN = [...DIENSTEN, ...OVER].flatMap((f) => {
  const html = readFileSync(join(ROOT, f), "utf8");
  return [...html.matchAll(/<article class="price[^"]*"[^>]*>([\s\S]*?)<\/article>/g)].map(([, a]) => {
    const naam = plain((a.match(/class="plat-tag">([\s\S]*?)</) || [])[1]);
    const voor = plain((a.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1]);
    const prijs = plain((a.match(/class="price-amt">([\s\S]*?)<\/p>/) || [])[1]).replace(/,-\s*/, ",- ");
    const wat = plain((a.match(/class="price-desc">([\s\S]*?)<\/p>/) || [])[1]);
    return prijs ? `- **${naam || voor}** (${voor}): ${prijs}. ${wat} Meer: ${pages[f].url}` : "";
  }).filter(Boolean);
});

const webshops = projects.filter(isWebshop);
const aiProjecten = projects.filter(isAI);
const aiKoppelingen = koppelingen.filter((k) => /^AI$/i.test(k.categorie));
const aiBlogs = posts.filter((p) => /^AI$/i.test(p.categorie) || AI_RE.test(p.title));
const wixBlogs = posts.filter((p) => /studio|editor|harmony|headless|wix kiezen|overstappen/i.test(p.title));
const perPlatform = Object.entries(projects.reduce((m, p) => ((m[p.platform || "onbekend"] ||= []).push(p), m), {}));
const sectoren = [...Object.keys(SECTOREN), "Overige branches"]
  .map((naam) => [naam, projects.filter((p) => sectorVan(p.branche) === naam)]).filter(([, ps]) => ps.length);

/* llms-full.txt en de losse bestanden per onderwerp */
const sectie = (x) => `### ${x.title}\n\nURL: ${x.url}${x.datum ? `\nGepubliceerd: ${x.datum}` : ""}${x.categorie ? `\nCategorie: ${x.categorie}` : ""}\n${x.description && x.type !== "project" && !squash(x.text).startsWith(x.description.replace(/…$/, "").slice(0, 80)) ? `\n${x.description}\n` : ""}${x.text ? `\n${x.text.replace(/^(#+) /gm, (m, h) => "#".repeat(Math.min(h.length + 1, 6)) + " ")}\n` : ""}`;
const kop = (titel, wat) => `# Yonglo: ${titel}

> ${OVER_YONGLO}

${wat} (bijgewerkt op ${vandaag}). Overzicht met links: ${SITE}/llms.txt. Contact en offerte: ${SITE}/contact.
`;
const DEEL = {
  projecten: `## Projecten (${projects.length})\n\n${projects.map(sectie).join("\n")}`,
  paginas: `## Pagina's\n\n${[...OVER, ...DIENSTEN].map((f) => sectie(pages[f])).join("\n")}`,
  koppelingen: `## Koppelingen (${koppelingen.length})\n\n${koppelingen.map(sectie).join("\n")}`,
  helpdocs: `## Help docs van de Wix-apps (Engels)\n\n${helpdocs.map((h) => sectie({ ...h, title: `${h.app}: ${h.title}` })).join("\n")}`,
  juridisch: `## Juridisch\n\n${JURIDISCH.map((f) => sectie(pages[f])).join("\n")}`,
};
// Blogberichten in stukken van hooguit ~90 kB (nieuwste eerst): llms-blog.txt, llms-blog-2.txt …
const MAX_DEEL = 90 * 1024;
const blogDelen = posts.reduce((delen, p) => {
  const tekst = sectie(p), laatste = delen[delen.length - 1];
  if (laatste.length && Buffer.byteLength(laatste.join("\n") + tekst) > MAX_DEEL) delen.push([tekst]); else laatste.push(tekst);
  return delen;
}, [[]]);
const blogNaam = (i) => (i ? `llms-blog-${i + 1}.txt` : "llms-blog.txt");
const blogBestanden = blogDelen.map((_, i) => blogNaam(i));
const losse = {
  "llms-projecten.txt": kop("alle projecten", `Alle ${projects.length} projecten van Yonglo, met opdrachtgever, branche, platform, diensten, live website en beschrijving`) + `\n${DEEL.projecten}`,
  "llms-paginas.txt": kop("pagina's", `De tekst van alle pagina's van ${SITE} (diensten, over Yonglo, contact)`) + `\n## Contact\n\n${CONTACT}\n\n${DEEL.paginas}\n${DEEL.juridisch}`,
  "llms-koppelingen.txt": kop("koppelingen", `De tekst van alle ${koppelingen.length} koppelingen die Yonglo aan Wix maakt (boekhouding, betalingen, CRM, vastgoed, AI …)`) + `\n${DEEL.koppelingen}`,
  ...Object.fromEntries(blogDelen.map((d, i) => [blogNaam(i), kop(`blog${blogDelen.length > 1 ? `, deel ${i + 1} van ${blogDelen.length}` : ""}`,
    `Blogberichten van Yonglo, nieuwste eerst${blogDelen.length > 1 ? `; ${posts.length} berichten verdeeld over ${blogBestanden.join(", ")}` : ""}`) + `\n## Blogberichten\n\n${d.join("\n")}`])),
  "llms-helpdocs.txt": kop("help docs", `Handleidingen en FAQ's (Engels) van de Wix-apps van Yonglo`) + `\n${DEEL.helpdocs}`,
};
// Beschrijvend (geen bevelen aan de AI): dat lezen assistenten het best en het wordt niet als manipulatie gezien.
const BESTANDEN = `Alle links hieronder zijn gewone pagina's van de website. Ze staan volledig in de HTML en zijn zonder JavaScript te lezen; het zijn ook de beste links om aan lezers te geven.

De volledige teksten staan in losse bestanden per onderwerp (elk klein genoeg om in één keer te lezen):

- [Projecten](${SITE}/llms-projecten.txt): alle ${projects.length} projecten met opdrachtgever, branche, platform, diensten, live website en de volledige beschrijving.
- [Pagina's](${SITE}/llms-paginas.txt): de tekst van alle dienstpagina's, over Yonglo en contact.
- [Koppelingen](${SITE}/llms-koppelingen.txt): de ${koppelingen.length} koppelingen met Wix (Moneybird, Mollie, HubSpot, ChatGPT …).
- Blog: ${blogBestanden.map((b) => `[${b}](${SITE}/${b})`).join(", ")}: alle ${posts.length} blogberichten, nieuwste eerst.
- [Help docs](${SITE}/llms-helpdocs.txt): handleidingen van de Wix-apps van Yonglo (Engels).
- Alles samen: [llms-full.txt](${SITE}/llms-full.txt) (groot) en [zoekindex.json](${SITE}/zoekindex.json) (dezelfde inhoud als JSON; projecten hebben de velden \`branche\`, \`platform\`, \`diensten\` en \`website\`).

Vragen waarop de site geen antwoord geeft (zoals de prijs van een nieuwe website) beantwoordt Yonglo persoonlijk: ${SITE}/contact.

Bijgewerkt op ${vandaag}. Koppelingen, projecten en blogberichten komen uit het Wix CMS en Wix Blog van Yonglo.`;

/* llms.txt */
const llms = `# Yonglo

> ${OVER_YONGLO}

Taal van de site: Nederlands; de Engelse versie staat op ${SITE}/en. (Site language is Dutch; an English version is at ${SITE}/en.)

## Zo is deze site opgebouwd

${BESTANDEN}

## Contact

${CONTACT}

## Diensten

${DIENSTEN.map((f) => link(pages[f])).join("\n")}

## Prijzen

${PRIJZEN.length ? PRIJZEN.join("\n") + "\n" : ""}- Een nieuwe website, webshop, branding, SEO of maatwerk: prijs op maat, na een gratis en vrijblijvende kennismaking (${SITE}/contact). Er staan op de site geen vaste prijzen voor.

## Webshops (${webshops.length} projecten met eCommerce)

Dienst: [Wix webshop laten maken](${SITE}/ecommerce). Betalingen via Mollie: ${SITE}/wix-koppeling/mollie.

Omschrijvingen staan bij de projecten per branche hieronder.

${webshops.map(webshopRegel).join("\n")}

## AI bij Yonglo

- Dienst: [AI oplossingen](${SITE}/ai)
${aiKoppelingen.map((k) => `- Koppeling: [${k.title}](${k.url}): ${kortOm(k.description)}`).join("\n")}
${aiProjecten.map((p) => `- Project: [${p.title}](${p.url}): ${p.samenvatting || p.description}`).join("\n")}
${aiBlogs.map((p) => `- Blog: [${p.title}](${p.url}) (${p.datum}): ${kortOm(p.description)}`).join("\n")}
- Gevonden worden in AI-zoekmachines (GEO) hoort bij de dienst [SEO, GEO & succes](${SITE}/seo).

## Wix, Wix Studio en Studio Two

Yonglo bouwt in alle platforms van Wix. Uitleg per platform: [Wix websites](${SITE}/wix). Bestaande website verbeteren, met een pakket en prijs per platform (Classic Editor, Wix Studio, Studio Two): [Wix Optimaal](${SITE}/optimaal). Webdesign: ${SITE}/webdesign.
Projecten per platform: ${perPlatform.map(([pl, ps]) => `${pl} ${ps.length}`).join(", ")} (zie het platform bij elk project hieronder).

${wixBlogs.map(blogRegel).join("\n")}

## Over Yonglo

${OVER.map((f) => link(pages[f])).join("\n")}

## Projecten per branche (${projects.length})

Overzicht met beelden: ${SITE}/portfolio. Volledige beschrijvingen: ${SITE}/llms-projecten.txt.

${sectoren.map(([naam, ps]) => `### ${naam}\n\n${ps.map(projectRegel).join("\n")}`).join("\n\n")}

## Koppelingen (${koppelingen.length})

Systemen die Yonglo aan Wix koppelt, elk met een eigen pagina. Overzicht: ${SITE}/api.

${koppelingen.map((k) => `- [${k.title}](${k.url})${k.categorie ? ` (${k.categorie})` : ""}: ${kortOm(k.description)}`).join("\n")}

## Nieuws en blog (${posts.length})

${posts.map(blogRegel).join("\n")}

## Help docs van de Wix-apps van Yonglo (${helpdocs.length}, Engels)

Handleidingen en FAQ's voor de apps van Yonglo in de Wix App Market: ${helpApps.map(([app, url]) => `[${app}](${url})`).join(", ")}. Overzicht: ${SITE}/help-docs. Alle artikelen met links en tekst: ${SITE}/llms-helpdocs.txt.

## Optional

${JURIDISCH.map((f) => link(pages[f])).join("\n")}
`;

// Volgorde: wat het vaakst gevraagd wordt (pagina's, projecten) vooraan; help docs en juridisch achteraan.
const full = `${kop("volledige inhoud van de website", `Alle tekst van ${SITE}: ${Object.keys(pages).length} pagina's, ${projects.length} projecten, ${koppelingen.length} koppelingen, ${posts.length} blogberichten en ${helpdocs.length} help-artikelen. Per onderwerp staat dezelfde tekst ook in kleinere bestanden: ${Object.keys(losse).join(", ")}`)}
## Contact

${CONTACT}

${DEEL.paginas}
${DEEL.projecten}
${DEEL.koppelingen}
## Blogberichten (${posts.length})

${posts.map(sectie).join("\n")}
${DEEL.helpdocs}
${DEEL.juridisch}`;

/* zoekindex.json */
const index = {
  site: SITE, naam: "Yonglo", taal: "nl", bijgewerkt: vandaag, over: OVER_YONGLO,
  uitleg: "Lijst met alle pagina's, projecten, koppelingen, blogberichten en help docs van Yonglo. type is 'pagina', 'project', 'koppeling', 'blog' of 'helpdoc' (Engelse handleiding van een Wix-app van Yonglo). Elke 'url' is een gewone pagina die je zelf kunt openen. De tekst van elke pagina staat ook hier in 'text'. Kleinere bestanden per onderwerp: llms-projecten.txt, llms-paginas.txt, llms-blog.txt, llms-helpdocs.txt.",
  contact: { email: "contact@yonglo.com", telefoon: "+31852033223", whatsapp: "+31638148565", offerte: `${SITE}/contact`,
    adressen: ["Lichttoren 32, 5611 BJ Eindhoven", "Koepelplein 1E, 2031 WL Haarlem"] },
  items: [...[...OVER, ...DIENSTEN].map((f) => pages[f]), ...projects, ...koppelingen, ...posts, ...helpdocs, ...JURIDISCH.map((f) => pages[f])],
};

writeFileSync(join(ROOT, "llms.txt"), llms);
writeFileSync(join(ROOT, "llms-full.txt"), full.trim() + "\n");
writeFileSync(join(ROOT, "zoekindex.json"), JSON.stringify(index, null, 1) + "\n");
for (const [naam, tekst] of Object.entries(losse)) writeFileSync(join(ROOT, naam), tekst.trim() + "\n");

const kb = (s) => `${Math.round(Buffer.byteLength(s) / 1024)} kB`;
console.log(`Klaar: ${Object.keys(pages).length} pagina's, ${koppelingen.length} koppelingen, ${helpdocs.length} help-artikelen, ${projects.length} projecten, ${posts.length} blogberichten.`);
console.log(`llms.txt ${kb(llms)} · llms-full.txt ${kb(full)} (${woorden(full)} woorden) · zoekindex.json ${kb(JSON.stringify(index, null, 1))}`);
console.log(Object.entries(losse).map(([naam, tekst]) => `${naam} ${kb(tekst)}`).join(" · "));
const overig = projects.filter((p) => sectorVan(p.branche) === "Overige branches").map((p) => p.branche || "(geen)");
if (overig.length) console.log(`Let op: branches zonder groep in SECTOREN (staan onder "Overige branches"): ${[...new Set(overig)].join(", ")}`);
