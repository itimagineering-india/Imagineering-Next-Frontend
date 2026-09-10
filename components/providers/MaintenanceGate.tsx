"use client";

import { useCallback, useEffect, useState } from "react";
import { MAINTENANCE_EVENT } from "@/lib/maintenanceEvents";

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:5000";

const POLL_MS = 30_000;
const DEFAULT_MSG =
  "Imagineering India is temporarily under maintenance. Please try again shortly.";

/**
 * Full-page gate when admin enables Settings → Maintenance Mode.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/feature-status`, {
        credentials: "omit",
        cache: "no-store",
      });
      const json = await res.json();
      const on = Boolean(json?.data?.maintenanceMode);
      setActive(on);
      if (json?.data?.maintenanceMessage) {
        setMessage(String(json.data.maintenanceMessage));
      }
      return on;
    } catch {
      setActive(false);
      return false;
    } finally {
      setReady(true);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const id = window.setInterval(() => void check(), POLL_MS);
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) setMessage(detail.message);
      setActive(true);
      setReady(true);
    };
    window.addEventListener(MAINTENANCE_EVENT, onEvent);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(MAINTENANCE_EVENT, onEvent);
    };
  }, [check]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        Loading…
      </div>
    );
  }

  if (active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-gradient-to-b from-slate-100 to-slate-200 text-center">
        <p className="text-2xl font-semibold tracking-tight text-slate-900">Imagineering India</p>
        <p className="max-w-md text-slate-600 leading-relaxed">{message}</p>
        <p className="text-xs text-slate-500">We’ll be back soon.</p>
        <button
          type="button"
          onClick={() => void check()}
          disabled={checking}
          className="mt-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Try Again"}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
