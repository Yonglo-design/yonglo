// Bedanktpagina: tekst die aansluit bij het formulier dat net is ingevuld (?f=<type>).
(function () {
  var q = new URLSearchParams(location.search);
  var info = {};
  try { info = JSON.parse(sessionStorage.getItem("yl-thanks") || "{}"); } catch (e) {}
  var type = q.get("f") || info.type || "kennismaking";
  var site = (info.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  var steps = {
    std: [["Bericht ontvangen", "Je aanvraag staat veilig bij ons in de inbox."], ["We bekijken je aanvraag", "We verdiepen ons in je bedrijf en je wensen."], ["We nemen contact op", "Per mail of telefoon, om samen de volgende stap te zetten."]],
    seo: [["Aanvraag ontvangen", "Je SEO-scan staat in de planning."], ["We analyseren je website", "Techniek, inhoud, snelheid en zichtbaarheid in Google én AI-zoekresultaten."], ["Jij ontvangt je scan", "Met praktische verbeterpunten, helemaal vrijblijvend."]],
    offerte: [["Aanvraag ontvangen", "Je wensen staan veilig bij ons in de inbox."], ["We bekijken je wensen", "Hebben we nog vragen, dan nemen we eerst even contact op."], ["Je ontvangt een offerte", "Helder en op maat, zonder verrassingen."]],
    bellen: [["Verzoek ontvangen", "Je terugbelverzoek staat bij ons in de inbox."], ["We plannen een moment", "Zodat we rustig de tijd voor je hebben."], ["We bellen je terug", "En beantwoorden je vraag direct."]],
    optimaal: [["Aanvraag ontvangen", "Je aanvraag voor Wix Optimaal staat bij ons in de inbox."], ["We bekijken je website", "We kijken naar design, snelheid, vindbaarheid en gebruiksgemak."], ["We bespreken de verbeterpunten", "En wat het pakket concreet voor jouw website doet."]],
  };

  var T = {
    kennismaking: { k: "Bericht ontvangen", sub: "We maken graag kennis met je.", text: "Je bericht is goed aangekomen. We lezen het aandachtig en nemen zo snel mogelijk contact met je op om een vrijblijvende kennismaking in te plannen.", s: "std" },
    project: { k: "Bericht ontvangen", sub: "Op naar je nieuwe project.", text: "Leuk dat je met ons wilt bouwen aan iets nieuws. We bekijken je plannen en nemen zo snel mogelijk contact met je op voor een kennismaking.", s: "std" },
    "seo-scan": { k: "SEO-scan aangevraagd", sub: "Je gratis SEO-scan komt eraan.", text: "We lichten " + (site ? site : "je website") + " grondig door op vindbaarheid in Google én in AI-zoekresultaten. De uitkomst, met praktische verbeterpunten, sturen we je per e-mail.", s: "seo", link: ["/seo", "Meer over SEO & GEO"] },
    offerte: { k: "Offerteaanvraag ontvangen", sub: "Je offerteaanvraag is binnen.", text: "Dank voor je vertrouwen. We bekijken je wensen zorgvuldig en stellen een offerte op maat voor je op.", s: "offerte" },
    terugbellen: { k: "Terugbelverzoek ontvangen", sub: "We bellen je terug.", text: "Je verzoek is goed aangekomen. We bellen je zo snel mogelijk terug op het nummer dat je hebt opgegeven.", s: "bellen", link: ["/contact#faq", "Bekijk de veelgestelde vragen"] },
    optimaal: { k: "Aanvraag ontvangen", sub: "Tijd voor een nog betere website.", text: "Mooi dat je je Wix-website naar een hoger niveau wilt tillen. We bekijken je huidige website en nemen zo snel mogelijk contact met je op over het pakket dat het beste bij je past.", s: "optimaal", link: ["/optimaal#prijzen", "Bekijk de pakketten"], d: "Gekozen pakket" },
    webdesign: { k: "Bericht ontvangen", sub: "Laten we iets moois bouwen.", text: "Je bericht over je nieuwe website is goed aangekomen. We bekijken je plannen en nemen zo snel mogelijk contact met je op voor een vrijblijvende kennismaking.", s: "std" },
    ecommerce: { k: "Bericht ontvangen", sub: "Klaar om online te verkopen.", text: "Je aanvraag voor een webshop is goed aangekomen. We bekijken je situatie en nemen zo snel mogelijk contact met je op om je webshop samen vorm te geven.", s: "std" },
    development: { k: "Bericht ontvangen", sub: "Samen bouwen we de oplossing.", text: "Je aanvraag voor maatwerk is goed aangekomen. We verdiepen ons in je wens en nemen zo snel mogelijk contact met je op om de mogelijkheden te bespreken.", s: "std" },
    branding: { k: "Bericht ontvangen", sub: "Op naar een merk dat opvalt.", text: "Je bericht is goed aangekomen. We bekijken je plannen voor je merk en nemen zo snel mogelijk contact met je op voor een vrijblijvende kennismaking.", s: "std" },
    wix: { k: "Bericht ontvangen", sub: "Think Wix, think Yonglo.", text: "Je bericht is goed aangekomen. We bekijken je plannen en nemen zo snel mogelijk contact met je op om je te adviseren over de mogelijkheden van Wix voor jouw bedrijf.", s: "std" },
    ai: { k: "Bericht ontvangen", sub: "Slimmer werken begint hier.", text: "Je aanvraag is goed aangekomen. We bekijken waar AI in jouw bedrijf het meeste oplevert en nemen zo snel mogelijk contact met je op.", s: "std", link: ["/ai", "Meer over AI oplossingen"] },
    api: { k: "Bericht ontvangen", sub: "Straks werkt alles naadloos samen.", text: "Je aanvraag is goed aangekomen. We bekijken welke koppelingen je nodig hebt en nemen zo snel mogelijk contact met je op.", s: "std", link: ["/api#integraties", "Bekijk de koppelingen"] },
  };
  var t = T[type] || T.kennismaking;
  var set = function (k, v) { var el = document.querySelector('[data-ty="' + k + '"]'); if (el && v) el.textContent = v; };

  set("kicker", t.k);
  set("title", "Bedankt" + (info.naam ? ", " + info.naam : "") + "!");
  set("sub", t.sub);
  set("text", t.text);
  var st = steps[t.s] || steps.std;
  st.forEach(function (s, i) { set("s" + (i + 1) + "t", s[0]); set("s" + (i + 1), s[1]); });
  if (t.d && info.detail && info.type === type) {
    var d = document.querySelector('[data-ty="detail"]');
    d.textContent = (t.d || "Je keuze") + ": " + info.detail;
    d.hidden = false;
  }
  if (t.link) { var a = document.querySelector("[data-ty-link]"); if (a) { a.href = t.link[0]; a.textContent = t.link[1]; } }
  document.title = "Bedankt" + (info.naam ? ", " + info.naam : "") + "! | Yonglo";

  // feestelijke confetti
  var box = document.querySelector(".ty-confetti");
  if (box && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var cols = ["#325FFC", "#7A97FD", "#FF7A59", "#7fe0cf", "#FFC94D", "#ffffff"];
    for (var i = 0; i < 46; i++) {
      var c = document.createElement("i");
      c.style.left = Math.random() * 100 + "%";
      c.style.background = cols[i % cols.length];
      c.style.setProperty("--dx", (Math.random() * 160 - 80).toFixed(0) + "px");
      c.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg");
      c.style.animationDelay = (0.3 + Math.random() * 0.9).toFixed(2) + "s";
      c.style.animationDuration = (2.6 + Math.random() * 1.8).toFixed(2) + "s";
      if (i % 3 === 0) c.style.borderRadius = "50%";
      box.appendChild(c);
    }
  }
})();
