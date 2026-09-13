const CACHE='cxq-richman-20260913-0520';
const PRECACHE=[
  './','./index.html','./core.js','./viewport.js','./game.js','./manifest.webmanifest',
  '../../assets/brand/cxq-app-icon-192.png','../../assets/brand/cxq-app-icon-512.png',
  './assets/backgrounds/home_scene_v7.webp','./assets/backgrounds/setup_scene_v4.webp',
  './assets/ui/btn_blue_v5.png','./assets/ui/btn_red_v5.png','./assets/ui/player_plate_v5.png','./assets/ui/tooltip_plate_v5.png',
  './assets/ui/home_menu_new_v4.png','./assets/ui/home_menu_continue_v4.png','./assets/ui/home_menu_help_v4.png','./assets/ui/home_menu_settings_v4.png',
  './assets/ui/modal_frame_v6.png',
  './assets/ui/info_panel_v5.png','./assets/ui/settings_frame_v5.png','./assets/ui/settings_icon_v6.png','./assets/ui/dice_frame_v5.png',
  './assets/ui/flag_p1_v4.png','./assets/ui/flag_p2_v4.png','./assets/ui/flag_p3_v4.png','./assets/ui/flag_p4_v4.png',
  './assets/characters/joy/idle_v7.png','./assets/characters/joy/walk_right_contact_v7.png','./assets/characters/joy/walk_right_passing_v7.png','./assets/characters/joy/dice_v7.png','./assets/characters/joy/surprise_v7.png','./assets/characters/joy/victory_v7.png',
  './assets/characters/dream/idle_v7.png','./assets/characters/dream/walk_right_contact_v7.png','./assets/characters/dream/walk_right_passing_v7.png','./assets/characters/dream/dice_v7.png','./assets/characters/dream/surprise_v7.png','./assets/characters/dream/victory_v7.png',
  './assets/characters/night/idle_v7.png','./assets/characters/night/walk_right_contact_v7.png','./assets/characters/night/walk_right_passing_v7.png','./assets/characters/night/dice_v7.png','./assets/characters/night/surprise_v7.png','./assets/characters/night/victory_v7.png',
  './assets/characters/sadness/idle_v7.png','./assets/characters/sadness/walk_right_contact_v7.png','./assets/characters/sadness/walk_right_passing_v7.png','./assets/characters/sadness/dice_v7.png','./assets/characters/sadness/surprise_v7.png','./assets/characters/sadness/victory_v7.png',
  './assets/characters/trust/idle_v7.png','./assets/characters/trust/walk_right_contact_v7.png','./assets/characters/trust/walk_right_passing_v7.png','./assets/characters/trust/dice_v7.png','./assets/characters/trust/surprise_v7.png','./assets/characters/trust/victory_v7.png',
  './assets/characters/memory/idle_v7.png','./assets/characters/memory/walk_right_contact_v7.png','./assets/characters/memory/walk_right_passing_v7.png','./assets/characters/memory/dice_v7.png','./assets/characters/memory/surprise_v7.png','./assets/characters/memory/victory_v7.png',
  './assets/characters/growth/idle_v7.png','./assets/characters/growth/walk_right_contact_v7.png','./assets/characters/growth/walk_right_passing_v7.png','./assets/characters/growth/dice_v7.png','./assets/characters/growth/surprise_v7.png','./assets/characters/growth/victory_v7.png',
  './assets/characters/healing/idle_v7.png','./assets/characters/healing/walk_right_contact_v7.png','./assets/characters/healing/walk_right_passing_v7.png','./assets/characters/healing/dice_v7.png','./assets/characters/healing/surprise_v7.png','./assets/characters/healing/victory_v7.png',
  './assets/characters/luck/idle_v7.png','./assets/characters/luck/walk_right_contact_v7.png','./assets/characters/luck/walk_right_passing_v7.png','./assets/characters/luck/dice_v7.png','./assets/characters/luck/surprise_v7.png','./assets/characters/luck/victory_v7.png',
  './assets/characters/hope/idle_v7.png','./assets/characters/hope/walk_right_contact_v7.png','./assets/characters/hope/walk_right_passing_v7.png','./assets/characters/hope/dice_v7.png','./assets/characters/hope/surprise_v7.png','./assets/characters/hope/victory_v7.png',
  './assets/maps/map_world_starwish_v2.webp','./assets/maps/map_world_moonharbor_v2.webp','./assets/maps/map_world_cloudbazaar_v2.webp',
  './assets/buildings/shared_l1_v4.png','./assets/buildings/shared_l2_v4.png','./assets/buildings/shared_l3_v4.png','./assets/buildings/shared_l4_v4.png',
  './assets/buildings/landmark_joy_v4.png','./assets/buildings/landmark_dream_v4.png','./assets/buildings/landmark_night_v4.png','./assets/buildings/landmark_sadness_v4.png','./assets/buildings/landmark_trust_v4.png','./assets/buildings/landmark_memory_v4.png','./assets/buildings/landmark_growth_v4.png','./assets/buildings/landmark_healing_v4.png','./assets/buildings/landmark_luck_v4.png','./assets/buildings/landmark_hope_v4.png',
  './assets/results/victory_v4.webp','./assets/results/defeat_v4.webp',
  './assets/equipment/deed_v4.png','./assets/equipment/toolkit_v4.png','./assets/equipment/charm_v4.png','./assets/equipment/guardian_v4.png',
  './assets/equipment/bell_v4.png','./assets/equipment/boots_v4.png','./assets/equipment/compass_v4.png','./assets/equipment/manual_v4.png',
  './assets/events/starwish_event_v1.webp','./assets/events/moonharbor_event_v1.webp','./assets/events/cloudbazaar_event_v1.webp',
  './assets/events/kingdom_festival_v2.webp','./assets/events/emergency_repairs_v2.webp','./assets/events/lucky_fountain_v2.webp',
  './assets/events/lost_in_maze_v2.webp','./assets/events/market_boom_v2.webp','./assets/events/mischief_v2.webp',
  './assets/events/guardian_blessing_v2.webp','./assets/events/tax_day_v2.webp','./assets/events/starlight_rain_v2.webp',
  './assets/events/road_construction_v2.webp','./assets/events/kingdom_subsidy_v2.webp','./assets/events/magic_malfunction_v2.webp',
  './assets/events/moonlight_dividend_v2.webp','./assets/events/forest_mist_v2.webp','./assets/events/cloud_tailwind_v2.webp','./assets/events/merchant_guild_reward_v2.webp',
  './assets/events/land_maintenance_v2.webp','./assets/events/fairy_blessing_v2.webp',
  './assets/events/system_land_purchase_v1.webp','./assets/events/system_rent_payment_v1.webp','./assets/events/system_build_upgrade_v1.webp',
  './assets/facilities/magic_token_v2.webp',
  './assets/npc/wealth_v4.png','./assets/npc/fortune_v4.png','./assets/npc/poverty_v4.png','./assets/npc/misfortune_v4.png','./assets/npc/land_v4.png','./assets/npc/angel_v4.png','./assets/npc/demon_v4.png','./assets/npc/death_v4.png',
  './assets/dice/dice_throw_1_v2.webp','./assets/dice/dice_throw_2_v2.webp','./assets/dice/dice_throw_3_v2.webp','./assets/dice/dice_throw_4_v2.webp','./assets/dice/dice_throw_5_v2.webp','./assets/dice/dice_throw_6_v2.webp',
  './assets/tiles/land_v4.png','./assets/tiles/road_node_v3.webp','./assets/tiles/event_v4.png','./assets/tiles/start_v4.png','./assets/dice/dice_action_v4.png',
  './assets/dice/dice_1.webp','./assets/dice/dice_2.webp','./assets/dice/dice_3.webp','./assets/dice/dice_4.webp','./assets/dice/dice_5.webp','./assets/dice/dice_6.webp'
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
  event.respondWith(fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req,{ignoreSearch:true})));
});
