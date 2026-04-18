/**
 * Query string for `/services` when opening a category from home (row header, placeholder tiles).
 * Intentionally **category only** — do not pin `lat`/`lng`/`tile` from persisted context, or the
 * Services page treats the URL as authoritative and skips fresh GPS, showing stale-area results.
 */
export function buildServicesBrowseQuery(categoryValue: string): string {
  const sp = new URLSearchParams();
  sp.set("category", categoryValue);
  return sp.toString();
}
