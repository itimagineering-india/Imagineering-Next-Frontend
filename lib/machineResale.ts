import { normalizeCategorySlugLikeApp } from "@/lib/constructionMaterials";

export const MACHINE_RESALE_CATEGORY_SLUGS = [
  "machines",
  "machine-resale",
  "machine_resale",
] as const;

export const MACHINE_RESALE_FALLBACK_TYPES = [
  "Excavators",
  "Cranes",
  "Bulldozers",
  "Loaders",
  "Compactors",
  "Concrete Mixers",
  "Drilling Equipment",
  "Heavy Machinery",
  "JCB",
  "Generator",
] as const;

export function isMachineResaleCategorySlug(slug: string | undefined): boolean {
  const s = normalizeCategorySlugLikeApp(slug || "");
  return (MACHINE_RESALE_CATEGORY_SLUGS as readonly string[]).includes(s);
}

/** True when a provider listing belongs to the machine resale form. */
export function isMachineResaleListing(service: {
  category?: { slug?: string } | string | null;
  metadata?: Record<string, unknown> | null;
  formVariant?: string | null;
} | null | undefined): boolean {
  if (!service) return false;
  const cat = service.category;
  const catSlug =
    cat && typeof cat === "object" && cat !== null
      ? String((cat as { slug?: string }).slug || "")
      : "";
  if (isMachineResaleCategorySlug(catSlug)) return true;
  const formVariant = String(
    service.metadata?.formVariant || service.formVariant || ""
  )
    .toLowerCase()
    .trim()
    .replace(/-/g, "_");
  return formVariant === "machine_resale" || formVariant === "machines";
}

export type MachineResaleLocation = {
  address?: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
};

export type MachineResaleSpecRow = {
  id: string;
  label: string;
  value: string;
};

export function createMachineResaleSpecRow(label = ""): MachineResaleSpecRow {
  return {
    id: `spec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    value: "",
  };
}

export function buildMachineResaleServicePayload(opts: {
  categoryId: string;
  categorySlug: string;
  subcategory: string;
  title: string;
  brandName?: string;
  description: string;
  images: string[];
  /** Selling price — always fixed. */
  price: number;
  /** How many identical units available for sale. */
  availableUnits: number;
  yearOfManufacture?: string;
  conditionNotes?: string;
  specs?: MachineResaleSpecRow[];
  location?: MachineResaleLocation | null;
}): Record<string, unknown> {
  const customFields = (opts.specs || [])
    .filter((row) => row.label.trim() && row.value.trim())
    .map((row) => ({
      label: row.label.trim(),
      value: row.value.trim(),
      type: "text" as const,
    }));

  const availableUnits = Math.min(
    99,
    Math.max(1, Math.floor(Number(opts.availableUnits) || 1))
  );
  const price = Number(opts.price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Enter a valid selling price");
  }

  const payload: Record<string, unknown> = {
    title: opts.title.trim(),
    description: opts.description.trim(),
    category: opts.categoryId,
    subcategory: opts.subcategory.trim(),
    priceMode: "exact",
    price,
    priceType: "fixed",
    deliveryTime: "1-2 days",
    featured: false,
    contactMode: "platform",
    visibility: "normal",
    metadata: {
      formVariant: "machine_resale",
      categorySlug: normalizeCategorySlugLikeApp(opts.categorySlug),
      itemType: "machine",
      listingType: "resale",
      availableUnits: String(availableUnits),
      ...(opts.yearOfManufacture?.trim()
        ? { yearOfManufacture: opts.yearOfManufacture.trim() }
        : {}),
      ...(opts.conditionNotes?.trim()
        ? { conditionNotes: opts.conditionNotes.trim() }
        : {}),
      ...(opts.brandName?.trim() ? { machineModel: opts.brandName.trim() } : {}),
    },
  };

  if (opts.brandName?.trim()) {
    payload.brandName = opts.brandName.trim();
  }
  if (opts.images.length > 0) {
    payload.image = opts.images[0];
    payload.images = opts.images;
  }
  if (customFields.length > 0) {
    payload.customFields = customFields;
  }

  const loc = opts.location;
  if (loc && (loc.address || loc.city)) {
    payload.location = {
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      ...(loc.coordinates ? { coordinates: loc.coordinates } : {}),
    };
  }

  return payload;
}
