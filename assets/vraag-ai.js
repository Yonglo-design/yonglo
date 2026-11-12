/* "Vraag het je AI": knoppen die ChatGPT, Claude of Perplexity openen met een vraag over Yonglo.
   De vraag verwijst naar /llms.txt, zodat de AI onze eigen informatie leest in plaats van te gokken.
   Gebruik: <a data-ai="chatgpt|claude|perplexity">. De vraag komt uit het dichtstbijzijnde element met
   [data-vraag] (een gekozen keuzerondje met name="ai-vraag" gaat voor), anders de standaardvraag.
   Een tekstvak name="ai-context" in hetzelfde element ("Vertel iets over je bedrijf") gaat mee in de vraag.
   Vragen met data-persoonlijk hangen af van de situatie van de bezoeker: is die niet ingevuld, dan vraagt
   de AI daar zelf naar.
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
  ? 'What can Yonglo do for my business? List the services that fit, a price indication if there is one, and a few similar projects.'
  : 'Wat kan Yonglo voor mijn bedrijf doen? Noem de diensten die passen, een prijsindicatie als die er is en een paar vergelijkbare projecten.';

// De tekst die de AI krijgt. Getest met AI-assistenten (november 2026): met de situatie van de bezoeker,
// een link per bewering en "zeg het als het niet op de site staat" worden de antwoorden het beste.
const prompt = ({ vraag, context, persoonlijk }) => {
  const ctx = context.replace(/\s+/g, ' ').trim().slice(0, 300);
  return EN
    ? [vraag,
      ctx && `About my business: ${ctx}`,
      `Use Yonglo's own information: start at ${SITE}/llms.txt and open the pages that fit. Link to the page where you found each point, so I can check it myself. If something isn't on their website, say so.`,
      persoonlijk && !ctx && "I haven't told you about my business yet: give short advice per type of situation, then ask about mine."]
    : [vraag,
      ctx && `Over mijn bedrijf: ${ctx}`,
      `Gebruik de informatie van Yonglo zelf: begin bij ${SITE}/llms.txt en open de pagina's die erbij passen. Zet bij elk punt de link naar de pagina waar het staat, zodat ik het zelf kan bekijken. Staat iets niet op hun website, zeg dat dan.`,
      persoonlijk && !ctx && 'Ik heb nog niet verteld wat voor bedrijf ik heb: geef kort advies per soort situatie en vraag daarna naar de mijne.'];
};
const promptTekst = (v) => prompt(v).filter(Boolean).join('\n\n');

const AI = {
  chatgpt: q => `https://chatgpt.com/?hints=search&q=${encodeURIComponent(q)}`,
  claude: q => `https://claude.ai/new?q=${encodeURIComponent(q)}`,
  perplexity: q => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
};

function vraagVoor(a) {
  const box = a.closest('[data-vraag]');
  if (!box) return { vraag: STANDAARD, context: '', persoonlijk: true };
  const gekozen = box.querySelector('input[name="ai-vraag"]:checked');
  const vak = box.querySelector('[name="ai-context"]');
  const vraag = (gekozen && gekozen.value) || box.getAttribute('data-vraag') || STANDAARD;
  return {
    vraag,
    context: (vak && vak.value) || '',
    persoonlijk: gekozen ? gekozen.hasAttribute('data-persoonlijk') : vraag === STANDAARD,
  };
}

function zetLinks(root = document) {
  root.querySelectorAll('a[data-ai]').forEach(a => {
    const maak = AI[a.getAttribute('data-ai')];
    if (!maak) return;
    a.href = maak(promptTekst(vraagVoor(a)));
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

zetLinks();
const bijwerken = e => {
  if (e.target && (e.target.name === 'ai-vraag' || e.target.name === 'ai-context')) zetLinks(e.target.closest('[data-vraag]') || document);
};
document.addEventListener('change', bijwerken);
document.addEventListener('input', bijwerken);
// Voor knoppen die later op de pagina komen: link vlak voor het klikken nog eens bijwerken.
document.addEventListener('pointerdown', e => { const a = e.target.closest && e.target.closest('a[data-ai]'); if (a) zetLinks(a.parentNode); }, true);
window.ylVraagAI = { zetLinks };
})();
