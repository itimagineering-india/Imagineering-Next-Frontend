"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { loadGoogleMapsScript, getGoogleMapsApiKey } from "@/lib/mapConfig";

interface MapPreviewProps {
  location: {
    address: string;
    area: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  serviceRadius?: number;
}

export function MapPreview({ location, serviceRadius = 10 }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;

    const lat = location.coordinates?.lat;
    const lng = location.coordinates?.lng;
    const token = getGoogleMapsApiKey();
    if (!token || lat == null || lng == null || !containerRef.current) return;

    (async () => {
      try {
        await loadGoogleMapsScript();
      } catch {
        if (!cancelled) setSdkError("Could not load map");
        return;
      }
      if (cancelled || !containerRef.current || !window.google?.maps?.Map) {
        if (!cancelled) setSdkError("Map SDK unavailable");
        return;
      }
      try {
        const map = new google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 13,
          mapTypeControl: false,
        });
        const marker = new google.maps.Marker({
          map,
          position: { lat, lng },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        teardown = () => {
          marker.setMap(null);
        };
      } catch {
        setSdkError("Map init failed");
      }
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [location.coordinates?.lat, location.coordinates?.lng, serviceRadius]);

  const token = getGoogleMapsApiKey();
  const hasCoords = location.coordinates?.lat != null && location.coordinates?.lng != null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
          {!token && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map</p>
              </div>
            </div>
          )}
          {token && !hasCoords && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
              <div className="text-center space-y-2">
                <MapPin className="h-8 w-8 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Location coordinates not available</p>
              </div>
            </div>
          )}
          {token && hasCoords && (
            <>
              {sdkError && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/90 text-xs text-muted-foreground px-2 text-center">
                  {sdkError}
                </div>
              )}
              <div ref={containerRef} className="w-full h-full min-h-[200px]" />
            </>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{location.address}</p>
              <p className="text-sm text-muted-foreground">
                {location.area}, {location.city}
              </p>
            </div>
          </div>
          {serviceRadius > 0 && (
            <p className="text-sm text-muted-foreground">Service available within {serviceRadius} km radius</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
