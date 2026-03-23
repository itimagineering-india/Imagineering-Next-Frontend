/**
 * Mappls (MapmyIndia) — Web Maps SDK loader + token helpers.
 * Console: https://auth.mappls.com/console/
 * Web JS: https://developer.mappls.com/documentation/sdk/Web/Web%20JS/
 */

import { getMapplsAccessToken, isMapplsTokenConfigured } from "./mapplsApi";

export { getMapplsAccessToken, isMapplsTokenConfigured };

/** Same static key as REST `access_token` (Mappls console “REST API” / map key). */
export function isMapplsConfigured(): boolean {
  return isMapplsTokenConfigured();
}

/** @deprecated Use isMapplsConfigured — Mapbox removed */
export function isMapboxConfigured(): boolean {
  return isMapplsConfigured();
}

/** @deprecated Use getMapplsAccessToken */
export function getMapboxToken(): string {
  return getMapplsAccessToken();
}

const MAP_SCRIPT_ID = "mappls-web-sdk-script";

/**
 * Load Mappls Web Maps SDK (vector). Resolves when `window.mappls` is ready.
 */
export function loadMapplsMapScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { mappls?: unknown }).mappls) return Promise.resolve();

  const key = getMapplsAccessToken();
  if (!key) return Promise.reject(new Error("Mappls access token not configured"));

  const existing = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise<void>((resolve, reject) => {
      const done = () => {
        if ((window as unknown as { mappls?: unknown }).mappls) resolve();
        else setTimeout(done, 50);
      };
      const t = setTimeout(() => reject(new Error("Mappls SDK timeout")), 60000);
      const finish = () => {
        clearTimeout(t);
        done();
      };
      if ((window as unknown as { mappls?: unknown }).mappls) {
        clearTimeout(t);
        resolve();
        return;
      }
      existing.addEventListener("load", finish);
      existing.addEventListener("error", () => {
        clearTimeout(t);
        reject(new Error("Mappls script failed"));
      });
    });
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = MAP_SCRIPT_ID;
    script.src = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${encodeURIComponent(key)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const check = () => {
        if ((window as unknown as { mappls?: unknown }).mappls) return resolve();
        setTimeout(check, 50);
      };
      check();
    };
    script.onerror = () => reject(new Error("Failed to load Mappls Maps SDK"));
    document.head.appendChild(script);
  });
}

/** @deprecated Google Maps removed — use loadMapplsMapScript */
export function ensureMapScript(): Promise<void> {
  return loadMapplsMapScript();
}
