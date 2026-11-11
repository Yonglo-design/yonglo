/* "Vraag het je AI": knoppen die ChatGPT, Claude of Perplexity openen met een vraag over Yonglo.
   De vraag verwijst naar /llms.txt, zodat de AI onze eigen informatie leest in plaats van te gokken.
   Gebruik: <a data-ai="chatgpt|claude|perplexity">. De vraag komt uit het dichtstbijzijnde element met
   [data-vraag] (een gekozen keuzerondje met name="ai-vraag" gaat voor), anders de standaardvraag.
   Wordt geladen door footer.js, dus werkt op elke pagina. */
(() => {
'use strict';

// Live adres van de site. Aanpassen zodra het domein naar deze site wijst (ook in tools/maak-ai-bestanden.mjs).
const LIVE_SITE = 'https://www.yonglo.com';
// Lokaal (preview) kan een AI de site niet lezen, dus dan verwijzen we naar de live site.
const SITE = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === 'file:' ? LIVE_SITE : location.origin;

// Op de Engelse website (/en/…) is de vraag Engels.
const EN = document.documentElement.lang === 'en';
const STANDAARD = EN
  ? 'What can Yonglo do for my business? List the services that fit and a few similar projects.'
  : 'Wat kan Yonglo voor mijn bedrijf doen? Noem de diensten die passen en een paar vergelijkbare projecten.';
const prompt = vraag => EN
  ? `${vraag}\n\nUse Yonglo's own information: start at ${SITE}/llms.txt and look at the pages that fit. Give me the links to those pages so I can view them myself.`
  : `${vraag}\n\nGebruik de informatie van Yonglo zelf: begin bij ${SITE}/llms.txt en bekijk de pagina's die erbij passen. Geef me de links naar die pagina's, zodat ik ze zelf kan bekijken.`;

const AI = {
  chatgpt: q => `https://chatgpt.com/?hints=search&q=${encodeURIComponent(q)}`,
  claude: q => `https://claude.ai/new?q=${encodeURIComponent(q)}`,
  perplexity: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
};

function vraagVoor(a) {
  const box = a.closest('[data-vraag]');
  if (!box) return STANDAARD;
  const gekozen = box.querySelector('input[name="ai-vraag"]:checked');
  return (gekozen && gekozen.value) || box.getAttribute('data-vraag') || STANDAARD;
}

function zetLinks(root = document) {
  root.querySelectorAll('a[data-ai]').forEach(a => {
    const maak = AI[a.getAttribute('data-ai')];
    if (!maak) return;
    a.href = maak(prompt(vraagVoor(a)));
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

zetLinks();
document.addEventListener('change', e => {
  if (e.target && e.target.name === 'ai-vraag') zetLinks(e.target.closest('[data-vraag]') || document);
});
// Voor knoppen die later op de pagina komen: link vlak voor het klikken nog eens bijwerken.
document.addEventListener('pointerdown', e => { const a = e.target.closest && e.target.closest('a[data-ai]'); if (a) zetLinks(a.parentNode); }, true);
window.ylVraagAI = { zetLinks };
})();
