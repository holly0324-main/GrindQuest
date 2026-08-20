const CACHE = 'grindquest-shell-v18';
const FILES = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/core/alchemy.js',
  './src/core/game.js',
  './src/core/storage.js',
  './src/data/battle/actions.js',
  './src/data/catalog-normalize.js',
  './src/data/crafting/alchemy-recipes.js',
  './src/data/crafting/forge-recipes.js',
  './src/data/gameData.js',
  './src/data/index.js',
  './src/data/quests/quests.js',
  './src/data/inventory/backpacks.js',
  './src/data/items/consumables.js',
  './src/data/items/equipment.js',
  './src/data/items/materials.js',
  './src/data/monsters/enemies.js',
  './src/data/shops/equipment-shops.js',
  './src/data/world/local-areas.js',
  './src/data/world/random-events.js',
  './src/data/world/world-map.js',
  './src/data/world/zones.js',
  './src/game/battle/battle.js',
  './src/game/characters/characters.js',
  './src/game/condition/condition.js',
  './src/game/crafting/alchemy/simulator.js',
  './src/game/crafting/alchemy-actions.js',
  './src/game/crafting/forge.js',
  './src/game/economy/economy.js',
  './src/game/discovery/discovery.js',
  './src/game/encyclopedia/encyclopedia.js',
  './src/game/equipment/actions.js',
  './src/game/equipment/model.js',
  './src/game/expedition/expedition.js',
  './src/game/handbook/handbook.js',
  './src/game/equipment/shop.js',
  './src/game/exploration/exploration.js',
  './src/game/idle/idle.js',
  './src/game/inventory/inventory.js',
  './src/game/items/catalog.js',
  './src/game/quests/quests.js',
  './src/game/save/storage.js',
  './src/game/shared/constants.js',
  './src/game/shared/utils.js',
  './src/game/state/state.js',
  './src/game/time/clock.js',
  './src/main.js',
  './src/ui/app.js',
  './src/ui/helpers.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
] ;
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
