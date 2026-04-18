import type { ProviderMarker, ServiceMarker } from "@/components/map/BrowseMap";

/** Matches map draw logic: only markers with finite lat/lng are plotted. */
export function countPlottableMapMarkers(
  browseMode: "services" | "providers",
  serviceMarkers: ServiceMarker[],
  providerMarkers: ProviderMarker[],
): number {
  const raw = browseMode === "services" ? serviceMarkers : providerMarkers;
  return raw.filter(
    (m) => m.lat != null && m.lng != null && Number.isFinite(m.lat) && Number.isFinite(m.lng),
  ).length;
}
