"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getGoogleMapsApiKey, loadGoogleMapsScript } from "@/lib/mapConfig";

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
  city?: string;
  state?: string;
}

interface UseGoogleGeocoderOptions {
  onPlaceSelect?: (place: PlaceDetails) => void;
  onError?: (error: string) => void;
  /** Defer loading Maps JS until user types or uses current location (faster first paint on home). */
  deferScriptLoad?: boolean;
}

export interface AddressSuggestionFeature {
  place_name: string;
  center: [number, number];
  id?: string;
  context?: Array<{ id: string; text: string }>;
}

export function parseAddressContext(feature: AddressSuggestionFeature): { city: string; state: string } {
  const parts = feature.place_name.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      city: parts[parts.length - 3] || parts[1] || "",
      state: parts[parts.length - 2] || "",
    };
  }
  if (parts.length >= 2) {
    return { city: parts[0] || "", state: parts[1] || "" };
  }
  return { city: "", state: "" };
}

export const parseMapboxContext = parseAddressContext;
export type MapboxFeature = AddressSuggestionFeature;

export function useGoogleGeocoder({
  onPlaceSelect,
  onError,
  deferScriptLoad = false,
}: UseGoogleGeocoderOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestionFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);

  const apiKey = getGoogleMapsApiKey();
  const canUseGoogle = Boolean(apiKey);

  const ensureScriptLoaded = useCallback(async () => {
    if (!canUseGoogle) return;
    if (typeof window !== "undefined" && window.google?.maps?.places) {
      if (!placesServiceRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
      }
      setIsLoaded(true);
      return;
    }
    if (!loadPromiseRef.current) {
      loadPromiseRef.current = loadGoogleMapsScript()
        .then(() => {
          if (!window.google?.maps?.places) throw new Error("Places unavailable");
          placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
          setIsLoaded(true);
        })
        .catch(() => {
          loadPromiseRef.current = null;
          onError?.("Could not load Google Maps.");
          throw new Error("Maps load failed");
        });
    }
    await loadPromiseRef.current;
  }, [canUseGoogle, onError]);

  useEffect(() => {
    if (!canUseGoogle) {
      console.warn(
        "Google address search unavailable. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Maps JavaScript API + Places)."
      );
      return;
    }
    if (deferScriptLoad) return;
    let cancelled = false;
    loadGoogleMapsScript()
      .then(() => {
        if (cancelled || !window.google?.maps?.places) return;
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement("div"));
        setIsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) onError?.("Could not load Google Maps.");
      });
    return () => {
      cancelled = true;
    };
  }, [canUseGoogle, onError, deferScriptLoad]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.length < 2 || !canUseGoogle) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const runPredictions = () => {
        if (!window.google?.maps?.places) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          const service = new google.maps.places.AutocompleteService();
          service.getPlacePredictions(
            {
              input: value,
              componentRestrictions: { country: "in" },
            },
            (predictions, status) => {
              if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions?.length) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
              }
              const results: AddressSuggestionFeature[] = predictions.slice(0, 8).map((p) => ({
                place_name: p.description,
                center: [0, 0] as [number, number],
                id: p.place_id,
              }));
              setSuggestions(results);
              setShowSuggestions(results.length > 0);
            }
          );
        }, 300);
      };

      if (deferScriptLoad) {
        void ensureScriptLoaded()
          .then(runPredictions)
          .catch(() => {
            setSuggestions([]);
            setShowSuggestions(false);
          });
        return;
      }
      if (!isLoaded) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      runPredictions();
    },
    [canUseGoogle, isLoaded, deferScriptLoad, ensureScriptLoaded]
  );

  const selectSuggestion = useCallback(
    async (s: AddressSuggestionFeature) => {
      if (!canUseGoogle || !s.id) return;
      if (deferScriptLoad) {
        try {
          await ensureScriptLoaded();
        } catch {
          return;
        }
      }
      if (!placesServiceRef.current) return;
      const ps = placesServiceRef.current;
      ps.getDetails(
        {
          placeId: s.id,
          fields: ["geometry", "formatted_address", "name", "address_components"],
        },
        (place, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
            onError?.("Could not resolve place coordinates.");
            return;
          }
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const formatted = place.formatted_address || s.place_name;
          const { city, state } = parseAddressContext({ ...s, place_name: formatted });
          const placeData: PlaceDetails = {
            formatted_address: formatted,
            geometry: {
              location: {
                lat: () => lat,
                lng: () => lng,
              },
            },
            place_id: s.id!,
            name: place.name || formatted,
            city: city || undefined,
            state: state || undefined,
          };
          setSelectedPlace(placeData);
          setSuggestions([]);
          setShowSuggestions(false);
          if (inputRef.current) inputRef.current.value = formatted;
          onPlaceSelect?.(placeData);
        }
      );
    },
    [canUseGoogle, onPlaceSelect, onError, deferScriptLoad, ensureScriptLoaded]
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onError?.("Geolocation is not supported by your browser.");
      return;
    }
    if (!canUseGoogle) {
      onError?.("Address search not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Imagineering India.");
      return;
    }

    const startGeo = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (!window.google?.maps?.Geocoder) {
            onError?.("Google Maps Geocoder not available.");
            return;
          }
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            const addr =
              status === "OK" && results?.[0]?.formatted_address
                ? results[0].formatted_address
                : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            const feat: AddressSuggestionFeature = {
              place_name: addr,
              center: [longitude, latitude],
              id: `rev-${latitude}-${longitude}`,
            };
            const { city, state } = parseAddressContext(feat);
            const placeData: PlaceDetails = {
              formatted_address: addr,
              geometry: {
                location: {
                  lat: () => latitude,
                  lng: () => longitude,
                },
              },
              place_id: feat.id!,
              name: addr,
              city: city || undefined,
              state: state || undefined,
            };
            setSelectedPlace(placeData);
            if (inputRef.current) inputRef.current.value = addr;
            onPlaceSelect?.(placeData);
          });
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
    };

    if (deferScriptLoad) {
      void ensureScriptLoaded()
        .then(() => startGeo())
        .catch(() => {});
      return;
    }
    if (!isLoaded) {
      onError?.("Address search not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Imagineering India.");
      return;
    }
    startGeo();
  }, [canUseGoogle, isLoaded, onPlaceSelect, onError, deferScriptLoad, ensureScriptLoaded]);

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
