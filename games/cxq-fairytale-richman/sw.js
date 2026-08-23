const CACHE='cxq-richman-20260824-1020';
const PRECACHE=[
  './','./index.html','./core.js','./viewport.js','./game.js','./manifest.webmanifest',
  './assets/backgrounds/home_scene_v7.png','./assets/backgrounds/setup_scene_v4.png',
  './assets/ui/btn_blue.webp','./assets/ui/btn_red.webp','./assets/ui/char_slot_v2.webp','./assets/ui/player_seat_v2.webp','./assets/ui/role_info_v2.webp',
  './assets/ui/home_menu_new_v1.png','./assets/ui/home_menu_continue_v1.png','./assets/ui/home_menu_help_v1.png','./assets/ui/home_menu_settings_v1.png',
  './assets/ui/character_stage_v1.png','./assets/ui/ability_panel_v1.png',
  './assets/ui/player_seat_p1_v1.png','./assets/ui/player_seat_p2_v1.png','./assets/ui/player_seat_p3_v1.png','./assets/ui/player_seat_p4_v1.png',
  './assets/ui/status_human_v1.png','./assets/ui/status_ai_v1.png','./assets/ui/status_off_v1.png',
  './assets/characters/portraits/joy_portrait_v1.png','./assets/characters/portraits/dream_portrait_v1.png','./assets/characters/portraits/night_portrait_v1.png','./assets/characters/portraits/sadness_portrait_v1.png','./assets/characters/portraits/trust_portrait_v1.png','./assets/characters/portraits/memory_portrait_v1.png','./assets/characters/portraits/growth_portrait_v1.png','./assets/characters/portraits/healing_portrait_v1.png','./assets/characters/portraits/luck_portrait_v1.png','./assets/characters/portraits/hope_portrait_v1.png',
  './assets/maps/map_preview_starwish_v1.png','./assets/maps/map_preview_moonharbor_v1.png','./assets/maps/map_preview_cloudbazaar_v1.png',
  './assets/maps/map_world_starwish_v1.png','./assets/maps/map_world_moonharbor_v1.png','./assets/maps/map_world_cloudbazaar_v1.png',
  './assets/tiles/land.webp','./assets/tiles/card_v2.png','./assets/tiles/shop.webp','./assets/tiles/minigame.webp','./assets/tiles/npc.webp',
  './assets/dice/dice_1.webp','./assets/dice/dice_2.webp','./assets/dice/dice_3.webp','./assets/dice/dice_4.webp','./assets/dice/dice_5.webp','./assets/dice/dice_6.webp',
  '../../assets/characters/cxq-role-joy.webp','../../assets/characters/cxq-role-dream.webp','../../assets/characters/cxq-role-night.webp','../../assets/characters/cxq-role-sadness.webp','../../assets/characters/cxq-role-trust.webp','../../assets/characters/cxq-role-memory.webp','../../assets/characters/cxq-role-growth.webp','../../assets/characters/cxq-role-healing.webp','../../assets/characters/cxq-role-luck.webp','../../assets/characters/cxq-role-hope.webp'
  ,'./assets/characters/joy/walk_right_contact_v1.png','./assets/characters/joy/walk_right_passing_v1.png','./assets/characters/dream/walk_right_contact_v1.png','./assets/characters/dream/walk_right_passing_v1.png','./assets/characters/night/walk_right_contact_v1.png','./assets/characters/night/walk_right_passing_v1.png','./assets/characters/sadness/walk_right_contact_v1.png','./assets/characters/sadness/walk_right_passing_v1.png','./assets/characters/trust/walk_right_contact_v1.png','./assets/characters/trust/walk_right_passing_v1.png','./assets/characters/memory/walk_right_contact_v1.png','./assets/characters/memory/walk_right_passing_v1.png','./assets/characters/growth/walk_right_contact_v1.png','./assets/characters/growth/walk_right_passing_v1.png','./assets/characters/healing/walk_right_contact_v1.png','./assets/characters/healing/walk_right_passing_v1.png','./assets/characters/luck/walk_right_contact_v1.png','./assets/characters/luck/walk_right_passing_v1.png','./assets/characters/hope/walk_right_contact_v1.png','./assets/characters/hope/walk_right_passing_v1.png'
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
