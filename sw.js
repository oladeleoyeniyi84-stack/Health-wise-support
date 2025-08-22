// sw.js — Health-wise Support Service Worker

const CACHE_NAME = "healthwise-cache-v1";
const urlsToCache = [
  "/health-wise-support/",
  "/health-wise-support/index.html",
  "/health-wise-support/style.css",
  "/health-wise-support/faq.html",
  "/health-wise-support/contact.html",
  "/health-wise-support/privacy.html",
  "/health-wise-support/terms.html",
  "/health-wise-support/about.html",
  "/health-wise-support/changelog.html",
  "/health-wise-support/icons/favicon.svg",
  "/health-wise-support/icons/apple-touch-icon.png"
];

// Install: cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate: clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch: serve from cache first, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
