/**
 * Manpower trade art from assets/services/manpower (bundled into the Next build).
 * Prefer this over /public paths so production deploys always include the images.
 */

import type { StaticImageData } from "next/image";
import { resolveManpowerTradeKey } from "@/lib/manpower/manpowerHubCatalog";
import carpenter from "@/assets/services/manpower/carpenter.png";
import cleaner from "@/assets/services/manpower/cleaner.jpeg";
import cook from "@/assets/services/manpower/cook.jpeg";
import driver from "@/assets/services/manpower/driver.png";
import electrician from "@/assets/services/manpower/electrician.png";
import helper from "@/assets/services/manpower/helper.jpeg";
import mason from "@/assets/services/manpower/masion.jpeg";
import materialTransport from "@/assets/services/manpower/materialTransport.jpeg";
import painter from "@/assets/services/manpower/painter.jpeg";
import plumber from "@/assets/services/manpower/plumber.jpeg";
import supervisor from "@/assets/services/manpower/supervisor.jpeg";
import sweeper from "@/assets/services/manpower/swipper.png";
import tilesMistry from "@/assets/services/manpower/tilesMistry.png";
import welder from "@/assets/services/manpower/weldor.jpeg";

const TRADE_ART: Record<string, StaticImageData> = {
  electrician,
  plumber,
  mason,
  carpenter,
  cook,
  sweeper,
  swipper: sweeper,
  helper,
  "tiles-mistry": tilesMistry,
  tilesmistry: tilesMistry,
  tiler: tilesMistry,
  welder,
  weldor: welder,
  driver,
  painter,
  supervisor,
  cleaner,
  "material-transport": materialTransport,
  "material-transport-labour": materialTransport,
  "material-transport-labor": materialTransport,
  materialtransport: materialTransport,
};

export function getManpowerTradeArt(tradeIdOrName: string): StaticImageData | undefined {
  const raw = String(tradeIdOrName || "").trim();
  if (!raw) return undefined;
  const key = resolveManpowerTradeKey(raw) || raw.toLowerCase();
  if (TRADE_ART[key]) return TRADE_ART[key];
  const slug = raw.toLowerCase().replace(/\s+/g, "-");
  if (TRADE_ART[slug]) return TRADE_ART[slug];
  const compact = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (TRADE_ART[compact]) return TRADE_ART[compact];
  for (const known of Object.keys(TRADE_ART)) {
    if (key.includes(known) || known.includes(key) || slug.includes(known)) {
      return TRADE_ART[known];
    }
  }
  return undefined;
}

/** @deprecated Prefer getManpowerTradeArt for Next Image. */
export function getManpowerTradeArtUrl(tradeIdOrName: string): string | undefined {
  return getManpowerTradeArt(tradeIdOrName)?.src;
}
