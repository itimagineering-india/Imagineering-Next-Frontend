/**
 * Construction Materials Hub — shared types + pure helpers.
 * Live data is loaded via `materialsHubApi.ts` (no mock catalog).
 */

export type MaterialsCategoryId = string;

export type MaterialsCategory = {
  id: MaterialsCategoryId;
  name: string;
  subtitle?: string;
  mark: string;
  tint: string;
};

export type MarketPriceTrend = 'up' | 'down' | 'flat';

export type MaterialsMarketPrice = {
  id: string;
  name: string;
  priceLabel: string;
  trend: MarketPriceTrend;
  unitHint?: string;
  spark: readonly number[];
};

export type MaterialsTrustBadge = 'most_requested' | 'trending' | 'fast_response' | 'verified';

export type MaterialsProduct = {
  id: string;
  categoryId: MaterialsCategoryId;
  brand: string;
  name: string;
  grade?: string;
  shortDescription: string;
  available: boolean;
  priceRange: string;
  /** Numeric bounds for sort / filter (from catalog suggested prices). */
  priceMin?: number;
  priceMax?: number;
  isPriceRange?: boolean;
  /** Catalog suggestedPriceType (e.g. per_bag, per_kg) for quantity UI. */
  unitType?: string;
  avgDeliveryDays: number;
  avgQuoteResponseMin: number;
  imageUri?: string;
  badge?: MaterialsTrustBadge;
  rating?: number;
  reviewCount?: number;
};

export type MaterialsBrand = {
  id: string;
  name: string;
  mark: string;
};

export type MaterialsTopProvider = {
  id: string;
  name: string;
  mark: string;
  specialty: string;
  city: string;
  rating: number;
  reviewCount: number;
  responseMins: number;
  distanceKm: number;
  verified: boolean;
  tint: string;
};

export type MaterialsInsight = {
  id: string;
  labelKey: string;
  value: string;
  hintKey?: string;
};

export type MaterialsQuickFilterId =
  | 'nearby'
  | 'lowest_price'
  | 'wholesale'
  | 'retail'
  | 'gst'
  | 'fast_delivery'
  | 'brands'
  | 'verified';

export type MaterialsQuickFilter = {
  id: MaterialsQuickFilterId;
  labelKey: string;
};

export type MaterialsWorkflowItem = {
  id: string;
  titleKey: string;
  subtitleKey: string;
  mark: string;
};

export type MaterialsCategoryProductSection = {
  category: MaterialsCategory;
  products: MaterialsProduct[];
};

export const MATERIALS_CATEGORY_SLUG = 'construction-materials';

export const MATERIALS_SEARCH_PLACEHOLDERS = [
  'Search Cement',
  'Search Steel',
  'Search TMT Bars',
  'Search Paint',
] as const;

/** Default trending brands (UI chrome — logos in materialsBrandArt) */
export const MATERIALS_TRENDING_BRANDS: readonly MaterialsBrand[] = [
  { id: 'ultratech', name: 'UltraTech', mark: 'UT' },
  { id: 'acc', name: 'ACC', mark: 'AC' },
  { id: 'ambuja', name: 'Ambuja', mark: 'AM' },
  { id: 'jk', name: 'JK Cement', mark: 'JK' },
  { id: 'tata', name: 'Tata Steel', mark: 'TS' },
  { id: 'dalmia', name: 'Dalmia', mark: 'DA' },
  { id: 'moira', name: 'Moira', mark: 'MO' },
] as const;

export const MATERIALS_CATEGORY_TINTS = [
  '#FFF7ED',
  '#F1F5F9',
  '#FFF1F2',
  '#FEF9C3',
  '#EEF2FF',
  '#ECFDF5',
  '#FDF4FF',
  '#FFFBEB',
] as const;

export function slugifyMaterialsId(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Canonical material-type id shared with admin catalog (`materialTypeKey`).
 * e.g. "Bricks & Blocks" / "bricks-and-blocks" → "bricks"
 */
export function resolveMaterialsMaterialTypeKey(raw: string): string {
  const n = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

  if (n === 'cement' || n.includes('cement')) return 'cement';
  if (n === 'steel' || n.includes('steel')) return 'steel';
  if (n.includes('aggreg')) return 'aggregate';
  if (n.includes('brick') || n.includes('block')) return 'bricks';
  if (n.includes('tile') || n.includes('flooring') || n === 'tiles_flooring') return 'tiles_flooring';
  if (n.includes('paint')) return 'paint';
  if (n === 'sand' || n.includes('sand')) return 'sand';
  if (n === 'other') return 'other';
  if (
    ['cement', 'sand', 'steel', 'aggregate', 'bricks', 'tiles_flooring', 'paint', 'other'].includes(n)
  ) {
    return n;
  }
  return n.replace(/_+/g, '_').replace(/^_|_$/g, '') || slugifyMaterialsId(raw);
}

export function materialsMarkFromName(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function filterMaterialsProducts(
  products: readonly MaterialsProduct[],
  opts: { query?: string; categoryId?: MaterialsCategoryId | null }
): MaterialsProduct[] {
  const q = (opts.query || '').trim().toLowerCase();
  return products.filter((p) => {
    if (opts.categoryId && p.categoryId !== opts.categoryId) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      (p.grade || '').toLowerCase().includes(q) ||
      p.categoryId.includes(q)
    );
  });
}

export type MaterialsProductSort =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'delivery'
  | 'name';

export type MaterialsProductFilters = {
  brands?: string[];
  minRating?: number | null;
  maxDeliveryDays?: number | null;
  /** 'fixed' | 'quote' | null (all) */
  priceMode?: 'fixed' | 'quote' | null;
  minPrice?: number | null;
  maxPrice?: number | null;
};

function productSortPrice(p: MaterialsProduct): number {
  if (p.priceMin != null && p.priceMax != null) return (p.priceMin + p.priceMax) / 2;
  if (p.priceMin != null) return p.priceMin;
  if (p.priceMax != null) return p.priceMax;
  return Number.POSITIVE_INFINITY;
}

export function applyMaterialsProductFilters(
  products: readonly MaterialsProduct[],
  filters: MaterialsProductFilters
): MaterialsProduct[] {
  const brands = (filters.brands || []).map((b) => b.toLowerCase());
  const minRating = filters.minRating ?? null;
  const maxDelivery = filters.maxDeliveryDays ?? null;
  const priceMode = filters.priceMode ?? null;
  const minPrice = filters.minPrice ?? null;
  const maxPrice = filters.maxPrice ?? null;

  return products.filter((p) => {
    if (brands.length > 0 && !brands.includes(p.brand.toLowerCase())) return false;
    if (minRating != null) {
      const r = p.rating ?? 0;
      if (r < minRating) return false;
    }
    if (maxDelivery != null && p.avgDeliveryDays > maxDelivery) return false;
    if (priceMode === 'fixed' && p.isPriceRange) return false;
    if (priceMode === 'quote' && !p.isPriceRange) return false;
    const sortPrice = productSortPrice(p);
    if (minPrice != null && Number.isFinite(minPrice)) {
      if (!Number.isFinite(sortPrice) || sortPrice === Number.POSITIVE_INFINITY || sortPrice < minPrice) {
        return false;
      }
    }
    if (maxPrice != null && Number.isFinite(maxPrice)) {
      if (!Number.isFinite(sortPrice) || sortPrice === Number.POSITIVE_INFINITY || sortPrice > maxPrice) {
        return false;
      }
    }
    return true;
  });
}

export function sortMaterialsProducts(
  products: readonly MaterialsProduct[],
  sort: MaterialsProductSort
): MaterialsProduct[] {
  if (sort === 'relevance') return [...products];
  const next = [...products];
  next.sort((a, b) => {
    switch (sort) {
      case 'price_asc':
        return productSortPrice(a) - productSortPrice(b);
      case 'price_desc': {
        const pa = productSortPrice(a);
        const pb = productSortPrice(b);
        const fa = pa === Number.POSITIVE_INFINITY ? -1 : pa;
        const fb = pb === Number.POSITIVE_INFINITY ? -1 : pb;
        return fb - fa;
      }
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0);
      case 'delivery':
        return a.avgDeliveryDays - b.avgDeliveryDays;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
  return next;
}

export function getMaterialsCategoryProductSections(
  categories: readonly MaterialsCategory[],
  products: readonly MaterialsProduct[]
): MaterialsCategoryProductSection[] {
  return categories
    .map((category) => ({
      category,
      products: products.filter((p) => p.categoryId === category.id),
    }))
    .filter((section) => section.products.length > 0);
}

export function formatMaterialsUnitLabel(unitType?: string | null): string {
  const key = String(unitType || '')
    .trim()
    .toLowerCase();
  if (!key) return '';
  // Not a sellable unit — don't append to price
  if (['negotiable', 'fixed', 'lumpsum', 'per_project'].includes(key)) return '';

  const labels: Record<string, string> = {
    per_bag: 'bag',
    per_kg: 'kg',
    per_litre: 'litre',
    per_load: 'load',
    per_trip: 'trip',
    per_unit: 'unit',
    per_sqft: 'sq ft',
    per_sqm: 'sq m',
    per_cuft: 'cu ft',
    per_cum: 'cu m',
    per_metre: 'metre',
    metric_ton: 'MT',
    hourly: 'hour',
    daily: 'day',
    monthly: 'month',
  };
  if (labels[key]) return labels[key];
  return key.replace(/_/g, ' ').replace(/^per\s+/i, '').trim();
}

export function formatMaterialsPriceRange(
  min?: number | null,
  max?: number | null,
  unitType?: string | null
): string {
  const unit = formatMaterialsUnitLabel(unitType);
  const suffix = unit ? ` / ${unit}` : '';
  const lo = Number(min);
  const hi = Number(max);
  const hasLo = Number.isFinite(lo) && lo > 0;
  const hasHi = Number.isFinite(hi) && hi > 0;
  if (hasLo && hasHi) {
    if (lo === hi) return `₹${lo.toLocaleString('en-IN')}${suffix}`;
    return `₹${lo.toLocaleString('en-IN')} – ₹${hi.toLocaleString('en-IN')}${suffix}`;
  }
  if (hasLo) return `From ₹${lo.toLocaleString('en-IN')}${suffix}`;
  if (hasHi) return `Up to ₹${hi.toLocaleString('en-IN')}${suffix}`;
  return 'Get quotes';
}

/** Range / quote-only pricing → Get Best Quote; single fixed price → Add to Cart */
export function isMaterialsCatalogPriceRange(
  min?: number | null,
  max?: number | null
): boolean {
  const lo = Number(min);
  const hi = Number(max);
  const hasLo = Number.isFinite(lo) && lo > 0;
  const hasHi = Number.isFinite(hi) && hi > 0;
  if (hasLo && hasHi) return lo !== hi;
  if (hasLo || hasHi) return true; // From / Up to
  return true; // no price → quote
}
