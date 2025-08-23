// sw.js — Health-wise Support Service Worker (GitHub Pages)
// Cache version (bump to invalidate old caches)
const CACHE_NAME = 'healthwise-cache-v2';

// Important: use root-relative paths for GH Pages under /health-wise-support/
const urlsToCache = [
  '/health-wise-support/',
  '/health-wise-support/index.html',
  '/health-wise-support/style.css',
  '/health-wise-support/faq.html',
  '/health-wise-support/contact.html',
  '/health-wise-support/privacy.html',
  '/health-wise-support/terms.html',
  '/health-wise-support/about.html',
  '/health-wise-support/changelog.html',
  '/health-wise-support/manifest.json',
  '/health-wise-support/icons/favicon.svg',
  '/health-wise-support/icons/apple-touch-icon.png'
];

// Install: cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Try network first, fallback to cache, then to index
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((res) => res || caches.match('/health-wise-support/index.html'))
        )
    );
  } else {
    // Assets: try cache first, then network
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});
