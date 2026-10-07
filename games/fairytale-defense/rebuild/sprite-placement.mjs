import {ADVANCED_MOTION_LAYOUT} from './advanced-motion-layout.mjs?v=20261007-names1';
import {ARMY4_LAYOUT} from './army4-layout.mjs?v=20261007-names1';
import {ARMY3_LAYOUT} from './army3-layout.mjs?v=20261007-names1';
import {ANIMATION_LAYOUT} from './animation-layout.mjs?v=20261007-names1';
import {SPRITE_LAYOUT} from './sprite-layout.mjs?v=20261007-names1';
export function spritePlacement(id,image,visibleHeight){
 const anchor=ADVANCED_MOTION_LAYOUT[id]||ARMY4_LAYOUT[id]||ARMY3_LAYOUT[id]||ANIMATION_LAYOUT[id]||SPRITE_LAYOUT[id]||{anchorX:.5,anchorY:.93,visibleHeight:1};
 const height=visibleHeight/anchor.visibleHeight,width=height*(image.naturalWidth||image.width)/(image.naturalHeight||image.height);
 return {x:-width*anchor.anchorX,y:-height*anchor.anchorY,width,height,anchor};
}
