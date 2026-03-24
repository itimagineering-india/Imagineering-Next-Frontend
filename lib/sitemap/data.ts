import type { SitemapCategory, SitemapProduct } from "./types";

function getApiBaseUrl(): string {
  const raw =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL?.trim() : undefined;
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:5000";
}

type SearchApiService = {
  _id?: string;
  slug?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | Date | null;
  inStock?: boolean;
  stock?: number;
  updatedAt?: string | Date;
};

type SearchApiResponse = {
  success?: boolean;
  data?: { services?: SearchApiService[] };
  pagination?: { page: number; pages: number; total?: number };
};

type CategoriesApiResponse = {
  success?: boolean;
  data?: {
    categories?: Array<{
      slug?: string;
      updatedAt?: string | Date;
    }>;
  };
};

function toIso(d: string | Date | undefined): string {
  if (!d) return new Date().toISOString();
  try {
    return new Date(d).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * All public categories for sitemap URLs (`/category/[slug]`).
 * Backed by GET /api/categories.
 */
export async function getAllCategories(): Promise<SitemapCategory[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/categories?includeSubcategories=true`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = (await res.json()) as CategoriesApiResponse;
  const list = json?.data?.categories;
  if (!Array.isArray(list)) return [];
  return list
    .map((c) => {
      const slug = typeof c.slug === "string" ? c.slug.trim() : "";
      if (!slug) return null;
      return { slug, updatedAt: toIso(c.updatedAt) };
    })
    .filter((c): c is SitemapCategory => c != null);
}

const MAX_SEARCH_PAGES = 200;

/**
 * All indexable products/services for sitemap (`/service/[slug]` or `/product/[slug]`).
 * Paginates GET /api/search until done. Filters inactive / deleted / optional out-of-stock.
 */
export async function getAllProducts(options?: {
  /** When true (default), exclude products with `inStock === false`. */
  requireInStock?: boolean;
}): Promise<SitemapProduct[]> {
  const requireInStock = options?.requireInStock !== false;
  const base = getApiBaseUrl();
  const out: SitemapProduct[] = [];
  const seen = new Set<string>();
  let page = 1;
  const limit = 100;
  let totalPages = 1;

  do {
    const url = new URL(`${base}/api/search`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort", "-rating");

    const res = await fetch(url.toString(), {
      cache: "no-store",
    });
    if (!res.ok) break;

    const json = (await res.json()) as SearchApiResponse;
    totalPages = Math.max(1, json.pagination?.pages ?? 1);
    const services = json.data?.services ?? [];

    for (const s of services) {
      const slug =
        typeof s.slug === "string" && s.slug.trim()
          ? s.slug.trim()
          : s._id
            ? String(s._id)
            : "";
      if (!slug || seen.has(slug)) continue;

      const isActive = s.isActive !== false;
      const isDeleted =
        s.isDeleted === true ||
        (s.deletedAt != null && s.deletedAt !== "");
      let inStock = true;
      if (typeof s.inStock === "boolean") inStock = s.inStock;
      else if (typeof s.stock === "number") inStock = s.stock > 0;

      if (!isActive || isDeleted) continue;
      if (requireInStock && !inStock) continue;

      seen.add(slug);
      out.push({
        slug,
        updatedAt: toIso(s.updatedAt),
        isActive,
        isDeleted,
        inStock,
      });
    }

    page += 1;
  } while (page <= totalPages && page <= MAX_SEARCH_PAGES);

  return out;
}
