'use strict';
// Production background layer. Game-only raster art; no website Brand images.
(function(){
  load('homeBg',A+'backgrounds/home_scene.webp');
  load('setupBg',A+'backgrounds/setup_scene.webp');
  load('mapBg',A+'backgrounds/map_scene.webp');

  function cxqCover(im,x,y,w,h,alpha=1){
    if(!im||!im.complete||!im.naturalWidth||!im.naturalHeight)return;
    const r=Math.max(w/im.naturalWidth,h/im.naturalHeight);
    const iw=im.naturalWidth*r,ih=im.naturalHeight*r;
    X.save();X.globalAlpha=alpha;X.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);X.restore();
  }

  // Replace the temporary black home composition entirely. No dev notes or decorative tile placeholders.
  home=function(){
    cxqCover(IM.homeBg,0,0,W,H,1);
    title(360,145);
    btn('start','開始遊戲',110,405,470,110,true);
    btn('continue','繼續遊戲',135,520,420,82,false,.96,!!localStorage.getItem(SAVE));
    btn('help','遊戲說明',135,614,420,82,false,.94);
    btn('settings','設定',135,708,420,82,false,.94);
    contain(IM.c0,760,390,230,330,.98);
    contain(IM.c1,970,410,220,310,.96);
    contain(IM.c2,1180,400,230,320,.96);
  };

  // Keep the active Richman-style setup logic from skin.js, but place it on the dedicated selection scene.
  const activeSetup=setup;
  setup=function(){
    cxqCover(IM.setupBg,0,0,W,H,1);
    activeSetup();
  };

  // The world background is one continuous map; all functional tiles remain independent overlays.
  const activeDrawMap=drawMap;
  drawMap=function(){
    stretch(IM.mapBg,0,0,MW,MH,1);
    activeDrawMap();
  };
})();
