/** Auth helpers – client only. Prefer JWT in localStorage so `Authorization: Bearer` works cross-origin (SPA ↔ API). HttpOnly cookies with SameSite=Lax are often not sent on cross-site fetch, which broke login on Vercel + separate API domain. */

const AUTH_COOKIE_SESSION_KEY = "authCookieSession";

const getApiBase = () =>
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:5000";

/**
 * Returns JWT for Bearer header, or `"cookie"` when only an HttpOnly session was indicated (legacy).
 * Prefer `authToken` so API calls authenticate even when the browser does not attach cookies to cross-origin fetch.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const jwt = localStorage.getItem("authToken");
  if (jwt) return jwt;
  if (localStorage.getItem(AUTH_COOKIE_SESSION_KEY)) return "cookie";
  return null;
};

/**
 * Persist the access token from the login/register response. Backend may also set an HttpOnly cookie;
 * storing the JWT here ensures GET /api/auth/me and other calls send `Authorization: Bearer` reliably.
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  if (token && token.length > 0) {
    localStorage.setItem("authToken", token);
    localStorage.removeItem(AUTH_COOKIE_SESSION_KEY);
  } else {
    localStorage.removeItem(AUTH_COOKIE_SESSION_KEY);
    localStorage.removeItem("authToken");
  }
  window.dispatchEvent(new Event("auth-token-changed"));
};

/** Clear client auth and ask backend to clear HttpOnly cookie. */
export const removeAuthToken = (): void => {
  if (typeof window === "undefined") return;
  const base = String(getApiBase()).replace(/\/$/, "");
  fetch(`${base}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  localStorage.removeItem(AUTH_COOKIE_SESSION_KEY);
  localStorage.removeItem("authToken");
  window.dispatchEvent(new Event("auth-token-changed"));
};
