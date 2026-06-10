/**
 * Mapbox — default for **public** maps & geocoding (browse maps, home search, buyer flows).
 * **Provider dashboard** (main `src` app) and **admin panel** (`admin-frontend`) prefer **Google Maps**
 * for address search; see `useGeocoderByPolicy` in `src/hooks/useGeocoderByPolicy.ts`.
 */

export function getMapboxAccessToken(): string {
  return (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "").trim();
}

export function isMapboxConfigured(): boolean {
  const t = getMapboxAccessToken();
  return Boolean(t && t !== "your-mapbox-token" && !t.startsWith('"') && !t.endsWith('"'));
}
