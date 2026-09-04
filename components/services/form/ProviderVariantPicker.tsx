"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  collectCatalogAxisOptions,
  defaultProviderAxisSelection,
  isProviderAxisSelectionComplete,
  type ProviderAxisSelection,
} from "@/lib/catalogVariants";
import type { CatalogProductItem } from "@/lib/productCatalog";
import { cn } from "@/lib/utils";

export type { ProviderAxisSelection };
export { defaultProviderAxisSelection, isProviderAxisSelectionComplete };

type Props = {
  product: CatalogProductItem;
  selection: ProviderAxisSelection;
  onChange: (selection: ProviderAxisSelection) => void;
  error?: string;
};

export function ProviderVariantPicker({ product, selection, onChange, error }: Props) {
  const axes = product.variantAxes || [];
  const axisOptions = useMemo(() => collectCatalogAxisOptions(product), [product]);

  if (!axes.length) return null;

  const toggleOption = (axisKey: string, option: string) => {
    const current = new Set(selection[axisKey] || []);
    if (current.has(option)) current.delete(option);
    else current.add(option);
    onChange({
      ...selection,
      [axisKey]: (axisOptions[axisKey] || []).filter((o) => current.has(o)),
    });
  };

  const setAxisAll = (axisKey: string, enabled: boolean) => {
    onChange({
      ...selection,
      [axisKey]: enabled ? [...(axisOptions[axisKey] || [])] : [],
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <Label className="text-base">What you sell</Label>
        <p className="text-xs text-muted-foreground">
          Pick the options you offer for each field. Buyers still choose a full combination —
          you do not need to tick every size×grade row.
        </p>
      </div>

      <div className="space-y-4">
        {axes.map((axis) => {
          const options = axisOptions[axis.key] || [];
          const selected = new Set(selection[axis.key] || []);
          if (!options.length) return null;
          return (
            <div key={axis.key} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{axis.label}</p>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setAxisAll(axis.key, true)}
                  >
                    All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setAxisAll(axis.key, false)}
                  >
                    None
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {selected.size} of {options.length} selected
              </p>
              <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                  const on = selected.has(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(axis.key, opt)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors",
                        on
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
