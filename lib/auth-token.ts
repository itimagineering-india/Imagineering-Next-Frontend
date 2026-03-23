/** Auth helpers – client only. Web: HttpOnly cookie + session hint; legacy: Bearer in localStorage. */

const AUTH_COOKIE_SESSION_KEY = "authCookieSession";

const getApiBase = () =>
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:5000";

/** Web: returns 'cookie' when HttpOnly session is active; else JWT from localStorage (legacy/mobile-style). */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem(AUTH_COOKIE_SESSION_KEY)) return "cookie";
  return localStorage.getItem("authToken");
};

/**
 * After login: store session hint only (JWT stays in HttpOnly cookie when backend sets it).
 * Pass any non-empty token string from login response to mark session active.
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  if (token && token.length > 0) {
    localStorage.setItem(AUTH_COOKIE_SESSION_KEY, "1");
    localStorage.removeItem("authToken");
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
