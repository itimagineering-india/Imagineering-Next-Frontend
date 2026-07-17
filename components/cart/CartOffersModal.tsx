"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api-client";
import { Tag, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type CartOfferCoupon = {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  interactionType?: string;
  endDate?: string;
};

function formatDiscount(c: CartOfferCoupon): string {
  if (c.discountType === "PERCENTAGE") {
    const cap =
      typeof c.maxDiscount === "number" && c.maxDiscount > 0
        ? ` · max ₹${c.maxDiscount.toLocaleString()}`
        : "";
    return `${c.discountValue}% off${cap}`;
  }
  return `₹${c.discountValue.toLocaleString()} off`;
}

function formatEnds(endDate?: string): string | null {
  if (!endDate) return null;
  const d = new Date(endDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type CartOffersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCode: (code: string) => void;
};

export function CartOffersModal({ open, onOpenChange, onSelectCode }: CartOffersModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<CartOfferCoupon[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.coupons
      .getActive({ limit: 30 })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data?.coupons) {
          setCoupons(res.data.coupons);
        } else {
          setError(res.error?.message || "Could not load offers.");
          setCoupons([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load offers. Sign in to see available coupons.");
          setCoupons([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleUseCode = (code: string) => {
    onSelectCode(code);
    onOpenChange(false);
    toast({
      title: "Coupon code added",
      description: `“${code}” is in the box — tap Apply when ready.`,
    });
  };

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
      <DialogContent className="max-h-[min(85vh,640px)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 shrink-0 text-primary" />
            Available offers
          </DialogTitle>
          <DialogDescription>
            Copy a code or tap Use — it fills the coupon field. Tap Apply to use it on your order.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No active offers right now.</p>
        ) : (
          <ul className="space-y-3">
            {coupons.map((c) => {
              const ends = formatEnds(c.endDate);
              return (
                <li
                  key={c.code}
                  className="rounded-lg border bg-card p-3 sm:p-4 space-y-2 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <Badge variant="secondary" className="font-mono text-xs font-semibold tracking-wide">
                      {c.code}
                    </Badge>
                    <span className="text-sm font-semibold text-primary">{formatDiscount(c)}</span>
                  </div>
                  {c.description ? (
                    <p className="text-xs text-muted-foreground leading-snug">{c.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {typeof c.minOrderValue === "number" && c.minOrderValue > 0 ? (
                      <span>Min. order ₹{c.minOrderValue.toLocaleString()}</span>
                    ) : null}
                    {ends ? <span>Valid till {ends}</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="button" size="sm" className="h-8" onClick={() => handleUseCode(c.code)}>
                      Use code
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => void handleCopy(c.code)}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Copy
                    </Button>
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
