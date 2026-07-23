/**
 * Buyer saved addresses — local cache + account sync (web ↔ mobile via /api/auth/saved-addresses).
 */

import { api } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth-token";

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
  if (addresses.length === 0) return [];
  const preferred = addresses.findIndex((entry) => entry.isDefault);
  const keepIndex = preferred >= 0 ? preferred : 0;
  return addresses.map((entry, index) => ({
    ...entry,
    isDefault: index === keepIndex,
  }));
}

function isLoggedIn(): boolean {
  return Boolean(getAuthToken());
}

function loadLocal(): SavedAddress[] {
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

function saveLocal(addresses: SavedAddress[]): void {
  if (typeof window === "undefined") return;
  const normalized = ensureSingleDefault(
    addresses.map(normalizeAddress).filter((row) => row.address.length > 0),
  );
  const payload: SavedAddressPayload = { addresses: normalized };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function mergeAddresses(local: SavedAddress[], remote: SavedAddress[]): SavedAddress[] {
  const byId = new Map<string, SavedAddress>();
  for (const row of local) byId.set(row.id, row);
  for (const row of remote) byId.set(row.id, row); // remote wins on conflict
  return ensureSingleDefault([...byId.values()]);
}

async function pushRemote(addresses: SavedAddress[]): Promise<SavedAddress[]> {
  const res = await api.auth.updateSavedAddresses({ addresses });
  const rows = (res as any)?.data?.addresses;
  if (Array.isArray(rows)) {
    const normalized = ensureSingleDefault(
      rows.map((row: SavedAddress) => normalizeAddress(row)).filter((row: SavedAddress) => row.address.length > 0),
    );
    saveLocal(normalized);
    return normalized;
  }
  saveLocal(addresses);
  return addresses;
}

/**
 * Load addresses: local cache first; when logged in, sync with account
 * (merge local-only rows, then prefer account as source of truth).
 */
export async function loadSavedAddresses(): Promise<SavedAddress[]> {
  const local = loadLocal();
  if (!isLoggedIn()) return local;

  try {
    const res = await api.auth.getSavedAddresses();
    const remoteRaw = (res as any)?.data?.addresses;
    const remote = Array.isArray(remoteRaw)
      ? ensureSingleDefault(
          remoteRaw.map((row: SavedAddress) => normalizeAddress(row)).filter((r: SavedAddress) => r.address.length > 0),
        )
      : [];

    if (remote.length === 0 && local.length > 0) {
      return await pushRemote(local);
    }

    const merged = mergeAddresses(local, remote);
    const remoteIds = new Set(remote.map((r) => r.id));
    const hasLocalOnly = local.some((l) => !remoteIds.has(l.id));
    if (hasLocalOnly) {
      return await pushRemote(merged);
    }

    saveLocal(merged);
    return merged;
  } catch {
    return local;
  }
}

export async function saveSavedAddresses(addresses: SavedAddress[]): Promise<SavedAddress[]> {
  const normalized = ensureSingleDefault(
    addresses.map(normalizeAddress).filter((row) => row.address.length > 0),
  );
  saveLocal(normalized);
  if (!isLoggedIn()) return normalized;
  try {
    return await pushRemote(normalized);
  } catch {
    return normalized;
  }
}

export async function upsertSavedAddress(address: SavedAddress): Promise<SavedAddress[]> {
  const existing = loadLocal();
  const nextAddress = normalizeAddress(address);
  const matchIndex = existing.findIndex((item) => item.id === nextAddress.id);
  const next = [...existing];
  if (matchIndex >= 0) next[matchIndex] = nextAddress;
  else next.unshift(nextAddress);
  const adjusted = nextAddress.isDefault
    ? next.map((item) => ({ ...item, isDefault: item.id === nextAddress.id }))
    : ensureSingleDefault(next);
  return saveSavedAddresses(adjusted);
}

export async function deleteSavedAddress(addressId: string): Promise<SavedAddress[]> {
  const existing = loadLocal();
  const next = existing.filter((item) => item.id !== addressId);
  return saveSavedAddresses(ensureSingleDefault(next));
}
