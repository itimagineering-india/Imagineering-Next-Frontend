"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Shield, Sparkles, Truck } from "lucide-react";
import api from "@/lib/api-client";
import { ImagineVerifiedBadge, type ImagineScoreData } from "@/components/trust/ImagineScorePanel";

export type SupplierMatchResult = {
  rank: number;
  serviceId: string;
  serviceTitle: string;
  serviceSlug?: string;
  providerUserId: string;
  providerName: string;
  providerSlug?: string;
  price: number;
  priceType: string;
  deliveryTime?: string;
  trustScore: number | null;
  imagineScore: number | null;
  distanceKm: number | null;
  isImagineeringVerified: boolean;
  utilityScore: number;
  explanation: string;
};

type RoutingResponse = {
  recommended: SupplierMatchResult | null;
  alternates: SupplierMatchResult[];
  meta?: {
    cityHealthScore?: number | null;
    urgency?: string;
  };
};

function formatPrice(price: number, priceType: string) {
  const unit = priceType === "per_bag" ? "/bag" : priceType === "fixed" ? "" : `/${priceType}`;
  return `₹${price.toLocaleString("en-IN")}${unit}`;
}

export function BestSupplierCard({
  serviceId,
  city,
  lat,
  lng,
  urgency = "flexible",
  className,
}: {
  serviceId: string;
  city?: string;
  lat?: number;
  lng?: number;
  urgency?: "today" | "tomorrow" | "flexible";
  className?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RoutingResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.routing.match({
          serviceId,
          location: { city, lat, lng },
          urgency,
        });
        if (!cancelled && res.success && res.data) {
          setData(res.data as RoutingResponse);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, city, lat, lng, urgency]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding best supplier match…
        </CardContent>
      </Card>
    );
  }

  const match = data?.recommended;
  if (!match) return null;

  const scoreStub: ImagineScoreData = {
    trustScore: match.trustScore,
    imagineScore: match.imagineScore,
    isImagineeringVerified: match.isImagineeringVerified,
    scoreVisible: match.trustScore != null,
    rank: "bronze",
  };

  const serviceHref = match.serviceSlug
    ? `/service/${match.serviceSlug}`
    : `/service/${match.serviceId}`;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Best match for you
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Imagineering AI
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{match.explanation}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{match.providerName}</p>
            <ImagineVerifiedBadge score={scoreStub} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{match.serviceTitle}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="font-medium">{formatPrice(match.price, match.priceType)}</span>
            {match.deliveryTime && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                {match.deliveryTime}
              </span>
            )}
            {match.trustScore != null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                Trust {Math.round(match.trustScore)}
              </span>
            )}
            {match.distanceKm != null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {match.distanceKm} km
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={serviceHref}>Order best match</Link>
          </Button>
          {(data?.alternates?.length ?? 0) > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href={serviceHref}>See alternatives</Link>
            </Button>
          )}
        </div>

        {data?.meta?.cityHealthScore != null && (
          <p className="text-[11px] text-muted-foreground">
            City marketplace health: {Math.round(data.meta.cityHealthScore)}/100
          </p>
        )}
      </CardContent>
    </Card>
  );
}
