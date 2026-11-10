// Hero B: bouwfases van het browservenster, interactief puntenveld en tilt op muis/scroll.
(function () {
  var hero = document.querySelector(".hx");
  if (!hero) return;
  var win = hero.querySelector(".hx-win");
  var steps = [].slice.call(hero.querySelectorAll(".hx-steps li:not(.hx-pill)"));
  var pill = hero.querySelector(".hx-pill");
  var url = hero.querySelector(".hx-url-t");
  var cursor = hero.querySelector(".hx-cursor");
  var btn = hero.querySelector(".hx-btn");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var URLS = ["idee.txt", "concept.jouwbedrijf.nl", "jouwbedrijf.nl", "jouwbedrijf.nl"];
  var phase = 0, timer = null, visible = true;

  function movePill() {
    var on = steps[phase];
    if (!on || !pill) return;
    pill.style.width = on.offsetWidth + "px";
    pill.style.transform = "translateX(" + (on.offsetLeft - 6) + "px)";
  }
  function setPhase(p) {
    phase = p;
    win.setAttribute("data-phase", p);
    win.classList.remove("hx-done");
    steps.forEach(function (s, i) { s.classList.toggle("on", i === p); });
    url.textContent = URLS[p];
    movePill();
    if (p === 3) {
      // cursor beweegt naar de knop en "publiceert"
      cursor.style.left = "72%"; cursor.style.top = "86%";
      setTimeout(function () {
        var wr = win.getBoundingClientRect(), br = btn.getBoundingClientRect();
        cursor.style.left = ((br.left - wr.left + br.width * 0.55) / wr.width * 100) + "%";
        cursor.style.top = ((br.top - wr.top + br.height * 0.55) / wr.height * 100) + "%";
      }, 120);
      setTimeout(function () { cursor.classList.remove("click"); void cursor.offsetWidth; cursor.classList.add("click"); win.classList.add("hx-done"); }, 1100);
    }
  }
  var DUR = [2600, 2200, 2200, 3600];
  function loop() {
    clearTimeout(timer);
    if (!visible) return;
    timer = setTimeout(function () { setPhase((phase + 1) % 4); loop(); }, DUR[phase]);
  }
  steps.forEach(function (s, i) { s.addEventListener("click", function () { setPhase(i); loop(); }); s.style.cursor = "pointer"; });
  window.addEventListener("resize", movePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  if (reduce) { setPhase(3); win.classList.add("hx-done"); }
  else {
    setPhase(0);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) loop(); else clearTimeout(timer); }, { threshold: 0.15 }).observe(hero);
    } else loop();
  }

  // Tilt: venster kantelt naar de muis en richt zich op bij het scrollen
  var mx = 0, my = 0, sy = 0, raf = 0;
  function tilt() {
    raf = 0;
    if (innerWidth < 768) return;
    var flat = Math.min(1, sy / (innerHeight * 0.6));
    win.style.setProperty("--tx", (14 * (1 - flat) - my * 3).toFixed(2) + "deg");
    win.style.setProperty("--ty", (mx * 4).toFixed(2) + "deg");
  }
  function req() { if (!raf) raf = requestAnimationFrame(tilt); }
  if (!reduce) {
    hero.addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; req(); });
    window.addEventListener("scroll", function () { sy = scrollY; req(); }, { passive: true });
  }

  // Puntenveld dat oplicht en wijkt rond de cursor
  var cv = hero.querySelector(".hx-field");
  if (!cv || reduce) return;
  var ctx = cv.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), W = 0, H = 0, pts = [], px = -999, py = -999, t0 = performance.now();
  function size() {
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pts = []; var g = innerWidth < 768 ? 30 : 28;
    for (var y = g / 2; y < H; y += g) for (var x = g / 2; x < W; x += g) pts.push(x, y);
  }
  size(); window.addEventListener("resize", size);
  hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });
  hero.addEventListener("pointerleave", function () { px = py = -999; });
  (function draw(now) {
    requestAnimationFrame(draw);
    if (!visible) return;
    var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i += 2) {
      var x = pts[i], y = pts[i + 1];
      var wave = Math.sin(x * 0.012 + t * 1.2) * Math.cos(y * 0.015 - t * 0.8);
      var dx = x - px, dy = y - py, d = Math.sqrt(dx * dx + dy * dy), f = Math.max(0, 1 - d / 190);
      var ox = d > 0 ? dx / d * f * 14 : 0, oy = d > 0 ? dy / d * f * 14 : 0;
      var a = 0.09 + 0.06 * (wave + 1) / 2 + f * 0.55;
      ctx.fillStyle = f > 0.02 ? "rgba(157,160,255," + a.toFixed(3) + ")" : "rgba(255,255,255," + a.toFixed(3) + ")";
      var s = 1 + f * 1.6;
      ctx.fillRect(x + ox - s / 2, y + oy - s / 2, s, s);
    }
  })(t0);
})();
