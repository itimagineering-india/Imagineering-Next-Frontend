import { isGoogleMapsConfigured } from "@/lib/mapConfig";
import { isMapboxConfigured } from "@/lib/mapboxConfig";

export function isBrowseMapAvailable(): boolean {
  return isMapboxConfigured() || isGoogleMapsConfigured();
}

export function isPublicLocationSearchConfigured(): boolean {
  return isMapboxConfigured() || isGoogleMapsConfigured();
}
