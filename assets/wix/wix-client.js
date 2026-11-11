// Wix headless REST transport (visitor token from the public client id). No SDK.
export { WIX_CLIENT_ID } from "./wix-config.js";
import { WIX_CLIENT_ID } from "./wix-config.js";

export const WIX_API_BASE = "https://www.wixapis.com";
const OAUTH_TOKEN_URL = `${WIX_API_BASE}/oauth2/token`;

// Scoped per client id so two headless sites on one origin don't share a visitor token.
// The site's own client is the default; the blog uses the client of the site that hosts Wix Blog.
const tokenCache = new Map();
const storageKey = (clientId) => `wix-visitor-token-${clientId}`;

function loadToken(clientId) {
  if (tokenCache.has(clientId)) return tokenCache.get(clientId);
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(clientId));
    if (raw) tokenCache.set(clientId, JSON.parse(raw));
  } catch {
    /* ignore disabled/full storage */
  }
  return tokenCache.get(clientId) || null;
}

function saveToken(clientId, t) {
  tokenCache.set(clientId, t);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(clientId), JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

async function mintToken(body) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Wix OAuth failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

// Persist the refresh token and refresh on expiry instead of re-minting a new anonymous visitor.
async function getAccessToken(clientId = WIX_CLIENT_ID) {
  const cached = loadToken(clientId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken;

  if (cached?.refreshToken) {
    try {
      const refreshed = await mintToken({ clientId, grantType: "refresh_token", refreshToken: cached.refreshToken });
      refreshed.role = cached.role || "visitor";
      saveToken(clientId, refreshed);
      return refreshed.accessToken;
    } catch {
      /* refresh failed — fall through to a fresh anonymous visitor */
    }
  }
  const fresh = await mintToken({ clientId, grantType: "anonymous" });
  fresh.role = "visitor";
  saveToken(clientId, fresh);
  return fresh.accessToken;
}

/**
 * Core transport: adds the Authorization header, resolves the path against the Wix API base,
 * parses JSON, surfaces errors. Pass `clientId` to call a different Wix site (default: this site).
 */
export async function wixApiRequest(path, options = {}) {
  const { method = "POST", body, query, clientId } = options;
  const token = await getAccessToken(clientId);

  const url = new URL(path.startsWith("http") ? path : `${WIX_API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) {
        for (const item of v) url.searchParams.append(k, item);
      } else {
        url.searchParams.set(k, v);
      }
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token, // Wix expects the raw access token (no "Bearer " prefix)
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    const err = new Error(`Wix API error ${res.status}: ${text}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  if (res.status === 204) return undefined;
  return await res.json();
}
