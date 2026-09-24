"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PaintShadeBrowseModal, resolveCatalogBrand } from "@/components/materials/PaintShadeBrowseModal";
import type { PaintShade } from "@/lib/paintShades";
import { formatPaintShadeLabel } from "@/lib/paintShades";

type Props = {
  value: PaintShade;
  onChange: (shade: PaintShade) => void;
  /** Product brand — used to prefer matching catalog shades in the browse modal. */
  brand?: string | null;
};

export function PaintShadePicker({ value, onChange, brand }: Props) {
  const [browseOpen, setBrowseOpen] = useState(false);
  const hasPreview = Boolean(value.hex && /^#[0-9a-fA-F]{6}$/i.test(value.hex));
  const previewHex = hasPreview ? value.hex! : "#e2e8f0";
  const selectedLabel = formatPaintShadeLabel(value);
  const lockedBrand = resolveCatalogBrand(brand);

  return (
    <div className="space-y-3 rounded-lg border border-input bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Shade</p>
          <p className="text-xs text-muted-foreground">
            {lockedBrand
              ? `Browse ${lockedBrand} shades to pick code and name.`
              : "Browse shades to pick code and name."}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={() => setBrowseOpen(true)}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Browse shades
        </Button>
      </div>

      {selectedLabel ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
          <span
            className="h-7 w-7 shrink-0 rounded-md border border-black/10"
            style={{ backgroundColor: previewHex }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{selectedLabel}</p>
            <p className="text-[11px] text-muted-foreground">Selected shade</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 shrink-0 px-2 text-xs"
            onClick={() => setBrowseOpen(true)}
          >
            Change
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,9rem)_1fr]">
        <div className="space-y-1">
          <Label htmlFor="paint-shade-code" className="text-sm font-medium">
            Shade code <span className="text-destructive">*</span>
          </Label>
          <Input
            id="paint-shade-code"
            value={value.code}
            placeholder="e.g. 8234"
            className="h-10"
            autoComplete="off"
            onChange={(e) =>
              onChange({
                ...value,
                code: e.target.value.slice(0, 40),
              })
            }
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="paint-shade-name" className="text-sm font-medium">
            Shade name
          </Label>
          <Input
            id="paint-shade-name"
            value={value.name}
            placeholder="e.g. Morning Mist"
            className="h-10"
            autoComplete="off"
            onChange={(e) =>
              onChange({
                ...value,
                name: e.target.value.slice(0, 120),
              })
            }
          />
        </div>
      </div>

      <PaintShadeBrowseModal
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        brand={brand}
        selectedCode={value.code}
        onSelect={(shade) =>
          onChange({
            code: shade.code,
            name: shade.name,
            hex: shade.hex,
          })
        }
      />
    </div>
  );
}
