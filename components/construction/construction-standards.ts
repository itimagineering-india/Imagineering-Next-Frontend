/**
 * User-facing meaning of "construction standard".
 * Engine: standard picks stage/material consumption rules with a matching standardId
 * (e.g. economy tiles, premium paint). It is NOT a global % on total cost.
 * Structure/foundation use separate rules unless a standard-specific rule exists.
 */

export type StandardSlug = "economy" | "standard" | "premium" | "luxury" | string;

export interface StandardGuide {
  summary: string;
  /** Short tags shown under the option */
  affects: string[];
  /** What typically stays the same */
  notAffected?: string;
}

export const STANDARD_SECTION_INTRO =
  "Finish quality level — changes material grades and quantities for flooring, painting, and selected finishes. RCC / structure rates stay the same unless separate rules exist.";

export const STANDARD_GUIDE_BY_SLUG: Record<string, StandardGuide> = {
  economy: {
    summary: "Basic finishes — lower tile/paint specs where rules are set.",
    affects: ["Flooring (tiles)", "Basic paint"],
    notAffected: "Cement, steel, brickwork (unless configured)",
  },
  standard: {
    summary: "Typical mid-range finish for most homes and shops.",
    affects: ["Flooring", "Painting", "General finishes"],
    notAffected: "Core structure quantities",
  },
  premium: {
    summary: "Upgraded tiles, paint, and selected finish materials.",
    affects: ["Better tiles", "Higher paint use", "Branded finishes"],
    notAffected: "Foundation & RCC base rules",
  },
  luxury: {
    summary: "High-end finish specs where luxury rules are configured.",
    affects: ["Premium finishes", "High-grade materials"],
    notAffected: "Uses standard rules if luxury rules are missing",
  },
};

export function getStandardGuide(
  slugOrName: string | undefined | null,
  apiDescription?: string | null
): StandardGuide {
  const key = (slugOrName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const known = STANDARD_GUIDE_BY_SLUG[key];
  if (known) {
    return {
      ...known,
      summary: apiDescription?.trim() || known.summary,
    };
  }
  return {
    summary: apiDescription?.trim() || "Finish quality for this estimate.",
    affects: ["Finish materials"],
  };
}
