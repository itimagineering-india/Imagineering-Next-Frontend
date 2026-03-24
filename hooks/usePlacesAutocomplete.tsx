"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface PlaceResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

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
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface UsePlacesAutocompleteOptions {
  onPlaceSelect?: (place: PlaceDetails) => void;
  onError?: (error: string) => void;
  apiKey?: string;
  /** Restrict suggestions, e.g. `{ country: "in" }` for India */
  componentRestrictions?: { country: string | string[] };
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: any) => {
            getPlace: () => any;
            addListener: (event: string, callback: () => void) => void;
          };
          PlacesService: new (element: HTMLElement) => {
            getDetails: (
              request: { placeId: string; fields?: string[] },
              callback: (place: any, status: string) => void
            ) => void;
          };
          PlacesServiceStatus: {
            OK: string;
          };
        };
        Geocoder: new () => {
          geocode: (
            request: { location: { lat: number; lng: number } },
            callback: (results: any[] | null, status: string) => void
          ) => void;
        };
        GeocoderStatus: {
          OK: string;
        };
      };
    };
  }
}

export function usePlacesAutocomplete({
  onPlaceSelect,
  onError,
  apiKey,
  componentRestrictions,
}: UsePlacesAutocompleteOptions = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const autocompleteRef = useRef<InstanceType<Window["google"]["maps"]["places"]["Autocomplete"]> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scriptLoadedRef = useRef(false);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  // Load Google Maps API script
  useEffect(() => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    if (scriptLoadedRef.current) {
      return;
    }

    // Get API key from environment variable or parameter
    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      console.warn(
        "Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file or pass it as a prop."
      );
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      scriptLoadedRef.current = true;
      // Poll for Google Maps API to load
      const interval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    // Load the script
    scriptLoadedRef.current = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Poll for Google Maps API to load
      const interval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          clearInterval(interval);
        }
      }, 100);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps API");
      scriptLoadedRef.current = false;
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  // Initialize autocomplete when API is loaded
  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    const inputEl = inputRef.current;
    type AutocompleteInstance = InstanceType<Window["google"]["maps"]["places"]["Autocomplete"]>;
    let autocomplete: AutocompleteInstance | null = null;

    try {
      autocomplete = new window.google.maps.places.Autocomplete(inputEl, {
        types: ["geocode", "establishment"],
        fields: ["place_id", "formatted_address", "geometry", "name"],
        ...(componentRestrictions ? { componentRestrictions } : {}),
      });

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete?.getPlace();

        if (place?.place_id) {
          // Get detailed place information
          const service = new window.google.maps.places.PlacesService(
            document.createElement("div")
          );

          service.getDetails(
            {
              placeId: place.place_id,
              fields: [
                "formatted_address",
                "geometry",
                "place_id",
                "name",
                "address_components",
              ],
            },
            (placeDetails, status) => {
              if (status === "OK" && placeDetails) {
                const comps = placeDetails.address_components;
                const placeData: PlaceDetails = {
                  formatted_address: placeDetails.formatted_address || "",
                  geometry: placeDetails.geometry,
                  place_id: placeDetails.place_id || "",
                  name: placeDetails.name,
                  address_components: comps
                    ? comps.map((c: { long_name: string; short_name: string; types: string[] }) => ({
                        long_name: c.long_name,
                        short_name: c.short_name,
                        types: c.types,
                      }))
                    : undefined,
                };

                setSelectedPlace(placeData);
                if (onPlaceSelectRef.current) {
                  onPlaceSelectRef.current(placeData);
                }
              }
            }
          );
        }
      });

      // Ensure Google suggestions dropdown is clickable and visible above overlays
      const fixDropdownStyles = () => {
        const pacContainer = document.querySelector(
          ".pac-container"
        ) as HTMLElement | null;
        if (pacContainer) {
          // Use a very high z-index so the suggestions are always above any dialog/overlay
          pacContainer.style.zIndex = "2147483647";
          pacContainer.style.pointerEvents = "auto";
          pacContainer.style.position = "absolute";
          
          // Make sure it's not blocked by any parent elements
          let parent = pacContainer.parentElement;
          while (parent) {
            if (parent.style) {
              parent.style.overflow = "visible";
            }
            parent = parent.parentElement;
          }
          
          const pacItems = pacContainer.querySelectorAll(
            ".pac-item"
          ) as NodeListOf<HTMLElement>;
          pacItems.forEach((item) => {
            item.style.pointerEvents = "auto";
            item.style.cursor = "pointer";
            // Ensure clicks work
            item.onmousedown = (e) => {
              e.stopPropagation();
            };
            item.onclick = (e) => {
              e.stopPropagation();
            };
          });
        }
      };

      // Use MutationObserver to watch for pac-container creation
      const observer = new MutationObserver(() => {
        fixDropdownStyles();
      });

      // Observe the document body for changes
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      const handleFocus = () => {
        setTimeout(fixDropdownStyles, 50);
        // Also try after a longer delay in case Google takes time to render
        setTimeout(fixDropdownStyles, 200);
        setTimeout(fixDropdownStyles, 500);
      };

      const handleInput = () => {
        setTimeout(fixDropdownStyles, 50);
        setTimeout(fixDropdownStyles, 200);
      };

      // Also fix on any click to ensure it's always updated
      const handleDocumentClick = () => {
        setTimeout(fixDropdownStyles, 10);
      };

      inputEl.addEventListener("focus", handleFocus);
      inputEl.addEventListener("input", handleInput);
      document.addEventListener("click", handleDocumentClick);

      return () => {
        inputEl.removeEventListener("focus", handleFocus);
        inputEl.removeEventListener("input", handleInput);
        document.removeEventListener("click", handleDocumentClick);
        observer.disconnect();
        if (autocompleteRef.current) {
          autocompleteRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error);
    }
  }, [isLoaded, componentRestrictions]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      const errorMsg = "Geolocation is not supported by your browser.";
      if (onError) {
        onError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    if (!isLoaded || !window.google || !window.google.maps) {
      console.error("Google Maps API is not loaded yet.");
      const errorMsg = "Location services are still loading. Please wait a moment and try again.";
      if (onError) {
        onError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Use Geocoding API to get address from coordinates
        try {
          const geocoder = new window.google.maps.Geocoder();
          const latlng = {
            lat: latitude,
            lng: longitude,
          };

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (
              status === "OK" &&
              results &&
              results[0]
            ) {
              const r0 = results[0];
              const comps = r0.address_components;
              const placeData: PlaceDetails = {
                formatted_address: r0.formatted_address,
                geometry: {
                  location: {
                    lat: () => latitude,
                    lng: () => longitude,
                  },
                },
                place_id: r0.place_id || "",
                name: r0.formatted_address,
                address_components: comps
                  ? comps.map((c: { long_name: string; short_name: string; types: string[] }) => ({
                      long_name: c.long_name,
                      short_name: c.short_name,
                      types: c.types,
                    }))
                  : undefined,
              };

              setSelectedPlace(placeData);
              if (inputRef.current) {
                inputRef.current.value = r0.formatted_address;
              }
              if (onPlaceSelectRef.current) {
                onPlaceSelectRef.current(placeData);
              }
            } else {
              console.error("Geocoding failed:", status);
              const errorMsg = "Failed to get address for your location. Please try again.";
              if (onError) {
                onError(errorMsg);
              } else {
                alert(errorMsg);
              }
            }
          });
        } catch (error) {
          console.error("Error initializing geocoder:", error);
          const errorMsg = "Error getting your location. Please try again.";
          if (onError) {
            onError(errorMsg);
          } else {
            alert(errorMsg);
          }
        }
      },
      (error) => {
        console.error("Error getting current location:", error);
        let errorMessage = "Unable to get your location. ";
        let helpfulTip = "";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access was denied.";
            helpfulTip = "Please enable location permissions in your browser settings and try again, or manually enter your location.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            helpfulTip = "This could be due to GPS being disabled, poor signal, or network issues. Please try entering your location manually.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            helpfulTip = "The location request took too long. Please try again or enter your location manually.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            helpfulTip = "Please try entering your location manually in the search field.";
            break;
        }
        
        const fullMessage = helpfulTip ? `${errorMessage} ${helpfulTip}` : errorMessage;
        
        if (onError) {
          onError(fullMessage);
        } else {
          console.warn(fullMessage);
          // Don't use alert - let the component handle it with toast
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onError, isLoaded]);

  return {
    inputRef,
    isLoaded,
    selectedPlace,
    getCurrentLocation,
  };
}

