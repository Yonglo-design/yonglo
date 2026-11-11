// Projectpagina (/project/<naam>): de pagina zelf maakt Wix op de server (src/pages/project/[slug].astro).
// Dit script doet alleen nog het browser-effect voor de mobiele video.
// Maakt de witte achtergrond rond de telefoon in de mobiele video transparant.
// Op basis van de poster wordt eenmalig een masker berekend (vlakvulling vanaf de randen
// over lichte, kleurloze pixels); dat masker gaat als CSS-mask over de video.
function keyPhone(videoEl) {
  const posterUrl = videoEl && videoEl.getAttribute("poster");
  if (!posterUrl) return;
  const im = new Image();
  im.crossOrigin = "anonymous";
  im.onload = () => {
    try {
      // Op ware grootte (max. 720 breed): een kleiner masker wordt uitgerekt en geeft een wazige, lichte rand.
      const W = Math.min(im.naturalWidth, 720), H = Math.round(W * im.naturalHeight / im.naturalWidth);
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(im, 0, 0, W, H);
      const px = ctx.getImageData(0, 0, W, H);
      const d = px.data, n = W * H;
      const light = new Uint8Array(n), seen = new Uint8Array(n), lum = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
        const L = (r * 299 + g * 587 + b * 114) / 1000;
        lum[i] = L;
        light[i] = L > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 28 ? 1 : 0;
      }
      const stack = [];
      const push = i => { if (!seen[i] && light[i]) { seen[i] = 1; stack.push(i); } };
      for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
      while (stack.length) {
        const i = stack.pop(), x = i % W, y = (i - x) / W;
        if (x > 0) push(i - 1);
        if (x < W - 1) push(i + 1);
        if (y > 0) push(i - W);
        if (y < H - 1) push(i + W);
      }
      // De overgangspixels tussen het wit en het frame van de telefoon (de "rand") horen er ook bij:
      // neem de 3 pixels naast het witte gebied mee en maak lichte pixels daarin doorzichtig.
      const edge = seen.slice();
      for (let pass = 0; pass < 3; pass++) {
        const grown = edge.slice();
        for (let i = 0; i < n; i++) {
          if (edge[i]) continue;
          const x = i % W;
          if ((x > 0 && edge[i - 1]) || (x < W - 1 && edge[i + 1]) || (i >= W && edge[i - W]) || (i + W < n && edge[i + W])) grown[i] = 1;
        }
        edge.set(grown);
      }
      let outside = 0;
      for (let i = 0; i < n; i++) {
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 0;
        if (seen[i]) outside++;
        // Wit en lichtgrijs (> 140) weg, donkerder (het frame) geleidelijk zichtbaar, de rest volledig.
        d[i * 4 + 3] = edge[i] ? Math.max(0, Math.min(255, (140 - lum[i]) * 3)) : 255;
      }
      // Alleen toepassen als er echt een witte rand is: bij de standaard telefoonvideo's is dat ±4% van
      // het beeld (de hoeken en randjes om de telefoon). Meer dan 40% betekent dat de vulling het scherm
      // in is gelopen; dan niets doen.
      if (outside < n * 0.01 || outside > n * 0.4) return;
      ctx.putImageData(px, 0, 0);
      const url = `url(${c.toDataURL("image/png")})`;
      videoEl.style.webkitMaskImage = url;
      videoEl.style.maskImage = url;
      videoEl.style.webkitMaskSize = "100% 100%";
      videoEl.style.maskSize = "100% 100%";
      videoEl.classList.add("keyed");
    } catch (e) {
      /* poster niet leesbaar (CORS): video blijft zoals hij is */
    }
  };
  im.src = posterUrl;
}

keyPhone(document.querySelector(".dev-phone video"));
