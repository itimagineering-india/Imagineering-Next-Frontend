"use client";
/**
 * Interactive map: Mappls (MapmyIndia) first, Mapbox GL JS as fallback.
 * File name kept as MapboxMap.tsx for stable imports across the app.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { loadMapplsMapScript, getMapplsAccessToken } from "@/lib/mapConfig";
import { mapplsGeocodeAddress } from "@/lib/mapplsApi";
import { getMapboxAccessToken, mapboxForwardGeocode } from "@/lib/mapboxGeocode";
import type { Map as MapboxMapInstance } from "mapbox-gl";

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

async function geocodeAddressToCoords(
  address: string,
  options?: { preferMapbox?: boolean }
): Promise<{ lat: number; lng: number } | null> {
  const mapplsT = getMapplsAccessToken();
  const mapboxT = getMapboxAccessToken();
  const tryMappls = () => (mapplsT ? mapplsGeocodeAddress(address, mapplsT) : Promise.resolve(null));
  const tryMapbox = () => (mapboxT ? mapboxForwardGeocode(address, mapboxT) : Promise.resolve(null));

  if (options?.preferMapbox && mapboxT) {
    const fromMb = await tryMapbox();
    if (fromMb) return fromMb;
    return tryMappls();
  }
  const fromMp = await tryMappls();
  if (fromMp) return fromMp;
  return tryMapbox();
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
  const mapRef = useRef<MapboxMapInstance | null>(null);
  const markersRef = useRef<Array<{ remove?: () => void }>>([]);
  const infoRef = useRef<{ close?: () => void } | null>(null);
  const [sdkReady, setSdkReady] = useState(0);
  const [mapProvider, setMapProvider] = useState<"mappls" | "mapbox" | null>(null);

  const createPopupContent = useCallback((html: string) => html, []);

  // Init: Mappls first, then Mapbox GL if Mappls fails or is unavailable
  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      if (!containerRef.current) return;

      const tryMappls = async (): Promise<boolean> => {
        const key = getMapplsAccessToken();
        if (!key) return false;
        try {
          await loadMapplsMapScript();
        } catch {
          return false;
        }
        if (cancelled || !containerRef.current) return false;
        const mappls = getMappls();
        if (!mappls?.Map) return false;

        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled || !containerRef.current) return false;

        let map: InstanceType<MapplsGlobal["Map"]>;
        try {
          map = new mappls.Map(containerRef.current, {
            center: { lat: center.lat, lng: center.lng },
            zoom,
          });
        } catch {
          return false;
        }
        if (cancelled) {
          map.remove?.();
          return false;
        }

        mapRef.current = map as unknown as MapboxMapInstance;
        setMapProvider("mappls");
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
          setMapProvider(null);
        };
        return true;
      };

      const tryMapbox = async (): Promise<boolean> => {
        const key = getMapboxAccessToken();
        if (!key || !containerRef.current) return false;
        let mapboxgl: typeof import("mapbox-gl").default;
        try {
          mapboxgl = (await import("mapbox-gl")).default;
          await import("mapbox-gl/dist/mapbox-gl.css");
          mapboxgl.accessToken = key;
        } catch {
          return false;
        }
        if (cancelled || !containerRef.current) return false;
        containerRef.current.innerHTML = "";

        await new Promise<void>((r) => requestAnimationFrame(() => r()));
        if (cancelled || !containerRef.current) return false;

        let map: MapboxMapInstance;
        try {
          map = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [center.lng, center.lat],
            zoom,
          });
        } catch {
          return false;
        }
        if (cancelled) {
          map.remove();
          return false;
        }

        mapRef.current = map;
        setMapProvider("mapbox");
        onMapReady?.(map);

        const resizeMap = () => {
          if (cancelled) return;
          try {
            map.resize();
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

        const bumpReady = () => {
          if (cancelled) return;
          resizeMap();
          setSdkReady((n) => n + 1);
        };
        if (map.loaded()) {
          bumpReady();
        } else {
          map.once("load", bumpReady);
        }

        destroy = () => {
          resizeObserver?.disconnect();
          resizeObserver = null;
          markersRef.current.forEach((m) => m.remove?.());
          markersRef.current = [];
          map.remove();
          mapRef.current = null;
          setMapProvider(null);
        };
        return true;
      };

      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (cancelled || !containerRef.current) return;

      let ok = await tryMappls();
      if (!ok && !cancelled) {
        if (containerRef.current) containerRef.current.innerHTML = "";
        ok = await tryMapbox();
      }
      if (!ok && !cancelled) {
        setMapProvider(null);
      }
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
    if (!map || !mapProvider) return;
    try {
      if (mapProvider === "mapbox") {
        const m = map as MapboxMapInstance;
        m.flyTo({ center: [center.lng, center.lat], zoom: m.getZoom() });
      } else {
        const m = map as MapplsGlobal["Map"] extends new (...a: infer A) => infer R ? R : never;
        if (typeof m.flyTo === "function") {
          m.flyTo({ center: { lat: center.lat, lng: center.lng }, zoom: m.getZoom?.() ?? zoom });
        } else {
          m.setCenter({ lat: center.lat, lng: center.lng });
        }
      }
    } catch {
      /* ignore */
    }
  }, [center.lat, center.lng, zoom, mapProvider]);

  // Imperative fly-to
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapProvider || !flyToTarget) return;
    const z = flyToTarget.zoom ?? 14;
    try {
      if (mapProvider === "mapbox") {
        const m = map as MapboxMapInstance;
        m.flyTo({ center: [flyToTarget.lng, flyToTarget.lat], zoom: z });
      } else {
        const m = map as MapplsGlobal["Map"] extends new (...a: infer A) => infer R ? R : never;
        if (typeof m.flyTo === "function") {
          m.flyTo({ center: { lat: flyToTarget.lat, lng: flyToTarget.lng }, zoom: z });
        } else {
          m.setCenter({ lat: flyToTarget.lat, lng: flyToTarget.lng });
          m.setZoom(z);
        }
      }
    } catch {
      /* ignore */
    }
  }, [flyToRevision, flyToTarget, mapProvider]);

  // Markers + geocode
  useEffect(() => {
    if (!sdkReady || !mapProvider) return;
    const map = mapRef.current;
    if (!map) return;

    const mappls = getMappls();
    let isCancelled = false;
    const markers = browseMode === "services" ? serviceMarkers : providerMarkers;

    const clearMarkers = () => {
      markersRef.current.forEach((m) => m.remove?.());
      markersRef.current = [];
      infoRef.current?.close?.();
      infoRef.current = null;
    };

    const addMarkerMappls = (item: ServiceMarker | ProviderMarker, lat: number, lng: number) => {
      if (isCancelled || !mapRef.current || !mappls?.Marker) return;

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
            <a href="/services/${escapeHtml(s.id)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Details →</a>
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

    const addMarkerMapbox = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      const mbMap = map as MapboxMapInstance;

      const addOne = (item: ServiceMarker | ProviderMarker, lat: number, lng: number) => {
        const wrap = document.createElement("div");
        wrap.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:${(item as ServiceMarker & ProviderMarker).color || "#3b82f6"};border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3);cursor:pointer"></div>`;
        const el = wrap.firstElementChild as HTMLElement;

        let html = "";
        if (browseMode === "services") {
          const s = item as ServiceMarker;
          html = `
          <div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            ${s.categoryName ? `<div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;margin-bottom:6px">${escapeHtml(s.categoryName)}</div>` : ""}
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(s.title)}</h3>
            ${s.description ? `<p style="color:#4b5563;font-size:13px;margin-bottom:8px">${escapeHtml(s.description)}</p>` : ""}
            ${s.price != null ? `<div style="font-weight:700;color:#059669;font-size:16px;margin-bottom:8px">₹${s.price.toLocaleString()}${s.priceType ? ` ${escapeHtml(String(s.priceType))}` : ""}</div>` : ""}
            <a href="/services/${escapeHtml(s.id)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Details →</a>
          </div>`;
        } else {
          const p = item as ProviderMarker;
          html = `
          <div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(p.title)}</h3>
            ${p.addressDisplay ? `<div style="color:#6b7280;font-size:12px;margin-bottom:10px">${escapeHtml(p.addressDisplay)}</div>` : ""}
            <a href="${escapeAttr(p.profileHref)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Profile →</a>
          </div>`;
        }

        const popup = new mapboxgl.Popup({ offset: 20, maxWidth: "320px" }).setHTML(html);
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(mbMap);
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
        if (item.address) {
          const key = item.address.trim().toLowerCase();
          if (!byAddress.has(key)) byAddress.set(key, []);
          byAddress.get(key)!.push(item);
        }
      });

      withCoords.forEach(({ item, lat, lng }) => addOne(item, lat, lng));

      byAddress.forEach((items, addressKey) => {
        const address = items[0]!.address!;
        const cached = geocodeCache.get(addressKey);
        if (cached) {
          items.forEach((item) => addOne(item, cached.lat, cached.lng));
          return;
        }
        void geocodeAddressToCoords(address, { preferMapbox: true }).then((coords) => {
          if (isCancelled || !coords || !mapRef.current) return;
          geocodeCache.set(addressKey, coords);
          items.forEach((item) => addOne(item, coords.lat, coords.lng));
        });
      });

      if (userLocation && !isCancelled) {
        try {
          const el = document.createElement("div");
          el.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`;
          const dot = el.firstElementChild as HTMLElement;
          const um = new mapboxgl.Marker({ element: dot })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(mbMap);
          markersRef.current.push(um);
        } catch {
          /* ignore */
        }
      }
    };

    clearMarkers();

    if (mapProvider === "mapbox") {
      void addMarkerMapbox();
      return () => {
        isCancelled = true;
        clearMarkers();
      };
    }

    // Mappls markers
    const byAddress = new Map<string, (ServiceMarker | ProviderMarker)[]>();
    const withCoords: Array<{ item: ServiceMarker | ProviderMarker; lat: number; lng: number }> = [];

    markers.forEach((item) => {
      if (item.lat != null && item.lng != null) {
        withCoords.push({ item, lat: item.lat, lng: item.lng });
        return;
      }
      if (item.address) {
        const key = item.address.trim().toLowerCase();
        if (!byAddress.has(key)) byAddress.set(key, []);
        byAddress.get(key)!.push(item);
      }
    });

    withCoords.forEach(({ item, lat, lng }) => addMarkerMappls(item, lat, lng));

    byAddress.forEach((items, addressKey) => {
      const address = items[0]!.address!;
      const cached = geocodeCache.get(addressKey);
      if (cached) {
        items.forEach((item) => addMarkerMappls(item, cached.lat, cached.lng));
        return;
      }
      void geocodeAddressToCoords(address).then((coords) => {
        if (isCancelled || !coords || !mapRef.current) return;
        geocodeCache.set(addressKey, coords);
        items.forEach((item) => addMarkerMappls(item, coords.lat, coords.lng));
      });
    });

    if (userLocation && !isCancelled && mappls?.Marker) {
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
  }, [sdkReady, mapProvider, browseMode, serviceMarkers, providerMarkers, userLocation, createPopupContent]);

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
