import { CITIES } from "@/constants/cities";
import { MACHINE_RENTAL_FALLBACK_TYPES } from "@/lib/machineRental";
import { MACHINE_RESALE_FALLBACK_TYPES } from "@/lib/machineResale";
import { slugifyRentalId } from "@/lib/machineRental/machineRentalHubCatalog";
import { getSiteUrl } from "@/lib/site-url";
import {
  STATIC_SEO_PATHS,
  SITEMAP_CALCULATOR_TYPE_SLUGS,
  SITEMAP_MATERIALS_TYPE_KEYS,
  getProductPathPrefix,
} from "./constants";
import type { SitemapUrlEntry } from "./types";
import { getAllCategories, getAllProducts, getPublicProvidersForSitemap } from "./data";

function escapeLocPath(segment: string): string {
  return encodeURIComponent(segment).replace(/%2F/gi, "/");
}

function pushUnique(
  entries: SitemapUrlEntry[],
  seen: Set<string>,
  entry: SitemapUrlEntry
): void {
  if (seen.has(entry.loc)) return;
  seen.add(entry.loc);
  entries.push(entry);
}

/** Build full URL list for sitemap (no query strings, no auth/cart/checkout paths). */
export async function collectSitemapUrlEntries(): Promise<SitemapUrlEntry[]> {
  const base = getSiteUrl();
  const productPrefix = getProductPathPrefix();
  const now = new Date().toISOString();

  const [categories, products, providers] = await Promise.all([
    getAllCategories(),
    getAllProducts({ requireInStock: true }),
    getPublicProvidersForSitemap(),
  ]);

  const entries: SitemapUrlEntry[] = [];
  const seen = new Set<string>();

  for (const path of STATIC_SEO_PATHS) {
    const loc = path === "/" ? `${base}/` : `${base}${path}`;
    const isHome = path === "/";
    pushUnique(entries, seen, {
      loc,
      lastmod: now,
      changefreq: isHome ? "weekly" : "monthly",
      priority: isHome ? 1.0 : 0.5,
    });
  }

  for (const city of CITIES) {
    if (!city.slug) continue;
    pushUnique(entries, seen, {
      loc: `${base}/${escapeLocPath(city.slug)}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.75,
    });
  }

  // GATED: /category/{slug}/{city} — category×city listing SSR calls /api/search, which
  // previously failed on nested `provider.user` populate (Service.provider → User).
  // Re-enable when: (1) search populate uses User fields only, (2) /api/search returns
  // 200 for representative category×city queries, (3) listing pages render real content.
  // Set INCLUDE_CATEGORY_CITY_SITEMAP_URLS = true after that verification.
  const INCLUDE_CATEGORY_CITY_SITEMAP_URLS = false;

  for (const c of categories) {
    if (!c.slug) continue;
    pushUnique(entries, seen, {
      loc: `${base}/category/${escapeLocPath(c.slug)}`,
      lastmod: c.updatedAt,
      changefreq: "weekly",
      priority: 0.8,
    });

    if (INCLUDE_CATEGORY_CITY_SITEMAP_URLS) {
      for (const city of CITIES) {
        if (!city.slug) continue;
        pushUnique(entries, seen, {
          loc: `${base}/category/${escapeLocPath(c.slug)}/${escapeLocPath(city.slug)}`,
          lastmod: c.updatedAt,
          changefreq: "weekly",
          priority: 0.7,
        });
      }
    }
  }

  for (const key of SITEMAP_MATERIALS_TYPE_KEYS) {
    pushUnique(entries, seen, {
      loc: `${base}/construction-materials/${escapeLocPath(key)}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.65,
    });
  }

  for (const name of MACHINE_RENTAL_FALLBACK_TYPES) {
    const key = slugifyRentalId(name);
    if (!key) continue;
    pushUnique(entries, seen, {
      loc: `${base}/machine-rental/${escapeLocPath(key)}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  for (const name of MACHINE_RESALE_FALLBACK_TYPES) {
    const key = slugifyRentalId(name);
    if (!key) continue;
    pushUnique(entries, seen, {
      loc: `${base}/machine-resale/${escapeLocPath(key)}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  for (const slug of SITEMAP_CALCULATOR_TYPE_SLUGS) {
    pushUnique(entries, seen, {
      loc: `${base}/construction-calculator/${escapeLocPath(slug)}`,
      lastmod: now,
      changefreq: "monthly",
      priority: 0.55,
    });
  }

  for (const p of products) {
    if (!p.slug) continue;
    pushUnique(entries, seen, {
      loc: `${base}${productPrefix}/${escapeLocPath(p.slug)}`,
      lastmod: p.updatedAt,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  for (const provider of providers) {
    if (!provider.id) continue;
    pushUnique(entries, seen, {
      loc: `${base}/provider/${escapeLocPath(provider.id)}`,
      lastmod: provider.updatedAt,
      changefreq: "weekly",
      priority: 0.55,
    });
  }

  return entries;
}
