
const CACHE = 'geoedu-pwa-v3-auto-1577';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(
        CORE.map(url => new Request(url, { cache: 'reload' }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key =>
          key.startsWith('geoedu-pwa-') && key !== CACHE
        ).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);

        try {
          const response = await fetch(event.request, {
            cache: 'no-store'
          });

          if (response.ok) {
            await cache.put(event.request, response.clone());
          }

          return response;
        } catch {
          return await cache.match(event.request) ||
            (event.request.mode === 'navigate'
              ? await cache.match('./index.html')
              : null) ||
            Response.error();
        }
      })()
    );
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(event.request);

        if (cached) return cached;

        const response = await fetch(event.request);

        if (response.ok || response.type === 'opaque') {
          await cache.put(event.request, response.clone());
        }

        return response;
      })()
    );
  }
});
