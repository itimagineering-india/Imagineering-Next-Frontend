import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";

interface PricingCardProps {
  name: string;
  price: number;
  billing: string;
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  popular?: boolean;
  className?: string;
  // Payment integration props
  subscriptionId?: string;
  subscriptionType?: "buyer" | "provider";
  onActivate?: () => void;
}

export function PricingCard({
  name,
  price,
  billing,
  description,
  features,
  limitations = [],
  cta,
  popular,
  className,
  subscriptionId,
  subscriptionType,
  onActivate,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all duration-300 hover:shadow-lg",
        popular && "border-primary shadow-lg sm:scale-105 z-10",
        className
      )}
    >
      {popular && (
        <Badge className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 text-xs sm:text-sm">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold">{name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{description}</p>
        <div className="mt-3 sm:mt-4">
          <span className="text-3xl sm:text-4xl font-bold">
            {price === 0 ? "Free" : `₹${price}`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground ml-1 text-xs sm:text-sm">{billing}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 sm:p-6 pt-0">
        <ul className="space-y-2 sm:space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-success shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm">{feature}</span>
            </li>
          ))}
          {limitations.map((limitation) => (
            <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
              <X className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm">{limitation}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="p-4 sm:p-6 pt-0">
        {subscriptionId && subscriptionType && price > 0 ? (
          <RazorpayCheckout
            subscriptionId={subscriptionId}
            subscriptionType={subscriptionType}
            amount={price}
            subscriptionName={name}
            onSuccess={() => {
              onActivate?.();
            }}
            className="w-full text-sm sm:text-base h-10 sm:h-11"
          >
            {cta}
          </RazorpayCheckout>
        ) : (
          <Button
            className="w-full text-sm sm:text-base h-10 sm:h-11"
            variant={popular ? "default" : "outline"}
            size="lg"
            onClick={onActivate}
            disabled={price === 0 && !onActivate}
          >
            {cta}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
