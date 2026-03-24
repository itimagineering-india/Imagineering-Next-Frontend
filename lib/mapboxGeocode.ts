/**
 * Mapbox GL token + forward geocoding (used when Mappls map is unavailable).
 */

export function getMapboxAccessToken(): string {
  return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    ? process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    : ""
  ).trim();
}

export function isMapboxGlConfigured(): boolean {
  const t = getMapboxAccessToken();
  return Boolean(t && t !== "your-mapbox-token" && !t.startsWith('"') && !t.endsWith('"'));
}

export async function mapboxForwardGeocode(
  address: string,
  token: string
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  try {
    const path = encodeURIComponent(trimmed);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${path}.json?access_token=${encodeURIComponent(token)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: Array<{ center?: [number, number] }> };
    const c = data?.features?.[0]?.center;
    if (!c || c.length < 2) return null;
    return { lng: c[0], lat: c[1] };
  } catch {
    return null;
  }
}
