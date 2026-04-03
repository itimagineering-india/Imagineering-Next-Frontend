"use client";

import { useRef, useState, useCallback } from "react";
import { getMapboxAccessToken } from "@/lib/mapboxConfig";
import {
  type PlaceDetails,
  type AddressSuggestionFeature,
  parseAddressContext,
} from "./useGoogleGeocoder";

interface UseMapboxGeocoderOptions {
  enabled?: boolean;
  onPlaceSelect?: (place: PlaceDetails) => void;
  onError?: (error: string) => void;
  deferScriptLoad?: boolean;
}

async function fetchForwardSuggestions(query: string, token: string): Promise<AddressSuggestionFeature[]> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${encodeURIComponent(token)}&country=IN&limit=8&types=place,locality,neighborhood,address,poi`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  const features = data.features as Array<{
    id: string;
    place_name: string;
    center: [number, number];
    context?: Array<{ id: string; text: string }>;
  }>;
  return (features || []).map((f) => ({
    place_name: f.place_name,
    center: f.center,
    id: f.id,
    context: f.context,
  }));
}

async function reverseGeocode(lng: number, lat: number, token: string): Promise<string> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(token)}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const data = await res.json();
  const name = data.features?.[0]?.place_name;
  return typeof name === "string" && name.length > 0 ? name : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function reverseGeocodeCityApprox(
  lng: number,
  lat: number,
  token: string
): Promise<{ place_name: string; center: [number, number]; id: string } | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(token)}&types=place,locality&limit=5`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const features = data.features as Array<{
    id: string;
    place_name: string;
    center: [number, number];
    place_type?: string[];
  }>;
  if (!features?.length) return null;
  const prefer =
    features.find((f) => f.place_type?.includes("place")) ||
    features.find((f) => f.place_type?.includes("locality")) ||
    features[0];
  const c = prefer?.center;
  if (!prefer?.place_name || !Array.isArray(c) || c.length < 2) return null;
  return { place_name: prefer.place_name, center: c, id: prefer.id };
}

export function useMapboxGeocoder({
  enabled = true,
  onPlaceSelect,
  onError,
  deferScriptLoad = false,
}: UseMapboxGeocoderOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestionFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const token = getMapboxAccessToken();
  const canUse = enabled && Boolean(token);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (!canUse || value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const run = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void fetchForwardSuggestions(value, token)
            .then((list) => {
              setSuggestions(list);
              setShowSuggestions(list.length > 0);
            })
            .catch(() => {
              setSuggestions([]);
              setShowSuggestions(false);
            });
        }, 300);
      };

      if (deferScriptLoad) {
        setIsLoaded(true);
        run();
        return;
      }
      if (!isLoaded) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      run();
    },
    [canUse, isLoaded, deferScriptLoad, token]
  );

  const selectSuggestion = useCallback(
    async (s: AddressSuggestionFeature) => {
      if (!canUse || !s.id) return;
      const [lng, lat] = s.center;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        onError?.("Could not resolve place coordinates.");
        return;
      }
      const formatted = s.place_name;
      const { city, state } = parseAddressContext({ ...s, place_name: formatted });
      const placeData: PlaceDetails = {
        formatted_address: formatted,
        geometry: {
          location: {
            lat: () => lat,
            lng: () => lng,
          },
        },
        place_id: s.id,
        name: formatted,
        city: city || undefined,
        state: state || undefined,
      };
      setSelectedPlace(placeData);
      setSuggestions([]);
      setShowSuggestions(false);
      if (inputRef.current) inputRef.current.value = formatted;
      onPlaceSelect?.(placeData);
    },
    [canUse, onPlaceSelect, onError]
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onError?.("Geolocation is not supported by your browser.");
      return;
    }
    if (!canUse) {
      onError?.("Address search not configured. Set a Mapbox access token in your environment for Imagineering India.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const fallbackAddr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        let approx: { place_name: string; center: [number, number]; id: string } | null = null;
        try {
          approx = await reverseGeocodeCityApprox(longitude, latitude, token);
        } catch {
          approx = null;
        }
        let addr: string;
        let latUse = latitude;
        let lngUse = longitude;
        let placeId: string;
        if (approx) {
          addr = approx.place_name;
          lngUse = approx.center[0];
          latUse = approx.center[1];
          placeId = approx.id;
        } else {
          try {
            addr = await reverseGeocode(longitude, latitude, token);
          } catch {
            addr = fallbackAddr;
          }
          placeId = `rev-${latitude}-${longitude}`;
        }
        const feat: AddressSuggestionFeature = {
          place_name: addr,
          center: [lngUse, latUse],
          id: placeId,
        };
        const { city, state } = parseAddressContext(feat);
        const cityLine = (city || "").trim();
        const displayFormatted = cityLine || addr;
        const placeData: PlaceDetails = {
          formatted_address: displayFormatted,
          geometry: {
            location: {
              lat: () => latUse,
              lng: () => lngUse,
            },
          },
          place_id: feat.id!,
          name: displayFormatted,
          city: cityLine || undefined,
          state: state || undefined,
        };
        setSelectedPlace(placeData);
        setIsLoaded(true);
        if (inputRef.current) inputRef.current.value = displayFormatted;
        onPlaceSelect?.(placeData);
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
  }, [canUse, onPlaceSelect, onError, token]);

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
