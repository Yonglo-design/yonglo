// Bedanktpagina: tekst die aansluit bij het formulier dat net is ingevuld (?f=<type>).
(function () {
  // ---- Engelse teksten ----
  var STEPS_EN = {
    std: [["Message received", "Your request is safely in our inbox."], ["We review your request", "We get to know your business and your wishes."], ["We get in touch", "By email or phone, to take the next step together."]],
    seo: [["Request received", "Your SEO scan has been scheduled."], ["We analyse your website", "Technology, content, speed and visibility in Google and AI search results."], ["You receive your scan", "With practical points for improvement, with no obligation."]],
    offerte: [["Request received", "Your wishes are safely in our inbox."], ["We review your wishes", "If we have any questions, we'll get in touch with you first."], ["You receive a quote", "Clear and tailored, with no surprises."]],
    bellen: [["Request received", "Your callback request is in our inbox."], ["We schedule a moment", "So we can take our time for you."], ["We call you back", "And answer your question right away."]],
    optimaal: [["Request received", "Your Wix Optimaal request is in our inbox."], ["We review your website", "We look at design, speed, findability and ease of use."], ["We discuss the improvements", "And what the package will concretely do for your website."]],
  };
  function T_EN(site) {
    return {
      kennismaking: { k: "Message received", sub: "We'd love to get to know you.", text: "Your message has arrived safely. We'll read it carefully and get in touch as soon as possible to schedule a no-obligation introduction.", s: "std" },
      project: { k: "Message received", sub: "On to your new project.", text: "Great that you want to build something new with us. We'll look at your plans and get in touch as soon as possible for an introduction.", s: "std" },
      "seo-scan": { k: "SEO scan requested", sub: "Your free SEO scan is on its way.", text: "We'll thoroughly check " + (site ? site : "your website") + " for findability in Google and in AI search results. We'll email you the outcome, with practical points for improvement.", s: "seo", link: ["/en/seo", "More about SEO & GEO"] },
      offerte: { k: "Quote request received", sub: "Your quote request is in.", text: "Thank you for your trust. We'll review your wishes carefully and prepare a tailored quote for you.", s: "offerte" },
      terugbellen: { k: "Callback request received", sub: "We'll call you back.", text: "Your request has arrived safely. We'll call you back as soon as possible on the number you provided.", s: "bellen", link: ["/en/contact#faq", "See the frequently asked questions"] },
      optimaal: { k: "Request received", sub: "Time for an even better website.", text: "Great that you want to take your Wix website to the next level. We'll review your current website and get in touch as soon as possible about the package that suits you best.", s: "optimaal", link: ["/en/optimaal#prijzen", "View the packages"], d: "Chosen package" },
      webdesign: { k: "Message received", sub: "Let's build something beautiful.", text: "Your message about your new website has arrived safely. We'll look at your plans and get in touch as soon as possible for a no-obligation introduction.", s: "std" },
      ecommerce: { k: "Message received", sub: "Ready to sell online.", text: "Your request for an online store has arrived safely. We'll look at your situation and get in touch as soon as possible to shape your store together.", s: "std" },
      development: { k: "Message received", sub: "Together we'll build the solution.", text: "Your request for custom work has arrived safely. We'll dig into your wishes and get in touch as soon as possible to discuss the possibilities.", s: "std" },
      branding: { k: "Message received", sub: "On to a brand that stands out.", text: "Your message has arrived safely. We'll look at your plans for your brand and get in touch as soon as possible for a no-obligation introduction.", s: "std" },
      wix: { k: "Message received", sub: "Think Wix, think Yonglo.", text: "Your message has arrived safely. We'll look at your plans and get in touch as soon as possible to advise you on what Wix can do for your business.", s: "std" },
      ai: { k: "Message received", sub: "Working smarter starts here.", text: "Your request has arrived safely. We'll look at where AI adds the most value to your business and get in touch as soon as possible.", s: "std", link: ["/en/ai", "More about AI solutions"] },
      api: { k: "Message received", sub: "Soon everything will work together seamlessly.", text: "Your request has arrived safely. We'll look at which integrations you need and get in touch as soon as possible.", s: "std", link: ["/en/api#integraties", "View the integrations"] },
    };
  }

  var q = new URLSearchParams(location.search);
  var info = {};
  try { info = JSON.parse(sessionStorage.getItem("yl-thanks") || "{}"); } catch (e) {}
  var type = q.get("f") || info.type || "kennismaking";
  var site = (info.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  var EN = document.documentElement.lang === "en"; // Engelse website (/en/bedankt)
  var steps = EN ? STEPS_EN : {
    std: [["Bericht ontvangen", "Je aanvraag staat veilig bij ons in de inbox."], ["We bekijken je aanvraag", "We verdiepen ons in je bedrijf en je wensen."], ["We nemen contact op", "Per mail of telefoon, om samen de volgende stap te zetten."]],
    seo: [["Aanvraag ontvangen", "Je SEO-scan staat in de planning."], ["We analyseren je website", "Techniek, inhoud, snelheid en zichtbaarheid in Google én AI-zoekresultaten."], ["Jij ontvangt je scan", "Met praktische verbeterpunten, helemaal vrijblijvend."]],
    offerte: [["Aanvraag ontvangen", "Je wensen staan veilig bij ons in de inbox."], ["We bekijken je wensen", "Hebben we nog vragen, dan nemen we eerst even contact op."], ["Je ontvangt een offerte", "Helder en op maat, zonder verrassingen."]],
    bellen: [["Verzoek ontvangen", "Je terugbelverzoek staat bij ons in de inbox."], ["We plannen een moment", "Zodat we rustig de tijd voor je hebben."], ["We bellen je terug", "En beantwoorden je vraag direct."]],
    optimaal: [["Aanvraag ontvangen", "Je aanvraag voor Wix Optimaal staat bij ons in de inbox."], ["We bekijken je website", "We kijken naar design, snelheid, vindbaarheid en gebruiksgemak."], ["We bespreken de verbeterpunten", "En wat het pakket concreet voor jouw website doet."]],
  };

  var T = EN ? T_EN(site) : {
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
  set("title", (EN ? "Thank you" : "Bedankt") + (info.naam ? ", " + info.naam : "") + "!");
  set("sub", t.sub);
  set("text", t.text);
  var st = steps[t.s] || steps.std;
  st.forEach(function (s, i) { set("s" + (i + 1) + "t", s[0]); set("s" + (i + 1), s[1]); });
  if (t.d && info.detail && info.type === type) {
    var d = document.querySelector('[data-ty="detail"]');
    d.textContent = (t.d || (EN ? "Your choice" : "Je keuze")) + ": " + info.detail;
    d.hidden = false;
  }
  if (t.link) { var a = document.querySelector("[data-ty-link]"); if (a) { a.href = t.link[0]; a.textContent = t.link[1]; } }
  document.title = (EN ? "Thank you" : "Bedankt") + (info.naam ? ", " + info.naam : "") + "! | Yonglo";

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
