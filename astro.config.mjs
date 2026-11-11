// @ts-check
// Wix-managed Astro. De gewone pagina's (index.html, nieuws.html, assets/ …) blijven losse bestanden
// in de hoofdmap; tools/site-bestanden.mjs kopieert ze voor elke build naar .site/ (de "public"-map).
// Alleen de blogberichten (/post/<naam>) worden op de server opgebouwd: src/pages/post/[...slug].astro.
import { defineConfig } from "astro/config";
import wix from "@wix/astro";
import wixPages from "@wix/astro-pages";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

export default defineConfig({
  publicDir: "./.site",
  integrations: [wix(), wixPages()],
  security: { checkOrigin: false },
  adapter: wixHostingAdapter(),
  image: { domains: ["static.wixstatic.com"] },
  output: "server",
});
