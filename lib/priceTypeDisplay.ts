/** Suffix shown after ₹ price (aligned with ServiceCard). */
const PRICE_TYPE_SUFFIX: Record<string, string> = {
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

/** Human-readable label for filters / tooltips. */
const PRICE_TYPE_LABEL: Record<string, string> = {
  fixed: "Fixed price",
  hourly: "Per hour",
  daily: "Per day",
  per_minute: "Per minute",
  per_article: "Per article",
  monthly: "Per month",
  per_kg: "Per kg",
  per_litre: "Per litre",
  per_unit: "Per unit",
  metric_ton: "Per metric ton",
  per_sqft: "Per sq ft",
  per_sqm: "Per sq m",
  per_load: "Per load",
  per_trip: "Per trip",
  per_cuft: "Per cu ft",
  per_cum: "Per cum",
  per_metre: "Per metre",
  per_bag: "Per bag",
  lumpsum: "Lumpsum",
  per_project: "Per project",
  negotiable: "Negotiable",
};

export function getPriceTypeSuffix(priceType: string | null | undefined): string {
  if (!priceType) return "";
  return PRICE_TYPE_SUFFIX[priceType] ?? priceType.replace(/_/g, " ");
}

export function getPriceTypeLabel(priceType: string | null | undefined): string {
  if (!priceType) return "";
  return PRICE_TYPE_LABEL[priceType] ?? priceType.replace(/_/g, " ");
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
}

/** e.g. ₹1,200 /hr · Per hour */
export function formatPriceLine(
  price: number | null | undefined,
  priceType: string | null | undefined
): { primary: string; secondary: string } | null {
  if (price == null || !Number.isFinite(price)) {
    if (priceType === "negotiable") return { primary: "Negotiable", secondary: getPriceTypeLabel("negotiable") };
    return null;
  }
  const suf = getPriceTypeSuffix(priceType);
  const label = getPriceTypeLabel(priceType);
  const primary = `₹${formatInr(price)}${suf ? ` ${suf}` : ""}`;
  return { primary, secondary: label };
}
