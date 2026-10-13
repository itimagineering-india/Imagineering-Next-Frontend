import type { Category } from "./api";

function toTitleCase(value: string): string {
  return value
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Titles omit site name — root layout `title.template` appends `| Imagineering India`. */
export function getCategoryTitle(category: Category): string {
  const name = category.name || toTitleCase(category.slug);
  return `Best ${name} Services`;
}

export function getCategoryCityTitle(categoryName: string, citySlug: string): string {
  const city = toTitleCase(citySlug);
  return `Best ${categoryName} in ${city}`;
}

export function getCategoryCityLocalityTitle(
  categoryName: string,
  citySlug: string,
  localitySlug: string,
): string {
  const city = toTitleCase(citySlug);
  const locality = toTitleCase(localitySlug);
  return `Best ${categoryName} in ${locality}, ${city}`;
}

export function getCategoryCityDescription(categoryName: string, citySlug: string): string {
  const city = toTitleCase(citySlug);
  return `Find verified ${categoryName} providers in ${city}. Compare prices, ratings, and book easily.`;
}

export function getCategoryCityLocalityDescription(
  categoryName: string,
  citySlug: string,
  localitySlug: string,
): string {
  const city = toTitleCase(citySlug);
  const locality = toTitleCase(localitySlug);
  return `Discover trusted ${categoryName} providers in ${locality}, ${city}. Compare prices, ratings, and book easily.`;
}

export function getServiceTitle(serviceTitle: string, categoryName?: string, city?: string): string {
  if (categoryName && city) {
    const cityName = toTitleCase(city);
    return `${serviceTitle} | ${categoryName} in ${cityName}`;
  }
  return serviceTitle;
}

export function getServiceDescription(
  categoryName?: string,
  citySlug?: string,
): string {
  if (!categoryName || !citySlug) {
    return "View detailed information, pricing, and reviews for this service on Imagineering India.";
  }
  const city = toTitleCase(citySlug);
  return `View detailed information, pricing, and reviews for this ${categoryName} service in ${city}.`;
}

