/** Quote / RFQ line quantity — B2B materials may be fractional (e.g. 2.5 tonnes). */

export const QUOTE_QTY_MIN = 0.01;
export const QUOTE_QTY_MAX = 999999;
const QUOTE_QTY_DECIMALS = 3;
/** Per-unit offer rates — up to 3 decimal places (e.g. ₹50.125). */
const QUOTE_UNIT_PRICE_DECIMALS = 3;

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

/** Keep in-progress typing like "2." or "0.5" (max 3 decimal places). */
export function sanitizeQuoteQuantityInput(txt: string): string {
  return sanitizeQuoteDecimalInput(txt, QUOTE_QTY_DECIMALS, 7);
}

/** Keep in-progress unit-price typing like "50." or "12.125" (max 3 decimals). */
export function sanitizeQuoteUnitPriceInput(txt: string): string {
  return sanitizeQuoteDecimalInput(txt, QUOTE_UNIT_PRICE_DECIMALS, 12);
}

export function sanitizeQuoteDecimalInput(
  txt: string,
  maxDecimals: number,
  maxWholeDigits: number
): string {
  const cleaned = String(txt || "").replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot < 0) return cleaned.slice(0, maxWholeDigits);
  const whole = cleaned.slice(0, dot).slice(0, maxWholeDigits);
  const frac = cleaned
    .slice(dot + 1)
    .replace(/\./g, "")
    .slice(0, maxDecimals);
  return `${whole}.${frac}`;
}

export function roundQuoteUnitPrice(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  const factor = 10 ** QUOTE_UNIT_PRICE_DECIMALS;
  return Math.round(n * factor) / factor;
}
