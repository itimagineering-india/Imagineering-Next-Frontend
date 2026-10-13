/** Google allows max ~50k URLs per sitemap file; we split below that for safety. */
export const MAX_URLS_PER_SITEMAP_FILE = 5000;

/** SEO static paths only — no /cart, /login, /dashboard, /admin, /buyer, checkouts, etc. */
export const STATIC_SEO_PATHS = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/services",
  "/pricing",
  "/help",
  "/careers",
  "/community",
  "/subscriptions",
  "/subscriptions/buyer",
  "/subscriptions/supplier",
  "/jobs",
  "/requirement/submit",
  "/join-provider",
  "/construction-materials",
  "/manpower",
  "/machine-rental",
  "/machine-resale",
  "/tools",
  "/b2b-services",
  "/construction-calculator",
  "/standard-prices",
  "/imagineering-credit",
] as const;

/**
 * Known public hub type-key routes (must match existing App Router segments).
 * Do not invent keys that have no page template.
 */
export const SITEMAP_MATERIALS_TYPE_KEYS = [
  "cement",
  "sand",
  "steel",
  "aggregate",
  "bricks",
  "tiles_flooring",
  "sanitary",
  "paint",
  "concrete",
  "admixture",
  "gsb",
  "hardware",
  "fencing_poles",
] as const;

/** Construction calculator type slugs used by hub UI (`TYPE_HINTS`). */
export const SITEMAP_CALCULATOR_TYPE_SLUGS = [
  "house",
  "villa",
  "apartment",
  "commercial-building",
  "warehouse",
  "shop",
  "boundary-wall",
  "road",
  "shed",
] as const;

/**
 * Public path prefix for listing/detail pages (spec: `/product/[slug]`; this app uses `/service/[slug]` by default).
 * Set `NEXT_PUBLIC_SITEMAP_PRODUCT_PATH=/product` if you add a matching route or rewrite.
 */
export function getProductPathPrefix(): string {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SITEMAP_PRODUCT_PATH?.trim()
      : undefined;
  const p = (raw || "/service").replace(/\/$/, "");
  return p.startsWith("/") ? p : `/${p}`;
}
