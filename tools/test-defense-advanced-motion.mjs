import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ADVANCED_MOTION_IDS,advancedMotionAssets,advancedMotionArt,hasAdvancedMotion} from '../games/fairytale-defense/rebuild/advanced-motion.mjs';
import {unitArt} from '../games/fairytale-defense/rebuild/unit-presentation.mjs';
import {spritePlacement} from '../games/fairytale-defense/rebuild/sprite-placement.mjs';
import {UNITS} from '../games/fairytale-defense/rebuild/army.mjs';
import {statsFor} from '../games/fairytale-defense/rebuild/progression.mjs';
import {ADVANCED_MOTION_LAYOUT} from '../games/fairytale-defense/rebuild/advanced-motion-layout.mjs';
const root=new URL('../games/fairytale-defense/rebuild/',import.meta.url);
for(const id of ADVANCED_MOTION_IDS){
 assert(hasAdvancedMotion(id));
 assert.equal(advancedMotionArt(id,'idle'),id);
 assert.equal(advancedMotionArt(id,'windup'),id+'-ready');
 assert.equal(advancedMotionArt(id,'release'),id+'-release');
 assert.equal(advancedMotionArt(id,'recover'),id+'-release');
 for(const frame of advancedMotionAssets(id)){
  assert(fs.existsSync(new URL('art/'+frame+'.webp',root)),frame+' missing');
  const layout=ADVANCED_MOTION_LAYOUT[frame];assert(layout,frame+' missing foot anchor');
  const p=spritePlacement(frame,{width:512,height:512},72);assert(Math.abs(p.y+p.height*layout.anchorY)<1e-8);assert(Math.abs(p.height*layout.visibleHeight-72)<1e-8);
  assert(layout.anchorX>0&&layout.anchorX<1);assert(layout.anchorY>0&&layout.anchorY<=1);assert(layout.visibleHeight>.1&&layout.visibleHeight<=1);
 }
}
assert.equal(unitArt({role:'archer',branch:'rapid',level:10}),'unit-archer-rapid-10');
assert.equal(unitArt({role:'archer',branch:'heavy',level:10}),'unit-archer-heavy-5');
assert(!hasAdvancedMotion('unit-archer-heavy-4'));
for(const level of [5,6,7,8,9,10])assert.equal(statsFor(UNITS.artisan,{role:'artisan',branch:'haste',level}).heal,2);
console.log('PASS exact advanced identity poses, available files/foot anchors, honest unmade tier fallback and retained Lv5 repair bonus.');
