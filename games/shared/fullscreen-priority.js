/* Fullscreen is requested synchronously from the player's start gesture. */
(()=>{'use strict';const config=document.currentScript?.dataset||{},root=document.documentElement;let attempted=false,pending=null;
const mobile=()=>/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)||navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches;
async function enter(){if(pending)return pending;const request=root.requestFullscreen||root.webkitRequestFullscreen;if(!request)return false;
try{const result=document.fullscreenElement?Promise.resolve():request.call(root,{navigationUI:'hide'});pending=Promise.resolve(result);await pending;try{await screen.orientation?.lock?.(config.orientation||'landscape')}catch{}return true}catch{return false}finally{pending=null}}
window.CxQFullscreen={enter};
const selector=config.start||'[data-action="start"]';document.addEventListener('click',e=>{if(attempted||!mobile())return;const target=e.target.closest(selector);if(!target||target.disabled)return;attempted=true;void enter()},true);
if(config.canvas)document.addEventListener('pointerup',e=>{if(!attempted&&mobile()&&e.target.matches(config.canvas)){attempted=true;void enter()}},true);
for(const id of (config.gates||'').split(',').filter(Boolean)){const gate=document.getElementById(id);if(!gate)continue;const b=document.createElement('button');b.type='button';b.className='wood-button cxq-fullscreen-start';b.textContent='全螢幕橫向開始';b.onclick=async()=>{attempted=true;if(!await enter())b.textContent='請手動橫放手機繼續'};gate.append(b)}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)try{screen.orientation?.unlock?.()}catch{}root.dataset.fullscreen=document.fullscreenElement?'true':'false';dispatchEvent(new Event('resize'))});
})();
