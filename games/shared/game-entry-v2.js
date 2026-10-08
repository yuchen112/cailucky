/* Each game supplies its own artwork, home host and placement. */
(()=>{
 const script=document.currentScript,cfg=JSON.parse(script.dataset.game),root=new URL('../../',script.src),art=new URL(cfg.art,root).href;
 document.title='CxQ '+cfg.name;
 const style=document.createElement('style');style.textContent='.game-center-return{display:inline-flex!important;align-items:center;justify-content:center;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;min-height:44px;touch-action:manipulation;cursor:pointer;text-decoration:none!important;max-width:100%;flex-shrink:0}.game-center-return img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;pointer-events:none}.game-center-return:active{filter:brightness(1.2)}.game-center-return:focus-visible{outline:3px solid #fff0ac;outline-offset:3px}'+cfg.css;document.head.append(style);
 style.textContent+='#link-home h1{text-wrap:balance;font-size:clamp(22px,4vw,28px);line-height:1.2}#link-home>div{max-height:100dvh;overflow-y:auto;box-sizing:border-box}';
 function mount(){const host=document.querySelector(cfg.host);if(!host)return;
  const brand=host.querySelector('.home-title>small');if(brand&&brand.textContent!=='CxQ '+cfg.name)brand.textContent='CxQ '+cfg.name;
  const heading=host.querySelector(cfg.heading||'h1');if(heading){const image=heading.querySelector('img');if(image){if(cfg.logo){const src=new URL(cfg.logo,root).href;if(image.src!==src)image.src=src;}image.alt='CxQ '+cfg.name;}else if(heading.textContent!=='CxQ '+cfg.name)heading.textContent='CxQ '+cfg.name;}
  const sub=cfg.sub&&host.querySelector(cfg.sub);if(sub&&sub.textContent!==cfg.desc)sub.textContent=cfg.desc;
  const gate=document.querySelector('#session-gate>div');if(gate&&!gate.querySelector('.game-center-return')){const a=document.createElement('a');a.className='game-center-return';a.href=new URL('?view=game-hub&v=20261008-complete2',root).href;a.setAttribute('aria-label','返回遊戲中心');a.style.cssText='width:240px;height:48px;margin-top:8px';const img=document.createElement('img');img.src=art;img.alt='返回遊戲中心';a.append(img);gate.append(a);}
  if(host.querySelector('.game-center-return'))return;
  const parent=cfg.slot?host.querySelector(cfg.slot):host;if(!parent)return;const a=document.createElement('a');a.className='game-center-return';a.href=new URL('?view=game-hub&v=20261008-complete2',root).href;a.setAttribute('aria-label','返回遊戲中心');const img=document.createElement('img');img.src=art;img.alt='返回遊戲中心';img.draggable=false;a.append(img);parent.append(a);
 }
 let queued=false;const update=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;mount();});};new MutationObserver(update).observe(document.body,{childList:true,subtree:true});mount();
})();
