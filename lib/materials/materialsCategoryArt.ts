/**
 * Construction Materials category art from assets/services/constructionMaterial.
 */

import type { StaticImageData } from "next/image";
import type { MaterialsCategoryId } from "@/lib/materials/constructionMaterialsCatalog";
import cementBag from "@/assets/services/constructionMaterial/cementBag.png";
import steel from "@/assets/services/constructionMaterial/steel.png";
import bricks from "@/assets/services/constructionMaterial/bricks.png";
import sand from "@/assets/services/constructionMaterial/sand.png";
import aggregate from "@/assets/services/constructionMaterial/aggregate.png";
import paint from "@/assets/services/constructionMaterial/paint.png";
import tiles from "@/assets/services/constructionMaterial/tiles.png";
import rccPipe from "@/assets/services/constructionMaterial/rccPipe.webp";
import concrete from "@/assets/services/constructionMaterial/concrete.png";
import hardware from "@/assets/services/constructionMaterial/hardware.png";
import gsb from "@/assets/services/constructionMaterial/gsb.png";
import fencingPoles from "@/assets/services/constructionMaterial/fencingPoles.png";
import materialsFallback from "@/assets/services/materials.png";

const CATEGORY_ART: Record<string, StaticImageData> = {
  cement: cementBag,
  steel,
  bricks,
  sand,
  aggregate,
  aggregates: aggregate,
  paint,
  "primer-paints": paint,
  primer_paints: paint,
  tiles,
  tiles_flooring: tiles,
  "tiles-flooring": tiles,
  rcc: rccPipe,
  "rcc-pipe": rccPipe,
  rcc_pipe: rccPipe,
  concrete,
  admixture: paint,
  gsb,
  "gsb-copra": gsb,
  gsb_copra: gsb,
  copra: gsb,
  sanitary: tiles,
  sanitary_bathroom: tiles,
  "sanitary-bathroom": tiles,
  hardware,
  fencing: fencingPoles,
  "fencing-poles": fencingPoles,
  fencing_poles: fencingPoles,
  fencingpoles: fencingPoles,
};

export function getMaterialsCategoryArt(id: MaterialsCategoryId): StaticImageData {
  const key = String(id || "").toLowerCase().trim();
  if (CATEGORY_ART[key]) return CATEGORY_ART[key];
  for (const known of Object.keys(CATEGORY_ART)) {
    if (key.includes(known) || known.includes(key)) return CATEGORY_ART[known];
  }
  return materialsFallback;
}
