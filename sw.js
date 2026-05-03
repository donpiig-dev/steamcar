const CACHE_NAME = 'vaultstream-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.css',
  'https://cdn.jsdelivr.net/npm/plyr@3.7.8/dist/plyr.polyfilled.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
