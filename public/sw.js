const CACHE = 'nulljima-seo-v4';
const PRECACHE = ['/', '/ja'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  // Don't cache Firestore or external API calls
  if (url.hostname.includes('firestore') || url.hostname.includes('firebase')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) {
          e.waitUntil(caches.open(CACHE).then((cache) => cache.put(e.request, res.clone())));
        }
        return res;
      }).catch(async () =>
        await caches.match(e.request) || caches.match(url.pathname === '/ja' || url.pathname.startsWith('/ja/') ? '/ja' : '/')
      )
    );
    return;
  }
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
    if (res.ok) caches.open(CACHE).then((cache) => cache.put(e.request, res.clone()));
    return res;
  })));
});
