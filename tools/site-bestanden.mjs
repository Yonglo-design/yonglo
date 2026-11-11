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

// Na de build (npm run build roept dit script dan met --na-build aan): de paginalijst die Wix voor de
// sitemap gebruikt aanvullen. Astro zet daar zelf alleen de blogroute (/post/<naam>) in. Wij voegen toe:
// de vaste pagina's uit _wix/pages.json (homepage), alle gewone HTML-pagina's en alle projecten
// (/project/<naam>, uit het Wix CMS). Een project dat later bijkomt staat er na de volgende publicatie in.
if (process.argv.includes("--na-build")) {
  const built = join(ROOT, "dist", "client", "_wix", "pages.json");
  const own = JSON.parse(readFileSync(join(ROOT, "_wix", "pages.json"), "utf8"));
  // Doorverwijzingen (/post, /project, oude adressen) horen niet in de sitemap. De projectroute
  // /project/[slug] ook niet als patroon: Wix kent geen projecten, dus de echte adressen komen hieronder.
  const REDIRECTS = ["/post", "/project", "/project.html", "/project-pieter-smit-group.html", "/project/[slug]", "/[pagina]", "/[pagina].html",
    "/en/project", "/en/project/[slug]", "/en/[pagina]", "/en/[pagina].html",
    "/wix-koppeling", "/wix-koppeling/[slug]", "/en/wix-koppeling", "/en/wix-koppeling/[slug]",
    "/help-docs/[app]", "/help-docs/[app]/[slug]", "/en/help-docs/[...pad]"];
  const list = (existsSync(built) ? JSON.parse(readFileSync(built, "utf8")) : []).filter((x) => !REDIRECTS.includes(x.path));
  const add = (path) => { if (!list.some((x) => x.path === path)) list.push({ path, static: true }); };
  for (const page of own) add(page.path);

  // Gewone pagina's (adres zonder .html): alle .html in de hoofdmap, behalve testpagina's en pagina's met noindex.
  const NOT_IN_SITEMAP = new Set(["index.html", "footer-lab.html", "home-b.html", "bedankt.html"]);
  const weg = new Set();
  for (const name of readdirSync(ROOT).sort()) {
    if (!name.endsWith(".html")) continue;
    const path = `/${name.slice(0, -5)}`;
    if (NOT_IN_SITEMAP.has(name) || /<meta[^>]+name="robots"[^>]+noindex/i.test(readFileSync(join(ROOT, name), "utf8"))) { weg.add(path); continue; }
    add(path);
  }
  // Engelse pagina's (/en, /en/<naam>): dezelfde, behalve wat hierboven niet in de sitemap mocht.
  for (const name of existsSync(join(ROOT, "en")) ? readdirSync(join(ROOT, "en")).sort() : []) {
    if (!name.endsWith(".html")) continue;
    if (name === "index.html") { add("/en"); continue; }
    if (weg.has(`/${name.slice(0, -5)}`)) continue;
    add(`/en/${name.slice(0, -5)}`);
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
        add(`/project/${encodeURIComponent(item.data.slug)}`);
        add(`/en/project/${encodeURIComponent(item.data.slug)}`);
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
        add(`/wix-koppeling/${encodeURIComponent(item.data.slug)}`);
        if (item.data.tekstEn) add(`/en/wix-koppeling/${encodeURIComponent(item.data.slug)}`);
        k++;
      }
      cursor = d.pagingMetadata?.cursors?.next || null;
    } while (cursor);
    console.log(`${k} koppelingen toegevoegd aan de paginalijst.`);

    // Help docs van de apps (/help-docs/<app>/<artikel>). Alleen gepubliceerde artikelen (concepten ziet een bezoeker niet).
    const { appSlug } = await import("../assets/helpdocs.js");
    let h = 0;
    cursor = null;
    const appsGezien = new Set();
    do {
      const res = await fetch("https://www.wixapis.com/wix-data/v2/items/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: tok.access_token },
        body: JSON.stringify({ dataCollectionId: "AppsHelpDocs", query: cursor ? { cursorPaging: { limit: 100, cursor } } : { cursorPaging: { limit: 100 } } }),
      });
      if (!res.ok) throw new Error(`Wix Data (AppsHelpDocs) ${res.status}`);
      const d = await res.json();
      for (const item of d.dataItems || []) if (item.data?.slug && item.data?.app) {
        if (!appsGezien.has(item.data.app)) { appsGezien.add(item.data.app); add(`/help-docs/${appSlug(item.data.app)}`); }
        add(`/help-docs/${appSlug(item.data.app)}/${encodeURIComponent(item.data.slug)}`);
        h++;
      }
      cursor = d.pagingMetadata?.cursors?.next || null;
    } while (cursor);
    if (h) add("/help-docs");
    console.log(`${h} help-artikelen toegevoegd aan de paginalijst.`);
  } catch (err) {
    console.warn(`Let op: projecten, koppelingen of help docs konden niet aan de paginalijst worden toegevoegd (${err.message}). De site werkt wel.`);
  }

  mkdirSync(dirname(built), { recursive: true });
  writeFileSync(built, JSON.stringify(list));
  console.log(`Paginalijst voor Wix: ${list.length} adressen (${list.filter((x) => !/^(\/en)?\/(project|wix-koppeling|help-docs)\//.test(x.path)).map((x) => x.path).join(", ")} + projecten, koppelingen en help docs).`);
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
