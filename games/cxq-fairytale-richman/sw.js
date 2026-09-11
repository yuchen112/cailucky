const CACHE='cxq-richman-20260912-1200';
const PRECACHE=[
  './','./index.html','./core.js','./viewport.js','./game.js','./manifest.webmanifest',
  '../../assets/brand/cxq-app-icon-192.png','../../assets/brand/cxq-app-icon-512.png',
  './assets/backgrounds/home_scene_v7.webp','./assets/backgrounds/setup_scene_v4.webp',
  './assets/ui/btn_blue.webp','./assets/ui/btn_red.webp','./assets/ui/player_seat_v2.webp','./assets/ui/role_info_v2.webp',
  './assets/ui/home_menu_new_v1.webp','./assets/ui/home_menu_continue_v1.webp','./assets/ui/home_menu_help_v1.webp','./assets/ui/home_menu_settings_v1.webp',
  './assets/ui/character_stage_v1.webp','./assets/ui/ability_panel_v1.webp',
  './assets/ui/action_console_v1.webp',
  './assets/ui/map_card_frame_v1.webp',
  './assets/ui/player_seat_wide_p1_v1.webp','./assets/ui/player_seat_wide_p2_v1.webp','./assets/ui/player_seat_wide_p3_v1.webp','./assets/ui/player_seat_wide_p4_v1.webp',
  './assets/ui/status_human_v1.webp','./assets/ui/status_ai_v1.webp','./assets/ui/status_off_v1.webp',
  './assets/characters/portraits/joy_portrait_v1.webp','./assets/characters/portraits/dream_portrait_v1.webp','./assets/characters/portraits/night_portrait_v1.webp','./assets/characters/portraits/sadness_portrait_v1.webp','./assets/characters/portraits/trust_portrait_v1.webp','./assets/characters/portraits/memory_portrait_v1.webp','./assets/characters/portraits/growth_portrait_v1.webp','./assets/characters/portraits/healing_portrait_v1.webp','./assets/characters/portraits/luck_portrait_v1.webp','./assets/characters/portraits/hope_portrait_v1.webp',
  './assets/maps/map_world_starwish_v2.webp','./assets/maps/map_world_moonharbor_v2.webp','./assets/maps/map_world_cloudbazaar_v2.webp',
  './assets/buildings/starwish_l1_v1.webp','./assets/buildings/starwish_l2_v1.webp','./assets/buildings/starwish_l3_v1.webp',
  './assets/buildings/starwish_l4_v1.webp','./assets/buildings/starwish_l5_v1.webp',
  './assets/buildings/moonharbor_l1_v1.webp','./assets/buildings/moonharbor_l2_v1.webp','./assets/buildings/moonharbor_l3_v1.webp',
  './assets/buildings/moonharbor_l4_v1.webp','./assets/buildings/moonharbor_l5_v1.webp',
  './assets/buildings/cloudbazaar_l1_v1.webp','./assets/buildings/cloudbazaar_l2_v1.webp','./assets/buildings/cloudbazaar_l3_v1.webp',
  './assets/buildings/cloudbazaar_l4_v1.webp','./assets/buildings/cloudbazaar_l5_v1.webp',
  './assets/buildings/landmark_joy_v1.webp','./assets/buildings/landmark_dream_v1.webp','./assets/buildings/landmark_night_v1.webp','./assets/buildings/landmark_sadness_v1.webp','./assets/buildings/landmark_trust_v1.webp','./assets/buildings/landmark_memory_v1.webp','./assets/buildings/landmark_growth_v1.webp','./assets/buildings/landmark_healing_v1.webp','./assets/buildings/landmark_luck_v1.webp','./assets/buildings/landmark_hope_v1.webp',
  './assets/results/victory_ceremony_v1.png','./assets/results/defeat_ceremony_v1.png',
  './assets/equipment/deed_v1.png','./assets/equipment/toolkit_v1.png','./assets/equipment/charm_v1.png','./assets/equipment/guardian_v1.png',
  './assets/equipment/bell_v1.png','./assets/equipment/boots_v1.png','./assets/equipment/compass_v1.png','./assets/equipment/manual_v1.png',
  './assets/events/starwish_event_v1.webp','./assets/events/moonharbor_event_v1.webp','./assets/events/cloudbazaar_event_v1.webp',
  './assets/events/kingdom_festival_v2.webp','./assets/events/emergency_repairs_v2.webp','./assets/events/lucky_fountain_v2.webp',
  './assets/events/lost_in_maze_v2.webp','./assets/events/market_boom_v2.webp','./assets/events/mischief_v2.webp',
  './assets/events/guardian_blessing_v2.webp','./assets/events/tax_day_v2.webp','./assets/events/starlight_rain_v2.webp',
  './assets/events/road_construction_v2.webp','./assets/events/kingdom_subsidy_v2.webp','./assets/events/magic_malfunction_v2.webp',
  './assets/events/moonlight_dividend_v2.webp','./assets/events/forest_mist_v2.webp','./assets/events/cloud_tailwind_v2.webp','./assets/events/merchant_guild_reward_v2.webp',
  './assets/events/land_maintenance_v2.webp','./assets/events/fairy_blessing_v2.webp',
  './assets/events/system_land_purchase_v1.webp','./assets/events/system_rent_payment_v1.webp','./assets/events/system_build_upgrade_v1.webp',
  './assets/facilities/magic_token_v2.webp',
  './assets/npc/wealth_v1.webp','./assets/npc/fortune_v1.webp','./assets/npc/poverty_v1.webp','./assets/npc/misfortune_v1.webp','./assets/npc/land_v1.webp','./assets/npc/angel_v1.webp','./assets/npc/demon_v1.webp','./assets/npc/death_v1.webp',
  './assets/dice/dice_throw_1_v2.webp','./assets/dice/dice_throw_2_v2.webp','./assets/dice/dice_throw_3_v2.webp','./assets/dice/dice_throw_4_v2.webp','./assets/dice/dice_throw_5_v2.webp','./assets/dice/dice_throw_6_v2.webp',
  './assets/tiles/land_parcel_v1.webp','./assets/tiles/road_node_v3.webp','./assets/tiles/event_token_v3.png','./assets/tiles/start_token_v3.png',
  './assets/dice/dice_1.webp','./assets/dice/dice_2.webp','./assets/dice/dice_3.webp','./assets/dice/dice_4.webp','./assets/dice/dice_5.webp','./assets/dice/dice_6.webp',
  '../../assets/characters/cxq-role-joy.webp','../../assets/characters/cxq-role-dream.webp','../../assets/characters/cxq-role-night.webp','../../assets/characters/cxq-role-sadness.webp','../../assets/characters/cxq-role-trust.webp','../../assets/characters/cxq-role-memory.webp','../../assets/characters/cxq-role-growth.webp','../../assets/characters/cxq-role-healing.webp','../../assets/characters/cxq-role-luck.webp','../../assets/characters/cxq-role-hope.webp'
  ,'./assets/characters/joy/walk_right_contact_v1.webp','./assets/characters/joy/walk_right_passing_v1.webp','./assets/characters/dream/walk_right_contact_v1.webp','./assets/characters/dream/walk_right_passing_v1.webp','./assets/characters/night/walk_right_contact_v1.webp','./assets/characters/night/walk_right_passing_v1.webp','./assets/characters/sadness/walk_right_contact_v1.webp','./assets/characters/sadness/walk_right_passing_v1.webp','./assets/characters/trust/walk_right_contact_v1.webp','./assets/characters/trust/walk_right_passing_v1.webp','./assets/characters/memory/walk_right_contact_v1.webp','./assets/characters/memory/walk_right_passing_v1.webp','./assets/characters/growth/walk_right_contact_v1.webp','./assets/characters/growth/walk_right_passing_v1.webp','./assets/characters/healing/walk_right_contact_v1.webp','./assets/characters/healing/walk_right_passing_v1.webp','./assets/characters/luck/walk_right_contact_v1.webp','./assets/characters/luck/walk_right_passing_v1.webp','./assets/characters/hope/walk_right_contact_v1.webp','./assets/characters/hope/walk_right_passing_v1.webp'
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
