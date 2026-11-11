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
              <a href="/webdesign.html"><b>Webdesign</b><span>Professionele websites voor jouw bedrijf</span></a>
              <a href="/ecommerce.html"><b>eCommerce</b><span>Webshops die verkopen</span></a>
              <a href="/wix.html"><b>Wix websites</b><span>Ontdek de onbeperkte mogelijkheden</span></a>
            </div>
            <div class="mega-col">
              <p class="eyebrow">Groeien</p>
              <a href="/seo.html"><b>SEO, GEO &amp; succes</b><span>Word beter gevonden</span></a>
              <a href="/optimaal.html"><b>Website verbeteren</b><span>Geef je Wix website een upgrade</span></a>
              <a href="/branding.html"><b>Concept &amp; Branding</b><span>Van idee tot identiteit</span></a>
            </div>
            <div class="mega-col">
              <p class="eyebrow">Slimmer</p>
              <a href="/development.html"><b>Development</b><span>Maatwerk oplossingen</span></a>
              <a href="/ai.html"><b>AI oplossingen</b><span>Slimmer werken met AI</span></a>
              <a href="/api.html"><b>API koppelingen</b><span>Integreer andere platformen</span></a>
            </div>
            <a href="/#werk" class="mega-feat">
              <span class="eyebrow">Uitgelicht project</span>
              <b>Pawy</b><span>Custom webshop in Wix Studio</span>
            </a>
          </div>
        </li>
        <li><a href="/portfolio.html">Portfolio</a></li>
        <li><a href="/over-yonglo.html">Over Yonglo</a></li>
        <li><a href="/contact.html">Contact</a></li>
      </ul>
    </nav>
    <div class="hdr-cta">
      <button class="icon-btn srch-btn" type="button" aria-label="Zoeken op de website" aria-expanded="false" aria-controls="srch"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg></button>
      <a href="/spel.html" class="icon-btn play-btn" aria-label="Speel Pixel Perfect" title="Speel Pixel Perfect"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 6.5h9.6a4.3 4.3 0 0 1 4.2 5.2l-.9 4.6a2.6 2.6 0 0 1-4.5 1.2L13.9 15h-3.8l-1.7 2.5a2.6 2.6 0 0 1-4.5-1.2l-.9-4.6a4.3 4.3 0 0 1 4.2-5.2z"/><path d="M8.5 9.3v3.4M6.8 11h3.4"/><circle cx="15.3" cy="10" r=".6"/><circle cx="17" cy="12" r=".6"/></svg></a>
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
      <a href="/webdesign.html">Webdesign</a><a href="/ecommerce.html">eCommerce</a><a href="/development.html">Development</a>
      <a href="/branding.html">Concept &amp; Branding</a><a href="/wix.html">Wix websites</a><a href="/optimaal.html">Website verbeteren</a>
      <a href="/seo.html">SEO, GEO &amp; succes</a><a href="/ai.html">AI oplossingen</a><a href="/api.html">API koppelingen</a>
    </details>
    <a href="/portfolio.html">Portfolio</a>
    <a href="/over-yonglo.html">Over Yonglo</a>
    <a href="/contact.html">Contact</a>
  </nav>
  <a href="#contact" class="btn btn-primary wide">Plan een kennismaking <i class="arr">→</i></a>
</div>
`;

const host = document.querySelector('header[data-header]');
if (!host) return;
host.innerHTML = HEADER_HTML;
host.insertAdjacentHTML('afterend', MOBMENU_HTML);
const mob = document.getElementById('mobmenu');

// Welke pagina is dit? ('/', '/ai' en '/ai.html' worden allemaal genormaliseerd)
const norm = p => { p = p.replace(/\/+$/, '') || '/index'; if (!/\.html$/.test(p)) p += '.html'; return p; };
const here = norm(location.pathname);
const isHome = here === '/index.html' || here === '/home-b.html';
const SERVICES = ['webdesign', 'ecommerce', 'wix', 'seo', 'optimaal', 'branding', 'development', 'ai', 'api'].map(n => `/${n}.html`);
const CURRENT = { '/project.html': '/portfolio.html', '/post.html': '/nieuws.html' }; // subpagina's die bij een menu-item horen
const active = here.startsWith('/post/') ? '/nieuws.html' : CURRENT[here] || here; // blogberichten (/post/<naam>) horen bij Nieuws

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
  document.querySelectorAll('.hdr a[href="#contact"], #mobmenu a[href="#contact"]').forEach(a => a.setAttribute('href', '/contact.html#contact'));
});
})();
