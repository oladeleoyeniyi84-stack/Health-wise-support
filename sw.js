const CACHE_NAME = 'healthwise-cache-v2';
const SCOPE = '/health-wise-support/';

const urlsToCache = [
  `${SCOPE}`, `${SCOPE}index.html`, `${SCOPE}style.css`,
  `${SCOPE}manifest.json`, `${SCOPE}sw.js`,
  `${SCOPE}faq.html`, `${SCOPE}contact.html`, `${SCOPE}privacy.html`,
  `${SCOPE}terms.html`, `${SCOPE}about.html`, `${SCOPE}changelog.html`,
  `${SCOPE}sitemap.xml`, `${SCOPE}robots.txt`,
  `${SCOPE}icons/favicon.svg`,
  `${SCOPE}icons/apple-touch-icon.png`,
  `${SCOPE}icons/icon-192.png`, `${SCOPE}icons/icon-512.png`,
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      c.addAll(urlsToCache.map(u => new Request(u, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : 0)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(resp => {
      if (resp.ok && r.url.includes(SCOPE)) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(r, clone));
      }
      return resp;
    }))
  );
});
