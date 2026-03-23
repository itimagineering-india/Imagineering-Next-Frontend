/**
 * Mappls (MapmyIndia) REST helpers — static access_token from console.
 * Docs: https://developer.mappls.com/documentation/sdk/rest-apis/
 */

const SEARCH_BASE = "https://search.mappls.com";
const PLACE_BASE = "https://place.mappls.com";

export function getMapplsAccessToken(): string {
  return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_MAPPLS_ACCESS_TOKEN || "").trim();
}

export function isMapplsTokenConfigured(): boolean {
  const t = getMapplsAccessToken();
  return Boolean(t && t !== "your-mappls-access-token" && !t.startsWith('"') && !t.endsWith('"'));
}

/** Reverse geocode → single line address */
export async function mapplsReverseGeocode(
  lat: number,
  lng: number,
  token: string
): Promise<string | null> {
  const url = `${SEARCH_BASE}/search/address/rev-geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const row = data?.results?.[0];
  return row?.formatted_address || null;
}

type CopResult = {
  eLoc?: string;
  formattedAddress?: string;
  lat?: string | number;
  lng?: string | number;
};

function normalizeCopResults(raw: unknown): CopResult[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as CopResult[];
  if (typeof raw === "object") return [raw as CopResult];
  return [];
}

/** Forward geocode address → lat/lng (uses geocode + place-details when coords missing) */
export async function mapplsGeocodeAddress(
  address: string,
  token: string
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const geoUrl = `${SEARCH_BASE}/search/address/geocode?address=${encodeURIComponent(trimmed)}&access_token=${encodeURIComponent(token)}`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) return null;
  const geoJson = await geoRes.json();
  const list = normalizeCopResults(geoJson?.copResults);
  const first = list[0];
  if (!first?.eLoc) return null;

  const lat0 = first.lat != null ? Number(first.lat) : NaN;
  const lng0 = first.lng != null ? Number(first.lng) : NaN;
  if (Number.isFinite(lat0) && Number.isFinite(lng0)) {
    return { lat: lat0, lng: lng0 };
  }

  const detailUrl = `${PLACE_BASE}/O2O/entity/place-details/${encodeURIComponent(first.eLoc)}?access_token=${encodeURIComponent(token)}`;
  const detRes = await fetch(detailUrl);
  if (!detRes.ok) return null;
  const det = await detRes.json();
  const lat = det?.latitude != null ? Number(det.latitude) : NaN;
  const lng = det?.longitude != null ? Number(det.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

export type MapplsSearchHit = {
  place_name: string;
  placeAddress: string;
  eLoc: string;
  lat?: number;
  lng?: number;
};

/** Text search suggestions (India) */
export async function mapplsTextSearch(
  query: string,
  token: string,
  options?: { lat?: number; lng?: number }
): Promise<MapplsSearchHit[]> {
  const q = query.trim();
  if (q.length < 2 || q.length > 45) return [];
  let url = `${SEARCH_BASE}/search/places/textsearch/json?query=${encodeURIComponent(q)}&region=ind&access_token=${encodeURIComponent(token)}`;
  if (options?.lat != null && options?.lng != null) {
    url += `&location=${encodeURIComponent(`${options.lat},${options.lng}`)}`;
  }
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const locs: any[] = data?.suggestedLocations || [];
  const out: MapplsSearchHit[] = [];
  for (const L of locs.slice(0, 8)) {
    const placeAddress = L.placeAddress || "";
    const placeName = L.placeName || "";
    const eLoc = L.eLoc;
    if (!eLoc) continue;
    out.push({
      place_name: placeName ? `${placeName}, ${placeAddress}` : placeAddress || placeName,
      placeAddress: placeAddress || placeName,
      eLoc,
    });
  }
  return out;
}

/** Resolve eLoc to coordinates via place-details */
export async function mapplsPlaceDetailsCoords(
  eLoc: string,
  token: string
): Promise<{ lat: number; lng: number; formatted?: string } | null> {
  const url = `${PLACE_BASE}/O2O/entity/place-details/${encodeURIComponent(eLoc)}?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const det = await res.json();
  const lat = det?.latitude != null ? Number(det.latitude) : NaN;
  const lng = det?.longitude != null ? Number(det.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng, formatted: det?.address || det?.formatted_address };
  }
  const addr = det?.address || det?.name;
  if (typeof addr === "string" && addr.trim()) {
    const g = await mapplsGeocodeAddress(addr.trim(), token);
    if (g) return { ...g, formatted: addr };
  }
  return null;
}
