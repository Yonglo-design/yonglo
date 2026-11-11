// Help docs van de Wix-apps van Yonglo (Smart Cookie Popup, PDF Generator Pro …), in het Engels.
// Inhoud uit de Wix CMS-collecties "AppsHelpDocs" (artikelen) en "AppDocsFAQ" (vragen per artikel).
// Adressen: /help-docs (alle apps), /help-docs/<app> (één app), /help-docs/<app>/<artikel>.
// Gebruikt door de server (src/helpdocs.ts) en door tools/maak-ai-bestanden.mjs.

export const DOCS = "AppsHelpDocs";
export const FAQ = "AppDocsFAQ";

// Extra informatie per app (naam zoals in het CMS-veld "App"). Een nieuwe app zonder regel hier werkt ook.
// icon: SVG-pictogram (24×24, lijnen); kleur: begin- en eindkleur van het app-icoon.
export const APPS = {
  "Smart Cookie Popup for Wix": {
    kort: "Smart Cookie Popup",
    intro: "A multilingual cookie banner for Wix that helps your site comply with GDPR and Google Consent Mode v2, with managed Google tags and a preferences button.",
    market: "https://www.wix.com/app-market/search-result?query=smart%20cookie",
    kleur: ["#FF9A3C", "#E8590C"],
    icon: '<path d="M21 12.4A9 9 0 1 1 11.6 3a4 4 0 0 0 5 5 4 4 0 0 0 4.4 4.4Z"/><circle cx="8.5" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="12.5" cy="15.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="15" r=".9" fill="currentColor" stroke="none"/><circle cx="16.3" cy="13" r=".9" fill="currentColor" stroke="none"/>',
  },
  "PDF Generator Pro": {
    kort: "PDF Generator Pro",
    intro: "Generate PDFs from your Wix data: invoices from orders, tickets with QR codes from events, booking confirmations, product spec sheets and documents from any CMS collection.",
    market: "https://www.wix.com/app-market/search-result?query=pdf%20generator%20pro",
    kleur: ["#FF5A5F", "#C2255C"],
    icon: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 16.5h5"/>',
  },
};
const ICON_STANDAARD = '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 9h8M8 13h8M8 17h5"/>';

// App-icoon (HTML) in de kleuren van de app.
export function appIcon(app, cls = "hd-ico") {
  const info = APPS[app] || {};
  const [a, b] = info.kleur || ["#325FFC", "#7A97FD"];
  return `<span class="${cls}" style="--ia:${a};--ib:${b}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${info.icon || ICON_STANDAARD}</svg></span>`;
}

// Leestijd in minuten (200 woorden per minuut) van de tekst van een artikel (Wix rich content).
export function leestijd(rc) {
  let n = 0;
  const walk = (ns) => (ns || []).forEach((x) => { if (x.type === "TEXT") n += String(x.textData?.text || "").split(/\s+/).filter(Boolean).length; walk(x.nodes); });
  walk(rc?.nodes);
  return Math.max(1, Math.round(n / 200));
}

export const datum = (iso) => (iso ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date(iso)) : "");

export function slugify(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
export const appSlug = (app) => slugify(app);
export const appUrl = (app) => `/help-docs/${appSlug(app)}`;
export const docUrl = (d) => `/help-docs/${appSlug(d.app)}/${encodeURIComponent(d.slug)}`;
// Adres van een artikel op de oude Wix-site: /help-docs/<app>/<titel in kleine letters, spaties → ->.
export const oudeSlug = (d) => String(d.title || "").toLowerCase().replace(/ /g, "-");

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Artikelen per app, in de volgorde van het CMS (veld "Order"), als boom (startartikel met hoofdstukken).
export function perApp(docs) {
  const sorted = docs.filter((d) => d && d.title && d.slug && d.app)
    .sort((a, b) => (a.volgorde ?? 999) - (b.volgorde ?? 999) || String(a.title).localeCompare(String(b.title)));
  const apps = new Map();
  for (const d of sorted) {
    if (!apps.has(d.app)) apps.set(d.app, []);
    apps.get(d.app).push(d);
  }
  return [...apps.entries()].map(([app, list]) => {
    const ids = new Set(list.map((d) => d._id));
    const kids = (pid) => list.filter((d) => (d.parent && ids.has(d.parent) ? d.parent : null) === pid);
    const flat = [];
    const walk = (pid, depth) => kids(pid).forEach((d) => { flat.push({ ...d, depth }); walk(d._id, depth + 1); });
    walk(null, 0);
    return { app, slug: appSlug(app), info: APPS[app] || {}, docs: flat };
  });
}

// Platte tekst van een FAQ-antwoord (RICH_TEXT, HTML).
export function platteTekst(html) {
  return String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<\/p>/gi, " ").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}

// FAQ-antwoord veilig maken: alleen eenvoudige opmaak.
const TOEGESTAAN = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "code"]);
export function veiligeHtml(html) {
  return String(html || "")
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name, attrs) => {
      name = name.toLowerCase();
      if (!TOEGESTAAN.has(name)) return "";
      if (tag[1] === "/") return `</${name}>`;
      if (name === "a") {
        const m = attrs.match(/href\s*=\s*"([^"]*)"/i);
        const href = m ? m[1] : "";
        if (!/^(https?:|mailto:|\/|#)/i.test(href)) return "<a>";
        return `<a href="${esc(href)}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : ""}>`;
      }
      return `<${name}>`;
    })
    .replace(/<p>\s*(<br>)?\s*<\/p>/g, "")
    .trim();
}
