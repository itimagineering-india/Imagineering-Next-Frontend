import { normalizeCategorySlugLikeApp } from "@/lib/constructionMaterials";

export const MACHINE_RENTAL_CATEGORY_SLUGS = [
  "machine-rental",
  "rental-services",
  "rental",
] as const;

export const MACHINE_RENTAL_FALLBACK_TYPES = [
  "Excavator",
  "JCB",
  "Crane",
  "Dumper",
  "Road Roller",
  "Loader",
  "Transit Mixer",
  "Generator",
  "Tractor",
  "Truck",
] as const;

export function isMachineRentalCategorySlug(slug: string | undefined): boolean {
  const s = normalizeCategorySlugLikeApp(slug || "");
  return (MACHINE_RENTAL_CATEGORY_SLUGS as readonly string[]).includes(s);
}

export type MachineRentalPriceType =
  | "daily"
  | "hourly"
  | "per_trip"
  | "fixed"
  | "monthly";

export const MACHINE_RENTAL_PRICE_TYPES: ReadonlyArray<{
  value: MachineRentalPriceType;
  title: string;
}> = [
  { value: "daily", title: "Per day" },
  { value: "hourly", title: "Per hour" },
  { value: "per_trip", title: "Per trip" },
  { value: "fixed", title: "Fixed" },
  { value: "monthly", title: "Per month" },
];

export type MachineRentalSpecRow = {
  id: string;
  label: string;
  value: string;
};

export const MACHINE_RENTAL_SPEC_SUGGESTIONS = [
  "Capacity",
  "Fuel type",
  "Year of manufacture",
  "Operating weight",
  "Bucket size",
] as const;

export function createMachineRentalSpecRow(label = ""): MachineRentalSpecRow {
  return {
    id: `spec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    value: "",
  };
}

export type MachineRentalLocation = {
  address?: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
};

export function buildMachineRentalServicePayload(opts: {
  categoryId: string;
  categorySlug: string;
  subcategory: string;
  title: string;
  brandName?: string;
  description: string;
  images: string[];
  priceType: MachineRentalPriceType;
  price: number;
  /** How many identical units the provider can rent out for this listing. */
  availableMachines: number;
  securityDeposit?: string;
  operatorIncluded: boolean;
  specs?: MachineRentalSpecRow[];
  location?: MachineRentalLocation | null;
}): Record<string, unknown> {
  const customFields = (opts.specs || [])
    .filter((row) => row.label.trim() && row.value.trim())
    .map((row) => ({
      label: row.label.trim(),
      value: row.value.trim(),
      type: "text" as const,
    }));

  const availableMachines = Math.min(
    99,
    Math.max(1, Math.floor(Number(opts.availableMachines) || 1))
  );

  const payload: Record<string, unknown> = {
    title: opts.title.trim(),
    description: opts.description.trim(),
    category: opts.categoryId,
    subcategory: opts.subcategory.trim(),
    priceMode: "exact",
    price: opts.price,
    priceType: opts.priceType,
    deliveryTime: "1-2 days",
    featured: false,
    contactMode: "platform",
    visibility: "normal",
    metadata: {
      formVariant: "rental_services",
      categorySlug: normalizeCategorySlugLikeApp(opts.categorySlug),
      itemType: "machine",
      availableMachines: String(availableMachines),
      operatorIncluded: opts.operatorIncluded ? "yes" : "no",
      ...(opts.securityDeposit?.trim()
        ? { securityDeposit: opts.securityDeposit.trim() }
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

/** Max machines a buyer can book for a listing (from provider metadata). */
export function resolveAvailableMachinesFromService(
  service: {
    metadata?: Record<string, unknown> | null;
    customFields?: Array<{ label?: string; value?: unknown }> | null;
  } | null | undefined,
  fallback = 99
): number {
  const meta = service?.metadata;
  const rawMeta = meta?.availableMachines ?? meta?.machinesAvailable ?? meta?.fleetSize;
  const fromMeta = Number(rawMeta);
  if (Number.isFinite(fromMeta) && fromMeta >= 1) {
    return Math.min(99, Math.floor(fromMeta));
  }
  const fields = Array.isArray(service?.customFields) ? service!.customFields! : [];
  for (const field of fields) {
    const label = String(field?.label || "").toLowerCase();
    if (
      label.includes("available machine") ||
      label.includes("machines available") ||
      label.includes("fleet") ||
      label === "quantity" ||
      label === "no. of machines" ||
      label === "number of machines"
    ) {
      const n = Number(field?.value);
      if (Number.isFinite(n) && n >= 1) return Math.min(99, Math.floor(n));
    }
  }
  return Math.min(99, Math.max(1, Math.floor(fallback)));
}
