/**
 * Mapbox — public site maps & geocoding (browse maps, home search, service preview).
 */

export function getMapboxAccessToken(): string {
  const v =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      ? String(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)
      : "";
  return v.trim();
}

export function isMapboxConfigured(): boolean {
  const t = getMapboxAccessToken();
  return Boolean(t && t !== "your-mapbox-token" && !t.startsWith('"') && !t.endsWith('"'));
}
