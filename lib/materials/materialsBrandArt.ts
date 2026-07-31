/**
 * Trending brand logos from assets/services/brands.
 */

import type { StaticImageData } from "next/image";
import ultratech from "@/assets/services/brands/ultratech.png";
import acc from "@/assets/services/brands/acc.png";
import ambuja from "@/assets/services/brands/ambuja.png";
import jk from "@/assets/services/brands/jk.png";
import tata from "@/assets/services/brands/tata.png";
import dalmia from "@/assets/services/brands/dalmia.png";
import moira from "@/assets/services/brands/moira.png";

const BRAND_ART: Record<string, StaticImageData> = {
  ultratech,
  acc,
  ambuja,
  jk,
  tata,
  dalmia,
  moira,
};

export function getMaterialsBrandArt(id: string): StaticImageData | null {
  const key = String(id || "").toLowerCase().trim();
  return BRAND_ART[key] ?? null;
}
