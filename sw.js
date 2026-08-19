const CACHE = 'grindquest-shell-v8';
const FILES = [
  './','./index.html','./styles.css','./manifest.webmanifest',
  './src/main.js','./src/core/game.js','./src/core/storage.js','./src/data/gameData.js','./src/ui/app.js',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png'
];
const scopeUrl = self.registration.scope;
const urls = FILES.map(p => new URL(p, scopeUrl).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return res; }).catch(()=>caches.match(new URL('./index.html', scopeUrl).href)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(event.request,copy)); return res; })));
});
