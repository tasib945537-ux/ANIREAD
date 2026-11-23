const CACHE_NAME = 'aniread-v3';
const STATIC_ASSETS = [
  '/',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache error (ignored):', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never intercept or cache development modules, Vite runtime, or APIs
  if (
    url.includes('/src/') ||
    url.includes('/@vite/') ||
    url.includes('/@id/') ||
    url.includes('/api/') ||
    url.includes('/node_modules/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Navigation requests: Network-first, fallback to root cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/').then((matched) => matched || Response.error());
      })
    );
    return;
  }

  // Static assets (fonts, images, icons, dist assets): Cache-first with background revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background revalidation
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }
          const shouldCache =
            url.includes('/assets/') ||
            url.includes('fonts.gstatic.com') ||
            url.endsWith('.png') ||
            url.endsWith('.svg') ||
            url.endsWith('.webp');

          if (shouldCache) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return new Response('', { status: 408, statusText: 'Offline' });
        });
    })
  );
});
