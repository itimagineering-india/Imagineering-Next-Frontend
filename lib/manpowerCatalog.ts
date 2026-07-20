import {
  getManpowerServiceOfferPresetsForSubcategory,
  normalizeManpowerWorkerTypeKey,
  type ManpowerServiceOfferPreset,
} from "@/config/manpowerServiceOfferPresets";
import { normalizeCategorySlugLikeApp } from "@/lib/constructionMaterials";

export type ManpowerWorkerTypeOption = {
  /** Normalized key used for task-preset lookup */
  key: string;
  /** Exact label from business profile (shown in UI) */
  label: string;
};

/** Selectable manpower task — from Product Catalog API or local preset fallback. */
export type ManpowerCatalogTaskOption = {
  id: string;
  label: string;
  catalogProductId?: string;
  description?: string;
  suggestedPriceType?: string;
  suggestedPriceMin?: number;
  suggestedPriceMax?: number;
  images?: string[];
};

/** Worker types that have selectable task presets. */
export const MANPOWER_WORKER_TYPE_OPTIONS: ManpowerWorkerTypeOption[] = [
  { key: "electrician", label: "Electrician" },
  { key: "plumber", label: "Plumber" },
  { key: "mason", label: "Mason" },
  { key: "carpenter", label: "Carpenter" },
  { key: "painter", label: "Painter" },
  { key: "helper", label: "Helper" },
];

export function isManpowerCategorySlug(slug: string | undefined): boolean {
  return normalizeCategorySlugLikeApp(slug || "") === "manpower";
}

/** True when Add Service should open catalog/select instead of the dialog form. */
export function usesCatalogSelectFlow(slug: string | undefined): boolean {
  const s = normalizeCategorySlugLikeApp(slug || "");
  return s === "construction-materials" || s === "manpower";
}

function labelForWorkerKey(key: string): string {
  return MANPOWER_WORKER_TYPE_OPTIONS.find((o) => o.key === key)?.label
    || key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Step 1 worker types = only business-profile primarySubcategory values.
 * No fallback to the full default list (CM material-type parity).
 */
export function resolveManpowerWorkerTypesForProfile(
  profileSubcategories: string[],
): ManpowerWorkerTypeOption[] {
  const seen = new Set<string>();
  const out: ManpowerWorkerTypeOption[] = [];
  for (const raw of profileSubcategories) {
    const label = String(raw || "").trim();
    if (!label) continue;
    const dedupe = label.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const key = normalizeManpowerWorkerTypeKey(label) || label;
    out.push({ key, label });
  }
  return out;
}

export function getManpowerTasksForWorker(workerTypeKey: string): ManpowerServiceOfferPreset[] {
  return getManpowerServiceOfferPresetsForSubcategory(workerTypeKey);
}

export function mapCatalogProductsToManpowerTasks(
  products: Array<Record<string, unknown>>,
): ManpowerCatalogTaskOption[] {
  return products.map((p) => {
    const meta = (p.metadata || {}) as Record<string, unknown>;
    const taskId = String(meta.taskId || p.slug || p._id || "").trim();
    const images = Array.isArray(p.images) ? p.images.map(String).filter(Boolean) : [];
    return {
      id: taskId,
      label: String(p.name || taskId).trim(),
      catalogProductId: String(p._id || ""),
      description: p.description ? String(p.description) : undefined,
      suggestedPriceType: p.suggestedPriceType ? String(p.suggestedPriceType) : undefined,
      suggestedPriceMin: typeof p.suggestedPriceMin === "number" ? p.suggestedPriceMin : undefined,
      suggestedPriceMax: typeof p.suggestedPriceMax === "number" ? p.suggestedPriceMax : undefined,
      images,
    };
  });
}

export function getManpowerPresetFallbackTasks(workerTypeKey: string): ManpowerCatalogTaskOption[] {
  return getManpowerTasksForWorker(workerTypeKey).map((task) => ({
    id: task.id,
    label: task.label,
  }));
}

export type ManpowerCatalogLocation = {
  address?: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
};

/** One service per selected catalog task (CM product-select parity + ImagiMitra). */
export function buildServicePayloadFromManpowerCatalogTask(
  task: ManpowerCatalogTaskOption,
  opts: {
    categoryId: string;
    workerTypeKey: string;
    profileLabel?: string;
    location?: ManpowerCatalogLocation | null;
  },
) {
  const workerKey = normalizeManpowerWorkerTypeKey(opts.workerTypeKey) || opts.workerTypeKey;
  const workerLabel = String(opts.profileLabel || "").trim() || labelForWorkerKey(workerKey);
  const title = String(task.label || task.id).trim() || task.id;
  const description = String(task.description || `${workerLabel}: ${title}`).trim();

  const min = task.suggestedPriceMin;
  const max = task.suggestedPriceMax;
  const hasRange = min != null && max != null && min > 0 && max > 0 && max > min;
  const priceMin = min != null && min > 0 ? min : undefined;
  const priceMax = max != null && max > 0 ? max : undefined;
  const exactPrice = priceMin != null ? priceMin : 1;

  const payload: Record<string, unknown> = {
    title,
    description,
    category: opts.categoryId,
    subcategory: workerLabel,
    priceMode: hasRange ? "range" : "exact",
    price: hasRange && priceMin != null ? priceMin : exactPrice,
    ...(hasRange && priceMin != null && priceMax != null ? { priceMin, priceMax } : {}),
    priceType: task.suggestedPriceType || "negotiable",
    deliveryTime: "1-2 days",
    metadata: {
      formVariant: "manpower",
      workerType: workerKey,
      manpowerTaskIds: [task.id],
      manpowerCustomTasks: [],
      experienceLevel: "skilled",
      availability: "immediate",
    },
  };

  if (task.catalogProductId) payload.catalogProductId = task.catalogProductId;
  if (task.images && task.images.length > 0) {
    payload.image = task.images[0];
    payload.images = task.images;
  }

  const loc = opts.location;
  if (loc && (loc.address || loc.city)) {
    payload.location = {
      address: [loc.address, loc.city, loc.state].filter(Boolean).join(", ") || loc.address || "",
      coordinates: loc.coordinates,
    };
  }

  return payload;
}

/** @deprecated Prefer buildServicePayloadFromManpowerCatalogTask */
export function buildServicePayloadFromManpowerTask(
  task: ManpowerServiceOfferPreset,
  opts: {
    categoryId: string;
    workerTypeKey: string;
    profileLabel?: string;
    location?: ManpowerCatalogLocation | null;
  },
) {
  return buildServicePayloadFromManpowerCatalogTask(
    { id: task.id, label: task.label },
    opts,
  );
}

export function normalizePrimarySubcategoryLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        return String(o.name || o.label || o.title || o.slug || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}
