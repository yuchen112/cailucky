import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ART,THEMES,VERSION,emptySave,validateSave,complete,chooseArt} from '../src/core.mjs';

const oldSource=execFileSync('git',['show','f32a9a63:games/picture-realm/src/core.mjs'],{encoding:'utf8'});
const old=await import('data:text/javascript;base64,'+Buffer.from(oldSource).toString('base64'));
assert.equal(ART.length,120);
assert.equal(new Set(ART.map(a=>a.id)).size,120);
assert.deepEqual(ART.slice(0,30),old.ART);
assert.equal(VERSION,old.VERSION);
for(const theme of THEMES)assert.equal(ART.filter(a=>a.theme===theme).length,20);
const legacy=old.emptySave();
for(const a of old.ART)legacy.unlocked[a.id]={at:123};
legacy.records['30:slide:3']={time:92,moves:76,wins:2};legacy.last='30';
const restored=validateSave(legacy);
assert.deepEqual(restored.unlocked,legacy.unlocked);
assert.deepEqual(restored.records,legacy.records);
assert.equal(restored.last,'30');
for(const id of ['31','99','100','120']){
 const s=emptySave(),g={artId:id,mode:'slide',level:0,elapsed:40,moves:3,board:[0,1,2,3,4,5,6,8,7]};
 s.active=g;
 assert.equal(validateSave(s).active.artId,id);
 assert.equal(complete(s,g,321),true);
 const copy=validateSave(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(copy.unlocked[id],{at:321});
 assert.equal(copy.records[id+':slide:0'].time,40);
 assert.equal(copy.last,id);
 assert.equal(copy.active,null);
}
const oneMissing=Object.fromEntries(ART.filter(a=>a.id!=='120').map(a=>[a.id,{at:1}]));
assert.equal(chooseArt(oneMissing,'119',()=>0).id,'120');
assert.notEqual(chooseArt(Object.fromEntries(ART.map(a=>[a.id,{at:1}])),'120',()=>.999).id,'120');
const bad=emptySave();bad.records={'121:slide:0':{time:1,moves:1},'001:slide:0':{time:1,moves:1}};
assert.deepEqual(validateSave(bad).records,{});
console.log('Gallery: 120 entries, 6 x 20 themes, legacy collection and new three-digit records passed.');
