export type ServicePriceInput = {
  price?: number | string | null;
  priceMode?: "exact" | "range" | string | null;
  priceMin?: number | string | null;
  priceMax?: number | string | null;
  priceType?: string | null;
};

const priceTypeLabels: Record<string, string> = {
  fixed: "",
  hourly: "/hr",
  daily: "/day",
  per_minute: "/min",
  per_article: "/article",
  monthly: "/mo",
  per_kg: "/kg",
  per_litre: "/litre",
  per_unit: "/unit",
  metric_ton: "/metric ton",
  per_sqft: "/sqft",
  per_sqm: "/sqm",
  per_load: "/load",
  per_trip: "/trip",
  per_cuft: "/cuft",
  per_cum: "/cum",
  per_metre: "/metre",
  per_bag: "/bag",
  lumpsum: "",
  per_project: "/project",
  negotiable: "",
};

function toPositiveNumber(value: ServicePriceInput["price"]): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatRupees(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function getServicePriceUnit(priceType?: string | null): string {
  return priceType ? priceTypeLabels[priceType] || "" : "";
}

export function isRangePricedService(service: ServicePriceInput): boolean {
  return service.priceMode === "range";
}

export function formatServicePrice(service: ServicePriceInput): string {
  const unit = getServicePriceUnit(service.priceType);
  if (isRangePricedService(service)) {
    const min = toPositiveNumber(service.priceMin ?? service.price);
    const max = toPositiveNumber(service.priceMax);
    if (min && max) return `${formatRupees(min)} - ${formatRupees(max)}${unit ? ` ${unit}` : ""}`;
    if (min) return `${formatRupees(min)} onwards${unit ? ` ${unit}` : ""}`;
    return "Contact for pricing";
  }

  const exact = toPositiveNumber(service.price);
  if (!exact) return "Contact for pricing";
  return `${formatRupees(exact)}${unit ? ` ${unit}` : ""}`;
}
