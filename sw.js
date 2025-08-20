// Health-wise Support · Service Worker
// Minimal "app shell" cache with runtime caching for GET requests

const VERSION = "hw-support-v1.0.0";
const ORIGIN_PATH = "/health-wise-support"; // <- your Pages base path

// Precache the core shell for instant loads / offline
const PRECACHE = [
  `${ORIGIN_PATH}/`,
  `${ORIGIN_PATH}/index.html`,
  `${ORIGIN_PATH}/style.css`,
  `${ORIGIN_PATH}/faq.html`,
  `${ORIGIN_PATH}/privacy.html`,
  `${ORIGIN_PATH}/terms.html`,
  `${ORIGIN_PATH}/contact.html`,
  `${ORIGIN_PATH}/about.html`,
  `${ORIGIN_PATH}/changelog.html`,
  `${ORIGIN_PATH}/manifest.json`,
  `${ORIGIN_PATH}/icons/icon-192.png`,
  `${ORIGIN_PATH}/icons/icon-512.png`,
  `${ORIGIN_PATH}/icons/icon-maskable-192.png`,
  `${ORIGIN_PATH}/icons/icon-maskable-512.png`,
  `${ORIGIN_PATH}/icons/apple-touch-icon.png`,
  `${ORIGIN_PATH}/icons/favicon.svg`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for same-origin GETs, network fallback, then offline fallback
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      // Network fetch, then runtime cache
      return fetch(req).then((res) => {
        // Only cache successful, same-origin, basic responses
        const okToCache =
          sameOrigin &&
          res &&
          res.status === 200 &&
          res.type === "basic";

        if (okToCache) {
          const resClone = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => {
        // Offline fallback: serve home if same-origin HTML requested
        if (sameOrigin && req.headers.get("accept")?.includes("text/html")) {
          return caches.match(`${ORIGIN_PATH}/index.html`);
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      });
    })
  );
});
