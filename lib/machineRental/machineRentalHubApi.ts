/**
 * Machine Rental hub — fetch + map backend data into UI shapes (web).
 */

import api from "@/lib/api-client";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import { formatServicePrice } from "@/lib/formatServicePrice";
import {
  RENTAL_CATEGORY_SLUG,
  RENTAL_CATEGORY_SLUG_ALIASES,
  RENTAL_CATEGORY_TINTS,
  RENTAL_FALLBACK_CATEGORIES,
  formatRentalPriceLabel,
  isRentalListingRow,
  rentalMarkFromName,
  resolveRentalCategoryKey,
  slugifyRentalId,
  type RentalMachine,
  type RentalMachineCategory,
  type RentalTopProvider,
} from "@/lib/machineRental/machineRentalHubCatalog";
import { resolveMachineRentalMediaUrl } from "@/lib/machineRental/media";

export type RentalHubData = {
  categories: RentalMachineCategory[];
  machines: RentalMachine[];
  providers: RentalTopProvider[];
};

export type RentalHubFetchOpts = {
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

function pickTint(index: number): string {
  return RENTAL_CATEGORY_TINTS[index % RENTAL_CATEGORY_TINTS.length];
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

function mapCategory(name: string, index: number): RentalMachineCategory {
  const id = resolveRentalCategoryKey(name) || slugifyRentalId(name) || `cat-${index}`;
  return {
    id,
    name: String(name).trim() || "Machine",
    mark: rentalMarkFromName(name),
    tint: pickTint(index),
  };
}

type RawRow = Record<string, unknown>;

function mapMachine(raw: RawRow, fallbackCategoryId: string, asService = false): RentalMachine | null {
  const id = String(raw?._id || raw?.id || "").trim();
  if (!id) return null;
  const name = String(raw?.name || raw?.title || "").trim();
  if (!name) return null;

  const metadata = raw?.metadata as Record<string, unknown> | undefined;
  const sub = String(
    raw?.subcategory || raw?.materialTypeKey || metadata?.machineType || ""
  ).trim();
  const categoryId =
    resolveRentalCategoryKey(sub) || slugifyRentalId(sub) || fallbackCategoryId || "general";
  const images = Array.isArray(raw?.images) ? raw.images : [];
  const imageUri =
    resolveMachineRentalMediaUrl(String(raw?.image || "")) ||
    resolveMachineRentalMediaUrl(String(images[0] || "")) ||
    undefined;

  let priceLabel = "";
  if (asService) {
    priceLabel = formatServicePrice({
      price: raw?.price as number | string | null | undefined,
      priceMode: raw?.priceMode as string | null | undefined,
      priceMin: raw?.priceMin as number | string | null | undefined,
      priceMax: raw?.priceMax as number | string | null | undefined,
      priceType: raw?.priceType as string | null | undefined,
    });
    if (priceLabel === "Contact for pricing") priceLabel = "";
  } else {
    priceLabel = formatRentalPriceLabel({
      suggestedPriceDaily: raw?.suggestedPriceDaily as number | null | undefined,
      suggestedPriceHourly: raw?.suggestedPriceHourly as number | null | undefined,
      suggestedPriceMin: raw?.suggestedPriceMin as number | null | undefined,
      suggestedPriceMax: raw?.suggestedPriceMax as number | null | undefined,
      suggestedPriceType: raw?.suggestedPriceType as string | null | undefined,
    });
  }

  const priceMinRaw = Number(raw?.suggestedPriceDaily ?? raw?.suggestedPriceMin ?? raw?.price);
  const priceMin = Number.isFinite(priceMinRaw) && priceMinRaw > 0 ? priceMinRaw : undefined;

  return {
    id,
    categoryId,
    categoryName: sub || undefined,
    name,
    priceLabel: priceLabel || (priceMin ? `₹${Math.round(priceMin).toLocaleString("en-IN")} / day` : ""),
    priceMin,
    imageUri,
    available: raw?.isActive !== false && raw?.available !== false,
    ...(asService
      ? {
          serviceId: id,
          slug: String(raw?.slug || "").trim() || undefined,
        }
      : {}),
  };
}

function mapProvider(raw: RawRow, index: number): RentalTopProvider | null {
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
    mark: rentalMarkFromName(name),
    specialty: String(
      raw?.specialty || primaryCategory?.name || raw?.primarySubcategory || "Machine Rental"
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
  for (const slug of RENTAL_CATEGORY_SLUG_ALIASES) {
    try {
      const res = await api.categories.getSubcategories(slug);
      if (!res.success) continue;
      const names = getSubcategoryNames((res.data as { subcategories?: unknown } | undefined)?.subcategories);
      if (names.length > 0) return names;
    } catch {
      /* try next slug */
    }
  }
  return [];
}

export async function fetchRentalHubData(opts?: RentalHubFetchOpts): Promise<RentalHubData> {
  const lat = opts?.lat;
  const lng = opts?.lng;
  const radiusKm = opts?.radiusKm ?? 50;
  const locParams =
    lat != null && lng != null ? { lat, lng, radiusKm } : {};

  const [subNames, catalogRes, providersRes, servicesRes] = await Promise.allSettled([
    fetchSubcategories(),
    api.productCatalog.list({
      categorySlug: RENTAL_CATEGORY_SLUG,
      limit: 120,
      page: 1,
    }),
    api.providers.getAll({
      categorySlug: RENTAL_CATEGORY_SLUG,
      limit: 12,
      page: 1,
      sort: lat != null && lng != null ? "distance" : "rating",
      ...locParams,
    }),
    api.services.getAll({
      category: RENTAL_CATEGORY_SLUG,
      limit: 60,
      page: 1,
      sort: "-rating",
    }),
  ]);

  let categories: RentalMachineCategory[] = [];
  if (subNames.status === "fulfilled" && subNames.value.length > 0) {
    categories = subNames.value.map((n, i) => mapCategory(n, i));
  }

  const catalogLists: RawRow[] = [];
  const pushCatalogProducts = (rawProducts: unknown) => {
    if (!Array.isArray(rawProducts)) return;
    for (const row of rawProducts) {
      if (isRentalListingRow(row as RawRow)) catalogLists.push(row as RawRow);
    }
  };

  if (catalogRes.status === "fulfilled" && catalogRes.value?.success) {
    pushCatalogProducts((catalogRes.value.data as { products?: unknown } | undefined)?.products);
  }
  if (catalogLists.length === 0) {
    try {
      const alt = await api.productCatalog.list({
        categorySlug: "machine-rental",
        limit: 120,
        page: 1,
      });
      if (alt.success) {
        pushCatalogProducts((alt.data as { products?: unknown } | undefined)?.products);
      }
    } catch {
      /* ignore */
    }
  }

  let machines: RentalMachine[] = [];
  if (catalogLists.length > 0) {
    machines = uniqueById(
      catalogLists
        .map((row) => mapMachine(row, categories[0]?.id || "general"))
        .filter(Boolean) as RentalMachine[]
    );
  }

  const serviceMachines: RentalMachine[] = [];
  const ingestServices = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const row of list) {
      if (!isRentalListingRow(row as RawRow)) continue;
      const mapped = mapMachine(row as RawRow, categories[0]?.id || "general", true);
      if (mapped) serviceMachines.push(mapped);
    }
  };

  if (servicesRes.status === "fulfilled" && servicesRes.value?.success) {
    ingestServices((servicesRes.value.data as { services?: unknown } | undefined)?.services);
  }
  if (serviceMachines.length === 0) {
    try {
      const altServices = await api.services.getAll({
        category: "machine-rental",
        limit: 60,
        page: 1,
        sort: "-rating",
      });
      if (altServices.success) {
        ingestServices((altServices.data as { services?: unknown } | undefined)?.services);
      }
    } catch {
      /* ignore */
    }
  }

  machines = uniqueById([...serviceMachines, ...machines]);

  if (categories.length > 0) {
    const seen = new Map<string, RentalMachineCategory>();
    categories.forEach((c) => {
      if (!seen.has(c.id)) seen.set(c.id, c);
    });
    categories = Array.from(seen.values());
  } else if (machines.length > 0) {
    const seen = new Map<string, RentalMachineCategory>();
    machines.forEach((m, i) => {
      if (seen.has(m.categoryId)) return;
      seen.set(m.categoryId, {
        id: m.categoryId,
        name: (m.categoryName || m.categoryId)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        mark: rentalMarkFromName(m.categoryName || m.categoryId),
        tint: pickTint(i),
      });
    });
    categories = Array.from(seen.values());
  } else {
    categories = RENTAL_FALLBACK_CATEGORIES.map((n, i) => mapCategory(n, i));
  }

  let providers: RentalTopProvider[] = [];
  if (providersRes.status === "fulfilled" && providersRes.value?.success) {
    const raw = (providersRes.value.data as { providers?: unknown } | undefined)?.providers;
    if (Array.isArray(raw)) {
      providers = uniqueById(raw.map(mapProvider).filter(Boolean) as RentalTopProvider[]);
    }
  }

  return { categories, machines, providers };
}

export async function fetchRentalMachinesByCategory(categoryId: string): Promise<RentalMachine[]> {
  const key = resolveRentalCategoryKey(categoryId) || String(categoryId || "").trim();
  if (!key) return [];
  try {
    const res = await api.productCatalog.list({
      categorySlug: RENTAL_CATEGORY_SLUG,
      subcategory: key,
      limit: 100,
      page: 1,
    });
    let mapped: RentalMachine[] = [];
    if (res.success) {
      const rawProducts = (res.data as { products?: unknown } | undefined)?.products;
      if (Array.isArray(rawProducts)) {
        mapped = uniqueById(
          rawProducts
            .filter((row) => isRentalListingRow(row as RawRow))
            .map((row) => mapMachine(row as RawRow, key))
            .filter(Boolean) as RentalMachine[]
        );
      }
    }
    const filtered = mapped.filter((m) => m.categoryId === key);
    if (filtered.length > 0) return filtered;

    const hub = await fetchRentalHubData();
    const fromHub = hub.machines.filter(
      (m) => m.categoryId === key || resolveRentalCategoryKey(m.categoryName || "") === key
    );
    return fromHub.length > 0 ? fromHub : mapped;
  } catch {
    return [];
  }
}
