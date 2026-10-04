import {ADVANCED_MOTION_LAYOUT} from './advanced-motion-layout.mjs';
import {ARMY4_LAYOUT} from './army4-layout.mjs';
import {ARMY3_LAYOUT} from './army3-layout.mjs';
import {ANIMATION_LAYOUT} from './animation-layout.mjs';
import {SPRITE_LAYOUT} from './sprite-layout.mjs';
export function spritePlacement(id,image,visibleHeight){
 const anchor=ADVANCED_MOTION_LAYOUT[id]||ARMY4_LAYOUT[id]||ARMY3_LAYOUT[id]||ANIMATION_LAYOUT[id]||SPRITE_LAYOUT[id]||{anchorX:.5,anchorY:.93,visibleHeight:1};
 const height=visibleHeight/anchor.visibleHeight,width=height*(image.naturalWidth||image.width)/(image.naturalHeight||image.height);
 return {x:-width*anchor.anchorX,y:-height*anchor.anchorY,width,height,anchor};
}
