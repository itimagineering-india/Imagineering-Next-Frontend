/**
 * AUTO-SYNCED — do not edit here.
 * Source: backend/src/constants/servicePriceTypes.ts
 * Refresh: cd backend && npm run sync:price-types
 */

export const SERVICE_PRICE_TYPE_VALUES = [
  "fixed",
  "hourly",
  "daily",
  "per_minute",
  "per_article",
  "monthly",
  "per_kg",
  "per_litre",
  "per_unit",
  "metric_ton",
  "per_sqft",
  "per_sqm",
  "per_load",
  "per_trip",
  "per_km",
  "per_km_weight",
  "per_km_weight_slab",
  "per_cuft",
  "per_cum",
  "per_metre",
  "per_bag",
  "per_box",
  "lumpsum",
  "per_project",
  "negotiable",
] as const;

export type ServicePriceTypeValue = (typeof SERVICE_PRICE_TYPE_VALUES)[number];

/** Subset shown on construction materials product catalog (suggested price type). */
export const CATALOG_SUGGESTED_PRICE_TYPE_VALUES = [
  "per_bag",
  "per_box",
  "per_cum",
  "metric_ton",
  "per_load",
  "per_unit",
  "per_sqft",
  "per_kg",
  "hourly",
  "daily",
  "fixed",
  "negotiable",
] as const satisfies readonly ServicePriceTypeValue[];

type PriceTypeMeta = {
  label: string;
  /** Suffix after ₹ amount, e.g. "/bag" */
  suffix: string;
  /** Admin dropdown label (defaults to `label`) */
  adminLabel?: string;
};

const META: Record<ServicePriceTypeValue, PriceTypeMeta> = {
  fixed: { label: "Fixed price", suffix: "", adminLabel: "Fixed" },
  hourly: { label: "Per hour", suffix: "/hr", adminLabel: "Per hour" },
  daily: { label: "Per day", suffix: "/day", adminLabel: "Per day" },
  per_minute: { label: "Per minute", suffix: "/min", adminLabel: "Per minute" },
  per_article: { label: "Per article", suffix: "/article", adminLabel: "Per article" },
  monthly: { label: "Per month", suffix: "/mo", adminLabel: "Monthly" },
  per_kg: { label: "Per kg", suffix: "/kg", adminLabel: "Per kg" },
  per_litre: { label: "Per litre", suffix: "/litre", adminLabel: "Per litre" },
  per_unit: { label: "Per unit", suffix: "/unit", adminLabel: "Per unit" },
  metric_ton: { label: "Per metric ton", suffix: "/metric ton", adminLabel: "Metric ton" },
  per_sqft: { label: "Per sq ft", suffix: "/sqft", adminLabel: "Per sq ft" },
  per_sqm: { label: "Per sq m", suffix: "/sqm", adminLabel: "Per sq m" },
  per_load: { label: "Per load", suffix: "/load", adminLabel: "Per load" },
  per_trip: { label: "Per trip", suffix: "/trip", adminLabel: "Per trip" },
  per_km: { label: "Per km", suffix: "/km", adminLabel: "Per km" },
  per_km_weight: { label: "Per km × weight", suffix: "/km/ton", adminLabel: "Per km × weight" },
  per_km_weight_slab: {
    label: "Per km + weight slab",
    suffix: "/km by weight",
    adminLabel: "Per km + weight slab",
  },
  per_cuft: { label: "Per cu ft", suffix: "/cuft", adminLabel: "Per cu ft" },
  per_cum: { label: "Per cum", suffix: "/cum", adminLabel: "Per cubic meter" },
  per_metre: { label: "Per metre", suffix: "/metre", adminLabel: "Per metre" },
  per_bag: { label: "Per bag", suffix: "/bag", adminLabel: "Per bag" },
  per_box: { label: "Per box", suffix: "/box", adminLabel: "Per box" },
  lumpsum: { label: "Lumpsum", suffix: "", adminLabel: "Lumpsum" },
  per_project: { label: "Per project", suffix: "/project", adminLabel: "Per project" },
  negotiable: { label: "Negotiable", suffix: "", adminLabel: "Negotiable" },
};

export const SERVICE_PRICE_TYPE_SET = new Set<string>(SERVICE_PRICE_TYPE_VALUES);

export function isAllowedServicePriceType(v: string): v is ServicePriceTypeValue {
  return SERVICE_PRICE_TYPE_SET.has(v);
}

export function getPriceTypeLabel(priceType: string | null | undefined): string {
  if (!priceType) return "";
  const m = META[priceType as ServicePriceTypeValue];
  return m?.label ?? priceType.replace(/_/g, " ");
}

export function getPriceTypeSuffix(priceType: string | null | undefined): string {
  if (!priceType) return "";
  const m = META[priceType as ServicePriceTypeValue];
  return m?.suffix ?? "";
}

export function getServicePriceTypeOptions(): { value: ServicePriceTypeValue; label: string }[] {
  return SERVICE_PRICE_TYPE_VALUES.map((value) => ({
    value,
    label: META[value].adminLabel ?? META[value].label,
  }));
}

export function getCatalogSuggestedPriceTypeOptions(): {
  value: ServicePriceTypeValue;
  label: string;
}[] {
  return CATALOG_SUGGESTED_PRICE_TYPE_VALUES.map((value) => ({
    value,
    label: META[value].adminLabel ?? META[value].label,
  }));
}

/** Mongoose / JSON Schema enum list */
export const SERVICE_PRICE_TYPE_ENUM: ServicePriceTypeValue[] = [...SERVICE_PRICE_TYPE_VALUES];
