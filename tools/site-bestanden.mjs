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

// Na de build (npm run build roept dit script dan met --na-build aan): de vaste pagina's uit
// _wix/pages.json (zoals de homepage) toevoegen aan de paginalijst die Wix voor de sitemap gebruikt.
// Astro zet daar zelf alleen de blogroute (/post/<naam>) in.
if (process.argv.includes("--na-build")) {
  const built = join(ROOT, "dist", "client", "_wix", "pages.json");
  const own = JSON.parse(readFileSync(join(ROOT, "_wix", "pages.json"), "utf8"));
  const list = existsSync(built) ? JSON.parse(readFileSync(built, "utf8")) : [];
  for (const page of own) if (!list.some((x) => x.path === page.path)) list.push(page);
  mkdirSync(dirname(built), { recursive: true });
  writeFileSync(built, JSON.stringify(list));
  console.log(`Paginalijst voor Wix: ${list.map((x) => x.path).join(", ")}`);
  process.exit(0);
}

// Wat NIET bij de website hoort.
const SKIP = new Set([
  ".git", ".github", ".claude", ".agents", ".astro", ".wix", ".site", ".vscode", "node_modules", "dist", "src", "tools", "_wix",
  "CLAUDE.md", "README.md", "AGENTS.md", ".gitignore", "package.json", "package-lock.json", "astro.config.mjs",
  "tsconfig.json", "wix.config.json", ".DS_Store",
]);
const skip = (name) => SKIP.has(name) || name.startsWith(".env") || name.endsWith(".zip") || name.endsWith(".log");

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
const { appId: clientId } = JSON.parse(readFileSync(join(ROOT, "wix.config.json"), "utf8"));
const SITE_SCRIPT = `<script id="wix-site-script" src="https://manage.wix.com/_api/headless-business-setup/v1/headless-business/site-script.js" data-client-id="${clientId}" async></script>`;
for (const name of readdirSync(OUT)) {
  if (!name.endsWith(".html")) continue;
  const file = join(OUT, name);
  const html = readFileSync(file, "utf8");
  if (html.includes('id="wix-site-script"') || !html.includes("</head>")) continue;
  writeFileSync(file, html.replace("</head>", `${SITE_SCRIPT}</head>`));
}

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
