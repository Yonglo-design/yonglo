// Gegevens voor de regiopagina's (werkgebied). Wix bouwt deze pagina's op de server op met de CMS-collecties
// LandingNl, LandingBe, LandingEurope en LandingCities, dus de volledige tekst en SEO-tags staan in de HTML.
// Opmaak: assets/regio.js; pagina: src/components/RegioPagina.astro.
import type { AstroGlobal } from "astro";
import { fetchWithAuth } from "@wix/sdk/context";
import { SOORTEN, PROVINCIES, REGIO_ALIASES, slugify, regioUrl, paginaNl, paginaLand, paginaStad, overzicht, overzichtKop } from "../assets/regio.js";
import { img, inTaal } from "../assets/projecten.js";
import { siteOrigin, deelbeeld } from "./paginas";

type Soort = "nl" | "be" | "land" | "stad";

async function alles(dataCollectionId: string) {
  const all: any[] = [];
  let cursor: string | null = null;
  do {
    const res = await fetchWithAuth("https://www.wixapis.com/wix-data/v2/items/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataCollectionId, query: { cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 } } }),
    });
    if (!res.ok) throw new Error(`Wix Data ${dataCollectionId}: ${res.status} ${await res.text()}`);
    const d: any = await res.json();
    all.push(...(d?.dataItems ?? []).map((x: any) => x.data));
    cursor = d?.pagingMetadata?.cursors?.next ?? null;
  } while (cursor);
  return all.filter((x) => x.slug);
}
const naam = (soort: Soort, x: any) => String(SOORTEN[soort].naam(x) || "");
const sorteer = (soort: Soort, l: any[]) => l.slice().sort((a, b) => naam(soort, a).localeCompare(naam(soort, b), "nl"));
const ld = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
const trimTo = (s: string, n: number) => {
  s = String(s || "").replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, "") + "…";
};

export type RegioData = {
  redirect?: string;
  en: boolean;
  ok: boolean;
  failed: boolean;
  html: string;
  title: string;
  desc: string;
  url: string;
  ogImg: string | null;
  keywords: string;
  jsonld: string[];
};

// Uitgelichte projecten (CMS "Projecten", veld "uitgelicht"), voor het blok "Een greep uit ons werk".
async function uitgelicht(en: boolean) {
  const ps = await alles("Projecten").catch(() => []);
  const goed = ps.filter((p) => p.title && p.slug && (p.portfolioImage || p.hoofdbeeld));
  const top = goed.filter((p) => p.uitgelicht).sort((a, b) => (a.volgorde ?? 999) - (b.volgorde ?? 999));
  return (top.length >= 3 ? top : goed).slice(0, 3).map((p) => inTaal(p, en ? "en" : "nl"));
}

export async function laadRegio(Astro: AstroGlobal, soort: Soort): Promise<RegioData> {
  const def = SOORTEN[soort];
  const en = def.taal === "en";
  const origin = siteOrigin(Astro.request, Astro.url);
  const leeg: RegioData = { en, ok: false, failed: false, html: "", title: "", desc: "", url: "", ogImg: null, keywords: "", jsonld: [] };
  const param = decodeURIComponent(String(Astro.params.slug || ""));

  let lijst: any[] = [];
  try {
    lijst = sorteer(soort, await alles(def.collectie));
  } catch (err) {
    console.error(err);
    Astro.response.status = 503;
    return { ...leeg, failed: true, title: en ? "Page could not be loaded | Yonglo" : "Pagina kon niet worden geladen | Yonglo" };
  }
  const x = lijst.find((y) => y.slug === param);
  if (!x) {
    // Oude schrijfwijze (hoofdletters, accenten, spaties): door naar het juiste adres.
    const alt = lijst.find((y) => y.slug === slugify(param) || y.slug === (REGIO_ALIASES as Record<string, string>)[param.toLowerCase()]);
    if (alt) return { ...leeg, redirect: regioUrl(soort, alt) };
    Astro.response.status = 404;
    return { ...leeg, title: en ? "Page not found | Yonglo" : "Pagina niet gevonden | Yonglo" };
  }

  const pj = await uitgelicht(en);
  const plaats = naam(soort, x);
  // "Ook actief in": in Nederland eerst de provincies, dan de andere plaatsen.
  let anderen = lijst.filter((y) => y.slug !== x.slug);
  if (soort === "nl") anderen = [...anderen.filter((y) => PROVINCIES.has(y.slug)), ...anderen.filter((y) => !PROVINCIES.has(y.slug))];
  const html = soort === "land" ? paginaLand(x, { projecten: pj, anderen })
    : soort === "stad" ? paginaStad(x, { projecten: pj, anderen: anderen.slice(0, 40) })
    : paginaNl(x, soort, { projecten: pj, anderen });

  const url = origin + regioUrl(soort, x);
  const title = soort === "land" ? `Wix expert in ${plaats}: design, development & SEO | Yonglo`
    : soort === "stad" ? `Wix expert in ${plaats}: web design & development | Yonglo`
    : `Wix-website laten maken in ${plaats} | Wix Expert Yonglo`;
  const desc = trimTo(
    soort === "land" ? x.introTekst1
      // De introtekst van een stad is voor elke stad dezelfde (met de plaatsnaam pas na 140 tekens): eigen omschrijving.
      : soort === "stad" ? `Looking for a Wix expert in ${plaats}? Yonglo, official Wix Partner, builds SEO-friendly Wix and Wix Studio websites for companies in ${plaats}.`
      : def.u ? `Op zoek naar een Wix-specialist in ${plaats}? Yonglo is officieel Wix Partner en bouwt professionele, SEO-geoptimaliseerde Wix- en Wix Studio-websites voor ondernemers in ${plaats} en omgeving.`
      : `Op zoek naar een Wix-specialist in ${plaats}? Yonglo is officieel Wix Partner en bouwt professionele, SEO-geoptimaliseerde Wix- en Wix Studio-websites voor ondernemers in ${plaats} en omgeving.`,
    158);
  // Deelafbeelding uit het CMS (veld socialShare); zonder: de algemene van het werkgebied (tools/maak-deelbeelden.mjs).
  const ogImg = x.socialShare ? img(x.socialShare, 1200, 630, "c") : deelbeeld(origin, en ? "en-werkgebied" : "werkgebied");
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    url,
    name: en ? `Wix web design in ${plaats}` : `Wix-website laten maken in ${plaats}`,
    serviceType: en ? "Wix web design, development and SEO" : "Wix webdesign, development en SEO",
    description: desc,
    inLanguage: en ? "en" : "nl-NL",
    areaServed: { "@type": soort === "land" ? "Country" : PROVINCIES.has(x.slug) ? "State" : "City", name: plaats },
    provider: { "@type": "ProfessionalService", "@id": "https://www.yonglo.com/#organization", name: "Yonglo", url: "https://www.yonglo.com" },
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${origin}${en ? "/en" : "/"}` },
      { "@type": "ListItem", position: 2, name: en ? "Regions" : "Werkgebied", item: `${origin}${en ? "/wix-expert" : "/wix-website"}` },
      { "@type": "ListItem", position: 3, name: plaats, item: url },
    ],
  };
  return { ...leeg, ok: true, html, title, desc, url, ogImg, keywords: x.keywords || "", jsonld: [ld(service), ld(crumbs)] };
}

// Overzicht: /wix-website (Nederland en België) en /wix-expert (Europa, Engels).
export async function laadOverzicht(Astro: AstroGlobal, en: boolean): Promise<RegioData> {
  const origin = siteOrigin(Astro.request, Astro.url);
  const leeg: RegioData = { en, ok: false, failed: false, html: "", title: "", desc: "", url: "", ogImg: null, keywords: "", jsonld: [] };
  try {
    const soorten: Soort[] = en ? ["land", "stad"] : ["nl", "be"];
    const [a, b] = await Promise.all(soorten.map((s) => alles(SOORTEN[s].collectie).then((l) => sorteer(s, l))));
    const groepen = en
      ? [{ titel: "<em>Countries</em>", items: a.map((x) => [naam("land", x), regioUrl("land", x)]) }, { titel: "<em>Cities</em>", items: b.map((x) => [naam("stad", x), regioUrl("stad", x)]) }]
      : [
        { titel: "<em>Provincies</em>", items: a.filter((x) => PROVINCIES.has(x.slug)).map((x) => [x.title, regioUrl("nl", x)]) },
        { titel: "Steden in <em>Nederland</em>", items: a.filter((x) => !PROVINCIES.has(x.slug)).map((x) => [x.title, regioUrl("nl", x)]) },
        { titel: "Steden in <em>België</em>", items: b.map((x) => [x.title, regioUrl("be", x)]) },
      ];
    const aantal = a.length + b.length;
    const url = origin + (en ? "/wix-expert" : "/wix-website");
    return {
      ...leeg, ok: true, url, ogImg: deelbeeld(origin, en ? "en-werkgebied" : "werkgebied"),
      html: overzichtKop({ en, aantal }) + "\n" + overzicht({ en, groepen }),
      title: en ? "Wix web design across Europe: all regions | Yonglo" : "Werkgebied: Wix-websites in heel Nederland en België | Yonglo",
      desc: en ? "Yonglo designs, builds and optimises Wix and Wix Studio websites for businesses across Europe. Find your country or city." : "Yonglo bouwt Wix- en Wix Studio-websites voor ondernemers in heel Nederland en België. Bekijk ons werkgebied: alle provincies en steden.",
      jsonld: [ld({ "@context": "https://schema.org", "@type": "CollectionPage", url, name: en ? "Regions" : "Werkgebied", isPartOf: { "@type": "WebSite", url: origin } })],
    };
  } catch (err) {
    console.error(err);
    Astro.response.status = 503;
    return { ...leeg, failed: true, title: "Yonglo" };
  }
}
