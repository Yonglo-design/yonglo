# Projectregels voor Claude Code

Dit is de website van Yonglo: gewone HTML-pagina's (HTML, CSS en JavaScript in de hoofdmap),
gehost als **Wix-managed Astro**-site. Alleen de blogberichten (`/post/<naam>`) en de projecten
(`/project/<naam>`) worden door Wix op de server opgebouwd (`src/pages/post/[slug].astro` en
`src/pages/project/[slug].astro`); alle andere pagina's blijven losse bestanden.
Content zoals projecten komt uit het Wix CMS via `assets/wix/`, blogs uit Wix Blog.

Er werken twee mensen aan. Ze zijn niet per se developers: voer alle git- en Wix-stappen
zelf uit en leg in gewone, korte taal uit wat je gedaan hebt. Vraag ze nooit om zelf
git-commando's te typen. Praat Nederlands.

## Belangrijke gegevens
- Wix site-ID (metaSiteId): `0b565482-d578-4a51-866a-655eed271d6b` (staat ook in `assets/wix/wix-config.js`
  en `wix.config.json`); app-ID: `6ca35a59-2e36-475d-8fe6-831cea9f19c5`.
- Publiceren gaat via de **Wix-connector** van Claude (tool `UploadHeadlessWebsiteFiles`, als Astro-build),
  niet via de Wix CLI. Is de Wix-connector niet beschikbaar, zeg dan dat de gebruiker hem
  moet koppelen via claude.ai → Instellingen → Connectors → Wix, en inloggen met een
  Wix-account dat toegang heeft tot deze site.
- De git-tag `live` wijst altijd naar de versie die nu live staat.

## Aan het begin van elke sessie
Voer `git pull --tags` uit. Bij conflicten: los ze zorgvuldig op en leg uit wat er gebeurd is.

## "Opslaan"
1. `git add -A`, dan `git commit -m "<korte beschrijving>"`, dan `git pull`, dan `git push`.
2. Commit nooit geheimen (API-sleutels, wachtwoorden, `.env`-bestanden).

## "Preview" / "laat zien"
Is de map `node_modules` er niet, voer dan eerst `npm install` uit. Start dan `npm run dev` en geef de
gebruiker de link `http://localhost:4321`. Dat toont alle pagina's én de blogberichten (`/post/<naam>`) en
projecten (`/project/<naam>`). (`python3 -m http.server 8000` werkt niet voor blogs en projecten: 404.)
Openen als bestand (`file://`) werkt niet, omdat de scripts modules zijn.
Als CMS-content lokaal niet laadt, tonen de pagina's de vaste HTML-inhoud; dat is normaal.
Dit is alleen zichtbaar op de eigen computer. NIET publiceren.

## "Publiceren" / "live zetten"
De site is een **Astro-build**: er wordt altijd de hele site in één keer gepubliceerd.
Gebruik **nooit** meer losse bestanden uploaden (`files`, `deletePaths` of `replaceAll`): dat werkt niet
op een Astro-site.
1. Eerst opslaan (zie hierboven) en `git pull --tags`, zodat het nieuwste werk van de
   ander erin zit en de `live`-tag klopt. Stop bij niet-gecommitte wijzigingen of conflicten.
2. Werk de AI-bestanden bij (nieuwe projecten en blogs komen er zo in):
   `node tools/maak-ai-bestanden.mjs`. Zijn `llms.txt`, `llms-full.txt` of `zoekindex.json`
   daardoor veranderd, sla dan eerst opnieuw op.
3. Bouwen: `npm install` (alleen als `node_modules` ontbreekt), dan `npm run build`.
   (`tools/site-bestanden.mjs` zet de websitebestanden klaar in `.site/`; de build komt in `dist/` en `.wix/`.)
4. Twee zip-bestanden maken in de projectmap:
   `rm -f build.zip source.zip && zip -qr build.zip dist .wix && zip -qr source.zip . -x 'node_modules/*' 'dist/*' '.wix/*' '.astro/*' '.site/*' '.wrangler/*' '.git/*' '.env*' '*.zip'`
5. De huidige versie bij Wix opvragen (nodig om niets te overschrijven): met `ExecuteWixAPI` (site-ID
   hierboven) `POST https://www.wixapis.com/codestore/v2/git-code-store-projects/6ca35a59-2e36-475d-8fe6-831cea9f19c5/generate-download-url`
   met body `{}`; neem `revision.id` als `expectedHeadRevisionId`.
6. Uploaden met `UploadHeadlessWebsiteFiles` in twee stappen:
   - eerst `{ siteId, prepare: true, size: <wc -c < build.zip>, expectedHeadRevisionId }`;
   - voer de `curl -X PUT …`-opdrachten uit het antwoord precies zo uit (build.zip en source.zip);
   - dan de tweede aanroep die het antwoord noemt: `{ siteId, uploadKey, sourceUploadId, expectedHeadRevisionId }`.
   Fout `EXPECTED_HEAD_REQUIRED` of `CODE_STORE_HEAD_CHANGED`: stap 5 opnieuw en dan stap 6 opnieuw.
7. Zet onze `llms.txt` bij Wix (Wix serveert op `/llms.txt` een eigen bestand): met één `ExecuteWixAPI`-aanroep
   (site-ID hierboven) de broncode ophalen die net is opgeslagen (`generate-download-url` uit stap 5,
   `fetch(downloadUrl)`, `wix.unzip`), daaruit `llms.txt` lezen en opslaan met
   `PUT https://www.wixapis.com/promote-seo-robots-server/v2/llms`, body
   `{ "llmsTxt": { "content": <de tekst>, "default": false, "manuallyEdited": true, "subdomain": "www" } }`
   (docs: Update Llms Txt). Controleer daarna dat `<live-url>/llms.txt` begint met "# Yonglo" en het kopje
   "Zo doorzoek je deze site" bevat.
8. Controleer live: open een bericht (`<live-url>/post/<naam>`): er is precies één `<title>`, met de echte
   titel van het bericht (niet "Post | Yonglo"), en `<live-url>/nieuws` moet werken (en `<live-url>/nieuws.html` moet doorsturen naar `/nieuws`).
9. Als het gelukt is: `rm -f build.zip source.zip`, verplaats de tag en push hem:
   `git tag -f live HEAD` en `git push -f origin live`
10. Geef de gebruiker de live URL.

## Goed om te weten
- Pagina-adressen zijn zonder `.html`: `webdesign.html` in de hoofdmap staat live op `/webdesign`
  (`src/pages/[pagina].astro` maakt dat bij het bouwen). Link in de code dus naar `/webdesign`, niet naar
  `/webdesign.html`. Oude `.html`-adressen en adressen van de oude yonglo.com (zoals `/wix-seo`) sturen
  blijvend door (`src/pages/[pagina].html.astro` en `OUDE_ADRESSEN` in `astro.config.mjs`).
  Een nieuwe pagina = een nieuw `.html`-bestand in de hoofdmap; die krijgt vanzelf een adres zonder `.html`.
- Projecten en andere CMS-items worden in het Wix-dashboard aangepast, niet in de code.
  Die wijzigingen staan meteen live, zonder te publiceren.
- Projecten staan op `/project/<slug>`, hetzelfde adres als op de oude yonglo.com. Wix bouwt die pagina op
  de server (`src/pages/project/[slug].astro`, opmaak uit `assets/project-render.js`), dus de volledige
  inhoud en de SEO-tags (titel, omschrijving, deelafbeelding uit het project zelf) staan in de HTML.
  Oude adressen (`project.html?p=…`, en vier oude projectnamen) sturen door naar het nieuwe adres.
  Nieuwe projecten komen bij de volgende publicatie in de sitemap.
- **Koppelingen** (API-integraties zoals Moneybird, Mollie, HubSpot) staan in de CMS-collectie **Koppelingen**
  (Wix-dashboard → CMS → Koppelingen) en elk op `/wix-koppeling/<slug>`, hetzelfde adres als op de oude yonglo.com.
  Wix bouwt die pagina op de server (`src/pages/wix-koppeling/[slug].astro`, gegevens uit `src/koppeling.ts`,
  opmaak uit `assets/koppelingen.js` en `src/components/KoppelingPagina.astro`). Het overzicht met filterknoppen
  staat op `/api#koppelingen` (`assets/koppelingen-lijst.js`; de vaste tegels in `api.html` zijn alleen een terugval).
  Projecten op een koppelingspagina: wat in het CMS bij "Projecten met deze koppeling" is aangevinkt, plus projecten
  waarvan de tekst de naam van de koppeling noemt. Engels: velden `kopEn`, `tekstEn`, `metabeschrijvingEn`; zonder
  `tekstEn` toont `/en/wix-koppeling/<slug>` de Nederlandse tekst en staat die pagina op noindex.
- **Help docs** van de Wix-apps van Yonglo (Smart Cookie Popup, PDF Generator Pro) staan in de CMS-collecties
  **AppsHelpDocs** (artikelen; veld "App", "Parent" voor de volgorde in de boom, "Order") en **AppDocsFAQ** (vragen,
  gekoppeld aan een artikel). Ze staan in het Engels op `/help-docs`, `/help-docs/<app>` en `/help-docs/<app>/<slug>`
  (`src/helpdocs.ts`, `src/components/HelpDocs.astro`, `assets/helpdocs.js`; de tekst wordt omgezet met `assets/blog.js`).
  Een artikel met de status Draft in het CMS is niet zichtbaar. Introtekst en App Market-link per app: `APPS` in
  `assets/helpdocs.js`. (Op 11-11-2026 overgezet vanaf de oude site "Yonglo (oud)".)
- **Regiopagina's (werkgebied)** staan in de CMS-collecties **LandingNl** (`/wix-website/<plaats>`), **LandingBe**
  (`/wix-websites/<plaats>`, u-vorm), **LandingEurope** (`/wix-expert/<land>`, Engels) en **LandingCities**
  (`/wix-design-development/<stad>`, Engels). Overzichten: `/wix-website` (NL/BE) en `/wix-expert` (Europa).
  Code: `src/regio.ts`, `assets/regio.js` (ook de vaste teksten tussen de CMS-velden), `src/components/RegioPagina.astro`.
  Een nieuwe plaats = een nieuw item met een `slug` in de juiste collectie. Oude adressen van de vorige sites
  (`/landing-europe/…`, `/wix/<plaats>`, `/projecten/…`, `/blog/…`, `/en/…`) sturen door; zie ook `src/oude-projecten.ts`
  en `OUDE_ADRESSEN` in `astro.config.mjs`.
- Blogberichten staan in **Wix Blog van deze site** (Wix-dashboard → Blog). Schrijven, aanpassen
  en een categorie kiezen (Yonglo, Projecten, Wix of AI = de filterknoppen) doe je daar; het staat
  dan meteen op `nieuws.html`, de homepage en in de zoekfunctie, zonder te publiceren.
  Elk bericht staat op `/post/<slug>`, hetzelfde adres als op de oude yonglo.com. Wix bouwt die pagina
  op de server (`src/pages/post/[slug].astro`, opmaak en tekstomzetting uit `assets/blog.js`), dus de
  volledige tekst staat in de HTML. Titel, omschrijving en deelafbeelding per bericht pas je aan bij de
  SEO-instellingen van het bericht in Wix. De vaste kaarten in `nieuws.html` zijn alleen een terugval
  voor als Wix niet bereikbaar is.
  (De berichten zijn op 11-11-2026 eenmalig overgezet vanaf de oude Wix-site www.yonglo.com.)
- **AI-assistenten** lezen de site via `llms.txt` (overzicht en uitleg), `llms-full.txt` (alle tekst,
  projecten en blogs) en `zoekindex.json`. Die bestanden worden gemaakt door
  `tools/maak-ai-bestanden.mjs`; pas ze niet met de hand aan. De knoppen "Vraag je AI" (footer en
  `ai.html`) staan in `assets/vraag-ai.js`. Verandert het live adres (bijv. naar www.yonglo.com),
  pas dan `SITE` in het script en `LIVE_SITE` in `vraag-ai.js` aan.
  Wix serveert op `/llms.txt` zijn eigen bestand; stap 7 van "Publiceren" zet onze versie daar via de
  API van Wix in.
- **Engelse website** (`/en/…`): de Engelse pagina's in de map `en/` worden gemaakt door
  `tools/maak-engels.mjs` (draait vanzelf bij `npm run build` en `npm run dev`) uit de Nederlandse pagina's en
  het woordenboek `tools/engels.json` ({ "Nederlandse tekst": "English text" }). Pas `en/*.html` dus nooit met de
  hand aan: verander de Nederlandse pagina en voeg nieuwe teksten toe aan `tools/engels.json`.
  Na een tekstwijziging: `node tools/maak-engels.mjs --check`. Meldt die ontbrekende vertalingen, dan staan ze in
  `tools/engels-ontbrekend.json`; vertaal ze, zet ze in `tools/engels.json` en draai het script opnieuw.
  Zolang een vertaling ontbreekt blijft die tekst op de Engelse pagina Nederlands.
  Teksten in scripts (header, footer, formulieren, zoeken, spel …) hebben hun Engelse versie in het script zelf
  (zoek naar `EN`). Projecten: het CMS heeft per tekstveld een Engels veld met "(EN)" erachter (bijv. "Intro (EN)");
  is dat leeg, dan toont de Engelse site de Nederlandse tekst. Projectpagina's staan ook op `/en/project/<slug>`
  (`src/pages/en/project/[slug].astro` is een kopie van de Nederlandse; pas ze samen aan).
  Blogberichten zijn er alleen in het Nederlands. Elke pagina krijgt op de server een canonical en
  taalversies (hreflang) mee (`src/paginas.ts`). De knop NL/EN in de header wisselt naar dezelfde pagina in de andere taal.
- Werk direct op `main`. Pull voordat je begint, push na elke keer opslaan.
