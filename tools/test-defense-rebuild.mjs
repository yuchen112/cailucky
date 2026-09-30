import assert from 'node:assert/strict';
import {WORLD,PATH_LENGTH,PADS,ROLES,createBattle,deploy,upgrade,sell,startWave,advance,pointAt,newProfile,validateProfile,recordResult,chooseBlessing} from '../games/fairytale-defense/rebuild/core.mjs';
const run=(s,n)=>{for(let i=0;i<n*60;i++)advance(s,1/60);};
assert.equal(Object.keys(ROLES).length,10);assert.equal(PADS.length,9);
assert.deepEqual(pointAt(-1),{x:197,y:0});assert.deepEqual(pointAt(PATH_LENGTH+100),{x:198,y:585});
for(let d=0;d<PATH_LENGTH;d+=3){const p=pointAt(d);assert(p.x>=0&&p.x<=WORLD.width&&p.y>=0&&p.y<=WORLD.height);}
const s=createBattle();assert(!startWave(s));assert(deploy(s,0,'growth'));assert(!deploy(s,0,'dream'));assert(!deploy(s,1,'growth'));assert(!deploy(s,-1,'dream'));assert(!deploy(s,1,'__proto__'));
assert(upgrade(s,0));assert.equal(s.gold,180);assert(sell(s,0));assert.equal(s.gold,306);assert(!sell(s,0));
assert(deploy(s,0,'growth'));assert(startWave(s));assert(!startWave(s));
s.paused=true;const snapshot=JSON.stringify(s);run(s,1);assert.equal(JSON.stringify(s),snapshot);assert(!sell(s,0));s.paused=false;
run(s,5);assert(s.events.some(e=>e.type==='hit'));assert(s.kills>0);
const a=createBattle(),b=createBattle();for(const x of [a,b]){deploy(x,0,'growth');startWave(x);}for(let i=0;i<600;i++)advance(a,1/60);for(let i=0;i<1200;i++)advance(b,1/120);assert.deepEqual(a,b);
const anticipated=createBattle();deploy(anticipated,0,'growth');startWave(anticipated);
while(!anticipated.pending.length)advance(anticipated,1/60);
assert.equal(anticipated.shots.length,0);const hp=anticipated.enemies[0].hp;run(anticipated,.15);assert.equal(anticipated.enemies[0].hp,hp,'no damage before release');
assert(sell(anticipated,0));run(anticipated,1);assert.equal(anticipated.enemies[0].hp,hp,'no ghost attack after selling');
const leaked=createBattle();deploy(leaked,0,'growth');startWave(leaked);leaked.queue=[];leaked.towers=[];leaked.hp=1;leaked.enemies=[{id:100,kind:'walker',hp:10,distance:PATH_LENGTH-1,speed:100,slow:1,slowUntil:0,leak:1}];run(leaked,.1);assert.equal(leaked.phase,'defeat');assert.equal(leaked.hp,0);const frozen=leaked.time;run(leaked,5);assert.equal(leaked.time,frozen);
const won=createBattle();deploy(won,0,'healing');won.hp=16;won.wave=5;startWave(won);won.queue=[];run(won,.1);assert.equal(won.phase,'victory');assert.equal(won.hp,17);assert.equal(recordResult(newProfile(),won).unlockedStage,2);assert(!startWave(won));
const endless=createBattle({mode:'endless'});deploy(endless,0,'joy');endless.wave=5;startWave(endless);endless.queue=[];run(endless,.1);assert.equal(endless.phase,'intermission');assert(!startWave(endless));assert(chooseBlessing(endless,'power'));assert(startWave(endless));
assert.deepEqual(validateProfile(JSON.parse(JSON.stringify(newProfile()))),newProfile());
for(const bad of [null,{}, {...newProfile(),version:9},{...newProfile(),formation:[{pad:0,role:'x'}]},{...newProfile(),formation:[{pad:0,role:'growth'},{pad:1,role:'growth'}]},{...newProfile(),bestEndless:Infinity}])assert.throws(()=>validateProfile(bad));
assert.throws(()=>advance(s,NaN));assert.throws(()=>advance(s,-1));assert.throws(()=>createBattle({stage:0}));
// Controlled impacts exercise armor, splash, slow expiration and duplicate rewards.
function impactBattle(shot){const t=createBattle();t.phase='battle';t.queue=[{at:999,kind:'walker'}];t.enemies=[0,1,2].map(i=>({id:100+i,kind:'armored',hp:100,maxHp:100,distance:100+i*10,speed:0,armor:.5,reward:20,leak:2,slow:1,slowUntil:0}));t.shots=[{targetId:100,arriveAt:0,damage:40,splash:0,pierce:false,slow:0,kind:'seed',...shot}];return t;}
const armored=impactBattle({});advance(armored,1/60);assert.equal(armored.enemies[0].hp,80);
const pierced=impactBattle({pierce:true,splash:30,slow:.48});advance(pierced,1/60);assert(pierced.enemies.every(e=>e.hp===60&&e.slow===.48));run(pierced,2.1);assert(pierced.enemies.every(e=>e.slow===1));
const simultaneous=impactBattle({damage:1000,splash:30});simultaneous.shots.push({...simultaneous.shots[0]});advance(simultaneous,1/60);assert.equal(simultaneous.kills,3);assert.equal(simultaneous.gold,420);assert.equal(simultaneous.enemies.length,0);
console.log('Defense rebuild: geometry, 10 identities, economy, deterministic timing, pause, attack release, cancel, leak, victory, endless and save validation passed.');
