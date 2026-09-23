import test from 'node:test';
import assert from 'node:assert/strict';
import {handLayout} from '../presentation.mjs';
test('all hand cards stay within mobile widths, including 26-card stress case',()=>{
 for(const width of [220,320,420,520,690,1000])for(let count=1;count<=26;count++){
  const l=handLayout(width,count,72,108);
  assert.equal(l.positions.length,count);
  for(const p of l.positions){
   assert.ok(p.x>=0);assert.ok(p.x+p.width<=width+0.001);
   assert.ok(p.y>=16);assert.ok(p.y+108<=l.height);
  }
 }
});
test('normal 13-card phone hand is a single readable row',()=>{
 const l=handLayout(500,13,60,90);
 assert.ok(l.positions.every(p=>p.y===20));
 assert.ok(l.positions[1].x-l.positions[0].x>=28);
 assert.equal(l.positions[12].width,60);
});
