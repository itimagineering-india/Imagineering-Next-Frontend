/**
 * Forward-geocode a free-text address to lat/lng for saved addresses / quote distance.
 */

import { getMapboxAccessToken } from "@/lib/mapboxConfig";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/mapConfig";

export type LatLng = { lat: number; lng: number };

function isValidLatLng(c: LatLng | null | undefined): c is LatLng {
  return (
    !!c &&
    Number.isFinite(c.lat) &&
    Number.isFinite(c.lng) &&
    Math.abs(c.lat) <= 90 &&
    Math.abs(c.lng) <= 180
  );
}

async function geocodeWithMapbox(query: string): Promise<LatLng | null> {
  const token = getMapboxAccessToken();
  if (!token) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(token)}&country=IN&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const center = data?.features?.[0]?.center;
  if (!Array.isArray(center) || center.length < 2) return null;
  const [lng, lat] = center;
  const out = { lat: Number(lat), lng: Number(lng) };
  return isValidLatLng(out) ? out : null;
}

async function geocodeWithGoogle(query: string): Promise<LatLng | null> {
  const key = getGoogleMapsApiKey();
  if (!key) return null;
  try {
    await loadGoogleMapsScript();
  } catch {
    return null;
  }
  if (typeof google === "undefined" || !google.maps?.Geocoder) return null;

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query, componentRestrictions: { country: "IN" } }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }
      const loc = results[0].geometry.location;
      const out = { lat: loc.lat(), lng: loc.lng() };
      resolve(isValidLatLng(out) ? out : null);
    });
  });
}

/** Build a single query string from address parts. */
export function buildAddressGeocodeQuery(parts: {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): string {
  return [parts.address, parts.city, parts.state, parts.zipCode, "India"]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Resolve coordinates for an address. Tries Mapbox first, then Google.
 */
export async function geocodeAddressToCoordinates(query: string): Promise<LatLng | null> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return null;
  const mapbox = await geocodeWithMapbox(trimmed);
  if (mapbox) return mapbox;
  return geocodeWithGoogle(trimmed);
}
