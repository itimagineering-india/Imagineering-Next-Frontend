/**
 * Supported city slugs for local SEO pages (domain.com/bhopal, domain.com/mumbai, etc.)
 * Used by CityServicesPage and Footer.
 * lat/lng are approximate city centers for map and provider radius filtering.
 */
export interface CityItem {
  slug: string;
  name: string;
  lat?: number;
  lng?: number;
}

export const CITIES: CityItem[] = [
  { slug: "bhopal", name: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { slug: "jabalpur", name: "Jabalpur", lat: 23.1815, lng: 79.9864 },
  { slug: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { slug: "delhi", name: "Delhi", lat: 28.7041, lng: 77.1025 },
  { slug: "bangalore", name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { slug: "hyderabad", name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { slug: "chennai", name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { slug: "pune", name: "Pune", lat: 18.5204, lng: 73.8567 },
  { slug: "kolkata", name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { slug: "ahmedabad", name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { slug: "jaipur", name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { slug: "lucknow", name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { slug: "chandigarh", name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { slug: "indore", name: "Indore", lat: 22.7196, lng: 75.8577 },
  { slug: "kochi", name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { slug: "coimbatore", name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { slug: "nagpur", name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { slug: "thane", name: "Thane", lat: 19.2183, lng: 72.9781 },
];

const slugSet = new Set(CITIES.map((c) => c.slug.toLowerCase()));

export function isCitySlug(slug: string): boolean {
  return slugSet.has(slug.toLowerCase());
}

export function getCityBySlug(slug: string): CityItem | undefined {
  const lower = slug.toLowerCase();
  return CITIES.find((c) => c.slug.toLowerCase() === lower);
}
