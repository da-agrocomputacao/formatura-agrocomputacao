const CACHE_NAME = 'agrocomputacao-formatura-v2';
const urlsToCache = [
  './',
  './index.html?v=2',
  './style.css?v=2',
  './script.js?v=2',
  './manifest.json',
  './logo_48x48.png?v=2',
  './logo_72x72.png?v=2',
  './logo_96x96.png?v=2',
  './logo_144x144.png?v=2',
  './logo_192x192.png?v=2',
  './logo_256x256.png?v=2',
  './logo_512x512.png?v=2',
  './logo_1024x1024.png?v=2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
