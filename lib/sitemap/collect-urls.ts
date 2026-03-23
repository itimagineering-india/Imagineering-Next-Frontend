import { getSiteUrl } from "@/lib/site-url";
import { STATIC_SEO_PATHS, getProductPathPrefix } from "./constants";
import type { SitemapUrlEntry } from "./types";
import { getAllCategories, getAllProducts } from "./data";

function escapeLocPath(segment: string): string {
  return encodeURIComponent(segment).replace(/%2F/gi, "/");
}

/** Build full URL list for sitemap (no query strings, no auth/cart paths). */
export async function collectSitemapUrlEntries(): Promise<SitemapUrlEntry[]> {
  const base = getSiteUrl();
  const productPrefix = getProductPathPrefix();

  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts({ requireInStock: true }),
  ]);

  const entries: SitemapUrlEntry[] = [];

  for (const path of STATIC_SEO_PATHS) {
    const loc = path === "/" ? `${base}/` : `${base}${path}`;
    const isHome = path === "/";
    entries.push({
      loc,
      lastmod: new Date().toISOString(),
      changefreq: isHome ? "weekly" : "monthly",
      priority: isHome ? 1.0 : 0.5,
    });
  }

  for (const c of categories) {
    if (!c.slug) continue;
    entries.push({
      loc: `${base}/category/${escapeLocPath(c.slug)}`,
      lastmod: c.updatedAt,
      changefreq: "weekly",
      priority: 0.8,
    });
  }

  for (const p of products) {
    if (!p.slug) continue;
    entries.push({
      loc: `${base}${productPrefix}/${escapeLocPath(p.slug)}`,
      lastmod: p.updatedAt,
      changefreq: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
