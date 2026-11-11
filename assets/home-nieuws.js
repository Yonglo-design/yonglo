// Homepage: de drie nieuwste blogberichten live uit Wix Blog. Zonder verbinding blijven de vaste drie staan.
// De bestaande kaarten worden bijgewerkt (niet vervangen), zodat het hover-effect uit app.js blijft werken.
import { fetchPosts, postUrl, catLabel } from "./blog.js";

const cards = [...document.querySelectorAll('[data-cms="nieuws"] a.post')];
if (cards.length) {
  fetchPosts().then((posts) => {
    cards.forEach((a, i) => {
      const p = posts[i];
      if (!p) return;
      a.href = postUrl(p);
      const cat = a.querySelector(".cat"), h = a.querySelector("h3");
      if (cat) cat.textContent = catLabel(p.cat);
      if (h) { h.textContent = p.title; if (document.documentElement.lang === "en") h.lang = "nl"; }
    });
  }).catch(() => {});
}
