/**
 * Buyer saved addresses — persisted locally (same shape as the Imagineering India mobile app).
 * Web uses localStorage; mobile uses AsyncStorage with a parallel key name.
 */

const STORAGE_KEY = "imagineering_saved_addresses_v1";

export type SavedAddress = {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
  /** Required for distance / nearby matching when used in quote requests */
  coordinates?: { lat: number; lng: number };
};

type SavedAddressPayload = {
  addresses: SavedAddress[];
};

function normalizeCoordinates(
  input: SavedAddress["coordinates"] | unknown
): SavedAddress["coordinates"] | undefined {
  if (!input || typeof input !== "object") return undefined;
  const lat = Number((input as { lat?: unknown }).lat);
  const lng = Number((input as { lng?: unknown }).lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return { lat, lng };
}

function normalizeAddress(input: SavedAddress): SavedAddress {
  const coordinates = normalizeCoordinates(input.coordinates);
  return {
    id: String(input.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    label: String(input.label || "Address").trim() || "Address",
    address: String(input.address || "").trim(),
    city: String(input.city || "").trim(),
    state: String(input.state || "").trim(),
    zipCode: String(input.zipCode || "").trim(),
    isDefault: Boolean(input.isDefault),
    ...(coordinates ? { coordinates } : {}),
  };
}

function ensureSingleDefault(addresses: SavedAddress[]): SavedAddress[] {
  let foundDefault = false;
  return addresses.map((entry, index) => {
    if (entry.isDefault && !foundDefault) {
      foundDefault = true;
      return entry;
    }
    if (entry.isDefault && foundDefault) {
      return { ...entry, isDefault: false };
    }
    if (!foundDefault && index === 0) {
      foundDefault = true;
      return { ...entry, isDefault: true };
    }
    return entry;
  });
}

export function loadSavedAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAddressPayload | SavedAddress[] | null;
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.addresses) ? parsed.addresses : [];
    const normalized = rows
      .map((row) => normalizeAddress(row as SavedAddress))
      .filter((row) => row.address.length > 0);
    return ensureSingleDefault(normalized);
  } catch {
    return [];
  }
}

export function saveSavedAddresses(addresses: SavedAddress[]): void {
  if (typeof window === "undefined") return;
  const normalized = ensureSingleDefault(
    addresses.map(normalizeAddress).filter((row) => row.address.length > 0),
  );
  const payload: SavedAddressPayload = { addresses: normalized };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function upsertSavedAddress(address: SavedAddress): SavedAddress[] {
  const existing = loadSavedAddresses();
  const nextAddress = normalizeAddress(address);
  const matchIndex = existing.findIndex((item) => item.id === nextAddress.id);
  const next = [...existing];
  if (matchIndex >= 0) next[matchIndex] = nextAddress;
  else next.unshift(nextAddress);
  const adjusted = nextAddress.isDefault
    ? next.map((item) => ({ ...item, isDefault: item.id === nextAddress.id }))
    : ensureSingleDefault(next);
  saveSavedAddresses(adjusted);
  return adjusted;
}

export function deleteSavedAddress(addressId: string): SavedAddress[] {
  const existing = loadSavedAddresses();
  const next = existing.filter((item) => item.id !== addressId);
  const adjusted = ensureSingleDefault(next);
  saveSavedAddresses(adjusted);
  return adjusted;
}
