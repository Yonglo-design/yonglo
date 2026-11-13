#!/usr/bin/env node
// Zet de websitebestanden klaar voor de Astro-build (npm run build / npm run dev).
// De pagina's blijven in de hoofdmap staan (zo blijft alles werken zoals altijd); dit script kopieert
// ze naar .site/, de map die Astro als "public" gebruikt. Daarnaast schrijft het .env.local als die
// ontbreekt (alleen openbare waarden; Wix vult de echte bij het publiceren in).
// Dit bestand hoort niet bij de website en wordt niet geüpload.
import { cpSync, rmSync, mkdirSync, readdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".site");

// Wat NIET bij de website hoort.
const SKIP = new Set([
  ".git", ".github", ".claude", ".agents", ".astro", ".wix", ".site", ".vscode", "node_modules", "dist", "src", "tools", "_wix",
  "CLAUDE.md", "README.md", "AGENTS.md", ".gitignore", "package.json", "package-lock.json", "astro.config.mjs",
  "tsconfig.json", "wix.config.json", ".DS_Store",
]);
const skip = (name) => SKIP.has(name) || name.startsWith(".env") || name.endsWith(".zip") || name.endsWith(".log");



// Preview (npm run dev): houd .site/ bij terwijl de preview draait, zodat een aangepast bestand meteen
// zichtbaar is. Draait los op de achtergrond en stopt vanzelf als de preview (poort 4321) weg is.
if (process.argv.includes("--bijhouden")) {
  const { watch, copyFileSync, statSync } = await import("node:fs");
  watch(ROOT, { recursive: true }, (_event, rel) => {
    if (!rel) return;
    const parts = rel.split(/[\\/]/);
    if (skip(parts[0]) || parts.some((p) => p === ".DS_Store")) return;
    // Gewone pagina's (ook index.html en de Engelse in en/) toont Astro zelf (src/pages/[pagina].astro …).
    if (parts.length === 1 && rel.endsWith(".html")) return;
    if (parts[0] === "en" && rel.endsWith(".html")) return;
    const src = join(ROOT, rel), dst = join(OUT, rel);
    try {
      if (!existsSync(src)) { rmSync(dst, { recursive: true, force: true }); return; }
      if (!statSync(src).isFile()) return;
      mkdirSync(dirname(dst), { recursive: true });
      copyFileSync(src, dst);
    } catch { /* bestand was even niet leesbaar; de volgende wijziging pakt het op */ }
  });
  let misses = 0;
  setInterval(async () => {
    try { await fetch("http://localhost:4321/", { method: "HEAD" }); misses = 0; }
    catch { if (++misses >= 3) process.exit(0); }
  }, 20000);
}

// Na de build (npm run build roept dit script dan met --na-build aan): onze eigen sitemap maken,
// /sitemap-yonglo.xml, met alle gewone HTML-pagina's (ook Engels), projecten, koppelingen, help docs en
// regiopagina's, elk met de datum waarop die pagina echt is veranderd (lastmod). Een project dat later
// bijkomt staat er na de volgende publicatie in.
// Waarom een eigen sitemap: Wix maakt /sitemap.xml uit de paginalijst /_wix/pages.json, maar geeft daarin elke
// pagina de datum van de laatste publicatie. Dan lijkt elke pagina bij elke publicatie veranderd en negeert
// Google de datums helemaal. In de paginalijst van Wix blijven dus alleen de routes die Astro zelf registreert
// (homepage, /en, /portfolio, /help-docs en de blogroute voor de blog-sitemap van Wix); de rest staat alleen in onze
// sitemap. Die staat in robots.txt (eenmalig via de API van Wix gezet) en hoort in Google Search Console.
if (process.argv.includes("--na-build")) {
  const { execFileSync } = await import("node:child_process");
  const SITE = (process.env.SITE_URL || "https://www.yonglo.com").replace(/\/$/, "");
  // Laatste commit van een bestand (ISO-datum), of null als git het niet weet (nog niet opgeslagen bestand).
  const gitDatum = (file) => {
    try { return execFileSync("git", ["log", "-1", "--format=%cI", "--", file], { cwd: ROOT, encoding: "utf8" }).trim() || null; }
    catch { return null; }
  };
  const cmsDatum = (item) => item?.data?._updatedDate?.$date || item?.data?._createdDate?.$date || null;
  const nieuwste = (a, b) => (!a ? b : !b ? a : new Date(a) > new Date(b) ? a : b);
  const datums = new Map();
  const built = join(ROOT, "dist", "client", "_wix", "pages.json");
  const own = JSON.parse(readFileSync(join(ROOT, "_wix", "pages.json"), "utf8"));
  // Doorverwijzingen (/post, /project, oude adressen) horen niet in de sitemap. De projectroute
  // /project/[slug] ook niet als patroon: Wix kent geen projecten, dus de echte adressen komen hieronder.
  const REDIRECTS = ["/post", "/project", "/project.html", "/project-pieter-smit-group.html", "/project/[slug]", "/[pagina]", "/[pagina].html",
    "/en/project", "/en/project/[slug]", "/en/[pagina]", "/en/[pagina].html",
    "/wix-koppeling", "/wix-koppeling/[slug]", "/en/wix-koppeling", "/en/wix-koppeling/[slug]",
    "/help-docs/[app]", "/help-docs/[app]/[slug]", "/en/help-docs/[...pad]",
    "/wix-website/[slug]", "/wix-websites", "/wix-websites/[slug]", "/wix-expert/[slug]", "/wix-design-development", "/wix-design-development/[slug]",
    "/landing-europe/[...pad]", "/wix/[slug]", "/en/wix-website/[...pad]", "/en/wix-websites/[...pad]", "/en/wix-expert/[...pad]",
    "/en/wix-design-development/[...pad]", "/projecten/[...pad]", "/en/projecten/[...pad]", "/blog/[...pad]", "/en/blog/[...pad]", "/en/post/[...pad]"];
  const list = (existsSync(built) ? JSON.parse(readFileSync(built, "utf8")) : []).filter((x) => !REDIRECTS.includes(x.path));
  const add = (path, lastmod = null) => {
    if (!list.some((x) => x.path === path)) list.push({ path, static: true });
    datums.set(path, nieuwste(datums.get(path), lastmod));
  };
  for (const page of own) add(page.path);
  // Deze blijven in de paginalijst van Wix (die heeft ze nodig); alles wat hierna bijkomt gaat naar onze sitemap.
  const BIJ_WIX = new Set(list.map((x) => x.path));

  // Gewone pagina's (adres zonder .html): alle .html in de hoofdmap, behalve testpagina's en pagina's met noindex.
  const NOT_IN_SITEMAP = new Set(["index.html", "footer-lab.html", "home-b.html", "bedankt.html"]);
  const weg = new Set();
  for (const name of readdirSync(ROOT).sort()) {
    if (!name.endsWith(".html")) continue;
    const path = `/${name.slice(0, -5)}`;
    if (NOT_IN_SITEMAP.has(name) || /<meta[^>]+name="robots"[^>]+noindex/i.test(readFileSync(join(ROOT, name), "utf8"))) { weg.add(path); continue; }
    add(path, gitDatum(name));
  }
  // Engelse pagina's (/en, /en/<naam>): dezelfde, behalve wat hierboven niet in de sitemap mocht.
  for (const name of existsSync(join(ROOT, "en")) ? readdirSync(join(ROOT, "en")).sort() : []) {
    if (!name.endsWith(".html")) continue;
    if (name === "index.html") { add("/en", gitDatum("en/index.html")); continue; }
    if (weg.has(`/${name.slice(0, -5)}`)) continue;
    add(`/en/${name.slice(0, -5)}`, gitDatum(`en/${name}`));
  }
  for (let i = list.length - 1; i >= 0; i--) if (weg.has(list[i].path) || list[i].path.endsWith(".html")) list.splice(i, 1);

  // Projecten uit het Wix CMS (openbare bezoekerstoegang, zoals de website zelf).
  try {
    const { appId } = JSON.parse(readFileSync(join(ROOT, "wix.config.json"), "utf8"));
    const tok = await fetch("https://www.wixapis.com/oauth2/token", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: appId, grantType: "anonymous" }),
    }).then((r) => r.json());
    let cursor = null, n = 0;
    do {
      const res = await fetch("https://www.wixapis.com/wix-data/v2/items/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: tok.access_token },
        body: JSON.stringify({ dataCollectionId: "Projecten", query: cursor ? { cursorPaging: { limit: 100, cursor } } : { cursorPaging: { limit: 100 } } }),
      });
      if (!res.ok) throw new Error(`Wix Data ${res.status}`);
      const d = await res.json();
      for (const item of d.dataItems || []) if (item.data?.slug && item.data?.title) {
        add(`/project/${encodeURIComponent(item.data.slug)}`, cmsDatum(item));
        add(`/en/project/${encodeURIComponent(item.data.slug)}`, cmsDatum(item));
        n++;
      }
      cursor = d.pagingMetadata?.cursors?.next || null;
    } while (cursor);
    console.log(`${n} projecten toegevoegd aan de paginalijst.`);

    // Koppelingen (/wix-koppeling/<naam>). De Engelse versie alleen als er een Engelse tekst is
    // (zonder vertaling staat die pagina op noindex).
    let k = 0;
    cursor = null;
    do {
      const res = await fetch("https://www.wixapis.com/wix-data/v2/items/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: tok.access_token },
        body: JSON.stringify({ dataCollectionId: "Koppelingen", query: cursor ? { cursorPaging: { limit: 100, cursor } } : { cursorPaging: { limit: 100 } } }),
      });
      if (!res.ok) throw new Error(`Wix Data (Koppelingen) ${res.status}`);
      const d = await res.json();
      for (const item of d.dataItems || []) if (item.data?.slug && item.data?.title) {
        add(`/wix-koppeling/${encodeURIComponent(item.data.slug)}`, cmsDatum(item));
        if (item.data.tekstEn) add(`/en/wix-koppeling/${encodeURIComponent(item.data.slug)}`, cmsDatum(item));
        k++;
      }
      cursor = d.pagingMetadata?.cursors?.next || null;
    } while (cursor);
    console.log(`${k} koppelingen toegevoegd aan de paginalijst.`);

    // Help docs van de apps (/help-docs/<app>/<artikel>). Alleen gepubliceerde artikelen (concepten ziet een bezoeker niet).
    const { appSlug } = await import("../assets/helpdocs.js");
    let h = 0;
    cursor = null;
    do {
      const res = await fetch("https://www.wixapis.com/wix-data/v2/items/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: tok.access_token },
        body: JSON.stringify({ dataCollectionId: "AppsHelpDocs", query: cursor ? { cursorPaging: { limit: 100, cursor } } : { cursorPaging: { limit: 100 } } }),
      });
      if (!res.ok) throw new Error(`Wix Data (AppsHelpDocs) ${res.status}`);
      const d = await res.json();
      for (const item of d.dataItems || []) if (item.data?.slug && item.data?.app) {
        // Overzicht per app: de datum van het nieuwste artikel van die app.
        add(`/help-docs/${appSlug(item.data.app)}`, cmsDatum(item));
        add(`/help-docs/${appSlug(item.data.app)}/${encodeURIComponent(item.data.slug)}`, cmsDatum(item));
        h++;
      }
      cursor = d.pagingMetadata?.cursors?.next || null;
    } while (cursor);
    if (h) add("/help-docs");
    console.log(`${h} help-artikelen toegevoegd aan de paginalijst.`);

    // Regiopagina's (werkgebied): Nederland, België, Europese landen en steden.
    const REGIO = [["LandingNl", "/wix-website"], ["LandingBe", "/wix-websites"], ["LandingEurope", "/wix-expert"], ["LandingCities", "/wix-design-development"]];
    let r = 0;
    for (const [col, basis] of REGIO) {
      cursor = null;
      do {
        const res = await fetch("https://www.wixapis.com/wix-data/v2/items/query", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: tok.access_token },
          body: JSON.stringify({ dataCollectionId: col, query: cursor ? { cursorPaging: { limit: 100, cursor } } : { cursorPaging: { limit: 100 } } }),
        });
        if (!res.ok) throw new Error(`Wix Data (${col}) ${res.status}`);
        const d = await res.json();
        for (const item of d.dataItems || []) if (item.data?.slug) {
          add(`${basis}/${encodeURIComponent(item.data.slug)}`, cmsDatum(item));
          // Overzicht (/wix-website toont NL en BE, /wix-expert Europa en steden): de datum van de nieuwste plaats.
          add(basis === "/wix-websites" ? "/wix-website" : basis === "/wix-design-development" ? "/wix-expert" : basis, cmsDatum(item));
          r++;
        }
        cursor = d.pagingMetadata?.cursors?.next || null;
      } while (cursor);
    }
    add("/wix-website");
    add("/wix-expert");
    console.log(`${r} regiopagina's toegevoegd aan de paginalijst.`);
  } catch (err) {
    console.warn(`Let op: projecten, koppelingen of help docs konden niet aan de paginalijst worden toegevoegd (${err.message}). De site werkt wel.`);
  }

  // Paginalijst voor Wix: alleen wat Wix zelf nodig heeft (zie boven).
  const wixLijst = list.filter((x) => BIJ_WIX.has(x.path));
  mkdirSync(dirname(built), { recursive: true });
  writeFileSync(built, JSON.stringify(wixLijst));
  console.log(`Paginalijst voor Wix: ${wixLijst.map((x) => x.path).join(", ")}.`);

  // Onze sitemap. Zonder bekende datum (bijv. een pagina die nog niet is opgeslagen) laten we lastmod weg.
  const xml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const eigen = list.filter((x) => !BIJ_WIX.has(x.path) && !x.path.includes("[")).map((x) => x.path).sort();
  const urls = eigen.map((path) => {
    const d = datums.get(path);
    return `<url><loc>${xml(SITE + path)}</loc>${d ? `<lastmod>${new Date(d).toISOString()}</lastmod>` : ""}</url>`;
  });
  writeFileSync(join(ROOT, "dist", "client", "sitemap-yonglo.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  const zonder = eigen.filter((p) => !datums.get(p));
  console.log(`Eigen sitemap (/sitemap-yonglo.xml): ${eigen.length} adressen${zonder.length ? `, ${zonder.length} zonder datum (${zonder.slice(0, 5).join(", ")}${zonder.length > 5 ? " …" : ""})` : ""}.`);
  process.exit(0);
}

if (!process.argv.includes("--bijhouden")) {
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
let n = 0;
for (const name of readdirSync(ROOT)) {
  if (skip(name)) continue;
  cpSync(join(ROOT, name), join(OUT, name), { recursive: true, filter: (src) => !src.endsWith(".DS_Store") });
  n++;
}

// Bij een gewone upload zette Wix zelf zijn site-script in elke HTML-pagina (statistieken, cookiemelding,
// SEO-instellingen uit het dashboard). Bij een Astro-build gebeurt dat niet voor losse HTML-bestanden,
// dus zetten we het hier in de kopie in .site/ (de bestanden in de hoofdmap blijven ongewijzigd).
// De gewone pagina's (behalve index.html) staan op een adres zonder .html; die maakt Astro zelf
// (src/pages/[pagina].astro, met het site-script erin). Het losse .html-bestand mag dus niet mee, anders
// zou /webdesign.html niet doorsturen naar /webdesign.
// Ook de homepage (index.html) en de Engelse pagina's (en/) levert Astro zelf (src/pages/index.astro,
// src/pages/en/…), met het site-script en de taalversies (hreflang) erin.
for (const name of readdirSync(OUT)) if (name.endsWith(".html")) rmSync(join(OUT, name));
rmSync(join(OUT, "en"), { recursive: true, force: true });

const env = join(ROOT, ".env.local");
if (!existsSync(env)) {
  const { appId } = JSON.parse(readFileSync(join(ROOT, "wix.config.json"), "utf8"));
  writeFileSync(env, [
    "# Gemaakt door tools/site-bestanden.mjs. Geen geheimen: WIX_CLIENT_ID is de openbare client van de site;",
    "# de laatste drie vult Wix bij het publiceren zelf in (de build controleert alleen dat ze er zijn).",
    `WIX_CLIENT_ID="${appId}"`,
    'WIX_CLOUD_PROVIDER="KUBERNETES"',
    'WIX_CLIENT_INSTANCE_ID="set-at-release"',
    'WIX_CLIENT_PUBLIC_KEY="set-at-release"',
    'WIX_CLIENT_SECRET="set-at-release"',
    "",
  ].join("\n"));
}
console.log(`Websitebestanden klaargezet in .site/ (${n} onderdelen).`);

if (process.argv.includes("--met-bijhouden")) {
  const { spawn } = await import("node:child_process");
  spawn(process.execPath, [fileURLToPath(import.meta.url), "--bijhouden"], { detached: true, stdio: "ignore" }).unref();
  console.log("Wijzigingen worden bijgehouden zolang de preview draait.");
}
}
