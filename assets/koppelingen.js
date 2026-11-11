// Koppelingen (API-integraties) van Yonglo: één pagina per koppeling op /wix-koppeling/<naam>,
// hetzelfde adres als op de oude yonglo.com. De inhoud komt uit de Wix CMS-collectie "Koppelingen"
// (Wix-dashboard → CMS → Koppelingen). Een nieuwe of aangepaste koppeling staat meteen live.
// Gebruikt door de server (src/pages/wix-koppeling/[slug].astro) en door de lijst op /api
// (assets/koppelingen-lijst.js).
import { img, esc, projectUrl, themeStyle, cardTags } from "./projecten.js";

export const COLLECTION = "Koppelingen";

// Volgorde van de filterknoppen op /api en de Engelse namen van de categorieën.
export const CATEGORIEEN = ["Boekhouding", "Betalingen", "Vastgoed & verhuur", "CRM & marketing", "AI", "Samenwerking & data"];
export const CATEGORIE_EN = {
  "Boekhouding": "Accounting",
  "Betalingen": "Payments",
  "Vastgoed & verhuur": "Real estate & rentals",
  "CRM & marketing": "CRM & marketing",
  "AI": "AI",
  "Samenwerking & data": "Collaboration & data",
  "Overig": "Other",
};

// ---- Engelse website (/en/…) ----
// Een koppeling heeft Engelse velden met "En" erachter (kopEn, tekstEn, metabeschrijvingEn).
// Is een Engels veld leeg, dan blijft de Nederlandse tekst staan (en heeft de pagina _nl = true).
const EN_FIELDS = ["kop", "tekst", "metabeschrijving"];
export function inTaal(k, lang) {
  if (lang !== "en" || !k || k._lang === "en") return k;
  const q = { ...k, _lang: "en", _nl: !k.tekstEn };
  for (const f of EN_FIELDS) if (k[f + "En"]) q[f] = k[f + "En"];
  q.categorieNl = k.categorie;
  q.categorie = CATEGORIE_EN[k.categorie] || k.categorie;
  return q;
}

const T = (k, nl, en) => (k && k._lang === "en" ? en : nl);
const pre = (k) => (k && k._lang === "en" ? "/en" : "");

export function koppelingUrl(k) {
  return (k._lang === "en" ? "/en/wix-koppeling/" : "/wix-koppeling/") + encodeURIComponent(k.slug);
}

// Alles uit de CMS-collectie, in de volgorde van het veld "volgorde".
export function sorteer(list) {
  return list
    .filter((k) => k && k.title && k.slug)
    .sort((a, b) => (a.volgorde ?? 999) - (b.volgorde ?? 999) || String(a.title).localeCompare(String(b.title), "nl"));
}

// Platte tekst uit de rich text van het CMS (voor de omschrijving, llms.txt …).
export function platteTekst(html) {
  return String(html || "")
    .replace(/<\/(p|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

// Rich text uit het CMS veilig maken: alleen eenvoudige opmaak blijft staan.
const TOEGESTAAN = new Set(["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "h2", "h3", "h4", "a", "blockquote"]);
export function veiligeHtml(html) {
  return String(html || "")
    .replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name, attrs) => {
      name = name.toLowerCase();
      if (!TOEGESTAAN.has(name)) return "";
      if (tag[1] === "/") return `</${name}>`;
      if (name === "a") {
        const m = attrs.match(/href\s*=\s*"([^"]*)"/i) || attrs.match(/href\s*=\s*'([^']*)'/i);
        const href = m ? m[1] : "";
        if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) return "<a>";
        const ext = /^https?:/i.test(href);
        return `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ""}>`;
      }
      return `<${name}>`;
    })
    .replace(/<p>\s*(<br>)?\s*<\/p>/g, "")
    .trim();
}

// Drie regels in het voorbeeld rechts in de hero, per soort koppeling.
const LOG = {
  "Boekhouding": [["Order #1043 → factuur aangemaakt", "Order #1043 → invoice created"], ["Klant toegevoegd aan administratie", "Customer added to the books"], ["Betaling gekoppeld aan factuur", "Payment matched to invoice"]],
  "Betalingen": [["Betaling ontvangen", "Payment received"], ["Order #1043 op betaald gezet", "Order #1043 marked as paid"], ["Bevestiging naar de klant", "Confirmation sent to customer"]],
  "Vastgoed & verhuur": [["Nieuw object op de website", "New listing on the website"], ["Prijs en status bijgewerkt", "Price and status updated"], ["Beschikbaarheid gesynchroniseerd", "Availability synchronised"]],
  "CRM & marketing": [["Nieuwe lead in het CRM", "New lead in the CRM"], ["Contact toegevoegd aan segment", "Contact added to segment"], ["Opvolg-e-mail ingepland", "Follow-up email scheduled"]],
  "AI": [["Vraag van bezoeker beantwoord", "Visitor question answered"], ["Tekst gegenereerd uit het CMS", "Copy generated from the CMS"], ["Antwoord gecontroleerd en opgeslagen", "Answer checked and saved"]],
  "Samenwerking & data": [["Formulier → melding aan het team", "Form → team notification"], ["Afspraak in de agenda gezet", "Appointment added to calendar"], ["Gegevens bijgewerkt op de website", "Data updated on the website"]],
};

export function hero(k) {
  const cat = k.categorieNl || k.categorie;
  const log = (LOG[cat] || LOG["Samenwerking & data"]).map(([nl, en]) => T(k, nl, en));
  const logo = img(k.logo, 96, 96, "c");
  return `<section class="hero sub-hero dark kp-hero">
  <div class="blob b1"></div><div class="blob b2"></div><div class="dots"></div>
  <div class="wrap hero-grid">
    <div class="hero-txt">
      <nav class="crumbs rv" aria-label="${T(k, "Kruimelpad", "Breadcrumb")}"><a href="${pre(k) || "/"}">Home</a><span>/</span><a href="${pre(k)}/api">${T(k, "API koppelingen", "API integrations")}</a><span>/</span><b>${esc(k.title)}</b></nav>
      <p class="eyebrow rv">${T(k, "Wix koppeling", "Wix integration")}${k.categorie ? ` · ${esc(k.categorie)}` : ""}</p>
      <h1 class="rv kp-title">${esc(k.kop || k.title)}</h1>
      ${k.metabeschrijving ? `<p class="lead rv" style="--d:.2s">${esc(k.metabeschrijving)}</p>` : ""}
      <div class="hero-btns rv" style="--d:.35s">
        <a href="#contact" class="btn btn-primary">${T(k, "Plan een adviesgesprek", "Book a consultation")} <i class="arr">→</i></a>
        <a href="${pre(k)}/api#koppelingen" class="btn btn-ghost">${T(k, "Alle koppelingen", "All integrations")}</a>
      </div>
    </div>
    <div class="build flow-wrap" aria-hidden="true">
      <div class="flow">
        <div class="fl-sys"><span class="fl-ico">W</span><div><b>${T(k, "Wix website", "Wix website")}</b><small>${T(k, "jouwwebsite.nl", "yourwebsite.com")}</small></div></div>
        <div class="fl-pipe"><i></i><i></i><i></i><span>API</span></div>
        <div class="fl-sys alt"><span class="fl-ico${logo ? " kp-ico" : ""}">${logo ? `<img src="${logo}" alt="" width="40" height="40">` : esc(String(k.title).charAt(0))}</span><div><b>${esc(k.title)}</b><small>${esc(k.categorie || "")}</small></div></div>
        <ul class="fl-log">${log.map((l, i) => `<li style="--t:${1 + i * 0.8}s"><b>✓</b> ${esc(l)}</li>`).join("")}</ul>
      </div>
      <span class="chip c1">⇄ ${T(k, "Realtime sync", "Real-time sync")}</span>
      <span class="chip c2">⚙ ${T(k, "Automatisering", "Automation")}</span>
      <span class="chip c3">✓ ${T(k, "Veilig", "Secure")}</span>
    </div>
  </div>
</section>`;
}

export function body(k) {
  const html = veiligeHtml(k.tekst);
  const logo = img(k.logo, 160, 160, "c");
  return `<section class="light kp-body">
  <div class="wrap kp-grid">
    <aside class="kp-side">
      <h2 class="rv">${T(k, "Zo werkt de <em>koppeling</em>.", "How the <em>integration</em> works.")}</h2>
      <div class="kp-card rv" style="--d:.1s">
        <div class="kp-pair"><span class="kp-w">W</span><i>⇄</i><span class="kp-l">${logo ? `<img src="${logo}" alt="${esc(k.title)}" width="56" height="56" loading="lazy">` : esc(String(k.title).charAt(0))}</span></div>
        <dl>
          <div><dt>${T(k, "Koppeling", "Integration")}</dt><dd>Wix + ${esc(k.title)}</dd></div>
          ${k.categorie ? `<div><dt>${T(k, "Categorie", "Category")}</dt><dd>${esc(k.categorie)}</dd></div>` : ""}
          <div><dt>Platform</dt><dd>Wix &amp; Wix Studio</dd></div>
          <div><dt>${T(k, "Techniek", "Technology")}</dt><dd>${T(k, "API · Velo by Wix · maatwerk", "API · Velo by Wix · custom")}</dd></div>
        </dl>
        <a href="#contact" class="btn btn-dark wide">${T(k, "Bespreek je koppeling", "Discuss your integration")} <i class="arr">→</i></a>
      </div>
    </aside>
    <div class="kp-text rv"${k._nl ? ' lang="nl"' : ""}>${html}</div>
  </div>
</section>`;
}

export function projecten(k, list) {
  if (!list || !list.length) return "";
  return `<section class="light pj-more kp-projects">
  <div class="wrap">
    <div class="sec-head row-head">
      <div>
        <h2 class="rv">${T(k, `Projecten met <em>${esc(k.title)}</em>.`, `Projects with <em>${esc(k.title)}</em>.`)}</h2>
      </div>
      <a href="${pre(k)}/portfolio" class="btn btn-dark rv">${T(k, "Naar portfolio", "To portfolio")} <i class="arr">→</i></a>
    </div>
    <div class="more-grid">${list.slice(0, 3).map((x, j) => {
      const pf = !!x.portfolioImage;
      const src = pf ? img(x.portfolioImage, 800, 600, "c") : img(x.hoofdbeeld, 800, 600);
      const tags = cardTags(x, 2).join(" · ");
      return `<a href="${projectUrl(x)}" class="mcard rv" style="--d:${j * 0.08}s;${themeStyle(x)}"><div class="mc-vis${src ? " has-img" : ""}${pf ? " pf" : ""}">${src ? `<img src="${src}" alt="${esc(x.title)}" loading="lazy">` : `<b>${esc(x.title)}</b>`}</div>${x.branche ? `<span class="pc-br">${esc(x.branche)}</span>` : ""}<h3>${esc(x.title)}</h3>${tags ? `<p class="mc-tags">${esc(tags)}</p>` : ""}</a>`;
    }).join("")}</div>
  </div>
</section>`;
}

// Tegels met logo en naam (andere koppelingen op een koppelingspagina, en de lijst op /api).
export function tegel(k, i = 0) {
  const logo = img(k.logo, 112, 112, "c");
  // translate="no": de naam is een merknaam (tools/maak-engels.mjs slaat die over).
  return `<li class="rv" style="--d:${(i % 8) * 0.04}s" data-cat="${esc(k.categorieNl || k.categorie || "")}"><a href="${koppelingUrl(k)}" class="kp-tile"><span class="kp-tl">${logo ? `<img src="${logo}" alt="" width="56" height="56" loading="lazy">` : `<i translate="no">${esc(String(k.title).charAt(0))}</i>`}</span><span class="kp-tt"><b translate="no">${esc(k.title)}</b>${k.categorie ? `<small>${esc(k.categorie)}</small>` : ""}</span><i class="arr" aria-hidden="true">→</i></a></li>`;
}

export function andere(k, all) {
  const others = all.filter((x) => x.slug !== k.slug);
  if (!others.length) return "";
  const cat = k.categorieNl || k.categorie;
  const same = others.filter((x) => (x.categorieNl || x.categorie) === cat);
  const pick = [...same, ...others.filter((x) => !same.includes(x))].slice(0, 8);
  return `<section class="light kp-more">
  <div class="wrap">
    <div class="sec-head row-head">
      <div>
        <h2 class="rv">${T(k, "Andere <em>koppelingen</em>.", "Other <em>integrations</em>.")}</h2>
      </div>
      <a href="${pre(k)}/api#koppelingen" class="btn btn-dark rv">${T(k, "Alle koppelingen", "All integrations")} <i class="arr">→</i></a>
    </div>
    <ul class="kp-tiles">${pick.map(tegel).join("")}</ul>
  </div>
</section>`;
}

export function contact(k) {
  return `<section class="contact light" id="contact">
  <div class="cta-grad"></div>
  <div class="wrap contact-grid">
    <div>
      <h2 class="rv">${T(k, `Wix koppelen met <em>${esc(k.title)}</em>?`, `Connect Wix with <em>${esc(k.title)}</em>?`)}</h2>
      <p class="rv">${T(k, "Wij denken graag met je mee over de mogelijkheden. Plan een vrijblijvend adviesgesprek. Liever direct contact? App of bel ons.", "We are happy to think along with you about the possibilities. Book a free consultation. Prefer direct contact? Message or call us.")}</p>
      <div class="direct rv">
        <a href="mailto:contact@yonglo.com" class="dline copy" data-copy="contact@yonglo.com"><span>${T(k, "E-mail", "Email")}</span><b>contact@yonglo.com</b></a>
        <a href="tel:+31852033223" class="dline"><span>${T(k, "Telefoon", "Phone")}</span><b>085 20 33 223</b></a>
        <a href="https://wa.me/31638148565" class="dline" target="_blank" rel="noopener"><span>WhatsApp</span><b>${T(k, "App ons direct", "Message us directly")}</b></a>
      </div>
    </div>
    <form class="cform rv" data-subject="Koppeling met ${esc(k.title)}: aanvraag via yonglo.com">
      <fieldset class="chips">
        <legend>${T(k, "Waar denk je aan?", "What do you have in mind?")}</legend>
        <label><input type="radio" name="koppeling" value="${esc(k.title)}: nieuwe koppeling" checked><span>${T(k, "Nieuwe koppeling", "New integration")}</span></label>
        <label><input type="radio" name="koppeling" value="${esc(k.title)}: bestaande koppeling verbeteren"><span>${T(k, "Bestaande verbeteren", "Improve existing")}</span></label>
        <label><input type="radio" name="koppeling" value="${esc(k.title)}: advies"><span>${T(k, "Eerst advies", "Advice first")}</span></label>
      </fieldset>
      <label class="fl"><input type="text" name="naam" placeholder=" " required><span>${T(k, "Wat is je naam?", "What is your name?")}</span></label>
      <label class="fl"><input type="email" name="email" placeholder=" " required><span>${T(k, "Hoe kunnen we je bereiken?", "How can we reach you?")}</span></label>
      <label class="fl"><input type="url" name="website" placeholder=" "><span>${T(k, "Huidige website (optioneel)", "Current website (optional)")}</span></label>
      <label class="fl"><textarea name="bericht" rows="3" placeholder=" " required></textarea><span>${T(k, `Wat moet de koppeling met ${esc(k.title)} doen?`, `What should the ${esc(k.title)} integration do?`)}</span></label>
      <button class="btn btn-primary wide">${T(k, "Maak een afspraak", "Make an appointment")} <i class="arr">→</i></button>
      <p class="fnote">${T(k, "Na het versturen nemen we zo snel mogelijk contact met je op.", "After sending, we'll get in touch as soon as possible.")}</p>
    </form>
  </div>
</section>`;
}

// Projecten die bij een koppeling horen: eerst wat in het CMS is aangevinkt (veld "Projecten met deze
// koppeling"), daarna projecten waarvan de tekst de naam van de koppeling noemt.
export function zoekProjecten(k, alle, gekoppeld = []) {
  const ids = new Set(gekoppeld.map((p) => p._id));
  const naam = String(k.title).replace(/\s*\(.*\)$/, "").replace(/ Online$/, "").replace(/^Rabobank /, "");
  const re = new RegExp(`(^|[^\\p{L}])${naam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u");
  const tekst = (p) => [p.intro, p.omschrijving, p.kenmerken, p.sectieTekst, p.kortTekst].filter(Boolean).join(" ");
  const genoemd = alle.filter((p) => !ids.has(p._id) && re.test(tekst(p)));
  return [...gekoppeld, ...genoemd];
}
