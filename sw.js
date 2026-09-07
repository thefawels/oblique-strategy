const SCOPE = new URL('./', self.location.href);
const CACHE_PREFIX = `oblique-strategy:${SCOPE.pathname}:`;
const CACHE = `${CACHE_PREFIX}v3`;
const FILES = [
  './', './index.html', './style.css?v=3', './app.js?v=3', './cards.js',
  './manifest.webmanifest?v=3', './assets/favicon.png',
  './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png'
].map(path => new URL(path, SCOPE).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== SCOPE.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && !response.redirected && url.pathname === SCOPE.pathname) {
          const cache = await caches.open(CACHE);
          await cache.put(SCOPE.href, response.clone());
        }
        if (response.ok || response.redirected) return response;
      } catch { /* Use the complete cached app while offline. */ }
      const cache = await caches.open(CACHE);
      return (await cache.match(SCOPE.href)) || Response.error();
    })());
    return;
  }

  if (!FILES.includes(url.href)) return;
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request)).then(cached => cached || fetch(request)));
});
