/** Must always be a valid base URL string — invalid URL breaks `generateStaticParams` / sitemap at build time. */
import {
  normalizeCmsBanners,
  normalizeHomeCategorySections,
  normalizeHomeTopProviders,
  type CmsBanner,
  type HomeCategorySection,
  type HomeTopProvider,
} from "@/lib/home-data";

function getApiBaseUrl(): string {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
      : undefined;
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:5000";
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Shared API types for the Next.js app.
 * These are thin wrappers over the existing Express API so we don't break
 * current Vite/React consumers.
 */

type BackendResponse<T> = {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type ServiceSummary = {
  id: string;
  slug?: string;
  title: string;
  shortDescription?: string;
  price?: number;
  priceType?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
  };
};

export type ServiceDetail = {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  shortDescription?: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
    interactionType?: string;
  };
  price?: number;
  priceType?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
  };
};

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    // Allow Next.js caching hints from caller via options.next
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

/** Fetch JSON; returns null on network/HTTP errors (for SEO metadata). */
async function fetchJsonMaybe<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Get all active categories (for navigation, homepage, sitemaps). */
export async function getCategories(): Promise<Category[]> {
  const json = await fetchJsonMaybe<
    BackendResponse<{ categories: Array<{ _id: string; name: string; slug: string }> }>
  >("/api/categories?includeSubcategories=true", {
    next: { revalidate: 60 * 60 }, // 1 hour
  });

  const list = json?.data?.categories;
  if (!Array.isArray(list)) return [];

  return list.map((c) => ({
    id: c._id,
    name: c.name,
    slug: c.slug,
  }));
}

/** Get a single category by slug. */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const json = await fetchJson<
    BackendResponse<{ category: { _id: string; name: string; slug: string } }>
  >(`/api/categories/slug/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 * 60 },
  });

  if (!json?.data?.category) return null;

  const c = json.data.category;
  return { id: c._id, name: c.name, slug: c.slug };
}

/** Params for service search used by category/city/locality listing pages. */
export type SearchServicesParams = {
  categorySlug?: string;
  locationText?: string; // city or locality
  page?: number;
  limit?: number;
  sort?: string;
};

export type SearchServicesResult = {
  services: ServiceSummary[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/** Call the existing /api/search endpoint for programmatic SEO listings. */
export async function searchServices(
  params: SearchServicesParams,
): Promise<SearchServicesResult> {
  const search = new URLSearchParams();

  if (params.categorySlug) search.set("category", params.categorySlug);
  if (params.locationText) search.set("location", params.locationText);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.sort) search.set("sort", params.sort);

  const json = await fetchJson<
    BackendResponse<{
      services: any[];
    }>
  >(`/api/search?${search.toString()}`, {
    // Avoid Next.js data cache 2MB cap when /api/search returns very large payloads
    cache: "no-store",
  });

  const { services } = json.data;
  const pagination = json.pagination ?? {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    total: services.length,
    pages: 1,
  };

  const mapped: ServiceSummary[] = services.map((s: any) => ({
    id: s._id,
    slug: s.slug,
    title: s.title,
    shortDescription: s.shortDescription,
    price: s.price,
    priceType: s.priceType,
    image: s.images?.[0] || s.image,
    rating: s.rating,
    reviewCount: s.reviewCount,
    location: {
      address: s.location?.address,
      city: s.location?.city,
      state: s.location?.state,
    },
  }));

  return {
    services: mapped,
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    pages: pagination.pages,
  };
}

/** Fetch full service details by ID (used for /service/[serviceSlug] SEO page). */
export async function getServiceById(serviceId: string): Promise<ServiceDetail | null> {
  const json = await fetchJson<
    BackendResponse<{ service: any; isFavorite?: boolean; similarServices?: any[] }>
  >(`/api/services/${encodeURIComponent(serviceId)}`, {
    next: { revalidate: 5 * 60 },
  });

  const s = json.data.service;
  if (!s) return null;

  return {
    id: s._id,
    slug: s.slug,
    title: s.title,
    description: s.description,
    shortDescription: s.shortDescription,
    category: s.category,
    price: s.price,
    priceType: s.priceType,
    images: s.images ?? (s.image ? [s.image] : []),
    rating: s.rating,
    reviewCount: s.reviewCount,
    location: s.location,
  };
}

export type ProviderPublicMeta = {
  displayName: string;
  description: string;
  slug?: string;
  image?: string;
};

/** Public provider profile for SEO (minimal fields). */
export async function getProviderPublicMeta(id: string): Promise<ProviderPublicMeta | null> {
  const json = await fetchJsonMaybe<
    BackendResponse<{ provider: Record<string, unknown> }>
  >(`/api/providers/${encodeURIComponent(id)}?servicesLimit=0`, {
    next: { revalidate: 300 },
  });
  const p = json?.data?.provider as
    | {
        businessName?: string;
        bio?: string;
        businessLogo?: string;
        slug?: string;
        user?: { name?: string };
      }
    | undefined;
  if (!p) return null;
  const displayName = (p.businessName || p.user?.name || "Provider") as string;
  const bio = typeof p.bio === "string" ? p.bio : "";
  const description =
    bio.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) ||
    `Verified provider on Imagineering India. View services, pricing, and reviews.`;
  return {
    displayName,
    description,
    slug: typeof p.slug === "string" ? p.slug : undefined,
    image: typeof p.businessLogo === "string" ? p.businessLogo : undefined,
  };
}

export type PublicJobMeta = { title: string; description: string };

export async function getPublicJobMeta(idOrSlug: string): Promise<PublicJobMeta | null> {
  const json = await fetchJsonMaybe<{
    success: boolean;
    data: { title?: string; description?: string };
  }>(`/api/jobs/${encodeURIComponent(idOrSlug)}`, {
    next: { revalidate: 300 },
  });
  const j = json?.data;
  if (!j?.title) return null;
  const desc =
    typeof j.description === "string"
      ? j.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
      : `Careers at Imagineering India — ${j.title}.`;
  return { title: j.title, description: desc };
}

export type { CmsBanner, HomeCategorySection, HomeTopProvider };

/** CMS hero/promo banners for a placement (home, provider_dashboard, etc.). */
export async function getHomeBanners(placement = "home"): Promise<CmsBanner[]> {
  const json = await fetchJsonMaybe<BackendResponse<unknown[]>>(
    `/api/cms/banners?placement=${encodeURIComponent(placement)}`,
    { next: { revalidate: 300 } },
  );
  if (!json?.success || !Array.isArray(json.data)) return [];
  return normalizeCmsBanners(json.data);
}

/** Homepage category rows with nested services (nationwide default). */
export async function getHomeCategorySections(params?: {
  limit?: number;
}): Promise<HomeCategorySection[]> {
  const limit = params?.limit ?? 9;
  const json = await fetchJsonMaybe<
    BackendResponse<{ categories?: Array<Record<string, unknown>> }>
  >(`/api/services/by-categories?limit=${limit}`, {
    next: { revalidate: 300 },
  });
  if (!json?.success) return [];
  const raw = json.data?.categories;
  if (!Array.isArray(raw)) return [];
  return normalizeHomeCategorySections(
    raw as Parameters<typeof normalizeHomeCategorySections>[0],
  );
}

/** Top providers for homepage marquee (verified/top-rated with fallbacks). */
export async function getHomeTopProviders(limit = 10): Promise<HomeTopProvider[]> {
  const attempts = [
    { topRated: true, verified: true, limit },
    { verified: true, limit },
    { limit },
  ] as const;

  for (const params of attempts) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, String(value));
    });
    const json = await fetchJsonMaybe<
      BackendResponse<{ providers?: Array<Record<string, unknown>> }>
    >(`/api/providers?${query.toString()}`, {
      next: { revalidate: 300 },
    });
    const list = json?.data?.providers;
    if (json?.success && Array.isArray(list) && list.length > 0) {
      return normalizeHomeTopProviders(
        list as Parameters<typeof normalizeHomeTopProviders>[0],
      ).slice(0, limit);
    }
  }
  return [];
}

export async function getPublicJobsPage(
  page: number,
  limit: number,
): Promise<{ jobs: Array<{ _id: string; slug?: string }>; pages: number }> {
  const json = await fetchJsonMaybe<{
    success: boolean;
    data: Array<{ _id?: string; slug?: string }>;
    pagination?: { page: number; pages: number };
  }>(`/api/jobs?page=${page}&limit=${limit}`, {
    next: { revalidate: 3600 },
  });
  const raw = json?.data;
  if (!Array.isArray(raw)) {
    return { jobs: [], pages: 1 };
  }
  const jobs = raw.map((j) => ({
    _id: String(j._id ?? ""),
    slug: typeof j.slug === "string" ? j.slug : undefined,
  }));
  const pages = json?.pagination?.pages ?? 1;
  return { jobs, pages };
}

export type PublicCategoryWithSubcategories = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  interactionType?: string;
  subcategories: Array<{ name: string; itemTypes: string[] }>;
};

export async function getPublicCategoriesWithSubcategories(): Promise<PublicCategoryWithSubcategories[]> {
  const json = await fetchJsonMaybe<
    BackendResponse<{
      categories: Array<{
        _id: string;
        name: string;
        slug: string;
        icon?: string;
        description?: string;
        interactionType?: string;
        subcategories?: Array<{ name?: string; itemTypes?: string[] }>;
      }>;
    }>
  >("/api/categories?includeSubcategories=true", {
    next: { revalidate: 3600 },
  });

  const list = json?.data?.categories;
  if (!Array.isArray(list)) return [];
  return list.map((category) => ({
    id: category._id,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    description: category.description,
    interactionType: category.interactionType,
    subcategories: Array.isArray(category.subcategories)
      ? category.subcategories.map((sub) => ({
          name: String(sub?.name ?? ""),
          itemTypes: Array.isArray(sub?.itemTypes) ? sub.itemTypes.map(String) : [],
        }))
      : [],
  }));
}

export type PublicBrowseParams = {
  q?: string;
  category?: string;
  subcategory?: string;
  provider?: string;
  location?: string;
  page?: number;
  limit?: number;
  sort?: string;
};

export type PublicBrowseBootstrap = {
  categories: PublicCategoryWithSubcategories[];
  services: any[];
  providers: any[];
  servicePagination?: { page?: number; limit?: number; total?: number; pages?: number; hasMore?: boolean };
  providerPagination?: { page?: number; limit?: number; total?: number; pages?: number };
};

export async function getPublicBrowseBootstrap(
  params: PublicBrowseParams,
): Promise<PublicBrowseBootstrap> {
  const categoriesPromise = getPublicCategoriesWithSubcategories();

  const serviceQuery = new URLSearchParams();
  if (params.q) serviceQuery.set("q", params.q);
  if (params.category) serviceQuery.set("category", params.category);
  if (params.subcategory) serviceQuery.set("subcategory", params.subcategory);
  if (params.provider) serviceQuery.set("provider", params.provider);
  if (params.location) serviceQuery.set("location", params.location);
  serviceQuery.set("page", String(params.page ?? 1));
  serviceQuery.set("limit", String(params.limit ?? 20));
  if (params.sort) serviceQuery.set("sort", params.sort);

  const providerQuery = new URLSearchParams();
  if (params.q) providerQuery.set("q", params.q);
  if (params.category) providerQuery.set("categorySlug", params.category);
  if (params.subcategory) providerQuery.set("subcategory", params.subcategory);
  providerQuery.set("page", "1");
  providerQuery.set("limit", "20");

  const [categories, servicesJson, providersJson] = await Promise.all([
    categoriesPromise,
    fetchJsonMaybe<BackendResponse<{ services?: any[] }> & { pagination?: any }>(
      `/api/services?${serviceQuery.toString()}`,
      { next: { revalidate: 300 } },
    ),
    fetchJsonMaybe<BackendResponse<{ providers?: any[] }> & { pagination?: any }>(
      `/api/providers?${providerQuery.toString()}`,
      { next: { revalidate: 300 } },
    ),
  ]);

  return {
    categories,
    services: Array.isArray(servicesJson?.data?.services) ? servicesJson.data.services : [],
    providers: Array.isArray(providersJson?.data?.providers) ? providersJson.data.providers : [],
    servicePagination: servicesJson?.pagination,
    providerPagination: providersJson?.pagination,
  };
}

export async function getPublicServiceDetailBundle(idOrSlug: string): Promise<{
  service: any | null;
  similarServices: any[];
}> {
  const json = await fetchJsonMaybe<
    BackendResponse<{ service?: any; similarServices?: any[]; isFavorite?: boolean }>
  >(`/api/services/${encodeURIComponent(idOrSlug)}`, {
    next: { revalidate: 300 },
  });
  return {
    service: json?.data?.service ?? null,
    similarServices: Array.isArray(json?.data?.similarServices) ? json!.data!.similarServices : [],
  };
}

export async function getPublicProviderProfileBundle(idOrSlug: string): Promise<{
  provider: any | null;
  services: any[];
  totalServices: number;
  reviews: any[];
}> {
  const providerJson = await fetchJsonMaybe<BackendResponse<{ provider?: any }>>(
    `/api/providers/${encodeURIComponent(idOrSlug)}?servicesLimit=0`,
    { next: { revalidate: 300 } },
  );
  const provider = providerJson?.data?.provider ?? null;
  if (!provider) {
    return { provider: null, services: [], totalServices: 0, reviews: [] };
  }

  const providerId =
    provider?._id ?? provider?.id ?? provider?.user?._id ?? provider?.user ?? idOrSlug;
  const providerUserId =
    provider?.user?._id ?? (typeof provider?.user === "string" ? provider.user : providerId);

  const [servicesJson, reviewsJson] = await Promise.all([
    fetchJsonMaybe<BackendResponse<{ services?: any[]; totalServices?: number }>>(
      `/api/providers/${encodeURIComponent(providerId)}/services?page=1&limit=20`,
      { next: { revalidate: 300 } },
    ),
    providerUserId
      ? fetchJsonMaybe<BackendResponse<{ reviews?: any[] }>>(
          `/api/reviews/provider/${encodeURIComponent(String(providerUserId))}?page=1&limit=20`,
          { next: { revalidate: 300 } },
        )
      : Promise.resolve(null),
  ]);

  return {
    provider,
    services: Array.isArray(servicesJson?.data?.services) ? servicesJson.data.services : [],
    totalServices: Number(servicesJson?.data?.totalServices ?? servicesJson?.data?.services?.length ?? 0),
    reviews: Array.isArray(reviewsJson?.data?.reviews) ? reviewsJson.data.reviews : [],
  };
}

export async function getPublicCareerJobs(params?: {
  search?: string;
  location?: string;
  department?: string;
  employmentType?: string;
  page?: number;
  limit?: number;
}): Promise<{ jobs: any[]; pagination?: any }> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.location) query.set("location", params.location);
  if (params?.department) query.set("department", params.department);
  if (params?.employmentType) query.set("employmentType", params.employmentType);
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 50));
  const json = await fetchJsonMaybe<BackendResponse<any[]> & { pagination?: any }>(
    `/api/jobs?${query.toString()}`,
    { next: { revalidate: 300 } },
  );
  return {
    jobs: Array.isArray(json?.data) ? json.data : [],
    pagination: json?.pagination,
  };
}

export async function getPublicSubscriptionPlans(type: "buyer" | "provider"): Promise<any[]> {
  const json = await fetchJsonMaybe<BackendResponse<{ subscriptions?: any[] }>>(
    `/api/subscriptions/available/${type}`,
    { next: { revalidate: 300 } },
  );
  return Array.isArray(json?.data?.subscriptions) ? json.data.subscriptions : [];
}

export async function getPublicUserJobs(params?: {
  search?: string;
  city?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.city) query.set("city", params.city);
  if (params?.status) query.set("status", params.status);
  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 50));
  const json = await fetchJsonMaybe<BackendResponse<any[]>>(`/api/user-jobs?${query.toString()}`, {
    next: { revalidate: 300 },
  });
  return Array.isArray(json?.data) ? json.data : [];
}

export async function getPublicUserJobDetail(id: string): Promise<any | null> {
  const json = await fetchJsonMaybe<BackendResponse<{ job?: any; application?: any }>>(
    `/api/user-jobs/${encodeURIComponent(id)}?viewer=provider`,
    { next: { revalidate: 120 } },
  );
  if (!json?.success || !json.data?.job) return null;
  return json.data;
}

export async function getPublicCommunityPosts(limit = 20): Promise<any[]> {
  const json = await fetchJsonMaybe<BackendResponse<{ posts?: any[] }>>(
    `/api/community/posts?limit=${limit}`,
    { next: { revalidate: 300 } },
  );
  return Array.isArray(json?.data?.posts) ? json.data.posts : [];
}

export async function getPublicCommunityPostDetail(slug: string): Promise<{
  post: any | null;
  comments: any[];
} | null> {
  const json = await fetchJsonMaybe<BackendResponse<{ post?: any; comments?: any[] }>>(
    `/api/community/posts/${encodeURIComponent(slug)}`,
    { next: { revalidate: 300 } },
  );
  if (!json?.success || !json.data?.post) return null;
  return {
    post: json.data.post,
    comments: Array.isArray(json.data.comments) ? json.data.comments : [],
  };
}

