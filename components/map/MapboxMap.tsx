"use client";

/**
 * Interactive map: Mappls (MapmyIndia) Web SDK.
 * File name kept as MapboxMap.tsx for stable imports across the app.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { loadMapplsMapScript, getMapplsAccessToken } from "@/lib/mapConfig";
import { mapplsGeocodeAddress } from "@/lib/mapplsApi";

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

const geocodeCache = new Map<string, { lat: number; lng: number }>();

interface MapplsMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  serviceMarkers?: ServiceMarker[];
  providerMarkers?: ProviderMarker[];
  userLocation?: { lat: number; lng: number } | null;
  browseMode: "services" | "providers";
  className?: string;
  onMapReady?: (map: unknown) => void;
  /** Imperative pan/zoom (increment revision when target changes) */
  flyToTarget?: { lat: number; lng: number; zoom?: number } | null;
  flyToRevision?: number;
}

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const DEFAULT_ZOOM = 12;

type MapplsGlobal = {
  Map: new (
    el: HTMLElement | string,
    opts: { center: { lat: number; lng: number }; zoom: number; [k: string]: unknown }
  ) => {
    setCenter: (c: { lat: number; lng: number }) => void;
    setZoom: (z: number) => void;
    getZoom: () => number;
    remove?: () => void;
    flyTo?: (o: { center: { lat: number; lng: number }; zoom?: number }) => void;
    loaded?: () => boolean;
    addListener?: (event: string, listener: () => void) => void;
    resize?: () => void;
  };
  Marker: new (opts: {
    map: unknown;
    position: { lat: number; lng: number };
    icon?: string;
    width?: number;
    height?: number;
    offset?: { width: number; height: number };
    html?: string;
  }) => { remove?: () => void; addListener?: (ev: string, fn: () => void) => void };
  InfoWindow?: new (opts: { content: string; offset?: [number, number] }) => {
    open: (map: unknown, marker: unknown) => void;
    close?: () => void;
  };
};

function getMappls(): MapplsGlobal | null {
  if (typeof window === "undefined") return null;
  const m = (window as unknown as { mappls?: MapplsGlobal }).mappls;
  return m || null;
}

export function MapboxMap({
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
}: MapplsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{
    setCenter: (c: { lat: number; lng: number }) => void;
    setZoom: (z: number) => void;
    getZoom: () => number;
    remove?: () => void;
    flyTo?: (o: { center: { lat: number; lng: number }; zoom?: number }) => void;
  } | null>(null);
  const markersRef = useRef<Array<{ remove?: () => void }>>([]);
  const infoRef = useRef<{ close?: () => void } | null>(null);
  const [sdkReady, setSdkReady] = useState(0);

  const createPopupContent = useCallback((html: string) => html, []);

  // Init map once
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      if (!containerRef.current) return;
      try {
        await loadMapplsMapScript();
      } catch {
        return;
      }
      if (cancelled || !containerRef.current) return;
      const mappls = getMappls();
      if (!mappls?.Map) return;

      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled || !containerRef.current) return;

      const map = new mappls.Map(containerRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
      });
      if (cancelled) {
        map.remove?.();
        return;
      }
      mapRef.current = map;
      onMapReady?.(map);

      const resizeMap = () => {
        if (cancelled) return;
        try {
          map.resize?.();
        } catch {
          /* ignore */
        }
      };

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          resizeMap();
        });
        resizeObserver.observe(containerRef.current);
      }

      let clearLoadFallbackTimers: (() => void) | undefined;

      let markersBumpScheduled = false;
      const bumpMarkersReady = () => {
        if (cancelled || markersBumpScheduled) return;
        markersBumpScheduled = true;
        resizeMap();
        setSdkReady((n) => n + 1);
      };
      if (typeof map.loaded === "function" && map.loaded()) {
        bumpMarkersReady();
      } else if (typeof map.addListener === "function") {
        map.addListener("load", bumpMarkersReady);
        let pollId: number | null = null;
        let fallbackTimeoutId: number | null = null;
        pollId = window.setInterval(() => {
          if (cancelled || markersBumpScheduled) {
            if (pollId != null) clearInterval(pollId);
            return;
          }
          if (typeof map.loaded === "function" && map.loaded()) {
            if (pollId != null) clearInterval(pollId);
            bumpMarkersReady();
          }
        }, 200);
        fallbackTimeoutId = window.setTimeout(() => {
          if (pollId != null) clearInterval(pollId);
          if (!cancelled && !markersBumpScheduled) bumpMarkersReady();
        }, 5000);
        clearLoadFallbackTimers = () => {
          if (pollId != null) clearInterval(pollId);
          if (fallbackTimeoutId != null) clearTimeout(fallbackTimeoutId);
          pollId = null;
          fallbackTimeoutId = null;
        };
      } else {
        bumpMarkersReady();
      }

      destroy = () => {
        clearLoadFallbackTimers?.();
        resizeObserver?.disconnect();
        resizeObserver = null;
        markersRef.current.forEach((m) => m.remove?.());
        markersRef.current = [];
        infoRef.current?.close?.();
        map.remove?.();
        mapRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  // Center updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (typeof map.flyTo === "function") {
        map.flyTo({ center: { lat: center.lat, lng: center.lng }, zoom: map.getZoom?.() ?? zoom });
      } else {
        map.setCenter({ lat: center.lat, lng: center.lng });
      }
    } catch {
      /* ignore */
    }
  }, [center.lat, center.lng, zoom]);

  // Imperative fly-to (sidebar / cards)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;
    const z = flyToTarget.zoom ?? 14;
    try {
      if (typeof map.flyTo === "function") {
        map.flyTo({ center: { lat: flyToTarget.lat, lng: flyToTarget.lng }, zoom: z });
      } else {
        map.setCenter({ lat: flyToTarget.lat, lng: flyToTarget.lng });
        map.setZoom(z);
      }
    } catch {
      /* ignore */
    }
  }, [flyToRevision, flyToTarget]);

  // Markers + geocode (after SDK + map instance exist)
  useEffect(() => {
    if (!sdkReady) return;
    const map = mapRef.current;
    const mappls = getMappls();
    if (!map || !mappls) return;

    let isCancelled = false;
    const token = getMapplsAccessToken();
    const markers = browseMode === "services" ? serviceMarkers : providerMarkers;

    const clearMarkers = () => {
      markersRef.current.forEach((m) => m.remove?.());
      markersRef.current = [];
      infoRef.current?.close?.();
      infoRef.current = null;
    };

    const addMarker = (item: ServiceMarker | ProviderMarker, lat: number, lng: number) => {
      if (isCancelled || !mapRef.current || !mappls.Marker) return;

      const elHtml = `<div style="width:22px;height:22px;border-radius:50%;background:${(item as ServiceMarker & ProviderMarker).color || "#3b82f6"};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer"></div>`;

      let marker: { remove?: () => void; addListener?: (ev: string, fn: () => void) => void };
      try {
        marker = new mappls.Marker({
          map,
          position: { lat, lng },
          html: elHtml,
        });
      } catch {
        marker = new mappls.Marker({
          map,
          position: { lat, lng },
        });
      }

      const openPopup = () => {
        infoRef.current?.close?.();
        if (browseMode === "services") {
          const s = item as ServiceMarker;
          const content = createPopupContent(`
          <div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            ${s.categoryName ? `<div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;margin-bottom:6px">${escapeHtml(s.categoryName)}</div>` : ""}
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(s.title)}</h3>
            ${s.description ? `<p style="color:#4b5563;font-size:13px;margin-bottom:8px">${escapeHtml(s.description)}</p>` : ""}
            ${s.price != null ? `<div style="font-weight:700;color:#059669;font-size:16px;margin-bottom:8px">₹${s.price.toLocaleString()}${s.priceType ? ` ${escapeHtml(String(s.priceType))}` : ""}</div>` : ""}
            <a href="/service/${escapeHtml(s.id)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Details →</a>
          </div>`);
          if (mappls.InfoWindow) {
            const iw = new mappls.InfoWindow({ content });
            iw.open(map, marker);
            infoRef.current = iw;
          }
        } else {
          const p = item as ProviderMarker;
          const content = createPopupContent(`
          <div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(p.title)}</h3>
            ${p.addressDisplay ? `<div style="color:#6b7280;font-size:12px;margin-bottom:10px">${escapeHtml(p.addressDisplay)}</div>` : ""}
            <a href="${escapeAttr(p.profileHref)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Profile →</a>
          </div>`);
          if (mappls.InfoWindow) {
            const iw = new mappls.InfoWindow({ content });
            iw.open(map, marker);
            infoRef.current = iw;
          }
        }
      };

      if (typeof marker.addListener === "function") {
        marker.addListener("click", openPopup);
      } else {
        (marker as unknown as { on?: (ev: string, fn: () => void) => void }).on?.("click", openPopup);
      }

      markersRef.current.push(marker);
    };

    clearMarkers();

    const byAddress = new Map<string, (ServiceMarker | ProviderMarker)[]>();
    const withCoords: Array<{ item: ServiceMarker | ProviderMarker; lat: number; lng: number }> = [];

    markers.forEach((item) => {
      if (item.lat != null && item.lng != null) {
        withCoords.push({ item, lat: item.lat, lng: item.lng });
        return;
      }
      if (item.address && token) {
        const key = item.address.trim().toLowerCase();
        if (!byAddress.has(key)) byAddress.set(key, []);
        byAddress.get(key)!.push(item);
      }
    });

    withCoords.forEach(({ item, lat, lng }) => addMarker(item, lat, lng));

    byAddress.forEach((items, addressKey) => {
      const address = items[0]!.address!;
      const cached = geocodeCache.get(addressKey);
      if (cached) {
        items.forEach((item) => addMarker(item, cached.lat, cached.lng));
        return;
      }
      mapplsGeocodeAddress(address, token).then((coords) => {
        if (isCancelled || !coords || !mapRef.current) return;
        geocodeCache.set(addressKey, coords);
        items.forEach((item) => addMarker(item, coords.lat, coords.lng));
      });
    });

    if (userLocation && !isCancelled) {
      try {
        const um = new mappls.Marker({
          map,
          position: { lat: userLocation.lat, lng: userLocation.lng },
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        });
        markersRef.current.push(um);
      } catch {
        /* ignore */
      }
    }

    return () => {
      isCancelled = true;
      clearMarkers();
    };
  }, [sdkReady, browseMode, serviceMarkers, providerMarkers, userLocation, createPopupContent]);

  return <div ref={containerRef} className={`w-full h-full min-h-[400px] ${className}`} />;
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
