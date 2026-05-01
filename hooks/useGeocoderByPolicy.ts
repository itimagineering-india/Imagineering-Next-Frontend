"use client";

import { useGoogleGeocoder, type PlaceDetails } from "@/hooks/useGoogleGeocoder";
import { useMapboxGeocoder } from "@/hooks/useMapboxGeocoder";
import { isGoogleMapsConfigured } from "@/lib/mapConfig";
import { isMapboxConfigured } from "@/lib/mapboxConfig";

export type GeocoderPolicy = "public" | "provider";

export type UseGeocoderByPolicyOptions = {
  onPlaceSelect?: (place: PlaceDetails) => void;
  onError?: (error: string) => void;
  deferScriptLoad?: boolean;
};

/**
 * Geocoder routing — Imagineering India
 * - **public** (home, header search, buyer cart, job posts): Mapbox first when configured, else Google.
 * - **provider** (provider dashboard flows): Google first when configured, else Mapbox.
 */
export function useGeocoderByPolicy(policy: GeocoderPolicy, options: UseGeocoderByPolicyOptions) {
  const mbConfigured = isMapboxConfigured();
  const gConfigured = isGoogleMapsConfigured();

  const mapboxEnabled =
    policy === "public" ? mbConfigured : !gConfigured && mbConfigured;
  const googleEnabled =
    policy === "public" ? !mbConfigured && gConfigured : gConfigured;

  const mapboxGeo = useMapboxGeocoder({
    enabled: mapboxEnabled,
    deferScriptLoad: options.deferScriptLoad ?? false,
    onPlaceSelect: options.onPlaceSelect,
    onError: options.onError,
  });
  const googleGeo = useGoogleGeocoder({
    enabled: googleEnabled,
    deferScriptLoad: options.deferScriptLoad ?? false,
    onPlaceSelect: options.onPlaceSelect,
    onError: options.onError,
  });

  const pickMapbox =
    policy === "public" ? mbConfigured : !gConfigured && mbConfigured;

  const active = pickMapbox ? mapboxGeo : googleGeo;

  return {
    ...active,
    activeProvider: pickMapbox ? ("mapbox" as const) : ("google" as const),
    hasAnyGeocoder: mbConfigured || gConfigured,
  };
}

export type { PlaceDetails };
