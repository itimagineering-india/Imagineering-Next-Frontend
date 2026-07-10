"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Sparkles, Store, Tag } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export type ProviderOfferItem = {
  id: string;
  source: "provider" | "admin" | "coupon";
  title: string;
  description?: string;
  bannerImageUrl?: string;
  validFrom?: string;
  validTo?: string;
  couponCode?: string;
  discountLabel?: string;
  minOrderValue?: number;
};

function formatDateRange(validFrom?: string, validTo?: string): string | null {
  const fmt = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  const from = fmt(validFrom);
  const to = fmt(validTo);
  if (from && to) return `Valid ${from} – ${to}`;
  if (to) return `Valid till ${to}`;
  if (from) return `Starts ${from}`;
  return null;
}

function sourceLabel(source: ProviderOfferItem["source"]): string {
  if (source === "admin") return "Imagineering India";
  if (source === "coupon") return "Coupon";
  return "Provider";
}

function sourceBadgeClass(source: ProviderOfferItem["source"]): string {
  if (source === "admin") return "bg-violet-50 text-violet-700 border-violet-200";
  if (source === "coupon") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

type ProviderOffersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId?: string | null;
  serviceId?: string | null;
  providerName?: string;
};

export function ProviderOffersModal({
  open,
  onOpenChange,
  providerId,
  serviceId,
  providerName,
}: ProviderOffersModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<ProviderOfferItem[]>([]);

  useEffect(() => {
    if (!open || !providerId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.providers
      .getOffers(providerId, serviceId || undefined)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.offers) {
          setOffers(res.data.offers);
        } else {
          setOffers([]);
          setError(res.error?.message || "Could not load offers.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffers([]);
          setError("Could not load offers right now.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, providerId, serviceId]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Copied", description: code });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88vh,720px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            {providerName ? `Offers from ${providerName}` : "Available offers"}
          </DialogTitle>
          <DialogDescription>
            Promotions from the provider, Imagineering India, and applicable coupon codes.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-4">{error}</p>
        ) : offers.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <Store className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No active offers right now.</p>
            <p className="text-xs text-muted-foreground">Check back later or contact the supplier for a quote.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {offers.map((offer) => {
              const validity = formatDateRange(offer.validFrom, offer.validTo);
              return (
                <li
                  key={offer.id}
                  className="rounded-xl border bg-card overflow-hidden shadow-sm"
                >
                  {offer.bannerImageUrl ? (
                    <div className="aspect-[3/1] min-h-[88px] bg-muted border-b">
                      <img
                        src={offer.bannerImageUrl}
                        alt={offer.title}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  ) : null}
                  <div className="p-3 sm:p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Badge variant="outline" className={sourceBadgeClass(offer.source)}>
                        {sourceLabel(offer.source)}
                      </Badge>
                      {offer.discountLabel ? (
                        <span className="text-sm font-semibold text-primary">{offer.discountLabel}</span>
                      ) : null}
                    </div>
                    <p className="font-semibold text-foreground leading-snug">{offer.title}</p>
                    {offer.description && offer.description !== offer.title ? (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {offer.description}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {validity ? <span>{validity}</span> : null}
                      {typeof offer.minOrderValue === "number" && offer.minOrderValue > 0 ? (
                        <span>Min. order ₹{offer.minOrderValue.toLocaleString("en-IN")}</span>
                      ) : null}
                    </div>
                    {offer.couponCode ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant="secondary" className="font-mono text-xs font-semibold tracking-wide gap-1">
                          <Tag className="h-3 w-3" />
                          {offer.couponCode}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => void handleCopy(offer.couponCode!)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy code
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
