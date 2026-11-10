// Turn a Wix CMS image value (wix:image://… or https://…) into a URL a browser can render.
export function wixImage(value) {
  if (!value || typeof value !== "string") return null;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http")) return value;
  if (value.startsWith("wix:image://")) {
    const mediaId = value.slice("wix:image://v1/".length).split("/")[0];
    return mediaId ? `https://static.wixstatic.com/media/${mediaId}` : null;
  }
  return null;
}
