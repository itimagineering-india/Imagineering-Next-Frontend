/** Quote / RFQ line quantity — B2B materials may be fractional (e.g. 2.5 tonnes). */

export const QUOTE_QTY_MIN = 0.01;
export const QUOTE_QTY_MAX = 999999;
const QUOTE_QTY_DECIMALS = 3;

export function parseQuoteQuantity(raw: unknown, fallback = 1): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    const fb = Number(fallback);
    return clampQuoteQuantity(Number.isFinite(fb) && fb > 0 ? fb : 1);
  }
  return clampQuoteQuantity(n);
}

export function clampQuoteQuantity(n: number): number {
  const factor = 10 ** QUOTE_QTY_DECIMALS;
  const rounded = Math.round(n * factor) / factor;
  return Math.min(QUOTE_QTY_MAX, Math.max(QUOTE_QTY_MIN, rounded));
}

/** Keep in-progress typing like "2." or "0.5". */
export function sanitizeQuoteQuantityInput(txt: string): string {
  const cleaned = String(txt || "").replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot < 0) return cleaned.slice(0, 7);
  const whole = cleaned.slice(0, dot).slice(0, 7);
  const frac = cleaned
    .slice(dot + 1)
    .replace(/\./g, "")
    .slice(0, QUOTE_QTY_DECIMALS);
  return `${whole}.${frac}`;
}
