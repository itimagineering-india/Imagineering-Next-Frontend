/**
 * Reverse-geocode lat/lng → address parts for saved-address map pin (web).
 * Prefers Mapbox when configured (public policy), else Google.
 */

import { getMapboxAccessToken, isMapboxConfigured } from "@/lib/mapboxConfig";
import { getGoogleMapsApiKey, loadGoogleMapsMapOnly } from "@/lib/mapConfig";

export type ReverseGeocodeDetails = {
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

function cityStateFromPlaceName(placeName: string): { city: string; state: string } {
  const parts = placeName.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return { city: parts[parts.length - 3] || parts[1] || "", state: parts[parts.length - 2] || "" };
  }
  if (parts.length >= 2) return { city: parts[0] || "", state: parts[1] || "" };
  return { city: "", state: "" };
}

function extractLongName(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  ...types: string[]
): string {
  if (!components?.length) return "";
  for (const t of types) {
    const c = components.find((x) => x.types.includes(t));
    if (c?.long_name?.trim()) return c.long_name.trim();
  }
  return "";
}

function zipFromPlaceName(placeName: string): string {
  const m = placeName.match(/\b(\d{5,6})\b/);
  return m?.[1] || "";
}

async function reverseWithMapbox(lat: number, lng: number): Promise<ReverseGeocodeDetails | null> {
  const token = getMapboxAccessToken();
  if (!token) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(token)}&country=IN&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const feature = data.features?.[0] as
    | {
        place_name?: string;
        text?: string;
        context?: Array<{ id: string; text: string }>;
      }
    | undefined;
  const placeName = (feature?.place_name || "").trim();
  if (!placeName) return null;

  const ctx = feature?.context || [];
  let city = "";
  let state = "";
  let zipCode = "";
  for (const c of ctx) {
    const id = c.id || "";
    if (id.startsWith("postcode")) zipCode = c.text || zipCode;
    else if (id.startsWith("place") || id.startsWith("locality")) city = city || c.text || "";
    else if (id.startsWith("region")) state = c.text || state;
  }
  if (!city || !state) {
    const parsed = cityStateFromPlaceName(placeName);
    city = city || parsed.city;
    state = state || parsed.state;
  }
  if (!zipCode) zipCode = zipFromPlaceName(placeName);

  const street = (feature?.text || placeName.split(",")[0] || placeName).trim();
  return {
    address: placeName || street,
    city: city.replace(/\b\d{5,6}\b/g, "").trim(),
    state: state.replace(/\b\d{5,6}\b/g, "").trim(),
    zipCode,
  };
}

async function reverseWithGoogle(lat: number, lng: number): Promise<ReverseGeocodeDetails | null> {
  if (!getGoogleMapsApiKey()) return null;
  try {
    await loadGoogleMapsMapOnly();
  } catch {
    return null;
  }
  if (!window.google?.maps?.Geocoder) return null;

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.[0]) {
        resolve(null);
        return;
      }
      const r0 = results[0];
      const comps = r0.address_components;
      const address = (r0.formatted_address || "").trim();
      const city =
        extractLongName(comps, "locality", "sublocality_level_1", "administrative_area_level_3", "administrative_area_level_2") ||
        "";
      const state = extractLongName(comps, "administrative_area_level_1") || "";
      const zipCode = extractLongName(comps, "postal_code") || zipFromPlaceName(address);
      resolve({
        address,
        city,
        state,
        zipCode,
      });
    });
  });
}

export async function reverseGeocodeDetails(
  lat: number,
  lng: number
): Promise<ReverseGeocodeDetails | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (isMapboxConfigured()) {
    const mb = await reverseWithMapbox(lat, lng);
    if (mb) return mb;
  }
  return reverseWithGoogle(lat, lng);
}
