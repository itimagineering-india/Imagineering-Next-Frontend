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
