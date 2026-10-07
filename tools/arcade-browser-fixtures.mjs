import fs from 'node:fs';
import {createMatch,step,snapshot} from '../games/heartlight-duel/arcade/core.mjs';
import {makeJourney,journeyOptions} from '../games/heartlight-duel/arcade/cast.mjs';
import {storage,pack} from '../games/heartlight-duel/arcade/save.mjs';
const dir='outputs/heartlight-arcade-tests';fs.mkdirSync(dir,{recursive:true});globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
function save(name,m,run=null){const s=storage().get();s.active=snapshot(m);s.run=run;fs.writeFileSync(dir+'/'+name+'.json',pack(s));}
for(const index of [1,4]){const run=makeJourney('story','growth');run.index=index;run.wins=index;const m=createMatch(journeyOptions(run));m.phase='fight';m.wins=[1,0];m.fighters[1].hp=0;step(m);save(index===4?'story-ending':'story-continue',m,run);}
const run=makeJourney('survival','growth');run.index=4;run.wins=4;const survival=createMatch(journeyOptions(run));survival.phase='fight';survival.fighters[0].hp=500;survival.fighters[1].hp=0;step(survival);save('survival-continue',survival,run);
const local=createMatch({mode:'local',p1:'growth',p2:'trust',stage:'moon',seed:123});local.phase='fight';local.fighters[0].x=555;local.fighters[1].x=725;local.fighters.forEach(f=>f.meter=100);save('local-controls',local);
const training=createMatch({mode:'training',p1:'growth',p2:'luck',stage:'festival'});training.phase='fight';training.fighters[0].x=555;training.fighters[1].x=725;training.fighters.forEach(f=>f.meter=100);save('training',training);
const old=storage().get();old.active={...snapshot(local),version:1};old.active.fighters[0].hp=777;old.active.fighters[0].meter=42;old.story.sadness={cleared:3,completed:false};fs.writeFileSync(dir+'/legacy-progress.json',pack(old));
fs.writeFileSync(dir+'/corrupt.json','{"format":"CxQ-HeartlightDuel","checksum":"wrong","payload":"{}"}');
console.log('Created seven isolated browser fixture backups');
