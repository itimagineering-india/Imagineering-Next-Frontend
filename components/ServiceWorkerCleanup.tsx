"use client";

import { useEffect } from "react";

/**
 * Clears legacy Vite PWA service workers / Cache Storage that can keep serving
 * an old UI shell after Next.js deploys (until the user hard-refreshes).
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const run = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
      } catch {
        /* ignore */
      }
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        /* ignore */
      }
      if (cancelled) return;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
