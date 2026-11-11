// Blogberichten (/post/<naam>) krijgen hun SEO-tags uit Wix (titel, omschrijving, canonical, deeltags,
// gemarkeerd met wix-seo-tags="true"). Wix voegt daarnaast zijn standaardtags voor de pagina "Post" toe
// (gemarkeerd met wix-seo-tag="true", zoals de titel "Post | Yonglo"). Twee titels en twee canonicals zijn
// slecht voor SEO, dus op blogberichten halen we die standaardtags weg zolang de echte er staan.
import { defineMiddleware } from "astro:middleware";

const FALLBACK = [
  /<title\b[^>]*\swix-seo-tag="true"[^>]*>[\s\S]*?<\/title>/g,
  /<(?:meta|link)\b[^>]*\swix-seo-tag="true"[^>]*>/g,
  /<script\b[^>]*\swix-seo-tag="true"[^>]*>[\s\S]*?<\/script>/g,
];

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (!context.url.pathname.startsWith("/post/")) return response;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  const html = await response.text();
  // Alleen opruimen als de echte tags van het bericht er staan, of op de eigen 404-pagina (die heeft een eigen titel).
  const ownTags = html.includes('wix-seo-tags="true"') || response.status === 404;
  const cleaned = ownTags ? FALLBACK.reduce((h, re) => h.replace(re, ""), html) : html;
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(cleaned, { status: response.status, statusText: response.statusText, headers });
});
