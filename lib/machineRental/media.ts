/** Resolve catalog/service image URLs for the machine rental hub. */

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:5000";

export function resolveMachineRentalMediaUrl(raw?: string | null): string | undefined {
  const value = String(raw || "").trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${API_BASE.replace(/\/$/, "")}${value}`;
  return value;
}
