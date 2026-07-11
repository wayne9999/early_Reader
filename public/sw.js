// ReadNest service worker
// Strategy:
// - Precache the app shell (index.html + the built JS/CSS get network-first
//   with fallback to cache) so an installed PWA opens even offline.
// - Runtime-cache same-origin static assets in /brand/ and generated SEO
//   pages with a stale-while-revalidate policy so navigation feels instant.
// - Never cache anything on cross-origin API hosts (Firebase, Google APIs,
//   Stripe): those must always be fresh.

const CACHE_VERSION = "v2";
const APP_SHELL_CACHE = `readnest-app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `readnest-runtime-${CACHE_VERSION}`;

const SHELL_URLS = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/brand/readnest-icon-192.png",
  "/brand/readnest-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok && request.method === "GET") {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    if (request.mode === "navigate") {
      const fallback = await cache.match("/index.html");
      if (fallback) {
        return fallback;
      }
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok && request.method === "GET") {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkFetch;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || !isSameOrigin(url)) {
    return;
  }

  // Never cache the analytics/beacon endpoints even when same-origin.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/__/")) {
    return;
  }

  // Navigations: network-first so the SPA shell is always fresh, cache
  // fallback keeps the app openable offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_SHELL_CACHE));
    return;
  }

  // Hashed build assets: cache-first is safe, they're content-addressed.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Brand assets, generated SEO landing pages, sitemap, robots.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});
