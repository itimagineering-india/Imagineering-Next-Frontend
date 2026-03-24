"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  getMapplsAccessToken,
  MapplsAuthError,
  mapplsReverseGeocode,
  mapplsTextSearch,
  mapplsPlaceDetailsCoords,
  type MapplsSearchHit,
} from "@/lib/mapplsApi";

export interface PlaceDetails {
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  place_id: string;
  name?: string;
}

interface UseMapboxGeocoderOptions {
  onPlaceSelect?: (place: PlaceDetails) => void;
  onError?: (error: string) => void;
}

/** Location search via Mappls (MapmyIndia) — drop-in replacement for previous Mapbox hook. */
export function useMapboxGeocoder({
  onPlaceSelect,
  onError,
}: UseMapboxGeocoderOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [suggestions, setSuggestions] = useState<
    Array<{ place_name: string; center: [number, number]; id?: string; _hit?: MapplsSearchHit }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const authWarnedRef = useRef(false);

  const token = getMapplsAccessToken();

  useEffect(() => {
    if (token) setIsLoaded(true);
    else console.warn("Mappls token not found. Set NEXT_PUBLIC_MAPPLS_ACCESS_TOKEN in .env");
  }, [token]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (!token || value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const hits = await mapplsTextSearch(value, token);
          const mapped = hits.map((h) => ({
            place_name: h.place_name || h.placeAddress,
            center: [0, 0] as [number, number],
            id: h.eLoc,
            _hit: h,
          }));
          setSuggestions(mapped);
          setShowSuggestions(mapped.length > 0);
        } catch (err) {
          setSuggestions([]);
          setShowSuggestions(false);
          if (err instanceof MapplsAuthError && !authWarnedRef.current) {
            authWarnedRef.current = true;
            onError?.(err.message);
          }
        }
      }, 300);
    },
    [token, onError]
  );

  const selectSuggestion = useCallback(
    async (s: { place_name: string; center: [number, number]; id?: string; _hit?: MapplsSearchHit }) => {
      if (!token) return;
      const eLoc = s.id || s._hit?.eLoc;
      if (!eLoc) return;
      try {
        const coords = await mapplsPlaceDetailsCoords(eLoc, token);
        if (!coords) {
          onError?.("Could not resolve location. Try another suggestion.");
          return;
        }
        const lat = coords.lat;
        const lng = coords.lng;
        const label = s.place_name || coords.formatted || eLoc;
        const placeData: PlaceDetails = {
          formatted_address: label,
          geometry: {
            location: {
              lat: () => lat,
              lng: () => lng,
            },
          },
          place_id: `mappls-${eLoc}`,
          name: label,
        };
        setSelectedPlace(placeData);
        setSuggestions([]);
        setShowSuggestions(false);
        if (inputRef.current) inputRef.current.value = label;
        onPlaceSelect?.(placeData);
      } catch {
        onError?.("Failed to load place details.");
      }
    },
    [token, onPlaceSelect, onError]
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onError?.("Geolocation is not supported by your browser.");
      return;
    }
    if (!token) {
      onError?.("Mappls not configured. Set NEXT_PUBLIC_MAPPLS_ACCESS_TOKEN.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await mapplsReverseGeocode(latitude, longitude, token);
          if (address) {
            const placeData: PlaceDetails = {
              formatted_address: address,
              geometry: {
                location: {
                  lat: () => latitude,
                  lng: () => longitude,
                },
              },
              place_id: `mappls-${latitude}-${longitude}`,
              name: address,
            };
            setSelectedPlace(placeData);
            if (inputRef.current) inputRef.current.value = address;
            onPlaceSelect?.(placeData);
          } else {
            const placeData: PlaceDetails = {
              formatted_address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
              geometry: {
                location: {
                  lat: () => latitude,
                  lng: () => longitude,
                },
              },
              place_id: `mappls-${latitude}-${longitude}`,
            };
            setSelectedPlace(placeData);
            if (inputRef.current) inputRef.current.value = placeData.formatted_address;
            onPlaceSelect?.(placeData);
          }
        } catch (err) {
          if (err instanceof MapplsAuthError) {
            if (!authWarnedRef.current) {
              authWarnedRef.current = true;
              onError?.(err.message);
            }
            return;
          }
          onError?.("Error getting your location. Please try again.");
        }
      },
      (error) => {
        let msg = "Unable to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg += "Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            msg += "Location request timed out.";
            break;
        }
        onError?.(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [token, onPlaceSelect, onError]);

  return {
    inputRef,
    isLoaded,
    selectedPlace,
    getCurrentLocation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange,
    dropdownRef,
  };
}
