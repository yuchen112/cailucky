'use strict';
// Asset cache repair + broken-image guard. Visible game art still comes from raster image files.
(function(){
  const V='20260818-0422';
  const reload=(k,u,fallback='btnBlue')=>{
    const im=new Image();
    im.decoding='async';
    im.onload=()=>{ IM[k]=im; };
    im.onerror=()=>{ if(IM[fallback]&&IM[fallback].complete&&IM[fallback].naturalWidth) IM[k]=IM[fallback]; };
    im.src=u+(u.includes('?')?'&':'?')+'v='+V;
    IM[k]=im;
  };
  reload('btnBlue',A+'ui/btn_blue.webp','btnBlue');
  reload('btnRed',A+'ui/btn_red.webp','btnBlue');
  reload('charSlot',A+'ui/char_slot.webp','btnBlue');
  reload('charSlotSelected',A+'ui/char_slot_selected.webp','btnRed');
  ['start','land','event','card','shop','minigame','npc'].forEach(k=>reload('tile_'+k,A+'tiles/'+k+'.webp','charSlot'));
  for(let i=1;i<=3;i++) reload('house'+i,A+'houses/house_lv'+i+'.webp','charSlot');
  for(let i=1;i<=6;i++) reload('dice'+i,A+'dice/dice_'+i+'.webp','btnBlue');
})();
