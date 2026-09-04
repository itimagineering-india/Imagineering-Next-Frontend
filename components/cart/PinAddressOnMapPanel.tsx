"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { getMapboxAccessToken, isMapboxConfigured } from "@/lib/mapboxConfig";
import { getGoogleMapsApiKey, loadGoogleMapsMapOnly } from "@/lib/mapConfig";
import { reverseGeocodeDetails } from "@/lib/reverseGeocodeDetails";
import { useGeocoderByPolicy } from "@/hooks/useGeocoderByPolicy";
import { cn } from "@/lib/utils";

export type PinnedAddressResult = {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates: { lat: number; lng: number };
};

const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 };
const REVERSE_DEBOUNCE_MS = 450;

type PinAddressOnMapPanelProps = {
  initialCoordinates?: { lat: number; lng: number } | null;
  initialAddress?: string;
  onConfirm: (result: PinnedAddressResult) => void;
  onCancel: () => void;
};

export function PinAddressOnMapPanel({
  initialCoordinates,
  initialAddress,
  onConfirm,
  onCancel,
}: PinAddressOnMapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapboxRef = useRef<mapboxgl.Map | null>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const suppressReverseRef = useRef(false);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coordsRef = useRef({
    lat: initialCoordinates?.lat ?? DEFAULT_CENTER.lat,
    lng: initialCoordinates?.lng ?? DEFAULT_CENTER.lng,
  });

  const [coords, setCoords] = useState(coordsRef.current);
  const [addressLine, setAddressLine] = useState(initialAddress || "");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mapReady, setMapReady] = useState(false);

  const applyReverse = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const details = await reverseGeocodeDetails(lat, lng);
      if (details) {
        setAddressLine(details.address);
        setCity(details.city);
        setStateName(details.state);
        setZipCode(details.zipCode);
      }
    } finally {
      setResolving(false);
    }
  }, []);

  const scheduleReverse = useCallback(
    (lat: number, lng: number) => {
      if (suppressReverseRef.current) {
        suppressReverseRef.current = false;
        return;
      }
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      reverseTimerRef.current = setTimeout(() => {
        void applyReverse(lat, lng);
      }, REVERSE_DEBOUNCE_MS);
    },
    [applyReverse]
  );

  const moveTo = useCallback(
    (lat: number, lng: number, opts?: { reverse?: boolean }) => {
      coordsRef.current = { lat, lng };
      setCoords({ lat, lng });
      suppressReverseRef.current = true;
      if (mapboxRef.current) {
        mapboxRef.current.easeTo({ center: [lng, lat], duration: 320 });
      } else if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat, lng });
      }
      if (opts?.reverse !== false) void applyReverse(lat, lng);
    },
    [applyReverse]
  );

  const {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange,
    hasAnyGeocoder,
  } = useGeocoderByPolicy("public", {
    deferScriptLoad: true,
    onPlaceSelect: (place) => {
      const lat = place.geometry?.location?.lat?.();
      const lng = place.geometry?.location?.lng?.();
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      setSearch("");
      setShowSuggestions(false);
      if (place.city) setCity(place.city);
      if (place.state) setStateName(place.state);
      if (place.postalCode) setZipCode(place.postalCode);
      if (place.formatted_address) setAddressLine(place.formatted_address);
      moveTo(Number(lat), Number(lng), { reverse: true });
    },
  });

  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;
    const start = coordsRef.current;
    const mbToken = getMapboxAccessToken();
    const useMapbox = isMapboxConfigured() && Boolean(mbToken);
    const gKey = getGoogleMapsApiKey();

    if (!containerRef.current) return;
    if (!useMapbox && !gKey) {
      setMapError("Map not configured. Set Mapbox or Google Maps API key.");
      return;
    }

    if (useMapbox) {
      mapboxgl.accessToken = mbToken;
      try {
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [start.lng, start.lat],
          zoom: 16,
          attributionControl: false,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
        mapboxRef.current = map;
        const onMoveEnd = () => {
          const c = map.getCenter();
          const lat = c.lat;
          const lng = c.lng;
          coordsRef.current = { lat, lng };
          setCoords({ lat, lng });
          scheduleReverse(lat, lng);
        };
        map.on("moveend", onMoveEnd);
        map.once("load", () => {
          if (!cancelled) {
            setMapReady(true);
            void applyReverse(start.lat, start.lng);
          }
          try {
            map.resize();
          } catch {
            /* ignore */
          }
        });
        teardown = () => {
          map.off("moveend", onMoveEnd);
          map.remove();
          mapboxRef.current = null;
        };
      } catch {
        if (!cancelled) setMapError("Could not start map.");
      }
      return () => {
        cancelled = true;
        teardown?.();
      };
    }

    (async () => {
      try {
        await loadGoogleMapsMapOnly();
      } catch {
        if (!cancelled) setMapError("Could not load Google Maps.");
        return;
      }
      if (cancelled || !containerRef.current || !window.google?.maps?.Map) {
        if (!cancelled) setMapError("Map unavailable.");
        return;
      }
      const map = new google.maps.Map(containerRef.current, {
        center: start,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      googleMapRef.current = map;
      const onIdle = () => {
        const c = map.getCenter();
        if (!c) return;
        const lat = c.lat();
        const lng = c.lng();
        coordsRef.current = { lat, lng };
        setCoords({ lat, lng });
        scheduleReverse(lat, lng);
      };
      map.addListener("idle", onIdle);
      if (!cancelled) {
        setMapReady(true);
        void applyReverse(start.lat, start.lng);
      }
      teardown = () => {
        google.maps.event.clearInstanceListeners(map);
        googleMapRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    };
  }, [applyReverse, scheduleReverse]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        moveTo(pos.coords.latitude, pos.coords.longitude, { reverse: true });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleConfirm = () => {
    const { lat, lng } = coordsRef.current;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    onConfirm({
      address: addressLine.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: city.trim(),
      state: stateName.trim(),
      zipCode: zipCode.trim(),
      coordinates: { lat, lng },
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Pin on map</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Move the map so the pin sits on your delivery location, then confirm.
        </p>
      </div>

      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            handleInputChange(e);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={hasAnyGeocoder ? "Search place to move pin…" : "Search unavailable"}
          disabled={!hasAnyGeocoder}
          className="h-10 rounded-xl border-slate-200 pl-10 dark:border-slate-700"
        />
        {showSuggestions && suggestions.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-40 overflow-auto rounded-xl border border-slate-200 bg-popover shadow-lg dark:border-slate-700">
            {suggestions.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  void selectSuggestion(s);
                }}
              >
                {s.place_name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative h-[240px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 sm:h-[280px]">
        {mapError ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
            {mapError}
          </div>
        ) : (
          <>
            <div ref={containerRef} className="h-full w-full" />
            {/* Center pin — map pans under it (same as app) */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="-mt-6 flex flex-col items-center">
                <MapPin className="h-9 w-9 fill-primary text-primary drop-shadow-md" strokeWidth={1.5} />
              </div>
            </div>
            {!mapReady ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/80">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : null}
          </>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 w-full rounded-xl"
        disabled={locating || Boolean(mapError)}
        onClick={useCurrentLocation}
      >
        {locating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Getting location…
          </>
        ) : (
          <>
            <Navigation className="mr-2 h-4 w-4" />
            Use current location
          </>
        )}
      </Button>

      <div
        className={cn(
          "rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/40",
          resolving && "opacity-70"
        )}
      >
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            {resolving ? (
              <p className="text-xs text-muted-foreground">Resolving address…</p>
            ) : (
              <>
                <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">
                  {addressLine || "Move the map to pick a location"}
                </p>
                {[city, stateName, zipCode].filter(Boolean).length > 0 ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[city, stateName, zipCode].filter(Boolean).join(", ")}
                  </p>
                ) : null}
                <p className="mt-1 text-[11px] text-slate-400">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          className="h-10 flex-1 rounded-xl"
          disabled={!addressLine.trim() || resolving || Boolean(mapError)}
          onClick={handleConfirm}
        >
          Confirm pin
        </Button>
        <Button type="button" variant="ghost" className="h-10" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
