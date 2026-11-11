// 404-pagina (404.html, ook op /en/…): toont het gevraagde adres en opent met de knop het zoekvenster uit de header.
(function () {
  var d = document;
  var EN = d.documentElement.lang === 'en';
  var pad = d.querySelector('[data-nf-pad]');
  var p = location.pathname;
  if (pad && p && p !== '/404' && p !== '/en/404') {
    pad.textContent = (EN ? 'Requested address: ' : 'Gevraagd adres: ') + decodeURI(p);
    pad.hidden = false;
  }
  var knop = d.querySelector('[data-nf-zoek]');
  if (knop) knop.addEventListener('click', function () {
    var s = d.querySelector('.srch-btn');
    if (s) s.click(); else location.href = EN ? '/en' : '/';
  });
})();
