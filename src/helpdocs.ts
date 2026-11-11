// Gegevens voor de help docs (/help-docs, /help-docs/<app>, /help-docs/<app>/<artikel>).
// Wix bouwt deze pagina's op de server op met de CMS-collecties "AppsHelpDocs" en "AppDocsFAQ"
// (Wix-dashboard → CMS), dus de volledige tekst en de SEO-tags staan direct in de HTML.
// Artikelen met de status "Draft" in het CMS zijn niet zichtbaar. De pagina zelf: src/components/HelpDocs.astro.
import type { AstroGlobal } from "astro";
import { fetchWithAuth } from "@wix/sdk/context";
import { renderContent, trimTo } from "../assets/blog.js";
import { DOCS, FAQ, perApp, appSlug, appUrl, docUrl, oudeSlug, veiligeHtml, platteTekst, leestijd } from "../assets/helpdocs.js";
import { siteOrigin } from "./paginas";

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
  return all;
}

const ld = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

export type HelpDocsData = {
  redirect?: string;
  mode: "overzicht" | "app" | "artikel" | "leeg";
  failed: boolean;
  apps: any[];
  app: any;
  doc: any;
  html: string;
  toc: { id: string; text: string }[];
  faqs: { q: string; a: string }[];
  prev: any;
  next: any;
  title: string;
  desc: string;
  lead: string;
  url: string;
  jsonld: string[];
};

export async function laadHelpDocs(Astro: AstroGlobal): Promise<HelpDocsData> {
  const appParam = Astro.params.app ? decodeURIComponent(String(Astro.params.app)) : "";
  const slugParam = Astro.params.slug ? decodeURIComponent(String(Astro.params.slug)) : "";
  const origin = siteOrigin(Astro.request, Astro.url);
  const leeg: HelpDocsData = { mode: "leeg", failed: false, apps: [], app: null, doc: null, html: "", toc: [], faqs: [], prev: null, next: null, title: "", desc: "", lead: "", url: "", jsonld: [] };

  let docs: any[] = [], faqs: any[] = [];
  try {
    [docs, faqs] = await Promise.all([alles(DOCS), alles(FAQ).catch(() => [])]);
  } catch (err) {
    console.error(err);
    Astro.response.status = 503;
    return { ...leeg, failed: true, title: "Help docs could not be loaded | Yonglo" };
  }
  // Per app: aantal vragen; per artikel: leestijd en datum (voor de kaarten en de kop van een artikel).
  const apps = perApp(docs).map((a) => {
    const ids = new Set(a.docs.map((x: any) => x._id));
    const docsMeer = a.docs.map((x: any) => ({ ...x, minuten: leestijd(x.richcontent), vragen: faqs.filter((f) => f.article === x._id).length, bijgewerkt: x._updatedDate?.$date || x._updatedDate || "" }));
    return { ...a, docs: docsMeer, faqs: faqs.filter((f) => ids.has(f.article)).length, bijgewerkt: docsMeer.map((x: any) => x.bijgewerkt).sort().pop() || "" };
  });
  const crumbs = (items: [string, string][]) => ld({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/en"], ["Help docs", "/help-docs"], ...items].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: origin + path })),
  });

  // /help-docs
  if (!appParam) {
    return {
      ...leeg, mode: "overzicht", apps,
      title: "Help docs for Yonglo's Wix apps | Yonglo",
      desc: `Guides, setup instructions and FAQs for ${apps.map((a) => a.app).join(" and ")}, the Wix apps by Yonglo.`,
      url: origin + "/help-docs",
      jsonld: [crumbs([])],
    };
  }

  const app = apps.find((a) => a.slug === appParam || a.slug === appSlug(appParam));
  if (!app) {
    Astro.response.status = 404;
    return { ...leeg, apps, title: "Page not found | Yonglo help docs" };
  }
  if (app.slug !== appParam) return { ...leeg, redirect: slugParam ? `${appUrl(app.app)}/${encodeURIComponent(slugParam)}` : appUrl(app.app) };

  // /help-docs/<app>
  if (!slugParam) {
    return {
      ...leeg, mode: "app", apps, app,
      title: `${app.app} help docs | Yonglo`,
      desc: trimTo(app.info.intro || `Guides and FAQs for ${app.app}, a Wix app by Yonglo.`, 158),
      url: origin + appUrl(app.app),
      jsonld: [crumbs([[app.app, appUrl(app.app)]])],
    };
  }

  // /help-docs/<app>/<artikel>
  let i = app.docs.findIndex((d: any) => d.slug === slugParam);
  if (i < 0) {
    // Oud adres van de vorige Wix-site (bijv. /help-docs/smart-cookie-popup-for-wix/gdpr-compliance of met haakjes en komma's)
    const oud = app.docs.find((d: any) => oudeSlug(d) === slugParam.toLowerCase());
    if (oud) return { ...leeg, redirect: docUrl(oud) };
    // Artikel bestaat niet (meer), bijvoorbeeld een oud adres: door naar het overzicht van de app.
    return { ...leeg, redirect: appUrl(app.app) };
  }
  const doc = app.docs[i];
  const r = renderContent({ title: doc.title, richContent: doc.richcontent });
  const vragen = faqs
    .filter((f) => f.article === doc._id && f.qeustion)
    .sort((a, b) => (a.volgorde ?? 999) - (b.volgorde ?? 999))
    .map((f) => ({ q: String(f.qeustion), a: veiligeHtml(f.awnser) }));
  const url = origin + docUrl(doc);
  const desc = trimTo(doc.omschrijving || r.firstText || `${doc.title}: help for ${app.app}.`, 158);
  // Inleiding onder de titel alleen als de omschrijving niet gewoon het begin van de tekst is.
  const begin = (s: string) => String(s || "").replace(/…$/, "").slice(0, 60);
  const lead = doc.omschrijving && !String(r.firstText || "").startsWith(begin(doc.omschrijving)) ? doc.omschrijving : "";
  const upd = doc._updatedDate?.$date || doc._updatedDate;
  const article = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: trimTo(doc.title, 110),
    description: desc,
    inLanguage: "en",
    ...(upd ? { dateModified: upd } : {}),
    about: { "@type": "SoftwareApplication", name: app.app, applicationCategory: "BusinessApplication", operatingSystem: "Wix", ...(app.info.market ? { url: app.info.market } : {}) },
    author: { "@type": "Organization", name: "Yonglo", url: "https://www.yonglo.com" },
    publisher: { "@type": "Organization", "@id": "https://www.yonglo.com/#organization", name: "Yonglo", url: "https://www.yonglo.com" },
  };
  const faqLd = vragen.length && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: vragen.map((v) => ({ "@type": "Question", name: v.q, acceptedAnswer: { "@type": "Answer", text: platteTekst(v.a) } })),
  };
  return {
    ...leeg, mode: "artikel", apps, app, doc,
    html: r.html, toc: r.toc.length >= 3 ? r.toc : [], faqs: vragen,
    prev: app.docs[i - 1] || null, next: app.docs[i + 1] || null,
    title: `${doc.title} | ${app.app} help`,
    desc, lead, url,
    jsonld: [ld(article), crumbs([[app.app, appUrl(app.app)], [doc.title, docUrl(doc)]]), ...(faqLd ? [ld(faqLd)] : [])],
  };
}
