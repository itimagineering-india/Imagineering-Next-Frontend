"use client";

import { getAuthToken } from "@/lib/auth-token";

const SESSION_KEY = "imagineering_search_sid";
const VISIBLE_MIN_MS = 720;
const FLUSH_DEBOUNCE_MS = 2200;
const IO_THRESHOLD = 0.28;

function apiBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:5000";
  return String(raw).replace(/\/$/, "");
}

function jsonHeaders(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token && token !== "cookie") {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

/** Privacy-light session id (no PII); used for pogo / duplicate click detection. */
export function getSearchSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id || id.length < 8) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id.slice(0, 64);
  } catch {
    return "";
  }
}

let lastSerpPaintAt = 0;

/** Call when SERP list has rendered (after loading) for time-to-click. */
export function markSerpResultsPainted(): void {
  if (typeof window === "undefined") return;
  lastSerpPaintAt = Date.now();
}

export function getSerpPaintAgeMs(): number | undefined {
  if (!lastSerpPaintAt) return undefined;
  return Math.max(0, Date.now() - lastSerpPaintAt);
}

export type SerpVisibleItem = { serviceId: string; position: number; visibleMs: number };

export function postSerpVisibleBatch(rows: SerpVisibleItem[], sessionId: string): void {
  if (!rows.length) return;
  const url = `${apiBase()}/api/search/analytics/visible`;
  const body = JSON.stringify({ sessionId: sessionId || undefined, items: rows });
  void fetch(url, {
    method: "POST",
    headers: jsonHeaders(),
    credentials: "include",
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Intersection-Observer helper: one visible counter per listing per SERP filter key,
 * after ~{@link VISIBLE_MIN_MS}ms cumulative visibility. Batches posts.
 */
export function createSerpVisibleTracker(flushRows: (rows: SerpVisibleItem[]) => void) {
  const sent = new Set<string>();
  const visibleSince = new Map<string, number>();
  const pending = new Map<string, { position: number; maxMs: number }>();
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let lastKey = "";

  function runFlush() {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (!pending.size) return;
    const rows: SerpVisibleItem[] = [];
    pending.forEach((v, id) => {
      rows.push({ serviceId: id, position: v.position, visibleMs: Math.round(v.maxMs) });
    });
    pending.clear();
    flushRows(rows);
  }

  function scheduleFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      flushTimer = null;
      runFlush();
    }, FLUSH_DEBOUNCE_MS);
  }

  return {
    reset(serpKey: string) {
      if (serpKey === lastKey) return;
      lastKey = serpKey;
      sent.clear();
      visibleSince.clear();
      pending.clear();
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
    },
    flushNow() {
      runFlush();
    },
    handleEntry(serviceId: string, position: number, entry: IntersectionObserverEntry) {
      const id = String(serviceId || "");
      if (!id || sent.has(id)) return;

      if (entry.isIntersecting) {
        if (!visibleSince.has(id)) visibleSince.set(id, performance.now());
        return;
      }

      const start = visibleSince.get(id);
      visibleSince.delete(id);
      if (start == null) return;
      const ms = performance.now() - start;
      if (ms < VISIBLE_MIN_MS) return;

      const cur = pending.get(id);
      const nextMs = Math.max(ms, cur?.maxMs ?? 0);
      pending.set(id, { position, maxMs: nextMs });
      sent.add(id);
      scheduleFlush();
    },
    ioThreshold: IO_THRESHOLD,
  };
}

export function postSearchClickFromSerp(payload: {
  query: string;
  entityType: "service" | "provider" | "category";
  entityId: string;
  clickedPosition: number;
  sessionId: string;
  timeToClickMs?: number;
  surface?: string;
}): void {
  const url = `${apiBase()}/api/search/analytics/click`;
  const body = JSON.stringify({
    query: payload.query,
    entityType: payload.entityType,
    entityId: payload.entityId,
    clickedPosition: payload.clickedPosition,
    sessionId: payload.sessionId || undefined,
    timeToClickMs: payload.timeToClickMs,
    surface: payload.surface ?? "serp",
  });
  void fetch(url, {
    method: "POST",
    headers: jsonHeaders(),
    credentials: "include",
    body,
    keepalive: true,
  }).catch(() => {});
}

export async function postQueryRefinementContext(payload: {
  query: string;
  previousQuery: string;
  resultCount: number;
  sessionId: string;
}): Promise<void> {
  if (!payload.sessionId) return;
  const url = `${apiBase()}/api/search/analytics/query-context`;
  try {
    await fetch(url, {
      method: "POST",
      headers: jsonHeaders(),
      credentials: "include",
      body: JSON.stringify({
        query: payload.query,
        previousQuery: payload.previousQuery,
        resultCount: payload.resultCount,
        sessionId: payload.sessionId,
      }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

export function wireVisibleFlushOnHide(flush: () => void): () => void {
  const onHide = () => flush();
  const onVis = () => {
    if (document.visibilityState === 'hidden') onHide();
  };
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', onVis);
  return () => {
    window.removeEventListener('pagehide', onHide);
    document.removeEventListener('visibilitychange', onVis);
  };
}
