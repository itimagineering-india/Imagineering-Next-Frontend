/**
 * Append width hint for CDNs or image workers that support `?w=` (no-op for hosts that ignore it).
 */
export function withListImageParams(raw: string | undefined | null, width = 300): string {
  if (raw == null || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const base =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost";
    const u = /^https?:\/\//i.test(trimmed) ? new URL(trimmed) : new URL(trimmed, base);
    if (!u.searchParams.has("w")) {
      u.searchParams.set("w", String(width));
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}
