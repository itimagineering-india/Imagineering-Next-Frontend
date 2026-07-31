/**
 * Manpower hub — shared types + pure helpers.
 * Live data is loaded via `manpowerHubApi.ts`.
 */

export const MANPOWER_CATEGORY_SLUG = 'manpower';

export type ManpowerTradeId = string;

/** How the buyer wants to hire on the Manpower hub */
export type ManpowerHireMode = 'one_day' | 'custom_duration' | 'specific_work';

export type ManpowerTrade = {
  id: ManpowerTradeId;
  name: string;
  subtitle?: string;
  mark: string;
  tint: string;
  /** Indicative daily rate label, e.g. "From ₹800 / day" */
  priceDailyLabel?: string;
  /** Indicative hourly rate label, e.g. "From ₹150 / hr" */
  priceHourlyLabel?: string;
  /** Product catalog rate-card id when available */
  catalogProductId?: string;
  priceHourly?: number;
  priceHourlyExtra?: number;
  priceDaily?: number;
};

export type ManpowerServiceItem = {
  id: string;
  title: string;
  providerName: string;
  /** Provider profile id when available */
  providerId?: string;
  tradeId: ManpowerTradeId;
  tradeLabel: string;
  priceLabel: string;
  rating?: number;
  reviewCount?: number;
  imageUri?: string;
  city?: string;
};

export type ManpowerTopProvider = {
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

export const MANPOWER_CATEGORY_TINTS = [
  '#DBEAFE',
  '#FEF3C7',
  '#D1FAE5',
  '#FCE7F3',
  '#E0E7FF',
  '#FFEDD5',
  '#F3E8FF',
  '#CFFAFE',
] as const;

export const MANPOWER_SEARCH_PLACEHOLDERS = [
  'Search electrician…',
  'Search plumber…',
  'Search mason…',
  'Search carpenter…',
  'Search painter…',
] as const;

/** Curated Popular services on Manpower hub */
export const MANPOWER_POPULAR_SERVICES: readonly {
  id: string;
  name: string;
}[] = [
  { id: 'bathroom-plumbing', name: 'Bathroom Plumbing' },
  { id: 'house-wiring', name: 'House Wiring' },
  { id: 'tile-installation', name: 'Tile Installation' },
  { id: 'brick-masonry', name: 'Brick Masonry' },
  { id: 'pop-work', name: 'POP Work' },
  { id: 'painting', name: 'Painting' },
  { id: 'false-ceiling', name: 'False Ceiling' },
  { id: 'waterproofing', name: 'Waterproofing' },
] as const;

/**
 * Task-style works for "Specific work" hire mode
 * (fan installation, AC repairing, etc.) — fallback when catalog empty
 */
export const MANPOWER_SPECIFIC_WORKS: readonly {
  id: string;
  name: string;
  tradeId: string;
  tradeLabel: string;
}[] = [
  { id: 'fan-installation', name: 'Fan Installation', tradeId: 'electrician', tradeLabel: 'Electrician' },
  { id: 'ac-repairing', name: 'AC Repairing', tradeId: 'electrician', tradeLabel: 'Electrician' },
  { id: 'switchboard-repair', name: 'Switchboard Repair', tradeId: 'electrician', tradeLabel: 'Electrician' },
  { id: 'mcb-change', name: 'MCB Change', tradeId: 'electrician', tradeLabel: 'Electrician' },
  { id: 'house-wiring', name: 'House Wiring', tradeId: 'electrician', tradeLabel: 'Electrician' },
  { id: 'pipe-leak-fix', name: 'Pipe Leak Fix', tradeId: 'plumber', tradeLabel: 'Plumber' },
  { id: 'tap-installation', name: 'Tap Installation', tradeId: 'plumber', tradeLabel: 'Plumber' },
  { id: 'toilet-flush-repair', name: 'Toilet Flush Repair', tradeId: 'plumber', tradeLabel: 'Plumber' },
  { id: 'bathroom-plumbing', name: 'Bathroom Plumbing', tradeId: 'plumber', tradeLabel: 'Plumber' },
  { id: 'door-fitting', name: 'Door Fitting', tradeId: 'carpenter', tradeLabel: 'Carpenter' },
  { id: 'tile-installation', name: 'Tile Installation', tradeId: 'tiles-mistry', tradeLabel: 'Tiles Mistry' },
  { id: 'painting', name: 'Painting', tradeId: 'painter', tradeLabel: 'Painter' },
] as const;

/** Catalog hire lanes (ProductCatalog metadata.hireMode) */
export type ManpowerCatalogHireMode = 'rate_card' | 'hourly' | 'daily' | 'specific_work';

/** Specific-work tile from Product Catalog (or curated fallback) */
export type ManpowerSpecificWorkItem = {
  id: string;
  name: string;
  priceLabel?: string;
  /** True when buyer pays a visit fee; final work price after inspection */
  isVisitingCharge?: boolean;
  imageUri?: string;
  tradeId?: string;
  tradeLabel?: string;
  catalogProductId?: string;
  price?: number;
};

/** Hour options shown after picking a trade in custom-duration mode */
export const MANPOWER_HOUR_OPTIONS = [1, 2, 3, 4, 6, 8] as const;

/** Fallback indicative rates (INR) when live service prices are missing */
export const MANPOWER_INDICATIVE_RATES: Record<string, { daily: number; hourly: number }> = {
  electrician: { daily: 900, hourly: 180 },
  plumber: { daily: 850, hourly: 170 },
  mason: { daily: 950, hourly: 190 },
  carpenter: { daily: 900, hourly: 180 },
  painter: { daily: 800, hourly: 160 },
  helper: { daily: 650, hourly: 120 },
  welder: { daily: 1000, hourly: 200 },
  supervisor: { daily: 1200, hourly: 250 },
  cook: { daily: 750, hourly: 140 },
  sweeper: { daily: 600, hourly: 110 },
  cleaner: { daily: 600, hourly: 110 },
  'material-transport': { daily: 700, hourly: 150 },
  'tiles-mistry': { daily: 950, hourly: 190 },
};

export const MANPOWER_DEFAULT_RATES = { daily: 800, hourly: 150 } as const;

/** Fallback trades when subcategory API is empty */
export const MANPOWER_FALLBACK_TRADES: readonly string[] = [
  'Electrician',
  'Plumber',
  'Mason',
  'Carpenter',
  'Welder',
  'Tiles Mistry',
  'Cook',
  'Sweeper',
  'Painter',
  'Helper',
];

/**
 * True when a subcategory name looks like construction materials
 * (Bricks, Tiles, Aggregates…) — used to reject poisoned/cached API payloads.
 */
export function looksLikeConstructionMaterialSubcategory(name: string): boolean {
  const s = String(name || '')
    .trim()
    .toLowerCase();
  if (!s) return false;
  // Worker / labour roles — keep these even if a material keyword also appears
  if (
    /electrician|plumber|mason|carpenter|painter|helper|welder|weldor|supervisor|foreman|mazdoor|labour|labor|cook|chef|sweeper|swipper|cleaner|driver|fabricat|shuttering|reinforcement|concreting|tiles?\s*mist|tiler|technician|engineer|architect|surveyor/.test(
      s
    )
  ) {
    return false;
  }
  // Material-only category labels
  return (
    /\b(bricks?|blocks?|aggregates?|admixture|primer|diesel|cement|sand|gravel|marble|granite|plywood|hardware|bitumen|asphalt|rubble|chemicals?|adhesives?|sealants?)\b/.test(
      s
    ) ||
    /\b(tiles?|flooring|paints?|steel|concrete)\b/.test(s) ||
    /\b(bricks?|tiles?|primer)\s*&\s*/.test(s)
  );
}

export function formatManpowerIndicativePrice(
  amount: number,
  unit: 'day' | 'hour'
): string {
  const formatted = `₹${amount.toLocaleString('en-IN')}`;
  return unit === 'day' ? `From ${formatted} / day` : `From ${formatted} / hr`;
}

/**
 * Hourly booking total: first hour at `firstHourPrice`, each extra hour at `extraHourPrice`.
 * Example: first=200, extra=50, hours=3 → 200+50+50=300
 */
export function calculateManpowerHourlyTotal(
  firstHourPrice: number,
  hours: number,
  extraHourPrice?: number | null
): number {
  const h = Math.max(1, Math.floor(Number(hours) || 1));
  const first = Math.max(0, Number(firstHourPrice) || 0);
  if (h <= 1) return first;
  const extra =
    extraHourPrice != null && Number.isFinite(Number(extraHourPrice))
      ? Math.max(0, Number(extraHourPrice))
      : first;
  return first + (h - 1) * extra;
}

/** Format catalog suggested price for hub chips (single price — no ranges) */
export function formatManpowerCatalogPriceLabel(
  min?: number | null,
  max?: number | null,
  unit: 'day' | 'hour' | 'fixed' | 'visiting' = 'fixed',
  extraHour?: number | null
): string | undefined {
  const amount =
    min != null && Number.isFinite(min) && min > 0
      ? Number(min)
      : max != null && Number.isFinite(max) && max > 0
        ? Number(max)
        : null;
  if (amount == null) return undefined;
  const formatted = `₹${amount.toLocaleString('en-IN')}`;
  if (unit === 'visiting') return `Visit ${formatted}`;
  if (unit === 'day') return `${formatted} / day`;
  if (unit === 'hour') {
    if (extraHour != null && Number.isFinite(extraHour) && extraHour > 0 && extraHour !== amount) {
      return `${formatted} 1st hr · +₹${Number(extraHour).toLocaleString('en-IN')} extra`;
    }
    return `${formatted} / hr`;
  }
  return formatted;
}

export function isManpowerVisitingCharge(product: {
  suggestedPriceType?: string;
  metadata?: Record<string, string | undefined> | null;
}): boolean {
  const mode = String(product.metadata?.pricingMode || '')
    .trim()
    .toLowerCase();
  if (mode === 'visiting_charge' || mode === 'visiting') return true;
  const pt = String(product.suggestedPriceType || '')
    .trim()
    .toLowerCase();
  return pt === 'visiting_charge' || pt === 'visiting' || pt === 'visit';
}

export function inferManpowerCatalogHireMode(product: {
  suggestedPriceType?: string;
  suggestedPriceHourly?: number;
  suggestedPriceDaily?: number;
  metadata?: Record<string, string | undefined> | null;
}): ManpowerCatalogHireMode {
  const fromMeta = String(product.metadata?.hireMode || '')
    .trim()
    .toLowerCase();
  if (fromMeta === 'rate_card' || fromMeta === 'specific_work') return fromMeta;
  if (fromMeta === 'hourly' || fromMeta === 'daily') return fromMeta;
  const pt = String(product.suggestedPriceType || '')
    .trim()
    .toLowerCase();
  if (pt === 'rate_card') return 'rate_card';
  if (pt === 'hourly' || pt === 'per_hour' || pt === 'hour') return 'hourly';
  if (pt === 'daily' || pt === 'per_day' || pt === 'day') return 'daily';
  if (
    (product.suggestedPriceHourly != null && product.suggestedPriceHourly > 0) ||
    (product.suggestedPriceDaily != null && product.suggestedPriceDaily > 0)
  ) {
    return 'rate_card';
  }
  return 'specific_work';
}

export function indicativeRatesForTrade(tradeId: string): { daily: number; hourly: number } {
  const key = resolveManpowerTradeKey(tradeId) || String(tradeId || '').trim().toLowerCase();
  return MANPOWER_INDICATIVE_RATES[key] || MANPOWER_DEFAULT_RATES;
}

export function slugifyManpowerId(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function manpowerMarkFromName(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'MP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Map common trade labels to stable keys (catalog / filter / art alignment). */
export function resolveManpowerTradeKey(raw: string): string {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
  if (!s) return '';
  if (/electric/.test(s)) return 'electrician';
  if (/plumb/.test(s)) return 'plumber';
  if (/\b(mason)\b/.test(s) || (/brick/.test(s) && !/tile/.test(s))) return 'mason';
  if (/carpent/.test(s)) return 'carpenter';
  if (/tile|tiler|tiles?\s*mist/.test(s)) return 'tiles-mistry';
  if (/cook|chef/.test(s)) return 'cook';
  // Cleaner before sweeper — "clean" must not steal cleaner → sweeper art
  if (/\bcleaner\b|housekeep|cleaning/.test(s)) return 'cleaner';
  if (/sweep|swipp/.test(s)) return 'sweeper';
  if (/paint/.test(s)) return 'painter';
  if (/\bhelper\b|mazdoor/.test(s)) return 'helper';
  if (/weld|fabricat/.test(s)) return 'welder';
  if (/supervis|foreman/.test(s)) return 'supervisor';
  if (/\bdriver\b/.test(s)) return 'driver';
  if (/material\s*transport|transport\s*labou?r|materal\s*transport/.test(s)) {
    return 'material-transport';
  }
  // Keep labour variants distinct (Skilled Labor ≠ Helper ≠ Concreting Labour)
  return slugifyManpowerId(s);
}

export function filterManpowerServices(
  services: readonly ManpowerServiceItem[],
  opts: { query?: string; tradeId?: ManpowerTradeId | null }
): ManpowerServiceItem[] {
  const q = (opts.query || '').trim().toLowerCase();
  return services.filter((s) => {
    if (opts.tradeId && s.tradeId !== opts.tradeId) return false;
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.providerName.toLowerCase().includes(q) ||
      s.tradeLabel.toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  });
}

/** Fallback specific-work items with trade grouping */
export function getFallbackSpecificWorks(): ManpowerSpecificWorkItem[] {
  return MANPOWER_SPECIFIC_WORKS.map((w) => ({
    id: w.id,
    name: w.name,
    tradeId: w.tradeId,
    tradeLabel: w.tradeLabel,
  }));
}

/** Filter specific works for one subcategory / trade */
export function filterManpowerSpecificWorks(
  works: readonly ManpowerSpecificWorkItem[],
  opts: { tradeId?: string | null; tradeName?: string | null; query?: string }
): ManpowerSpecificWorkItem[] {
  const tradeKey =
    resolveManpowerTradeKey(opts.tradeId || '') ||
    resolveManpowerTradeKey(opts.tradeName || '') ||
    slugifyManpowerId(opts.tradeId || opts.tradeName || '');
  const q = (opts.query || '').trim().toLowerCase();

  return works.filter((w) => {
    const workKey =
      resolveManpowerTradeKey(w.tradeId || '') ||
      resolveManpowerTradeKey(w.tradeLabel || '') ||
      slugifyManpowerId(w.tradeId || w.tradeLabel || '');
    if (tradeKey && workKey && workKey !== tradeKey) return false;
    if (tradeKey && !workKey) return false;
    if (!q) return true;
    return (
      w.name.toLowerCase().includes(q) ||
      (w.tradeLabel || '').toLowerCase().includes(q)
    );
  });
}

/**
 * Build subcategory tiles for Specific work mode from catalog tasks.
 * Prefers hub rate-card trade styling when the trade id matches.
 */
export function buildSpecificWorkTrades(
  works: readonly ManpowerSpecificWorkItem[],
  hubTrades: readonly ManpowerTrade[] = []
): ManpowerTrade[] {
  // Backend catalog tasks only — empty hub means empty subcategory list
  const source = works;
  const byKey = new Map<string, { name: string; count: number }>();

  for (const w of source) {
    const key =
      resolveManpowerTradeKey(w.tradeId || '') ||
      resolveManpowerTradeKey(w.tradeLabel || '') ||
      slugifyManpowerId(w.tradeId || w.tradeLabel || '') ||
      'general';
    const name = String(w.tradeLabel || w.tradeId || 'General').trim() || 'General';
    const prev = byKey.get(key);
    if (prev) {
      prev.count += 1;
      if (name.length > prev.name.length) prev.name = name;
    } else {
      byKey.set(key, { name, count: 1 });
    }
  }

  const hubById = new Map(hubTrades.map((t) => [t.id, t]));

  return Array.from(byKey.entries()).map(([id, row], index) => {
    const hub = hubById.get(id);
    if (hub) {
      return {
        ...hub,
        subtitle: `${row.count} ${row.count === 1 ? 'task' : 'tasks'}`,
      };
    }
    return {
      id,
      name: row.name,
      subtitle: `${row.count} ${row.count === 1 ? 'task' : 'tasks'}`,
      mark: manpowerMarkFromName(row.name),
      tint: MANPOWER_CATEGORY_TINTS[index % MANPOWER_CATEGORY_TINTS.length],
    };
  });
}
