import { resolveManpowerTradeKey } from "@/lib/manpower/manpowerHubCatalog";

/** Public URLs under /public/manpower/trades (copied from mobile assets). */
const TRADE_ART: Record<string, string> = {
  electrician: "/manpower/trades/electrician.png",
  plumber: "/manpower/trades/plumber.jpeg",
  mason: "/manpower/trades/masion.jpeg",
  carpenter: "/manpower/trades/carpenter.png",
  cook: "/manpower/trades/cook.jpeg",
  sweeper: "/manpower/trades/swipper.png",
  swipper: "/manpower/trades/swipper.png",
  helper: "/manpower/trades/helper.jpeg",
  "tiles-mistry": "/manpower/trades/tilesMistry.png",
  tilesmistry: "/manpower/trades/tilesMistry.png",
  tiler: "/manpower/trades/tilesMistry.png",
  welder: "/manpower/trades/weldor.jpeg",
  weldor: "/manpower/trades/weldor.jpeg",
  driver: "/manpower/trades/driver.png",
  painter: "/manpower/trades/painter.jpeg",
  supervisor: "/manpower/trades/supervisor.jpeg",
  cleaner: "/manpower/trades/cleaner.jpeg",
  "material-transport": "/manpower/trades/materialTransport.jpeg",
  "material-transport-labour": "/manpower/trades/materialTransport.jpeg",
  "material-transport-labor": "/manpower/trades/materialTransport.jpeg",
  materialtransport: "/manpower/trades/materialTransport.jpeg",
};

export function getManpowerTradeArtUrl(tradeIdOrName: string): string | undefined {
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
