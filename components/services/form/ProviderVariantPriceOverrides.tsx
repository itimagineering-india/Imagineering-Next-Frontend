"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  catalogVariantLabel,
  listProviderSellableVariants,
  type ProviderAxisSelection,
  type ProviderVariantPrices,
} from "@/lib/catalogVariants";
import type { CatalogProductItem } from "@/lib/productCatalog";

type Props = {
  product: CatalogProductItem;
  selection: ProviderAxisSelection;
  prices: ProviderVariantPrices;
  onChange: (prices: ProviderVariantPrices) => void;
  /** Listing default exact price — shown as placeholder. */
  defaultPrice?: string;
  disabled?: boolean;
};

export function ProviderVariantPriceOverrides({
  product,
  selection,
  prices,
  onChange,
  defaultPrice,
  disabled,
}: Props) {
  const rows = useMemo(
    () => listProviderSellableVariants(product, selection),
    [product, selection],
  );
  const axes = product.variantAxes || [];
  const placeholder =
    defaultPrice && Number(defaultPrice) > 0 ? `Default ₹${defaultPrice}` : "Use default price";

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed p-3">
        <Label className="text-base">Variant prices (optional)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Select what you sell above, then set optional exact prices per size. Leave blank to use
          your listing default price.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <Label className="text-base">Variant prices (optional)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Default exact price applies to all sizes. Override only where the rate differs — buyers
          can add that size to cart at your price.
        </p>
      </div>
      <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
        {rows.map((variant) => {
          const label = catalogVariantLabel(variant, axes) || variant.id;
          const current = prices[variant.id];
          return (
            <li
              key={variant.id}
              className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{label}</p>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  disabled={disabled}
                  className="h-9 w-28"
                  placeholder={placeholder}
                  value={current != null && current > 0 ? String(current) : ""}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    const next = { ...prices };
                    if (!raw) {
                      delete next[variant.id];
                    } else {
                      const n = Number(raw);
                      if (Number.isFinite(n) && n > 0) next[variant.id] = n;
                      else delete next[variant.id];
                    }
                    onChange(next);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        {rows.length} sellable combination{rows.length === 1 ? "" : "s"} ·{" "}
        {Object.keys(prices).length} override{Object.keys(prices).length === 1 ? "" : "s"} set
      </p>
    </div>
  );
}
