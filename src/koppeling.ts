// Gegevens voor een koppelingspagina (/wix-koppeling/<naam> en /en/wix-koppeling/<naam>).
// Wix bouwt die pagina op de server op met de koppeling uit de Wix CMS-collectie "Koppelingen"
// (Wix-dashboard → CMS → Koppelingen), dus de volledige inhoud en de SEO-tags staan direct in de HTML.
// De opmaak komt uit assets/koppelingen.js; de pagina zelf uit src/components/KoppelingPagina.astro.
import type { AstroGlobal } from "astro";
import { fetchWithAuth } from "@wix/sdk/context";
import { hero, body, aanpak, projecten, andere, contact, inTaal, sorteer, zoekProjecten, koppelingUrl, platteTekst, COLLECTION } from "../assets/koppelingen.js";
import { img, inTaal as projectInTaal } from "../assets/projecten.js";
import { siteOrigin } from "./paginas";

// Oude adressen van yonglo.com waarvan de naam nu iets anders is.
const ALIASES: Record<string, string> = { "e-boekhouden.nl": "e-boekhouden", "anthropic-ai-modellen-integratie": "anthropic" };

async function wixData(path: string, body: unknown) {
  const res = await fetchWithAuth(`https://www.wixapis.com/wix-data/v2/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Wix Data ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}
async function alles(dataCollectionId: string) {
  const all: any[] = [];
  let cursor: string | null = null;
  do {
    const d: any = await wixData("items/query", { dataCollectionId, query: { cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 } } });
    all.push(...(d?.dataItems ?? []).map((x: any) => x.data));
    cursor = d?.pagingMetadata?.cursors?.next ?? null;
  } while (cursor);
  return all;
}

const trimTo = (s: string, n: number) => {
  s = String(s || "").replace(/\s+/g, " ").trim();
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, "") + "…";
};
const ld = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

export type KoppelingData = {
  redirect?: string;
  en: boolean;
  k: any;
  failed: boolean;
  html: string;
  title: string;
  desc: string;
  url: string;
  canonical: string;
  noindex: boolean;
  hreflang: { lang: string; href: string }[];
  ogImg: string | null;
  jsonld: string[];
};

export async function laadKoppeling(Astro: AstroGlobal): Promise<KoppelingData> {
  const EN = Astro.url.pathname.startsWith("/en/");
  const PRE = EN ? "/en" : "";
  const T = (nl: string, en: string) => (EN ? en : nl);
  const slug = decodeURIComponent(String(Astro.params.slug || ""));
  const leeg = { en: EN, k: null, failed: false, html: "", title: "", desc: "", url: "", canonical: "", noindex: true, hreflang: [], ogImg: null, jsonld: [] };
  if (!slug) return { ...leeg, redirect: `${PRE}/api#koppelingen` };
  if (ALIASES[slug]) return { ...leeg, redirect: `${PRE}/wix-koppeling/${ALIASES[slug]}` };

  const origin = siteOrigin(Astro.request, Astro.url);
  let all: any[] = [];
  let k: any = null;
  let failed = false;
  let lijst: any[] = [];
  try {
    const [ks, ps] = await Promise.all([alles(COLLECTION), alles("Projecten").catch(() => [])]);
    all = sorteer(ks);
    k = all.find((x) => x.slug === slug) || null;
    if (k) {
      const ref: any = await wixData("items/query-referenced", { dataCollectionId: COLLECTION, referringItemId: k._id, referringItemFieldName: "projecten" }).catch(() => null);
      const gekoppeld = (ref?.results ?? []).map((r: any) => r?.dataItem?.data).filter((p: any) => p?.slug && p?.title);
      lijst = zoekProjecten(k, ps.filter((p: any) => p.slug && p.title), gekoppeld).map((p: any) => projectInTaal(p, EN ? "en" : "nl"));
    }
  } catch (err) {
    console.error(err);
    failed = true;
  }
  if (!k) {
    Astro.response.status = failed ? 503 : 404;
    return {
      ...leeg,
      failed,
      title: failed ? T("Koppeling kon niet worden geladen | Yonglo", "Integration could not be loaded | Yonglo") : T("Koppeling niet gevonden | Yonglo", "Integration not found | Yonglo"),
    };
  }

  const kk = inTaal(k, EN ? "en" : "nl");
  const alleT = all.map((x) => inTaal(x, EN ? "en" : "nl"));
  const html = [hero(kk), body(kk), aanpak(kk), projecten(kk, lijst), andere(kk, alleT), contact(kk)].join("\n");

  const nlUrl = `${origin}/wix-koppeling/${encodeURIComponent(k.slug)}`;
  const enUrl = `${origin}/en/wix-koppeling/${encodeURIComponent(k.slug)}`;
  const vertaald = !!k.tekstEn;
  const url = origin + koppelingUrl(kk);
  // Zonder Engelse tekst is de Engelse pagina een kopie van de Nederlandse: niet laten indexeren.
  const noindex = EN && !vertaald;
  const hreflang = vertaald
    ? [{ lang: "nl", href: nlUrl }, { lang: "en", href: enUrl }, { lang: "x-default", href: nlUrl }]
    : [];
  const title = `${kk.title}: ${T("Wix koppeling", "Wix integration")} | Yonglo`;
  const desc = trimTo(kk.metabeschrijving || platteTekst(kk.tekst), 158);
  const ogImg = img(k.logo, 1200, 630, "c");
  const ORG = { "@type": "Organization", "@id": "https://www.yonglo.com/#organization", name: "Yonglo", url: "https://www.yonglo.com" };
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    url,
    name: kk.kop || `Wix + ${kk.title}`,
    serviceType: T(`Koppeling tussen Wix en ${kk.title}`, `Integration between Wix and ${kk.title}`),
    description: desc,
    ...(ogImg ? { image: ogImg } : {}),
    inLanguage: EN ? "en" : "nl-NL",
    provider: ORG,
    areaServed: ["NL", "BE"],
    ...(kk.categorie ? { category: kk.categorie } : {}),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${origin}${PRE || "/"}` },
      { "@type": "ListItem", position: 2, name: T("API koppelingen", "API integrations"), item: `${origin}${PRE}/api` },
      { "@type": "ListItem", position: 3, name: kk.title, item: url },
    ],
  };
  return {
    en: EN, k: kk, failed, html, title, desc, url,
    canonical: noindex ? nlUrl : url,
    noindex, hreflang, ogImg,
    jsonld: [ld(service), ld(breadcrumb)],
  };
}
