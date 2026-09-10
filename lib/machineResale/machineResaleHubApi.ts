/**
 * Machine Resale hub — fetch + map backend listings for sale (web).
 */

import api from "@/lib/api-client";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import { resolveMachineRentalMediaUrl } from "@/lib/machineRental/media";
import {
  RESALE_CATEGORY_SLUG_ALIASES,
  RESALE_CATEGORY_TINTS,
  RESALE_FALLBACK_CATEGORIES,
  formatResalePriceLabel,
  isResaleListingRow,
  resolveResaleCategoryKey,
  resaleMarkFromName,
  slugifyResaleId,
  type ResaleMachine,
  type ResaleMachineCategory,
  type ResaleTopProvider,
} from "@/lib/machineResale/machineResaleHubCatalog";

export type ResaleHubData = {
  categories: ResaleMachineCategory[];
  machines: ResaleMachine[];
  providers: ResaleTopProvider[];
};

export type ResaleHubFetchOpts = {
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

function pickTint(index: number): string {
  return RESALE_CATEGORY_TINTS[index % RESALE_CATEGORY_TINTS.length];
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = String(item.id || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function mapCategory(name: string, index: number): ResaleMachineCategory {
  const id = resolveResaleCategoryKey(name) || slugifyResaleId(name) || `cat-${index}`;
  return {
    id,
    name: String(name).trim() || "Machine",
    mark: resaleMarkFromName(name),
    tint: pickTint(index),
  };
}

type RawRow = Record<string, unknown>;

function mapMachine(raw: RawRow, fallbackCategoryId: string): ResaleMachine | null {
  const id = String(raw?._id || raw?.id || "").trim();
  if (!id) return null;
  const name = String(raw?.name || raw?.title || "").trim();
  if (!name) return null;

  const metadata = raw?.metadata as Record<string, unknown> | undefined;
  const sub = String(
    raw?.subcategory || raw?.materialTypeKey || metadata?.machineType || ""
  ).trim();
  const categoryId =
    resolveResaleCategoryKey(sub) || slugifyResaleId(sub) || fallbackCategoryId || "general";
  const images = Array.isArray(raw?.images) ? raw.images : [];
  const imageUri =
    resolveMachineRentalMediaUrl(String(raw?.image || "")) ||
    resolveMachineRentalMediaUrl(String(images[0] || "")) ||
    undefined;

  let priceLabel = formatResalePriceLabel({
    price: raw?.price as number | string | null | undefined,
    priceMode: raw?.priceMode as string | null | undefined,
    priceMin: raw?.priceMin as number | string | null | undefined,
    priceMax: raw?.priceMax as number | string | null | undefined,
  });
  if (!priceLabel) {
    const n = Number(raw?.price ?? raw?.priceMin);
    if (Number.isFinite(n) && n > 0) {
      priceLabel = `₹${Math.round(n).toLocaleString("en-IN")}`;
    }
  }

  const priceMinRaw = Number(raw?.priceMin ?? raw?.price);
  const priceMin = Number.isFinite(priceMinRaw) && priceMinRaw > 0 ? priceMinRaw : undefined;

  return {
    id,
    categoryId,
    categoryName: sub || undefined,
    name,
    priceLabel,
    priceMin,
    imageUri,
    available: raw?.isActive !== false && raw?.available !== false,
    serviceId: id,
    slug: String(raw?.slug || "").trim() || undefined,
  };
}

function mapProvider(raw: RawRow, index: number): ResaleTopProvider | null {
  const id = String(raw?._id || raw?.id || "").trim();
  if (!id) return null;
  const user = raw?.user as Record<string, unknown> | undefined;
  const name = String(raw?.businessName || user?.name || raw?.name || "").trim();
  if (!name) return null;

  const ratingObj = raw?.rating as Record<string, unknown> | undefined;
  const rating = Number(ratingObj?.average ?? raw?.rating ?? raw?.avgRating ?? 0);
  const reviewCount = Number(ratingObj?.count ?? raw?.reviewCount ?? 0);
  const distanceKm = Number(raw?.distanceKm);
  const location = raw?.location as Record<string, unknown> | undefined;
  const address = raw?.address as Record<string, unknown> | undefined;
  const businessAddress = raw?.businessAddress as Record<string, unknown> | undefined;
  const primaryCategory = raw?.primaryCategory as Record<string, unknown> | undefined;
  const city = String(
    location?.city || raw?.city || address?.city || businessAddress?.city || ""
  ).trim();

  return {
    id,
    name,
    mark: resaleMarkFromName(name),
    specialty: String(
      raw?.specialty || primaryCategory?.name || raw?.primarySubcategory || "Machine Resale"
    ).trim(),
    city: city || "Nearby",
    rating: Number.isFinite(rating) && rating > 0 ? rating : 4.5,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
    responseMins: Number(raw?.avgResponseMins) || 45,
    distanceKm: Number.isFinite(distanceKm) && distanceKm >= 0 ? distanceKm : 0,
    verified: Boolean(raw?.verified || raw?.isVerified || raw?.kycVerified),
    tint: pickTint(index),
  };
}

async function fetchSubcategories(): Promise<string[]> {
  for (const slug of RESALE_CATEGORY_SLUG_ALIASES) {
    try {
      const res = await api.categories.getSubcategories(slug);
      if (!res.success) continue;
      const names = getSubcategoryNames(
        (res.data as { subcategories?: unknown } | undefined)?.subcategories
      );
      if (names.length > 0) return names;
    } catch {
      /* try next */
    }
  }
  return [];
}

export async function fetchResaleHubData(opts?: ResaleHubFetchOpts): Promise<ResaleHubData> {
  const lat = opts?.lat;
  const lng = opts?.lng;
  const radiusKm = opts?.radiusKm ?? 50;
  const locParams =
    lat != null && lng != null ? { lat, lng, radiusKm } : {};

  const [subNames, providersRes, ...serviceResults] = await Promise.all([
    fetchSubcategories(),
    api.providers
      .getAll({
        categorySlug: RESALE_CATEGORY_SLUG_ALIASES[0],
        limit: 12,
        page: 1,
        sort: lat != null && lng != null ? "distance" : "rating",
        ...locParams,
      })
      .catch(() => null),
    ...RESALE_CATEGORY_SLUG_ALIASES.map((slug) =>
      api.services
        .getAll({
          category: slug,
          limit: 80,
          page: 1,
          sort: lat != null && lng != null ? "distance" : "-rating",
          ...locParams,
        })
        .catch(() => null)
    ),
  ]);

  let categories: ResaleMachineCategory[] = [];
  if (subNames.length > 0) {
    categories = subNames.map((n, i) => mapCategory(n, i));
  }

  const serviceMachines: ResaleMachine[] = [];
  for (const res of serviceResults) {
    if (!res?.success) continue;
    const list = (res.data as { services?: unknown } | undefined)?.services;
    if (!Array.isArray(list)) continue;
    for (const row of list) {
      if (!isResaleListingRow(row as RawRow)) continue;
      const mapped = mapMachine(row as RawRow, categories[0]?.id || "general");
      if (mapped) serviceMachines.push(mapped);
    }
  }

  let machines = uniqueById(serviceMachines);

  if (categories.length === 0 && machines.length > 0) {
    const seen = new Map<string, ResaleMachineCategory>();
    machines.forEach((m, i) => {
      if (seen.has(m.categoryId)) return;
      seen.set(m.categoryId, {
        id: m.categoryId,
        name: (m.categoryName || m.categoryId)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        mark: resaleMarkFromName(m.categoryName || m.categoryId),
        tint: pickTint(i),
      });
    });
    categories = Array.from(seen.values());
  } else if (categories.length === 0) {
    categories = RESALE_FALLBACK_CATEGORIES.map((n, i) => mapCategory(n, i));
  }

  let providers: ResaleTopProvider[] = [];
  if (providersRes?.success) {
    const raw = (providersRes.data as { providers?: unknown } | undefined)?.providers;
    if (Array.isArray(raw)) {
      providers = uniqueById(raw.map(mapProvider).filter(Boolean) as ResaleTopProvider[]);
    }
  }
  if (providers.length === 0) {
    for (const slug of RESALE_CATEGORY_SLUG_ALIASES.slice(1)) {
      try {
        const alt = await api.providers.getAll({
          categorySlug: slug,
          limit: 12,
          page: 1,
          sort: lat != null && lng != null ? "distance" : "rating",
          ...locParams,
        });
        if (!alt.success) continue;
        const raw = (alt.data as { providers?: unknown } | undefined)?.providers;
        if (Array.isArray(raw) && raw.length > 0) {
          providers = uniqueById(raw.map(mapProvider).filter(Boolean) as ResaleTopProvider[]);
          break;
        }
      } catch {
        /* next */
      }
    }
  }

  return { categories, machines, providers };
}

export async function fetchResaleMachinesByCategory(categoryId: string): Promise<ResaleMachine[]> {
  const key = resolveResaleCategoryKey(categoryId) || String(categoryId || "").trim();
  if (!key) return [];
  const hub = await fetchResaleHubData();
  return hub.machines.filter(
    (m) => m.categoryId === key || resolveResaleCategoryKey(m.categoryName || "") === key
  );
}
