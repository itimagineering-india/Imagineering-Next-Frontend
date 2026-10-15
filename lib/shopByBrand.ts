/** Home “Shop by Brand” row types + CMS normalizer. */

export type ShopByBrandRow = {
  id: string;
  name: string;
  /** Catalog `search` query (matches brand / name). */
  search: string;
  categorySlug: string;
  tagline: string;
  href: string;
  bannerBg: string;
  logoText: string;
  logoSub?: string;
  logoColor: string;
  bannerImage: string;
};

function deriveBrandHref(categorySlug: string, search: string): string {
  const q = encodeURIComponent(search);
  const slug = String(categorySlug || "").toLowerCase().trim();
  if (slug === "tools" || slug.startsWith("tools-")) return `/tools?search=${q}`;
  if (slug === "furniture" || slug.startsWith("furniture-")) {
    return `/b2b-services?category=furniture&search=${q}`;
  }
  if (slug === "construction-materials" || slug === "construction-material") {
    return `/construction-materials?search=${q}`;
  }
  return `/b2b-services?search=${q}`;
}

/** Fallback when CMS is empty / unreachable (matches seeded defaults). */
export const SHOP_BY_BRAND_FALLBACK: readonly ShopByBrandRow[] = [
  {
    id: "ultratech",
    name: "UltraTech",
    search: "UltraTech",
    categorySlug: "construction-materials",
    tagline: "The Engineer's Choice",
    href: "/construction-materials?search=UltraTech",
    bannerBg: "linear-gradient(160deg, #f5c518 0%, #e8a800 55%, #d49200 100%)",
    logoText: "UltraTech",
    logoSub: "CEMENT",
    logoColor: "#1a1a1a",
    bannerImage:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "asian-paints",
    name: "Asian Paints",
    search: "Asian Paints",
    categorySlug: "construction-materials",
    tagline: "Colour your world",
    href: "/construction-materials?search=Asian+Paints",
    bannerBg: "linear-gradient(160deg, #e8f4fc 0%, #d4ebf7 50%, #c5e0f0 100%)",
    logoText: "asianpaints",
    logoColor: "#e11d48",
    bannerImage:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: "havells",
    name: "Havells",
    search: "Havells",
    categorySlug: "construction-materials",
    tagline: "Switch to smart living",
    href: "/b2b-services?search=Havells",
    bannerBg: "linear-gradient(160deg, #f5efe6 0%, #ebe0d0 55%, #e0d4c0 100%)",
    logoText: "HAVELLS",
    logoColor: "#dc2626",
    bannerImage:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=70",
  },
];

/** @deprecated Use SHOP_BY_BRAND_FALLBACK or CMS rows. */
export const SHOP_BY_BRAND_ROWS = SHOP_BY_BRAND_FALLBACK;

type CmsShopByBrandDoc = {
  _id?: string;
  id?: string;
  name?: string;
  search?: string;
  categorySlug?: string;
  tagline?: string;
  href?: string;
  bannerBg?: string;
  logoText?: string;
  logoSub?: string;
  logoColor?: string;
  bannerImage?: string;
  isActive?: boolean;
  order?: number;
};

export function normalizeShopByBrandRows(raw: unknown[]): ShopByBrandRow[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const rows: ShopByBrandRow[] = [];
  for (const item of raw) {
    const r = item as CmsShopByBrandDoc;
    const name = String(r.name || "").trim();
    const search = String(r.search || name).trim();
    const categorySlug = String(r.categorySlug || "construction-materials").trim();
    const logoText = String(r.logoText || name).trim();
    const bannerBg = String(r.bannerBg || "").trim();
    const bannerImage = String(r.bannerImage || "").trim();
    if (!name || !search || !bannerBg || !bannerImage) continue;
    rows.push({
      id: String(r._id || r.id || search.toLowerCase().replace(/\s+/g, "-")),
      name,
      search,
      categorySlug,
      tagline: String(r.tagline || "").trim(),
      href: String(r.href || "").trim() || deriveBrandHref(categorySlug, search),
      bannerBg,
      logoText,
      logoSub: r.logoSub ? String(r.logoSub).trim() : undefined,
      logoColor: String(r.logoColor || "#1a1a1a").trim(),
      bannerImage,
    });
  }
  return rows;
}
