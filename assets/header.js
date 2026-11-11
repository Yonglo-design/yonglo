/* Header (menu) van de hele site.
   Elke pagina heeft alleen:
     <header class="hdr" id="top" data-header></header>
     <script src="/assets/header.js"></script>
   Dit script vult de header en zet het mobiele menu erachter. Menu aanpassen? Alleen hier, in HEADER_HTML / MOBMENU_HTML.
   Het script draait direct (geen defer), zodat de header er meteen staat en app.js hem daarna kan aansturen. */
(() => {
'use strict';
const HEADER_HTML = `
  <div class="hdr-in">
    <a href="/" class="logo" aria-label="Yonglo home"><svg class="wordmark" viewBox="0 0 476.9 102.4" aria-hidden="true" focusable="false"><path style="--i:0" d="M61.4,5.1h-13.8c-.8,0-1.4.6-1.4,1.4v36.6c0,5.7-1.5,15.4-11.2,15.4s-11.3-8.4-11.3-15.4V6.5c0-.8-.6-1.4-1.4-1.4h-13.8c-.8,0-1.4.6-1.4,1.4v36.6c0,15.4,7.3,26.5,19.6,30v22.8c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-22.8c12.3-3.6,19.6-14.6,19.6-30V6.5c0-.8-.6-1.4-1.4-1.4Z"/><path style="--i:1" d="M121.8,5.1c-30.1-2.5-53,20.4-50.5,50.5,1.8,20.9,20.6,39.8,41.5,41.5,30.1,2.5,53-20.4,50.5-50.5-1.8-20.9-20.6-39.8-41.5-41.5ZM117.3,81.5c-17,0-29.9-13.1-29.9-30.4s12.8-30.4,29.9-30.4,29.9,13.1,29.9,30.4-12.8,30.4-29.9,30.4Z"/><path style="--i:2" d="M206.1,5.4h0c-6.2-1.2-11.7-.1-12.4,0-13.5,2.9-21.5,14.3-21.5,30.5v60.1c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-60.1c0-5.7,1.5-15.4,11.2-15.4s11.3,8.4,11.3,15.4v60.1c0,.8.6,1.4,1.4,1.4h13.8c.8,0,1.4-.6,1.4-1.4v-60.1c0-16.3-8.2-27.8-21.8-30.5Z"/><path style="--i:3" d="M327.3,42.9h-43c-.8,0-1.4.6-1.4,1.4v12.7c0,.8.6,1.4,1.4,1.4h26.2c.8,0,1.4.8,1.2,1.6-3.6,12.8-14.9,21.4-28.7,21.4s-29.9-13.1-29.9-30.4,12.8-30.4,29.9-30.4,17.7,3.9,23.2,10.8h0c1,1.2,2.7,1.3,3.9.3l7.9-7.4c1-1,1.1-2.6.2-3.6h0c-8.7-10.1-21.2-15.7-35.1-15.7-23.3,0-41.5,15.5-45.4,37.3-6.4,35.6,18.7,60.7,54.3,54.3,21.8-3.9,37.3-22.1,37.3-45.4s-.1-4-.4-5.9v-1.1c-.2-.7-.8-1.2-1.5-1.2Z"/><path style="--i:4" d="M354.3,66.3V6.3c0-.8-.6-1.4-1.4-1.4h-13.8c-.8,0-1.4.6-1.4,1.4v60.1c0,16.3,8.2,27.8,21.8,30.5,1.9.4,4,.5,6.1.5,3.5,0,5.9-.5,6.2-.6l1-.2c.7-.1,1.1-.7,1.1-1.4v-12.1c0-.8-.6-1.4-1.4-1.4h-6.9c-9.4,0-11.3-8.4-11.3-15.4Z"/><path style="--i:5" d="M428.2,5.1c-30.1-2.5-53,20.4-50.5,50.5,1.8,20.9,20.6,39.8,41.5,41.5,30.1,2.5,53-20.4,50.5-50.5-1.8-20.9-20.6-39.8-41.5-41.5ZM423.7,81.5c-17,0-29.9-13.1-29.9-30.4s12.8-30.4,29.9-30.4,29.9,13.1,29.9,30.4-12.8,30.4-29.9,30.4Z"/></svg></a>
    <nav class="nav" aria-label="Hoofdmenu">
      <ul>
        <li class="has-mega">
          <button class="nav-btn" aria-expanded="false" aria-controls="mega">Diensten <i class="chev"></i></button>
          <div class="mega" id="mega">
            <div class="mega-col">
              <p class="eyebrow">Bouwen</p>
              <a href="/webdesign"><b>Webdesign</b><span>Professionele websites voor jouw bedrijf</span></a>
              <a href="/ecommerce"><b>eCommerce</b><span>Webshops die verkopen</span></a>
              <a href="/wix"><b>Wix websites</b><span>Ontdek de onbeperkte mogelijkheden</span></a>
            </div>
            <div class="mega-col">
              <p class="eyebrow">Groeien</p>
              <a href="/seo"><b>SEO, GEO &amp; succes</b><span>Word beter gevonden</span></a>
              <a href="/optimaal"><b>Website verbeteren</b><span>Geef je Wix website een upgrade</span></a>
              <a href="/branding"><b>Concept &amp; Branding</b><span>Van idee tot identiteit</span></a>
            </div>
            <div class="mega-col">
              <p class="eyebrow">Slimmer</p>
              <a href="/development"><b>Development</b><span>Maatwerk oplossingen</span></a>
              <a href="/ai"><b>AI oplossingen</b><span>Slimmer werken met AI</span></a>
              <a href="/api"><b>API koppelingen</b><span>Integreer andere platformen</span></a>
            </div>
            <a href="/#werk" class="mega-feat">
              <span class="eyebrow">Uitgelicht project</span>
              <b>Pawy</b><span>Custom webshop in Wix Studio</span>
            </a>
          </div>
        </li>
        <li><a href="/portfolio">Portfolio</a></li>
        <li><a href="/over-yonglo">Over Yonglo</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
    <div class="hdr-cta">
      <button class="icon-btn srch-btn" type="button" aria-label="Zoeken op de website" aria-expanded="false" aria-controls="srch"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg></button>
      <a href="/spel" class="icon-btn play-btn" aria-label="Speel Pixel Perfect" title="Speel Pixel Perfect"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 6.5h9.6a4.3 4.3 0 0 1 4.2 5.2l-.9 4.6a2.6 2.6 0 0 1-4.5 1.2L13.9 15h-3.8l-1.7 2.5a2.6 2.6 0 0 1-4.5-1.2l-.9-4.6a4.3 4.3 0 0 1 4.2-5.2z"/><path d="M8.5 9.3v3.4M6.8 11h3.4"/><circle cx="15.3" cy="10" r=".6"/><circle cx="17" cy="12" r=".6"/></svg></a>
      <a href="/en" class="icon-btn lang-btn" data-lang-switch hreflang="en" lang="en" aria-label="English version of this page" title="English"><span class="flag" aria-hidden="true"><svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice"><clipPath id="fl-uk"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath><path d="M0,0v30h60v-30z" fill="#012169"/><path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0L60,30M60,0L0,30" clip-path="url(#fl-uk)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg></span></a>
      <a href="tel:+31852033223" class="icon-btn" aria-label="Bel Yonglo"><svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></a>
      <a href="#contact" class="btn btn-primary">Plan een kennismaking <i class="arr">→</i></a>
    </div>
    <button class="burger" aria-label="Menu openen" aria-expanded="false" aria-controls="mobmenu"><span></span><span></span></button>
  </div>
`;
const MOBMENU_HTML = `
<div class="mobmenu" id="mobmenu" hidden>
  <nav aria-label="Mobiel menu">
    <details>
      <summary>Diensten</summary>
      <a href="/webdesign">Webdesign</a><a href="/ecommerce">eCommerce</a><a href="/development">Development</a>
      <a href="/branding">Concept &amp; Branding</a><a href="/wix">Wix websites</a><a href="/optimaal">Website verbeteren</a>
      <a href="/seo">SEO, GEO &amp; succes</a><a href="/ai">AI oplossingen</a><a href="/api">API koppelingen</a>
    </details>
    <a href="/portfolio">Portfolio</a>
    <a href="/over-yonglo">Over Yonglo</a>
    <a href="/contact">Contact</a>
    <a href="/en" class="mob-lang" data-lang-switch hreflang="en" lang="en"><span class="flag" aria-hidden="true"><svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice"><clipPath id="fl-uk"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath><path d="M0,0v30h60v-30z" fill="#012169"/><path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0L60,30M60,0L0,30" clip-path="url(#fl-uk)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg></span>English</a>
  </nav>
  <a href="#contact" class="btn btn-primary wide">Plan een kennismaking <i class="arr">→</i></a>
</div>
`;

// Vlaggen voor de taalknop (rond bijgesneden met CSS).
const FLAG_EN = '<span class="flag" aria-hidden="true"><svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice"><clipPath id="fl-uk"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath><path d="M0,0v30h60v-30z" fill="#012169"/><path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0L60,30M60,0L0,30" clip-path="url(#fl-uk)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg></span>';
const FLAG_NL = '<span class="flag" aria-hidden="true"><svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice"><rect width="9" height="6" fill="#21468B"/><rect width="9" height="4" fill="#fff"/><rect width="9" height="2" fill="#AE1C28"/></svg></span>';

// Engelse website (/en/…): zelfde menu, met Engelse teksten en links naar /en/…
const EN = document.documentElement.lang === 'en';
const EN_TEXT = [
  ['aria-label="Hoofdmenu"', 'aria-label="Main menu"'], ['aria-label="Mobiel menu"', 'aria-label="Mobile menu"'],
  ['>Diensten <i', '>Services <i'], ['<summary>Diensten</summary>', '<summary>Services</summary>'],
  ['>Bouwen<', '>Build<'], ['>Groeien<', '>Grow<'], ['>Slimmer<', '>Smarter<'],
  ['Professionele websites voor jouw bedrijf', 'Professional websites for your business'],
  ['Webshops die verkopen', 'Online stores that sell'], ['Ontdek de onbeperkte mogelijkheden', 'Discover the unlimited possibilities'],
  ['SEO, GEO &amp; succes', 'SEO, GEO &amp; success'], ['Word beter gevonden', 'Get found more easily'],
  ['Website verbeteren', 'Improve your website'], ['Geef je Wix website een upgrade', 'Give your Wix website an upgrade'],
  ['Van idee tot identiteit', 'From idea to identity'], ['Maatwerk oplossingen', 'Custom solutions'],
  ['AI oplossingen', 'AI solutions'], ['Slimmer werken met AI', 'Work smarter with AI'],
  ['API koppelingen', 'API integrations'], ['Integreer andere platformen', 'Integrate other platforms'],
  ['Uitgelicht project', 'Featured project'], ['Custom webshop in Wix Studio', 'Custom online store in Wix Studio'],
  ['>Wix websites<', '>Wix websites<'], ['>Over Yonglo<', '>About Yonglo<'],
  ['aria-label="Zoeken op de website"', 'aria-label="Search the website"'],
  ['aria-label="Speel Pixel Perfect" title="Speel Pixel Perfect"', 'aria-label="Play Pixel Perfect" title="Play Pixel Perfect"'],
  ['aria-label="Bel Yonglo"', 'aria-label="Call Yonglo"'], ['Plan een kennismaking', 'Book an intro call'],
  ['aria-label="Menu openen"', 'aria-label="Open menu"'],
  // taalknop: op de Engelse site wijst hij naar Nederlands, met de Nederlandse vlag
  ['href="/en" class="icon-btn lang-btn" data-lang-switch hreflang="en" lang="en" aria-label="English version of this page" title="English">',
   'href="/" class="icon-btn lang-btn" data-lang-switch hreflang="nl" lang="nl" aria-label="Nederlandse versie van deze pagina" title="Nederlands">'],
  ['href="/en" class="mob-lang" data-lang-switch hreflang="en" lang="en">', 'href="/" class="mob-lang" data-lang-switch hreflang="nl" lang="nl">'],
  ['>English</a>', '>Nederlands</a>'],
  [FLAG_EN, FLAG_NL],
];
const toEn = html => {
  for (const [nl, en] of EN_TEXT) html = html.split(nl).join(en);
  // links naar pagina's → /en/…; het logo naar /en (data-lang-switch-links worden hieronder gezet)
  return html.replace(/href="\/(?!en\b)([^"]*)"/g, (m, rest) => `href="/en${rest && !rest.startsWith('#') ? '/' + rest : rest}"`);
};

const host = document.querySelector('header[data-header]');
if (!host) return;
host.innerHTML = EN ? toEn(HEADER_HTML) : HEADER_HTML;
host.insertAdjacentHTML('afterend', EN ? toEn(MOBMENU_HTML) : MOBMENU_HTML);
const mob = document.getElementById('mobmenu');

// Welke pagina is dit? ('/ai', '/ai/' en het oude '/ai.html' worden allemaal '/ai'; '/' en '/index.html' worden '/').
// Op de Engelse site valt /en ervoor weg: '/en/ai' wordt ook '/ai'.
const norm = p => { p = p.split(/[?#]/)[0].replace(/\.html$/, '').replace(/\/+$/, '').replace(/^\/en(?=\/|$)/, ''); return !p || p === '/index' ? '/' : p; };
const here = norm(location.pathname);

// Taalknop: naar dezelfde pagina in de andere taal. Blogberichten zijn er alleen in het Nederlands,
// dus vanaf een bericht gaat de Engelse knop naar het nieuwsoverzicht.
// Engelse pagina's zonder /en (help docs, Europese regiopagina's) hebben geen Nederlandse versie: NL gaat naar de homepage.
const other = EN ? (location.pathname.startsWith('/en') ? here : '/') : (here.startsWith('/post/') ? '/en/nieuws' : here === '/' ? '/en' : '/en' + here);
document.querySelectorAll('[data-lang-switch]').forEach(a => a.setAttribute('href', other + (EN || !here.startsWith('/post/') ? location.search : '')));
const isHome = here === '/' || here === '/home-b';
const SERVICES = ['webdesign', 'ecommerce', 'wix', 'seo', 'optimaal', 'branding', 'development', 'ai', 'api'].map(n => `/${n}`);
const active = here.startsWith('/post/') ? '/nieuws' : here.startsWith('/project/') ? '/portfolio' : here; // blogberichten horen bij Nieuws, projecten bij Portfolio

// actieve link markeren (menu, megamenu, mobiel menu, spelknop)
[...host.querySelectorAll('a[href]'), ...mob.querySelectorAll('a[href]')].forEach(a => {
  const h = a.getAttribute('href');
  if (!a.classList.contains('logo') && h.startsWith('/') && !h.includes('#') && norm(h) === active) a.setAttribute('aria-current', 'page');
});
if (SERVICES.includes(here)) {
  host.querySelector('.nav-btn')?.classList.add('is-current');
  mob.querySelector('details')?.setAttribute('open', '');
}

// op de homepage: logo scrollt naar boven, uitgelicht project verwijst naar #werk op dezelfde pagina
if (isHome) {
  host.querySelector('.logo')?.setAttribute('href', '#top');
  const feat = host.querySelector('.mega-feat');
  if (feat) {
    feat.setAttribute('href', '#werk');
    feat.querySelector('.eyebrow')?.insertAdjacentHTML('afterend', '<span class="mock mini g1"><i></i><i></i><i></i></span>');
  }
}

// "Plan een kennismaking": naar het formulier op deze pagina, of anders naar de contactpagina
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('contact')) return;
  document.querySelectorAll('.hdr a[href="#contact"], #mobmenu a[href="#contact"]').forEach(a => a.setAttribute('href', (EN ? '/en' : '') + '/contact#contact'));
});
})();
