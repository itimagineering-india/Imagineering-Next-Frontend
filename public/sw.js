/**
 * Kill-switch service worker for Imagineering India.
 *
 * Old Vite PWA (workbox) precached the SPA. After migrating to Next.js, some
 * browsers still ran that SW and served a stale shell until hard refresh.
 * This file replaces /sw.js so any update cycle uninstalls itself and clears caches.
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      const regs = await self.registration.unregister();
      const clientsList = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) {
        client.navigate(client.url);
      }
      return regs;
    })()
  );
});
