/** Must never be undefined — invalid URL breaks `generateStaticParams` / sitemap at build time. */
const API_BASE_URL = (
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_API_BASE_URL &&
    String(process.env.NEXT_PUBLIC_API_BASE_URL).trim())
).replace(/\/$/, "");

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
  const json = await fetchJson<
    BackendResponse<{ categories: Array<{ _id: string; name: string; slug: string }> }>
  >("/api/categories?includeSubcategories=true", {
    next: { revalidate: 60 * 60 }, // 1 hour
  });

  return json.data.categories.map((c) => ({
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
    next: { revalidate: 60 }, // 1 minute cache at Next layer
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

/** Paginated public careers jobs for sitemap. */
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

