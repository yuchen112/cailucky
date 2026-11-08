import assert from'node:assert/strict';
import{ROLES,MAPS,MONSTERS,EQUIPMENT,PASSIVES,createExpedition,defaultProfile,upgradeCost,upgradeEquipment,upgradeTrait,settle,summary,step,choose,offer,reroll,skip,ban,dash,active,serialize,restore,rng,spawnMonster,weaponCount,passiveCount,body,enemyBody,orbitSpec}from'../expedition-core.mjs';
let count=0;const check=(name,fn)=>{fn();console.log('PASS',++count,name)};
const isolated=(roleId='dream')=>{const g=createExpedition({roleId,seed:42});g.spawn=1e6;g.eliteAt=1e6;g.hazardAt=1e6;g.objectiveAt=1e6;return g};
function target(g,x=180,y=-12,species=0){const e=spawnMonster(g,species,()=>.5,{x,y});e.hp=e.maxHp=1e6;e.speed=0;e.attack=1e6;e.contact=0;return e}
function ticks(g,n=180,input={}){for(let i=0;i<n;i++){step(g,1/60,input,rng(i));g.events=[]}}
function pick(g,kind,id){g.status='upgrade';g.choices=[{kind,id}];return choose(g,0)}
check('ten canonical roles, twenty supports and thirty real species',()=>{assert.equal(ROLES.length,10);assert.equal(Object.values(EQUIPMENT).filter(e=>e.kind==='support').length,20);assert.equal(MONSTERS.length,30);assert.equal(new Set(MONSTERS.map(m=>m.name)).size,30);assert.equal(new Set(MONSTERS.map(m=>m.behavior)).size>=12,true);for(const r of ROLES){assert.ok(r.allowed.length>=4);assert.ok(EQUIPMENT[r.main]);for(const id of r.allowed)assert.equal(EQUIPMENT[id].kind,'support')}for(const m of MAPS){assert.equal(m.enemies.length,6);assert.equal(m.enemies.filter(id=>MONSTERS[id].boss).length,1);assert.ok(m.enemies.every(id=>MONSTERS[id].mapId===m.id))}});
check('profile migration preserves old coins and permanent stats',()=>{const p=defaultProfile({coins:142,meta:{heart:3,power:4,speed:2,magnet:5},muted:true});assert.equal(p.coins,142);assert.deepEqual(p.legacyMeta,{heart:3,power:4,speed:2,magnet:5});assert.equal(createExpedition({profile:p}).player.maxHp,124);assert.equal(p.muted,true);assert.equal(defaultProfile('{bad').coins,0)});
check('all starter mains are unique and only valid gear is offered',()=>{for(const role of ROLES){const g=createExpedition({roleId:role.id});assert.equal(g.weapons[role.main],1);assert.equal(weaponCount(g),1);for(let i=0;i<20;i++){offer(g,rng(i));assert.ok(g.choices.some(c=>c.kind==='weapon'&&!g.weapons[c.id]));assert.ok(g.choices.filter(c=>c.kind==='weapon').every(c=>c.id===role.main||role.allowed.includes(c.id)))}}});
check('three attack slots and four blessing slots enforced',()=>{const g=isolated(),r=ROLES.find(r=>r.id===g.roleId);assert.ok(pick(g,'weapon',r.allowed[0]));assert.ok(pick(g,'weapon',r.allowed[1]));assert.equal(pick(g,'weapon',r.allowed[2]),false);assert.equal(pick(g,'weapon','main-hope'),false);for(const id of['power','haste','vitality','magnet'])assert.ok(pick(g,'passive',id));assert.equal(pick(g,'passive','near'),false);assert.equal(passiveCount(g),4)});
check('all weapons branch only when upgrading to five',()=>{for(const role of ROLES)for(const id of[role.main,...role.allowed]){const g=isolated(role.id);g.weapons[id]=2;assert.ok(pick(g,'weapon',id));assert.equal(g.weapons[id],3);assert.ok(pick(g,'weapon',id));assert.equal(g.weapons[id],4);assert.ok(pick(g,'weapon',id));assert.equal(g.status,'branch');const t=g.time;step(g,.05);assert.equal(g.time,t);assert.ok(choose(g,1));assert.equal(g.branches[id],'b');assert.equal(g.weapons[id],5)}});
check('reroll skip and exclusion budgets persist and do not leak forbidden gear',()=>{const g=isolated();offer(g,rng(3));const c=g.choices[0];assert.ok(ban(g,0,rng(4)));assert.equal(g.budget.ban,0);for(let i=0;i<30;i++){offer(g,rng(i));assert.ok(!g.choices.some(x=>x.kind===c.kind&&x.id===c.id))}for(let i=0;i<3;i++)assert.ok(reroll(g,rng(i)));assert.equal(reroll(g),false);for(let i=0;i<2;i++){offer(g);assert.ok(skip(g))}offer(g);assert.equal(skip(g),false);assert.deepEqual(restore(serialize(g)).budget,g.budget)});
check('all ten mains and both routes damage enemies',()=>{for(const role of ROLES)for(const branch of['a','b']){const g=isolated(role.id);g.weapons[role.main]=5;g.branches[role.main]=branch;target(g,150,-12);ticks(g,360);assert.ok(g.damage>0,role.id+':'+branch)}});
check('all twenty support items have functional damage healing or shielding',()=>{for(const[id,spec]of Object.entries(EQUIPMENT)){if(spec.kind!=='support')continue;const role=ROLES.find(r=>r.allowed.includes(id)),g=isolated(role.id);g.weapons[role.main]=0;g.weapons[id]=5;g.branches[id]='a';g.player.hp=50;target(g,spec.family==='orbit'?orbitSpec(g,id).r:150,-12);ticks(g,660);assert.ok(g.damage>0||g.player.hp>50||g.player.shield>0,id)}});
check('every active skill has an effect and cannot bypass its cooldown',()=>{for(const role of ROLES){const g=isolated(role.id);target(g,120,-12);g.player.hp=50;assert.ok(active(g),role.id);assert.equal(active(g),false);ticks(g,180);assert.ok(g.damage>0||g.player.hp>50||g.player.shield>0||g.roleState.activeUntil>g.time,role.id);assert.ok(g.activeCd>0)}});
check('long beam damages near middle and far end of visible segment',()=>{for(const x of[100,600,1230]){const g=isolated();g.weapons['main-dream']=0;g.weapons.prism=5;g.branches.prism='a';target(g,x,-43);step(g,.02);assert.ok(g.beams[0].length>=1250);assert.ok(g.damage>0,'beam x='+x)}});
check('swept projectiles hit between frames and orbit uses shared geometry',()=>{const g=isolated();g.weapons['main-dream']=0;target(g,0,-12);g.shots.push({x:-100,y:-24,vx:4000,vy:0,ttl:1,r:3,damage:100,source:'main-dream',kind:'star',pierce:1,bounces:0,hit:[],enemy:false});step(g,.05);assert.equal(g.damage,100);for(const branch of['a','b']){const o=isolated('night');o.weapons['main-night']=0;o.weapons.moonblade=3;o.branches.moonblade=branch;const s=orbitSpec(o,'moonblade'),a=.05*s.speed;target(o,Math.cos(a)*s.r,body(o.player).y+Math.sin(a)*s.r+12);step(o,.05);assert.ok(o.damage>0)}});
check('gentle reduces contact projectiles and map hazards by exactly35percent',()=>{for(const path of['contact','projectile','hazard']){const values=[];for(const difficulty of['normal','easy']){const g=isolated();g.difficulty=difficulty;g.weapons['main-dream']=0;if(path==='contact'){const e=target(g,0,-12);e.contact=10}if(path==='projectile')g.shots.push({x:-100,y:-24,vx:2000,vy:0,ttl:1,r:4,damage:10,enemy:true,hit:[]});if(path==='hazard')g.hazards.push({x:0,y:-24,r:50,delay:0,total:0,ttl:1,damage:10,kind:'crystal',tick:0});step(g,.05);values.push(100-g.player.hp)}assert.ok(Math.abs(values[1]/values[0]-.65)<1e-6,path)}});
check('map mechanics create five different hazard sets',()=>{const sets=[];for(const map of MAPS){const g=isolated();g.mapId=map.id;g.hazardAt=0;step(g,.01);assert.ok(g.hazards.length>0);sets.push(g.hazards.map(h=>h.kind).join(','))}assert.equal(new Set(sets).size,5)});
check('map objectives grant named materials and gate boss arrival',()=>{for(const map of MAPS){const g=isolated();g.mapId=map.id;g.time=map.duration;step(g,.01);assert.equal(g.bossSpawned,false);g.gems=Array.from({length:3},()=>({x:g.player.x,y:g.player.y,kind:'objective',value:0}));step(g,.01);assert.equal(g.objective.completed,3);assert.equal(g.materials[map.material.id],9);step(g,.01);assert.ok(g.bossSpawned);assert.equal(g.enemies.filter(e=>MONSTERS[e.species].boss).length,1)}});
check('every species spawns with expected behavior data and records species in death event',()=>{for(const spec of MONSTERS){const g=isolated();g.weapons['main-dream']=0;g.mapId=spec.mapId;const e=spawnMonster(g,spec.id,()=>.5,{x:200,y:0});assert.equal(e.species,spec.id);assert.ok(e.hp>0);e.hp=0;step(g,.01);assert.ok(g.events.some(x=>x.type==='kill'&&x.species===spec.id),spec.name)}});
check('ranged charge zone healer summon burrow split and boss behaviors execute',()=>{const exercise=(id,extra)=>{const g=isolated();g.weapons['main-dream']=0;g.mapId=MONSTERS[id].mapId;const e=spawnMonster(g,id,()=>.5,{x:220,y:0});e.attack=0;extra?.(g,e);step(g,.02);return{g,e}};assert.ok(exercise(2).g.shots.some(s=>s.enemy));assert.ok(exercise(7).e.chargeTime>0);assert.ok(exercise(8).g.hazards.length);const heal=exercise(9,(g)=>{const e=spawnMonster(g,6,()=>.5,{x:210,y:0});e.hp=1});assert.ok(heal.g.enemies.find(e=>e.species===6).hp>1);assert.ok(exercise(10).g.enemies.length>=3);assert.ok(exercise(16).e.burrow>0);assert.ok(exercise(20).g.hazards.length);assert.ok(exercise(4,(g,e)=>e.hp=0).g.enemies.every(e=>e.child));for(const id of[5,11,17,23,29]){const {g}=exercise(id);assert.ok(g.shots.length||g.hazards.length,'boss '+id)}});
check('equipment and trait upgrades consume correct materials and have finite cap',()=>{const p=defaultProfile();p.coins=1e5;for(const id in p.materials)p.materials[id]=1e5;const cost=upgradeCost(p,'main-dream');assert.equal(cost.damageBonus,.08);assert.equal(cost.materials.crystal,5);const before=p.coins;assert.ok(upgradeEquipment(p,'main-dream'));assert.equal(p.coins,before-cost.coins);assert.equal(p.equipment['main-dream'],1);for(let i=1;i<5;i++)assert.ok(upgradeEquipment(p,'main-dream'));assert.equal(upgradeEquipment(p,'main-dream'),false);for(let i=0;i<5;i++)assert.ok(upgradeTrait(p,'dream'));assert.equal(upgradeTrait(p,'dream'),false);const broke=defaultProfile();assert.equal(upgradeEquipment(broke,'main-dream'),false)});
check('equipment ranks really improve source damage and traits change innate potency',()=>{const a=isolated(),b=isolated();b.upgrades['main-dream']=5;target(a);target(b);ticks(a);ticks(b);assert.ok(b.damage>a.damage*1.35);const h=isolated('healing');h.traitLevel=5;h.player.hp=40;h.time=9.99;step(h,.02);assert.ok(h.player.hp>=47.5)});
check('terminal settlement is once only and retains map material and mastery provenance',()=>{const p=defaultProfile(),g=isolated();g.status='won';g.materials.crystal=12;g.coins=70;g.time=240;assert.ok(settle(p,g));assert.equal(p.materials.crystal,12);assert.equal(p.clears.cave,1);assert.ok(p.mastery.dream>0);const copy=structuredClone(p);assert.equal(settle(p,g),false);assert.deepEqual(p,copy);assert.equal(settle(p,isolated()),false)});
check('current saves preserve active attacks and pending branch',()=>{const g=isolated();g.weapons.prism=5;g.branches.prism='b';target(g);step(g,.01);g.weapons['main-dream']=4;pick(g,'weapon','main-dream');const restored=restore(serialize(g));assert.ok(restored);assert.deepEqual(restored,{...g,events:[]});assert.equal(restored.status,'branch');assert.ok(choose(restored,0));assert.equal(restore('{bad'),null);const invalid=structuredClone(g);invalid.weapons['main-hope']=1;assert.equal(restore(JSON.stringify(invalid)),null)});
check('dash movement and terminal death obey state boundaries',()=>{const a=isolated(),b=isolated();step(a,.05,{x:1});step(b,.05,{x:1,y:1});assert.ok(Math.abs(Math.hypot(a.player.x,a.player.y)-Math.hypot(b.player.x,b.player.y))<.001);assert.ok(dash(a,1,0));assert.equal(dash(a,1,0),false);a.player.hp=-1;step(a,.02);assert.equal(a.status,'lost');const time=a.time;step(a,.02);assert.equal(a.time,time)});
check('boss freeze resistance prevents permanent control while normal enemies still freeze',()=>{const g=isolated('sadness');g.weapons['main-sadness']=5;const boss=target(g,140,-12,5),normal=target(g,155,-12,0);let frozenFrames=0,normalFrozen=0;for(let i=0;i<360;i++){step(g,1/60);if(boss.frozen>0)frozenFrames++;if(normal.frozen>0)normalFrozen++;g.events=[]}assert.ok(normalFrozen>frozenFrames);assert.ok(frozenFrames<150,'boss cannot stay frozen most of the run');assert.ok(normalFrozen>0)});
check('frost death chain gives every defeated enemy its reward exactly once',()=>{const g=isolated();g.weapons['main-dream']=0;g.passives.shatter=3;const a=target(g,250,0),b=target(g,240,0),c=target(g,230,0);a.hp=20;a.frozen=1;b.hp=20;b.frozen=1;c.hp=0;c.frozen=1;step(g,.01);assert.equal(g.kills,3);assert.equal(g.gems.filter(x=>['xp','heart'].includes(x.kind)).length,3);assert.equal(g.enemies.length,0)});
check('defensive equipment permanent rank improves healing and shield amounts',()=>{const a=isolated('healing'),b=isolated('healing');for(const g of[a,b]){g.weapons['main-healing']=0;g.weapons.plush=1;g.player.hp=40}b.upgrades.plush=5;step(a,.01);step(b,.01);assert.ok(b.player.hp>a.player.hp);assert.equal(upgradeCost(defaultProfile(),'plush').statLabel,'回復與護盾')});
check('each support route changes actual geometry, attack count, damage or recovery',()=>{for(const[id,spec]of Object.entries(EQUIPMENT)){if(spec.kind!=='support')continue;const role=ROLES.find(r=>r.allowed.includes(id)),signatures=[];for(const branch of['a','b']){const g=isolated(role.id);g.weapons[role.main]=0;g.weapons[id]=5;g.branches[id]=branch;g.player.hp=40;for(let i=0;i<4;i++)target(g,150+i*65,-12);step(g,.02);signatures.push(JSON.stringify({shots:g.shots.map(s=>[s.damage,s.vx,s.vy,s.pierce]),fields:g.fields.map(f=>[f.r,f.damage,f.ttl]),echoes:g.echoes.map(e=>[e.r,e.damage,e.delay]),meteors:g.meteors.map(m=>[m.r,m.damage,m.delay]),beams:g.beams.map(b=>[b.angle,b.damage,b.rotate]),orbits:g.orbits.map(o=>[o.r,o.count,o.speed]),summons:g.summons.map(s=>s.guardian),damage:g.damage,hp:g.player.hp,shield:g.player.shield,cooldown:g.cooldowns[id]}))}assert.notEqual(signatures[0],signatures[1],id)}});
console.log(count+' expedition checks passed');

check('difficulty clears unlock the next tier on the same map and award rare materials',()=>{
  const profile=defaultProfile();
  for(const [difficulty,next,reward] of [
    ['normal','hard',null],['hard','hell','challengeShard'],
    ['hell','inferno','hellEmber'],['inferno',null,'infernoCore']
  ]){
    if(next) assert.equal(profile.difficultyClears.cave[next],0);
    const run=createExpedition({mapId:'cave',difficulty,profile});
    assert.equal(run.difficulty,difficulty);
    run.status='won';
    run.materials.crystal=10;
    const previous=reward?profile.materials[reward]:0;
    assert.ok(settle(profile,run));
    assert.equal(profile.difficultyClears.cave[difficulty],1);
    assert.equal(profile.difficultyClears.forest[difficulty],0);
    if(reward) assert.ok(profile.materials[reward]>previous);
  }
});

check('magnet pickup and boss victory collect remote loot without collecting remote objectives',()=>{
  for(const victory of [false,true]){
    const run=isolated();
    run.gems.push(
      {x:700,y:350,kind:'xp',value:4},
      {x:700,y:350,kind:'material',material:'crystal',value:7},
      {x:700,y:350,kind:'chest',value:3},
      {x:700,y:350,kind:'objective',value:0}
    );
    if(victory){
      const boss=target(run,700,350,5);
      boss.hp=0;
      run.bossSpawned=true;
    }else run.gems.push({x:run.player.x,y:run.player.y,kind:'magnet',value:0});
    step(run,1/60,{},()=>.5);
    assert.deepEqual(run.gems.map(gem=>gem.kind),['objective']);
    assert.equal(run.materials.crystal,victory?19:7);
    assert.ok(run.player.xp>=7);
    assert.equal(run.status,victory?'won':'playing');
    assert.equal(run.events.filter(event=>event.type==='magnet').length,1);
  }
});

check('beam immediately hits new targets within its visible width and reach',()=>{
  const run=isolated();
  run.weapons['main-dream']=0;
  const makeTarget=(x,y)=>target(run,x,y);
  const near=makeTarget(100,-12),far=makeTarget(490,-12),outside=makeTarget(560,-12),side=makeTarget(250,100);
  run.beams.push({x:0,y:-24,angle:0,length:500,width:20,ttl:1,damage:20,kind:'lance',source:'main-dream'});
  step(run,1/60,{},()=>.5);
  assert.ok(near.hp<near.maxHp&&far.hp<far.maxHp);
  assert.equal(outside.hp,outside.maxHp);
  assert.equal(side.hp,side.maxHp);
  const health=near.hp,late=makeTarget(300,-12);
  step(run,1/60,{},()=>.5);
  assert.ok(late.hp<late.maxHp);
  assert.equal(near.hp,health);
});

check('terminal chest rewards survive reload and settle once',()=>{
  const run=isolated();
  run.gems.push({x:run.player.x,y:run.player.y,kind:'chest',value:3});
  step(run,1/60,{},()=>.5);
  assert.equal(run.chests,1);
  assert.equal(run.player.xp,3);
  run.status='lost';
  const recovered=restore(serialize(run));
  assert.ok(recovered);
  assert.equal(summary(recovered).chestCoins,4);
  assert.equal(summary(recovered).materials.crystal,2);
  const profile=defaultProfile();
  assert.ok(settle(profile,recovered));
  assert.equal(settle(profile,recovered),false);
  assert.equal(profile.coins,4);
  assert.equal(profile.materials.crystal,2);
});

check('independent summon equipment retains counts, branches and save identity',()=>{
 const g=isolated('growth');g.weapons['main-growth']=2;g.weapons.seed=2;
 step(g,.02);assert.equal(g.summons.length,6);
 for(const source of ['main-growth','seed'])assert.equal(g.summons.filter(s=>s.source===source).length,3);
 const saved=restore(serialize(g));step(saved,.02);assert.equal(saved.summons.length,6);
 g.weapons.seed=5;g.branches.seed='b';step(g,.02);
 assert.equal(g.summons.filter(s=>s.source==='seed').length,1);
 assert.equal(g.summons.filter(s=>s.source==='main-growth').length,3);
});
check('every role keeps main and compatible support attack sources independent',()=>{
 for(const role of ROLES)for(const support of role.allowed){
  const g=isolated(role.id);g.weapons[role.main]=2;g.weapons[support]=2;
  target(g,120,-12);const sources=new Set();
  for(let i=0;i<720;i++){
   step(g,1/60,{},rng(i));
   for(const event of g.events)if(event.type==='hit')sources.add(event.source);
   for(const group of ['shots','fields','beams','summons','orbits','echoes','meteors'])for(const effect of g[group])sources.add(effect.source||effect.id);
   g.events=[];
  }
  assert.ok(sources.has(role.main),role.id+' main with '+support);
  if(!['ward','plush'].includes(support))assert.ok(sources.has(support),role.id+' support '+support);
 }
});
