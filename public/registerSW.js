/**
 * Replaces legacy Vite PWA registerSW.js.
 * Unregisters any controlling service worker so users stop seeing a stale UI.
 */
(function () {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (reg) {
      reg.unregister();
    });
  });
  if (window.caches && caches.keys) {
    caches.keys().then(function (keys) {
      keys.forEach(function (key) {
        caches.delete(key);
      });
    });
  }
})();
