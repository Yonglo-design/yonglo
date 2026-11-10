// Pixel Perfect: bouw de hoogste website. Blokken (header, hero, knop …) schuiven heen en weer;
// tik/klik/spatie om te plaatsen. Wat uitsteekt valt eraf. Precies op elkaar = Perfect!
// Highscores staan in de Wix CMS-collectie "Highscores" (beheer: Wix dashboard → CMS).
import { queryDataItems } from "./wix/wix-cms.js";
import { wixApiRequest } from "./wix/wix-client.js";

const COLLECTION = "Highscores";
const wrap = document.querySelector(".pp-stage");
const cv = document.getElementById("pp-canvas");
const ctx = cv.getContext("2d");
const $ = s => document.querySelector(s);
const ui = {
  start: $("#pp-start"), over: $("#pp-over"), score: $("#pp-score"), best: $("#pp-best"),
  overScore: $("#pp-o-score"), overTitle: $("#pp-o-title"), overText: $("#pp-o-text"), overBest: $("#pp-o-best"),
  form: $("#pp-form"), name: $("#pp-name"), msg: $("#pp-msg"), list: $("#pp-list"),
};

const COLORS = ["#325FFC", "#7A97FD", "#FF7A59", "#2BC4A8", "#FFC94D", "#99AFFE", "#8B5CF6"];
const TYPES = ["Header", "Hero", "Tekst", "Knop", "Foto", "Slider", "Formulier", "Reviews", "Video", "Footer"];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let W = 0, H = 0, BH = 44, dpr = 1;
let stack, cur, debris, fx, cam, camT, score, perfects, combo, state = "idle", last = 0, speed;

let best = 0;
try { best = Number(localStorage.getItem("yl-pp-best")) || 0; } catch (e) {}
ui.best.textContent = best;

function resize() {
  const r = wrap.getBoundingClientRect();
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = Math.round(r.width); H = Math.round(r.height);
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  BH = W < 480 ? 38 : 44;
  if (state === "idle") reset();
  draw();
}

function reset() {
  const w = Math.round(W * 0.56);
  stack = [{ x: Math.round((W - w) / 2), w, color: "#1b1d33", type: "Fundament" }];
  debris = []; fx = []; cam = 0; camT = 0; score = 0; perfects = 0; combo = 0;
  speed = W * 0.42;
  spawn();
  ui.score.textContent = "0";
}

function spawn() {
  const top = stack[stack.length - 1];
  const i = stack.length;
  const fromLeft = i % 2 === 1;
  cur = { w: top.w, x: fromLeft ? -top.w * 0.6 : W - top.w * 0.4, dir: fromLeft ? 1 : -1, color: COLORS[(i - 1) % COLORS.length], type: TYPES[(i - 1) % TYPES.length] };
  speed = Math.min(W * 1.25, W * 0.42 + i * W * 0.018);
}

const rowY = i => H - 26 - (i + 1) * BH + cam;

function drop() {
  if (state !== "play") return;
  const top = stack[stack.length - 1];
  const tol = Math.max(4, W * 0.008);
  let x = cur.x, w = cur.w;
  if (Math.abs(x - top.x) <= tol) {
    // perfect: precies erop
    x = top.x; combo++; perfects++;
    if (combo >= 3) { const grow = Math.min(W * 0.03, W * 0.6 - w); if (grow > 0) { x -= grow / 2; w += grow; } }
    score += 2;
    fx.push({ t: 0, x, w, i: stack.length, text: combo > 1 ? `Perfect ×${combo}` : "Perfect!" });
    if (navigator.vibrate) try { navigator.vibrate(18); } catch (e) {}
  } else {
    combo = 0;
    const l = Math.max(x, top.x), r = Math.min(x + w, top.x + top.w);
    if (r <= l) { // mis: het blok valt
      debris.push({ x, w, y: rowY(stack.length), vy: 0, rot: 0, vr: (Math.random() - .5) * .08, color: cur.color, type: cur.type });
      return gameOver();
    }
    // stuk dat uitsteekt valt eraf
    if (x < l) debris.push({ x, w: l - x, y: rowY(stack.length), vy: 0, rot: 0, vr: -.04, color: cur.color, type: "" });
    if (x + w > r) debris.push({ x: r, w: x + w - r, y: rowY(stack.length), vy: 0, rot: 0, vr: .04, color: cur.color, type: "" });
    x = l; w = r - l;
    score += 1;
  }
  stack.push({ x, w, color: cur.color, type: cur.type });
  ui.score.textContent = score;
  const ms = { 10: "Mooie landingspagina!", 25: "Een complete website!", 40: "Wix Studio-niveau!", 60: "Wix Legend!" }[stack.length - 1];
  if (ms) fx.push({ t: 0, x: 0, w: W, i: stack.length - 1, text: ms, big: true });
  camT = Math.max(0, (stack.length + 1) * BH - H * 0.55);
  spawn();
}

function gameOver() {
  state = "over";
  const blocks = stack.length - 1;
  const newBest = score > best;
  if (newBest) { best = score; try { localStorage.setItem("yl-pp-best", String(best)); } catch (e) {} }
  ui.best.textContent = best;
  setTimeout(() => {
    ui.overScore.textContent = score;
    ui.overTitle.textContent = newBest && score > 0 ? "Nieuw record!" : blocks >= 25 ? "Wat een website!" : blocks >= 10 ? "Netjes gebouwd!" : "Bijna pixel perfect…";
    ui.overText.textContent = `Je website is ${blocks} ${blocks === 1 ? "blok" : "blokken"} hoog, met ${perfects} perfecte ${perfects === 1 ? "plaatsing" : "plaatsingen"}.`;
    ui.overBest.textContent = best;
    ui.form.hidden = score < 1;
    ui.msg.textContent = "";
    ui.form.querySelector("button").disabled = false;
    ui.over.hidden = false;
    requestAnimationFrame(() => ui.over.classList.add("on"));
    (score >= 1 ? ui.name : ui.over.querySelector(".pp-again")).focus({ preventScroll: true });
  }, reduce ? 200 : 900);
}

function start() {
  reset();
  state = "play";
  ui.start.hidden = true;
  ui.over.classList.remove("on");
  ui.over.hidden = true;
  wrap.focus({ preventScroll: true });
  last = performance.now();
  requestAnimationFrame(loop);
}

function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (state === "play") {
    cur.x += cur.dir * speed * dt;
    const minX = -cur.w * 0.6, maxX = W - cur.w * 0.4;
    if (cur.x > maxX) { cur.x = maxX; cur.dir = -1; }
    if (cur.x < minX) { cur.x = minX; cur.dir = 1; }
  }
  cam += (camT - cam) * Math.min(1, dt * 6);
  debris.forEach(d => { d.vy += 1600 * dt; d.y += d.vy * dt; d.rot += d.vr; });
  debris = debris.filter(d => d.y < H + 200);
  fx.forEach(f => f.t += dt);
  fx = fx.filter(f => f.t < 1.2);
  draw();
  if (state === "play" || debris.length || fx.length) requestAnimationFrame(loop);
}

// ---------- tekenen ----------
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function block(x, y, w, color, type, alpha = 1) {
  const h = BH - 4;
  ctx.save();
  ctx.globalAlpha = alpha;
  rr(x, y + 2, w, h, 7); ctx.fillStyle = color; ctx.fill();
  ctx.clip();
  // lichte rand bovenaan
  ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(x, y + 2, w, 3);
  const dark = color === "#FFC94D" || color === "#99AFFE" || color === "#2BC4A8";
  const ink = dark ? "rgba(14,15,26," : "rgba(255,255,255,";
  if (type && w > 64) {
    ctx.font = `600 ${BH < 44 ? 11 : 12}px Outfit, system-ui, sans-serif`;
    ctx.fillStyle = ink + ".95)";
    ctx.textBaseline = "middle";
    ctx.fillText(type.toUpperCase(), x + 12, y + 2 + h / 2);
    // mini-wireframe rechts in het blok (alleen als er ruimte is naast het label)
    const cx = x + w - 14, my = y + 2 + h / 2;
    if (w < 170) { ctx.restore(); return; }
    ctx.fillStyle = ink + ".45)";
    if (type === "Knop") { rr(cx - 46, my - 7, 46, 14, 7); ctx.fill(); }
    else if (type === "Foto" || type === "Video") { rr(cx - 34, my - 10, 34, 20, 3); ctx.fill(); ctx.fillStyle = color; ctx.beginPath(); if (type === "Video") { ctx.moveTo(cx - 20, my - 5); ctx.lineTo(cx - 12, my); ctx.lineTo(cx - 20, my + 5); } else { ctx.moveTo(cx - 30, my + 8); ctx.lineTo(cx - 20, my - 2); ctx.lineTo(cx - 12, my + 8); } ctx.fill(); }
    else if (type === "Reviews") { for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx - 4 - k * 11, my, 3.4, 0, 7); ctx.fill(); } }
    else if (type === "Header") { ctx.fillRect(cx - 12, my - 2, 12, 4); ctx.fillRect(cx - 30, my - 2, 12, 4); ctx.fillRect(cx - 48, my - 2, 12, 4); }
    else if (type === "Slider") { for (let k = 0; k < 3; k++) { rr(cx - 14 - k * 18, my - 8, 14, 16, 3); ctx.fill(); } }
    else if (type === "Formulier") { rr(cx - 56, my - 6, 36, 12, 3); ctx.fill(); rr(cx - 16, my - 6, 16, 12, 6); ctx.fill(); }
    else { ctx.fillRect(cx - 60, my - 6, 60, 3); ctx.fillRect(cx - 44, my, 44, 3); ctx.fillRect(cx - 52, my + 6, 52, 3); }
  }
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // achtergrond: puntjesraster dat meeschuift
  ctx.fillStyle = "rgba(255,255,255,.07)";
  const g = 28, off = cam % g;
  for (let y = off; y < H; y += g) for (let x = 14; x < W; x += g) ctx.fillRect(x, y, 2, 2);
  // grond
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(0, H - 26 + cam, W, 1);
  if (!stack) return;
  // hoogtelijnen bij mijlpalen
  [10, 25, 40, 60].forEach(n => {
    const y = rowY(n) + BH;
    if (y < 0 || y > H) return;
    ctx.strokeStyle = "rgba(122,151,253,.25)"; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(122,151,253,.6)"; ctx.font = "600 11px Outfit, system-ui, sans-serif"; ctx.textBaseline = "bottom";
    ctx.fillText(n + " blokken", 10, y - 4);
  });
  stack.forEach((b, i) => { const y = rowY(i); if (y > -BH && y < H) block(b.x, y, b.w, b.color, b.type); });
  if (state === "play" && cur) block(cur.x, rowY(stack.length), cur.w, cur.color, cur.type);
  debris.forEach(d => {
    ctx.save(); ctx.translate(d.x + d.w / 2, d.y + BH / 2); ctx.rotate(d.rot); block(-d.w / 2, -BH / 2, d.w, d.color, d.type, .9); ctx.restore();
  });
  fx.forEach(f => {
    const p = f.t / 1.2, y = rowY(f.i);
    if (!f.big) {
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      const g2 = p * 14; rr(f.x - g2, y + 2 - g2, f.w + g2 * 2, BH - 4 + g2 * 2, 9); ctx.stroke(); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - p * 1.1);
    ctx.font = `700 ${f.big ? 22 : 16}px Outfit, system-ui, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillStyle = f.big ? "#FFC94D" : "#fff";
    ctx.fillText(f.text, W / 2, y - 8 - p * 30);
    ctx.restore();
  });
}

// ---------- invoer ----------
wrap.addEventListener("pointerdown", e => {
  if (e.target.closest(".pp-layer")) return;
  if (state === "play") { e.preventDefault(); drop(); }
});
window.addEventListener("keydown", e => {
  if (e.key !== " " && e.key !== "Enter") return;
  const tag = (e.target.tagName || "");
  if (/INPUT|TEXTAREA|BUTTON|A|SELECT/.test(tag) && e.target !== wrap) return;
  if (state === "play") { e.preventDefault(); drop(); }
});
document.querySelectorAll(".pp-go").forEach(b => b.addEventListener("click", start));
// "Speel nu": naar het speelveld scrollen en de startknop klaarzetten
document.querySelectorAll(".pp-jump").forEach(a => a.addEventListener("click", e => {
  e.preventDefault();
  document.getElementById("spelen").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const go = state === "over" ? ui.over.querySelector(".pp-again") : ui.start.querySelector(".pp-go");
  setTimeout(() => { if (state !== "play" && go) go.focus({ preventScroll: true }); }, 600);
}));
window.addEventListener("resize", () => { if (state !== "play") resize(); });

// ---------- highscores ----------
const esc = s => String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let mine = null;

async function loadScores() {
  try {
    const page = await queryDataItems(COLLECTION, { sort: [{ fieldName: "score", order: "DESC" }, { fieldName: "_createdDate", order: "ASC" }], limit: 10 });
    const items = page.items || [];
    if (!items.length) ui.list.innerHTML = `<li class="pp-empty">Nog geen scores. Zet jij de eerste neer?</li>`;
    const top = items[0];
    document.querySelectorAll('[data-pp="top"]').forEach(e => e.textContent = top ? Number(top.score) || 0 : "–");
    document.querySelectorAll('[data-pp="leader"]').forEach(e => e.textContent = top ? top.naam : "Jij?");
    ["p1", "p2", "p3"].forEach((c, k) => {
      const el = document.querySelector("#pp-podium ." + c), it = items[k];
      if (!el) return;
      el.querySelector(".pod-n").textContent = it ? it.naam : "Nog vrij";
      el.querySelector(".pod-s").textContent = it ? Number(it.score) || 0 : "–";
    });
    if (items.length) ui.list.innerHTML = items.map((it, i) => `<li${mine && it._id === mine ? ' class="me"' : ""}><span class="pp-rank">${i + 1}</span><span class="pp-n">${esc(it.naam)}</span><b>${Number(it.score) || 0}</b></li>`).join("");
  } catch (e) {
    console.error(e);
    ui.list.innerHTML = `<li class="pp-empty">De highscorelijst kan nu niet geladen worden.</li>`;
  }
}

ui.form.addEventListener("submit", async e => {
  e.preventDefault();
  const naam = ui.name.value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
  if (naam.length < 2) { ui.msg.textContent = "Vul een naam van minimaal 2 tekens in."; ui.name.focus(); return; }
  const btn = ui.form.querySelector("button");
  btn.disabled = true; ui.msg.textContent = "Opslaan…";
  try {
    const res = await wixApiRequest("/wix-data/v2/items", {
      method: "POST",
      body: { dataCollectionId: COLLECTION, dataItem: { data: { naam, score: Math.min(999, Math.max(0, Math.round(score))), perfect: perfects } } },
    });
    mine = res && res.dataItem && res.dataItem.id;
    try { localStorage.setItem("yl-pp-naam", naam); } catch (e2) {}
    ui.msg.textContent = "Je score staat op de lijst!";
    ui.form.hidden = true;
    loadScores();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    ui.msg.textContent = "Opslaan lukte niet. Probeer het later nog eens.";
  }
});
try { ui.name.value = localStorage.getItem("yl-pp-naam") || ""; } catch (e) {}

// delen
const share = $("#pp-share");
if (share) share.addEventListener("click", async () => {
  const text = `Ik bouwde een website van ${stack.length - 1} blokken hoog in Pixel Perfect van Yonglo (score ${score}). Kun jij hoger?`;
  const url = location.origin + "/spel.html";
  try {
    if (navigator.share) await navigator.share({ title: "Pixel Perfect | Yonglo", text, url });
    else { await navigator.clipboard.writeText(text + " " + url); share.textContent = "Gekopieerd!"; setTimeout(() => share.textContent = "Deel je score", 2000); }
  } catch (e) {}
});

resize();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
loadScores();
