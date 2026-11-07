// Explicit local diagnostics. No recordings or device data leave the page.
export function createPerformanceProbe(enabled){
 if(!enabled)return null;
 const panel=document.createElement('output');
 panel.id='battle-performance';
 panel.setAttribute('aria-label','戰鬥效能');
 Object.assign(panel.style,{position:'fixed',left:'4px',right:'4px',top:'calc(env(safe-area-inset-top) + 65px)',zIndex:'2147483647',pointerEvents:'none',background:'#071c20ed',color:'#fff',padding:'6px',font:'12px/1.5 monospace',whiteSpace:'pre-line'});
 document.body.append(panel);
 let last=0,reported=0,samples=[],worstGap=0;
 const percentile=(values,p)=>values.sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]||0;
 return {
  frame(now,simulation,render,finished,state,audio){
   const gap=last?now-last:0;
   last=now;
   if(document.hidden||gap>5000){samples=[];return;}
   if(gap>0){samples.push({gap,simulation,render,audio,total:finished});worstGap=Math.max(worstGap,gap);}
   if(now-reported<1000||!samples.length)return;
   reported=now;
   const ms=value=>Math.round(value)+'ms';
   panel.textContent='iOS5 · '+state.phase+' · '+state.enemies.length+' 敵人 · '+state.shots.length+' 彈道\n'+
    '幀間隔 P95 '+ms(percentile(samples.map(s=>s.gap),.95))+' · 最長 '+ms(worstGap)+'\n'+
    '音效 '+ms(Math.max(...samples.map(s=>s.audio)))+' · 運算 '+ms(Math.max(...samples.map(s=>s.simulation)))+' · 繪圖 '+ms(Math.max(...samples.map(s=>s.render)))+' · 全幀 '+ms(Math.max(...samples.map(s=>s.total)));
   samples=[];
  }
 };
}
