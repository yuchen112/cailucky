import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createBattle,pointAt,startWave,advance,deploy,PATH_LENGTH} from '../games/fairytale-defense/rebuild/core.mjs';
import {routePads,routeLength,commandPoints,alignCommander} from '../games/fairytale-defense/rebuild/routes.mjs';
const require=createRequire(import.meta.url),sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
for(const [stage,id] of [[1,'road'],[6,'road-moon'],[11,'road-dawn']]){
 const s=createBattle({hero:'growth',stage});alignCommander(s);
 const {data,info}=await sharp(`games/fairytale-defense/rebuild/art/${id}.webp`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const sample=p=>{const x=Math.max(0,Math.min(info.width-1,Math.round(p.x/390*info.width))),y=Math.max(0,Math.min(info.height-1,Math.round(p.y/585*info.height)));return [...data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4)];};
 const bad=[];
 for(let route=0;route<(stage===6?2:1);route++)for(let d=8;d<(routeLength(s,route)||PATH_LENGTH)-8;d+=4){const p=pointAt(d,s,route),[r,g,b,a]=sample(p);if(a<240||r<140||g<125||b<90)bad.push({route,d,p,rgba:[r,g,b,a]});}
 assert.equal(bad.length,0,`${id} route leaves stone: ${JSON.stringify(bad.slice(0,10))}`);
 for(const p of [...routePads(s),...commandPoints(s)])assert(sample(p)[3]<240,`${id} placement on road ${JSON.stringify(p)}`);
 assert(commandPoints(s).some(p=>p.x===s.hero.x&&p.y===s.hero.y));
 for(const p of commandPoints(s)){Object.assign(s.hero,p);alignCommander(s);assert.equal(s.hero.x,p.x);assert.equal(s.hero.y,p.y);}
 deploy(s,0,'archer');startWave(s);for(let i=0;i<12;i++)advance(s,.25);if(stage===6)assert(new Set(s.enemies.map(e=>e.route)).size===2);
 console.log('PASS',id,'stone route, off-road pads/commander and route assignment');
}
