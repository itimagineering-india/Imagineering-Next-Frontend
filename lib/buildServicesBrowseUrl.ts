import type { UserLocation } from "@/contexts/UserLocationContext";

/** Query string for `/services` when navigating from home — includes tile + lat/lng when known. */
export function buildServicesBrowseQuery(
  categoryValue: string,
  loc: UserLocation | null | undefined
): string {
  const sp = new URLSearchParams();
  sp.set("category", categoryValue);
  if (
    loc?.lat != null &&
    loc?.lng != null &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng)
  ) {
    sp.set("tile", `${Math.floor(loc.lat)}_${Math.floor(loc.lng)}`);
    sp.set("lat", String(loc.lat));
    sp.set("lng", String(loc.lng));
    const label = (loc.address || loc.city || "").trim();
    if (label) sp.set("locationText", label);
  }
  return sp.toString();
}
