const CACHE_NAME = 'vaultstream-v1';
// Lista de archivos que queremos que funcionen offline
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.css',
  'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.polyfilled.js'
];

// Instalación: Guardar archivos en la caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Estrategia de respuesta: Primero caché, luego red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
