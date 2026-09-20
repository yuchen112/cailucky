const assert=require('node:assert/strict'),{advance}=require('../games/magic-bubble/endless-core.js');
const original=Array.from({length:10},(_,r)=>Array.from({length:9},(_,c)=>r<3?(r+c)%3:-1));
const before=JSON.stringify(original);
for(const turn of [0,8,12,24,32,100]){
 const result=advance(original,turn);assert.equal(result.grid.length,10);assert(result.grid.every(r=>r.length===9));
 assert.equal(result.grid[0].filter(v=>v>=0).length,Math.min(9,5+Math.floor(turn/8)));
 assert(result.grid[0].every(v=>v<Math.min(6,3+Math.floor(turn/12))));
 assert.deepEqual(result.grid.slice(1),original.slice(0,9));assert.equal(result.overflow,false);
 // Flipping stagger parity preserves each existing bubble's X coordinate after descent.
 for(let r=0;r<9;r++)for(const offset of [0,1])assert.equal((r+offset)%2,(r+1+1-offset)%2);
}
assert.equal(JSON.stringify(original),before);original[9][0]=1;assert.equal(advance(original,0).overflow,true);
assert.equal(advance(Array.from({length:10},()=>Array(9).fill(-1)),0).grid[0].filter(v=>v>=0).length,5);
console.log('Bubble endless: progression, row shift, immutability, empty board, overflow and stagger parity passed');
