"use client";

/**
 * Interactive browse map — Mapbox GL (public Services / Search Results).
 */

import { useEffect, useRef, useCallback, useState, useMemo, memo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxAccessToken } from "@/lib/mapboxConfig";
import { boundsLikeFromNeSw, filterMarkersByViewport, type LatLngBoundsLike } from "@/utils/mapViewportMarkers";
import type { GoogleMapProps, ServiceMarker, ProviderMarker } from "./GoogleMap";
import { formatServicePrice } from "@/lib/formatServicePrice";

export type { ServiceMarker, ProviderMarker };

/** Mapbox browse map props (extends shared browse map shape). */
export type MapboxBrowseMapProps = GoogleMapProps & {
  onMarkersRendered?: () => void;
};

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 };
const DEFAULT_ZOOM = 14;

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

function pinElement(fill: string, layer: "listing" | "user" = "listing"): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "20px";
  el.style.height = "20px";
  el.style.borderRadius = "50%";
  el.style.background = fill;
  el.style.border = "2px solid #ffffff";
  el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
  el.style.cursor = "pointer";
  el.style.pointerEvents = "auto";
  el.style.zIndex = layer === "user" ? "1" : "10";
  return el;
}

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

export const MapboxBrowseMap = memo(function MapboxBrowseMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  serviceMarkers = [],
  providerMarkers = [],
  userLocation = null,
  browseMode,
  className = "",
  onMapReady: _onMapReady,
  flyToTarget,
  flyToRevision = 0,
  clusteringEnabled: _clusteringEnabled = true,
  lazyWhenVisible = false,
  onMarkersRendered,
}: MapboxBrowseMapProps) {
  const onMarkersRenderedRef = useRef(onMarkersRendered);
  onMarkersRenderedRef.current = onMarkersRendered;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerByIdRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [sdkReady, setSdkReady] = useState(0);
  const [mapActive, setMapActive] = useState(false);
  const [visible, setVisible] = useState(!lazyWhenVisible);
  const [mapError, setMapError] = useState<string | null>(null);

  const token = getMapboxAccessToken();

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

  const [viewportBounds, setViewportBounds] = useState<LatLngBoundsLike | null>(null);

  const markersToRender = useMemo(() => {
    return filterMarkersByViewport(normalizedMarkers, viewportBounds);
  }, [normalizedMarkers, viewportBounds]);

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

  const openPopupForItem = useCallback(
    (map: mapboxgl.Map, lng: number, lat: number, item: ServiceMarker | ProviderMarker) => {
      if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({ maxWidth: "320px", closeButton: true });
      }
      const popup = popupRef.current;
      if (browseMode === "services") {
        const s = item as ServiceMarker;
        const priceText = formatServicePrice(s);
        popup.setHTML(`<div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            ${s.categoryName ? `<div style="font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:600;margin-bottom:6px">${escapeHtml(s.categoryName)}</div>` : ""}
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(s.title)}</h3>
            ${s.description ? `<p style="color:#4b5563;font-size:13px;margin-bottom:8px">${escapeHtml(s.description)}</p>` : ""}
            ${priceText ? `<div style="font-weight:700;color:#059669;font-size:16px;margin-bottom:8px">${escapeHtml(priceText)}</div>` : ""}
            <a href="/services/${escapeHtml(s.id)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Details →</a>
          </div>`);
      } else {
        const p = item as ProviderMarker;
        popup.setHTML(`<div style="padding:12px;min-width:220px;font-family:system-ui,sans-serif">
            <h3 style="font-weight:700;margin-bottom:6px;font-size:16px">${escapeHtml(p.title)}</h3>
            ${p.addressDisplay ? `<div style="color:#6b7280;font-size:12px;margin-bottom:10px">${escapeHtml(p.addressDisplay)}</div>` : ""}
            <a href="${escapeAttr(p.profileHref)}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Profile →</a>
          </div>`);
      }
      popup.setLngLat([lng, lat]).addTo(map);
    },
    [browseMode]
  );

  const openPopupForItemRef = useRef(openPopupForItem);
  openPopupForItemRef.current = openPopupForItem;

  const markerInteractionAbortByIdRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    if (!visible) return;
    if (!token) {
      setMapActive(false);
      setMapError("Mapbox token missing from this build.");
      return;
    }
    mapboxgl.accessToken = token;
    setMapError(null);

    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      if (!containerRef.current) return;
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      if (cancelled || !containerRef.current) return;

      const el = containerRef.current;
      if (!(await waitForMapContainer(el))) {
        setMapActive(false);
        setMapError("Map container failed to size. Try refreshing.");
        return;
      }
      if (cancelled) return;

      let map: mapboxgl.Map;
      try {
        map = new mapboxgl.Map({
          container: el,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [center.lng, center.lat],
          zoom,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      } catch {
        setMapActive(false);
        setMapError("Could not start Mapbox. Check the access token.");
        return;
      }
      if (cancelled) {
        map.remove();
        return;
      }

      mapRef.current = map;
      setMapActive(true);

      const onMapError = (e: mapboxgl.ErrorEvent) => {
        if (cancelled) return;
        const msg = String(e?.error?.message || e?.error || "").toLowerCase();
        if (
          msg.includes("401") ||
          msg.includes("403") ||
          msg.includes("unauthorized") ||
          msg.includes("forbidden")
        ) {
          setMapError(
            "Mapbox blocked this domain (401/403). Add your production URL to the token allowlist, or set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN and rebuild."
          );
        } else if (msg) {
          setMapError("Map tiles failed to load. Check Mapbox token and network.");
        }
      };
      map.on("error", onMapError);

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
        resizeObserver = new ResizeObserver(() => resizeMap());
        resizeObserver.observe(containerRef.current);
      }

      map.once("load", () => {
        if (cancelled) return;
        setMapError(null);
        resizeMap();
        setSdkReady((n) => n + 1);
      });
      const fallbackId = window.setTimeout(() => {
        if (!cancelled) {
          resizeMap();
          setSdkReady((n) => n + 1);
        }
      }, 4000);

      destroy = () => {
        window.clearTimeout(fallbackId);
        resizeObserver?.disconnect();
        map.off("error", onMapError);
        markerInteractionAbortByIdRef.current.forEach((ac) => ac.abort());
        markerInteractionAbortByIdRef.current.clear();
        markerByIdRef.current.forEach((m) => m.remove());
        markerByIdRef.current.clear();
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        popupRef.current?.remove();
        popupRef.current = null;
        try {
          map.remove();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
        setMapActive(false);
      };
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once when visible
  }, [visible, token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapActive) return;
    try {
      map.setCenter([center.lng, center.lat]);
      const z = map.getZoom();
      if (z != null) map.setZoom(z);
    } catch {
      /* ignore */
    }
  }, [center.lat, center.lng, zoom, mapActive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapActive || !flyToTarget) return;
    const z = flyToTarget.zoom ?? 14;
    try {
      map.flyTo({
        center: [flyToTarget.lng, flyToTarget.lat],
        zoom: z,
        essential: true,
      });
    } catch {
      /* ignore */
    }
  }, [flyToRevision, flyToTarget, mapActive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapActive || !sdkReady) return;
    let debounceId: ReturnType<typeof setTimeout> | undefined;
    const updateBounds = () => {
      const b = map.getBounds();
      setViewportBounds(b ? boundsLikeFromNeSw(b.getNorthEast(), b.getSouthWest()) : null);
    };
    updateBounds();
    const onMoveEnd = () => {
      if (debounceId !== undefined) clearTimeout(debounceId);
      debounceId = setTimeout(updateBounds, 90);
    };
    map.on("moveend", onMoveEnd);
    return () => {
      if (debounceId !== undefined) clearTimeout(debounceId);
      map.off("moveend", onMoveEnd);
    };
  }, [mapActive, sdkReady]);

  useEffect(() => {
    if (!sdkReady || !mapActive) return;
    const map = mapRef.current;
    if (!map) return;

    const nextIds = new Set(markersToRender.map((m) => String(m.id)));
    const byId = markerByIdRef.current;
    const abortById = markerInteractionAbortByIdRef.current;

    for (const [id, m] of byId) {
      if (!nextIds.has(String(id))) {
        abortById.get(String(id))?.abort();
        abortById.delete(String(id));
        m.remove();
        byId.delete(id);
      }
    }

    const wireMarkerDom = (marker: mapboxgl.Marker, markerId: string) => {
      const el = marker.getElement();
      if (!el) return;
      abortById.get(markerId)?.abort();
      const ac = new AbortController();
      abortById.set(markerId, ac);
      const opts = { capture: true, signal: ac.signal } as const;

      let lastOpenedAt = 0;
      const open = (e: Event) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastOpenedAt < 350) return;
        lastOpenedAt = now;
        const current = normalizedMarkersRef.current.find((x) => String(x.id) === String(markerId));
        if (current) openPopupForItemRef.current(map, current.lng, current.lat, current);
      };
      el.addEventListener("click", open, opts);
      el.addEventListener(
        "pointerup",
        (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          open(e);
        },
        opts
      );
    };

    for (const item of markersToRender) {
      const color = (item as ServiceMarker & ProviderMarker).color || "#3b82f6";
      const idKey = String(item.id);
      let m = byId.get(idKey);
      if (m) {
        m.setLngLat([item.lng, item.lat]);
        const el = m.getElement();
        if (el) {
          el.style.zIndex = "10";
          el.style.cursor = "pointer";
        }
        if (el?.firstChild instanceof HTMLElement) {
          const inner = el.firstChild as HTMLElement;
          inner.style.background = color;
          inner.style.zIndex = "10";
        }
        wireMarkerDom(m, idKey);
      } else {
        const el = pinElement(color, "listing");
        m = new mapboxgl.Marker({ element: el })
          .setLngLat([item.lng, item.lat])
          .addTo(map);
        byId.set(idKey, m);
        wireMarkerDom(m, idKey);
      }
    }

    if (userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng)) {
      if (!userMarkerRef.current) {
        const el = pinElement("#22c55e", "user");
        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    requestAnimationFrame(() => {
      onMarkersRenderedRef.current?.();
    });

    return () => {
      markerInteractionAbortByIdRef.current.forEach((ac) => ac.abort());
      markerInteractionAbortByIdRef.current.clear();
    };
  }, [sdkReady, mapActive, browseMode, markersDataKey, markersToRender, userLocKey, userLocation]);

  return (
    <div className={`relative w-full h-full min-h-[400px] ${className}`}>
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        data-mapbox-browse-map="true"
      />
      {mapError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/90 p-4">
          <div className="max-w-sm rounded-xl border bg-background p-4 text-center shadow-sm">
            <p className="text-sm font-semibold text-foreground">Map unavailable</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{mapError}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
});
