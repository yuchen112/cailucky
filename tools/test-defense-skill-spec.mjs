import assert from 'node:assert/strict';
import {createBattle,deploy,castHero,ROLES,enemyStats,advance,startWave} from '../games/fairytale-defense/rebuild/core.mjs';
import {skillSpec} from '../games/fairytale-defense/rebuild/skill-spec.mjs';
import {HERO_SPECIALIZATIONS} from '../games/fairytale-defense/rebuild/hero-rules.mjs';
import {supportFor,supportRadius} from '../games/fairytale-defense/rebuild/hero-rules.mjs';
import {routePads} from '../games/fairytale-defense/rebuild/routes.mjs';
for(const role of Object.keys(ROLES))for(const specialization of [null,...HERO_SPECIALIZATIONS[role].map(v=>v.id)])for(const active of [null,'swift','lasting']){
 const s=createBattle({hero:role,masteryXp:10000,specialization,talents:{active}});deploy(s,0,'archer');s.phase='battle';s.hp=10;s.hero.echo=30;s.enemies=[{id:99,hp:1000,distance:180,kind:'walker'}];const q=skillSpec(s.hero,ROLES[role]);assert(q.description&&q.geometry&&q.use);assert(castHero(s));assert.equal(s.hero.skillReady,q.cooldown);
 if(q.scope==='enemy'){const shot=s.shots[0];for(const k of ['damage','splash','pierce','slow','slowDuration','root'])assert.equal(shot[k],q[k],`${role} ${k}`);}
 if(role==='growth')assert.equal(s.towers[0].heroPowerUntil,q.duration);if(role==='trust'){assert.equal(s.towers[0].trustUntil,q.duration);assert.equal(s.shield,q.shield);}if(role==='joy')assert.equal(s.hero.hasteUntil,q.duration);if(role==='luck')assert.equal(s.towers[0].luckyCharges,q.charges);if(role==='healing'){assert.equal(s.hp,13);assert.equal(s.shield,q.shield);}
}
for(const role of ['growth','luck','joy','dream','night','sadness','memory','hope']){const s=createBattle({hero:role});s.phase='battle';assert(!castHero(s));assert.equal(s.hero.skillReady,0);}
for(const stage of [1,6,11]){const s=createBattle({hero:'growth',stage});deploy(s,0,'archer');startWave(s);advance(s,1/60);const e=s.enemies[0],q=enemyStats(e.kind,s);assert.equal(e.maxHp,q.hp);assert.equal(e.speed,q.speed);}
for(const role of ['growth','luck','trust'])for(const offset of [0,.01]){
 const s=createBattle({hero:role});deploy(s,0,'archer');const p=routePads(s)[0],r=skillSpec(s.hero,ROLES[role]).radius;
 s.hero.x=p.x-r-offset;s.hero.y=p.y;s.phase='battle';const cast=castHero(s),t=s.towers[0];
 if(offset===0){assert(cast);assert(t.heroPowerUntil>0||t.trustUntil>0||t.luckyCharges>0);}
 else{assert(cast);assert(t.heroPowerUntil>0||t.trustUntil>0||t.luckyCharges>0);}
}
for(const offset of [0,.01]){const s=createBattle({hero:'growth'});deploy(s,0,'archer');const pads=routePads(s);s.hero.x=pads[0].x-supportRadius(s.hero)-offset;s.hero.y=pads[0].y;assert.equal(supportFor(s,s.towers[0],pads).damage,1.04);}
console.log('PASS all 90 skill builds; global support remains active at all commander positions; no-target no cooldown; enemy guide stats equal spawn.');
