export type QuoteRequestItemLike = {
  serviceId?: string;
  title?: string;
  quantity?: number;
  /** Product listing unit (Service.priceType). */
  priceType?: string;
};

export type QuoteOfferItemLike = {
  serviceId?: string;
  title?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

export function quoteRequestItems(data: { items?: QuoteRequestItemLike[] | null } | null | undefined) {
  if (!Array.isArray(data?.items)) return [];
  return data.items.filter((row) => row && String(row.title || "").trim());
}

export function quoteOfferItems(offer: { items?: QuoteOfferItemLike[] | null } | null | undefined) {
  if (!Array.isArray(offer?.items)) return [];
  return offer.items.filter((row) => row && String(row.title || "").trim());
}

/** Sum of line quantities on an offer (falls back to single `quantity` when no lines). */
export function quoteOfferTotalQuantity(
  offer: { items?: QuoteOfferItemLike[] | null; quantity?: number } | null | undefined,
): number {
  const items = quoteOfferItems(offer);
  if (items.length > 0) {
    return items.reduce((sum, row) => {
      const q = Number(row.quantity);
      return sum + (Number.isFinite(q) && q > 0 ? q : 0);
    }, 0);
  }
  const fallback = Number(offer?.quantity);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
}

export function formatOfferTotalQtyLabel(totalQty: number): string {
  if (!(totalQty > 0)) return "";
  const rounded =
    Math.abs(totalQty - Math.round(totalQty)) < 1e-9
      ? String(Math.round(totalQty))
      : String(Math.round(totalQty * 100) / 100);
  return `Total qty ${rounded}`;
}

export function quoteLineKey(row: { serviceId?: string; title?: string }, index = 0) {
  return String(row.serviceId || row.title || index);
}

export function quoteRequestHeadline(data: {
  items?: QuoteRequestItemLike[] | null;
  service?: { title?: string } | string | null;
  projectDetails?: { projectType?: string } | null;
} | null | undefined): string {
  if (data?.projectDetails?.projectType) return String(data.projectDetails.projectType);
  const items = quoteRequestItems(data);
  if (items.length > 1) return `${items.length} products`;
  if (items.length === 1 && items[0].title) return String(items[0].title);
  const s = data?.service;
  if (s && typeof s === "object") return s.title || "Quote request";
  return "Quote request";
}

/** If create timed out after the RFQ was saved, recover the newest open request. */
export function pickRecoveredQuoteRequestId(
  rows: unknown,
  maxAgeMs = 3 * 60 * 1000
): string | null {
  const list = Array.isArray(rows) ? rows : [];
  const newest = list
    .map((row) => {
      const r = row as { id?: string; status?: string; createdAt?: string };
      return {
        id: String(r?.id || "").trim(),
        status: String(r?.status || ""),
        t: r?.createdAt ? new Date(r.createdAt).getTime() : 0,
      };
    })
    .filter((row) => row.id && row.status === "open" && Number.isFinite(row.t) && row.t > 0)
    .sort((a, b) => b.t - a.t)[0];
  if (!newest || Date.now() - newest.t > maxAgeMs) return null;
  return newest.id;
}

/** False when B2B / contractor RFQs have no 30-minute countdown. */
export function isTimedQuoteWindow(data: {
  timedWindow?: boolean;
  persistentQuote?: boolean;
  source?: string;
  matchMode?: string;
} | null | undefined): boolean {
  if (!data) return true;
  if (data.timedWindow === false) return false;
  if (data.persistentQuote || data.source === "contractor_hub" || data.matchMode === "category") {
    return false;
  }
  return true;
}
