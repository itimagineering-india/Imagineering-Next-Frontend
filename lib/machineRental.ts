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

/** True when a provider listing belongs to the machine rental form (not generic MultiStep). */
export function isMachineRentalListing(service: {
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
  if (isMachineRentalCategorySlug(catSlug)) return true;
  const formVariant = String(
    service.metadata?.formVariant || service.formVariant || ""
  )
    .toLowerCase()
    .trim();
  return formVariant.includes("rental");
}

export type MachineRentalPriceType =
  | "hourly"
  | "daily"
  | "monthly"
  | "per_km"
  | "per_km_weight"
  | "per_km_weight_slab"
  | "per_trip"
  | "fixed";

export const MACHINE_RENTAL_PRICE_TYPES: ReadonlyArray<{
  value: MachineRentalPriceType;
  title: string;
}> = [
  { value: "hourly", title: "Per hour" },
  { value: "daily", title: "Per day" },
  { value: "monthly", title: "Per month" },
  { value: "per_km", title: "Per km" },
  { value: "per_km_weight", title: "Per km × weight" },
  { value: "per_km_weight_slab", title: "Per km + weight slab" },
  { value: "per_trip", title: "Per trip" },
  { value: "fixed", title: "Fixed" },
];

export type MachineRentalRate = {
  priceType: MachineRentalPriceType;
  price: number;
};

export type WeightPricingSlab = {
  maxWeight: number;
  ratePerKm: number;
};

export type WeightPricingConfig = {
  weightUnit: string;
  distanceUnit: string;
  slabs: WeightPricingSlab[];
};

export type WeightPricingDraftSlab = {
  id: string;
  maxWeight: string;
  ratePerKm: string;
};

const PRIMARY_RATE_ORDER: MachineRentalPriceType[] = [
  "daily",
  "hourly",
  "monthly",
  "per_km",
  "per_km_weight",
  "per_km_weight_slab",
  "per_trip",
  "fixed",
];

const ALLOWED_RATE_TYPES = new Set<string>(
  MACHINE_RENTAL_PRICE_TYPES.map((o) => o.value)
);

export function isMachineRentalPriceType(value: unknown): value is MachineRentalPriceType {
  return ALLOWED_RATE_TYPES.has(String(value || "").trim().toLowerCase());
}

export function isWeightBasedPriceType(priceType: string | null | undefined): boolean {
  const key = String(priceType || "").trim().toLowerCase();
  return key === "per_km_weight" || key === "per_km_weight_slab";
}

export function createWeightPricingDraftSlab(
  maxWeight = "",
  ratePerKm = ""
): WeightPricingDraftSlab {
  return {
    id: `slab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    maxWeight,
    ratePerKm,
  };
}

export function parseWeightPricing(
  metadata: Record<string, unknown> | null | undefined
): WeightPricingConfig {
  const raw = metadata?.weightPricing;
  const weightUnit =
    raw && typeof raw === "object" && String((raw as { weightUnit?: unknown }).weightUnit || "").trim()
      ? String((raw as { weightUnit?: unknown }).weightUnit).trim().toLowerCase()
      : "ton";
  const distanceUnit =
    raw && typeof raw === "object" && String((raw as { distanceUnit?: unknown }).distanceUnit || "").trim()
      ? String((raw as { distanceUnit?: unknown }).distanceUnit).trim().toLowerCase()
      : "km";

  const slabs: WeightPricingSlab[] = [];
  const rawSlabs =
    raw && typeof raw === "object" ? (raw as { slabs?: unknown }).slabs : null;
  if (Array.isArray(rawSlabs)) {
    for (const row of rawSlabs) {
      if (!row || typeof row !== "object") continue;
      const maxWeight = Number((row as { maxWeight?: unknown }).maxWeight);
      const ratePerKm = Number(
        (row as { ratePerKm?: unknown }).ratePerKm ?? (row as { rate?: unknown }).rate
      );
      if (!Number.isFinite(maxWeight) || maxWeight <= 0) continue;
      if (!Number.isFinite(ratePerKm) || ratePerKm <= 0) continue;
      slabs.push({ maxWeight, ratePerKm });
    }
  }
  slabs.sort((a, b) => a.maxWeight - b.maxWeight);
  return { weightUnit, distanceUnit, slabs };
}

export function resolveSlabRatePerKm(
  slabs: WeightPricingSlab[],
  weight: number
): number | null {
  if (!slabs.length || !Number.isFinite(weight) || weight <= 0) return null;
  for (const slab of slabs) {
    if (weight <= slab.maxWeight) return slab.ratePerKm;
  }
  return null;
}

/** Client-side estimate (server remains authoritative). */
export function estimateWeightBasedPrice(opts: {
  priceType: string;
  rate: number;
  distance: number;
  weight: number;
  machineCount?: number;
  slabs?: WeightPricingSlab[];
}): { subtotal: number; applicableRate: number; formula: string } | null {
  const machines = Math.max(1, Math.floor(Number(opts.machineCount) || 1));
  const distance = Math.floor(Number(opts.distance));
  const weight = Number(opts.weight);
  const key = String(opts.priceType || "").toLowerCase();
  if (!Number.isFinite(distance) || distance < 1) return null;
  if (!Number.isFinite(weight) || weight <= 0) return null;

  if (key === "per_km_weight") {
    const rate = Number(opts.rate);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    const subtotal = Math.round(rate * distance * weight * machines * 100) / 100;
    return {
      subtotal,
      applicableRate: rate,
      formula: `Total = Distance × Weight × Rate (${distance} × ${weight} × ₹${rate})`,
    };
  }

  if (key === "per_km_weight_slab") {
    const applicableRate = resolveSlabRatePerKm(opts.slabs || [], weight);
    if (applicableRate == null) return null;
    const subtotal = Math.round(applicableRate * distance * machines * 100) / 100;
    return {
      subtotal,
      applicableRate,
      formula: `Total = Distance × Rate for weight (${distance} × ₹${applicableRate}/km)`,
    };
  }

  return null;
}

/** Normalize metadata.rentalRates (or legacy single price) into a clean rate list. */
export function parseRentalRates(
  metadata: Record<string, unknown> | null | undefined,
  fallback?: { priceType?: string | null; price?: number | null }
): MachineRentalRate[] {
  const raw = metadata?.rentalRates;
  const out: MachineRentalRate[] = [];
  const seen = new Set<string>();

  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const priceType = String((row as { priceType?: unknown }).priceType || "")
        .trim()
        .toLowerCase();
      const price = Number((row as { price?: unknown }).price);
      if (!isMachineRentalPriceType(priceType)) continue;
      if (!Number.isFinite(price) || price <= 0) continue;
      if (seen.has(priceType)) continue;
      seen.add(priceType);
      out.push({ priceType, price });
    }
  }

  if (out.length === 0 && fallback) {
    const priceType = String(fallback.priceType || "daily")
      .trim()
      .toLowerCase();
    const price = Number(fallback.price);
    if (isMachineRentalPriceType(priceType) && Number.isFinite(price) && price > 0) {
      out.push({ priceType, price });
    }
  }

  return out;
}

export function pickPrimaryRate(rates: MachineRentalRate[]): MachineRentalRate | null {
  if (!rates.length) return null;
  for (const preferred of PRIMARY_RATE_ORDER) {
    const hit = rates.find((r) => r.priceType === preferred);
    if (hit) return hit;
  }
  return rates[0] || null;
}

export function resolveRentalUnitPrice(
  rates: MachineRentalRate[],
  selectedPriceType?: string | null,
  legacyPrice?: number | null
): { priceType: MachineRentalPriceType; unitPrice: number } | null {
  if (rates.length > 0) {
    const wanted = String(selectedPriceType || "")
      .trim()
      .toLowerCase();
    if (wanted) {
      const hit = rates.find((r) => r.priceType === wanted);
      if (!hit) return null;
      return { priceType: hit.priceType, unitPrice: hit.price };
    }
    const primary = pickPrimaryRate(rates);
    return primary
      ? { priceType: primary.priceType, unitPrice: primary.price }
      : null;
  }
  const legacy = Number(legacyPrice);
  if (Number.isFinite(legacy) && legacy > 0) {
    const pt = isMachineRentalPriceType(selectedPriceType)
      ? selectedPriceType
      : "daily";
    return { priceType: pt, unitPrice: legacy };
  }
  return null;
}

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
  /** Multi-unit rate card — at least one required. */
  rates: MachineRentalRate[];
  /** How many identical units the provider can rent out for this listing. */
  availableMachines: number;
  securityDeposit?: string;
  operatorIncluded: boolean;
  specs?: MachineRentalSpecRow[];
  location?: MachineRentalLocation | null;
  weightPricing?: WeightPricingConfig | null;
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

  const rates = (opts.rates || []).filter(
    (r) => isMachineRentalPriceType(r.priceType) && Number.isFinite(r.price) && r.price > 0
  );
  const primary = pickPrimaryRate(rates);
  if (!primary) {
    throw new Error("At least one rental rate is required");
  }

  const weightPricing = opts.weightPricing;
  const hasWeightRate = rates.some(
    (r) => r.priceType === "per_km_weight" || r.priceType === "per_km_weight_slab"
  );
  const hasSlabRate = rates.some((r) => r.priceType === "per_km_weight_slab");
  if (hasSlabRate && (!weightPricing?.slabs || weightPricing.slabs.length === 0)) {
    throw new Error("Add at least one weight slab for Per km + weight slab pricing");
  }

  const payload: Record<string, unknown> = {
    title: opts.title.trim(),
    description: opts.description.trim(),
    category: opts.categoryId,
    subcategory: opts.subcategory.trim(),
    priceMode: "exact",
    price: primary.price,
    priceType: primary.priceType,
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
      rentalRates: rates.map((r) => ({
        priceType: r.priceType,
        price: r.price,
      })),
      ...(hasWeightRate && weightPricing
        ? {
            weightPricing: {
              weightUnit: weightPricing.weightUnit || "ton",
              distanceUnit: weightPricing.distanceUnit || "km",
              ...(weightPricing.slabs?.length
                ? {
                    slabs: weightPricing.slabs.map((s) => ({
                      maxWeight: s.maxWeight,
                      ratePerKm: s.ratePerKm,
                    })),
                  }
                : {}),
            },
          }
        : {}),
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

/** Card hint when listing has multiple rental units (hour/day/month/…). */
export function formatRentalMoreRatesHint(
  metadata?: Record<string, unknown> | null,
  fallback?: { priceType?: string | null; price?: number | null }
): string | null {
  const rates = parseRentalRates(metadata, fallback);
  if (rates.length <= 1) return null;
  const primary = pickPrimaryRate(rates);
  const others = rates.filter((r) => r.priceType !== primary?.priceType);
  if (others.length === 0) return null;
  const labels = others.map((r) => {
    const opt = MACHINE_RENTAL_PRICE_TYPES.find((o) => o.value === r.priceType);
    return opt?.title || r.priceType.replace(/_/g, " ");
  });
  return `More rates: ${labels.join(" · ")}`;
}
