"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  catalogAxisOptionValues,
  catalogVariantLabel,
  defaultVariantSelection,
  findCatalogVariant,
  hasProviderVariantLimits,
  listProviderSellableVariants,
  readCatalogVariants,
  resolveCatalogProductId,
  resolveProviderAxisSelection,
  selectionAfterAxisChange,
  type CatalogVariant,
} from "@/lib/catalogVariants";

/** Result after the buyer picks a catalog variant (provider storefront or B2B hub). */
export type QuoteVariantPickResult = {
  serviceId?: string;
  catalogProductId: string;
  catalogVariantId: string;
  variantLabel: string;
  title: string;
  priceType?: string;
};

export type QuoteVariantPickerTarget = {
  /** Linked provider listing, when known (provider profile). */
  serviceId?: string;
  title: string;
  priceType?: string;
  /** Admin catalog product id — required to load axes/variants. */
  catalogProductId: string;
  /** Provider listing metadata (axis limits / enabled SKUs). Optional for B2B hub. */
  metadata?: Record<string, unknown> | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: QuoteVariantPickerTarget | null;
  onConfirm: (result: QuoteVariantPickResult) => void;
  /** When catalog has no variants, call onConfirm without opening pickers. */
  onPlainConfirm?: (result: Omit<QuoteVariantPickResult, "catalogVariantId" | "variantLabel">) => void;
};

export function QuoteVariantPickerModal({
  open,
  onOpenChange,
  target,
  onConfirm,
  onPlainConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [variantSel, setVariantSel] = useState<Record<string, string>>({});
  const plainConfirmedRef = useRef(false);

  const catalogId = String(target?.catalogProductId || "").trim();
  const serviceId = String(target?.serviceId || "").trim() || undefined;

  useEffect(() => {
    if (!open) {
      plainConfirmedRef.current = false;
      setProduct(null);
      setVariantSel({});
      setError(null);
      return;
    }
    if (!catalogId) {
      setError("This product has no catalog options.");
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
        const productRow = raw && typeof raw === "object" ? raw : null;
        setProduct(productRow);
        const parsed = readCatalogVariants(productRow || undefined);
        if (!parsed.hasVariants) {
          if (!plainConfirmedRef.current) {
            plainConfirmedRef.current = true;
            const plain = {
              serviceId,
              catalogProductId: catalogId,
              title: String(target?.title || "Product"),
              priceType: target?.priceType || undefined,
            };
            if (onPlainConfirm) onPlainConfirm(plain);
            else
              onConfirm({
                ...plain,
                catalogVariantId: "",
                variantLabel: "",
              });
            onOpenChange(false);
          }
          return;
        }
        const defaults = defaultVariantSelection(parsed.variantAxes, parsed.variants);
        const preferred: Record<string, string> = { ...defaults };
        if (hasProviderVariantLimits(target?.metadata)) {
          const axesSel = resolveProviderAxisSelection(
            productRow as never,
            target?.metadata || null,
          );
          for (const axis of parsed.variantAxes) {
            const allowed = axesSel[axis.key] || [];
            if (allowed.length && !allowed.includes(preferred[axis.key] || "")) {
              preferred[axis.key] = allowed[0];
            }
          }
        }
        setVariantSel(preferred);
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
  }, [open, catalogId, target?.metadata, target?.title, target?.priceType, serviceId, onConfirm, onPlainConfirm, onOpenChange]);

  const catalogVariants = useMemo(
    () => readCatalogVariants(product || undefined),
    [product],
  );

  const applyProviderLimits = Boolean(hasProviderVariantLimits(target?.metadata));

  const providerAxisSel = useMemo(() => {
    if (!product || !applyProviderLimits) return {};
    return resolveProviderAxisSelection(product as never, target?.metadata || null);
  }, [product, target?.metadata, applyProviderLimits]);

  const sellableVariants = useMemo(() => {
    if (!product || !catalogVariants.hasVariants) return [] as CatalogVariant[];
    const active = catalogVariants.variants.filter((v) => v.isActive !== false);
    if (!applyProviderLimits) return active;
    const limited = listProviderSellableVariants(product as never, providerAxisSel);
    return limited.length ? limited : active;
  }, [product, catalogVariants, providerAxisSel, applyProviderLimits]);

  const selectedVariant = useMemo(() => {
    if (!catalogVariants.hasVariants) return undefined;
    const pool = sellableVariants.length ? sellableVariants : catalogVariants.variants;
    return findCatalogVariant(pool, variantSel, catalogVariants.variantAxes);
  }, [catalogVariants, variantSel, sellableVariants]);

  const allAxesFilled = useMemo(
    () =>
      catalogVariants.variantAxes.length > 0 &&
      catalogVariants.variantAxes.every((a) => String(variantSel[a.key] || "").trim()),
    [catalogVariants.variantAxes, variantSel],
  );

  // Heal invalid / stale picks so Add to quote stays enabled for real SKUs.
  useEffect(() => {
    if (!open || loading || !catalogVariants.hasVariants) return;
    const axes = catalogVariants.variantAxes;
    const pool = sellableVariants.length ? sellableVariants : catalogVariants.variants;
    if (!pool.length) return;
    if (findCatalogVariant(pool, variantSel, axes)) return;

    let next = { ...variantSel };
    for (const axis of axes) {
      const opts = catalogAxisOptionValues(axis, pool, axes, next);
      const cur = String(next[axis.key] || "").trim();
      if (opts.length && !opts.includes(cur)) {
        next = selectionAfterAxisChange(axes, pool, next, axis.key, opts[0]);
      }
    }
    if (!findCatalogVariant(pool, next, axes)) {
      next = defaultVariantSelection(axes, pool);
    }
    const same = axes.every(
      (a) => String(next[a.key] || "").trim() === String(variantSel[a.key] || "").trim(),
    );
    if (!same) setVariantSel(next);
  }, [
    open,
    loading,
    catalogVariants.hasVariants,
    catalogVariants.variantAxes,
    catalogVariants.variants,
    sellableVariants,
    variantSel,
  ]);

  const handleConfirm = useCallback(() => {
    if (!catalogId || !selectedVariant) return;
    const label = catalogVariantLabel(selectedVariant, catalogVariants.variantAxes);
    onConfirm({
      serviceId,
      catalogProductId: catalogId,
      catalogVariantId: selectedVariant.id,
      variantLabel: label,
      title: label
        ? `${String(target?.title || "Product")} · ${label}`
        : String(target?.title || "Product"),
      priceType:
        selectedVariant.suggestedPriceType || target?.priceType || undefined,
    });
    onOpenChange(false);
  }, [
    catalogId,
    selectedVariant,
    catalogVariants.variantAxes,
    onConfirm,
    serviceId,
    target?.title,
    target?.priceType,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select variant</DialogTitle>
          <DialogDescription>
            Choose size / specification for{" "}
            <span className="font-medium text-foreground">
              {target?.title || "this product"}
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
              const pool = sellableVariants.length ? sellableVariants : catalogVariants.variants;
              const allValues = catalogAxisOptionValues(
                axis,
                pool,
                catalogVariants.variantAxes,
                variantSel,
              );
              // Provider limits already shrink `pool` when present; don't hide axes
              // when saved axis labels no longer match active SKUs.
              const allowed = applyProviderLimits ? providerAxisSel[axis.key] || [] : [];
              const filtered =
                allowed.length > 0 ? allValues.filter((v) => allowed.includes(v)) : allValues;
              const values = filtered.length > 0 ? filtered : allValues;
              if (!values.length) return null;
              const selectValue = values.includes(variantSel[axis.key] || "")
                ? variantSel[axis.key]
                : values[0] || "";
              return (
                <label key={axis.key} className="space-y-1 text-sm">
                  <span className="font-medium text-foreground">{axis.label}</span>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={selectValue}
                    onChange={(e) =>
                      setVariantSel((prev) =>
                        selectionAfterAxisChange(
                          catalogVariants.variantAxes,
                          pool,
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
                {allAxesFilled
                  ? "This combination isn’t available. Change one option to continue."
                  : sellableVariants.length === 0
                    ? "No sellable sizes for this listing. Ask the seller to update options."
                    : "Select a full combination to continue."}
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

/** @deprecated Prefer QuoteVariantPickerModal — kept for existing provider-profile imports. */
export function ProviderQuoteVariantModal({
  open,
  onOpenChange,
  service,
  onConfirm,
}: {
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
  onConfirm: (line: {
    serviceId: string;
    title: string;
    quantity: number;
    priceType?: string;
    catalogProductId?: string;
    catalogVariantId?: string;
    variantLabel?: string;
  }) => void;
}) {
  const target = useMemo((): QuoteVariantPickerTarget | null => {
    if (!service) return null;
    const catalogProductId = resolveCatalogProductId(service);
    if (!catalogProductId) return null;
    return {
      serviceId: String(service._id || service.id || "").trim() || undefined,
      title: service.title,
      priceType: service.priceType,
      catalogProductId,
      metadata: service.metadata,
    };
  }, [service]);

  return (
    <QuoteVariantPickerModal
      open={open}
      onOpenChange={onOpenChange}
      target={target}
      onConfirm={(result) => {
        const sid = result.serviceId || String(service?._id || service?.id || "").trim();
        if (!sid) return;
        onConfirm({
          serviceId: sid,
          title: result.title,
          quantity: 1,
          priceType: result.priceType,
          catalogProductId: result.catalogProductId,
          catalogVariantId: result.catalogVariantId || undefined,
          variantLabel: result.variantLabel || undefined,
        });
      }}
      onPlainConfirm={(result) => {
        const sid = result.serviceId || String(service?._id || service?.id || "").trim();
        if (!sid) return;
        onConfirm({
          serviceId: sid,
          title: result.title,
          quantity: 1,
          priceType: result.priceType,
          catalogProductId: result.catalogProductId,
        });
      }}
    />
  );
}
