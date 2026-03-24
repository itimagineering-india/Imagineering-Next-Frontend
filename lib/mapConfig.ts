/**
 * Google Maps JavaScript API — single bootstrap, dynamic libraries.
 */

const MAP_SCRIPT_ID = "google-maps-js";

let bootstrapPromise: Promise<void> | null = null;

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

type GoogleMapsNs = typeof google.maps & {
  importLibrary?: (name: string) => Promise<unknown>;
};

async function importLibrary(name: "maps" | "places"): Promise<void> {
  const g = google.maps as GoogleMapsNs;
  if (typeof g.importLibrary === "function") {
    await g.importLibrary(name);
    return;
  }
  if (name === "maps" && !g.Map) {
    throw new Error("Google Maps core failed to load");
  }
  if (name === "places" && !g.places) {
    throw new Error("Google Maps Places library failed to load");
  }
}

function ensureBootstrap(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const key = getGoogleMapsApiKey();
  if (!key) return Promise.reject(new Error("Google Maps API key not configured"));

  if (bootstrapPromise) return bootstrapPromise;

  const existing = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing?.src) {
    bootstrapPromise = new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("Google Maps SDK timeout")), 90000);
      const done = () => {
        if (window.google?.maps) {
          clearTimeout(t);
          resolve();
        } else setTimeout(done, 50);
      };
      if (window.google?.maps) {
        clearTimeout(t);
        resolve();
        return;
      }
      existing.addEventListener("load", () => done());
      existing.addEventListener("error", () => {
        clearTimeout(t);
        reject(new Error("Google Maps script failed"));
      });
    });
    return bootstrapPromise;
  }

  bootstrapPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = MAP_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async`;
    script.onload = () => {
      const check = () => {
        if (window.google?.maps) resolve();
        else setTimeout(check, 50);
      };
      check();
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps JavaScript API"));
    document.head.appendChild(script);
  });

  return bootstrapPromise;
}

export async function loadGoogleMapsMapOnly(): Promise<void> {
  await ensureBootstrap();
  await importLibrary("maps");
}

export async function loadGoogleMapsScript(): Promise<void> {
  await ensureBootstrap();
  await importLibrary("maps");
  await importLibrary("places");
}

export function ensureMapScript(): Promise<void> {
  return loadGoogleMapsScript();
}
