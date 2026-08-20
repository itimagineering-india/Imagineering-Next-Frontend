/**
 * Persist the buyer's in-progress Best Quotes request so they can reopen it
 * from a floating shortcut after leaving the page.
 */

const STORAGE_KEY = "imagineering_active_quote_request_v1";

/** Safe to drop when quota is full — not needed for quote tracking. */
const DISPOSABLE_KEYS = [
  "chatMessages",
  "categories_cache_v2",
  "categories_cache_with_subcategories",
];

export type ActiveQuoteRequest = {
  id: string;
  expiresAt?: string;
  serviceTitle?: string;
  /** When true, FAB shows Open / offer count instead of a 30-minute countdown */
  persistent?: boolean;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function readStoredRaw(): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}

function writeStoredRaw(value: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  } catch {
    /* quota or private mode */
  }

  for (const key of DISPOSABLE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.setItem(STORAGE_KEY, value);
    return;
  } catch {
    /* still full */
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* in-memory event only */
  }
}

export function getActiveQuoteRequest(): ActiveQuoteRequest | null {
  if (!canUseStorage()) return null;
  try {
    const raw = readStoredRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveQuoteRequest | null;
    if (!parsed?.id) return null;
    return {
      id: String(parsed.id),
      expiresAt: parsed.expiresAt ? String(parsed.expiresAt) : undefined,
      serviceTitle: parsed.serviceTitle ? String(parsed.serviceTitle) : undefined,
      persistent: Boolean(parsed.persistent),
    };
  } catch {
    return null;
  }
}

export function setActiveQuoteRequest(row: ActiveQuoteRequest): void {
  if (!canUseStorage() || !row?.id) return;
  const title = row.serviceTitle ? String(row.serviceTitle).slice(0, 160) : undefined;
  const payload: ActiveQuoteRequest = {
    id: String(row.id),
    expiresAt: row.expiresAt ? String(row.expiresAt) : undefined,
    serviceTitle: title,
    persistent: Boolean(row.persistent),
  };
  writeStoredRaw(JSON.stringify(payload));
  try {
    window.dispatchEvent(new CustomEvent("active-quote-changed", { detail: payload }));
  } catch {
    /* ignore */
  }
}

export function clearActiveQuoteRequest(id?: string): void {
  if (!canUseStorage()) return;
  if (id) {
    const current = getActiveQuoteRequest();
    if (current && current.id !== id) return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent("active-quote-changed", { detail: null }));
  } catch {
    /* ignore */
  }
}
