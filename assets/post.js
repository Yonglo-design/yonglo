// Blogbericht: /post.html?p=<slug>. Tekst, afbeeldingen en SEO-gegevens komen live uit Wix Blog.
import { fetchPost, fetchPosts, renderContent, card, postUrl, wixImg, contentImg, esc, clean, trimTo, fmtDate, ymd, meta, prop, setMeta, setJsonLd } from "./blog.js";

const main = document.querySelector('[data-cms="post"]');
const slug = new URLSearchParams(location.search).get("p") || "";
const SITE = location.origin;

const seoTags = (p) => (p.seoData?.tags || []).filter((t) => !t.disabled);
const seoMeta = (p, key) => seoTags(p).find((t) => t.type === "meta" && (t.props?.name === key || t.props?.property === key))?.props?.content || "";

function setSeo(p, r) {
  const url = SITE + postUrl(p);
  const custom = clean(seoTags(p).find((t) => t.type === "title")?.children || "");
  const base = custom || p.title;
  const title = base.length <= 56 ? `${base} | Yonglo` : base;
  const desc = trimTo(seoMeta(p, "description") || p.excerpt || p.title, 158);
  const img = p.cover ? wixImg(p.cover.id, 1200, 630) : "";

  document.title = title;
  meta("description", desc);
  meta("robots", "index, follow, max-image-preview:large, max-snippet:-1");
  setMeta('link[rel="canonical"]', "href", url, { tag: "link", attrs: { rel: "canonical" } });
  prop("og:type", "article");
  prop("og:title", base);
  prop("og:description", desc);
  prop("og:url", url);
  if (img) { prop("og:image", img); prop("og:image:width", "1200"); prop("og:image:height", "630"); meta("twitter:image", img); }
  meta("twitter:card", img ? "summary_large_image" : "summary");
  meta("twitter:title", base);
  meta("twitter:description", desc);
  prop("article:published_time", p.firstPublishedDate);
  prop("article:modified_time", p.lastPublishedDate || p.firstPublishedDate);
  prop("article:section", p.cat);

  const org = { "@type": "Organization", "@id": "https://www.yonglo.com/#organization", name: "Yonglo", url: "https://www.yonglo.com", logo: { "@type": "ImageObject", url: `${SITE}/assets/yonglo-logo.png`, width: 512, height: 512 } };
  setJsonLd("ld-post", {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        headline: trimTo(p.title, 110),
        description: desc,
        ...(p.cover ? { image: [wixImg(p.cover.id, 1200, 630), wixImg(p.cover.id, 1200, 900), wixImg(p.cover.id, 1200, 1200)] } : {}),
        datePublished: p.firstPublishedDate,
        dateModified: p.lastPublishedDate || p.firstPublishedDate,
        inLanguage: "nl-NL",
        articleSection: p.cat,
        wordCount: r.words,
        timeRequired: `PT${p.minutesToRead || 1}M`,
        author: org,
        publisher: org,
        isPartOf: { "@type": "Blog", "@id": `${SITE}/nieuws.html#blog`, name: "Yonglo nieuws", url: `${SITE}/nieuws.html` },
        ...(r.videos.length ? {
          video: r.videos.map((v) => ({
            "@type": "VideoObject", name: p.title, description: desc, thumbnailUrl: v.thumb, uploadDate: p.firstPublishedDate,
            embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`, contentUrl: `https://www.youtube.com/watch?v=${v.id}`,
            ...(v.duration ? { duration: `PT${Math.round(v.duration)}S` } : {}),
          })),
        } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Nieuws", item: `${SITE}/nieuws.html` },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ],
      },
    ],
  });

  // Extra structured data die in Wix bij het bericht is ingesteld (bijv. een FAQ) overnemen.
  const own = ["Article", "BlogPosting", "NewsArticle", "Organization", "ImageObject", "WebPage", "BreadcrumbList", "WebSite"];
  seoTags(p).filter((t) => t.type === "script" && /ld\+json/.test(t.props?.type || "")).forEach((t, i) => {
    try { const j = JSON.parse(t.children); if (!own.includes(j["@type"])) setJsonLd(`ld-post-${i}`, j); } catch { /* ongeldige JSON overslaan */ }
  });
}

function share(p) {
  const u = encodeURIComponent(SITE + postUrl(p));
  const t = encodeURIComponent(p.title);
  return `<div class="post-share"><span>Deel dit artikel</span>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener" aria-label="Deel op LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21h-4z"/></svg></a>
        <a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" aria-label="Deel via WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg></a>
        <button type="button" class="post-copy" aria-label="Kopieer de link naar dit artikel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg></button>
      </div>`;
}

function render(p, r) {
  // De samenvatting niet tonen als de tekst er al precies mee begint.
  const norm = (t) => clean(t).toLowerCase().slice(0, 80);
  const dupLead = !!p.excerpt && !!r.firstText && norm(r.firstText).startsWith(norm(p.excerpt).replace(/…$/, "").slice(0, 60));
  const mod = p.lastPublishedDate && ymd(p.lastPublishedDate) !== ymd(p.firstPublishedDate);
  const toc = r.toc.length >= 4
    ? `<nav class="post-toc" aria-labelledby="toc-t"><p class="eyebrow" id="toc-t">In dit artikel</p><ol>${r.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join("")}</ol></nav>`
    : "";
  main.querySelector("[data-post]").innerHTML = `<article class="post">
<section class="hero sub-hero nw-hero post-hero dark">
  <div class="blob b1"></div><div class="blob b2"></div><div class="dots"></div>
  <div class="wrap">
    <nav class="crumbs" aria-label="Kruimelpad"><a href="/">Home</a><span>/</span><a href="/nieuws.html">Nieuws</a><span>/</span><b>${esc(trimTo(p.title, 48))}</b></nav>
    <div class="nw-meta post-meta"><span class="cat">${esc(p.cat)}</span><time datetime="${ymd(p.firstPublishedDate)}">${fmtDate(p.firstPublishedDate)}</time><span>${p.minutesToRead || 1} min leestijd</span></div>
    <h1>${esc(p.title)}</h1>
    ${p.excerpt && !dupLead ? `<p class="lead">${esc(trimTo(p.excerpt, 260))}</p>` : ""}
  </div>
</section>
<section class="light post-main">
  <div class="wrap">
    ${p.cover ? `<figure class="post-cover">${contentImg(p.cover.id, p.cover.w, p.cover.h, p.cover.alt, { eager: true, sizes: "(max-width: 1100px) 92vw, 1040px" })}</figure>` : ""}
    <div class="post-layout">
      ${toc}
      <div class="post-body">${r.html}</div>
      <footer class="post-foot">
        ${mod ? `<p class="post-upd">Bijgewerkt op <time datetime="${ymd(p.lastPublishedDate)}">${fmtDate(p.lastPublishedDate)}</time></p>` : ""}
        ${share(p)}
        <a class="btn btn-ghost" href="/nieuws.html"><i class="arr">←</i> Alle berichten</a>
      </footer>
    </div>
  </div>
</section>
</article>
<section class="light nw-list post-related" aria-labelledby="rel-t" hidden>
  <div class="wrap">
    <h2 id="rel-t">Lees <em>ook</em></h2>
    <div class="nw-grid"></div>
  </div>
</section>`;
  const form = document.querySelector("form.cform");
  if (form) form.dataset.subject = `Contact via blog: ${p.title}`;
}

async function related(p) {
  try {
    const all = (await fetchPosts()).filter((o) => o.slug !== p.slug);
    const pick = [...all.filter((o) => o.cat === p.cat), ...all.filter((o) => o.cat !== p.cat)].slice(0, 3);
    const sec = main.querySelector(".post-related");
    if (!pick.length || !sec) return;
    sec.querySelector(".nw-grid").innerHTML = pick.map((o, i) => card(o, i)).join("");
    sec.hidden = false;
    reveal(sec);
  } catch { /* geen gerelateerde berichten tonen */ }
}

function reveal(root) {
  const els = [...root.querySelectorAll(".rv")];
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

function notFound() {
  meta("robots", "noindex");
  document.title = "Bericht niet gevonden | Yonglo";
  main.querySelector("[data-post]").innerHTML = `<section class="hero sub-hero nw-hero post-hero dark">
  <div class="blob b1"></div><div class="dots"></div>
  <div class="wrap">
    <nav class="crumbs" aria-label="Kruimelpad"><a href="/">Home</a><span>/</span><a href="/nieuws.html">Nieuws</a></nav>
    <h1>Dit bericht bestaat <em>niet (meer)</em>.</h1>
    <p class="lead">Misschien is het verplaatst. Bekijk alle berichten op de nieuwspagina.</p>
    <p class="post-nf"><a class="btn btn-primary" href="/nieuws.html">Naar alle berichten <i class="arr">→</i></a></p>
  </div>
</section>`;
}

// Video's: YouTube pas laden na een klik.
main.addEventListener("click", (e) => {
  const yt = e.target.closest("a.yt[data-yt]");
  if (yt) {
    e.preventDefault();
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${yt.dataset.yt}?autoplay=1&rel=0${yt.dataset.start ? `&start=${yt.dataset.start}` : ""}`;
    f.title = "YouTube-video";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.allowFullscreen = true;
    yt.replaceWith(f);
    return;
  }
  const cp = e.target.closest(".post-copy");
  if (cp && navigator.clipboard) {
    navigator.clipboard.writeText(location.href).then(() => {
      const t = document.querySelector(".toast");
      if (t) { t.textContent = "Link gekopieerd"; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3200); }
    }).catch(() => {});
  }
});

(async () => {
  if (!slug) { location.replace("/nieuws.html"); return; }
  try {
    const p = await fetchPost(slug);
    if (!p) { notFound(); return; }
    const r = renderContent(p);
    setSeo(p, r);
    render(p, r);
    main.setAttribute("aria-busy", "false");
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
    related(p);
  } catch (err) {
    console.error(err);
    main.querySelector("[data-post] .post-loading")?.replaceChildren(Object.assign(document.createElement("p"), {
      innerHTML: 'Dit bericht kon niet geladen worden. <a href="/nieuws.html">Bekijk alle berichten</a>.',
    }));
  }
})();
