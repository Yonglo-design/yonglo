// @ts-check
// Wix-managed Astro. De gewone pagina's (index.html, nieuws.html, assets/ …) blijven losse bestanden
// in de hoofdmap; tools/site-bestanden.mjs kopieert ze voor elke build naar .site/ (de "public"-map).
// Alleen de blogberichten (/post/<naam>) worden op de server opgebouwd: src/pages/post/[...slug].astro.
import { defineConfig } from "astro/config";
import { readdirSync } from "node:fs";
import wix from "@wix/astro";
import wixPages from "@wix/astro-pages";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

// De gewone pagina's (HTML-bestanden in de hoofdmap, behalve index.html). Ze staan op een adres zonder .html
// (src/pages/[pagina].astro); de oude .html-adressen sturen door (src/pages/[pagina].html.astro).
const PAGINAS = readdirSync(".").filter((n) => n.endsWith(".html") && n !== "index.html").map((n) => n.slice(0, -5)).sort();
// Deelafbeeldingen (assets/deel/, gemaakt door tools/maak-deelbeelden.mjs): welke er zijn, zodat de server de tags zet.
const DEELBEELDEN = readdirSync("./assets/deel").filter((n) => n.endsWith(".jpg")).map((n) => n.slice(0, -4)).sort();

// Adressen van de oude Wix-site www.yonglo.com die nu een andere naam hebben (blijvende doorverwijzing).
const OUDE_ADRESSEN = {
  "/projecten": "/portfolio", "/expertise": "/", "/service": "/", "/wix-studio": "/wix", "/wix-europe": "/wix",
  "/wix-development": "/development", "/wix-optimaal": "/optimaal", "/wix-seo": "/seo", "/wix-blog-schrijven": "/seo",
  "/wix-webshop": "/ecommerce", "/wix-koppeling": "/api", "/wix-koppelingen": "/api", "/blog": "/nieuws",
};

export default defineConfig({
  redirects: Object.fromEntries(Object.entries(OUDE_ADRESSEN).map(([van, naar]) => [van, { status: 301, destination: naar }])),
  vite: { define: { __PAGINAS__: JSON.stringify(PAGINAS), __DEELBEELDEN__: JSON.stringify(DEELBEELDEN) } },
  publicDir: "./.site",
  integrations: [wix(), wixPages()],
  security: { checkOrigin: false },
  adapter: wixHostingAdapter(),
  image: { domains: ["static.wixstatic.com"] },
  output: "server",
});
