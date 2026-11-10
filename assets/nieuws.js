// Nieuws: berichten filteren op onderwerp
(function () {
  var bar = document.querySelector(".nw-bar");
  if (!bar) return;
  var items = document.querySelectorAll(".nw-feat, .nw-card");
  bar.addEventListener("click", function (e) {
    var b = e.target.closest(".nw-chip");
    if (!b) return;
    var f = b.dataset.f;
    bar.querySelectorAll(".nw-chip").forEach(function (c) {
      var on = c === b;
      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    items.forEach(function (el) {
      el.hidden = !(f === "Alles" || el.dataset.cat === f);
    });
  });
})();
