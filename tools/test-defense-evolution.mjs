import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {createBattle,deploy,upgrade,towerStats,UNIT_BRANCHES} from '../games/fairytale-defense/rebuild/core.mjs';
import {captureCheckpoint,restoreCheckpoint} from '../games/fairytale-defense/rebuild/checkpoint.mjs';
import {unitArt,EVOLUTION_ART,branchGuide} from '../games/fairytale-defense/rebuild/unit-presentation.mjs';
assert.equal(EVOLUTION_ART.length,24);assert.equal(new Set(EVOLUTION_ART).size,24);
for(const role of ['archer','cannon','frost','firefly'])for(const branch of UNIT_BRANCHES[role]){
 const s=createBattle({hero:'growth'});s.gold=5000;assert(deploy(s,0,role));assert(upgrade(s,0));
 const base=towerStats(s.towers[0],s);assert(upgrade(s,0,branch.id));assert(branchGuide(role,branch.id));
 for(const level of [3,4,5]){const t=s.towers[0];assert.equal(t.level,level);assert.equal(unitArt(t),`unit-${role}-${branch.id}-${level}`);assert(towerStats(t,s).damage>base.damage);assert.equal(unitArt(restoreCheckpoint(captureCheckpoint(s)).towers[0]),unitArt(t));if(level<5)assert(upgrade(s,0));}
 while(s.towers[0].level<10){assert(upgrade(s,0));assert.equal(unitArt(s.towers[0]),`unit-${role}-${branch.id}-5`);}assert(!upgrade(s,0));
}
const manifest=JSON.parse(readFileSync(new URL('../games/fairytale-defense/rebuild/evolution-art-manifest.json',import.meta.url)));
assert.equal(manifest.jobs.length,24);assert.equal(new Set(manifest.jobs.map(j=>j.source)).size,24);
for(const id of EVOLUTION_ART)assert(existsSync(new URL(`../games/fairytale-defense/rebuild/art/${id}.webp`,import.meta.url)),id);
console.log('PASS: 24 independent evolution assets, eight branches, five levels, saved identity and level cap.');
