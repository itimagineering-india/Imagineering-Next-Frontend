export type QuoteRequestItemLike = {
  serviceId?: string;
  catalogVariantId?: string;
  variantLabel?: string;
  title?: string;
  quantity?: number;
  /** Product listing unit (Service.priceType). */
  priceType?: string;
};

export type QuoteOfferItemLike = {
  serviceId?: string;
  catalogVariantId?: string;
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
  offer: { items?: QuoteOfferItemLike[] | null; quantity?: number } | null | undefined
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

/**
 * Stable unique key per RFQ line for rate state.
 * Always includes index so sibling lines never share an input key.
 */
export function quoteLineKey(
  row: { serviceId?: string; catalogVariantId?: string; title?: string },
  index = 0
) {
  const sid = String(row.serviceId || "").trim();
  const vid = String(row.catalogVariantId || "").trim();
  const title = String(row.title || "").trim().toLowerCase();
  if (sid && vid) return `${sid}:${vid}#${index}`;
  if (sid && title) return `${sid}::${title}#${index}`;
  if (sid) return `${sid}#${index}`;
  if (title) return `t:${title}#${index}`;
  return `idx:${index}`;
}

/** Match a saved offer line to a request line — never fall back by array index alone. */
export function matchOfferUnitPrice(
  line: QuoteRequestItemLike,
  offered: QuoteOfferItemLike[]
): number | null {
  const lineVid = String(line.catalogVariantId || "").trim();
  const lineTitle = String(line.title || "").trim();
  const match =
    (lineVid
      ? offered.find(
          (o) =>
            o.serviceId &&
            o.serviceId === line.serviceId &&
            String(o.catalogVariantId || "").trim() === lineVid
        )
      : undefined) ||
    offered.find(
      (o) =>
        o.serviceId &&
        o.serviceId === line.serviceId &&
        String(o.title || "").trim() === lineTitle
    );
  if (match?.unitPrice == null) return null;
  const n = Number(match.unitPrice);
  return Number.isFinite(n) ? n : null;
}

export function getQuantityUnitNoun(priceType: string | null | undefined): string {
  const key = String(priceType || "")
    .trim()
    .toLowerCase();
  if (!key || ["negotiable", "fixed", "lumpsum", "per_project"].includes(key)) return "";
  if (key === "metric_ton") return "MT";
  return key.replace(/_/g, " ").replace(/^per\s+/i, "").trim();
}

export function isRentalLikePriceType(priceType: string | null | undefined): boolean {
  const key = String(priceType || "")
    .trim()
    .toLowerCase();
  return ["hourly", "daily", "monthly", "per_km", "per_trip"].includes(key);
}

export function quoteLineDisplayParts(line: QuoteRequestItemLike) {
  const variantFromField = String(line.variantLabel || "").trim();
  const rawTitle = String(line.title || "").trim();
  let productName = rawTitle;
  let variantLabel = variantFromField;

  if (!variantLabel && rawTitle.includes(" · ")) {
    const [head, ...rest] = rawTitle.split(" · ");
    productName = head.trim() || rawTitle;
    variantLabel = rest.join(" · ").trim();
  } else if (variantLabel && rawTitle.toLowerCase().endsWith(` · ${variantLabel}`.toLowerCase())) {
    productName = rawTitle.slice(0, rawTitle.length - ` · ${variantLabel}`.length).trim() || rawTitle;
  }

  return {
    productName: productName || "Product",
    variantLabel: variantLabel || null,
  };
}

export function formatQuoteLineDetailRows(
  line: QuoteRequestItemLike,
  quantity: number
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const { variantLabel } = quoteLineDisplayParts(line);
  if (variantLabel) {
    rows.push({ label: "Variant", value: variantLabel });
  }
  if (isRentalLikePriceType(line.priceType)) {
    const unit = getQuantityUnitNoun(line.priceType) || String(line.priceType || "");
    rows.push({ label: "Billing unit", value: unit });
    rows.push({
      label: "Requested",
      value: unit ? `${quantity} × ${unit}` : String(quantity),
    });
  } else {
    rows.push({
      label: "Qty",
      value: formatQuoteQtyLabel(quantity, line.priceType).replace(/^Qty\s+/i, ""),
    });
  }
  return rows;
}

export function formatQuoteQtyLabel(quantity: number, priceType?: string | null): string {
  const unit = getQuantityUnitNoun(priceType);
  if (isRentalLikePriceType(priceType)) {
    return unit ? `Requested ${quantity} ${unit}` : `Requested ${quantity}`;
  }
  return unit ? `Qty ${quantity} ${unit}` : `Qty ${quantity}`;
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
