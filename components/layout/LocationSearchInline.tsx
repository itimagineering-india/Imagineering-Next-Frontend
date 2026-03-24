"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { useGoogleGeocoder } from "@/hooks/useGoogleGeocoder";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LocationSearchInlineProps {
  onClose?: () => void;
  className?: string;
}

export function LocationSearchInline({ onClose, className = "" }: LocationSearchInlineProps) {
  const [locationInput, setLocationInput] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { setUserLocation } = useUserLocation();
  const { toast } = useToast();

  const {
    inputRef,
    isLoaded,
    getCurrentLocation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange,
  } = useGoogleGeocoder({
    onPlaceSelect: (place) => {
      setIsGettingLocation(false);
      if (place.geometry?.location) {
        const lat = typeof place.geometry.location.lat === "function" ? place.geometry.location.lat() : place.geometry.location.lat;
        const lng = typeof place.geometry.location.lng === "function" ? place.geometry.location.lng() : place.geometry.location.lng;
        setUserLocation({
          lat,
          lng,
          address: place.formatted_address,
          city: place.formatted_address?.split(",")[0]?.trim(),
          timestamp: Date.now(),
        });
        setLocationInput("");
        onClose?.();
      }
    },
    onError: (error) => {
      setIsGettingLocation(false);
      toast({
        title: "Location Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  const handleUseCurrentLocation = () => {
    if (!navigator?.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
      return;
    }
    setIsGettingLocation(true);
    getCurrentLocation();
  };

  return (
    <div className={cn("space-y-3 p-2", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={isLoaded ? "Search city or address..." : "Loading..."}
          value={locationInput}
          onChange={(e) => {
            setLocationInput(e.target.value);
            handleInputChange(e);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          disabled={!isLoaded}
          className="pl-9 h-9"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-[2147483647] max-h-48 overflow-auto">
            {suggestions.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => selectSuggestion(s)}
              >
                {s.place_name}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleUseCurrentLocation}
        disabled={isGettingLocation}
      >
        {isGettingLocation ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4 mr-2" />
        )}
        {isGettingLocation ? "Getting location..." : "Use my current location"}
      </Button>
    </div>
  );
}
