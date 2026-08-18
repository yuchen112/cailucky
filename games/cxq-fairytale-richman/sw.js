const CACHE='cxq-richman-20260818-1900';
const PRECACHE=[
  './','./index.html','./core.js','./viewport.js','./game.js','./manifest.webmanifest',
  './assets/backgrounds/home_scene_v3.webp','./assets/backgrounds/setup_scene_v3.webp','./assets/backgrounds/map_scene_r1.webp',
  './assets/ui/btn_blue.webp','./assets/ui/btn_red.webp','./assets/ui/char_slot_v2.webp','./assets/ui/player_seat_v2.webp','./assets/ui/role_info_v2.webp',
  './assets/tiles/land.webp','./assets/tiles/card.webp','./assets/tiles/shop.webp','./assets/tiles/minigame.webp','./assets/tiles/npc.webp',
  './assets/dice/dice_1.webp','./assets/dice/dice_2.webp','./assets/dice/dice_3.webp','./assets/dice/dice_4.webp','./assets/dice/dice_5.webp','./assets/dice/dice_6.webp',
  '../../assets/characters/cxq-role-joy.webp','../../assets/characters/cxq-role-dream.webp','../../assets/characters/cxq-role-night.webp','../../assets/characters/cxq-role-sadness.webp','../../assets/characters/cxq-role-trust.webp','../../assets/characters/cxq-role-memory.webp','../../assets/characters/cxq-role-growth.webp','../../assets/characters/cxq-role-healing.webp','../../assets/characters/cxq-role-luck.webp','../../assets/characters/cxq-role-hope.webp'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cxq-richman-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req)));
});
