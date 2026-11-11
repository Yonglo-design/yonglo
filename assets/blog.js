// Blog: berichten live uit Wix Blog van deze site (Wix-dashboard → Blog). Een nieuw bericht dat daar
// gepubliceerd wordt, staat meteen op de nieuwspagina, de homepage en in de zoekfunctie.
// Gebruikt door nieuws.js, home-nieuws.js en zoeken.js (browser) en door src/pages/post/[slug].astro (server).
import { wixApiRequest } from "./wix/wix-client.js";

const LANG = "nl";
const TZ = "Europe/Amsterdam";

/* ------------------------------------------------------------ helpers */

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const clean = (s) => String(s ?? "").replace(/[­​]/g, "").replace(/\s+/g, " ").trim();

export function trimTo(s, n) {
  s = clean(s);
  if (s.length <= n) return s;
  const cut = s.slice(0, n - 1);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, "") + "…";
}

export const fmtDate = (iso) => new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(new Date(iso));
export const ymd = (iso) => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ }).format(new Date(iso));

export const postUrl = (p) => `/post/${encodeURIComponent(p.slug)}`;

function slugify(s) {
  return clean(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "sectie";
}

// Wix-media-id ("345956_abc~mv2.jpg") of volledige wixstatic-URL -> media-id; externe URL -> null.
function mediaId(src) {
  if (!src) return null;
  const s = String(src);
  const m = s.match(/static\.wixstatic\.com\/media\/([^/?#]+)/);
  if (m) return m[1];
  if (/^https?:/i.test(s)) return null;
  return s.replace(/^\/+/, "");
}

export function wixImg(src, w, h, mode = "fill") {
  const id = mediaId(src);
  if (!id) return String(src || "");
  return `https://static.wixstatic.com/media/${id}/v1/${mode}/w_${Math.round(w)},h_${Math.round(h)},al_c,q_80,enc_auto/${id}`;
}

// Responsieve afbeelding (srcset), juiste verhouding, nooit groter dan het origineel.
export function contentImg(src, w0, h0, alt, { eager = false, sizes = "(max-width: 860px) 92vw, 760px" } = {}) {
  const ow = w0 || 1600;
  const ratio = (h0 || ow * 0.6) / ow;
  const widths = [...new Set([480, 800, 1200, 1600].filter((w) => w < ow).concat(Math.min(ow, 1600)))];
  const set = widths.map((w) => `${wixImg(src, w, w * ratio, "fit")} ${w}w`).join(", ");
  const mid = widths.find((w) => w >= 800) || widths[widths.length - 1];
  const dw = Math.min(ow, 1600);
  return `<img src="${esc(wixImg(src, mid, mid * ratio, "fit"))}" srcset="${esc(set)}" sizes="${sizes}" width="${dw}" height="${Math.round(dw * ratio)}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
}

/* ------------------------------------------------------------ onderwerpen */

// Onderwerp per bericht voor de filterknoppen = de blogcategorie in Wix. Zonder categorie: een gok.
export const CAT_ORDER = ["Yonglo", "Projecten", "Wix", "AI"];
function guessCat(p) {
  const t = `${p.title} ${p.slug}`.toLowerCase();
  if (/\bai\b|chatgpt|kunstmatige/.test(t)) return "AI";
  if (/wix/.test(t)) return "Wix";
  return "Yonglo";
}

/* ------------------------------------------------------------ data */

let catsP = null;
function fetchCategories() {
  catsP ||= wixApiRequest("/blog/v3/categories", { method: "GET", query: { "paging.limit": 100 } })
    .then((d) => Object.fromEntries((d?.categories || []).map((c) => [c.id, c.label])))
    .catch(() => ({}));
  return catsP;
}

export function tidy(p, cats) {
  const img = p.media?.wixMedia?.image;
  return {
    ...p,
    title: clean(p.title),
    excerpt: clean(p.excerpt),
    cat: (p.categoryIds || []).map((id) => cats[id]).find(Boolean) || guessCat(p),
    cover: img?.id ? { id: img.id, w: img.width || 1344, h: img.height || 768, alt: clean(img.altText || p.media?.altText || p.title) } : null,
  };
}

let listP = null;
/** Alle gepubliceerde Nederlandse berichten, nieuwste eerst (zonder de volledige tekst). */
export function fetchPosts() {
  listP ||= (async () => {
    const cats = fetchCategories();
    const out = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const d = await wixApiRequest("/blog/v3/posts/query", {
        body: { query: { sort: [{ fieldName: "firstPublishedDate", order: "DESC" }], paging: { limit: 100, offset } } },
      });
      const posts = d?.posts || [];
      out.push(...posts);
      if (posts.length < 100) break;
    }
    const c = await cats;
    return out.filter((p) => (p.language || LANG) === LANG && p.slug).map((p) => tidy(p, c));
  })();
  listP.catch(() => { listP = null; });
  return listP;
}

/** Eén bericht met volledige tekst en SEO-gegevens, of null als het niet (meer) bestaat. */
export async function fetchPost(slug) {
  const [d, cats] = await Promise.all([
    wixApiRequest("/blog/v3/posts/query", {
      body: { query: { filter: { slug }, paging: { limit: 1 } }, fieldsets: ["RICH_CONTENT", "SEO"] },
    }),
    fetchCategories(),
  ]);
  const p = (d?.posts || []).find((x) => x.slug === slug);
  return p ? tidy(p, cats) : null;
}

/* ------------------------------------------------------------ links */

// Links in berichten naar de oude Wix-pagina's van yonglo.com wijzen naar de nieuwe pagina's.
const LINK_MAP = {
  "/": "/", "/contact": "/contact.html", "/over-yonglo": "/over-yonglo.html", "/portfolio": "/portfolio.html",
  "/projecten": "/portfolio.html", "/expertise": "/", "/service": "/", "/wix": "/wix.html", "/wix-studio": "/wix.html",
  "/wix-europe": "/wix.html", "/wix-development": "/development.html", "/wix-optimaal": "/optimaal.html",
  "/wix-seo": "/seo.html", "/wix-blog-schrijven": "/seo.html", "/wix-webshop": "/ecommerce.html",
  "/nieuws": "/nieuws.html", "/blog": "/nieuws.html",
};

function mapLink(raw) {
  let url = String(raw || "").trim();
  if (!url) return null;
  if (/^(mailto|tel):/i.test(url) || url.startsWith("#")) return { href: url, ext: false };
  if (url.startsWith("/")) url = "https://www.yonglo.com" + url;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  let u;
  try { u = new URL(url); } catch { return null; }
  if (/(^|\.)yonglo\.com$/i.test(u.hostname)) {
    const p = (u.pathname.replace(/\/+$/, "") || "/").replace(/^\/(en|nl)(?=\/|$)/, "") || "/";
    const post = p.match(/^\/post\/([^/]+)$/);
    if (post) return { href: `/post/${post[1]}${u.hash}`, ext: false };
    if (LINK_MAP[p]) return { href: LINK_MAP[p] + u.hash, ext: false };
    if (p.startsWith("/wix-koppeling")) return { href: "/api.html", ext: false };
    return { href: u.href, ext: true };
  }
  if (u.protocol === "http:") u.protocol = "https:";
  return { href: u.href, ext: true };
}
const aOpen = (m) => `<a href="${esc(m.href)}"${m.ext ? ' target="_blank" rel="noopener"' : ""}>`;

/* ------------------------------------------------------------ tekst (Wix Ricos) -> HTML */

function plain(nodes) {
  return (nodes || []).map((n) => (n.type === "TEXT" ? n.textData?.text || "" : plain(n.nodes))).join("");
}
export const plainText = (nodes) => clean(plain(nodes));

function renderText(n) {
  const td = n.textData || {};
  let h = esc(td.text || "").replace(/\n/g, "<br>");
  if (!h) return "";
  const decs = td.decorations || [];
  if (decs.some((d) => d.type === "ITALIC" && d.italicData !== false)) h = `<em>${h}</em>`;
  if (decs.some((d) => d.type === "BOLD" && (d.fontWeightValue ?? 700) >= 600)) h = `<strong>${h}</strong>`;
  const link = decs.find((d) => d.type === "LINK")?.linkData?.link;
  const m = link && mapLink(link.url || (link.anchor ? "#" + link.anchor : ""));
  return m ? `${aOpen(m)}${h}</a>` : h;
}
const inline = (nodes) => (nodes || []).map((n) => (n.type === "TEXT" ? renderText(n) : inline(n.nodes))).join("");

function youtubeId(url) {
  const m = String(url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Zet de tekst van een bericht om naar HTML. Geeft ook de inhoudsopgave (H2's) en video's terug. */
export function renderContent(post) {
  const ids = new Set(), toc = [], videos = [];

  function heading(n) {
    const lvl = Math.min(Math.max(n.headingData?.level || 2, 2), 4);
    const text = plainText(n.nodes);
    if (!text) return "";
    let id = slugify(text);
    for (let i = 2; ids.has(id); i++) id = `${slugify(text)}-${i}`;
    ids.add(id);
    if (lvl === 2) toc.push({ id, text });
    return `<h${lvl} id="${id}">${inline(n.nodes)}</h${lvl}>`;
  }

  function image(n) {
    const d = n.imageData || {};
    const src = d.image?.src?.id || d.image?.src?.url;
    if (!src) return "";
    const cap = (n.nodes || []).find((c) => c.type === "CAPTION");
    const capText = cap ? plainText(cap.nodes) : "";
    let img = contentImg(src, d.image.width, d.image.height, d.decorative ? "" : clean(d.altText || capText || post.title));
    const m = d.link?.url && mapLink(d.link.url);
    if (m) img = `${aOpen(m)}${img}</a>`;
    return `<figure class="post-fig">${img}${capText ? `<figcaption>${inline(cap.nodes)}</figcaption>` : ""}</figure>`;
  }

  function gallery(n) {
    const items = (n.galleryData?.items || []).filter((it) => it.image?.media?.src);
    if (!items.length) return "";
    return `<div class="post-gal">${items.map((it) => {
      const md = it.image.media;
      let img = contentImg(md.src.id || md.src.url, md.width, md.height, clean(it.altText || it.title || post.title), { sizes: "(max-width: 860px) 46vw, 370px" });
      const m = it.image.link?.url && mapLink(it.image.link.url);
      if (m) img = `${aOpen(m)}${img}</a>`;
      return `<figure class="post-fig">${img}</figure>`;
    }).join("")}</div>`;
  }

  function video(n) {
    const v = n.videoData || {};
    const url = v.video?.src?.url || "";
    const id = youtubeId(url);
    if (!id) return url ? `<p><a href="${esc(url)}" target="_blank" rel="noopener">Bekijk de video</a></p>` : "";
    const thumb = v.thumbnail?.src?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const start = (url.match(/[?&]t=(\d+)/) || [])[1];
    videos.push({ id, thumb, duration: v.video?.duration });
    // YouTube laadt pas na een klik (snel en privacyvriendelijk).
    return `<figure class="post-fig post-video"><a class="yt" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener" data-yt="${id}"${start ? ` data-start="${start}"` : ""}><img src="${esc(thumb)}" alt="Video bij: ${esc(post.title)}" width="1280" height="720" loading="lazy" decoding="async"><span class="yt-play" aria-hidden="true"></span><span class="sr">Video afspelen</span></a></figure>`;
  }

  const kids = (n) => (n.nodes || []).map(block).join("");
  function block(n) {
    switch (n.type) {
      case "PARAGRAPH": { const h = inline(n.nodes); return h.replace(/<br>/g, "").trim() ? `<p>${h}</p>` : ""; }
      case "HEADING": return heading(n);
      case "BULLETED_LIST": return `<ul>${kids(n)}</ul>`;
      case "ORDERED_LIST": return `<ol>${kids(n)}</ol>`;
      case "LIST_ITEM": {
        const k = n.nodes || [];
        return k.length === 1 && k[0].type === "PARAGRAPH" ? `<li>${inline(k[0].nodes)}</li>` : `<li>${kids(n)}</li>`;
      }
      case "BLOCKQUOTE": return `<blockquote>${kids(n)}</blockquote>`;
      case "IMAGE": return image(n);
      case "GALLERY": return gallery(n);
      case "VIDEO": return video(n);
      case "LAYOUT": return `<div class="post-cols">${kids(n)}</div>`;
      case "LAYOUT_CELL": return `<div>${kids(n)}</div>`;
      case "DIVIDER": return "<hr>";
      case "CAPTION": return "";
      case "CODE_BLOCK": return `<pre><code>${esc(plain(n.nodes))}</code></pre>`;
      case "TABLE": return `<div class="post-table"><table>${kids(n)}</table></div>`;
      case "TABLE_ROW": return `<tr>${kids(n)}</tr>`;
      case "TABLE_CELL": return `<td>${kids(n)}</td>`;
      default: return kids(n);
    }
  }

  let nodes = post.richContent?.nodes || [];
  // Staat de omslagfoto ook in de tekst (gebruikelijk in Wix), dan daar niet nog een keer tonen.
  const isCover = (n) => n.type === "IMAGE" && post.cover && mediaId(n.imageData?.image?.src?.id || n.imageData?.image?.src?.url) === post.cover.id;
  const dup = nodes.findIndex(isCover);
  if (dup >= 0) nodes = nodes.filter((_, i) => i !== dup);
  const firstText = plainText((nodes.find((n) => n.type === "PARAGRAPH" && plainText(n.nodes)) || {}).nodes);
  return { html: nodes.map(block).join("\n"), toc, videos, firstText, words: plainText(nodes).split(" ").filter(Boolean).length };
}

/* ------------------------------------------------------------ kaarten */

export function card(p, i = 0, { feat = false, h = "h3" } = {}) {
  const w = feat ? 1200 : 720, hh = feat ? 686 : 412;
  const ph = p.cover
    ? `<figure class="nw-ph"><img src="${esc(wixImg(p.cover.id, w, hh))}" alt="" width="${w}" height="${hh}"${feat ? "" : ' loading="lazy" decoding="async"'}></figure>`
    : `<figure class="nw-ph"></figure>`;
  return `<a class="${feat ? "nw-feat" : "nw-card"} rv"${feat ? "" : ` style="--d:${((i % 3) * 0.06).toFixed(2)}s"`} href="${postUrl(p)}" data-cat="${esc(p.cat)}">
        ${ph}
        <div class="nw-body">
          <div class="nw-meta"><span class="cat">${esc(p.cat)}</span><time datetime="${ymd(p.firstPublishedDate)}">${fmtDate(p.firstPublishedDate)}</time></div>
          <${h}>${esc(p.title)}</${h}>
          <p>${esc(trimTo(p.excerpt, 200))}</p>
          <span class="more">${feat ? "Lees het artikel" : "Lees verder"} <i class="arr">→</i></span>
        </div>
      </a>`;
}

/* ------------------------------------------------------------ SEO-tags in de <head> */

export function setMeta(sel, attr, val, create) {
  let el = document.head.querySelector(sel);
  if (!el && create) { el = document.createElement(create.tag); Object.entries(create.attrs).forEach(([k, v]) => el.setAttribute(k, v)); document.head.appendChild(el); }
  if (el) el.setAttribute(attr, val);
}
export const meta = (name, content) => setMeta(`meta[name="${name}"]`, "content", content, { tag: "meta", attrs: { name } });
export const prop = (property, content) => setMeta(`meta[property="${property}"]`, "content", content, { tag: "meta", attrs: { property } });

export function setJsonLd(id, data) {
  let s = document.getElementById(id);
  if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = id; document.head.appendChild(s); }
  s.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
}
