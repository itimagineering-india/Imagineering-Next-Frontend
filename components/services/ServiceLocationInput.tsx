import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Clock, X } from "lucide-react";
import { usePlacesAutocomplete } from "@/hooks/usePlacesAutocomplete";

interface Location {
  address: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type ProviderBusinessAddressSnapshot = {
  address: string;
  city: string;
  state: string;
  coordinates?: { lat: number; lng: number };
};

function normLocPart(s: string | undefined) {
  return String(s ?? "").trim().toLowerCase();
}

function hasUsableBusinessAddress(biz: ProviderBusinessAddressSnapshot | null | undefined): boolean {
  if (!biz) return false;
  return !!(normLocPart(biz.address) || normLocPart(biz.city) || normLocPart(biz.state));
}

function locationMatchesBusiness(loc: Location, biz: ProviderBusinessAddressSnapshot): boolean {
  if (!hasUsableBusinessAddress(biz)) return false;
  return (
    normLocPart(loc.address) === normLocPart(biz.address) &&
    normLocPart(loc.city) === normLocPart(biz.city) &&
    normLocPart(loc.state) === normLocPart(biz.state)
  );
}

interface ServiceLocationInputProps {
  location: Location;
  onLocationChange: (location: Location) => void;
  onClear: () => void;
  isGettingLocation: boolean;
  onGettingLocationChange: (value: boolean) => void;
  providerBusinessAddress?: ProviderBusinessAddressSnapshot | null | undefined;
}

export function ServiceLocationInput({
  location,
  onLocationChange,
  onClear,
  isGettingLocation,
  onGettingLocationChange,
  providerBusinessAddress,
}: ServiceLocationInputProps) {
  const matchesBusiness = useMemo(
    () =>
      !!providerBusinessAddress && locationMatchesBusiness(location, providerBusinessAddress),
    [location, providerBusinessAddress]
  );

  const applyProviderBusinessAddress = () => {
    if (!providerBusinessAddress || !hasUsableBusinessAddress(providerBusinessAddress)) return;
    const lat = Number(providerBusinessAddress.coordinates?.lat);
    const lng = Number(providerBusinessAddress.coordinates?.lng);
    onLocationChange({
      address: String(providerBusinessAddress.address || "").trim(),
      city: String(providerBusinessAddress.city || "").trim(),
      state: String(providerBusinessAddress.state || "").trim(),
      coordinates:
        Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
          ? { lat, lng }
          : undefined,
    });
    onGettingLocationChange(false);
  };

  const { inputRef, isLoaded: isLocationLoaded, getCurrentLocation } = usePlacesAutocomplete({
    onPlaceSelect: (place) => {
      let city = '';
      let state = '';
      
      const addressParts = place.formatted_address.split(',');
      if (addressParts.length >= 2) {
        city = addressParts[addressParts.length - 3]?.trim() || '';
        state = addressParts[addressParts.length - 2]?.trim() || '';
      }
      
      let lat = 0;
      let lng = 0;
      if (place.geometry?.location) {
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
      }
      
      onLocationChange({
        address: place.formatted_address,
        city: city,
        state: state,
        coordinates: {
          lat: lat,
          lng: lng,
        },
      });
    },
    onError: (error) => {
      console.error("Location error:", error);
      onGettingLocationChange(false);
    },
  });

  const handleGetCurrentLocation = () => {
    onGettingLocationChange(true);
    getCurrentLocation();
    setTimeout(() => onGettingLocationChange(false), 2000);
  };

  const handleClear = () => {
    // Clear the input field value
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    // Call the onClear callback to clear location state
    onClear();
  };

  const businessAddressReady = providerBusinessAddress !== undefined;
  const showBusinessAddressOption = hasUsableBusinessAddress(providerBusinessAddress);

  return (
    <div className="space-y-4">
      <Label>Service Location (Optional)</Label>

      {businessAddressReady && showBusinessAddressOption && (
        <div className="flex items-start gap-3 rounded-lg border bg-muted/25 p-3">
          <Checkbox
            id="service-location-same-as-business"
            checked={matchesBusiness}
            onCheckedChange={(v) => {
              if (v === true) applyProviderBusinessAddress();
              else handleClear();
            }}
            className="mt-0.5"
          />
          <div className="min-w-0 space-y-1">
            <label htmlFor="service-location-same-as-business" className="text-sm font-medium leading-snug cursor-pointer">
              Same as my business address
            </label>
            <p className="text-xs text-muted-foreground leading-snug">
              When this service is offered from the same place as your Business Profile, tick this to copy that
              address. Untick to clear the listing location.
            </p>
          </div>
        </div>
      )}
      {businessAddressReady && !showBusinessAddressOption && (
        <p className="text-xs text-muted-foreground rounded-md border border-dashed bg-muted/20 px-3 py-2">
          Save a business address on your Business Profile to enable “Same as my business address” here.
        </p>
      )}

      {/* Address Search with Autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="location-search" className="text-sm">Search Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            id="location-search"
            ref={inputRef}
            type="text"
            placeholder="Enter address or location..."
            className="pl-10"
            disabled={!isLocationLoaded}
          />
          {!isLocationLoaded && (
            <p className="text-xs text-muted-foreground mt-1">
              Loading location services...
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={!isLocationLoaded || isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Use Current Location
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Location Details */}
      {(location.address || location.city || location.state) && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
          <Label className="text-sm">Selected Location</Label>
          <div className="space-y-1 text-sm">
            {location.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{location.address}</span>
              </div>
            )}
            {(location.city || location.state) && (
              <div className="text-muted-foreground">
                {location.city && `${location.city}`}
                {location.city && location.state && ", "}
                {location.state && `${location.state}`}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="mt-2"
          >
            <X className="h-3 w-3 mr-2" />
            Clear Location
          </Button>
        </div>
      )}

      {/* Manual Entry (Optional) */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Or Enter Manually</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={location.city}
              onChange={(e) => onLocationChange({ ...location, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm">State</Label>
            <Input
              id="state"
              placeholder="State"
              value={location.state}
              onChange={(e) => onLocationChange({ ...location, state: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

