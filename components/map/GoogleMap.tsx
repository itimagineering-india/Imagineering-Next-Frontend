/**
 * Interactive map — Google Maps JS API (optimized).
 * - No client-side address geocoding; markers must include lat/lng.
 * - Incremental marker updates, optional clustering, single InfoWindow, lazy init.
 */

import { useEffect, useRef, useCallback, useState, useMemo, memo } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMapsMapOnly, getGoogleMapsApiKey } from "@/lib/mapConfig";

export interface ServiceMarker {
  id: string;
  lat?: number;
  lng?: number;
  address?: string;
  title: string;
  categoryName?: string;
  description?: string;
  price?: number;
  priceType?: string;
  featured?: boolean;
  color?: string;
}

export interface ProviderMarker {
  id: string;
  lat?: number;
  lng?: number;
  address?: string;
  title: string;
  addressDisplay?: string;
  profileHref: string;
  color?: string;
}

export interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  serviceMarkers?: ServiceMarker[];
  providerMarkers?: ProviderMarker[];
  userLocation?: { lat: number; lng: number } | null;
  browseMode: "services" | "providers";
  className?: string;
  onMapReady?: (map: google.maps.Map) => void;
  flyToTarget?: { lat: number; lng: number; zoom?: number } | null;
  flyToRevision?: number;
  /** When true, group nearby markers (recommended for 20+ points). Default: true. */
  clusteringEnabled?: boolean;
  /** When true, map + scripts only initialize after the container enters the viewport. */
  lazyWhenVisible?: boolean;
}

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const DEFAULT_ZOOM = 12;

const PIN = (fill: string): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  scale: 10,
  fillColor: fill,
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
});

function waitForMapContainer(el: HTMLElement, timeoutMs = 15000): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      const r = el.getBoundingClientRect();
      if (r.width >= 2 && r.height >= 2) {
        resolve(true);
        return;
      }
      if (Date.now() > deadline) {
        resolve(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function buildStableMarkerKey(
  browseMode: "services" | "providers",
  serviceMarkers: ServiceMarker[],
  providerMarkers: ProviderMarker[]
): string {
  const list = browseMode === "services" ? serviceMarkers : providerMarkers;
  return list
    .filter((m) => m.lat != null && m.lng != null && Number.isFinite(m.lat) && Number.isFinite(m.lng))
    .map((m) => `${m.id}:${m.lat}:${m.lng}`)
    .join("|");
}

export const GoogleMap = memo(function GoogleMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  serviceMarkers = [],
  providerMarkers = [],
  userLocation = null,
  browseMode,
  className = "",
  onMapReady,
  flyToTarget,
  flyToRevision = 0,
  clusteringEnabled = true,
  lazyWhenVisible = false,
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerByIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [sdkReady, setSdkReady] = useState(0);
  const [mapActive, setMapActive] = useState(false);
  const [visible, setVisible] = useState(!lazyWhenVisible);

  const normalizedMarkers = useMemo(() => {
    const raw = browseMode === "services" ? serviceMarkers : providerMarkers;
    return raw.filter(
      (m) => m.lat != null && m.lng != null && Number.isFinite(m.lat) && Number.isFinite(m.lng)
    ) as Array<(ServiceMarker | ProviderMarker) & { lat: number; lng: number }>;
  }, [browseMode, serviceMarkers, providerMarkers]);

  const markersDataKey = useMemo(
    () => buildStableMarkerKey(browseMode, serviceMarkers, providerMarkers),
    [browseMode, serviceMarkers, providerMarkers]
  );

  const userLocKey = userLocation
    ? `${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}`
    : "";

  const normalizedMarkersRef = useRef(normalizedMarkers);
  normalizedMarkersRef.current = normalizedMarkers;

  useEffect(() => {
    if (!lazyWhenVisible || !containerRef.current) return;
    const el = containerRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { rootMargin: "240px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [lazyWhenVisible]);

  const openInfoForMarker = useCallback(
    (marker: google.maps.Marker, item: ServiceMarker | ProviderMarker) => {
      const map = mapRef.current;
      if (!map) return;
      if (!infoWindowRef.current) {
        infoWindowRef.current = new google.maps.InfoWindow({ maxWidth: 320 });
      }
      const iw = infoWindowRef.current;
      if (browseMode === "services") {
        const s = item as ServiceMarker;
        iw.setContent(`<div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            ${s.categoryName ? `<div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;margin-bottom:6px">${escapeHtml(s.categoryName)}</div>` : ""}
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(s.title)}</h3>
            ${s.description ? `<p style="color:#4b5563;font-size:13px;margin-bottom:8px">${escapeHtml(s.description)}</p>` : ""}
            ${s.price != null ? `<div style="font-weight:700;color:#059669;font-size:16px;margin-bottom:8px">₹${s.price.toLocaleString()}${s.priceType ? ` ${escapeHtml(String(s.priceType))}` : ""}</div>` : ""}
            <a href="/services/${escapeHtml(s.id)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Details →</a>
          </div>`);
      } else {
        const p = item as ProviderMarker;
        iw.setContent(`<div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(p.title)}</h3>
            ${p.addressDisplay ? `<div style="color:#6b7280;font-size:12px;margin-bottom:10px">${escapeHtml(p.addressDisplay)}</div>` : ""}
            <a href="${escapeAttr(p.profileHref)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Profile →</a>
          </div>`);
      }
      iw.open({ map, anchor: marker });
    },
    [browseMode]
  );

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      if (!containerRef.current) return;
      if (!getGoogleMapsApiKey()) {
        setMapActive(false);
        return;
      }
      try {
        await loadGoogleMapsMapOnly();
      } catch {
        setMapActive(false);
        return;
      }
      if (cancelled || !containerRef.current || !window.google?.maps?.Map) {
        setMapActive(false);
        return;
      }

      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      if (cancelled || !containerRef.current) return;

      const el = containerRef.current;
      if (!(await waitForMapContainer(el))) {
        setMapActive(false);
        return;
      }
      if (cancelled) return;

      let map: google.maps.Map;
      try {
        map = new google.maps.Map(el, {
          center: { lat: center.lat, lng: center.lng },
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });
      } catch {
        setMapActive(false);
        return;
      }
      if (cancelled) return;

      mapRef.current = map;
      setMapActive(true);
      onMapReady?.(map);

      const resizeMap = () => {
        if (cancelled) return;
        try {
          google.maps.event.trigger(map, "resize");
        } catch {
          /* ignore */
        }
      };

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        resizeObserver = new ResizeObserver(() => resizeMap());
        resizeObserver.observe(containerRef.current);
      }

      let sdkBumped = false;
      const bumpSdkReady = () => {
        if (cancelled || sdkBumped) return;
        sdkBumped = true;
        resizeMap();
        setSdkReady((n) => n + 1);
      };

      let clearLoadFallbackTimers: (() => void) | undefined;
      const idleListener = google.maps.event.addListenerOnce(map, "idle", () => {
        clearLoadFallbackTimers?.();
        bumpSdkReady();
      });
      const fallbackId = window.setTimeout(() => bumpSdkReady(), 8000);
      clearLoadFallbackTimers = () => clearTimeout(fallbackId);

      destroy = () => {
        google.maps.event.removeListener(idleListener);
        clearLoadFallbackTimers?.();
        resizeObserver?.disconnect();
        clustererRef.current?.clearMarkers();
        clustererRef.current = null;
        markerByIdRef.current.forEach((m) => m.setMap(null));
        markerByIdRef.current.clear();
        userMarkerRef.current?.setMap(null);
        userMarkerRef.current = null;
        infoWindowRef.current?.close();
        infoWindowRef.current = null;
        mapRef.current = null;
        setMapActive(false);
      };
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once when visible
  }, [visible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapActive) return;
    try {
      map.panTo({ lat: center.lat, lng: center.lng });
      map.setZoom(map.getZoom() ?? zoom);
    } catch {
      /* ignore */
    }
  }, [center.lat, center.lng, zoom, mapActive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapActive || !flyToTarget) return;
    const z = flyToTarget.zoom ?? 14;
    try {
      map.panTo({ lat: flyToTarget.lat, lng: flyToTarget.lng });
      map.setZoom(z);
    } catch {
      /* ignore */
    }
  }, [flyToRevision, flyToTarget, mapActive]);

  useEffect(() => {
    if (!sdkReady || !mapActive) return;
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    let cancelled = false;
    const nextIds = new Set(normalizedMarkers.map((m) => String(m.id)));
    const byId = markerByIdRef.current;

    for (const [id, m] of byId) {
      if (!nextIds.has(String(id))) {
        google.maps.event.clearInstanceListeners(m);
        if (clustererRef.current) clustererRef.current.removeMarker(m);
        m.setMap(null);
        byId.delete(id);
      }
    }

    const attachClick = (m: google.maps.Marker, id: string) => {
      google.maps.event.clearInstanceListeners(m);
      m.addListener("click", () => {
        if (cancelled) return;
        const current = normalizedMarkersRef.current.find((x) => String(x.id) === String(id));
        if (current) openInfoForMarker(m, current);
      });
    };

    for (const item of normalizedMarkers) {
      const color = (item as ServiceMarker & ProviderMarker).color || "#3b82f6";
      const idKey = String(item.id);
      let marker = byId.get(idKey);
      if (marker) {
        marker.setPosition({ lat: item.lat, lng: item.lng });
        marker.setIcon(PIN(color));
        marker.setZIndex(1000);
        attachClick(marker, idKey);
      } else {
        marker = new google.maps.Marker({
          position: { lat: item.lat, lng: item.lng },
          icon: PIN(color),
          map: clusteringEnabled ? null : map,
          zIndex: 1000,
        });
        attachClick(marker, idKey);
        byId.set(idKey, marker);
      }
    }

    const list = Array.from(byId.values());

    if (clusteringEnabled) {
      if (!clustererRef.current) {
        clustererRef.current = new MarkerClusterer({ map });
      }
      clustererRef.current.clearMarkers();
      list.forEach((m) => m.setMap(null));
      clustererRef.current.addMarkers(list);
    } else {
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
      list.forEach((m) => m.setMap(map));
    }

    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new google.maps.Marker({
          map,
          position: { lat: userLocation.lat, lng: userLocation.lng },
          icon: PIN("#22c55e"),
          zIndex: 1,
        });
      } else {
        userMarkerRef.current.setPosition({ lat: userLocation.lat, lng: userLocation.lng });
        userMarkerRef.current.setZIndex(1);
        userMarkerRef.current.setMap(map);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    return () => {
      cancelled = true;
    };
  }, [
    sdkReady,
    mapActive,
    browseMode,
    markersDataKey,
    normalizedMarkers,
    clusteringEnabled,
    openInfoForMarker,
    userLocKey,
    userLocation,
  ]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] ${className}`}
      data-google-map="true"
    />
  );
});
