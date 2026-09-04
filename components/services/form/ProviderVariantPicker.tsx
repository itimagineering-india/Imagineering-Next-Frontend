"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CatalogProductItem } from "@/lib/productCatalog";

export type ProviderVariantRow = {
  id: string;
  enabled: boolean;
  priceMin: string;
  priceMax: string;
};

export function defaultProviderVariantRows(product: CatalogProductItem): ProviderVariantRow[] {
  return (product.variants || [])
    .filter((v) => v.isActive !== false && v.id)
    .map((v) => ({
      id: v.id,
      enabled: true,
      priceMin: v.suggestedPriceMin != null ? String(v.suggestedPriceMin) : "",
      priceMax: v.suggestedPriceMax != null ? String(v.suggestedPriceMax) : "",
    }));
}

type Props = {
  product: CatalogProductItem;
  rows: ProviderVariantRow[];
  onChange: (rows: ProviderVariantRow[]) => void;
  error?: string;
};

function variantLabel(
  product: CatalogProductItem,
  variantId: string,
): string {
  const variant = product.variants?.find((v) => v.id === variantId);
  const label = product.variantAxes
    ?.map((axis) => variant?.attributes?.[axis.key])
    .filter(Boolean)
    .join(" · ");
  return label || variantId;
}

export function ProviderVariantPicker({ product, rows, onChange, error }: Props) {
  const axes = product.variantAxes || [];
  const [filters, setFilters] = useState<Record<string, string>>({});

  const axisOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const axis of axes) {
      const seen = new Set<string>();
      const opts: string[] = [];
      for (const opt of axis.options || []) {
        const v = String(opt || "").trim();
        if (!v || seen.has(v)) continue;
        seen.add(v);
        opts.push(v);
      }
      for (const variant of product.variants || []) {
        if (variant.isActive === false) continue;
        const v = String(variant.attributes?.[axis.key] || "").trim();
        if (!v || seen.has(v)) continue;
        seen.add(v);
        opts.push(v);
      }
      map[axis.key] = opts;
    }
    return map;
  }, [axes, product.variants]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const variant = product.variants?.find((v) => v.id === row.id);
      if (!variant) return false;
      return axes.every((axis) => {
        const want = filters[axis.key];
        if (!want) return true;
        return variant.attributes?.[axis.key] === want;
      });
    });
  }, [axes, filters, product.variants, rows]);

  const enabledCount = rows.filter((r) => r.enabled).length;
  const filteredIds = useMemo(() => new Set(filteredRows.map((r) => r.id)), [filteredRows]);

  const setEnabledForIds = (ids: Set<string>, enabled: boolean) => {
    onChange(rows.map((r) => (ids.has(r.id) ? { ...r, enabled } : r)));
  };

  const updateRow = (id: string, patch: Partial<ProviderVariantRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  if (!rows.length) return null;

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <Label className="text-base">Variants you sell</Label>
          <p className="text-xs text-muted-foreground">
            {enabledCount} of {rows.length} variants enabled
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEnabledForIds(filteredIds, true)}
            disabled={!filteredIds.size}
          >
            Enable matching
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEnabledForIds(filteredIds, false)}
            disabled={!filteredIds.size}
          >
            Disable matching
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(rows.map((r) => ({ ...r, enabled: true })))}
          >
            Enable all
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange(rows.map((r) => ({ ...r, enabled: false })))}
          >
            Disable all
          </Button>
        </div>
      </div>

      {axes.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {axes.map((axis) => (
            <label key={axis.key} className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">{axis.label}</span>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={filters[axis.key] || ""}
                onChange={(e) =>
                  setFilters((prev) => {
                    const next = { ...prev };
                    if (e.target.value) next[axis.key] = e.target.value;
                    else delete next[axis.key];
                    return next;
                  })
                }
              >
                <option value="">All {axis.label.toLowerCase()}s</option>
                {(axisOptions[axis.key] || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Showing {filteredRows.length} of {rows.length}
        {Object.keys(filters).length ? " (filtered)" : ""}
      </p>

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-2">
        {filteredRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No variants match these filters.
          </p>
        ) : (
          filteredRows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-1 items-center gap-2 rounded-md border bg-background p-2 text-sm sm:grid-cols-4"
            >
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateRow(row.id, { enabled: e.target.checked })}
                />
                <span className="leading-snug">{variantLabel(product, row.id)}</span>
              </label>
              <Input
                placeholder="Min ₹"
                value={row.priceMin}
                disabled={!row.enabled}
                onChange={(e) => updateRow(row.id, { priceMin: e.target.value })}
              />
              <Input
                placeholder="Max ₹"
                value={row.priceMax}
                disabled={!row.enabled}
                onChange={(e) => updateRow(row.id, { priceMax: e.target.value })}
              />
            </div>
          ))
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
