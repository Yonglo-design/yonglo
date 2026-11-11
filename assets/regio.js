// Regiopagina's (werkgebied): één pagina per plaats, provincie, land of stad, op dezelfde adressen als op de
// oude yonglo.com. De teksten komen uit de Wix CMS-collecties (Wix-dashboard → CMS):
//   LandingNl      → /wix-website/<plaats>              Nederlands (je-vorm)
//   LandingBe      → /wix-websites/<plaats>             Nederlands voor België (u-vorm)
//   LandingEurope  → /wix-expert/<land>                 Engels
//   LandingCities  → /wix-design-development/<stad>     Engels
// De vaste teksten tussen de CMS-velden staan hieronder. Gebruikt door src/regio.ts.
import { img, esc, projectUrl, themeStyle, cardTags } from "./projecten.js";

export const SOORTEN = {
  nl: { collectie: "LandingNl", basis: "/wix-website", taal: "nl", u: false, naam: (x) => x.title },
  be: { collectie: "LandingBe", basis: "/wix-websites", taal: "nl", u: true, naam: (x) => x.title },
  land: { collectie: "LandingEurope", basis: "/wix-expert", taal: "en", naam: (x) => x.country || x.title },
  stad: { collectie: "LandingCities", basis: "/wix-design-development", taal: "en", naam: (x) => x.city || x.title },
};

// Provincies (voor het overzicht: provincies apart van steden).
export const PROVINCIES = new Set(["noord-holland", "zuid-holland", "noord-brabant", "gelderland", "flevoland", "overijssel", "drenthe", "friesland", "limburg", "zeeland"]);

const LETTERS = { "ł": "l", "ø": "o", "æ": "ae", "œ": "oe", "ß": "ss", "đ": "d", "ð": "d", "þ": "th", "ı": "i" };
export const slugify = (s) => String(s || "").toLowerCase().replace(/[łøæœßđðþı]/g, (c) => LETTERS[c]).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
// Oude adressen met verminkte bijzondere letters (uit de vorige site).
export const REGIO_ALIASES = { "todz": "lodz", "odz": "lodz", "wroctaw": "wroclaw", "wroc-aw": "wroclaw", "midddelburg": "middelburg", "utecht": "utrecht" };
export const regioUrl = (soort, x) => `${SOORTEN[soort].basis}/${encodeURIComponent(x.slug)}`;

// Zet de plaatsnaam in een kop in <em> (blauw accent), de rest blijft gewone tekst.
function accent(kop, naam) {
  const k = esc(kop || ""), n = esc(naam || "");
  const i = n ? k.lastIndexOf(n) : -1;
  return i < 0 ? k : `${k.slice(0, i)}<em>${n}</em>${k.slice(i + n.length)}`;
}
const alineas = (t) => String(t || "").split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean).map((s) => `<p>${esc(s)}</p>`).join("");
const vinkjes = (lijst) => `<ul class="rg-checks">${lijst.map((x) => `<li>${x}</li>`).join("")}</ul>`;
const ICON = {
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  hand: '<path d="M9 11V5a2 2 0 0 1 4 0v6"/><path d="M13 10V4a2 2 0 0 1 4 0v8"/><path d="M9 11.5V9a2 2 0 0 0-4 0v5a7 7 0 0 0 14 0v-2a2 2 0 0 0-4 0"/>',
  zoek: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  beheer: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  groei: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  ster: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>',
  winkel: '<path d="M4 7h16l-1.5 9a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  schild: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  snel: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  mobiel: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
};
const ico = (n) => `<span class="rg-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg></span>`;

// ---------------------------------------------------------------- kop
function kop({ crumbs, eyebrow, h1, lead, sub, knoppen, ticks, naam, en, soortLabel }) {
  return `<section class="hero sub-hero dark rg-hero">
  <div class="blob b1"></div><div class="blob b2"></div><div class="dots"></div>
  <div class="wrap hero-grid">
    <div class="hero-txt">
      <nav class="crumbs rv" aria-label="${en ? "Breadcrumb" : "Kruimelpad"}">${crumbs.map(([t, h], i) => (h ? `<a href="${h}">${esc(t)}</a>` : `<b>${esc(t)}</b>`) + (i < crumbs.length - 1 ? "<span>/</span>" : "")).join("")}</nav>
      <p class="eyebrow rv">${esc(eyebrow)}</p>
      <h1 class="rv rg-title">${h1}</h1>
      ${sub ? `<p class="rg-sub rv" style="--d:.15s">${esc(sub)}</p>` : ""}
      <p class="lead rv" style="--d:.25s">${esc(lead)}</p>
      <div class="hero-btns rv" style="--d:.35s">${knoppen}</div>
      <ul class="hero-ticks rv" style="--d:.45s">${ticks.map((t) => `<li>${t}</li>`).join("")}</ul>
    </div>
    <div class="build rg-vis" aria-hidden="true">
      <div class="rg-map">
        <div class="rg-rings"><i></i><i></i><i></i></div>
        <div class="rg-pin">${ico("pin")}</div>
        <div class="rg-place"><small>${esc(soortLabel)}</small><b>${esc(naam)}</b></div>
        <dl class="rg-kpis">
          <div><dt>${en ? "Wix websites built" : "Wix-websites gebouwd"}</dt><dd>750+</dd></div>
          <div><dt>${en ? "Years of Wix experience" : "Jaar Wix-ervaring"}</dt><dd>18</dd></div>
          <div><dt>${en ? "Average review score" : "Gemiddelde reviewscore"}</dt><dd>5,0<small>★</small></dd></div>
        </dl>
      </div>
      <span class="chip c1">✓ ${en ? "Official Wix Partner" : "Officiële Wix Partner"}</span>
      <span class="chip c2">★ Wix Studio</span>
    </div>
  </div>
</section>`;
}

// ---------------------------------------------------------------- blokken
function kaarten(titel, sub, items, { donker = false, klasse = "" } = {}) {
  return `<section class="${donker ? "dark" : "light"} rg-feats ${klasse}">
  ${donker ? '<div class="blob b3"></div>' : ""}
  <div class="wrap">
    <div class="sec-head split-head">
      <div><h2 class="rv">${titel}</h2></div>
      ${sub ? `<div class="rv sub" style="--d:.1s">${sub}</div>` : ""}
    </div>
    <div class="rg-grid n${items.length}">${items.map(([i, t, d], k) => `<article class="rg-card rv" style="--d:${k * 0.07}s">${ico(i)}<h3>${t}</h3><p>${d}</p></article>`).join("")}</div>
  </div>
</section>`;
}

function duo(links, rechts) {
  const kolom = ([titel, tekst, lijst, slot]) => `<article class="rg-duo-c rv">
    <h2>${titel}</h2>${tekst}${lijst ? vinkjes(lijst) : ""}${slot || ""}
  </article>`;
  return `<section class="light rg-duo"><div class="wrap rg-duo-grid">${kolom(links)}${kolom(rechts)}</div></section>`;
}

function band(titel, tekst, knop) {
  return `<section class="light rg-band"><div class="wrap"><div class="rg-band-card rv">
    <div><h2>${titel}</h2><p>${esc(tekst)}</p></div>
    ${knop}
  </div></div></section>`;
}

function projecten(lijst, en) {
  if (!lijst.length) return "";
  return `<section class="light pj-more rg-projects">
  <div class="wrap">
    <div class="sec-head row-head">
      <div><h2 class="rv">${en ? "Some of our <em>work</em>." : "Een greep uit ons <em>werk</em>."}</h2></div>
      <a href="${en ? "/en" : ""}/portfolio" class="btn btn-dark rv">${en ? "View portfolio" : "Bekijk portfolio"} <i class="arr">→</i></a>
    </div>
    <div class="more-grid">${lijst.slice(0, 3).map((x, j) => {
      const pf = !!x.portfolioImage;
      const src = pf ? img(x.portfolioImage, 800, 600, "c") : img(x.hoofdbeeld, 800, 600);
      const tags = cardTags(x, 2).join(" · ");
      return `<a href="${projectUrl(x)}" class="mcard rv" style="--d:${j * 0.08}s;${themeStyle(x)}"><div class="mc-vis${src ? " has-img" : ""}${pf ? " pf" : ""}">${src ? `<img src="${src}" alt="${esc(x.title)}" loading="lazy">` : `<b>${esc(x.title)}</b>`}</div>${x.branche ? `<span class="pc-br">${esc(x.branche)}</span>` : ""}<h3>${esc(x.title)}</h3>${tags ? `<p class="mc-tags">${esc(tags)}</p>` : ""}</a>`;
    }).join("")}</div>
  </div>
</section>`;
}

function ookActief(titel, lijst, alleLink, alleTekst) {
  if (!lijst.length) return "";
  return `<section class="light rg-also">
  <div class="wrap">
    <div class="sec-head row-head">
      <div><h2 class="rv">${titel}</h2></div>
      <a href="${alleLink}" class="btn btn-dark rv">${alleTekst} <i class="arr">→</i></a>
    </div>
    <ul class="rg-chips rv">${lijst.map(([t, h]) => `<li><a href="${h}">${ico("pin")}${esc(t)}</a></li>`).join("")}</ul>
  </div>
</section>`;
}

function contact({ titel, tekst, onderwerp, en, u }) {
  const T = (nl, e) => (en ? e : nl);
  return `<section class="contact light" id="contact">
  <div class="cta-grad"></div>
  <div class="wrap contact-grid">
    <div>
      <h2 class="rv">${titel}</h2>
      ${tekst ? `<div class="rv rg-contact-txt">${tekst}</div>` : ""}
      <div class="direct rv">
        <a href="mailto:contact@yonglo.com" class="dline copy" data-copy="contact@yonglo.com"><span>${T("E-mail", "Email")}</span><b>contact@yonglo.com</b></a>
        <a href="tel:+31852033223" class="dline"><span>${T("Telefoon", "Phone")}</span><b>${en ? "+31 85 20 33 223" : "085 20 33 223"}</b></a>
        <a href="https://wa.me/31638148565" class="dline" target="_blank" rel="noopener"><span>WhatsApp</span><b>${T(u ? "App ons direct" : "App ons direct", "Message us directly")}</b></a>
      </div>
    </div>
    <form class="cform rv" data-subject="${esc(onderwerp)}">
      <fieldset class="chips">
        <legend>${T(u ? "Waar denkt u aan?" : "Waar denk je aan?", "What do you have in mind?")}</legend>
        <label><input type="radio" name="wens" value="${T("Nieuwe website", "New website")}" checked><span>${T("Nieuwe website", "New website")}</span></label>
        <label><input type="radio" name="wens" value="Wix Studio"><span>Wix Studio</span></label>
        <label><input type="radio" name="wens" value="${T("Website verbeteren", "Improve my website")}"><span>${T("Website verbeteren", "Improve my website")}</span></label>
        <label><input type="radio" name="wens" value="SEO"><span>SEO</span></label>
      </fieldset>
      <label class="fl"><input type="text" name="naam" placeholder=" " required><span>${T(u ? "Wat is uw naam?" : "Wat is je naam?", "What is your name?")}</span></label>
      <label class="fl"><input type="email" name="email" placeholder=" " required><span>${T(u ? "Hoe kunnen we u bereiken?" : "Hoe kunnen we je bereiken?", "How can we reach you?")}</span></label>
      <label class="fl"><input type="url" name="website" placeholder=" "><span>${T("Huidige website (optioneel)", "Current website (optional)")}</span></label>
      <label class="fl"><textarea name="bericht" rows="3" placeholder=" " required></textarea><span>${T(u ? "Vertel kort over uw plannen" : "Vertel kort over je plannen", "Tell us briefly about your plans")}</span></label>
      <button class="btn btn-primary wide">${T("Plan een kennismaking", "Book a free consultation")} <i class="arr">→</i></button>
      <p class="fnote">${T(u ? "Na het versturen nemen we zo snel mogelijk contact met u op." : "Na het versturen nemen we zo snel mogelijk contact met je op.", "After sending, we'll get in touch as soon as possible.")}</p>
    </form>
  </div>
</section>`;
}

// ---------------------------------------------------------------- Nederland en België
export function paginaNl(x, soort, { projecten: pj, anderen }) {
  const u = SOORTEN[soort].u;
  const J = (je, uu) => (u ? uu : je);
  const p = esc(x.title);
  const land = soort === "be" ? "België" : "Nederland";
  const h1 = x.koptekst || x.koptext || `Dé Wix Expert voor ${x.title}`;
  return [
    kop({
      crumbs: [["Home", "/"], ["Werkgebied", "/wix-website"], [x.title]],
      eyebrow: `Wix webdesign · ${x.title}`,
      h1: accent(h1, x.title),
      lead: J(
        `Heb je hulp nodig bij het maken van een professionele Wix- of Wix Studio-website, of wil je het maximale uit je Wix-website halen? Neem dan contact op met Yonglo. We think Wix.`,
        `Heeft u hulp nodig bij het maken van een professionele Wix- of Wix Studio-website, of wilt u het maximale uit uw Wix-website halen? Neem dan contact op met Yonglo. We think Wix.`),
      knoppen: `<a href="#contact" class="btn btn-primary">Plan een kennismaking <i class="arr">→</i></a><a href="/portfolio" class="btn btn-ghost">Bekijk portfolio</a>`,
      ticks: ["Officiële Wix Partner", "18 jaar ervaring", "Snel, vindbaar en op maat"],
      naam: x.title, en: false, soortLabel: `${PROVINCIES.has(x.slug) ? "Provincie" : "Werkgebied"} · ${land}`,
    }),
    kaarten(accent(x.text17 || `Het beste webdesign platform in ${x.title}`, x.title), `<p>${J("Wil je zonder technische kennis een professionele website (laten) maken? Wix is hét ideale webdesign platform.", "Wilt u zonder technische kennis een professionele website (laten) maken? Wix is hét ideale webdesign platform.")}</p>`, [
      ["hand", "Gebruiksvriendelijk", J("Met de intuïtieve websitebouwer maak en beheer je moeiteloos een prachtige website, zonder programmeerkennis. Dat bespaart tijd, zodat jij je kunt richten op je bedrijf.", "Met de intuïtieve websitebouwer maakt en beheert u moeiteloos een prachtige website, zonder programmeerkennis. Dat bespaart tijd, zodat u zich kunt richten op uw bedrijf.")],
      ["zoek", "Wix en SEO", J("Wix heeft krachtige SEO-tools om je website te optimaliseren voor Google. Zo trek je meer bezoekers en vergroot je je bereik bij potentiële klanten.", "Wix heeft krachtige SEO-tools om uw website te optimaliseren voor Google. Zo trekt u meer bezoekers en vergroot u uw bereik bij potentiële klanten.")],
      ["beheer", "Eenvoudig beheer", J("Geen zorgen over techniek: hosting, beveiliging en updates zijn geregeld, zodat je website altijd soepel en professioneel draait.", "Geen zorgen over techniek: hosting, beveiliging en updates zijn geregeld, zodat uw website altijd soepel en professioneel draait.")],
      ["groei", "Samen naar online succes", J(`Samen met Yonglo bouw je snel en betaalbaar een professionele website die meegroeit met je bedrijf in ${p} en omgeving.`, `Samen met Yonglo bouwt u snel en betaalbaar een professionele website die meegroeit met uw bedrijf in ${p} en omgeving.`)],
    ]),
    kaarten(accent(x.text22 || `Versterk je online aanwezigheid in ${x.title}`, x.title),
      `<p>${J(`Ben je als ondernemer in ${p} op zoek naar een krachtige online aanwezigheid? Yonglo ontwerpt en ontwikkelt Wix- en Wix Studio-websites die opvallen en je bedrijf laten groeien.`, `Bent u als ondernemer in ${p} op zoek naar een krachtige online aanwezigheid? Yonglo ontwerpt en ontwikkelt Wix- en Wix Studio-websites die opvallen en uw bedrijf laten groeien.`)}</p>`, [
      ["ster", "Gecertificeerde Wix Partner", "Yonglo is officieel Wix Partner met 18 jaar ervaring en meer dan 750 gebouwde Wix-websites. Ons portfolio laat zien waar we goed in zijn."],
      ["code", "Maatwerk & development", J("Elk bedrijf is anders. Daarom bouwen we in Wix en Wix Studio precies wat jij nodig hebt, van koppelingen tot complete webshops.", "Elk bedrijf is anders. Daarom bouwen we in Wix en Wix Studio precies wat u nodig heeft, van koppelingen tot complete webshops.")],
      ["groei", "Conversiegericht design", "Een mooie website is het begin. We ontwerpen zo dat bezoekers klant worden: heldere pagina's, sterke teksten en duidelijke knoppen."],
    ], { donker: true }),
    duo(
      [accent(x.text3 || "Een Wix-website die goed scoort in Google", ""), `<p>${J("Wil je een professionele Wix-website die niet alleen mooi is, maar ook hoog scoort in Google? Wij bouwen SEO-geoptimaliseerde websites voor meer zichtbaarheid, meer bezoekers en meer klanten.", "Wilt u een professionele Wix-website die niet alleen mooi is, maar ook hoog scoort in Google? Wij bouwen SEO-geoptimaliseerde websites voor meer zichtbaarheid, meer bezoekers en meer klanten.")}</p>`,
        [J("SEO-experts: we optimaliseren je website voor Google", "SEO-experts: we optimaliseren uw website voor Google"), "Snel en gebruiksvriendelijk, op desktop en mobiel", J("Maatwerk, helemaal afgestemd op je bedrijf", "Maatwerk, helemaal afgestemd op uw bedrijf"), "Conversiegericht design: meer leads en klanten"],
        `<a href="/seo" class="btn btn-ghost">Meer over SEO <i class="arr">→</i></a>`],
      [accent(x.text42 || `Dé expert in Wix Studio-websites voor ${x.title}`, x.title), `<p>${J(`Op zoek naar een ervaren specialist in Wix Studio in ${p}? Wij ontwerpen en ontwikkelen professionele Wix Studio-websites die er geweldig uitzien én uitstekend presteren.`, `Op zoek naar een ervaren specialist in Wix Studio in ${p}? Wij ontwerpen en ontwikkelen professionele Wix Studio-websites die er geweldig uitzien én uitstekend presteren.`)}</p>`,
        ["Officiële Wix Partner met jarenlange ervaring", "SEO-geoptimaliseerde Wix Studio-websites", J("Maatwerkdesign en functies afgestemd op jouw wensen", "Maatwerkdesign en functies afgestemd op uw wensen"), "Snel, professioneel en conversiegericht"],
        `<a href="/wix" class="btn btn-ghost">Meer over Wix Studio <i class="arr">→</i></a>`]),
    band(accent(x.text5 || `Wix Optimaal voor ${x.title}`, x.title), x.text62 || J(`Heb je al een Wix-website in ${x.title} maar ben je niet 100% tevreden? Kies dan voor ons Wix Optimaal pakket.`, `Heeft u al een Wix-website in ${x.title} maar bent u niet 100% tevreden? Kies dan voor ons Wix Optimaal pakket.`),
      `<a href="/optimaal" class="btn btn-primary">Bekijk Wix Optimaal <i class="arr">→</i></a>`),
    projecten(pj, false),
    ookActief(`Ook actief in <em>${land === "België" ? "België" : "heel Nederland"}</em>.`, anderen.map((a) => [a.title, regioUrl(soort, a)]), "/wix-website", "Heel ons werkgebied"),
    contact({
      titel: `Een Wix-website laten maken in <em>${p}</em>?`,
      tekst: `<p>${J("Neem vandaag nog contact op en ontdek wat Yonglo voor jou kan betekenen. Liever direct contact? App of bel ons.", "Neem vandaag nog contact op en ontdek wat Yonglo voor u kan betekenen. Liever direct contact? App of bel ons.")}</p>`,
      onderwerp: `Wix-website ${x.title}: aanvraag via yonglo.com`, en: false, u,
    }),
  ].join("\n");
}

// ---------------------------------------------------------------- Europa: landen
export function paginaLand(x, { projecten: pj, anderen }) {
  const c = x.country || x.title;
  const cs = esc(c);
  return [
    kop({
      crumbs: [["Home", "/en"], ["Regions", "/wix-expert"], [c]],
      eyebrow: `Wix web design · ${c}`,
      h1: accent(x.koptekst1 || `Yonglo: Wix website specialists for ${c}`, c),
      sub: x.subkop1,
      lead: x.introTekst1 || "",
      knoppen: `<a href="#contact" class="btn btn-primary">Book a free consultation <i class="arr">→</i></a><a href="/en/portfolio" class="btn btn-ghost">View portfolio</a>`,
      ticks: ["Official Wix Partner", "18 years of experience", "Design, development & SEO"],
      naam: c, en: true, soortLabel: "Country · Europe",
    }),
    duo(
      [accent(x.koptekst2 || `Why partner with Yonglo for your Wix site in ${c}?`, c), `<p>${esc(x.introtekst2 || "")}</p>`,
        ["Official Wix Partner & Wix Studio Expert", "Unique designs aligned with your brand identity", "SEO optimisation", "Responsive and mobile-first websites", "Fast, secure and easy to manage"],
        x.tekst2 ? `<p class="rg-note">${esc(x.tekst2)}</p>` : ""],
      [accent(x.koptekst5 || `Your Wix specialists for ${c}`, ""), `<p>${esc(x.introtekst5 || "")}</p><p>Our approach goes beyond a visually appealing design. We build websites that are user-friendly, fast and fully SEO-optimised, so your business ranks higher on Google, and we make your Wix website conversion-focused, turning visitors into customers.</p>`,
        null, `<a href="/en/portfolio" class="btn btn-ghost">View our work <i class="arr">→</i></a>`]),
    kaarten(accent(x.koptekst3 || `Why Wix is the smart choice for businesses in ${c}`, c), `<p>${esc(x.introtekst3 || "")}</p>`, [
      ["pen", "User-friendly CMS", "Update texts, images and products yourself, without any technical knowledge."],
      ["hand", "Complete design freedom", "With Wix Studio we design pixel-perfect pages that match your brand exactly."],
      ["mobiel", "Responsive design", "Every page looks and works perfectly on desktop, tablet and mobile."],
      ["zoek", "SEO-friendly", "Built-in SEO tools and clean code help you rank higher in Google."],
      ["snel", "Fast performance", "Fast hosting and optimised pages for a smooth experience for every visitor."],
    ], { donker: true }) + (x.tekst3 ? `<section class="dark rg-cities"><div class="wrap"><p class="rv">${esc(x.tekst3)}</p><a href="#contact" class="btn btn-primary rv">Request a quote <i class="arr">→</i></a></div></section>` : ""),
    kaarten(accent(x.koptekst4 || `Everything your ${c} website needs, under one roof`, c), `<p>We offer a complete range of professional Wix services.</p>`, [
      ["pen", "Web design", `Custom Wix and Wix Studio websites, designed around your brand and your customers in ${cs}.`],
      ["code", "Development & integrations", "Custom features, Velo development and integrations with the systems you already use."],
      ["winkel", "eCommerce", "Online stores that sell: from product pages and payments to shipping and invoicing."],
      ["zoek", "SEO & conversion", x.tekst4 ? esc(x.tekst4) : "Local SEO, optimised content and technical improvements for maximum visibility."],
      ["schild", "Maintenance & support", "Always up to date and secure, with a fixed team that knows your website."],
    ]),
    projecten(pj, true),
    ookActief("Also active in <em>Europe</em>.", anderen.map((a) => [a.country || a.title, regioUrl("land", a)]), "/wix-expert", "All regions"),
    contact({
      titel: accent(x.koptekst6 || `Let's build your Wix site for ${c}!`, c),
      tekst: alineas(x.tekst6 || ""),
      onderwerp: `Wix website ${c}: request via yonglo.com`, en: true,
    }),
  ].join("\n");
}

// ---------------------------------------------------------------- Europa: steden
export function paginaStad(x, { projecten: pj, anderen }) {
  const c = x.city || x.title;
  return [
    kop({
      crumbs: [["Home", "/en"], ["Regions", "/wix-expert"], [c]],
      eyebrow: `Wix web design · ${c}`,
      h1: accent(x.title || `Wix Expert for ${c}`, c),
      sub: x.subTitle,
      lead: x.introText || "",
      knoppen: `<a href="#contact" class="btn btn-primary">Contact us <i class="arr">→</i></a><a href="/en/portfolio" class="btn btn-ghost">View portfolio</a>`,
      ticks: ["Official Wix Partner", "18 years of experience", "Working internationally"],
      naam: c, en: true, soortLabel: "City · Europe",
    }),
    duo(
      ["Why choose <em>Yonglo</em>?", `<p>${esc(x.text1 || "")}</p>`,
        ["Official Wix Partner & Wix Studio expert", "Custom web design & development", "18 years of experience", "Internationally proven track record", "Personal approach"],
        `<a href="/en/portfolio" class="btn btn-ghost">View portfolio <i class="arr">→</i></a>`],
      [accent(x.subTitle1 || `Your business in ${c} deserves the best website`, c), `<p>In a world where first impressions often happen online, a strong website is essential. We don't just create websites: we deliver custom Wix solutions that strengthen your brand and move your business forward.</p><p>${esc(x.text4 || "")}</p>`, null, ""]),
    kaarten("Our <em>services</em>.", `<p>${esc(x.text2 || "")}</p>`, [
      ["pen", "Wix web design", "Custom Wix and Wix Studio websites that match your brand and goals."],
      ["code", "Custom Wix development", "Velo development, custom features and integrations with your systems."],
      ["zoek", "Wix SEO optimisation", "Technical SEO, content and structure to rank higher in Google and AI search."],
      ["winkel", "eCommerce with Wix", "Online stores with payments, shipping and invoicing set up properly."],
      ["schild", "Maintenance & support", "Updates, improvements and support from one fixed team."],
    ], { donker: true }) + (x.text3 ? `<section class="dark rg-cities"><div class="wrap"><p class="rv">${esc(x.text3)}</p><a href="#contact" class="btn btn-primary rv">Request a quote <i class="arr">→</i></a></div></section>` : ""),
    duo(
      [accent(x.subTitle3 || `Yonglo: your international Wix Partner for ${c}`, c), `<p>${esc(x.text5 || "")}</p><p>We understand that a strong online presence is essential to reach customers, locally and internationally. That's why we provide tailor-made solutions that align with your brand, your goals and your audience.</p>`, null, ""],
      ["Web design, development <em>and</em> SEO.", "<p>With in-depth expertise in web design, web development and Wix SEO, we make sure your website not only looks stunning but also performs at its best in search engines.</p>",
        ["Fast-loading, mobile-first websites", "Built-in SEO and GEO for Google and AI search", "Conversion-focused design and copy"], `<a href="/en/seo" class="btn btn-ghost">More about SEO <i class="arr">→</i></a>`]),
    projecten(pj, true),
    ookActief("Also active in <em>these cities</em>.", anderen.map((a) => [a.city || a.title, regioUrl("stad", a)]), "/wix-expert", "All regions"),
    contact({
      titel: esc(x.title2 || `From ${c} to global success!`).replace(/\n/g, "<br>").replace(esc(c), `<em>${esc(c)}</em>`),
      tekst: alineas(x.text6 || ""),
      onderwerp: `Wix website ${c}: request via yonglo.com`, en: true,
    }),
  ].join("\n");
}

// ---------------------------------------------------------------- overzichten
export function overzicht({ en, groepen }) {
  return `<section class="light rg-hub">
  <div class="wrap">
    ${groepen.filter((g) => g.items.length).map((g) => `<div class="rg-hub-g">
      <div class="rg-hub-h"><h2 class="rv">${g.titel}</h2><span class="rv">${g.items.length} ${en ? "pages" : "pagina's"}</span></div>
      <ul class="rg-chips rv">${g.items.map(([t, h]) => `<li><a href="${h}">${ico("pin")}${esc(t)}</a></li>`).join("")}</ul>
    </div>`).join("")}
  </div>
</section>
${contact({
    titel: en ? "Your region not <em>listed</em>?" : "Staat jouw plaats er <em>niet tussen</em>?",
    tekst: en ? "<p>We work for clients all over Europe, remotely and on location. Tell us about your plans.</p>" : "<p>We werken voor klanten in heel Nederland en België, op afstand en op locatie. Vertel ons over je plannen.</p>",
    onderwerp: en ? "Wix website: request via yonglo.com (regions)" : "Wix-website: aanvraag via yonglo.com (werkgebied)", en,
  })}`;
}

export function overzichtKop({ en, aantal }) {
  return kop({
    crumbs: en ? [["Home", "/en"], ["Regions"]] : [["Home", "/"], ["Werkgebied"]],
    eyebrow: en ? "Wix web design across Europe" : "Wix webdesign in Nederland en België",
    h1: en ? "Your Wix partner, <em>wherever</em> you are." : "Jouw Wix-partner, <em>waar</em> je ook zit.",
    lead: en ? "From Amsterdam to Athens: Yonglo designs, builds and optimises Wix and Wix Studio websites for businesses all over Europe." : "Van Groningen tot Maastricht en van Antwerpen tot Brugge: Yonglo ontwerpt, bouwt en verbetert Wix- en Wix Studio-websites voor ondernemers in heel Nederland en België.",
    knoppen: en ? `<a href="#contact" class="btn btn-primary">Book a free consultation <i class="arr">→</i></a><a href="/wix-website" class="btn btn-ghost">Nederland &amp; België</a>` : `<a href="#contact" class="btn btn-primary">Plan een kennismaking <i class="arr">→</i></a><a href="/wix-expert" class="btn btn-ghost">Europe (English)</a>`,
    ticks: en ? ["Official Wix Partner", "18 years of experience", "Working internationally"] : ["Officiële Wix Partner", "18 jaar ervaring", "Studio's in Eindhoven en Haarlem"],
    naam: en ? `${aantal} regions` : `${aantal} plaatsen`, en, soortLabel: en ? "Europe" : "Nederland & België",
  });
}
