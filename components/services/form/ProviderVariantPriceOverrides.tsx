"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  activeCatalogVariants,
  catalogVariantLabel,
  listProviderSellableVariants,
  type CatalogVariant,
  type ProviderAxisSelection,
  type ProviderVariantPrices,
} from "@/lib/catalogVariants";
import type { CatalogProductItem } from "@/lib/productCatalog";
import { cn } from "@/lib/utils";

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
  const axes = product.variantAxes || [];
  const rows = useMemo(
    () => activeCatalogVariants((product.variants || []) as CatalogVariant[]),
    [product],
  );
  const sellableIds = useMemo(
    () => new Set(listProviderSellableVariants(product, selection).map((v) => v.id)),
    [product, selection],
  );
  const placeholder =
    defaultPrice && Number(defaultPrice) > 0 ? `Default ₹${defaultPrice}` : "Use default price";

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed p-3">
        <Label className="text-base">Variant prices (optional)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          This product has no active catalog sizes yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <Label className="text-base">Variant prices (optional)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          All catalog sizes are listed. Default exact price applies unless you override. Sizes not
          enabled under What you sell stay inactive for buyers.
        </p>
      </div>
      <ul className="max-h-[28rem] divide-y overflow-y-auto rounded-md border">
        {rows.map((variant) => {
          const label = catalogVariantLabel(variant, axes) || variant.id;
          const current = prices[variant.id];
          const offered = sellableIds.has(variant.id);
          return (
            <li
              key={variant.id}
              className={cn(
                "flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",
                !offered && "bg-muted/30",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{label}</p>
                {!offered ? (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Not in What you sell — enable options above to offer this size
                  </p>
                ) : null}
              </div>
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
        {rows.length} catalog size{rows.length === 1 ? "" : "s"} · {sellableIds.size} offered ·{" "}
        {Object.keys(prices).length} override{Object.keys(prices).length === 1 ? "" : "s"} set
      </p>
    </div>
  );
}
