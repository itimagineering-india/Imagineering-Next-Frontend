/** Google allows max ~50k URLs per sitemap file; we split below that for safety. */
export const MAX_URLS_PER_SITEMAP_FILE = 5000;

/** SEO static paths only — no /cart, /login, /search, /admin, etc. */
export const STATIC_SEO_PATHS = [
  "/",
  "/about",
  "/contact",
  "/privacy",
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
