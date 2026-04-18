const CACHE_NAME = 'nightnight-v1';
const urlsToCache = [
  './',
  './index.html',
  './index.css', 
  // './assets/index-DTJ3KXK7.js', // Removed hardcoded hash to prevent 404s after build updates. Ideally let Vite PWA handle this.
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
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
      }
    )
  );
});