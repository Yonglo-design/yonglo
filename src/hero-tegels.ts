// Homepage-hero: de projectbeelden in de zwevende tegels worden al op de server in de HTML gezet
// (in plaats van in de browser na het laden). Daardoor staan ze er meteen, wat de pagina sneller "af"
// maakt (Speed Index in PageSpeed). Projecten komen uit de Wix CMS-collectie "Projecten"; een gewijzigd
// project is binnen een paar minuten zichtbaar, zonder te publiceren.
// Lukt het ophalen niet snel genoeg, dan blijft de pagina zoals hij was en vult assets/hero-c.js de tegels
// in de browser, net als vroeger. Dezelfde volgorde en keuze als in assets/hero-c.js.
import { fetchWithAuth } from "@wix/sdk/context";
import { projectUrl, img, esc, themeStyle, inTaal } from "../assets/projecten.js";

const CACHE_MS = 5 * 60 * 1000; // projecten 5 minuten onthouden, zodat de homepage niet op het CMS hoeft te wachten
const TIMEOUT_MS = 1500;
let cache: { at: number; items: any[] } | null = null;
let bezig: Promise<any[]> | null = null;

async function query(body: any) {
  const res = await fetchWithAuth("https://www.wixapis.com/wix-data/v2/items/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Wix Data Projecten: ${res.status}`);
  const d = await res.json();
  return { items: (d?.dataItems ?? []).map((x: any) => x.data), next: d?.pagingMetadata?.cursors?.next ?? null };
}

async function laadProjecten(): Promise<any[]> {
  const all: any[] = [];
  let page = await query({ dataCollectionId: "Projecten", query: { sort: [{ fieldName: "volgorde", order: "ASC" }, { fieldName: "title", order: "ASC" }], cursorPaging: { limit: 100 } } });
  all.push(...page.items);
  while (page.next) {
    page = await query({ dataCollectionId: "Projecten", query: { cursorPaging: { limit: 100, cursor: page.next } } });
    all.push(...page.items);
  }
  return all.filter((p) => p.title && p.slug);
}

async function projecten(): Promise<any[] | null> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.items;
  if (!bezig) {
    bezig = laadProjecten()
      .then((items) => { cache = { at: Date.now(), items }; return items; })
      .finally(() => { bezig = null; });
  }
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS));
  try {
    return await Promise.race([bezig, timeout]);
  } catch {
    return cache?.items ?? null; // CMS niet bereikbaar: oude lijst gebruiken als die er is
  }
}

// Beeldformaat per tegel (breedte x hoogte bij 2x scherpte): t2 is staand, t5 bijna vierkant.
// Op mobiel/tablet zijn de tegels 160-200 px breed; het beeld wordt dan met object-fit bijgesneden.
const MATEN: Record<string, [number, number]> = { t2: [480, 640], t5: [480, 540] };
const SIZES = "(max-width:767px) 160px, (max-width:1023px) 200px, 14vw";

function beeld(p: any, w: number, h: number) {
  return p.portfolioImage ? img(p.portfolioImage, w, h, "c") : img(p.hoofdbeeld, w, h);
}

export async function vulHero(html: string | null, lang: "nl" | "en"): Promise<string | null> {
  if (!html || !html.includes('class="hero hc dark"')) return html;
  const ruw = await projecten();
  if (!ruw) return html;
  const withImg = ruw.map((p) => inTaal(p, lang)).filter((p) => p.portfolioImage || p.hoofdbeeld);
  const list = [...withImg.filter((p) => p.uitgelicht), ...withImg.filter((p) => !p.uitgelicht)];
  if (!list.length) return html;

  // Alle tegels met data-tile, in volgorde (net als hero-c.js); videotegels blijven zoals ze zijn.
  let i = 0, aantal = 0;
  let out = html.replace(/<a class="hc-t ([^"]*)" data-tile([^>]*)>([\s\S]*?)<\/a>/g, (hele, cls: string, rest: string) => {
    const nr = i++;
    if (/\bdata-video\b/.test(rest)) return hele;
    const p = list[nr];
    if (!p) return hele;
    const t = (cls.match(/\bt\d\b/) || ["t2"])[0];
    const [w, h] = MATEN[t] || [480, 600];
    const groot = beeld(p, w, h), klein = beeld(p, Math.round(w * 2 / 3), Math.round(h * 2 / 3));
    const pf = !!p.portfolioImage;
    const attrs = rest.replace(/\shref="[^"]*"/, "").replace(/\saria-label="[^"]*"/, "");
    const style = ` style="${esc(themeStyle(p))}"`;
    const inhoud = groot
      ? `<img src="${esc(groot)}" srcset="${esc(klein)} ${Math.round(w * 2 / 3)}w, ${esc(groot)} ${w}w" sizes="${SIZES}" alt="" decoding="async" width="${w}" height="${h}">`
      : `<b class="ph">${esc(p.title)}</b>`;
    aantal++;
    return `<a class="hc-t ${cls}${pf ? " pf" : ""}" data-tile${attrs} href="${esc(projectUrl(p))}" aria-label="${esc("Project: " + p.title)}"${style}><span class="f">${inhoud}<span class="cap">${esc(p.title)}</span></span></a>`;
  });

  // Extra project als achtergrond van de AI-tegel.
  const extra = list[i];
  if (extra) {
    const src = extra.portfolioImage ? img(extra.portfolioImage, 600, 600, "c") : img(extra.hoofdbeeld, 600, 600);
    if (src) out = out.replace('<span class="img"></span>', `<span class="img" style="background-image:url(&quot;${esc(src)}&quot;)"></span>`);
  }
  // Seintje aan assets/hero-c.js dat de tegels al gevuld zijn.
  if (aantal) out = out.replace('class="hero hc dark"', 'class="hero hc dark" data-ssr');
  return out;
}
