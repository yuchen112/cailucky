'use strict';
// Runtime integrity guard for the assets that still have not been replaced in the current art pass.
(function(){
  const V='20260818-1105';
  const put=(k,u,fallback=null)=>{
    const im=new Image();im.decoding='async';
    im.onload=()=>{IM[k]=(im.naturalWidth&&im.naturalHeight)?im:(fallback&&IM[fallback]||null)};
    im.onerror=()=>{IM[k]=fallback&&IM[fallback]&&IM[fallback].naturalWidth?IM[fallback]:null};
    im.src=u+(u.includes('?')?'&':'?')+'v='+V;
  };
  put('btnBlue',A+'ui/btn_blue.webp');put('btnRed',A+'ui/btn_red.webp','btnBlue');
  put('tile_land',A+'tiles/land.webp','btnBlue');
  ['start','event','card','shop','minigame','npc'].forEach(k=>put('tile_'+k,A+'tiles/'+k+'.webp','tile_land'));
  IM.house1=null;IM.house2=null;IM.house3=null;
  put('dice1',A+'dice/dice_1.webp','btnBlue');for(let i=2;i<=6;i++)put('dice'+i,A+'dice/dice_'+i+'.webp','dice1');
})();