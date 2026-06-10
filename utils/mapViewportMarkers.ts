/**
 * Viewport culling for browse maps — only render markers inside (padded) visible bounds
 * to reduce DOM work when many points exist. Pan/zoom reloads the visible set.
 */

const DEFAULT_PAD = 0.18;

/** Below this count, render all markers (culling overhead not worth it). */
export const VIEWPORT_CULLING_MIN_COUNT = 72;

export type LatLngBoundsLike = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Build from API bounds (Google `getNorthEast`/`getSouthWest`, Mapbox `LngLatBounds`, etc.). */
export function boundsLikeFromNeSw(
  ne: { lat: number; lng: number },
  sw: { lat: number; lng: number }
): LatLngBoundsLike {
  return { north: ne.lat, south: sw.lat, east: ne.lng, west: sw.lng };
}

export function expandBoundsPad(
  b: LatLngBoundsLike,
  padRatio: number = DEFAULT_PAD
): LatLngBoundsLike {
  const latSpan = b.north - b.south;
  const lngSpan = b.east - b.west;
  const dLat = latSpan * padRatio;
  const dLng = lngSpan * padRatio;
  return {
    north: b.north + dLat,
    south: b.south - dLat,
    east: b.east + dLng,
    west: b.west - dLng,
  };
}

export function pointInBounds(lat: number, lng: number, b: LatLngBoundsLike): boolean {
  if (lng >= b.west && lng <= b.east) {
    return lat >= b.south && lat <= b.north;
  }
  // Dateline wrap (rare for IN browse) — treat as out to avoid false positives
  return false;
}

export function filterMarkersByViewport<T extends { lat: number; lng: number }>(
  markers: T[],
  bounds: LatLngBoundsLike | null,
  options?: { padRatio?: number; minCount?: number }
): T[] {
  const minCount = options?.minCount ?? VIEWPORT_CULLING_MIN_COUNT;
  if (markers.length <= minCount) {
    return markers;
  }
  if (!bounds) {
    return [];
  }
  const pad = options?.padRatio ?? DEFAULT_PAD;
  const expanded = expandBoundsPad(bounds, pad);
  return markers.filter((m) => pointInBounds(m.lat, m.lng, expanded));
}
