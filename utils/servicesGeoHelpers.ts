/** Pure geo helpers for Services browse page (no React deps). */

const TILE_KEY_RE = /^(-?\d+)_(-?\d+)$/;

/**
 * When a service has `location.tileKey` (e.g. "28_77") but no precise coords, place a
 * deterministic point inside that 1° tile so the map can show a pin (approximate).
 */
export function getApproximateCoordsFromTileKey(
  tileKey: string,
  seed: string
): { lat: number; lng: number } | null {
  const m = TILE_KEY_RE.exec(String(tileKey).trim());
  if (!m) return null;
  const floorLat = Number(m[1]);
  const floorLng = Number(m[2]);
  if (!Number.isFinite(floorLat) || !Number.isFinite(floorLng)) return null;
  const baseLat = floorLat + 0.5;
  const baseLng = floorLng + 0.5;
  let h = 2166136261;
  const s = seed || "0";
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const j1 = (h >>> 0) / 0xffffffff;
  const j2 = (Math.imul(h, 1103515245) >>> 0) / 0xffffffff;
  const dLat = (j1 - 0.5) * 0.35;
  const dLng = (j2 - 0.5) * 0.35;
  return { lat: baseLat + dLat, lng: baseLng + dLng };
}

export function getServiceCoordinates(service: any): { lat: number; lng: number } | null {
  const coords = service?.location?.coordinates;
  if (coords && coords.lat !== undefined && coords.lng !== undefined) {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
  }
  const lat = service?.location?.lat ?? service?.location?.latitude;
  const lng = service?.location?.lng ?? service?.location?.longitude;
  if (lat !== undefined && lng !== undefined) {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
      return { lat: parsedLat, lng: parsedLng };
    }
  }
  // GeoJSON fallback: location.geo.coordinates = [lng, lat]
  const geoCoords = service?.location?.geo?.coordinates;
  if (Array.isArray(geoCoords) && geoCoords.length >= 2) {
    const geoLng = Number(geoCoords[0]);
    const geoLat = Number(geoCoords[1]);
    if (Number.isFinite(geoLat) && Number.isFinite(geoLng)) {
      return { lat: geoLat, lng: geoLng };
    }
  }
  // Some payloads may send raw GeoJSON-like coordinates on location.coordinates: [lng, lat]
  if (Array.isArray(coords) && coords.length >= 2) {
    const rawLng = Number(coords[0]);
    const rawLat = Number(coords[1]);
    if (Number.isFinite(rawLat) && Number.isFinite(rawLng)) {
      return { lat: rawLat, lng: rawLng };
    }
  }
  const providerAddr = service?.provider?.businessAddress;
  const provCoords = providerAddr?.coordinates;
  if (provCoords && provCoords.lat !== undefined && provCoords.lng !== undefined) {
    const pl = Number(provCoords.lat);
    const pn = Number(provCoords.lng);
    if (!Number.isNaN(pl) && !Number.isNaN(pn)) return { lat: pl, lng: pn };
  }
  const tileKey = service?.location?.tileKey;
  if (typeof tileKey === "string" && tileKey.trim()) {
    const seed = String(service._id ?? service.id ?? "");
    const approx = getApproximateCoordsFromTileKey(tileKey.trim(), seed);
    if (approx) return approx;
  }
  return null;
}

export function getServiceLocationKey(service: any): string {
  const location = service?.location || {};
  let parts = [location.address, location.city, location.state]
    .filter(Boolean)
    .map((value: any) => String(value).trim())
    .filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  const providerAddr = service?.provider?.businessAddress;
  if (providerAddr) {
    parts = [providerAddr.address, providerAddr.city, providerAddr.state]
      .filter(Boolean)
      .map((v: any) => String(v).trim())
      .filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }
  return "";
}

export function getProviderCoordinates(provider: any): { lat: number; lng: number } | null {
  const coords =
    provider?.businessAddress?.coordinates ||
    provider?.user?.location?.coordinates ||
    provider?.location?.coordinates;
  if (!coords) return null;
  const lat = Number(coords.lat);
  const lng = Number(coords.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function getProviderLocationKey(provider: any): string {
  const addr = provider?.businessAddress || provider?.user?.location || provider?.location || {};
  const parts = [addr.address, addr.city, addr.state]
    .filter(Boolean)
    .map((v: any) => String(v).trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : "";
}

const R_EARTH_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_KM * c;
}
