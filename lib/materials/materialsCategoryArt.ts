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
  concrete: cementBag,
  admixture: cementBag,
};

export function getMaterialsCategoryArt(id: MaterialsCategoryId): StaticImageData {
  const key = String(id || "").toLowerCase().trim();
  if (CATEGORY_ART[key]) return CATEGORY_ART[key];
  for (const known of Object.keys(CATEGORY_ART)) {
    if (key.includes(known) || known.includes(key)) return CATEGORY_ART[known];
  }
  return materialsFallback;
}
