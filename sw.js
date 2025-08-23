// sw.js — Health-wise Support Service Worker

const CACHE_NAME = 'healthwise-cache-v2';
const SCOPE = '/health-wise-support/';  // GitHub Pages repo path

// All URLs MUST be absolute-from-origin and start with SCOPE
const urlsToCache = [
  `${SCOPE}`,
  `${SCOPE}index.html`,
  `${SCOPE}style.css`,
  `${SCOPE}manifest.json`,
  `${SCOPE}sw.js`,
  `${SCOPE}faq.html`,
  `${SCOPE}contact.html`,
  `${SCOPE}privacy.html`,
  `${SCOPE}terms.html`,
  `${SCOPE}about.html`,
  `${SCOPE}changelog.html`,
  `${SCOPE}sitemap.xml`,
  `${SCOPE}robots.txt`,
  `${SCOPE}icons/favicon.svg`,
  `${SCOPE}icons/apple-touch-icon.png`,
  `${SCOPE}icons/icon-192.png`,
  `${SCOPE}icons/icon-512.png`
];

// INSTALL — pre-cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Force fresh copies on first install
        await cache.addAll(urlsToCache.map(u => new Request(u, { cache: 'reload' })));
        console.log('[SW] cached', urlsToCache.length, 'items');
      } catch (err) {
        console.error('[SW] cache addAll failed:', err);
        throw err; // abort install -> visible in DevTools
      }
    })
  );
  self.skipWaiting();
});

// ACTIVATE — claim clients and clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] activate');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
    ).then(() => self.clients.claim())
  );
});

// FETCH — cache-first, then network, with fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle same-origin GET
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        // Optionally cache successful GETs inside scope
        if (resp.ok && request.url.includes(SCOPE)) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return resp;
      }).catch((err) => {
        console.warn('[SW] fetch failed; returning offline fallback if any', err);
        return cached || Response.error();
      });
    })
  );
});
