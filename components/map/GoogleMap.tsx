/**
 * Interactive map — Google Maps JavaScript API.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { loadGoogleMapsScript, getGoogleMapsApiKey } from "@/lib/mapConfig";

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

interface GoogleMapProps {
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
}

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const DEFAULT_ZOOM = 12;

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

function geocodeAddressAsync(address: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) {
      resolve(null);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }
      const loc = results[0].geometry.location;
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
}

/** Exported as GoogleMap — kept GoogleMap name removed from this file. */
export function GoogleMap({
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
}: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [sdkReady, setSdkReady] = useState(0);
  const [mapActive, setMapActive] = useState(false);

  const createPopupContent = useCallback((html: string) => html, []);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      if (!containerRef.current) return;

      const key = getGoogleMapsApiKey();
      if (!key) {
        setMapActive(false);
        return;
      }
      try {
        await loadGoogleMapsScript();
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
        resizeObserver = new ResizeObserver(() => {
          resizeMap();
        });
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
      clearLoadFallbackTimers = () => {
        clearTimeout(fallbackId);
      };

      destroy = () => {
        google.maps.event.removeListener(idleListener);
        clearLoadFallbackTimers?.();
        resizeObserver?.disconnect();
        resizeObserver = null;
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        infoRef.current?.close();
        infoRef.current = null;
        mapRef.current = null;
        setMapActive(false);
      };
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

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

    let isCancelled = false;
    const markers = browseMode === "services" ? serviceMarkers : providerMarkers;

    const clearMarkers = () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      infoRef.current?.close();
      infoRef.current = null;
    };

    const pinIcon = (fill: string) =>
      ({
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: fill,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      }) as google.maps.Symbol;

    const addMarker = (item: ServiceMarker | ProviderMarker, lat: number, lng: number) => {
      if (isCancelled || !mapRef.current) return;
      const color = (item as ServiceMarker & ProviderMarker).color || "#3b82f6";

      const marker = new google.maps.Marker({
        map,
        position: { lat, lng },
        icon: pinIcon(color),
      });

      const openPopup = () => {
        infoRef.current?.close();
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
          const iw = new google.maps.InfoWindow({ content });
          iw.open({ map, anchor: marker });
          infoRef.current = iw;
        } else {
          const p = item as ProviderMarker;
          const content = createPopupContent(`
          <div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(p.title)}</h3>
            ${p.addressDisplay ? `<div style="color:#6b7280;font-size:12px;margin-bottom:10px">${escapeHtml(p.addressDisplay)}</div>` : ""}
            <a href="${escapeAttr(p.profileHref)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Profile →</a>
          </div>`);
          const iw = new google.maps.InfoWindow({ content });
          iw.open({ map, anchor: marker });
          infoRef.current = iw;
        }
      };

      marker.addListener("click", openPopup);
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

    withCoords.forEach(({ item, lat, lng }) => addMarker(item, lat, lng));

    byAddress.forEach((items, addressKey) => {
      const address = items[0]!.address!;
      const cached = geocodeCache.get(addressKey);
      if (cached) {
        items.forEach((item) => addMarker(item, cached.lat, cached.lng));
        return;
      }
      void geocodeAddressAsync(address).then((coords) => {
        if (isCancelled || !coords || !mapRef.current) return;
        geocodeCache.set(addressKey, coords);
        items.forEach((item) => addMarker(item, coords.lat, coords.lng));
      });
    });

    if (userLocation && !isCancelled) {
      const um = new google.maps.Marker({
        map,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        icon: pinIcon("#22c55e"),
        zIndex: 9999,
      });
      markersRef.current.push(um);
    }

    return () => {
      isCancelled = true;
      clearMarkers();
    };
  }, [sdkReady, mapActive, browseMode, serviceMarkers, providerMarkers, userLocation, createPopupContent]);

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

