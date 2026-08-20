/** Shared B2B category matching — keep Header mega-menu and /b2b-services in sync. */

const B2B_CATEGORY_NAMES = new Set([
  "construction material",
  "construction materials",
  "electrical & lighting",
  "electrical & lightening",
  "furniture",
  "furniture & hardware",
  "furniture and hardware",
  "hardware and senitary",
  "hardware",
]);

export type B2bCategoryLike = {
  name?: string;
  slug?: string;
  interactionType?: string;
  isActive?: boolean;
  subcategories?: unknown;
};

export function normalizeB2bCategoryName(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isB2bCategoryName(name: string): boolean {
  const n = normalizeB2bCategoryName(name);
  if (B2B_CATEGORY_NAMES.has(n)) return true;
  const stripped = n.replace(/&/g, "").replace(/\s+/g, " ").trim();
  return stripped === "electrical lighting" || stripped === "electrical lightening";
}

/** Header + hub: purchase-flow B2B categories (Construction Materials, Electrical, Furniture, Hardware). */
export function isB2bPurchaseCategory(cat: B2bCategoryLike | null | undefined): boolean {
  if (!cat) return false;
  const interactionType = String(cat.interactionType ?? "");
  return isB2bCategoryName(cat.name ?? "") && (!interactionType || interactionType === "PURCHASE_ONLY");
}

export function isConstructionMaterialsB2bSlug(slug: string): boolean {
  const s = String(slug || "")
    .toLowerCase()
    .trim();
  return s === "construction-materials" || s === "construction-material";
}

/** Provider listing + buyer hub: Construction Materials, Electrical, Furniture, Hardware. */
export function isB2bCategorySlug(slug: string | undefined): boolean {
  const s = String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
  if (!s) return false;
  if (isConstructionMaterialsB2bSlug(s)) return true;
  if (s.includes("electrical")) return true;
  if (s === "furniture" || s.startsWith("furniture-")) return true;
  if (s === "hardware" || s.startsWith("hardware-")) return true;
  return false;
}

export function usesB2bCatalogOrManualListing(
  cat: { slug?: string; name?: string; interactionType?: string } | null | undefined
): boolean {
  if (!cat) return false;
  if (isB2bCategorySlug(cat.slug) || isB2bCategoryName(cat.name ?? "")) return true;
  return String(cat.interactionType || "").toUpperCase() === "PURCHASE_ONLY";
}

export function filterB2bCategories<T extends B2bCategoryLike>(categories: T[]): T[] {
  return categories.filter((c) => isB2bPurchaseCategory(c));
}
