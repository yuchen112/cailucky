import './test-defense-collection.mjs';
import assert from 'node:assert/strict';
import {newCollection,validateCollection,recruit,drawOdds} from '../games/fairytale-defense/rebuild/recruitment.mjs';
const c=newCollection();
for(const patch of [{coins:-1},{coins:NaN},{points:-1},{sinceRare:10},{sinceEpic:30},{sinceLegendary:80},{owned:['fake']},{training:{}},{history:[{number:1,unit:'archer',grade:'legendary',duplicate:true}]}])assert.throws(()=>validateCollection({...c,...patch}));
assert.throws(()=>recruit(c,()=>Infinity));
assert.throws(()=>recruit(c,()=>-1));
assert.deepEqual(drawOdds(c),[70,23,6,1]);
console.log('PASS collection validation and invalid RNG guards.');

