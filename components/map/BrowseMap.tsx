"use client";

import { GoogleMap } from "./GoogleMap";
import { MapboxBrowseMap } from "./MapboxBrowseMap";
import { isMapboxConfigured } from "@/lib/mapboxConfig";
import type { GoogleMapProps } from "./GoogleMap";

export type { GoogleMapProps, ServiceMarker, ProviderMarker } from "./GoogleMap";

/** Public browse map: Mapbox when `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set, otherwise Google Maps. */
export function BrowseMap(props: GoogleMapProps) {
  if (isMapboxConfigured()) {
    return <MapboxBrowseMap {...props} />;
  }
  return <GoogleMap {...props} />;
}
