const assert=require('node:assert/strict'),R=require('../games/dream-match/match-core.js');
const base=()=>Array.from({length:49},(_,i)=>(i%7+Math.floor(i/7)*2)%6);
let a=base();assert.equal(R.match(a).size,0);
a[0]=a[1]=a[2]=a[3]=5;assert.equal(R.specials(a,{},[2])[2],'row');
a[4]=5;assert.equal(R.specials(a,{},[2])[2],'prism');
a=base();for(let r=0;r<4;r++)a[r*7]=5;assert.equal(R.specials(a,{},[14])[14],'column');
a=base();const expanded=R.expand(a,{0:'row',3:'column'},new Set([0]));assert.equal(expanded.size,13);assert(expanded.has(45));
assert.deepEqual(R.move(base(),{0:'prism'}),[0,1]);
for(let k=0;k<100;k++){a=Array.from({length:49},()=>Math.floor(Math.random()*6));const before=[...a];R.move(a);assert.deepEqual(a,before);}
console.log('Dream rules: 106 assertions passed');
