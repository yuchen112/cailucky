'use strict';
// Latest raster integrity guard. Broken art must never become a visible corrupt block.
(function(){
  const V='20260818-0453';
  const put=(k,u,fallback=null)=>{
    const im=new Image();
    im.decoding='async';
    im.onload=()=>{ if(im.naturalWidth&&im.naturalHeight) IM[k]=im; else IM[k]=fallback&&IM[fallback]||null; };
    im.onerror=()=>{ IM[k]=fallback&&IM[fallback]&&IM[fallback].naturalWidth?IM[fallback]:null; };
    im.src=u+(u.includes('?')?'&':'?')+'v='+V;
  };
  put('btnBlue',A+'ui/btn_blue.webp');
  put('btnRed',A+'ui/btn_red.webp','btnBlue');
  put('charSlot',A+'ui/char_slot.webp','btnBlue');
  put('charSlotSelected',A+'ui/char_slot_selected.webp','charSlot');
  put('tile_land',A+'tiles/land.webp','charSlot');
  ['start','event','card','shop','minigame','npc'].forEach(k=>put('tile_'+k,A+'tiles/'+k+'.webp','tile_land'));
  // Broken buildings are hidden instead of being replaced by an unrelated UI/tile image.
  for(let i=1;i<=3;i++) put('house'+i,A+'houses/house_lv'+i+'.webp');
  put('dice1',A+'dice/dice_1.webp','btnBlue');
  for(let i=2;i<=6;i++) put('dice'+i,A+'dice/dice_'+i+'.webp','dice1');
})();
