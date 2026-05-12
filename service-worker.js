const CACHE_NAME = 'agrocomputacao-formatura-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo_48x48.png',
  './logo_72x72.png',
  './logo_96x96.png',
  './logo_144x144.png',
  './logo_192x192.png',
  './logo_256x256.png',
  './logo_512x512.png',
  './logo_1024x1024.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
