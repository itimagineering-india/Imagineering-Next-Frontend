import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

type PriceType = "fixed" | "hourly" | "daily" | "per_minute" | "per_article" | "monthly" | "per_kg" | "per_litre" | "per_unit" | "metric_ton" | "per_sqft" | "per_sqm" | "per_load" | "per_trip";

interface PricingBoxProps {
  priceType: PriceType;
  price: number;
  minimumCharge?: number;
  extraCharges?: string;
}

export function PricingBox({
  priceType,
  price,
  minimumCharge,
  extraCharges,
}: PricingBoxProps) {
  const priceTypeLabels: Record<PriceType, string> = {
    fixed: "Fixed Price",
    hourly: "Per Hour",
    daily: "Per Day",
    per_minute: "Per Minute",
    per_article: "Per Article",
    monthly: "Per Month",
    per_kg: "Per KG",
    per_litre: "Per Litre",
    per_unit: "Per Unit",
    metric_ton: "Metric Ton",
    per_sqft: "Per Square Foot",
    per_sqm: "Per Square Meter",
    per_load: "Per Load",
    per_trip: "Per Trip",
  };

  const priceTypeSuffix: Record<PriceType, string> = {
    fixed: "",
    hourly: "/hour",
    daily: "/day",
    per_minute: "/min",
    per_article: "/article",
    monthly: "/month",
    per_kg: "/kg",
    per_litre: "/litre",
    per_unit: "/unit",
    metric_ton: "/metric ton",
    per_sqft: "/sqft",
    per_sqm: "/sqm",
    per_load: "/load",
    per_trip: "/trip",
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Pricing</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        {/* Price Type */}
        <div>
          <Badge variant="outline" className="mb-1.5 sm:mb-2 text-xs sm:text-sm">
            {priceTypeLabels[priceType]}
          </Badge>
          <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold">₹{price.toLocaleString()}</span>
            {priceTypeSuffix[priceType] && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                {priceTypeSuffix[priceType]}
              </span>
            )}
          </div>
        </div>

        {/* Minimum Charge */}
        {minimumCharge && (
          <div className="pt-2 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Minimum Charge
            </p>
            <p className="text-sm sm:text-base font-semibold">₹{minimumCharge.toLocaleString()}</p>
          </div>
        )}

        {/* Extra Charges */}
        {extraCharges && (
          <div className="pt-2 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Additional Charges
            </p>
            <p className="text-xs sm:text-sm break-words">{extraCharges}</p>
          </div>
        )}

        {/* Billing Note */}
        <div className="pt-3 sm:pt-4 border-t">
          <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-muted rounded-lg">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Billing handled by platform. Secure payment processing.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

