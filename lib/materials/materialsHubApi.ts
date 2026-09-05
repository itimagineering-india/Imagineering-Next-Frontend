/**
 * Construction Materials hub — fetch + map backend data into UI shapes.
 * Product rails use admin product catalog (templates), not provider services.
 */

import {
  catalogVariantLabel,
  catalogVariantPriceBounds,
  catalogVariantSummary,
  readCatalogVariants,
} from "@/lib/catalogVariants";
import api from "@/lib/api-client";
import { resolveMaterialsMediaUrl } from "@/lib/materials/media";
import {
  MATERIALS_CATEGORY_SLUG,
  MATERIALS_CATEGORY_TINTS,
  formatMaterialsPriceRange,
  materialsMarkFromName,
  resolveMaterialsMaterialTypeKey,
  slugifyMaterialsId,
  isMaterialsCatalogPriceRange,
  type MaterialsBrand,
  type MaterialsCategory,
  type MaterialsMarketPrice,
  type MaterialsProduct,
  type MaterialsTopProvider,
} from "@/lib/materials/constructionMaterialsCatalog";

export type MaterialsHubData = {
  categories: MaterialsCategory[];
  products: MaterialsProduct[];
  providers: MaterialsTopProvider[];
  brands: MaterialsBrand[];
  marketPrices: MaterialsMarketPrice[];
};

export async function findServiceIdForCatalogProduct(
  catalogProductId: string,
  opts?: { excludeProviderUserId?: string | null }
): Promise<{ serviceId: string; title: string; priceType?: string } | null> {
  const id = String(catalogProductId || "").trim();
  if (!id) return null;
  const exclude = String(opts?.excludeProviderUserId || "").trim();
  try {
    const res = await api.services.getAll({
      catalogProductId: id,
      limit: 30,
      page: 1,
    });
    if (!res.success) return null;
    const list = (res.data as { services?: unknown[] } | undefined)?.services;
    if (!Array.isArray(list) || list.length === 0) return null;

    const providerIdOf = (row: Record<string, unknown>): string => {
      const provider = row?.provider as Record<string, unknown> | string | undefined;
      if (provider && typeof provider === "object") {
        return String(provider._id || provider.id || "").trim();
      }
      return String(provider || "").trim();
    };
    const serviceIdOf = (row: Record<string, unknown>): string =>
      String(row?._id || row?.id || "").trim();

    const other = list.find((row) => {
      const r = row as Record<string, unknown>;
      const sid = serviceIdOf(r);
      if (!sid) return false;
      if (!exclude) return true;
      return providerIdOf(r) !== exclude;
    }) as Record<string, unknown> | undefined;

    if (other) {
      const priceType = String(other?.priceType || "").trim();
      return {
        serviceId: serviceIdOf(other),
        title: String(other?.title || "").trim(),
        ...(priceType ? { priceType } : {}),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Unit / price type from admin catalog product (suggestedPriceType). */
export async function fetchCatalogProductPriceType(
  catalogProductId: string
): Promise<string | undefined> {
  const id = String(catalogProductId || "").trim();
  if (!id) return undefined;
  try {
    const res = await api.productCatalog.getById(id);
    if (!res.success) return undefined;
    const data = res.data as { product?: Record<string, unknown> } | Record<string, unknown> | undefined;
    const product =
      data && typeof data === "object" && "product" in data && data.product
        ? (data.product as Record<string, unknown>)
        : (data as Record<string, unknown> | undefined);
    const unit = String(product?.suggestedPriceType || "").trim();
    return unit || undefined;
  } catch {
    return undefined;
  }
}

function pickTint(index: number): string {
  return MATERIALS_CATEGORY_TINTS[index % MATERIALS_CATEGORY_TINTS.length];
}

function mapCategory(name: string, index: number): MaterialsCategory {
  const id =
    resolveMaterialsMaterialTypeKey(name) || slugifyMaterialsId(name) || `cat-${index}`;
  return {
    id,
    name: String(name).trim() || "Material",
    subtitle: undefined,
    mark: materialsMarkFromName(name),
    tint: pickTint(index),
  };
}

export function mapCatalogProduct(raw: Record<string, unknown>, fallbackCategoryId: string): MaterialsProduct | null {
  const id = String(raw?._id || raw?.id || "").trim();
  if (!id) return null;
  const name = String(raw?.name || "").trim();
  if (!name) return null;

  const meta = raw?.metadata && typeof raw.metadata === "object" ? (raw.metadata as Record<string, unknown>) : {};
  const materialKey =
    resolveMaterialsMaterialTypeKey(
      String(raw?.materialTypeKey || raw?.subcategory || meta.materialType || "")
    ) ||
    slugifyMaterialsId(String(raw?.subcategory || fallbackCategoryId || "")) ||
    fallbackCategoryId ||
    "general";
  const pickBrand = (...candidates: unknown[]) => {
    for (const c of candidates) {
      const s = String(c ?? "").trim();
      if (!s) continue;
      const n = s.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
      if (
        n === "brand" ||
        n === "not specified" ||
        n === "n/a" ||
        n === "na" ||
        n === "custom" ||
        n === "select" ||
        n === "none"
      ) {
        continue;
      }
      return s;
    }
    return "";
  };
  const resolveSelect = (key: string, customKey: string) => {
    const v = String(meta[key] ?? "").trim();
    const custom = String(meta[customKey] ?? "").trim();
    if (v.toLowerCase() === "custom" && custom) return custom;
    return v;
  };
  const brand = pickBrand(
    raw?.brand,
    resolveSelect("steelBrand", "steelBrandCustom"),
    resolveSelect("tileBrand", "tileBrandCustom"),
    resolveSelect("brand", "brandCustom"),
  );
  const images = Array.isArray(raw?.images) ? (raw.images as string[]) : [];
  const { hasVariants, variantAxes, variants } = readCatalogVariants(raw);
  const firstVariantImage =
    hasVariants
      ? variants.find((v) => v.isActive !== false && Array.isArray(v.images) && v.images.length)?.images?.[0]
      : undefined;
  const imageUri = resolveMaterialsMediaUrl(images[0] || firstVariantImage);
  const grade = String(meta.grade || meta.Grade || raw?.grade || "").trim() || undefined;
  const delivery = Number(meta.avgDeliveryDays || meta.deliveryDays || 3);
  const ratingObj = raw?.rating as { average?: number; count?: number } | number | undefined;
  const ratingRaw = Number(
    typeof ratingObj === "object" && ratingObj
      ? ratingObj.average
      : ratingObj ?? meta.rating ?? 0
  );
  const reviewCountRaw = Number(
    typeof ratingObj === "object" && ratingObj
      ? ratingObj.count
      : raw?.reviewCount ?? meta.reviewCount ?? 0
  );
  const rating = Number.isFinite(ratingRaw) && ratingRaw > 0 ? ratingRaw : undefined;
  const reviewCount =
    Number.isFinite(reviewCountRaw) && reviewCountRaw > 0 ? Math.floor(reviewCountRaw) : undefined;
  const variantBounds = hasVariants ? catalogVariantPriceBounds(variants) : {};
  const priceMinRaw = Number(hasVariants && variantBounds.min != null ? variantBounds.min : raw?.suggestedPriceMin);
  const priceMaxRaw = Number(hasVariants && variantBounds.max != null ? variantBounds.max : raw?.suggestedPriceMax);
  const priceMin = Number.isFinite(priceMinRaw) && priceMinRaw > 0 ? priceMinRaw : undefined;
  const priceMax = Number.isFinite(priceMaxRaw) && priceMaxRaw > 0 ? priceMaxRaw : undefined;
  const unitType = String(raw?.suggestedPriceType || "").trim() || undefined;

  return {
    id,
    categoryId: materialKey,
    brand,
    name,
    grade,
    shortDescription: String(raw?.description || raw?.shortDescription || "").trim(),
    available: raw?.isActive !== false,
    priceRange: formatMaterialsPriceRange(priceMin, priceMax, unitType),
    priceMin,
    priceMax,
    isPriceRange: isMaterialsCatalogPriceRange(priceMin, priceMax),
    unitType,
    avgDeliveryDays: Number.isFinite(delivery) && delivery > 0 ? Math.round(delivery) : 3,
    avgQuoteResponseMin: 30,
    imageUri,
    rating,
    reviewCount,
    hasVariants,
    variantSummary: hasVariants ? catalogVariantSummary(variantAxes, variants) : undefined,
    variantCount: hasVariants ? variants.filter((v) => v.isActive !== false).length : undefined,
    defaultVariantId: hasVariants
      ? variants.find((v) => v.isActive !== false)?.id
      : undefined,
    defaultVariantLabel: hasVariants
      ? catalogVariantLabel(variants.find((v) => v.isActive !== false) || variants[0], variantAxes)
      : undefined,
  };
}

const CATALOG_PAGE_SIZE = 250;
const CATALOG_MAX_PAGES = 20;

export async function listAllCatalogProducts(params: {
  categorySlug: string;
  materialTypeKey?: string;
  subcategory?: string;
}): Promise<Record<string, unknown>[]> {
  const categorySlug = String(params.categorySlug || "").trim();
  if (!categorySlug) return [];
  const collected: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  try {
    for (let page = 1; page <= CATALOG_MAX_PAGES; page++) {
      const res = await api.productCatalog.list({
        categorySlug,
        ...(params.materialTypeKey ? { materialTypeKey: params.materialTypeKey } : {}),
        ...(params.subcategory ? { subcategory: params.subcategory } : {}),
        limit: CATALOG_PAGE_SIZE,
        page,
      });
      if (!res.success) break;
      const data = res.data as
        | { products?: unknown[]; pagination?: { pages?: number } }
        | undefined;
      const rawProducts = Array.isArray(data?.products) ? data.products : [];
      for (const row of rawProducts) {
        const rec = row as Record<string, unknown>;
        const id = String(rec._id || rec.id || "").trim();
        if (id) {
          if (seen.has(id)) continue;
          seen.add(id);
        }
        collected.push(rec);
      }
      const pages = Number(data?.pagination?.pages || (res as { pagination?: { pages?: number } }).pagination?.pages) || 1;
      if (page >= pages || rawProducts.length < CATALOG_PAGE_SIZE) break;
    }
  } catch {
    return collected;
  }
  return collected;
}

export async function fetchCatalogProductsByCategory(categoryId: string): Promise<MaterialsProduct[]> {
  const key = resolveMaterialsMaterialTypeKey(categoryId) || String(categoryId || "").trim();
  if (!key) return [];
  try {
    const rawProducts = await listAllCatalogProducts({
      categorySlug: MATERIALS_CATEGORY_SLUG,
      materialTypeKey: key,
    });
    const mapped = rawProducts
      .map((row) => mapCatalogProduct(row, key))
      .filter(Boolean) as MaterialsProduct[];
    const filtered = mapped.filter((p) => p.categoryId === key);
    return filtered.length > 0 ? filtered : mapped;
  } catch {
    return [];
  }
}

function mapProvider(raw: Record<string, unknown>, index: number): MaterialsTopProvider | null {
  const id = String(raw?._id || raw?.id || "").trim();
  if (!id) return null;
  const user = raw?.user as Record<string, unknown> | undefined;
  const name = String(raw?.businessName || user?.name || raw?.name || "").trim();
  if (!name) return null;

  const ratingObj = raw?.rating as { average?: number; count?: number } | number | undefined;
  const rating = Number(
    typeof ratingObj === "object" && ratingObj ? ratingObj.average : ratingObj ?? raw?.avgRating ?? 0
  );
  const reviewCount = Number(
    typeof ratingObj === "object" && ratingObj ? ratingObj.count : raw?.reviewCount ?? 0
  );
  const distanceKm = Number(raw?.distanceKm);
  const location = raw?.location as Record<string, unknown> | undefined;
  const address = raw?.address as Record<string, unknown> | undefined;
  const city = String(location?.city || raw?.city || address?.city || "").trim();
  const primaryCategory = raw?.primaryCategory as Record<string, unknown> | undefined;

  return {
    id,
    name,
    mark: materialsMarkFromName(name),
    specialty: String(raw?.specialty || primaryCategory?.name || "Construction Materials").trim(),
    city: city || "Nearby",
    rating: Number.isFinite(rating) && rating > 0 ? rating : 4.5,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    responseMins: Number(raw?.avgResponseMins) || 45,
    distanceKm: Number.isFinite(distanceKm) && distanceKm >= 0 ? distanceKm : 0,
    verified: Boolean(raw?.verified || raw?.isVerified || raw?.kycVerified),
    tint: pickTint(index),
  };
}

function marketPricesFromProducts(
  products: MaterialsProduct[],
  categories: MaterialsCategory[]
): MaterialsMarketPrice[] {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const byCategory = new Map<string, MaterialsProduct[]>();
  for (const p of products) {
    if (!p.priceRange || p.priceRange === "Get quotes") continue;
    const list = byCategory.get(p.categoryId) || [];
    list.push(p);
    byCategory.set(p.categoryId, list);
  }

  const rows: MaterialsMarketPrice[] = [];
  for (const [categoryId, list] of byCategory) {
    const sample = list[0];
    if (!sample) continue;
    const label =
      nameById.get(categoryId) ||
      categoryId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    rows.push({
      id: categoryId,
      name: label,
      priceLabel: sample.priceRange,
      trend: "flat",
      unitHint: sample.grade,
      spark: [0.4, 0.45, 0.42, 0.5, 0.48, 0.52, 0.5],
    });
    if (rows.length >= 8) break;
  }
  return rows;
}

export async function fetchMaterialsHubData(opts?: {
  lat?: number;
  lng?: number;
}): Promise<MaterialsHubData> {
  const lat = opts?.lat;
  const lng = opts?.lng;

  const [subRes, catalogRows, providersRes] = await Promise.allSettled([
    api.categories.getSubcategories(MATERIALS_CATEGORY_SLUG),
    listAllCatalogProducts({ categorySlug: MATERIALS_CATEGORY_SLUG }),
    api.providers.getAll({
      categorySlug: MATERIALS_CATEGORY_SLUG,
      limit: 12,
      page: 1,
      verified: true,
      sort: lat != null && lng != null ? "distance" : "rating",
      ...(lat != null && lng != null ? { lat, lng, radiusKm: 50 } : {}),
    }),
  ]);

  let categories: MaterialsCategory[] = [];
  if (subRes.status === "fulfilled" && subRes.value?.success) {
    const names = (subRes.value.data as { subcategories?: string[] } | undefined)?.subcategories;
    if (Array.isArray(names) && names.length > 0) {
      categories = names.map((n: string, i: number) => mapCategory(String(n), i));
    }
  }

  let products: MaterialsProduct[] = [];
  if (catalogRows.status === "fulfilled") {
    products = catalogRows.value
      .map((row) => mapCatalogProduct(row, categories[0]?.id || "general"))
      .filter(Boolean) as MaterialsProduct[];
  }

  if (categories.length > 0) {
    const seen = new Map<string, MaterialsCategory>();
    categories.forEach((c) => {
      if (!seen.has(c.id)) seen.set(c.id, c);
    });
    categories = Array.from(seen.values());
  }

  if (categories.length === 0 && products.length > 0) {
    const seen = new Map<string, MaterialsCategory>();
    products.forEach((p, i) => {
      if (seen.has(p.categoryId)) return;
      seen.set(p.categoryId, {
        id: p.categoryId,
        name: p.categoryId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        mark: materialsMarkFromName(p.categoryId),
        tint: pickTint(i),
      });
    });
    categories = Array.from(seen.values());
  }

  let providers: MaterialsTopProvider[] = [];
  if (providersRes.status === "fulfilled" && providersRes.value?.success) {
    const raw = (providersRes.value.data as { providers?: unknown[] } | undefined)?.providers;
    if (Array.isArray(raw)) {
      providers = raw
        .map((row, i) => mapProvider(row as Record<string, unknown>, i))
        .filter(Boolean) as MaterialsTopProvider[];
    }
  }

  return {
    categories,
    products,
    providers,
    brands: [],
    marketPrices: marketPricesFromProducts(products, categories),
  };
}

export async function fetchCatalogProductById(id: string): Promise<Record<string, unknown> | null> {
  const productId = String(id || "").trim();
  if (!productId) return null;
  try {
    const res = await api.productCatalog.getById(productId);
    if (!res.success) return null;
    const data = res.data as { product?: Record<string, unknown> } | Record<string, unknown> | undefined;
    if (data && typeof data === "object" && "product" in data && data.product) {
      return data.product as Record<string, unknown>;
    }
    return (data as Record<string, unknown>) || null;
  } catch {
    return null;
  }
}
