"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  listPaintShadeBrands,
  searchPaintShadeCatalog,
  type CatalogPaintShade,
} from "@/lib/paintShadeCatalog";
import {
  getPaintShadeFamily,
  PAINT_SHADE_FAMILIES,
} from "@/lib/paintShadeFamilies";
import type { PaintShade } from "@/lib/paintShades";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Product brand — when matched to catalog, browse is locked to this brand only. */
  brand?: string | null;
  selectedCode?: string;
  onSelect: (shade: PaintShade & { brand?: string; line?: string }) => void;
};

export function resolveCatalogBrand(
  brand: string | null | undefined,
  brands: string[] = listPaintShadeBrands()
): string | null {
  const raw = String(brand || "")
    .toLowerCase()
    .trim();
  if (!raw) return null;
  const exact = brands.find((b) => b.toLowerCase() === raw);
  if (exact) return exact;
  return (
    brands.find(
      (b) =>
        b.toLowerCase().includes(raw) || raw.includes(b.toLowerCase())
    ) || null
  );
}

export function PaintShadeBrowseModal({
  open,
  onOpenChange,
  brand,
  selectedCode,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [familyFilter, setFamilyFilter] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState(96);
  const brands = useMemo(() => listPaintShadeBrands(), []);
  const lockedBrand = useMemo(
    () => resolveCatalogBrand(brand, brands),
    [brand, brands]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setFamilyFilter("All");
    setVisibleCount(96);
    setBrandFilter(lockedBrand || "");
  }, [open, lockedBrand]);

  useEffect(() => {
    setVisibleCount(96);
  }, [query, brandFilter, familyFilter]);

  const activeBrand = lockedBrand || brandFilter || undefined;

  const allShades = useMemo(() => {
    const list = searchPaintShadeCatalog(query, {
      brand: activeBrand,
      limit: 2000,
    });
    if (!familyFilter || familyFilter === "All") return list;
    return list.filter((s) => getPaintShadeFamily(s) === familyFilter);
  }, [query, activeBrand, familyFilter]);
  const shades = allShades.slice(0, visibleCount);
  const hasMore = visibleCount < allShades.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(96vw,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1 border-b px-4 py-3 text-left sm:px-5">
          <DialogTitle>
            {lockedBrand ? `Browse ${lockedBrand} shades` : "Browse shades"}
          </DialogTitle>
          <DialogDescription>
            {lockedBrand
              ? `Only ${lockedBrand} shades for this product. Preview is approximate.`
              : "Preview is approximate only. Select a shade to fill code and name on the product page."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b px-4 py-3 sm:px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lockedBrand
                  ? `Search ${lockedBrand} shade code or name…`
                  : "Search shade code or name…"
              }
              className="h-10 pl-9"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PAINT_SHADE_FAMILIES.map((family) => (
              <Button
                key={family}
                type="button"
                size="sm"
                variant={familyFilter === family ? "default" : "outline"}
                className="h-7 rounded-full px-2.5 text-xs"
                onClick={() => setFamilyFilter(family)}
              >
                {family === "All" ? "All colours" : family}
              </Button>
            ))}
          </div>
          {!lockedBrand ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={brandFilter === "" ? "default" : "outline"}
                className="h-7 rounded-full px-2.5 text-xs"
                onClick={() => setBrandFilter("")}
              >
                All brands
              </Button>
              {brands.map((b) => (
                <Button
                  key={b}
                  type="button"
                  size="sm"
                  variant={brandFilter === b ? "default" : "outline"}
                  className="h-7 rounded-full px-2.5 text-xs"
                  onClick={() => setBrandFilter(b)}
                >
                  {b}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Brand locked to <span className="font-medium text-foreground">{lockedBrand}</span> for this product.
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {allShades.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No shades match “{query}”
              {lockedBrand ? ` in ${lockedBrand}` : ""}. Try another code or name, or type it manually on the product page.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {shades.map((shade) => (
                  <ShadeCard
                    key={`${shade.brand}-${shade.code}`}
                    shade={shade}
                    selected={selectedCode === shade.code}
                    showBrand={!lockedBrand}
                    onSelect={() => {
                      onSelect({
                        code: shade.code,
                        name: shade.name,
                        hex: shade.hex,
                        brand: shade.brand,
                        line: shade.line,
                      });
                      onOpenChange(false);
                    }}
                  />
                ))}
              </div>
              {hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisibleCount((n) => n + 96)}
                >
                  Show more ({allShades.length - visibleCount} left)
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2.5 text-[11px] text-muted-foreground sm:px-5">
          Showing {shades.length} of {allShades.length}
          {familyFilter !== "All" ? ` · ${familyFilter}` : ""}
          {activeBrand ? ` · ${activeBrand}` : ""} — colours on screen are approximate.
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShadeCard({
  shade,
  selected,
  showBrand,
  onSelect,
}: {
  shade: CatalogPaintShade;
  selected: boolean;
  showBrand?: boolean;
  onSelect: () => void;
}) {
  const hex = shade.hex && /^#[0-9a-fA-F]{6}$/i.test(shade.hex) ? shade.hex : "#e2e8f0";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-foreground ring-2 ring-foreground/20"
          : "border-border hover:border-foreground/40 hover:shadow-sm"
      }`}
    >
      <div className="aspect-[4/3] w-full border-b border-black/5" style={{ backgroundColor: hex }} />
      <div className="space-y-0.5 p-2.5">
        <p className="text-sm font-semibold tabular-nums text-foreground">{shade.code}</p>
        <p className="truncate text-xs text-muted-foreground">{shade.name}</p>
        {showBrand ? (
          <p className="truncate text-[10px] text-muted-foreground/80">
            {shade.brand}
            {shade.line ? ` · ${shade.line}` : ""}
          </p>
        ) : shade.line ? (
          <p className="truncate text-[10px] text-muted-foreground/80">{shade.line}</p>
        ) : null}
      </div>
    </button>
  );
}
