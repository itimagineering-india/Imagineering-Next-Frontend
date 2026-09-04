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

/** Axis options the provider sells — not combination rows. */
export type ProviderAxisSelection = Record<string, string[]>;

type AxisProductShape = {
  variantAxes?: Array<{ key: string; label: string; options?: string[] }>;
  variants?: Array<{
    id: string;
    attributes?: Record<string, string>;
    isActive?: boolean;
  }>;
};

export function collectCatalogAxisOptions(product: AxisProductShape): Record<string, string[]> {
  const axes = product.variantAxes || [];
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
}

export function defaultProviderAxisSelection(product: AxisProductShape): ProviderAxisSelection {
  return collectCatalogAxisOptions(product);
}

export function parseProviderVariantAxes(meta: unknown): ProviderAxisSelection | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as Record<string, unknown>).providerVariantAxes;
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const out: ProviderAxisSelection = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    const axisKey = String(key || "").trim();
    if (!axisKey || !Array.isArray(value)) continue;
    const options = [
      ...new Set(value.map((o) => String(o || "").trim()).filter(Boolean)),
    ];
    if (options.length) out[axisKey] = options;
  }
  return Object.keys(out).length ? out : null;
}

/** Prefer axis selection; fall back to deriving options from legacy enabled variant ids. */
export function resolveProviderAxisSelection(
  product: AxisProductShape,
  meta: unknown,
): ProviderAxisSelection {
  const fromAxes = parseProviderVariantAxes(meta);
  if (fromAxes) {
    const available = collectCatalogAxisOptions(product);
    const merged: ProviderAxisSelection = {};
    for (const axis of product.variantAxes || []) {
      const allowed = new Set(available[axis.key] || []);
      const saved = (fromAxes[axis.key] || []).filter((o) => allowed.has(o));
      merged[axis.key] = saved.length ? saved : [...allowed];
    }
    return merged;
  }

  const legacy = parseProviderVariants(meta).filter((r) => r.enabled);
  if (legacy.length) {
    const enabledIds = new Set(legacy.map((r) => r.id));
    const sel: ProviderAxisSelection = {};
    for (const axis of product.variantAxes || []) {
      const opts = new Set<string>();
      for (const variant of product.variants || []) {
        if (variant.isActive === false || !enabledIds.has(variant.id)) continue;
        const v = String(variant.attributes?.[axis.key] || "").trim();
        if (v) opts.add(v);
      }
      sel[axis.key] = [...opts];
    }
    if (Object.values(sel).some((opts) => opts.length > 0)) return sel;
  }

  return defaultProviderAxisSelection(product);
}

export function isProviderAxisSelectionComplete(
  product: AxisProductShape,
  selection: ProviderAxisSelection,
): boolean {
  const axes = product.variantAxes || [];
  if (!axes.length) return true;
  const available = collectCatalogAxisOptions(product);
  return axes.every((axis) => {
    if (!(available[axis.key] || []).length) return true;
    return (selection[axis.key] || []).length > 0;
  });
}

export function serializeProviderVariantAxes(selection: ProviderAxisSelection): string {
  const out: ProviderAxisSelection = {};
  for (const [key, options] of Object.entries(selection)) {
    const cleaned = [...new Set((options || []).map((o) => String(o || "").trim()).filter(Boolean))];
    if (cleaned.length) out[key] = cleaned;
  }
  return JSON.stringify(out);
}
