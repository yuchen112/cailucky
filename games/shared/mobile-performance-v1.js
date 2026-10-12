/* Local measurements only. Rendering quality never changes simulation or saves. */
(()=>{'use strict';
 const samples=[],report={version:'20261012-mobile1',page:location.pathname,quality:'standard',entryReadyMs:null,frameIntervalP95:null,slowFrameRatio:0,downloadBytes:0,resources:0};
 let frame=0,last=0,start=0,active=0;
 const style=document.createElement('style');style.textContent='html[data-cxq-quality="economy"] .cover-wisp,html[data-cxq-quality="economy"] .ambient-particle,html[data-cxq-quality="economy"] .decorative-sparkle{animation:none!important;visibility:hidden!important}html[data-cxq-quality="economy"] .art-button{filter:none}button,a,input,canvas{touch-action:manipulation}html{-webkit-text-size-adjust:100%;text-size-adjust:100%}';document.head.append(style);
 function quality(value){if(report.quality===value)return;report.quality=value;document.documentElement.dataset.cxqQuality=value;if(value==='economy'&&document.body)document.body.dataset.effects='simple';window.dispatchEvent(new CustomEvent('cxq-quality-change',{detail:{quality:value,pixelRatio:value==='economy'?1:Math.min(devicePixelRatio||1,1.5)}}));}
 function snapshot(){const resources=performance.getEntriesByType('resource');report.resources=resources.length;report.downloadBytes=resources.reduce((sum,r)=>sum+(r.transferSize||0),0);report.entryReadyMs=Number(document.documentElement.dataset.cxqLoadReadyMs)||null;return {...report};}
 function save(){try{sessionStorage.setItem('cxq-performance:'+location.pathname,JSON.stringify(snapshot()));}catch{}}
 function tick(now){if(document.hidden){frame=0;last=0;return;}if(!start)start=now;if(last){const delta=now-last;if(delta<1000)samples.push(delta);}last=now;active++;
  if(active%180===0&&samples.length>=100){const sorted=samples.slice(-360).sort((a,b)=>a-b);report.frameIntervalP95=Math.round(sorted[Math.floor(sorted.length*.95)]*10)/10;report.slowFrameRatio=sorted.filter(n=>n>30).length/sorted.length;if(report.slowFrameRatio>.3&&now-start>5000)quality('economy');save();}
  if(samples.length>720)samples.splice(0,360);frame=requestAnimationFrame(tick);
 }
 window.CxQPerformance={snapshot,quality,pixelRatio:()=>report.quality==='economy'?1:Math.min(devicePixelRatio||1,1.5),effectsScale:()=>report.quality==='economy'?.5:1};
 document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;save();}else if(!frame)frame=requestAnimationFrame(tick);});
 addEventListener('pagehide',()=>{cancelAnimationFrame(frame);save();});frame=requestAnimationFrame(tick);
})();
