// Gedeelde helpers voor de portfolio en projectpagina's.
// Alle inhoud komt uit de Wix CMS-collectie "Projecten" (beheer: Wix dashboard → CMS → Projecten).
import { queryDataItems } from "./wix/wix-cms.js";
import { wixImage } from "./wix/wixImage.js";

export const COLLECTION = "Projecten";

// Volgorde van de filterknoppen; diensten die hier niet staan komen er automatisch achter.
const DIENST_ORDER = ["Wix Studio", "eCommerce", "Development", "Branding", "AI oplossingen", "API koppelingen"];
// "Webdesign" geldt voor bijna elk project en is daarom geen apart filter.
const NO_FILTER = ["Webdesign"];

export async function fetchProjects() {
  const all = [];
  let cursor = null;
  do {
    const page = await queryDataItems(COLLECTION, cursor
      ? { cursor, limit: 100 }
      : { sort: [{ fieldName: "volgorde", order: "ASC" }, { fieldName: "title", order: "ASC" }], limit: 100 });
    all.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return all.filter(p => p.title && p.slug);
}

// Contactpersoon per project (CMS-collectie "Contactpersonen", gekoppeld via het veld "contactpersoon").
export async function fetchContactpersoon(id) {
  if (!id) return null;
  const page = await queryDataItems("Contactpersonen", { filter: { _id: { $eq: String(id) } }, limit: 1 });
  return page.items[0] || null;
}

export function projectUrl(p) {
  return "/project.html?p=" + encodeURIComponent(p.slug);
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
  const b = HEX.test(p.kleurMidden || "") ? p.kleurMidden : "#5B60F6";
  const c = HEX.test(p.kleurLicht || "") ? p.kleurLicht : "#9D9DFF";
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
    return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy) || x.localeCompare(y, "nl");
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
