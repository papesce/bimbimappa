const CACHE_NAME = 'funmap-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET, chrome-extension, and API requests
  if (
    request.method !== 'GET' ||
    request.url.startsWith('chrome-extension') ||
    request.url.includes('supabase') ||
    request.url.includes('googleapis.com/maps') ||
    request.url.includes('tile.openstreetmap.org')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      // Network-first for navigation requests (SPA shell)
      if (request.mode === 'navigate') {
        return fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached || new Response('Offline', { status: 503 }));
      }

      // Cache-first for static assets (JS, CSS, images from our origin)
      if (request.url.startsWith(self.location.origin)) {
        return (
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
        );
      }

      // Network-first for everything else (fonts, third-party)
      return fetch(request).catch(() => cached || new Response('', { status: 503 }));
    }),
  );
});
