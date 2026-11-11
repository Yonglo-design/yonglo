// Blogbericht (/post/<naam>): de pagina zelf maakt Wix op de server (src/pages/post/[slug].astro).
// Dit script doet alleen de knoppen: video's afspelen (YouTube laadt pas na een klik) en de link kopiëren.
(function () {
  document.addEventListener("click", function (e) {
    var yt = e.target.closest && e.target.closest("a.yt[data-yt]");
    if (yt) {
      e.preventDefault();
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + yt.dataset.yt + "?autoplay=1&rel=0" + (yt.dataset.start ? "&start=" + yt.dataset.start : "");
      f.title = "YouTube-video";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.allowFullscreen = true;
      yt.replaceWith(f);
      return;
    }
    var cp = e.target.closest && e.target.closest(".post-copy");
    if (cp && navigator.clipboard) {
      navigator.clipboard.writeText(location.origin + location.pathname).then(function () {
        var t = document.querySelector(".toast");
        if (!t) return;
        t.textContent = "Link gekopieerd";
        t.classList.add("show");
        setTimeout(function () { t.classList.remove("show"); }, 3200);
      }).catch(function () {});
    }
  });
})();
