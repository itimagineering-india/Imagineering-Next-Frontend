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
  "tools",
]);

const B2B_PURCHASE_ORDER = [
  "construction materials",
  "construction material",
  "tools",
  "electrical & lighting",
  "electrical & lightening",
  "furniture & hardware",
  "furniture and hardware",
  "furniture",
  "hardware",
];

export type B2bCategoryLike = {
  _id?: unknown;
  id?: unknown;
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

/** Header + hub: purchase-flow B2B categories (Construction Materials, Tools, Electrical, Furniture, Hardware). */
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

/** Provider listing + buyer hub: Construction Materials, Tools, Electrical, Furniture, Hardware. */
export function isB2bCategorySlug(slug: string | undefined): boolean {
  const s = String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
  if (!s) return false;
  if (isConstructionMaterialsB2bSlug(s)) return true;
  if (s === "tools" || s.startsWith("tools-")) return true;
  if (s.includes("electrical")) return true;
  if (s === "furniture" || s.startsWith("furniture-")) return true;
  if (s === "hardware" || s.startsWith("hardware-")) return true;
  if (s.includes("trader") || s === "vendors" || s === "b2b" || s === "b2b-services") return true;
  return false;
}

/** Hub / B2B Traders browse — all B2B purchase categories, not a single slug. */
export function isB2bServicesHubSlug(slug: string | undefined): boolean {
  const s = String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
  if (!s) return false;
  if (s === "b2b" || s === "b2b-services") return true;
  if (s === "traders" || s === "vendors" || s === "vendor") return true;
  return s.includes("trader");
}

/** Business profile primaryCategory is B2B Traders (not CM / Electrical purchase categories). */
export function isB2bTradersProfileCategory(cat: {
  slug?: string;
  name?: string;
} | null | undefined): boolean {
  if (!cat) return false;
  if (isB2bServicesHubSlug(cat.slug)) return true;
  const n = normalizeB2bCategoryName(cat.name || "");
  if (!n) return false;
  if (n === "b2b traders" || n === "traders" || n === "vendors" || n === "vendor") return true;
  return n.includes("trader");
}

export function usesB2bCatalogOrManualListing(
  cat: { slug?: string; name?: string; interactionType?: string } | null | undefined
): boolean {
  if (!cat) return false;
  if (isB2bCategorySlug(cat.slug) || isB2bCategoryName(cat.name ?? "")) return true;
  return String(cat.interactionType || "").toUpperCase() === "PURCHASE_ONLY";
}

export function filterB2bCategories<T extends B2bCategoryLike>(categories: T[]): T[] {
  const rank = (name: string) => {
    const i = B2B_PURCHASE_ORDER.indexOf(normalizeB2bCategoryName(name));
    return i === -1 ? 99 : i;
  };
  return categories
    .filter((c) => isB2bPurchaseCategory(c))
    .sort((a, b) => rank(String(a.name || "")) - rank(String(b.name || "")));
}

function categoryRecordId(cat: B2bCategoryLike): string {
  return String(cat._id ?? cat.id ?? "");
}

export function b2bCategoryNameKey(name: string): string {
  const n = normalizeB2bCategoryName(name)
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
  if (n === "construction material") return "construction materials";
  if (
    n === "electrical lighting" ||
    n === "electrical lightening" ||
    n === "electrical and lightening"
  ) {
    return "electrical and lighting";
  }
  if (n === "hardware and senitary") return "hardware";
  return n;
}

export function b2bCategoryNamesMatch(a: string, b: string): boolean {
  return b2bCategoryNameKey(a) === b2bCategoryNameKey(b);
}

function toB2bSlug(name: string): string {
  return b2bCategoryNameKey(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseB2bSubName(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") return String((raw as { name?: unknown }).name || "").trim();
  return "";
}

function parseB2bLinkedCategoryId(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const id = (raw as { linkedCategoryId?: unknown }).linkedCategoryId;
  if (id == null || id === "") return "";
  if (typeof id === "object") {
    const value = id as { _id?: unknown; id?: unknown };
    return String(value._id ?? value.id ?? "").trim();
  }
  return String(id).trim();
}

/**
 * B2B menu: use B2B Traders subcategories, each synced to a purchase category
 * (by linkedCategoryId or matching name) so nested subs come from that category.
 */
export function resolveB2bBrowseCategories<T extends B2bCategoryLike>(categories: T[]): T[] {
  const list = Array.isArray(categories) ? categories : [];
  const traders = list.find((c) => isB2bTradersProfileCategory(c) && c.isActive !== false);
  const rawSubs = Array.isArray(traders?.subcategories) ? traders.subcategories : [];
  if (!traders || rawSubs.length === 0) {
    return filterB2bCategories(list);
  }

  const others = list.filter((c) => !isB2bTradersProfileCategory(c) && c.isActive !== false);
  const resolved: T[] = [];

  for (const raw of rawSubs) {
    const name = parseB2bSubName(raw);
    if (!name) continue;
    const linkedId = parseB2bLinkedCategoryId(raw);
    const linked =
      (linkedId ? others.find((c) => categoryRecordId(c) === linkedId) : undefined) ||
      others.find((c) => b2bCategoryNamesMatch(String(c.name || ""), name)) ||
      others.find((c) => String(c.slug || "") === toB2bSlug(name));

    if (linked) {
      resolved.push({ ...linked, name });
    } else {
      resolved.push({
        ...traders,
        name,
        slug: toB2bSlug(name),
        subcategories: [],
      });
    }
  }

  return resolved;
}
