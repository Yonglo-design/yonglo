// Help docs van de Wix-apps van Yonglo (Smart Cookie Popup, PDF Generator Pro …), in het Engels.
// Inhoud uit de Wix CMS-collecties "AppsHelpDocs" (artikelen) en "AppDocsFAQ" (vragen per artikel).
// Adressen: /help-docs (alle apps), /help-docs/<app> (één app), /help-docs/<app>/<artikel>.
// Gebruikt door de server (src/helpdocs.ts) en door tools/maak-ai-bestanden.mjs.

export const DOCS = "AppsHelpDocs";
export const FAQ = "AppDocsFAQ";

// Extra informatie per app (naam zoals in het CMS-veld "App"). Een nieuwe app zonder regel hier werkt ook.
export const APPS = {
  "Smart Cookie Popup for Wix": {
    intro: "A multilingual cookie banner for Wix that helps your site comply with GDPR and Google Consent Mode v2, with managed Google tags and a preferences button.",
    market: "https://www.wix.com/app-market/search-result?query=smart%20cookie",
  },
  "PDF Generator Pro": {
    intro: "Generate PDFs from your Wix data: invoices from orders, tickets with QR codes from events, booking confirmations, product spec sheets and documents from any CMS collection.",
    market: "https://www.wix.com/app-market/search-result?query=pdf%20generator%20pro",
  },
};

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
