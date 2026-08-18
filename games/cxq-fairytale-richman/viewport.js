'use strict';
// Cross-browser viewport adapter. Visible game art remains inside the 1600x900 design space;
// this file only handles browser geometry, safe areas, dynamic bars and pointer alignment.
(function(){
  let raf=0,timers=[];
  const root=document.documentElement;
  const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:0};
  function safeInsets(){
    const cs=getComputedStyle(root);
    return {
      top:num(cs.getPropertyValue('--safe-top')),
      right:num(cs.getPropertyValue('--safe-right')),
      bottom:num(cs.getPropertyValue('--safe-bottom')),
      left:num(cs.getPropertyValue('--safe-left'))
    };
  }
  function viewportSize(){
    const vv=window.visualViewport;
    const w=Math.max(1,Math.round((vv&&vv.width)||innerWidth||document.documentElement.clientWidth||W));
    const h=Math.max(1,Math.round((vv&&vv.height)||innerHeight||document.documentElement.clientHeight||H));
    return {w,h};
  }
  function applyViewport(){
    raf=0;
    const v=viewportSize(),ins=safeInsets();
    const portrait=v.h>v.w;
    document.body.dataset.orientation=portrait?'portrait':'landscape';

    // Keep the canvas exactly on the currently visible browser viewport. This reacts to
    // Safari/Chrome dynamic address bars, desktop window resizing and installed-PWA mode.
    C.style.position='fixed';
    C.style.left='0px';C.style.top='0px';
    C.style.width=v.w+'px';C.style.height=v.h+'px';

    const dpr=Math.max(1,Math.min(devicePixelRatio||1,2.5));
    const bw=Math.max(1,Math.round(v.w*dpr)),bh=Math.max(1,Math.round(v.h*dpr));
    if(C.width!==bw)C.width=bw;
    if(C.height!==bh)C.height=bh;

    const sl=ins.left*dpr,sr=ins.right*dpr,st=ins.top*dpr,sb=ins.bottom*dpr;
    const usableW=Math.max(1,C.width-sl-sr),usableH=Math.max(1,C.height-st-sb);
    VIEW.scale=Math.min(usableW/W,usableH/H);
    VIEW.ox=sl+(usableW-W*VIEW.scale)/2;
    VIEW.oy=st+(usableH-H*VIEW.scale)/2;

    document.body.dataset.aspect=(v.w/v.h>2?'ultrawide':v.w/v.h<1.45?'compact':'standard');
  }
  function schedule(){
    if(!raf)raf=requestAnimationFrame(applyViewport);
    timers.forEach(clearTimeout);timers=[];
    // iOS Safari can report two or three viewport sizes while the browser bars/orientation settle.
    [80,240,520].forEach(ms=>timers.push(setTimeout(applyViewport,ms)));
  }

  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  addEventListener('pageshow',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  if(window.visualViewport){
    visualViewport.addEventListener('resize',schedule,{passive:true});
    visualViewport.addEventListener('scroll',schedule,{passive:true});
  }
  if(screen.orientation)screen.orientation.addEventListener?.('change',schedule);
  applyViewport();
})();
