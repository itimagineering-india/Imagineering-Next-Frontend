import { BASE_URL } from "@/lib/constants";

/** Canonical site origin for sitemaps, canonical tags, robots. No trailing slash. */
export function getSiteUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL?.trim()) || BASE_URL;
  return String(raw).replace(/\/$/, "");
}
