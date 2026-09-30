import assert from 'node:assert/strict';
import {createBattle,deploy,castHero,advance,PADS} from '../games/fairytale-defense/rebuild/core.mjs';
import {HERO_SPECIALIZATIONS,heroBuild,supportFor} from '../games/fairytale-defense/rebuild/hero-rules.mjs';
import {captureCheckpoint,restoreCheckpoint} from '../games/fairytale-defense/rebuild/checkpoint.mjs';
function battle(role,specialization=null){const s=createBattle({hero:role,masteryXp:specialization?160:0,specialization});s.gold=1000;deploy(s,0,'archer');deploy(s,1,'cannon');deploy(s,8,'archer');s.phase='battle';s.hero.ready=999;s.queue=[{at:999,kind:'walker'}];s.enemies=[{id:99,kind:'walker',distance:180,hp:1000,maxHp:1000,armor:0,slow:1,speed:0,reward:12}];return s;}
for(const [role,branches] of Object.entries(HERO_SPECIALIZATIONS)){
 assert.throws(()=>heroBuild(role,0,branches[0].id));assert.throws(()=>heroBuild(role,160,'invalid'));
 for(const branch of branches){const s=battle(role,branch.id);s.phase='planning';assert.deepEqual(captureCheckpoint(restoreCheckpoint(captureCheckpoint(s))),captureCheckpoint(s));s.phase='battle';assert(castHero(s));assert(!castHero(s));}
}
const growth=battle('growth');assert(castHero(growth));assert(growth.towers[0].heroPowerUntil>0);assert(!growth.towers[2].heroPowerUntil);assert(supportFor(growth,growth.towers[0],PADS).damage>1.3);
const trust=battle('trust');assert(castHero(trust));assert.equal(trust.shield,2);assert(trust.towers[0].trustUntil>0);assert(!trust.towers[0].heroPowerUntil);assert.equal(supportFor(trust,trust.towers[0],PADS).damage,1.04);
const luck=battle('luck');const gold=luck.gold;castHero(luck);assert.equal(luck.gold,gold);assert.equal(luck.towers[0].luckyCharges,3);assert(!luck.towers[2].luckyCharges);advance(luck,.1);assert.equal(luck.towers[0].luckyCharges,3,'tower not ready until .2');advance(luck,.15);assert.equal(luck.towers[0].luckyCharges,2);
const memory=battle('memory');memory.shots=[{targetId:99,damage:100,arriveAt:0,kind:'bolt'}];advance(memory,1/60);assert.equal(memory.hero.echo,25);assert(castHero(memory));assert.equal(memory.hero.echo,0);assert.equal(memory.shots.find(s=>s.hero).damage,67);
const dream=battle('dream','mark');dream.shots=[{hero:true,targetId:99,damage:10,arriveAt:0,kind:'star'}];advance(dream,1/60);assert(dream.enemies[0].dreamUntil>0);dream.shots=[{targetId:99,damage:10,arriveAt:0,kind:'bolt'}];advance(dream,1/60);assert.equal(dream.enemies[0].hp,960);assert.equal(dream.enemies[0].dreamUntil,0);
const sadness=battle('sadness','still');sadness.towers=[];sadness.enemies[0].kind='boss';castHero(sadness);for(let i=0;i<3;i++)advance(sadness,.25);assert(sadness.enemies[0].rootUntil-sadness.time<.22);assert(sadness.enemies[0].rootImmuneUntil>sadness.time);
const healing=battle('healing','restore');healing.hp=10;healing.queue=[];healing.enemies=[];advance(healing,1/60);assert.equal(healing.hp,12);assert.equal(healing.phase,'intermission');
const joy=battle('joy','rhythm');joy.towers[0].attacks=10000;assert.equal(supportFor(joy,joy.towers[0],PADS).interval,.8);
console.log('PASS: 20 level-gated hero choices, checkpoint preservation, local buffs, distinct trust/luck effects, finite crit charges, actual-damage echo, consumable dream marks, boss root resistance, healing and haste cap.');
