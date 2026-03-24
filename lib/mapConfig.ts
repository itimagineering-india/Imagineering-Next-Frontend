/**
 * Google Maps JavaScript API — loader + key helpers.
 * Console: https://console.cloud.google.com/google/maps-apis
 */

const MAP_SCRIPT_ID = "google-maps-js";

let loadPromise: Promise<void> | null = null;

export function getGoogleMapsApiKey(): string {
  const v =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
      : "";
  return v.trim();
}

export function isGoogleMapsTokenConfigured(): boolean {
  const t = getGoogleMapsApiKey();
  return Boolean(t && t !== "your-google-maps-api-key" && !t.startsWith('"') && !t.endsWith('"'));
}

export function isGoogleMapsConfigured(): boolean {
  return isGoogleMapsTokenConfigured();
}

export function isMapProviderConfigured(): boolean {
  return isGoogleMapsConfigured();
}

/** @deprecated Use isGoogleMapsConfigured */
export function isMapboxConfigured(): boolean {
  return isGoogleMapsConfigured();
}

export function getMapboxToken(): string {
  return getGoogleMapsApiKey();
}

export function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const key = getGoogleMapsApiKey();
  if (!key) return Promise.reject(new Error("Google Maps API key not configured"));

  if (window.google?.maps?.Map) return Promise.resolve();

  if (loadPromise) return loadPromise;

  const existing = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing?.src) {
    loadPromise = new Promise((resolve, reject) => {
      const done = () => {
        if (window.google?.maps?.Map) resolve();
        else setTimeout(done, 50);
      };
      const t = setTimeout(() => reject(new Error("Google Maps SDK timeout")), 90000);
      const finish = () => {
        clearTimeout(t);
        done();
      };
      if (window.google?.maps?.Map) {
        clearTimeout(t);
        resolve();
        return;
      }
      existing.addEventListener("load", finish);
      existing.addEventListener("error", () => {
        clearTimeout(t);
        reject(new Error("Google Maps script failed"));
      });
    });
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = MAP_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async`;
    script.onload = () => {
      const check = () => {
        if (window.google?.maps?.Map) resolve();
        else setTimeout(check, 50);
      };
      check();
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps JavaScript API"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function ensureMapScript(): Promise<void> {
  return loadGoogleMapsScript();
}
