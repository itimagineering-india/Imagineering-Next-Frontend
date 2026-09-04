export type CatalogVariantAxis = {
  key: string;
  label: string;
  options: string[];
  allowCustom?: boolean;
};

export type CatalogVariant = {
  id: string;
  attributes: Record<string, string>;
  productCode?: string;
  images?: string[];
  suggestedPriceType?: string;
  suggestedPriceMin?: number;
  suggestedPriceMax?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export function readCatalogVariants(raw: Record<string, unknown> | null | undefined): {
  hasVariants: boolean;
  variantAxes: CatalogVariantAxis[];
  variants: CatalogVariant[];
} {
  const axes = Array.isArray(raw?.variantAxes)
    ? (raw!.variantAxes as CatalogVariantAxis[]).filter((a) => a?.key && a?.label)
    : [];
  const variants = Array.isArray(raw?.variants)
    ? (raw!.variants as CatalogVariant[]).filter((v) => v?.id && v?.attributes)
    : [];
  return {
    hasVariants: Boolean(raw?.hasVariants) && axes.length > 0 && variants.length > 0,
    variantAxes: axes,
    variants,
  };
}

export function activeCatalogVariants(variants: CatalogVariant[]): CatalogVariant[] {
  return variants.filter((v) => v.isActive !== false);
}

export function catalogVariantLabel(variant: CatalogVariant, axes: CatalogVariantAxis[]): string {
  return axes.map((axis) => variant.attributes?.[axis.key]).filter(Boolean).join(" · ");
}

export function catalogVariantSummary(axes: CatalogVariantAxis[], variants: CatalogVariant[]): string {
  const active = activeCatalogVariants(variants);
  if (!active.length || !axes.length) return "";
  return axes
    .map((axis) => {
      const n = new Set(active.map((v) => v.attributes?.[axis.key]).filter(Boolean)).size;
      return `${n} ${axis.label.toLowerCase()}${n === 1 ? "" : "s"}`;
    })
    .join(" · ");
}

export function catalogVariantPriceBounds(variants: CatalogVariant[]): { min?: number; max?: number } {
  const nums: number[] = [];
  for (const v of activeCatalogVariants(variants)) {
    if (v.suggestedPriceMin != null && Number.isFinite(v.suggestedPriceMin)) nums.push(v.suggestedPriceMin);
    if (v.suggestedPriceMax != null && Number.isFinite(v.suggestedPriceMax)) nums.push(v.suggestedPriceMax);
  }
  if (!nums.length) return {};
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

export function findCatalogVariant(
  variants: CatalogVariant[],
  selected: Record<string, string>,
  axes: CatalogVariantAxis[],
): CatalogVariant | undefined {
  return activeCatalogVariants(variants).find((v) =>
    axes.every((axis) => !selected[axis.key] || v.attributes?.[axis.key] === selected[axis.key]),
  );
}

export function defaultVariantSelection(
  axes: CatalogVariantAxis[],
  variants: CatalogVariant[],
): Record<string, string> {
  const first = activeCatalogVariants(variants)[0];
  const selected: Record<string, string> = {};
  for (const axis of axes) {
    selected[axis.key] = first?.attributes?.[axis.key] || axis.options?.[0] || "";
  }
  return selected;
}

export function parseProviderVariants(meta: unknown): Array<{
  id: string;
  enabled: boolean;
  priceMin?: number;
  priceMax?: number;
}> {
  if (!meta || typeof meta !== "object") return [];
  const raw = (meta as Record<string, unknown>).providerVariants;
  if (Array.isArray(raw)) {
    return raw
      .map((row) => {
        const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        const id = String(r.id || "").trim();
        if (!id) return null;
        return {
          id,
          enabled: r.enabled !== false,
          priceMin: Number.isFinite(Number(r.priceMin)) ? Number(r.priceMin) : undefined,
          priceMax: Number.isFinite(Number(r.priceMax)) ? Number(r.priceMax) : undefined,
        };
      })
      .filter((x): x is { id: string; enabled: boolean; priceMin?: number; priceMax?: number } => Boolean(x));
  }
  if (typeof raw === "string") {
    try {
      return parseProviderVariants({ providerVariants: JSON.parse(raw) });
    } catch {
      return [];
    }
  }
  return [];
}
