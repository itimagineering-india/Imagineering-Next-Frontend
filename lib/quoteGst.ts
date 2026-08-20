export const QUOTE_GST_SLABS = [0, 5, 12, 18, 28] as const;
export type QuoteGstPercent = (typeof QUOTE_GST_SLABS)[number];

export function isQuoteGstSlab(n: number): n is QuoteGstPercent {
  return (QUOTE_GST_SLABS as readonly number[]).includes(n);
}

export function parseQuoteGstPercent(raw: unknown): QuoteGstPercent | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || !isQuoteGstSlab(n)) return undefined;
  return n;
}

export function parseQuoteGstAmount(raw: unknown): number | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100) / 100;
}

export function suggestedQuoteGstAmount(taxableAmount: number, gstPercent: number): number {
  const base = Number(taxableAmount);
  const pct = Number(gstPercent);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(pct) || pct <= 0) return 0;
  return Math.round(((base * pct) / 100) * 100) / 100;
}

export function quoteOfferGstAmount(offer: { gstAmount?: unknown } | null | undefined): number {
  return parseQuoteGstAmount(offer?.gstAmount) ?? 0;
}
