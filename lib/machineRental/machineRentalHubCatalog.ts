/**
 * Machine Rental hub — shared types + pure helpers (web buyer hub).
 */

import { MACHINE_RENTAL_CATEGORY_SLUGS, MACHINE_RENTAL_FALLBACK_TYPES } from "@/lib/machineRental";

export const RENTAL_CATEGORY_SLUG = "rental-services";
export const RENTAL_CATEGORY_SLUG_ALIASES = [
  ...MACHINE_RENTAL_CATEGORY_SLUGS,
] as const;

const RENTAL_SLUG_SET = new Set<string>([
  ...RENTAL_CATEGORY_SLUG_ALIASES,
  "machine_rental",
  "equipment-rental",
]);

const MATERIALS_SLUG_SET = new Set([
  "construction-materials",
  "construction_materials",
  "materials",
  "b2b",
  "manpower",
]);

export function isRentalListingRow(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw || typeof raw !== "object") return false;

  const slugCandidates = [
    raw.categorySlug,
    (raw.metadata as Record<string, unknown> | undefined)?.categorySlug,
    (raw.category as Record<string, unknown> | undefined)?.slug,
    (raw.category as Record<string, unknown> | undefined)?.categorySlug,
  ]
    .map((s) => String(s || "").trim().toLowerCase())
    .filter(Boolean);

  if (slugCandidates.some((s) => MATERIALS_SLUG_SET.has(s))) return false;
  if (slugCandidates.some((s) => RENTAL_SLUG_SET.has(s))) return true;

  const formVariant = String(
    (raw.metadata as Record<string, unknown> | undefined)?.formVariant || raw.formVariant || ""
  )
    .trim()
    .toLowerCase();
  if (formVariant.includes("rental")) return true;

  const itemType = String((raw.metadata as Record<string, unknown> | undefined)?.itemType || "")
    .trim()
    .toLowerCase();
  if (itemType === "machine" || itemType === "equipment") return true;

  const blob = `${raw.name || ""} ${raw.title || ""} ${raw.subcategory || ""} ${
    raw.materialTypeKey || ""
  }`.toLowerCase();
  if (
    /\b(brick|cement|sand|aggregate|gitti|steel|tmt|tile|block|concrete|bajri|dust)\b/.test(blob)
  ) {
    return false;
  }

  return false;
}

export type RentalMachineCategory = {
  id: string;
  name: string;
  mark: string;
  tint: string;
};

export type RentalMachine = {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  priceLabel: string;
  priceMin?: number;
  imageUri?: string;
  available: boolean;
  serviceId?: string;
  slug?: string;
};

export type RentalTopProvider = {
  id: string;
  name: string;
  mark: string;
  specialty: string;
  city: string;
  rating: number;
  reviewCount: number;
  responseMins: number;
  distanceKm: number;
  verified: boolean;
  tint: string;
};

export const RENTAL_CATEGORY_TINTS = [
  "#FFEDD5",
  "#FEF3C7",
  "#FEE2E2",
  "#E0E7FF",
  "#D1FAE5",
  "#FCE7F3",
  "#CFFAFE",
  "#F3E8FF",
] as const;

export const RENTAL_SEARCH_PLACEHOLDERS = [
  "Search excavator…",
  "Search crane…",
  "Search JCB…",
  "Search dumper…",
  "Search roller…",
] as const;

export const RENTAL_FALLBACK_CATEGORIES: readonly string[] = MACHINE_RENTAL_FALLBACK_TYPES;

export function slugifyRentalId(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function rentalMarkFromName(name: string): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "MR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function resolveRentalCategoryKey(raw: string): string {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/&/g, " ");
  if (!s) return "";

  // Hub categories (order matters — more specific first)
  if (/earthwork|excavation/.test(s) && !/demolition/.test(s)) return "earthwork-excavation";
  if (/concrete/.test(s) && /construction|mixer|cement/.test(s)) return "concrete-construction";
  if (/^concrete$/.test(s.trim())) return "concrete-construction";
  if (/lifting|material\s*handling|crane|hydra|boom\s*lift/.test(s)) return "lifting-material-handling";
  if (/road\s*construction|asphalt|paving|paver/.test(s)) return "road-construction";
  if (/demolition|breaker|wrecking/.test(s)) return "demolition";
  if (/drilling|foundation|pile|auger/.test(s)) return "drilling-foundation";
  if (/compaction|compactor|roller/.test(s) && !/road\s*construction/.test(s)) return "compaction";
  if (/power|electrical|generator|dg\s*set/.test(s)) return "power-electrical";
  if (/welding|fabrication/.test(s)) return "welding-fabrication";
  if (/clean/.test(s)) return "cleaning-equipment";
  if (/water/.test(s)) return "water-management";
  if (/height|scaffold|aerial|scissor\s*lift/.test(s)) return "height-access";
  if (/survey|total\s*station|theodolite/.test(s)) return "survey-equipment";
  if (/garden|landscape/.test(s)) return "gardening-landscaping";
  if (/material\s*transport|dump|tipper|truck/.test(s)) return "material-transport";
  if (/stone|tile/.test(s)) return "stone-tile-work";
  if (/wood|carpentry/.test(s)) return "woodworking";
  if (/paint/.test(s)) return "painting-equipment";

  // Classic machine types
  if (/\bjcb\b|backhoe/.test(s)) return "jcb";
  if (/excavat/.test(s)) return "excavator";
  if (/crane|hydra/.test(s)) return "crane";
  if (/loader|bobcat/.test(s)) return "loader";
  if (/mixer|transit/.test(s)) return "transit-mixer";
  if (/generat/.test(s)) return "generator";
  if (/tractor/.test(s)) return "tractor";

  return slugifyRentalId(s);
}

export function formatRentalPriceLabel(raw: {
  suggestedPriceDaily?: number | null;
  suggestedPriceHourly?: number | null;
  suggestedPriceMin?: number | null;
  suggestedPriceMax?: number | null;
  suggestedPriceType?: string | null;
}): string {
  const daily = Number(raw.suggestedPriceDaily);
  if (Number.isFinite(daily) && daily > 0) {
    return `₹${Math.round(daily).toLocaleString("en-IN")} / day`;
  }
  const hourly = Number(raw.suggestedPriceHourly);
  if (Number.isFinite(hourly) && hourly > 0) {
    return `₹${Math.round(hourly).toLocaleString("en-IN")} / hr`;
  }
  const type = String(raw.suggestedPriceType || "").toLowerCase();
  const lo = Number(raw.suggestedPriceMin);
  const hi = Number(raw.suggestedPriceMax);
  const hasLo = Number.isFinite(lo) && lo > 0;
  const hasHi = Number.isFinite(hi) && hi > 0;
  const unit = type.includes("hour") ? "/ hr" : "/ day";
  if (hasLo && hasHi && lo !== hi) {
    return `₹${Math.round(lo).toLocaleString("en-IN")} – ₹${Math.round(hi).toLocaleString("en-IN")} ${unit}`;
  }
  if (hasLo) return `₹${Math.round(lo).toLocaleString("en-IN")} ${unit}`;
  if (hasHi) return `Up to ₹${Math.round(hi).toLocaleString("en-IN")} ${unit}`;
  return "";
}

export function groupRentalMachinesByCategory(
  categories: readonly RentalMachineCategory[],
  machines: readonly RentalMachine[]
): Array<{ category: RentalMachineCategory; items: RentalMachine[] }> {
  return categories
    .map((category) => ({
      category,
      items: machines.filter((m) => m.categoryId === category.id).slice(0, 8),
    }))
    .filter((row) => row.items.length > 0);
}

export function rentalMachineHref(machine: RentalMachine): string {
  if (machine.serviceId) {
    return `/machine-rental/listing/${machine.serviceId}`;
  }
  const sp = new URLSearchParams();
  sp.set("category", "machine-rental");
  sp.set("q", machine.name);
  if (machine.categoryId) sp.set("subcategory", machine.categoryId);
  return `/services?${sp.toString()}`;
}
