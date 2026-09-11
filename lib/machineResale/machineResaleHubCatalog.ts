/**
 * Machine Resale hub — types + filters (buyer browse of used machines for sale).
 * Keep separate from provider form helpers in `lib/machineResale.ts`.
 */

import {
  rentalMarkFromName,
  resolveRentalCategoryKey,
  slugifyRentalId,
  type RentalMachine,
  type RentalMachineCategory,
  type RentalTopProvider,
} from "@/lib/machineRental/machineRentalHubCatalog";
import { MACHINE_RESALE_FALLBACK_TYPES } from "@/lib/machineResale";

export const RESALE_TEAL = "#0F766E";
export const RESALE_CANVAS = "#F0FDFA";

export const RESALE_CATEGORY_SLUG = "machines";
export const RESALE_CATEGORY_SLUG_ALIASES = [
  "machine-resale",
  "machine_resale",
  "machines",
] as const;

export type ResaleMachineCategory = RentalMachineCategory;
export type ResaleMachine = RentalMachine;
export type ResaleTopProvider = RentalTopProvider;

export const RESALE_FALLBACK_CATEGORIES: readonly string[] = MACHINE_RESALE_FALLBACK_TYPES;

export const RESALE_SEARCH_PLACEHOLDERS = [
  "Search excavators for sale…",
  "Search used JCBs…",
  "Search cranes…",
  "Search generators…",
] as const;

export const RESALE_CATEGORY_TINTS = [
  "#CCFBF1",
  "#E0F2FE",
  "#E0E7FF",
  "#FEF3C7",
  "#FFE4E6",
  "#DCFCE7",
] as const;

const RESALE_SLUG_SET = new Set<string>([
  ...RESALE_CATEGORY_SLUG_ALIASES,
  "machine-sale",
  "used-machines",
]);

const EXCLUDE_SLUG_SET = new Set([
  "construction-materials",
  "construction_materials",
  "materials",
  "b2b",
  "manpower",
  "rental-services",
  "machine-rental",
  "rental",
  "equipment-rental",
  "machine_rental",
]);

const RENTAL_PRICE_TYPES = new Set([
  "hourly",
  "daily",
  "monthly",
  "per_km",
  "per_km_weight",
  "per_km_weight_slab",
  "per_trip",
]);

function listingSlugCandidates(raw: Record<string, unknown>): string[] {
  return [
    raw.categorySlug,
    (raw.metadata as Record<string, unknown> | undefined)?.categorySlug,
    (raw.category as Record<string, unknown> | undefined)?.slug,
    (raw.category as Record<string, unknown> | undefined)?.categorySlug,
  ]
    .map((s) => String(s || "").trim().toLowerCase().replace(/_/g, "-"))
    .filter(Boolean);
}

function listingFormVariant(raw: Record<string, unknown>): string {
  return String(
    (raw.metadata as Record<string, unknown> | undefined)?.formVariant || raw.formVariant || ""
  )
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

/** Rental booking signals — never show these on Machine Resale. */
export function hasMachineRentalSignals(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw || typeof raw !== "object") return false;
  const formVariant = listingFormVariant(raw);
  if (formVariant.includes("rental")) return true;

  const slugs = listingSlugCandidates(raw);
  if (slugs.some((s) => EXCLUDE_SLUG_SET.has(s))) return true;

  const rates = (raw.metadata as Record<string, unknown> | undefined)?.rentalRates;
  if (Array.isArray(rates) && rates.length > 0) return true;

  const listingType = String(
    (raw.metadata as Record<string, unknown> | undefined)?.listingType || ""
  )
    .trim()
    .toLowerCase();
  if (listingType === "rental" || listingType === "hire") return true;

  const priceType = String(
    raw.priceType || (raw.metadata as Record<string, unknown> | undefined)?.priceType || ""
  )
    .trim()
    .toLowerCase();
  if (RENTAL_PRICE_TYPES.has(priceType)) {
    if (listingType === "resale" || listingType === "sale") return false;
    if (formVariant === "machine_resale" || formVariant === "machines") return false;
    return true;
  }

  return false;
}

export function isResaleListingRow(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw || typeof raw !== "object") return false;
  if (hasMachineRentalSignals(raw)) return false;

  const slugCandidates = listingSlugCandidates(raw);
  if (slugCandidates.some((s) => EXCLUDE_SLUG_SET.has(s))) return false;
  if (slugCandidates.some((s) => RESALE_SLUG_SET.has(s))) return true;

  const formVariant = listingFormVariant(raw);
  if (formVariant === "machine_resale" || formVariant === "machines") return true;

  const listingType = String(
    (raw.metadata as Record<string, unknown> | undefined)?.listingType || ""
  )
    .trim()
    .toLowerCase();
  if (listingType === "resale" || listingType === "sale") return true;

  return false;
}

export function formatResalePriceLabel(
  raw:
    | {
        price?: number | string | null;
        priceMode?: string | null;
        priceMin?: number | string | null;
        priceMax?: number | string | null;
      }
    | null
    | undefined
): string {
  if (!raw) return "";
  if (String(raw.priceMode || "").toLowerCase() === "range") {
    const lo = Number(raw.priceMin);
    const hi = Number(raw.priceMax);
    if (Number.isFinite(lo) && lo > 0 && Number.isFinite(hi) && hi > lo) {
      return `₹${Math.round(lo).toLocaleString("en-IN")} – ₹${Math.round(hi).toLocaleString("en-IN")}`;
    }
    if (Number.isFinite(lo) && lo > 0) {
      return `₹${Math.round(lo).toLocaleString("en-IN")}`;
    }
  }
  const exact = Number(raw.price);
  if (Number.isFinite(exact) && exact > 0) {
    return `₹${Math.round(exact).toLocaleString("en-IN")}`;
  }
  return "";
}

export function resolveResaleCategoryKey(name: string): string {
  return resolveRentalCategoryKey(name);
}

export function resaleMarkFromName(name: string): string {
  return rentalMarkFromName(name);
}

export function slugifyResaleId(name: string): string {
  return slugifyRentalId(name);
}

export function machineMatchesResaleCategory(
  machine: ResaleMachine,
  category: ResaleMachineCategory
): boolean {
  return (
    machine.categoryId === category.id ||
    resolveResaleCategoryKey(machine.categoryName || "") === category.id
  );
}

export function groupResaleMachinesByCategory(
  categories: readonly ResaleMachineCategory[],
  machines: readonly ResaleMachine[]
): Array<{ category: ResaleMachineCategory; items: ResaleMachine[] }> {
  return categories
    .map((category) => ({
      category,
      items: machines.filter((m) => machineMatchesResaleCategory(m, category)).slice(0, 8),
    }))
    .filter((row) => row.items.length > 0);
}

/** Service detail page — not rental checkout. */
export function resaleMachineHref(machine: ResaleMachine): string {
  if (machine.serviceId) {
    return `/service/${encodeURIComponent(machine.slug || machine.serviceId)}`;
  }
  const sp = new URLSearchParams();
  sp.set("category", "machines");
  sp.set("q", machine.name);
  if (machine.categoryId) sp.set("subcategory", machine.categoryId);
  return `/services?${sp.toString()}`;
}
