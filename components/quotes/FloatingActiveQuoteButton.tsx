"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  clearActiveQuoteRequest,
  getActiveQuoteRequest,
  setActiveQuoteRequest,
  type ActiveQuoteRequest,
} from "@/lib/activeQuoteRequest";
import { cn } from "@/lib/utils";

function formatCountdown(expiresAt?: string) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function FloatingActiveQuoteButton() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [active, setActive] = useState<ActiveQuoteRequest | null>(null);
  const [offerCount, setOfferCount] = useState(0);
  const [secondsLabel, setSecondsLabel] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const syncFromStorage = useCallback(() => {
    setActive(getActiveQuoteRequest());
  }, []);

  const refreshStatus = useCallback(async () => {
    const row = getActiveQuoteRequest();
    if (!row?.id || !isAuthenticated) {
      setActive(null);
      return;
    }
    setChecking(true);
    try {
      const res = await api.quoteRequests.getById(row.id);
      if (!res.success) {
        clearActiveQuoteRequest(row.id);
        setActive(null);
        return;
      }
      const data = (res as any).data;
      const status = String(data?.status || "");
      if (status === "cancelled" || status === "ordered" || data?.booking) {
        clearActiveQuoteRequest(row.id);
        setActive(null);
        return;
      }
      const next: ActiveQuoteRequest = {
        id: String(data.id || row.id),
        expiresAt: data.expiresAt || row.expiresAt,
        serviceTitle:
          typeof data.service === "object" && data.service?.title
            ? data.service.title
            : row.serviceTitle,
      };
      setActiveQuoteRequest(next);
      setActive(next);
      setOfferCount(Array.isArray(data.offers) ? data.offers.length : 0);
    } catch {
      // Keep shortcut if offline; next tick will retry.
      setActive(row);
    } finally {
      setChecking(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    syncFromStorage();
    const onChange = () => syncFromStorage();
    window.addEventListener("active-quote-changed", onChange as EventListener);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("active-quote-changed", onChange as EventListener);
      window.removeEventListener("storage", onChange);
    };
  }, [syncFromStorage]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    void refreshStatus();
    const t = setInterval(() => void refreshStatus(), 20000);
    return () => clearInterval(t);
  }, [authLoading, isAuthenticated, refreshStatus]);

  useEffect(() => {
    if (!active?.expiresAt) {
      setSecondsLabel(null);
      return;
    }
    const tick = () => setSecondsLabel(formatCountdown(active.expiresAt));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [active?.expiresAt, active?.id]);

  if (!isAuthenticated || !active?.id) return null;

  const onQuotePage =
    pathname === `/quote-requests/${active.id}` ||
    pathname?.startsWith(`/quote-requests/${active.id}/`);

  if (onQuotePage) return null;

  return (
    <Link
      href={`/quote-requests/${active.id}`}
      className={cn(
        "fixed bottom-24 right-4 z-[60] flex items-center gap-2 rounded-full border border-sky-200 bg-white pl-3 pr-4 py-2.5 shadow-lg transition hover:scale-[1.02] hover:shadow-xl sm:bottom-28 sm:right-6",
        "dark:border-sky-800 dark:bg-slate-900"
      )}
      aria-label="Open your active quote request"
      title={active.serviceTitle ? `Quotes: ${active.serviceTitle}` : "Open active quote request"}
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white">
        {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock className="h-5 w-5" />}
        {offerCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
            {offerCount > 9 ? "9+" : offerCount}
          </span>
        ) : (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
        )}
      </span>
      <span className="hidden min-w-0 flex-col sm:flex">
        <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
          Active quotes
        </span>
        <span className="font-mono text-[11px] tabular-nums text-slate-500">
          {secondsLabel || "View"}
        </span>
      </span>
    </Link>
  );
}
