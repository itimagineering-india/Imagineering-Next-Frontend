/** Origin for uploaded media (no /api suffix). */
function getUploadsBaseUrl(): string {
  const fromEnv =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL?.trim() : undefined;
  if (fromEnv) {
    return fromEnv.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && /imagineeringindia\.com$/i.test(window.location.hostname)) {
    return "https://api.imagineeringindia.com";
  }
  return "http://localhost:5000";
}

/**
 * Rewrite avatar/image URLs so they load in production when the backend stored
 * localhost paths during local development, or when paths are relative.
 */
export function getReachableImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;

  const base = getUploadsBaseUrl();

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(trimmed)) {
    const path = trimmed.replace(/^https?:\/\/[^/]+/, "");
    return `${base}${path}`;
  }

  if (trimmed.startsWith("/uploads/") || (trimmed.startsWith("/") && !trimmed.startsWith("//"))) {
    return `${base}${trimmed}`;
  }

  return trimmed;
}
