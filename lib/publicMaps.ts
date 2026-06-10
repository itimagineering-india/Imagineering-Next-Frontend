import { isGoogleMapsConfigured } from "@/lib/mapConfig";
import { isMapboxConfigured } from "@/lib/mapboxConfig";

/** Interactive browse map (Services / Search Results): Mapbox if set, else Google. */
export function isBrowseMapAvailable(): boolean {
  return isMapboxConfigured() || isGoogleMapsConfigured();
}

/** Home / header location search: Mapbox Geocoding or Google Places. */
export function isPublicLocationSearchConfigured(): boolean {
  return isMapboxConfigured() || isGoogleMapsConfigured();
}
