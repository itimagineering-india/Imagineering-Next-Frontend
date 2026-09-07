"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import type { QuoteModalLine } from "@/components/service-details/GetBestQuotesModal";
import {
  catalogAxisOptionValues,
  catalogVariantLabel,
  defaultVariantSelection,
  findCatalogVariant,
  listProviderSellableVariants,
  readCatalogVariants,
  resolveProviderAxisSelection,
  selectionAfterAxisChange,
  type CatalogVariant,
} from "@/lib/catalogVariants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    _id?: string;
    id?: string;
    title: string;
    priceType?: string;
    catalogProductId?: string;
    metadata?: Record<string, unknown> | null;
  } | null;
  onConfirm: (line: QuoteModalLine) => void;
};

export function ProviderQuoteVariantModal({
  open,
  onOpenChange,
  service,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [variantSel, setVariantSel] = useState<Record<string, string>>({});

  const serviceId = String(service?._id || service?.id || "").trim();
  const catalogId = String(service?.catalogProductId || "").trim();

  useEffect(() => {
    if (!open || !catalogId) {
      setProduct(null);
      setVariantSel({});
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.productCatalog
      .getById(catalogId)
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setError("Could not load product options.");
          setProduct(null);
          return;
        }
        const raw = ((res.data as { product?: Record<string, unknown> })?.product ||
          res.data) as Record<string, unknown>;
        setProduct(raw && typeof raw === "object" ? raw : null);
        const parsed = readCatalogVariants(raw);
        if (parsed.hasVariants) {
          const axesSel = resolveProviderAxisSelection(raw as never, service?.metadata || null);
          const defaults = defaultVariantSelection(parsed.variantAxes, parsed.variants);
          const preferred: Record<string, string> = { ...defaults };
          for (const axis of parsed.variantAxes) {
            const allowed = axesSel[axis.key] || [];
            if (allowed.length && !allowed.includes(preferred[axis.key] || "")) {
              preferred[axis.key] = allowed[0];
            }
          }
          setVariantSel(preferred);
        } else {
          setVariantSel({});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load product options.");
          setProduct(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, catalogId, service?.metadata]);

  const catalogVariants = useMemo(
    () => readCatalogVariants(product || undefined),
    [product],
  );

  const providerAxisSel = useMemo(
    () =>
      product
        ? resolveProviderAxisSelection(product as never, service?.metadata || null)
        : {},
    [product, service?.metadata],
  );

  const sellableVariants = useMemo(() => {
    if (!product || !catalogVariants.hasVariants) return [] as CatalogVariant[];
    return listProviderSellableVariants(product as never, providerAxisSel);
  }, [product, catalogVariants.hasVariants, providerAxisSel]);

  const selectedVariant = useMemo(() => {
    if (!catalogVariants.hasVariants) return undefined;
    const found = findCatalogVariant(
      catalogVariants.variants,
      variantSel,
      catalogVariants.variantAxes,
    );
    if (!found) return undefined;
    if (sellableVariants.length && !sellableVariants.some((v) => v.id === found.id)) {
      return undefined;
    }
    return found;
  }, [catalogVariants, variantSel, sellableVariants]);

  // If catalog loaded with no variants, auto-confirm plain line once.
  useEffect(() => {
    if (!open || loading || error || !product || !serviceId) return;
    if (catalogVariants.hasVariants) return;
    onConfirm({
      serviceId,
      title: String(service?.title || "Service"),
      quantity: 1,
      priceType: service?.priceType || undefined,
      catalogProductId: catalogId || undefined,
    });
    onOpenChange(false);
  }, [
    open,
    loading,
    error,
    product,
    catalogVariants.hasVariants,
    serviceId,
    service?.title,
    service?.priceType,
    catalogId,
    onConfirm,
    onOpenChange,
  ]);

  const handleConfirm = () => {
    if (!serviceId || !selectedVariant) return;
    const label = catalogVariantLabel(selectedVariant, catalogVariants.variantAxes);
    onConfirm({
      serviceId,
      title: label
        ? `${String(service?.title || "Service")} · ${label}`
        : String(service?.title || "Service"),
      quantity: 1,
      priceType:
        selectedVariant.suggestedPriceType || service?.priceType || undefined,
      catalogProductId: catalogId || undefined,
      catalogVariantId: selectedVariant.id,
      variantLabel: label || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select variant</DialogTitle>
          <DialogDescription>
            Choose size / specification for{" "}
            <span className="font-medium text-foreground">
              {service?.title || "this product"}
            </span>{" "}
            before adding to quote.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading options…
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-destructive">{error}</p>
        ) : catalogVariants.hasVariants ? (
          <div className="grid gap-3 py-2">
            {catalogVariants.variantAxes.map((axis) => {
              const allValues = catalogAxisOptionValues(axis, catalogVariants.variants);
              const allowed = providerAxisSel[axis.key] || [];
              const values = allowed.length
                ? allValues.filter((v) => allowed.includes(v))
                : allValues;
              if (!values.length) return null;
              return (
                <label key={axis.key} className="space-y-1 text-sm">
                  <span className="font-medium text-foreground">{axis.label}</span>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={variantSel[axis.key] || ""}
                    onChange={(e) =>
                      setVariantSel((prev) =>
                        selectionAfterAxisChange(
                          catalogVariants.variantAxes,
                          catalogVariants.variants,
                          prev,
                          axis.key,
                          e.target.value,
                        ),
                      )
                    }
                  >
                    {values.map((val) => (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
            {selectedVariant ? (
              <p className="text-xs text-muted-foreground">
                Selected:{" "}
                {catalogVariantLabel(selectedVariant, catalogVariants.variantAxes)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a full combination to continue.
              </p>
            )}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No variants required.</p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || Boolean(error) || !selectedVariant}
            onClick={handleConfirm}
          >
            Add to quote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
