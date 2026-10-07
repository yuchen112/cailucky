import fs from 'node:fs';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import {ROLES} from '../games/lucky-town/data.mjs?v=20261007-names1';
import {fresh,pack,unpack} from '../games/lucky-town/store.mjs?v=20261007-names1';
import {ROLES as heroes} from '../games/fairytale-defense/rebuild/core.mjs?v=20261007-names1';
import {ROLES as poker} from '../games/poker/rules.mjs?v=20261007-names1';
fs.mkdirSync('outputs',{recursive:true});
const cast=[['joy','快樂','朵莉'],['dream','夢想','露緹'],['night','夜晚陪伴','米洛'],['sadness','悲傷','汐寧'],['trust','信任','伯恩'],['memory','回憶','緹雅'],['growth','成長','森芽'],['healing','療癒','糯糯'],['luck','幸運','鈴可'],['hope','希望','曦羽']];
const s=fresh();s.coins=654321;s.rooms.joy.name='快樂的小屋';s.rooms.dream.name='我的夢想小屋';s.rooms.sadness.name='悲傷的小屋';s.layouts.sadness=[{name:'收藏配置',room:structuredClone(s.rooms.sadness)}];
const restored=unpack(pack(s));assert.equal(restored.coins,654321);assert.equal(restored.rooms.joy.name,'朵莉的小屋');assert.equal(restored.rooms.sadness.name,'汐寧的小屋');assert.equal(restored.rooms.dream.name,'我的夢想小屋');assert.equal(restored.layouts.sadness[0].room.name,'汐寧的小屋');assert.equal(restored.role,s.role);
for(const[id,word,name]of cast){assert.equal(ROLES.find(r=>r.id===id).name,name);assert.equal(ROLES.find(r=>r.id===id).representative,word);assert.equal(heroes[id].name,name);assert.equal(poker.find(r=>r[0]===id)[1],name);}
const bundle=fs.readFileSync('games/fairytale-defense/rebuild/army-bundle.mjs','utf8').replace(/\\u([a-f\d]{4})/gi,(_,n)=>String.fromCharCode(parseInt(n,16)));for(const[id,,name]of cast)assert.ok(bundle.includes(id+':{name:"'+name+'"'));
const files=cp.execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(f=>/^(games|assets)\//.test(f)&&/\.m?js$/.test(f));for(const file of files)cp.execFileSync(process.execPath,['--check',file]);
const html=cp.execFileSync('git',['ls-files','games'],{encoding:'utf8'}).trim().split('\n').filter(f=>f.endsWith('.html'));let count=0;
for(const file of html)for(const match of fs.readFileSync(file,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/src=|application\/ld\+json/.test(match[1])||!match[2].trim())continue;const tmp='outputs/inline-name-check.'+(/type=["']module/.test(match[1])?'mjs':'cjs');fs.writeFileSync(tmp,match[2]);try{cp.execFileSync(process.execPath,['--check',tmp]);count++}catch(e){throw Error(file+': '+e.message)}}
console.log(`PASS: ten identities consistent across website games, old/default room labels migrated, custom names and balances preserved; ${files.length} scripts and ${count} inline scripts parse.`);
