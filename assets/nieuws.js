// Nieuwspagina: berichten live uit Wix Blog (nieuwe berichten staan er meteen op) + filteren op onderwerp.
// De berichten die al in de HTML staan blijven zichtbaar als Wix (even) niet bereikbaar is.
import { fetchPosts, card, CAT_ORDER, esc, wixImg, setJsonLd } from "./blog.js";

const wrap = document.querySelector("#berichten .wrap");

function applyFilter(f) {
  document.querySelectorAll(".nw-chip").forEach((c) => {
    const on = c.dataset.f === f;
    c.classList.toggle("on", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.querySelectorAll(".nw-feat, .nw-card").forEach((el) => {
    el.hidden = !(f === "Alles" || el.dataset.cat === f);
  });
}

document.addEventListener("click", (e) => {
  const b = e.target.closest(".nw-chip");
  if (b) applyFilter(b.dataset.f);
});

function reveal(root) {
  const els = [...root.querySelectorAll(".rv")];
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

async function load() {
  if (!wrap) return;
  let posts;
  try { posts = await fetchPosts(); } catch (err) { console.warn("Nieuws: Wix Blog niet bereikbaar, vaste lijst blijft staan.", err); return; }
  if (!posts.length) return;
  const active = document.querySelector(".nw-chip.on")?.dataset.f || "Alles";
  const cats = CAT_ORDER.filter((c) => posts.some((p) => p.cat === c))
    .concat([...new Set(posts.map((p) => p.cat))].filter((c) => !CAT_ORDER.includes(c)));
  const [first, ...rest] = posts;
  wrap.innerHTML = `${card(first, 0, { feat: true, h: "h2" })}
    <div class="nw-bar rv in" role="group" aria-label="Filter op onderwerp">${["Alles", ...cats].map((c) => `<button type="button" class="nw-chip" data-f="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join("")}</div>
    <div class="nw-grid">${rest.map((p, i) => card(p, i)).join("")}</div>`;
  applyFilter(cats.includes(active) ? active : "Alles");
  reveal(wrap);

  // Structured data met de actuele lijst berichten.
  const SITE = location.origin;
  setJsonLd("ld-blog", {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE}/nieuws.html#blog`,
    name: "Yonglo nieuws",
    url: `${SITE}/nieuws.html`,
    inLanguage: "nl-NL",
    publisher: { "@type": "Organization", "@id": "https://www.yonglo.com/#organization", name: "Yonglo", url: "https://www.yonglo.com" },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title.slice(0, 110),
      url: `${SITE}/post/${encodeURIComponent(p.slug)}`,
      datePublished: p.firstPublishedDate,
      dateModified: p.lastPublishedDate || p.firstPublishedDate,
      ...(p.cover ? { image: wixImg(p.cover.id, 1200, 630) } : {}),
    })),
  });
}

load();
