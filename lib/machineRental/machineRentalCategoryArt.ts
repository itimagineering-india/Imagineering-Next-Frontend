/**
 * Machine Rental category art — exact category → related equipment image.
 */

import type { StaticImageData } from "next/image";
import { resolveRentalCategoryKey } from "@/lib/machineRental/machineRentalHubCatalog";
import earthwork from "@/assets/services/machineRental/earthwork.png";
import concrete from "@/assets/services/machineRental/concrete.png";
import lifting from "@/assets/services/machineRental/lifting.png";
import road from "@/assets/services/machineRental/road.png";
import demolition from "@/assets/services/machineRental/demolition.png";
import drilling from "@/assets/services/machineRental/drilling.png";
import compaction from "@/assets/services/machineRental/compaction.png";
import power from "@/assets/services/machineRental/power.png";
import welding from "@/assets/services/machineRental/welding.png";
import cleaning from "@/assets/services/machineRental/cleaning.png";
import water from "@/assets/services/machineRental/water.png";
import height from "@/assets/services/machineRental/height.png";
import survey from "@/assets/services/machineRental/survey.png";
import garden from "@/assets/services/machineRental/garden.png";
import transport from "@/assets/services/machineRental/transport.png";
import stone from "@/assets/services/machineRental/stone.png";
import wood from "@/assets/services/machineRental/wood.png";
import paint from "@/assets/services/machineRental/paint.png";
import excavator from "@/assets/services/machineRental/excavator.png";
import jcb from "@/assets/services/machineRental/jcb.png";
import crane from "@/assets/services/machineRental/crane.png";
import roller from "@/assets/services/machineRental/roller.png";
import mixer from "@/assets/services/machineRental/mixer.png";
import generator from "@/assets/services/machineRental/generator.png";
import tractor from "@/assets/services/machineRental/tractor.png";
import fallback from "@/assets/services/machineRental/fallback.png";
import machineRentalFallback from "@/assets/services/machine-rental.png";

/** Exact slug / alias → art. Prefer exact match; avoid fuzzy cross-matches. */
const CATEGORY_ART: Record<string, StaticImageData> = {
  // Primary hub categories (buyer catalog)
  "earthwork-excavation": earthwork,
  earthwork: earthwork,
  excavation: earthwork,
  excavator,

  "concrete-construction": concrete,
  concrete: concrete,
  "transit-mixer": mixer,
  mixer,

  "lifting-material-handling": lifting,
  lifting: lifting,
  "material-handling": lifting,
  crane,

  "road-construction": road,
  road: road,
  asphalt: road,

  demolition: demolition,

  "drilling-foundation": drilling,
  drilling: drilling,
  foundation: drilling,

  compaction: compaction,
  "road-roller": roller,
  roller: roller,
  compactor: compaction,

  "power-electrical": power,
  power: power,
  electrical: power,
  generator: generator,

  "welding-fabrication": welding,
  welding: welding,
  fabrication: welding,

  "cleaning-equipment": cleaning,
  cleaning: cleaning,

  "water-management": water,
  water: water,

  "height-access": height,
  height: height,
  scaffolding: height,

  "survey-equipment": survey,
  survey: survey,

  "gardening-landscaping": garden,
  gardening: garden,
  landscaping: garden,

  "material-transport": transport,
  transport: transport,
  dumper: transport,
  tipper: transport,
  truck: transport,

  "stone-tile-work": stone,
  "stone-tile": stone,
  tile: stone,

  woodworking: wood,
  wood: wood,

  "painting-equipment": paint,
  painting: paint,

  jcb,
  backhoe: jcb,
  loader: jcb,
  bobcat: jcb,
  tractor,
};

export function getMachineRentalCategoryArt(
  categoryIdOrName: string
): StaticImageData {
  const raw = String(categoryIdOrName || "").trim();
  if (!raw) return machineRentalFallback || fallback;

  const resolved = resolveRentalCategoryKey(raw);
  if (resolved && CATEGORY_ART[resolved]) return CATEGORY_ART[resolved];

  const slug = raw
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (CATEGORY_ART[slug]) return CATEGORY_ART[slug];

  const compact = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  for (const [known, art] of Object.entries(CATEGORY_ART)) {
    const knownCompact = known.replace(/-/g, "");
    if (compact === knownCompact) return art;
  }

  // Word-token match (ordered, longer keys first) — no substring false positives like "construction"
  const tokens = raw.toLowerCase();
  const ordered = Object.keys(CATEGORY_ART).sort((a, b) => b.length - a.length);
  for (const known of ordered) {
    const label = known.replace(/-/g, " ");
    if (tokens.includes(label) || label.split(" ").every((w) => w && tokens.includes(w))) {
      return CATEGORY_ART[known];
    }
  }

  return fallback;
}
