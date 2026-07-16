const CF_SUBCATEGORY = "https://dwkazjggpovin.cloudfront.net/subcategory%20images";

/** Per-subcategory art (CDN when available, else stock photos). */
const SUBCATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  "bricks-blocks": `${CF_SUBCATEGORY}/bricks%20%26%20blocks.png`,
  "tiles-flooring": "https://images.unsplash.com/photo-1615873960433-9ef78096b65e?w=480&h=320&fit=crop",
  aggregates: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&h=320&fit=crop",
  concrete: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=480&h=320&fit=crop",
  admixture: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=480&h=320&fit=crop",
  gsb: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=480&h=320&fit=crop",
  "primer-paints": "https://images.unsplash.com/photo-1562259947-e8e7689dabd2?w=480&h=320&fit=crop",
  diesel: "https://images.unsplash.com/photo-1625047509168-8309d532ec2d?w=480&h=320&fit=crop",
  "bitumen-vg-30": "https://images.unsplash.com/photo-1625047509168-8309d532ec2d?w=480&h=320&fit=crop",
  "bitumen-vg-40": "https://images.unsplash.com/photo-1625047509168-8309d532ec2d?w=480&h=320&fit=crop",
  "polycarbonate-sheet": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=480&h=320&fit=crop",
  "0-5mm-thick-roof-sheet": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=480&h=320&fit=crop",
  "0.5mm-thick-roof-sheet": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=480&h=320&fit=crop",
  sand: "https://images.unsplash.com/photo-1618221195710-e2e56c871234?w=480&h=320&fit=crop",
  cement: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=480&h=320&fit=crop",
  steel: "https://images.unsplash.com/photo-1565193566170-1a392f289f6c?w=480&h=320&fit=crop",
  sanitary: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=480&h=320&fit=crop",
  "fencing-poles": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=480&h=320&fit=crop",
};

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  "construction-materials": "https://dwkazjggpovin.cloudfront.net/category%20images/construction%20material%20Image.png",
  manpower: "https://dwkazjggpovin.cloudfront.net/category%20images/manpower%20image.png",
  "technical-manpower": "https://dwkazjggpovin.cloudfront.net/category%20images/technical%20manpower%20image.png",
  "rental-services": "https://dwkazjggpovin.cloudfront.net/category%20images/machine%20rental%20image.png",
  machines: "https://dwkazjggpovin.cloudfront.net/category%20images/machine%20resale%20image.png",
  contractors: "https://dwkazjggpovin.cloudfront.net/category%20images/contractors%20image.png",
  consultants: "https://dwkazjggpovin.cloudfront.net/category%20images/consultants%20image.png",
  consultant: "https://dwkazjggpovin.cloudfront.net/category%20images/consultants%20image.png",
  "real-estate": "https://dwkazjggpovin.cloudfront.net/category%20images/real%20estate%20image.png",
  manufacturer: "https://dwkazjggpovin.cloudfront.net/category%20images/Manufacturer%20image.png",
  logistics: "https://dwkazjggpovin.cloudfront.net/category%20images/logistics%20image.png",
  traders: "https://dwkazjggpovin.cloudfront.net/category%20images/traders%20image.png",
  finance: "https://dwkazjggpovin.cloudfront.net/category%20images/finance%20%26%20Insurance%20image.png",
  "construction-companies": "https://dwkazjggpovin.cloudfront.net/category%20images/construction%20comapnies%20image.png",
};

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSubcategoryImageUrl(categorySlug: string, subcategorySlug: string): string {
  const subKey = normalizeSlug(subcategorySlug);
  if (SUBCATEGORY_IMAGE_BY_SLUG[subKey]) {
    return SUBCATEGORY_IMAGE_BY_SLUG[subKey];
  }

  return `${CF_SUBCATEGORY}/${encodeURIComponent(subKey)}.png`;
}

export function getCategoryFallbackImageUrl(categorySlug: string): string | null {
  const catKey = normalizeSlug(categorySlug);
  return CATEGORY_IMAGE_MAP[catKey] ?? null;
}
