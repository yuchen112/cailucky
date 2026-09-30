import assert from 'node:assert/strict';
import {actorMotion,projectilePose,SPELL_ART} from '../games/fairytale-defense/rebuild/motion.mjs';
const s={time:1.1,events:[{type:'anticipate',time:1,pad:0}]};
assert(actorMotion(s,{pad:0}).angle<0);assert.equal(actorMotion(s,{pad:1}).angle,0);assert.equal(actorMotion(s,{hero:true}).angle,0);assert.equal(actorMotion(s,{pad:0},true).angle,0);
const before=JSON.stringify(s);assert.deepEqual(actorMotion(s,{pad:0}),actorMotion(s,{pad:0}));assert.equal(JSON.stringify(s),before);
const shot={from:{x:10,y:30},born:0,arriveAt:1,kind:'spore'};assert.equal(projectilePose(shot,{x:100,y:100},1).x,100);assert.equal(projectilePose(shot,{x:100,y:100},0).x,10);assert.equal(projectilePose(shot,{x:100,y:100},.5,true).y,50);assert.equal(Object.keys(SPELL_ART).length,10);
console.log('PASS: actor event isolation, reduced motion, immutable timing and projectile endpoint.');
