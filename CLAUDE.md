# Projectregels voor Claude Code

Dit is de website van Yonglo: een **statische HTML-site** (HTML, CSS en JavaScript, geen
framework en geen build-stap), gehost als Wix headless-site. Content zoals projecten komt
uit het Wix CMS via `assets/wix/`.

Er werken twee mensen aan. Ze zijn niet per se developers: voer alle git- en Wix-stappen
zelf uit en leg in gewone, korte taal uit wat je gedaan hebt. Vraag ze nooit om zelf
git-commando's te typen. Praat Nederlands.

## Belangrijke gegevens
- Wix site-ID (metaSiteId): `0b565482-d578-4a51-866a-655eed271d6b` (staat ook in `assets/wix/wix-config.js`)
- Publiceren gaat via de **Wix-connector** van Claude (tool `UploadHeadlessWebsiteFiles`),
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
Start een lokale webserver in de projectmap, bijvoorbeeld `python3 -m http.server 8000`
(of `npx serve .`), en geef de gebruiker de link `http://localhost:8000`.
Openen als bestand (`file://`) werkt niet, omdat de scripts modules zijn.
Als CMS-content lokaal niet laadt, tonen de pagina's de vaste HTML-inhoud; dat is normaal.
Dit is alleen zichtbaar op de eigen computer. NIET publiceren.

## "Publiceren" / "live zetten"
1. Eerst opslaan (zie hierboven) en `git pull --tags`, zodat het nieuwste werk van de
   ander erin zit en de `live`-tag klopt. Stop bij niet-gecommitte wijzigingen of conflicten.
2. Bepaal wat er sinds de vorige publicatie veranderd is:
   `git diff --name-status live HEAD`
3. Upload met `UploadHeadlessWebsiteFiles` naar site-ID `0b565482-d578-4a51-866a-655eed271d6b`:
   - alle **toegevoegde en gewijzigde** bestanden, elk **volledig** (een geüpload bestand
     vervangt het hele bestand op de site);
   - **verwijderde** bestanden in `deletePaths`;
   - gebruik **nooit** `replaceAll`.
   - Upload **niet**: `CLAUDE.md`, `README.md`, `.gitignore` en andere bestanden die niet
     bij de website horen.
   - Afbeeldingen en andere binaire bestanden gaan als base64. Max. 10 MB per upload,
     dus splits grote uploads op in meerdere keren.
4. Als de upload gelukt is: verplaats de tag en push hem:
   `git tag -f live HEAD` en `git push -f origin live`
5. Geef de gebruiker de live URL.

## Goed om te weten
- Projecten en andere CMS-items worden in het Wix-dashboard aangepast, niet in de code.
  Die wijzigingen staan meteen live, zonder te publiceren.
- Werk direct op `main`. Pull voordat je begint, push na elke keer opslaan.
