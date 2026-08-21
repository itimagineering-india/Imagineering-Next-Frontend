import { parseQuoteQuantity } from "@/lib/quoteQuantity";

export const B2B_QUOTE_CART_MAX = 30;
const STORAGE_KEY = "ii-b2b-quote-cart";

export type B2bQuoteCartLine = {
  key: string;
  serviceId?: string;
  catalogProductId?: string;
  title: string;
  quantity: number;
  priceType?: string;
  /** Canonical item/material type — e.g. sand, steel, aggregate (one type per cart). */
  itemType?: string;
};

export type B2bQuoteCartUpsertError = "full" | "mixed_item_type";

/** Normalize material/item type for same-cart comparison. */
export function normalizeB2bQuoteItemType(value?: string | null): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[_/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** First typed line in cart, if any. */
export function getB2bQuoteCartItemType(lines: B2bQuoteCartLine[]): string | null {
  for (const line of lines) {
    const t = normalizeB2bQuoteItemType(line.itemType);
    if (t) return t;
  }
  return null;
}

function safeParse(raw: string | null): B2bQuoteCartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row): B2bQuoteCartLine | null => {
        const key = String(row?.key || "").trim();
        const title = String(row?.title || "").trim();
        if (!key || !title) return null;
        const line: B2bQuoteCartLine = {
          key,
          title,
          quantity: parseQuoteQuantity(row?.quantity),
        };
        const serviceId = String(row?.serviceId || "").trim();
        if (serviceId) line.serviceId = serviceId;
        const catalogProductId = String(row?.catalogProductId || "").trim();
        if (catalogProductId) line.catalogProductId = catalogProductId;
        const priceType = String(row?.priceType || "").trim();
        if (priceType) line.priceType = priceType;
        const itemType = normalizeB2bQuoteItemType(row?.itemType);
        if (itemType) line.itemType = itemType;
        return line;
      })
      .filter((x): x is B2bQuoteCartLine => x !== null)
      .slice(0, B2B_QUOTE_CART_MAX);
  } catch {
    return [];
  }
}

export function loadB2bQuoteCart(): B2bQuoteCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

export function saveB2bQuoteCart(lines: B2bQuoteCartLine[]): B2bQuoteCartLine[] {
  const next = lines.slice(0, B2B_QUOTE_CART_MAX);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  }
  return next;
}

export function clearB2bQuoteCart(): B2bQuoteCartLine[] {
  return saveB2bQuoteCart([]);
}

export function upsertB2bQuoteCartLine(
  lines: B2bQuoteCartLine[],
  incoming: Omit<B2bQuoteCartLine, "quantity"> & { quantity?: number }
): { lines: B2bQuoteCartLine[]; added: boolean; error?: B2bQuoteCartUpsertError } {
  const incomingType = normalizeB2bQuoteItemType(incoming.itemType);
  const existing = lines.find((l) => l.key === incoming.key);
  if (existing) {
    existing.quantity = parseQuoteQuantity(existing.quantity + parseQuoteQuantity(incoming.quantity));
    if (incoming.serviceId) existing.serviceId = incoming.serviceId;
    if (incoming.catalogProductId) existing.catalogProductId = incoming.catalogProductId;
    if (incoming.priceType) existing.priceType = incoming.priceType;
    if (incomingType) existing.itemType = incomingType;
    existing.title = incoming.title || existing.title;
    return { lines: saveB2bQuoteCart([...lines]), added: false };
  }

  const cartType = getB2bQuoteCartItemType(lines);
  if (cartType && incomingType && cartType !== incomingType) {
    return { lines, added: false, error: "mixed_item_type" };
  }
  if (cartType && !incomingType) {
    return { lines, added: false, error: "mixed_item_type" };
  }

  if (lines.length >= B2B_QUOTE_CART_MAX) {
    return { lines, added: false, error: "full" };
  }
  const next: B2bQuoteCartLine = {
    key: incoming.key,
    title: incoming.title,
    quantity: parseQuoteQuantity(incoming.quantity),
  };
  if (incoming.serviceId) next.serviceId = incoming.serviceId;
  if (incoming.catalogProductId) next.catalogProductId = incoming.catalogProductId;
  if (incoming.priceType) next.priceType = incoming.priceType;
  if (incomingType) next.itemType = incomingType;
  return {
    lines: saveB2bQuoteCart([...lines, next]),
    added: true,
  };
}
