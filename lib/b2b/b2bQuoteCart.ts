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
};

function safeParse(raw: string | null): B2bQuoteCartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => {
        const key = String(row?.key || "").trim();
        const title = String(row?.title || "").trim();
        if (!key || !title) return null;
        return {
          key,
          serviceId: String(row?.serviceId || "").trim() || undefined,
          catalogProductId: String(row?.catalogProductId || "").trim() || undefined,
          title,
          quantity: parseQuoteQuantity(row?.quantity),
          priceType: String(row?.priceType || "").trim() || undefined,
        } satisfies B2bQuoteCartLine;
      })
      .filter((x): x is B2bQuoteCartLine => Boolean(x))
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
): { lines: B2bQuoteCartLine[]; added: boolean; error?: "full" } {
  const existing = lines.find((l) => l.key === incoming.key);
  if (existing) {
    existing.quantity = parseQuoteQuantity(existing.quantity + parseQuoteQuantity(incoming.quantity));
    if (incoming.serviceId) existing.serviceId = incoming.serviceId;
    if (incoming.catalogProductId) existing.catalogProductId = incoming.catalogProductId;
    if (incoming.priceType) existing.priceType = incoming.priceType;
    existing.title = incoming.title || existing.title;
    return { lines: saveB2bQuoteCart([...lines]), added: false };
  }
  if (lines.length >= B2B_QUOTE_CART_MAX) {
    return { lines, added: false, error: "full" };
  }
  return {
    lines: saveB2bQuoteCart([
      ...lines,
      {
        key: incoming.key,
        serviceId: incoming.serviceId,
        catalogProductId: incoming.catalogProductId,
        title: incoming.title,
        quantity: parseQuoteQuantity(incoming.quantity),
        priceType: incoming.priceType,
      },
    ]),
    added: true,
  };
}
