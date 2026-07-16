/**
 * Persist the buyer's in-progress Best Quotes request so they can reopen it
 * from a floating shortcut after leaving the page.
 */

const STORAGE_KEY = "imagineering_active_quote_request_v1";

export type ActiveQuoteRequest = {
  id: string;
  expiresAt?: string;
  serviceTitle?: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getActiveQuoteRequest(): ActiveQuoteRequest | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveQuoteRequest | null;
    if (!parsed?.id) return null;
    return {
      id: String(parsed.id),
      expiresAt: parsed.expiresAt ? String(parsed.expiresAt) : undefined,
      serviceTitle: parsed.serviceTitle ? String(parsed.serviceTitle) : undefined,
    };
  } catch {
    return null;
  }
}

export function setActiveQuoteRequest(row: ActiveQuoteRequest): void {
  if (!canUseStorage() || !row?.id) return;
  const payload: ActiveQuoteRequest = {
    id: String(row.id),
    expiresAt: row.expiresAt ? String(row.expiresAt) : undefined,
    serviceTitle: row.serviceTitle ? String(row.serviceTitle) : undefined,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("active-quote-changed", { detail: payload }));
}

export function clearActiveQuoteRequest(id?: string): void {
  if (!canUseStorage()) return;
  if (id) {
    const current = getActiveQuoteRequest();
    if (current && current.id !== id) return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("active-quote-changed", { detail: null }));
}
