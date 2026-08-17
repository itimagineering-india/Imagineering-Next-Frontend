/**
 * Manpower hub — fetch + map backend data into UI shapes (web).
 */

import api from "@/lib/api-client";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import { formatServicePrice } from "@/lib/formatServicePrice";
import { resolveManpowerMediaUrl } from "@/lib/manpower/media";
import {
  MANPOWER_CATEGORY_SLUG,
  MANPOWER_CATEGORY_TINTS,
  MANPOWER_FALLBACK_TRADES,
  formatManpowerCatalogPriceLabel,
  formatManpowerIndicativePrice,
  indicativeRatesForTrade,
  inferManpowerCatalogHireMode,
  isManpowerVisitingCharge,
  filterManpowerSpecificWorks,
  looksLikeConstructionMaterialSubcategory,
  manpowerMarkFromName,
  resolveManpowerTradeKey,
  slugifyManpowerId,
  type ManpowerCatalogHireMode,
  type ManpowerServiceItem,
  type ManpowerSpecificWorkItem,
  type ManpowerTopProvider,
  type ManpowerTrade,
} from "@/lib/manpower/manpowerHubCatalog";

export type ManpowerHubData = {
  trades: ManpowerTrade[];
  services: ManpowerServiceItem[];
  providers: ManpowerTopProvider[];
  specificWorks: ManpowerSpecificWorkItem[];
};

export type ManpowerHubFetchOpts = {
  city?: string | null;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

function normalizeCityToken(raw?: string | null): string {
  return String(raw || "")
    .toLowerCase()
    .split(",")[0]
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const CITY_ALIASES: Record<string, string> = {
  bengaluru: "bangalore",
  "new-delhi": "delhi",
  ncr: "delhi",
  bombay: "mumbai",
  madras: "chennai",
  calcutta: "kolkata",
  poona: "pune",
  cochin: "kochi",
  gurgaon: "gurugram",
};

function canonicalCityToken(raw?: string | null): string {
  const key = normalizeCityToken(raw);
  return CITY_ALIASES[key] || key;
}

function providerMatchesCity(providerCity: string | undefined, targetCity: string): boolean {
  const target = canonicalCityToken(targetCity);
  if (!target) return true;
  const raw = String(providerCity || "").trim();
  if (!raw || /^nearby$/i.test(raw)) return false;
  const city = canonicalCityToken(raw);
  if (!city) return false;
  return city === target || city.includes(target) || target.includes(city);
}

type CatalogProductRaw = {
  _id?: string;
  id?: string;
  name?: string;
  subcategory?: string;
  materialTypeKey?: string;
  suggestedPriceType?: string;
  suggestedPriceMin?: number;
  suggestedPriceMax?: number;
  suggestedPriceHourly?: number;
  suggestedPriceHourlyExtra?: number;
  suggestedPriceDaily?: number;
  images?: string[];
  metadata?: Record<string, string>;
};

function pickTint(index: number): string {
  return MANPOWER_CATEGORY_TINTS[index % MANPOWER_CATEGORY_TINTS.length];
}

function mapTrade(name: string, index: number): ManpowerTrade {
  const id = slugifyManpowerId(name) || `trade-${index}`;
  const rateKey = resolveManpowerTradeKey(name) || id;
  const rates = indicativeRatesForTrade(rateKey);
  return {
    id,
    name: String(name).trim() || "Trade",
    mark: manpowerMarkFromName(name),
    tint: pickTint(index),
    priceDailyLabel: formatManpowerIndicativePrice(rates.daily, "day"),
    priceHourlyLabel: formatManpowerIndicativePrice(rates.hourly, "hour"),
  };
}

function enrichTradePrices(trades: ManpowerTrade[], services: ManpowerServiceItem[]): ManpowerTrade[] {
  return trades.map((trade) => {
    const rates = indicativeRatesForTrade(trade.id);
    const matched = services.filter((s) => s.tradeId === trade.id);
    const dailyFromService = matched.find((s) => /\/\s*day/i.test(s.priceLabel))?.priceLabel;
    const hourlyFromService = matched.find((s) => /\/\s*hr/i.test(s.priceLabel))?.priceLabel;
    const anyPrice = matched.find((s) => s.priceLabel && !/contact|quote/i.test(s.priceLabel))
      ?.priceLabel;

    return {
      ...trade,
      priceDailyLabel:
        dailyFromService ||
        (anyPrice && !/\/\s*hr/i.test(anyPrice) ? anyPrice : undefined) ||
        formatManpowerIndicativePrice(rates.daily, "day"),
      priceHourlyLabel:
        hourlyFromService ||
        (anyPrice && /\/\s*hr/i.test(anyPrice) ? anyPrice : undefined) ||
        formatManpowerIndicativePrice(rates.hourly, "hour"),
    };
  });
}

function catalogTradeKey(product: CatalogProductRaw): string {
  const sub = String(product.subcategory || "").trim();
  const key = String(product.materialTypeKey || product.metadata?.workerType || "").trim();
  return (
    resolveManpowerTradeKey(sub) ||
    resolveManpowerTradeKey(key) ||
    slugifyManpowerId(sub) ||
    slugifyManpowerId(key) ||
    ""
  );
}

function applyCatalogRateCardPrices(
  trades: ManpowerTrade[],
  products: CatalogProductRaw[]
): ManpowerTrade[] {
  const hourlyByKey = new Map<string, string>();
  const dailyByKey = new Map<string, string>();
  const metaByKey = new Map<
    string,
    {
      catalogProductId?: string;
      priceHourly?: number;
      priceHourlyExtra?: number;
      priceDaily?: number;
    }
  >();

  for (const p of products) {
    const mode = inferManpowerCatalogHireMode(p);
    const key = catalogTradeKey(p);
    if (!key) continue;
    const catalogProductId = String(p._id || p.id || "").trim() || undefined;

    if (mode === "rate_card") {
      const hourlyLabel = formatManpowerCatalogPriceLabel(
        p.suggestedPriceHourly ?? null,
        null,
        "hour",
        p.suggestedPriceHourlyExtra ?? null
      );
      const dailyLabel = formatManpowerCatalogPriceLabel(
        p.suggestedPriceDaily ?? null,
        null,
        "day"
      );
      if (hourlyLabel) hourlyByKey.set(key, hourlyLabel);
      if (dailyLabel) dailyByKey.set(key, dailyLabel);
      metaByKey.set(key, {
        catalogProductId,
        priceHourly:
          p.suggestedPriceHourly != null && p.suggestedPriceHourly > 0
            ? p.suggestedPriceHourly
            : undefined,
        priceHourlyExtra:
          p.suggestedPriceHourlyExtra != null && p.suggestedPriceHourlyExtra > 0
            ? p.suggestedPriceHourlyExtra
            : undefined,
        priceDaily:
          p.suggestedPriceDaily != null && p.suggestedPriceDaily > 0
            ? p.suggestedPriceDaily
            : undefined,
      });
      continue;
    }

    if (mode === "hourly") {
      const label = formatManpowerCatalogPriceLabel(
        p.suggestedPriceHourly ?? p.suggestedPriceMin,
        p.suggestedPriceMax,
        "hour"
      );
      if (label) hourlyByKey.set(key, label);
      const prev = metaByKey.get(key) || {};
      metaByKey.set(key, {
        ...prev,
        catalogProductId: prev.catalogProductId || catalogProductId,
        priceHourly:
          p.suggestedPriceHourly ??
          (p.suggestedPriceMin != null && p.suggestedPriceMin > 0 ? p.suggestedPriceMin : undefined),
      });
    } else if (mode === "daily") {
      const label = formatManpowerCatalogPriceLabel(
        p.suggestedPriceDaily ?? p.suggestedPriceMin,
        p.suggestedPriceMax,
        "day"
      );
      if (label) dailyByKey.set(key, label);
      const prev = metaByKey.get(key) || {};
      metaByKey.set(key, {
        ...prev,
        catalogProductId: prev.catalogProductId || catalogProductId,
        priceDaily:
          p.suggestedPriceDaily ??
          (p.suggestedPriceMin != null && p.suggestedPriceMin > 0 ? p.suggestedPriceMin : undefined),
      });
    }
  }

  if (hourlyByKey.size === 0 && dailyByKey.size === 0 && metaByKey.size === 0) return trades;

  return trades.map((trade) => {
    const keys = [trade.id, resolveManpowerTradeKey(trade.name), resolveManpowerTradeKey(trade.id)].filter(
      Boolean
    ) as string[];
    let hourly = trade.priceHourlyLabel;
    let daily = trade.priceDailyLabel;
    let meta: {
      catalogProductId?: string;
      priceHourly?: number;
      priceHourlyExtra?: number;
      priceDaily?: number;
    } = {};
    if (trade.catalogProductId) meta.catalogProductId = trade.catalogProductId;
    if (trade.priceHourly != null) meta.priceHourly = trade.priceHourly;
    if (trade.priceHourlyExtra != null) meta.priceHourlyExtra = trade.priceHourlyExtra;
    if (trade.priceDaily != null) meta.priceDaily = trade.priceDaily;

    for (const k of keys) {
      if (hourlyByKey.has(k)) hourly = hourlyByKey.get(k);
      if (dailyByKey.has(k)) daily = dailyByKey.get(k);
      const m = metaByKey.get(k);
      if (!m) continue;
      if (!meta.catalogProductId && m.catalogProductId) meta.catalogProductId = m.catalogProductId;
      if (meta.priceHourly == null && m.priceHourly != null) meta.priceHourly = m.priceHourly;
      if (meta.priceHourlyExtra == null && m.priceHourlyExtra != null) {
        meta.priceHourlyExtra = m.priceHourlyExtra;
      }
      if (meta.priceDaily == null && m.priceDaily != null) meta.priceDaily = m.priceDaily;
    }
    return {
      ...trade,
      priceHourlyLabel: hourly,
      priceDailyLabel: daily,
      ...meta,
    };
  });
}

function tradesFromCatalogRateCards(products: CatalogProductRaw[]): ManpowerTrade[] {
  const byKey = new Map<string, { name: string; hourly?: string; daily?: string }>();

  for (const p of products) {
    const mode = inferManpowerCatalogHireMode(p);
    if (mode !== "rate_card" && mode !== "hourly" && mode !== "daily") continue;
    const name = String(p.subcategory || p.name || "").trim();
    if (!name || looksLikeConstructionMaterialSubcategory(name)) continue;
    const key = catalogTradeKey(p) || slugifyManpowerId(name);
    if (!key) continue;
    const entry = byKey.get(key) || { name: String(p.subcategory || name).trim() || name };

    if (mode === "rate_card") {
      entry.hourly =
        formatManpowerCatalogPriceLabel(
          p.suggestedPriceHourly ?? null,
          null,
          "hour",
          p.suggestedPriceHourlyExtra ?? null
        ) || entry.hourly;
      entry.daily =
        formatManpowerCatalogPriceLabel(p.suggestedPriceDaily ?? null, null, "day") || entry.daily;
    } else if (mode === "hourly") {
      entry.hourly =
        formatManpowerCatalogPriceLabel(
          p.suggestedPriceHourly ?? p.suggestedPriceMin,
          p.suggestedPriceMax,
          "hour"
        ) || entry.hourly;
    } else {
      entry.daily =
        formatManpowerCatalogPriceLabel(
          p.suggestedPriceDaily ?? p.suggestedPriceMin,
          p.suggestedPriceMax,
          "day"
        ) || entry.daily;
    }
    byKey.set(key, entry);
  }

  return Array.from(byKey.entries()).map(([id, row], index) => {
    const rates = indicativeRatesForTrade(id);
    const product = products.find((p) => catalogTradeKey(p) === id);
    return {
      id,
      name: row.name,
      mark: manpowerMarkFromName(row.name),
      tint: pickTint(index),
      priceHourlyLabel: row.hourly || formatManpowerIndicativePrice(rates.hourly, "hour"),
      priceDailyLabel: row.daily || formatManpowerIndicativePrice(rates.daily, "day"),
      catalogProductId: product ? String(product._id || product.id || "").trim() || undefined : undefined,
      priceHourly: product?.suggestedPriceHourly,
      priceHourlyExtra: product?.suggestedPriceHourlyExtra,
      priceDaily: product?.suggestedPriceDaily,
    };
  });
}

function mapSpecificWorksFromCatalog(products: CatalogProductRaw[]): ManpowerSpecificWorkItem[] {
  const items: ManpowerSpecificWorkItem[] = [];
  const seenIds = new Set<string>();
  for (const p of products) {
    if (inferManpowerCatalogHireMode(p) !== "specific_work") continue;
    const name = String(p.name || "").trim();
    if (!name) continue;
    const catalogProductId = String(p._id || p.id || "").trim() || undefined;
    const taskId = String(p.metadata?.taskId || "").trim();
    // Prefer unique catalog id — shared metadata.taskId (e.g. "plaster") must not collide.
    let id = catalogProductId || taskId || slugifyManpowerId(name);
    if (seenIds.has(id)) {
      id = catalogProductId
        ? catalogProductId
        : `${id}-${seenIds.size}-${slugifyManpowerId(name)}`;
    }
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    const tradeLabel = String(p.subcategory || "").trim();
    const tradeId = catalogTradeKey(p) || (tradeLabel ? slugifyManpowerId(tradeLabel) : undefined);
    const images = Array.isArray(p.images) ? p.images : [];
    const visiting = isManpowerVisitingCharge(p);
    const price =
      p.suggestedPriceMin != null && p.suggestedPriceMin > 0
        ? p.suggestedPriceMin
        : p.suggestedPriceMax != null && p.suggestedPriceMax > 0
          ? p.suggestedPriceMax
          : undefined;
    items.push({
      id,
      name,
      tradeId: tradeId || undefined,
      tradeLabel: tradeLabel || undefined,
      isVisitingCharge: visiting,
      catalogProductId,
      price,
      priceLabel: formatManpowerCatalogPriceLabel(
        p.suggestedPriceMin,
        p.suggestedPriceMax,
        visiting ? "visiting" : "fixed"
      ),
      imageUri: resolveManpowerMediaUrl(images[0]),
    });
  }
  return items;
}

function mapService(raw: Record<string, unknown>): ManpowerServiceItem | null {
  const id = String(raw?._id || raw?.id || "").trim();
  if (!id) return null;
  const title = String(raw?.title || raw?.name || "").trim();
  if (!title) return null;

  const subcategory = String(raw?.subcategory || raw?.materialTypeKey || "").trim();
  const tradeId = resolveManpowerTradeKey(subcategory) || slugifyManpowerId(subcategory) || "general";
  const providerObj =
    raw?.provider && typeof raw.provider === "object"
      ? (raw.provider as Record<string, unknown>)
      : null;
  const providerName = String(
    raw?.providerBusinessName ||
      providerObj?.businessName ||
      providerObj?.name ||
      raw?.ownerName ||
      "Provider"
  ).trim();
  const providerId = String(
    raw?.providerProfileId || providerObj?.providerId || providerObj?._id || providerObj?.id || ""
  ).trim();

  const images = Array.isArray(raw?.images) ? (raw.images as string[]) : [];
  const imageUri =
    resolveManpowerMediaUrl(raw?.image as string) || resolveManpowerMediaUrl(images[0]);

  const ratingObj = raw?.rating as { average?: number; count?: number } | number | undefined;
  const ratingRaw = Number(
    typeof ratingObj === "object" && ratingObj ? ratingObj.average : ratingObj ?? 0
  );
  const reviewCountRaw = Number(
    typeof ratingObj === "object" && ratingObj
      ? ratingObj.count
      : (raw?.reviewCount as number) ?? 0
  );
  const rating = Number.isFinite(ratingRaw) && ratingRaw > 0 ? ratingRaw : undefined;
  const reviewCount =
    Number.isFinite(reviewCountRaw) && reviewCountRaw > 0 ? Math.floor(reviewCountRaw) : undefined;

  const loc = raw?.location as { city?: string } | undefined;
  const city = String(loc?.city || raw?.city || (providerObj?.location as { city?: string })?.city || "").trim();

  return {
    id,
    title,
    providerName: providerName || "Provider",
    providerId: providerId || undefined,
    tradeId,
    tradeLabel: subcategory || tradeId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    priceLabel: formatServicePrice(raw as Parameters<typeof formatServicePrice>[0]) || "Get quotes",
    rating,
    reviewCount,
    imageUri,
    city: city || undefined,
  };
}

function mapProvider(raw: Record<string, unknown>, index: number): ManpowerTopProvider | null {
  const id = String(raw?._id || raw?.id || "").trim();
  if (!id) return null;
  const user = raw?.user as { name?: string } | undefined;
  const name = String(raw?.businessName || user?.name || raw?.name || "").trim();
  if (!name) return null;

  const ratingObj = raw?.rating as { average?: number; count?: number } | number | undefined;
  const rating = Number(
    typeof ratingObj === "object" && ratingObj
      ? ratingObj.average
      : ratingObj ?? raw?.avgRating ?? 0
  );
  const reviewCount = Number(
    typeof ratingObj === "object" && ratingObj ? ratingObj.count : raw?.reviewCount ?? 0
  );
  const distanceKm = Number(raw?.distanceKm);
  const loc = raw?.location as { city?: string } | undefined;
  const addr = raw?.address as { city?: string } | undefined;
  const business = raw?.businessAddress as { city?: string } | undefined;
  const userLoc = (raw?.user as { location?: { city?: string } } | undefined)?.location;
  const city = String(
    loc?.city || raw?.city || addr?.city || business?.city || userLoc?.city || ""
  ).trim();
  const primaryCategory = raw?.primaryCategory as { name?: string } | undefined;

  return {
    id,
    name,
    mark: manpowerMarkFromName(name),
    specialty: String(
      raw?.specialty || primaryCategory?.name || raw?.primarySubcategory || "Manpower"
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

export function cityForManpowerPricing(raw?: string | null): string | undefined {
  const text = String(raw || "").trim();
  return text || undefined;
}

export async function fetchManpowerCatalogByHireMode(
  hireMode: ManpowerCatalogHireMode,
  city?: string | null
): Promise<CatalogProductRaw[]> {
  try {
    const res = await api.productCatalog.list({
      categorySlug: MANPOWER_CATEGORY_SLUG,
      hireMode,
      limit: 250,
      page: 1,
      city: cityForManpowerPricing(city),
    });
    if (!res.success) return [];
    const list = (res.data as { products?: CatalogProductRaw[] } | undefined)?.products;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function fetchManpowerSpecificWorksForTrade(
  tradeId: string,
  tradeName?: string,
  city?: string | null
): Promise<ManpowerSpecificWorkItem[]> {
  const products = await fetchManpowerCatalogByHireMode("specific_work", city);
  const works = mapSpecificWorksFromCatalog(products);
  return filterManpowerSpecificWorks(works, { tradeId, tradeName });
}

export async function fetchManpowerCatalogProductById(
  id: string,
  city?: string | null
): Promise<CatalogProductRaw | null> {
  const productId = String(id || "").trim();
  if (!productId) return null;
  try {
    const res = await api.productCatalog.getById(productId, {
      city: cityForManpowerPricing(city),
    });
    if (!res.success) return null;
    const product = (res.data as { product?: CatalogProductRaw } | undefined)?.product;
    return product || null;
  } catch {
    return null;
  }
}

export async function findManpowerServiceForCatalogProduct(
  catalogProductId: string,
  opts?: { excludeProviderUserId?: string | null; tradeName?: string }
): Promise<{ serviceId: string; title: string } | null> {
  const id = String(catalogProductId || "").trim();
  const exclude = String(opts?.excludeProviderUserId || "").trim();
  try {
    if (id) {
      const res = await api.services.getAll({
        catalogProductId: id,
        category: MANPOWER_CATEGORY_SLUG,
        limit: 30,
        page: 1,
      });
      if (res.success) {
        const list = (res.data as { services?: unknown[] } | undefined)?.services;
        if (Array.isArray(list) && list.length > 0) {
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
            return {
              serviceId: serviceIdOf(other),
              title: String(other?.title || "").trim(),
            };
          }
        }
      }
    }

    const q = String(opts?.tradeName || "").trim();
    if (!q) return null;
    const loose = await api.services.getAll({
      category: MANPOWER_CATEGORY_SLUG,
      q,
      limit: 20,
      page: 1,
    });
    if (!loose.success) return null;
    const list = (loose.data as { services?: unknown[] } | undefined)?.services;
    if (!Array.isArray(list) || list.length === 0) return null;
    const row = list.find((r) => String((r as Record<string, unknown>)?._id || (r as Record<string, unknown>)?.id || "").trim()) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return {
      serviceId: String(row._id || row.id).trim(),
      title: String(row.title || q).trim(),
    };
  } catch {
    return null;
  }
}

export async function fetchManpowerHubData(
  cityOrOpts?: string | null | ManpowerHubFetchOpts
): Promise<ManpowerHubData> {
  const opts: ManpowerHubFetchOpts =
    cityOrOpts && typeof cityOrOpts === "object"
      ? cityOrOpts
      : { city: typeof cityOrOpts === "string" ? cityOrOpts : undefined };
  const cityQuery = cityForManpowerPricing(opts.city);
  const lat = Number(opts.lat);
  const lng = Number(opts.lng);
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
  const radiusKm = Number(opts.radiusKm) > 0 ? Number(opts.radiusKm) : 50;
  const [subRes, servicesRes, providersRes, catalogRes] = await Promise.allSettled([
    api.categories.getSubcategories(MANPOWER_CATEGORY_SLUG),
    api.services.getAll({
      category: MANPOWER_CATEGORY_SLUG,
      limit: 40,
      page: 1,
      sort: "-rating",
    }),
    api.providers.getAll({
      categorySlug: MANPOWER_CATEGORY_SLUG,
      limit: 24,
      page: 1,
      sort: hasGeo ? "distance" : "rating",
      ...(hasGeo ? { lat, lng, radiusKm } : {}),
    }),
    api.productCatalog.list({
      categorySlug: MANPOWER_CATEGORY_SLUG,
      limit: 250,
      page: 1,
      city: cityQuery,
    }),
  ]);

  let catalogProducts: CatalogProductRaw[] = [];
  if (catalogRes.status === "fulfilled" && catalogRes.value?.success) {
    const list = (catalogRes.value.data as { products?: CatalogProductRaw[] } | undefined)?.products;
    if (Array.isArray(list)) catalogProducts = list;
  }

  let trades: ManpowerTrade[] = [];
  if (subRes.status === "fulfilled" && subRes.value?.success) {
    const rawSubs = (subRes.value.data as { subcategories?: unknown } | undefined)?.subcategories;
    const names = getSubcategoryNames(rawSubs);
    if (names.length > 0) {
      const tradeNames = names.filter((n) => n && !looksLikeConstructionMaterialSubcategory(n));
      const materialHits = names.length - tradeNames.length;
      if (tradeNames.length > 0 && materialHits <= Math.max(2, names.length * 0.35)) {
        trades = tradeNames.map((n, i) => mapTrade(n, i));
      }
    }
  }

  if (trades.length > 0) {
    const seen = new Map<string, ManpowerTrade>();
    trades.forEach((t) => {
      if (!seen.has(t.id)) seen.set(t.id, t);
    });
    trades = Array.from(seen.values());
  } else {
    const fromCatalog = tradesFromCatalogRateCards(catalogProducts);
    trades =
      fromCatalog.length > 0
        ? fromCatalog
        : MANPOWER_FALLBACK_TRADES.map((n, i) => mapTrade(n, i));
  }

  if (catalogProducts.length > 0) {
    trades = applyCatalogRateCardPrices(trades, catalogProducts);
  }

  let services: ManpowerServiceItem[] = [];
  if (servicesRes.status === "fulfilled" && servicesRes.value?.success) {
    const list = (servicesRes.value.data as { services?: unknown[] } | undefined)?.services;
    if (Array.isArray(list)) {
      services = list
        .map((row) => mapService(row as Record<string, unknown>))
        .filter(Boolean) as ManpowerServiceItem[];
    }
  }

  let providers: ManpowerTopProvider[] = [];
  if (providersRes.status === "fulfilled" && providersRes.value?.success) {
    const raw = (providersRes.value.data as { providers?: unknown[] } | undefined)?.providers;
    if (Array.isArray(raw)) {
      providers = raw
        .map((row, i) => mapProvider(row as Record<string, unknown>, i))
        .filter(Boolean) as ManpowerTopProvider[];
    }
  }

  if (cityQuery) {
    providers = providers.filter((p) => providerMatchesCity(p.city, cityQuery));
  }

  const hasLocation = Boolean(cityQuery || hasGeo);
  if (hasLocation && providers.length === 0 && services.length > 0 && cityQuery) {
    const seen = new Map<string, ManpowerTopProvider>();
    services.forEach((s, i) => {
      if (!providerMatchesCity(s.city, cityQuery)) return;
      const pid = String(s.providerId || "").trim();
      if (!pid || seen.has(pid)) return;
      seen.set(pid, {
        id: pid,
        name: s.providerName || "Provider",
        mark: manpowerMarkFromName(s.providerName || "P"),
        specialty: s.tradeLabel || "Manpower",
        city: s.city || cityQuery,
        rating: s.rating && s.rating > 0 ? s.rating : 4.5,
        reviewCount: s.reviewCount || 0,
        responseMins: 45,
        distanceKm: 0,
        verified: false,
        tint: pickTint(i),
      });
    });
    providers = Array.from(seen.values()).slice(0, 16);
  }

  if (trades.length > 0) {
    trades = enrichTradePrices(trades, services);
    if (catalogProducts.length > 0) {
      trades = applyCatalogRateCardPrices(trades, catalogProducts);
    }
  }

  const specificWorks = mapSpecificWorksFromCatalog(catalogProducts);

  return { trades, services, providers, specificWorks };
}
