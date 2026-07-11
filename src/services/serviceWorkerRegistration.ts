/**
 * Registers the ReadNest service worker so the PWA install prompt is offered
 * and the app shell survives offline. Kept intentionally lightweight: a
 * failure here must not break the app, and the SW itself is opt-in per
 * navigation (see public/sw.js).
 */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  // Disable in dev — a stale cached shell during hot reload is worse than
  // no offline support.
  if (import.meta.env.DEV) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("ReadNest service worker registration failed", error);
        }
      });
  });
}
