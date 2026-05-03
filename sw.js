// 1. Definir la lista PRIMERO
const CACHE_NAME = 'vaultstream-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// 2. Usarla en los eventos DESPUÉS
self.addEventListener('install', event => {
  console.log('Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Aquí ya existe ASSETS_TO_CACHE
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.error('Fallo al cargar:', url, err));
        })
      );
    })
  );
  self.skipWaiting();
});

// El resto del código (activate y fetch) va igual abajo...
