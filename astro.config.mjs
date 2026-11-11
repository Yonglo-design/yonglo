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

// Adressen van de oude Wix-site www.yonglo.com die nu een andere naam hebben (blijvende doorverwijzing).
const OUDE_ADRESSEN = {
  "/expertise": "/", "/service": "/", "/wix-studio": "/wix",
  "/wix-development": "/development", "/wix-optimaal": "/optimaal", "/wix-seo": "/seo", "/wix-blog-schrijven": "/seo",
  "/wix-webshop": "/ecommerce", "/wix-koppelingen": "/api",
  // losse oude pagina's
  "/algemene-voorwaarden": "/voorwaarden", "/privacy": "/privacybeleid", "/faq": "/contact#faq", "/goede-vraag": "/contact",
  "/klantgegevens": "/contact", "/bedankt-aanvraag": "/", "/bedankt-seo-aanvraag": "/seo", "/welkom": "/", "/jorisborgers": "/over-yonglo",
  "/vacatures": "/over-yonglo", "/vacature-aanvraag": "/over-yonglo", "/project-addesign": "/project/ad-design-studio",
  "/project-burgstate": "/project/burgstate", "/project-mankind": "/project/mankind-coach", "/project-pawy": "/project/pawy",
  "/project-rewild": "/portfolio", "/wix-europe": "/wix-expert",
  "/post/slimme-online-oplossingen-voor-wix": "/post/online-oplossingen-voor-wix", "/post/yonglo-ontwikkelt-outdoor-boekingsplatform-rewild-be": "/nieuws",
  // oude Engelse versies (de vorige site was meertalig via Wix)
  "/en/algemene-voorwaarden": "/en/voorwaarden", "/en/privacy": "/en/privacybeleid", "/en/faq": "/en/contact#faq",
  "/en/klantgegevens": "/en/contact", "/en/bedankt-aanvraag": "/en", "/en/expertise": "/en", "/en/service": "/en",
  "/en/jorisborgers": "/en/over-yonglo", "/en/vacatures": "/en/over-yonglo", "/en/project-addesign": "/en/project/ad-design-studio",
  "/en/project-burgstate": "/en/project/burgstate", "/en/project-mankind": "/en/project/mankind-coach", "/en/project-pawy": "/en/project/pawy",
  "/en/project-rewild": "/en/portfolio", "/en/wix-blog-schrijven": "/en/seo", "/en/wix-development": "/en/development",
  "/en/wix-europe": "/wix-expert", "/en/wix-optimaal": "/en/optimaal", "/en/wix-seo": "/en/seo", "/en/wix-studio": "/en/wix",
  "/en/wix-webshop": "/en/ecommerce",
};

export default defineConfig({
  redirects: Object.fromEntries(Object.entries(OUDE_ADRESSEN).map(([van, naar]) => [van, { status: 301, destination: naar }])),
  vite: { define: { __PAGINAS__: JSON.stringify(PAGINAS) } },
  publicDir: "./.site",
  integrations: [wix(), wixPages()],
  security: { checkOrigin: false },
  adapter: wixHostingAdapter(),
  image: { domains: ["static.wixstatic.com"] },
  output: "server",
});
