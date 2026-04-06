import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";

interface PricingCardProps {
  name: string;
  /** Charged amount (after admin discount if any). */
  price: number;
  /** Optional MRP struck through when a discounted price applies. */
  listPriceStrikeThrough?: number;
  billing: string;
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  popular?: boolean;
  savingsBadge?: string;
  className?: string;
  subscriptionId?: string;
  subscriptionType?: "buyer" | "provider";
  onActivate?: () => void;
}

export function PricingCard({
  name,
  price,
  listPriceStrikeThrough,
  billing,
  description,
  features,
  limitations = [],
  cta,
  popular,
  savingsBadge,
  className,
  subscriptionId,
  subscriptionType,
  onActivate,
}: PricingCardProps) {
  const priceDisplay =
    price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`;

  const ctaButtonClass = cn(
    "w-full rounded-xl text-sm sm:text-base h-11 sm:h-12 font-semibold shadow-sm transition-colors",
    popular
      ? "bg-red-600 text-white hover:bg-red-700 border-0"
      : "bg-slate-900 text-white hover:bg-slate-800 border-0"
  );

  return (
    <Card
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300",
        popular
          ? "z-10 border-2 border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.06),0_20px_40px_-12px_rgba(15,23,42,0.18)] md:scale-[1.02]"
          : "border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300/90",
        className
      )}
    >
      <CardHeader
        className={cn(
          "text-center pb-2 pt-8 sm:pt-10",
          popular && "space-y-3 pt-6 sm:pt-8"
        )}
      >
        {popular ? (
          <div className="flex justify-center">
            <Badge className="border-0 bg-red-600 px-4 py-1 text-xs font-semibold text-white shadow-md hover:bg-red-600 sm:text-sm">
              Most Popular
            </Badge>
          </div>
        ) : null}
        <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {name}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
          {description}
        </p>
        <div className="mt-5 flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex flex-wrap items-baseline justify-center gap-x-1">
              <span className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {priceDisplay}
              </span>
              {price > 0 && (
                <span className="text-sm font-medium text-slate-500 sm:text-base">
                  {billing}
                </span>
              )}
            </div>
            {listPriceStrikeThrough != null &&
              listPriceStrikeThrough > 0 &&
              listPriceStrikeThrough !== price && (
                <span className="text-sm font-medium text-slate-400 line-through">
                  ₹{listPriceStrikeThrough.toLocaleString("en-IN")}
                </span>
              )}
          </div>
          {savingsBadge ? (
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-900">
              {savingsBadge}
            </span>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-5 pb-2 pt-0 sm:px-6">
        <ul className="space-y-2.5 sm:space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <Check
                className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-600 sm:h-5 sm:w-5"
                strokeWidth={2.5}
              />
              <span className="text-left text-xs leading-snug text-slate-700 sm:text-sm">
                {feature}
              </span>
            </li>
          ))}
          {limitations.map((limitation) => (
            <li
              key={limitation}
              className="flex items-start gap-2.5 text-slate-500"
            >
              <X className="mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-400 sm:h-5 sm:w-5" />
              <span className="text-left text-xs leading-snug sm:text-sm">
                {limitation}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="mt-auto px-5 pb-6 pt-4 sm:px-6">
        {subscriptionId && subscriptionType && price > 0 ? (
          <RazorpayCheckout
            subscriptionId={subscriptionId}
            subscriptionType={subscriptionType}
            amount={price}
            subscriptionName={name}
            onSuccess={() => {
              onActivate?.();
            }}
            className={ctaButtonClass}
            variant="default"
          >
            {cta}
          </RazorpayCheckout>
        ) : (
          <Button
            className={ctaButtonClass}
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
