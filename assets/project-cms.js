// Projectpagina: /project.html?p=<slug>. Inhoud uit de Wix CMS-collectie "Projecten".
import { fetchProjects, fetchContactpersoon, projectUrl, img, dims, video, esc, themeStyle, galleryOf, paragraphs, kenmerken, hostOf, reveal, loadScript, cardTags } from "./projecten.js";

const main = document.querySelector('[data-cms="project"]');
const slug = new URLSearchParams(location.search).get("p") || "";

function setMeta(p) {
  const title = `${p.title}${p.subkop ? " – " + p.subkop : ""} | Portfolio Yonglo`;
  document.title = title;
  const desc = p.intro || p.kortTekst || `Project van Yonglo voor ${p.title}.`;
  const set = (sel, attr, val) => { const m = document.querySelector(sel); if (m) m.setAttribute(attr, val); };
  set('meta[name="description"]', "content", desc);
  set('meta[property="og:title"]', "content", title);
  set('meta[property="og:description"]', "content", desc);
  const og = img(p.hoofdbeeld, 1200, 630);
  if (og) set('meta[property="og:image"]', "content", og);
  set('link[rel="canonical"]', "href", location.origin + projectUrl(p));
}

function hero(p) {
  const diensten = (p.diensten || []).filter(d => d !== p.platform);
  const meta = [
    diensten.length && ["Diensten", esc(diensten.join(", "))],
    p.platform && ["Platform", esc(p.platform)],
    p.opdrachtgever && ["Opdrachtgever", esc(p.opdrachtgever)],
    p.website && ["Website", `<a href="${esc(p.website)}" target="_blank" rel="noopener" class="ext">${esc(hostOf(p.website) || p.website)} <i>↗</i></a>`],
  ].filter(Boolean);
  return `<section class="hero sub-hero pj-hero dark">
  <div class="blob b1"></div><div class="dots"></div>
  <div class="wrap">
    <nav class="crumbs rv" aria-label="Kruimelpad"><a href="/">Home</a><span>/</span><a href="/portfolio.html">Portfolio</a><span>/</span><b>${esc(p.title)}</b></nav>
    <div class="pj-head">
      <div>
        ${diensten.length ? `<p class="pj-cat rv">${diensten.slice(0, 3).map(esc).join(" <i>|</i> ")}</p>` : ""}
        <h1 class="rv pj-title">${esc(p.title)}</h1>
        ${p.subkop ? `<p class="pj-sub rv" style="--d:.15s">${esc(p.subkop)}</p>` : ""}
      </div>
      ${p.intro ? `<p class="lead rv" style="--d:.25s">${esc(p.intro)}</p>` : ""}
    </div>
    ${meta.length ? `<dl class="pj-meta rv" style="--d:.35s;--n:${meta.length}">${meta.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>` : ""}
  </div>
</section>`;
}

function showcase(p) {
  const hero = !!p.heroImage;
  const src = img(p.heroImage || p.hoofdbeeld, hero ? 2200 : 1800);
  const logo = img(p.logo, 240, 240);
  const host = hostOf(p.website);
  const inner = src
    ? `<img class="show-img${hero ? " banner" : ""}" src="${src}" alt="${esc(p.title)}">`
    : `<div class="bar"><i></i><i></i><i></i>${host ? `<span class="url">${esc(host)}</span>` : ""}</div>
       <div class="show-body"><div class="sb-nav"><b>${esc(p.title)}</b><span><i></i><i></i><i></i><i></i></span></div>
       <div class="sb-hero"><span class="sb-h">${esc(p.subkop || p.branche || p.title)}</span><span class="sb-p"></span><span class="sb-btn"></span></div></div>`;
  return `<section class="pj-show dark" aria-hidden="true">
  <div class="wrap"><div class="show-stage">
    <div class="show-win${src ? " has-img" : ""}">${inner}</div>
    ${logo ? `<div class="show-logo"><img src="${logo}" alt=""></div>` : ""}
  </div></div>
</section>`;
}

function about(p, n) {
  const ps = paragraphs(p.omschrijving);
  if (!ps.length) return "";
  return `<section class="light pj-about">
  <div class="wrap pj-about-grid">
    <div>
      <h2 class="rv">Over <em>${esc(p.title)}</em></h2>
    </div>
    <div class="pj-text">${ps.map((t, i) => `<p class="rv" style="--d:${i * 0.08}s">${esc(t)}</p>`).join("")}</div>
  </div>
</section>`;
}

function feats(p, n) {
  const ks = kenmerken(p.kenmerken);
  if (!ks.length && !p.sectieKop) return "";
  return `<section class="light pj-feats">
  <div class="wrap">
    <div class="sec-head">
      ${p.sectieKop ? `<h2 class="rv">${esc(p.sectieKop)}</h2>` : ""}
      ${p.sectieTekst ? `<p class="rv sub">${esc(p.sectieTekst)}</p>` : ""}
    </div>
    ${ks.length ? `<div class="pf-grid">${ks.map((k, i) => `<article class="pfeat rv" style="--d:${i * 0.08}s"><h3>${esc(k.t)}</h3>${k.d ? `<p>${esc(k.d)}</p>` : ""}</article>`).join("")}</div>` : ""}
    ${p.quote ? `<blockquote class="pj-quote rv"><p>${esc(p.quote)}</p></blockquote>` : ""}
  </div>
</section>`;
}

function devices(p) {
  const page = img(p.homepage, 1440);
  const vid = video(p.mobileScrollVideo);
  if (!page && !vid) return "";
  return `<div class="wrap"><div class="devices${page ? "" : " only-phone"}${vid ? "" : " only-desk"}">
    ${page ? `<figure class="dev-desk rv"><div class="bar"><i></i><i></i><i></i>${p.website ? `<span class="url">${esc(hostOf(p.website))}</span>` : ""}</div><div class="dev-screen" tabindex="0" aria-label="Homepage van ${esc(p.title)}, scrollbaar"><img src="${page}" alt="Homepage van ${esc(p.title)}" loading="lazy" draggable="false"></div><span class="dev-hint" aria-hidden="true">↕ Scroll door de pagina</span></figure>` : ""}
    ${vid ? `<figure class="dev-phone rv" style="--d:.15s"><video src="${vid.src}"${vid.poster ? ` poster="${vid.poster}"` : ""} muted loop playsinline autoplay preload="metadata" aria-label="Mobiele website van ${esc(p.title)}"></video></figure>` : ""}
  </div></div>`;
}

function gallery(p, n) {
  const g = galleryOf(p).slice(0, 3);
  const dev = devices(p);
  if (!g.length && !dev) return "";
  const shots = g.map(s => img(s.src, 1000)).filter(Boolean);
  return `<section class="dark pj-gallery">
  <div class="wrap gal-head">
    <div>
      <h2 class="rv">Sterk op elk <em>scherm</em>.</h2>
    </div>
  </div>
  ${dev}
  ${shots.length ? `<div class="wrap"><div class="gal-grid n${shots.length}">${shots.map((src, i) => `<figure class="gshot rv" style="--d:${i * 0.08}s"><img src="${src}" alt="${esc(p.title)} – afbeelding ${i + 1}" loading="lazy"></figure>`).join("")}</div></div>` : ""}
</section>`;
}
function contact(p, n, cp) {
  const naam = (cp && cp.title) || "Marko";
  const functie = (cp && cp.functie) || "Founder & CEO Yonglo";
  const foto = (cp && cp.foto && img(cp.foto, 128, 128, "c")) || "/assets/marko.webp";
  const mail = (cp && cp.email) || "contact@yonglo.com";
  const tel = (cp && cp.telefoon) || "085 20 33 223";
  const telHref = "+31" + tel.replace(/\D/g, "").replace(/^0/, "");
  return `<section class="contact dark pj-contact" id="contact">
  <div class="cta-grad"></div>
  <div class="wrap contact-grid">
    <div>
      <h2 class="rv">Contact opnemen over een <em>vergelijkbaar</em> project?</h2>
      <div class="person rv"><span class="avatar"><img src="${esc(foto)}" alt="${esc(naam)}" width="64" height="64"></span><div><b>${esc(naam)} helpt je graag verder</b><span>${esc(functie)}</span></div></div>
      <div class="direct rv">
        <a href="mailto:${esc(mail)}" class="dline copy" data-copy="${esc(mail)}"><span>E-mail</span><b>${esc(mail)}</b></a>
        <a href="tel:${esc(telHref)}" class="dline"><span>Telefoon</span><b>${esc(tel)}</b></a>
      </div>
      <a href="/portfolio.html" class="btn btn-ghost rv back">← Naar portfolio</a>
    </div>
    <form class="cform rv" data-to="${esc(mail)}" data-subject="Vergelijkbaar project als ${esc(p.title)} (t.a.v. ${esc(naam)})">
      <fieldset class="chips">
        <legend>Waar denk je aan?</legend>
        <label><input type="radio" name="project" value="Nieuwe website" checked><span>Nieuwe website</span></label>
        <label><input type="radio" name="project" value="Website + development"><span>Website + development</span></label>
        <label><input type="radio" name="project" value="Redesign"><span>Redesign</span></label>
      </fieldset>
      <label class="fl"><input type="text" name="naam" placeholder=" " required><span>Wat is je naam?</span></label>
      <label class="fl"><input type="email" name="email" placeholder=" " required><span>Hoe kunnen we je bereiken?</span></label>
      <label class="fl"><textarea name="bericht" rows="3" placeholder=" " required></textarea><span>Vertel kort over je project</span></label>
      <button class="btn btn-primary wide magnetic">Neem contact op <i class="arr">→</i></button>
      <p class="fnote">Je mailprogramma opent met je bericht klaar om te versturen.</p>
    </form>
  </div>
</section>`;
}

function more(p, all, n) {
  const i = all.findIndex(x => x.slug === p.slug);
  const others = all.filter(x => x.slug !== p.slug);
  if (!others.length) return "";
  const next = all[(i + 1) % all.length];
  // Drie andere projecten uit het CMS: eerst projecten met dezelfde diensten en een afbeelding,
  // daarna de volgende projecten in de CMS-volgorde.
  const mine = cardTags(p, 9);
  const order = others.map((x, k) => ({ x, d: (all.indexOf(x) - i + all.length) % all.length }));
  const score = x => (x.portfolioImage || x.hoofdbeeld ? 2 : 0) + cardTags(x, 9).filter(t => mine.includes(t)).length;
  const pick = order.sort((a, b) => score(b.x) - score(a.x) || a.d - b.d).slice(0, 3).map(o => o.x);
  return `<section class="light pj-more">
  <div class="wrap">
    <div class="sec-head row-head">
      <div>
        <h2 class="rv">Bekijk ook onze andere <em>projecten</em>.</h2>
      </div>
      <a href="/portfolio.html" class="btn btn-dark rv">Naar portfolio <i class="arr">→</i></a>
    </div>
    <div class="more-grid">${pick.map((x, j) => {
      const pf = !!x.portfolioImage;
      const src = pf ? img(x.portfolioImage, 800, 600, "c") : img(x.hoofdbeeld, 800, 600);
      const tags = cardTags(x, 2).join(" · ");
      return `<a href="${projectUrl(x)}" class="mcard rv" style="--d:${j * 0.08}s;${themeStyle(x)}"><div class="mc-vis${src ? " has-img" : ""}${pf ? " pf" : ""}">${src ? `<img src="${src}" alt="${esc(x.title)}" loading="lazy">` : `<b>${esc(x.title)}</b>`}</div>${x.branche ? `<span class="pc-br">${esc(x.branche)}</span>` : ""}<h3>${esc(x.title)}</h3>${tags ? `<p class="mc-tags">${esc(tags)}</p>` : ""}</a>`;
    }).join("")}</div>
  </div>
  ${next && next.slug !== p.slug ? `<a href="${projectUrl(next)}" class="next-band"><span>Volgend project</span><b>${esc(next.title)} <i>→</i></b></a>` : ""}
</section>`;
}

// Maakt de witte achtergrond rond de telefoon in de mobiele video transparant.
// Op basis van de poster wordt eenmalig een masker berekend (vlakvulling vanaf de randen
// over lichte, kleurloze pixels); dat masker gaat als CSS-mask over de video.
function keyPhone(videoEl) {
  const posterUrl = videoEl && videoEl.getAttribute("poster");
  if (!posterUrl) return;
  const im = new Image();
  im.crossOrigin = "anonymous";
  im.onload = () => {
    try {
      const W = 320, H = Math.round(320 * im.naturalHeight / im.naturalWidth);
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(im, 0, 0, W, H);
      const px = ctx.getImageData(0, 0, W, H);
      const d = px.data, n = W * H;
      const light = new Uint8Array(n), seen = new Uint8Array(n), lum = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
        const L = (r * 299 + g * 587 + b * 114) / 1000;
        lum[i] = L;
        light[i] = L > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 28 ? 1 : 0;
      }
      const stack = [];
      const push = i => { if (!seen[i] && light[i]) { seen[i] = 1; stack.push(i); } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (stack.length) {
        const i = stack.pop(), x = i % W, y = (i - x) / W;
        if (x > 0) push(i - 1);
        if (x < W - 1) push(i + 1);
        if (y > 0) push(i - W);
        if (y < H - 1) push(i + W);
      }
      let outside = 0;
      for (let i = 0; i < n; i++) {
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0;
        if (seen[i]) { outside++; d[i * 4 + 3] = Math.max(0, Math.min(255, (205 - lum[i]) * 4)); }
        else d[i * 4 + 3] = 255;
      }
      // Alleen toepassen als er echt een witte rand is (anders niets doen).
      if (outside < n * 0.05) return;
      ctx.putImageData(px, 0, 0);
      const url = `url(${c.toDataURL("image/png")})`;
      videoEl.style.webkitMaskImage = url;
      videoEl.style.maskImage = url;
      videoEl.style.webkitMaskSize = "100% 100%";
      videoEl.style.maskSize = "100% 100%";
      videoEl.classList.add("keyed");
    } catch (e) {
      /* poster niet leesbaar (CORS): video blijft zoals hij is */
    }
  };
  im.src = posterUrl;
}
function notFound() {
  document.title = "Project niet gevonden | Yonglo";
  main.innerHTML = `<section class="hero sub-hero pj-hero dark"><div class="blob b1"></div><div class="dots"></div>
  <div class="wrap pj-missing"><nav class="crumbs" aria-label="Kruimelpad"><a href="/">Home</a><span>/</span><a href="/portfolio.html">Portfolio</a></nav>
  <h1>Dit project bestaat niet (meer).</h1><p class="lead">Bekijk al ons werk in het portfolio.</p>
  <a href="/portfolio.html" class="btn btn-primary">Naar portfolio <i class="arr">→</i></a></div></section>`;
}

function failed() {
  main.innerHTML = `<section class="hero sub-hero pj-hero dark"><div class="blob b1"></div><div class="dots"></div>
  <div class="wrap pj-missing"><h1>Het project kon niet worden geladen.</h1><p class="lead">Ververs de pagina of probeer het later nog eens.</p>
  <a href="/portfolio.html" class="btn btn-primary">Naar portfolio <i class="arr">→</i></a></div></section>`;
}

// app.js (menu, formulieren, animaties) en project.js (galerij) laden pas na het renderen,
// zodat ze ook de net toegevoegde inhoud oppakken.
let rendered = false;
try {
  const all = await fetchProjects();
  const p = all.find(x => x.slug === slug);
  if (!p) notFound();
  else {
    setMeta(p);
    main.setAttribute("style", themeStyle(p));
    let k = 0;
    const num = () => String(++k).padStart(2, "0");
    const parts = [hero(p), showcase(p)];
    const a = about(p, "@"); if (a) parts.push(about(p, num()));
    const f = feats(p, "@"); if (f) parts.push(feats(p, num()));
    const g = gallery(p, "@"); if (g) parts.push(gallery(p, num()));
    let cp = null;
    try { cp = await fetchContactpersoon(p.contactpersoon); } catch (e) { console.error(e); }
    parts.push(contact(p, num(), cp));
    parts.push(more(p, all, num()));
    main.innerHTML = parts.join("\n");
    main.removeAttribute("aria-busy");
    rendered = true;
    keyPhone(main.querySelector(".dev-phone video"));
  }
} catch (e) {
  console.error(e);
  failed();
}
main.removeAttribute("aria-busy");
await loadScript("/assets/app.js");
if (rendered) await loadScript("/assets/project.js");
reveal(main);
