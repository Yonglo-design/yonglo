# Yonglo website

De website van Yonglo: HTML/CSS/JS-pagina's, gehost op Wix (headless, Astro).
Projecten, blogberichten en andere content beheer je in het Wix-dashboard.

## Samenwerken met Claude Code

Open Claude Code in deze map en gebruik deze woorden:

| Zeg | Wat er gebeurt |
|---|---|
| **opslaan** | Je wijzigingen gaan naar GitHub (en je krijgt die van de ander) |
| **preview** | Bekijk de site op je eigen computer, de live site blijft ongewijzigd |
| **publiceren** | De nieuwste versie gaat live |

Claude volgt de regels in [CLAUDE.md](CLAUDE.md).

## Eenmalig instellen

1. Toegang tot deze GitHub-repo en tot de Wix-site (Wix-dashboard → Settings → Roles & Permissions).
2. Koppel in claude.ai de **Wix-connector** (Instellingen → Connectors → Wix) en log in met je Wix-account.
3. Installeer [Node.js](https://nodejs.org) (versie 22 of nieuwer); nodig voor preview en publiceren.
4. Zeg tegen Claude Code: *"Clone https://github.com/Yonglo-design/yonglo en lees de CLAUDE.md."*

## Wat staat waar

- `*.html`: de pagina's
- `assets/`: CSS, JavaScript en afbeeldingen
- `assets/wix/`: koppeling met Wix (CMS-content ophalen)
- `_wix/`: Wix-instellingen voor de hosting
- `src/pages/post/[slug].astro`: de blogpagina (`/post/<naam>`), door Wix op de server opgebouwd
- `package.json`, `astro.config.mjs`, `wix.config.json`: instellingen voor de build bij het publiceren
- `llms.txt`, `llms-full.txt`, `zoekindex.json`: de site in gewone tekst voor AI-assistenten (gemaakt met `node tools/maak-ai-bestanden.mjs`)
- `tools/`: hulpscripts, worden niet geüpload
