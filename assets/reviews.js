// Live Google-reviews van Yonglo (Google Bedrijfsprofiel), via de Google Maps JavaScript API (Places).
//
// INSTELLEN: zet hieronder de API-sleutel uit Google Cloud. Beperk die sleutel in Google Cloud tot
// de websites van Yonglo (HTTP-referrers) en tot "Maps JavaScript API" en "Places API (New)".
// Zonder sleutel toont de sectie een nette link naar de reviews op Google.
(function () {
  var GOOGLE_MAPS_API_KEY = "";
  var PLACE_ID = "ChIJi7HE8AbZxkcRgo37ebUsTsw"; // Yonglo, Lichttoren 32, Eindhoven
  var CACHE_KEY = "yonglo-greviews-v1";
  var CACHE_MS = 60 * 60 * 1000; // 1 uur per bezoeker, scheelt API-verzoeken

  var root = document.querySelector("[data-greviews]");
  if (!root) return;
  var rail = root.querySelector(".gr-rail");
  var nf = new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function stars(r) {
    var pct = Math.max(0, Math.min(100, (Number(r) || 0) / 5 * 100));
    return '<span class="gr-stars" style="--p:' + pct + '%" role="img" aria-label="' + esc(nf.format(r || 0)) + ' van 5 sterren"><i>★★★★★</i><i>★★★★★</i></span>';
  }
  var G = '<svg class="gr-g" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

  function fallback() {
    root.classList.add("gr-off");
    var a = root.querySelector('[data-gr="link"]');
    rail.innerHTML = '<a class="gr-card gr-cta" href="' + esc(a ? a.href : "#") + '" target="_blank" rel="noopener">' + G +
      '<b>Lees wat klanten over Yonglo zeggen</b><span>Al onze reviews staan op Google</span><i class="arr">→</i></a>';
  }

  function render(d) {
    root.classList.remove("gr-loading");
    if (d.rating) {
      root.querySelector('[data-gr="rating"]').textContent = nf.format(d.rating);
      root.querySelector('[data-gr="stars"]').innerHTML = stars(d.rating);
    }
    if (d.count) root.querySelector('[data-gr="count"]').textContent = "Op basis van " + d.count + " reviews op Google";
    if (d.url) root.querySelector('[data-gr="link"]').href = d.url;
    var list = (d.reviews || []).filter(function (r) { return r.text; });
    if (!list.length) { fallback(); return; }
    rail.innerHTML = list.map(function (r, i) {
      var name = esc(r.author || "Google-gebruiker");
      var who = r.authorUrl ? '<a href="' + esc(r.authorUrl) + '" target="_blank" rel="noopener">' + name + "</a>" : name;
      var av = r.photo ? '<img src="' + esc(r.photo) + '" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer">' : "<span>" + name.charAt(0) + "</span>";
      return '<article class="gr-card rv in" style="--d:' + (i * 0.08) + 's">' +
        '<header><span class="gr-av">' + av + '</span><div><b>' + who + '</b><small>' + esc(r.when || "") + "</small></div>" + G + "</header>" +
        stars(r.rating) +
        '<p class="gr-text">' + esc(r.text) + "</p>" +
        '<button class="gr-more" type="button" hidden>Lees meer</button></article>';
    }).join("");
    rail.querySelectorAll(".gr-card").forEach(function (c) {
      var t = c.querySelector(".gr-text"), b = c.querySelector(".gr-more");
      if (t.scrollHeight > t.clientHeight + 4) {
        b.hidden = false;
        b.addEventListener("click", function () { var o = c.classList.toggle("open"); b.textContent = o ? "Minder" : "Lees meer"; });
      }
    });
    navState();
  }

  // Pijltjes om door de reviews te bladeren
  var prev = root.querySelector(".gr-prev"), next = root.querySelector(".gr-next");
  function step() { var c = rail.querySelector(".gr-card"); return c ? c.getBoundingClientRect().width + 20 : 320; }
  function navState() {
    if (!prev) return;
    prev.disabled = rail.scrollLeft < 8;
    next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
  }
  if (prev) {
    prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
    rail.addEventListener("scroll", navState, { passive: true });
    window.addEventListener("resize", navState);
  }

  function fromCache() {
    try {
      var c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
      if (c && Date.now() - c.t < CACHE_MS) return c.d;
    } catch (e) {}
    return null;
  }
  function toCache(d) { try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }

  function loadMaps() {
    return new Promise(function (res, rej) {
      if (window.google && google.maps && google.maps.importLibrary) return res();
      window.__grInit = function () { res(); };
      var s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(GOOGLE_MAPS_API_KEY) +
        "&v=weekly&language=nl&region=NL&loading=async&callback=__grInit";
      s.async = true; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function fetchLive() {
    return loadMaps().then(function () { return google.maps.importLibrary("places"); }).then(function (lib) {
      var place = new lib.Place({ id: PLACE_ID, requestedLanguage: "nl" });
      return place.fetchFields({ fields: ["rating", "userRatingCount", "reviews", "googleMapsURI"] }).then(function () {
        return {
          rating: place.rating, count: place.userRatingCount, url: place.googleMapsURI,
          reviews: (place.reviews || []).map(function (r) {
            var a = r.authorAttribution || {};
            return { author: a.displayName, authorUrl: a.uri, photo: a.photoURI, rating: r.rating, text: r.text || r.originalText || "", when: r.relativePublishTimeDescription };
          })
        };
      });
    });
  }

  if (!GOOGLE_MAPS_API_KEY) { root.classList.remove("gr-loading"); fallback(); return; }
  var cached = fromCache();
  if (cached) { render(cached); return; }
  // Pas laden als de sectie in beeld komt (scheelt laadtijd en API-verzoeken)
  var started = false;
  function go() {
    if (started) return; started = true;
    fetchLive().then(function (d) { toCache(d); render(d); }).catch(function (e) { console.error(e); root.classList.remove("gr-loading"); fallback(); });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); } }, { rootMargin: "400px" });
    io.observe(root);
  } else go();
})();
