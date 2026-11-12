// Gedeelde helpers voor de portfolio en projectpagina's.
// Alle inhoud komt uit de Wix CMS-collectie "Projecten" (beheer: Wix dashboard → CMS → Projecten).
import { queryDataItems } from "./wix/wix-cms.js";
import { wixImage } from "./wix/wixImage.js";

export const COLLECTION = "Projecten";

// Volgorde van de filterknoppen; diensten die hier niet staan komen er automatisch achter.
const DIENST_ORDER = ["Wix Studio", "eCommerce", "Development", "Branding", "AI oplossingen", "API koppelingen", "AI solutions", "API integrations"];
// "Webdesign" geldt voor bijna elk project en is daarom geen apart filter.
const NO_FILTER = ["Webdesign"];

// Snelheid: de projecten worden per pagina maar één keer opgehaald, ook als meerdere scripts
// (hero, sliders) ze tegelijk nodig hebben.
const projectsCache = {};
export function fetchProjects() {
  const lang = pageLang();
  if (!projectsCache[lang]) projectsCache[lang] = loadProjects().catch(e => { delete projectsCache[lang]; throw e; });
  return projectsCache[lang];
}

async function loadProjects() {
  const all = [];
  let cursor = null;
  do {
    const page = await queryDataItems(COLLECTION, cursor
      ? { cursor, limit: 100 }
      : { sort: [{ fieldName: "volgorde", order: "ASC" }, { fieldName: "title", order: "ASC" }], limit: 100 });
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return all.filter(p => p.title && p.slug).map(p => inTaal(p));
}

// Contactpersoon per project (CMS-collectie "Contactpersonen", gekoppeld via het veld "contactpersoon").
export async function fetchContactpersoon(id) {
  if (!id) return null;
  const page = await queryDataItems("Contactpersonen", { filter: { _id: { $eq: String(id) } }, limit: 1 });
  return page.items[0] || null;
}

// ---- Engelse website (/en/…) ----
// Elk project heeft in het CMS Engelse velden met "En" erachter (introEn, omschrijvingEn …). Op de Engelse
// site worden die gebruikt; is een Engels veld leeg, dan blijft de Nederlandse tekst staan.
export const EN_FIELDS = ["subkop", "branche", "kortTekst", "intro", "omschrijving", "sectieKop", "sectieTekst", "kenmerken", "quote"];
// Namen van diensten (filterknoppen en labels) in het Engels.
export const DIENST_EN = { "AI oplossingen": "AI solutions", "API koppelingen": "API integrations" };
export const pageLang = () => (typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "nl");
export function inTaal(p, lang = pageLang()) {
  if (lang !== "en" || !p || p._lang === "en") return p;
  const q = { ...p, _lang: "en" };
  for (const k of EN_FIELDS) if (p[k + "En"]) q[k] = p[k + "En"];
  q.diensten = (p.diensten || []).map(d => DIENST_EN[d] || d);
  return q;
}

export function projectUrl(p) {
  return (p._lang === "en" ? "/en/project/" : "/project/") + encodeURIComponent(p.slug);
}

// Wix-afbeelding op maat (scherper en lichter dan het origineel).
// Met w én h: bijsnijden (fill). Alleen w: schalen met behoud van verhouding (fit).
export function img(value, w, h, al = "t") {
  const url = wixImage(value);
  if (!url) return null;
  const m = url.match(/^https:\/\/static\.wixstatic\.com\/media\/([^/?#]+)$/);
  if (!m) return url;
  const id = m[1];
  if (h) return `https://static.wixstatic.com/media/${id}/v1/fill/w_${w},h_${h},al_${al},q_85,enc_auto/${id}`;
  const d = dims(value);
  const fh = d ? Math.round(w * d.h / d.w) : w * 4;
  return `https://static.wixstatic.com/media/${id}/v1/fit/w_${w},h_${fh},q_85,enc_auto/${id}`;
}

// Originele afmetingen uit een wix:image-waarde (#originWidth=…&originHeight=…).
export function dims(value) {
  const m = String(value || "").match(/originWidth=(\d+)&originHeight=(\d+)/);
  return m ? { w: +m[1], h: +m[2] } : null;
}

// Wix-video (wix:video://v1/<id>/<naam>#posterUri=…) → afspeelbare mp4 + poster.
export function video(value) {
  const v = String(value || "");
  if (/^https?:\/\//.test(v)) return { src: v, poster: null };
  const m = v.match(/^wix:video:\/\/v1\/([^/#]+)/);
  if (!m) return null;
  const pm = v.match(/posterUri=([^&]+)/);
  return {
    src: `https://video.wixstatic.com/video/${m[1]}/720p/mp4/file.mp4`,
    poster: pm ? `https://static.wixstatic.com/media/${pm[1]}` : null,
  };
}

export function galleryOf(p) {
  return (Array.isArray(p.galerij) ? p.galerij : [])
    .filter(g => g && (g.type === "image" || !g.type) && g.src)
    .map(g => ({ src: g.src, title: g.title || "" }));
}

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const HEX = /^#[0-9a-f]{3,8}$/i;
export function themeStyle(p) {
  const a = HEX.test(p.kleurDonker || "") ? p.kleurDonker : "#1b1d2e";
  const b = HEX.test(p.kleurMidden || "") ? p.kleurMidden : "#325FFC";
  const c = HEX.test(p.kleurLicht || "") ? p.kleurLicht : "#99AFFE";
  return `--a:${a};--b:${b};--c:${c}`;
}

export function dienstKey(d) {
  return String(d).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function filterDiensten(projects) {
  const seen = new Map();
  projects.forEach(p => (p.diensten || []).forEach(d => {
    if (!d || NO_FILTER.includes(d)) return;
    seen.set(d, (seen.get(d) || 0) + 1);
  }));
  return [...seen.keys()].sort((x, y) => {
    const ix = DIENST_ORDER.indexOf(x), iy = DIENST_ORDER.indexOf(y);
    return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy) || x.localeCompare(y, pageLang());
  });
}

// Labels op een kaart: de specifieke diensten, "Webdesign" alleen als er niets anders is.
export function cardTags(p, max = 3) {
  const d = (p.diensten || []).filter(Boolean);
  const specific = d.filter(x => !NO_FILTER.includes(x));
  return (specific.length ? specific : d).slice(0, max);
}

export function paragraphs(text) {
  return String(text || "").split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
}

// "Titel: tekst" per regel
export function kenmerken(text) {
  return String(text || "").split(/\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf(":");
    return i > 0 ? { t: l.slice(0, i).trim(), d: l.slice(i + 1).trim() } : { t: l, d: "" };
  });
}

export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Reveal-animatie voor elementen die na het laden zijn toegevoegd (app.js observeert alleen wat er al stond).
export function reveal(root) {
  const els = [...root.querySelectorAll(".rv")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduce) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}

export function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.body.appendChild(s);
  });
}

// Mock-venster in projectkleuren, voor projecten zonder screenshot.
export function mockVis(p, cls = "ms") {
  return `<div class="${cls}"><i class="tb"></i><b>${esc(p.title)}</b><span></span><span class="s2"></span></div>`;
}

// Korte tekst in de taal van de pagina: t("Bekijk", "View").
export const t = (nl, en) => (pageLang() === "en" ? en : nl);

// Alle projectkaarten van de portfolio (plus de kaart "Jouw project hier?"). Gebruikt in de browser
// (assets/portfolio-cms.js) én op de server (src/portfolio-server.ts), zodat de lijst al in de HTML staat.
export function gridHtml(ps, lang = pageLang()) {
  const tt = (nl, en) => (lang === "en" ? en : nl);
  const allKeys = [...new Set(ps.flatMap(p => (p.diensten || []).map(dienstKey)))].join(" ");
  return ps.map(p => {
    const pf = !!p.portfolioImage;
    const src = pf ? img(p.portfolioImage, 700, 700, "c") : img(p.hoofdbeeld, 800, 600);
    const tags = cardTags(p).map(x => `<li>${esc(x)}</li>`).join("");
    return `<a href="${projectUrl(p)}" class="pcard" data-cat="${(p.diensten || []).map(dienstKey).join(" ")}">
      <div class="pcard-vis${src ? " has-img" : ""}${pf ? " pf" : ""}" style="${themeStyle(p)}">${src ? `<img src="${src}" alt="${esc(p.title)}" loading="lazy">` : mockVis(p)}</div>
      <div class="pcard-meta">${p.branche ? `<span class="pc-br">${esc(p.branche)}</span>` : ""}<h3>${esc(p.title)}</h3>${p.kortTekst ? `<p>${esc(p.kortTekst)}</p>` : ""}${tags ? `<ul class="pc-tags">${tags}</ul>` : ""}</div>
    </a>`;
  }).join("") + `<a href="#contact" class="pcard pcard-cta" data-cat="${allKeys}"><span>${tt("Jouw project hier?", "Your project here?")}</span><b>${tt("Laten we kennismaken →", "Let's get acquainted →")}</b></a>`;
}
