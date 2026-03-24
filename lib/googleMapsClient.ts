/**
 * Client-side geocoding via Google Maps JavaScript API (after loadGoogleMapsScript).
 */

import { loadGoogleMapsMapOnly, getGoogleMapsApiKey } from "./mapConfig";

export async function reverseGeocodeLatLng(lat: number, lng: number): Promise<string | null> {
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
      if (status === "OK" && results?.[0]?.formatted_address) {
        resolve(results[0].formatted_address);
        return;
      }
      resolve(null);
    });
  });
}
