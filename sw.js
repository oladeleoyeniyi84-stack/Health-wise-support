// sw.js — Health-wise Support Service Worker
// Bump this when you ship content changes
const CACHE_NAME = 'healthwise-cache-v4';

// Build absolute URLs based on the SW scope (handles the GitHub Pages subpath)
const BASE = self.registration.scope; // e.g. .../Health-wise-support/

const ASSETS = [
  '',                 // (== ./)
  'index.html',
  'faq.html',
  'terms.html',
  'privacy.html',
  'contact.html',
  'about.html',
  'changelog.html',
  'style.css',
  'manifest.json',
  'icons/favicon.svg',
  'icons/apple-touch-icon.png',
].map(p => new URL(p, BASE).toString());

// Install: pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete old caches and take control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin GET; fall back to network and revalidate
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) {
    return; // let the browser handle it
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        // Stale-while-revalidate: update cache with fresh copy (when OK)
        if (response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
        }
        return response;
      }).catch(() => cached); // offline: serve cache if we had it

      // If cached, return it immediately while updating in background
      return cached || networkFetch;
    })
  );
});

// Optional: allow page to trigger skipWaiting
self.addEventListener('message', evt => {
  if (evt.data === 'SKIP_WAITING') self.skipWaiting();
});
