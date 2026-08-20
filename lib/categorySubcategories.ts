export interface SubcategoryEntry {
  name: string;
  itemTypes: string[];
}

export function normalizeSubcategoryEntry(raw: unknown): SubcategoryEntry | null {
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { name, itemTypes: [] } : null;
  }
  if (raw && typeof raw === 'object') {
    const entry = raw as { name?: unknown; itemTypes?: unknown };
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    if (!name) return null;
    const itemTypes = Array.isArray(entry.itemTypes)
      ? entry.itemTypes
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
      : [];
    return { name, itemTypes };
  }
  return null;
}

export function normalizeSubcategories(raw: unknown): SubcategoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: SubcategoryEntry[] = [];
  for (const item of raw) {
    const entry = normalizeSubcategoryEntry(item);
    if (!entry) continue;
    const key = entry.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

export function getSubcategoryNames(subcategories: unknown): string[] {
  return normalizeSubcategories(subcategories).map((entry) => entry.name);
}

/** Business-profile primarySubcategory may be a string[] or a single string. */
export function normalizePrimarySubcategoryList(raw: unknown): string[] {
  if (Array.isArray(raw)) return getSubcategoryNames(raw);
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  return [];
}

/**
 * Provider listing pickers should only show subcategories saved on the business profile,
 * not the full category catalog.
 */
export function filterSubcategoriesToProfile(
  categorySubcategories: unknown,
  profileSubcategories: unknown,
  options?: { include?: string | null }
): string[] {
  const categoryNames = getSubcategoryNames(categorySubcategories);
  const profileNames = normalizePrimarySubcategoryList(profileSubcategories);
  const include = String(options?.include || "").trim();
  const keys = new Set(profileNames.map((s) => s.toLowerCase()));
  if (include) keys.add(include.toLowerCase());
  if (keys.size === 0) return [];

  const matched = categoryNames.filter((s) => keys.has(s.toLowerCase()));
  if (matched.length > 0) {
    if (include && !matched.some((s) => s.toLowerCase() === include.toLowerCase())) {
      return [...matched, include];
    }
    return matched;
  }

  const fallback = [...profileNames];
  if (include && !fallback.some((s) => s.toLowerCase() === include.toLowerCase())) {
    fallback.push(include);
  }
  return fallback;
}

export function getSubcategoryLabel(subcategory: unknown): string {
  if (typeof subcategory === 'string') return subcategory.trim();
  if (subcategory && typeof subcategory === 'object') {
    const item = subcategory as { name?: unknown; slug?: unknown };
    return String(item.name ?? item.slug ?? '').trim();
  }
  return '';
}

export function toSubcategorySlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getSubcategorySlug(subcategory: unknown): string {
  if (subcategory && typeof subcategory === 'object') {
    const item = subcategory as { slug?: unknown };
    const slug = String(item.slug ?? '').trim();
    if (slug) return slug;
  }
  return toSubcategorySlug(getSubcategoryLabel(subcategory));
}

export function getItemTypesForSubcategory(
  subcategories: unknown,
  subcategoryName: string
): string[] {
  const target = subcategoryName.trim().toLowerCase();
  if (!target) return [];
  const entry = normalizeSubcategories(subcategories).find(
    (item) => item.name.toLowerCase() === target
  );
  return entry?.itemTypes ?? [];
}

export function slimCategoriesForCache<T extends { _id?: string; name?: string; slug?: string; subcategories?: unknown }>(
  categories: T[]
) {
  return categories.map((cat) => ({
    _id: cat._id,
    name: cat.name,
    slug: cat.slug,
    subcategories: getSubcategoryNames(cat.subcategories),
  }));
}
