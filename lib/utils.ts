import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format job location for display: full address if available, else city + state */
export function formatJobLocation(loc: {
  address?: string;
  city?: string;
  state?: string;
} | null | undefined): string | null {
  if (!loc) return null;
  if (loc.address?.trim()) return loc.address.trim();
  if (loc.city) return loc.state ? `${loc.city}, ${loc.state}` : loc.city;
  return null;
}
