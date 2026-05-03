const CACHE_NAME = 'vaultstream-v3';

// SOLO archivos que existen realmente en tu repositorio raíz
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

// Instalación
self.addEventListener('install', event => {
  console.log('Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Usamos map para que si uno falla, los demás se guarden
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.error('Fallo al cargar:', url, err));
        })
      );
    })
  );
  self.skipWaiting();
});

// Activación (Limpieza de cachés viejas)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Respuesta a peticiones
self.addEventListener('fetch', event => {
  // No cachear llamadas a la API de Cobalt ni CDNs externos aquí para evitar errores de CORS
  if (event.request.url.includes('railway.app') || event.request.url.includes('plyr.io')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
