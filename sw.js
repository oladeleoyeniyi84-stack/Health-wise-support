-// sw.js — Health-wise Support Service Worker
-const CACHE_NAME = 'healthwise-cache-v1';
+// sw.js — Health-wise Support Service Worker
+// bump this when you ship content changes
+const CACHE_NAME = 'healthwise-cache-v3';

 const urlsToCache = [
   '/health-wise-support/',
   '/health-wise-support/index.html',
   '/health-wise-support/style.css',
   '/health-wise-support/faq.html',
   '/health-wise-support/contact.html',
   '/health-wise-support/terms.html',
   '/health-wise-support/privacy.html',
   '/health-wise-support/about.html',
   '/health-wise-support/changelog.html',
   '/health-wise-support/icons/favicon.svg',
   '/health-wise-support/icons/apple-touch-icon.png'
 ];

 self.addEventListener('install', (event) => {
   event.waitUntil(
     caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
   );
   self.skipWaiting();
 });

 self.addEventListener('activate', (event) => {
   event.waitUntil(
     caches.keys().then((keys) =>
       Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
     )
   );
   self.clients.claim();
 });

-// Default: cache-first
-self.addEventListener('fetch', (event) => {
-  event.respondWith(
-    caches.match(event.request).then((cached) => {
-      if (cached) return cached;
-      return fetch(event.request).then((resp) => {
-        const copy = resp.clone();
-        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
-        return resp;
-      });
-    })
-  );
-});
+// HTML: network-first (so page edits appear immediately)
+// Assets (CSS/JS/icons): cache-first (fast)
+self.addEventListener('fetch', (event) => {
+  const req = event.request;
+  const accept = req.headers.get('accept') || '';
+  const isHTML =
+    req.mode === 'navigate' ||
+    accept.includes('text/html');
+
+  if (isHTML) {
+    event.respondWith(
+      fetch(req)
+        .then((resp) => {
+          const copy = resp.clone();
+          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
+          return resp;
+        })
+        .catch(() => caches.match(req))
+    );
+    return;
+  }
+
+  // cache-first for everything else
+  event.respondWith(
+    caches.match(req).then((cached) => {
+      if (cached) return cached;
+      return fetch(req).then((resp) => {
+        const copy = resp.clone();
+        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
+        return resp;
+      });
+    })
+  );
+});
