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

export function catalogAxisOptionValues(
  axis: CatalogVariantAxis,
  variants: CatalogVariant[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (raw: string | undefined) => {
    const v = String(raw || "").trim();
    if (!v || seen.has(v)) return;
    seen.add(v);
    out.push(v);
  };
  for (const opt of axis.options || []) push(opt);
  for (const variant of activeCatalogVariants(variants)) {
    push(variant.attributes?.[axis.key]);
  }
  return out;
}

/** After changing one axis, keep a valid combination without wiping earlier picks. */
export function selectionAfterAxisChange(
  axes: CatalogVariantAxis[],
  variants: CatalogVariant[],
  current: Record<string, string>,
  axisKey: string,
  value: string,
): Record<string, string> {
  const next = { ...current, [axisKey]: value };
  const active = activeCatalogVariants(variants);

  const toSelection = (variant: CatalogVariant): Record<string, string> => {
    const synced: Record<string, string> = {};
    for (const axis of axes) synced[axis.key] = variant.attributes?.[axis.key] || "";
    return synced;
  };

  const exact = active.find((v) =>
    axes.every((axis) => (v.attributes?.[axis.key] || "") === (next[axis.key] || "")),
  );
  if (exact) return toSelection(exact);

  const candidates = active.filter((v) => v.attributes?.[axisKey] === value);
  if (!candidates.length) return next;

  // Prefer candidates that keep the user's other selections (earlier axes weigh more).
  let best: CatalogVariant | null = null;
  let bestScore = -1;
  for (const variant of candidates) {
    let score = 0;
    axes.forEach((axis, i) => {
      if (axis.key === axisKey) return;
      const want = current[axis.key];
      if (want && variant.attributes?.[axis.key] === want) {
        score += 1 << (axes.length - 1 - i);
      }
    });
    if (score > bestScore) {
      bestScore = score;
      best = variant;
    }
  }

  if (best && bestScore > 0) return toSelection(best);

  // No overlap with prior picks — still try to keep the first axis (e.g. Grade) if possible.
  const primaryKey = axes[0]?.key;
  if (primaryKey && primaryKey !== axisKey && current[primaryKey]) {
    const keepPrimary = candidates.find((v) => v.attributes?.[primaryKey] === current[primaryKey]);
    if (keepPrimary) return toSelection(keepPrimary);
  }

  // Keep the user's explicit selection as-is instead of jumping to an unrelated default combo.
  return next;
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
    return raw.flatMap((row) => {
      const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
      const id = String(r.id || "").trim();
      if (!id) return [];
      const priceMin = Number(r.priceMin);
      const priceMax = Number(r.priceMax);
      return [
        {
          id,
          enabled: r.enabled !== false,
          ...(Number.isFinite(priceMin) ? { priceMin } : {}),
          ...(Number.isFinite(priceMax) ? { priceMax } : {}),
        },
      ];
    });
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
