self.addEventListener('fetch', event => {
  // Si la petición es para el CDN de Plyr, deja que pase normal
  if (event.request.url.includes('plyr.io') || event.request.url.includes('cdnjs.cloudflare.com')) {
    return; 
  }
  
  // Tu lógica actual de event.respondWith...
});
// Dentro de tu sw.js
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  'https://cdn.plyr.io/3.7.8/plyr.js', // Agrega esto
  'https://cdn.plyr.io/3.7.8/plyr.css'  // Agrega esto
];
const CACHE_NAME = 'vaultstream-v2'; // Cambiamos el nombre para forzar actualización
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Instalando caché...');
        return cache.addAll(ASSETS);
      })
      .catch(err => console.error('Fallo en cache.addAll:', err))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
