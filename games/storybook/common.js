'use strict';
const G=(()=>{
 const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),roles=['幸運','療癒','成長','回憶','快樂','夜晚陪伴','信任','夢想','悲傷','希望'];
 let cfg={},data={},music,unlocked=false,held=false,active=false,pauseFn=()=>{},lastSfx={},pool=new Map();const images={};const roleFiles=['luck','healing','growth','memory','joy','night','trust','dream','sadness','hope'].map(n=>'../storybook/art-mobile24/portrait-'+n+'.webp');
 const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
 function save(){try{localStorage.setItem('cxq-'+cfg.id+'-v1',JSON.stringify(data));return true}catch{toast('瀏覽器無法儲存，這次仍可繼續遊玩。');return false}}
 const sprite=(i,cls='')=>{i=clamp(Math.floor(i)||0,0,9);return '<img loading="lazy" decoding="async" aria-hidden="true" class="role-art individual-cast '+cls+'" src="'+roleFiles[i]+'" alt="" style="object-fit:contain;background:none">'};
 function toast(t){let n=$('#notice');if(n)n.textContent=t}
 function init(options){cfg=options;const raw=read('cxq-'+cfg.id+'-v1',{});data=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};data.role=clamp(Number.isInteger(data.role)?data.role:({merge:1,flappy:9,dino:2,mines:3}[cfg.id]??0),0,9);data.music=Number.isFinite(data.music)?clamp(data.music,0,1):.23;data.sfx=Number.isFinite(data.sfx)?clamp(data.sfx,0,1):.55;data.records=data.records&&typeof data.records==='object'&&!Array.isArray(data.records)?data.records:{};data.collection=Array.isArray(data.collection)?[...new Set(data.collection.filter(x=>Number.isInteger(x)&&x>=0&&x<100))]:[];data.wins=clamp(Math.floor(data.wins)||0,0,100000);pauseFn=cfg.pause;
 music=new Audio(cfg.music);music.loop=true;music.preload='none';
 const audio=document.createElement('button');audio.id='sound';audio.className='audio-button';audio.setAttribute('aria-label','音樂與音效設定');audio.textContent='聲音';document.body.append(audio);audio.onclick=()=>{if(active)pauseFn();held=true;music.pause();const d=$('#audio-dialog');d.showModal()};
 const dialog=document.createElement('dialog');dialog.id='audio-dialog';dialog.className='paper';dialog.innerHTML='<form method="dialog"><h2>調整旅途的聲音</h2><label>背景音樂<input aria-label="背景音樂音量" type="range" data-sound="music" min="0" max="1" step=".05"></label><label>遊戲音效<input aria-label="遊戲音效音量" type="range" data-sound="sfx" min="0" max="1" step=".05"></label><button type="button" id="mute">全部靜音</button><button>收好設定</button><p><a href="../storybook/CREDITS.html" target="_blank" rel="noopener">素材與音樂來源</a></p></form>';document.body.append(dialog);dialog.querySelectorAll('input').forEach(e=>{e.value=data[e.dataset.sound];e.oninput=()=>{data[e.dataset.sound]=+e.value;music.volume=data.music;save()}});$('#mute').onclick=()=>{data.music=data.sfx=0;dialog.querySelectorAll('input').forEach(e=>e.value=0);music.pause();save()};dialog.onclose=()=>{if(!active)resumeAudio()};
 document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();pool.forEach(a=>a.pause());if(active)pauseFn()}else if(!active)playMusic()});addEventListener('pagehide',()=>{music.pause();save()});
 addEventListener('resize',()=>orientation());return data;
 }
 function unlock(){unlocked=true;playMusic()}function playMusic(){if(unlocked&&!held&&!document.hidden&&data.music>0){music.volume=data.music;music.play().catch(()=>{})}}function resumeAudio(){held=false;playMusic()}
 const soundFiles={tap:'click1',flip:'rollover2',flag:'switch4',merge:'merge',drop:'drop',jump:'jump',step:'step',land:'land',collect:'collect',skill:'skill',miss:'switch15',win:'win',lose:'lose'};
 function sound(name='tap',rate=1){if(!unlocked||document.hidden||!data.sfx||held)return;const now=performance.now();if(now-(lastSfx[name]||0)<(name==='step'?180:65))return;lastSfx[name]=now;let a=pool.get(name);if(!a){if(cfg.sounds?.[name]){a=new Audio(cfg.sounds[name]);pool.set(name,a)}const local=['merge','drop','jump','step','land','collect','skill'].includes(name);if(!a)a=new Audio((local?'../storybook/audio/':'../shared/audio/')+soundFiles[name]+'.mp3');pool.set(name,a)}a.volume=data.sfx*(name==='step'?.35:.7);a.playbackRate=clamp(rate,.65,1.6);a.preservesPitch=false;a.currentTime=0;a.play().catch(()=>{})}
 function dialog(title,body,actions){let d=$('#game-dialog');if(!d){d=document.createElement('dialog');d.id='game-dialog';d.className='paper';document.body.append(d)}d.innerHTML=sprite(data.role,'dialog-role')+'<h2>'+title+'</h2>'+body+'<div class="dialog-actions"></div>';for(const [label,fn]of actions){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{d.close();fn?.()};d.querySelector('.dialog-actions').append(b)}d.oncancel=e=>{e.preventDefault()};if(!d.open)d.showModal();return d}
 function rolePicker(sel,allowed=roles.map((_,i)=>i),onChange=()=>{}){if(!allowed.includes(data.role))data.role=allowed[0];const n=$(sel);n.innerHTML=allowed.map(i=>'<button class="role-choice" data-role="'+i+'" aria-pressed="'+(i===data.role)+'">'+sprite(i)+'<span>'+roles[i]+'</span></button>').join('');n.querySelectorAll('button').forEach(b=>b.onclick=()=>{data.role=+b.dataset.role;save();n.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));sound('tap');onChange(data.role)});onChange(data.role)}
 let pendingLoads=0,loadFailed=false,readyLabel='';
 const loadingImages=new Map();let completedImages=0,totalImages=0;
 function progress(){const start=$('#start');if(start&&pendingLoads){start.disabled=true;start.textContent='準備美術 '+completedImages+'/'+totalImages;}}
 function imageReady(src){
  if(images[src])return Promise.resolve(images[src]);
  if(loadingImages.has(src))return loadingImages.get(src);
  totalImages++;progress();
  const request=attempt=>new Promise((resolve,reject)=>{
   const image=new Image();let done=false;
   const finish=error=>{if(done)return;done=true;clearTimeout(timer);image.onload=image.onerror=null;if(error)reject(error);else resolve(image);};
   const timer=setTimeout(()=>finish(new Error('Image load timed out: '+src)),15000);
   image.onload=()=>image.naturalWidth?finish():finish(new Error('Empty image: '+src));
   image.onerror=()=>finish(new Error('Image load failed: '+src));
   const url=new URL(src,location.href);if(attempt)url.searchParams.set('asset_retry',String(attempt));image.src=url.href;
  });
  const pending=request(0).catch(()=>request(1)).then(image=>{images[src]=image;completedImages++;progress();return image;}).finally(()=>loadingImages.delete(src));
  loadingImages.set(src,pending);return pending;
 }
 async function load(names){
  const start=$('#start');if(!pendingLoads){readyLabel=start?.dataset.label||start?.textContent||'開始遊戲';loadFailed=false;completedImages=totalImages=0;}
  pendingLoads++;progress();
  try{await Promise.all([...new Set(names)].map(imageReady));return images;}
  catch(error){loadFailed=true;console.error('[CxQ assets]',error.message);throw error;}
  finally{pendingLoads--;if(!pendingLoads&&start){start.disabled=false;start.textContent=loadFailed?'圖片載入失敗，點此重試':start.dataset.label||readyLabel;if(loadFailed)start.onclick=()=>location.reload();}}
 }
 function drawRole(ctx,id,x,y,w,h){const img=images[roleFiles[id]];if(!img?.naturalWidth)return;const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
 function settings(ids){let p=data.preferences;if(!p||typeof p!=='object'||Array.isArray(p))p=data.preferences={};for(const id of ids){const e=$('#'+id);if(!e)continue;const v=p[id];if(e.type==='checkbox'){if(typeof v==='boolean')e.checked=v}else if(v!==undefined){if(e.tagName==='SELECT'){if([...e.options].some(o=>o.value===String(v)&&!o.disabled))e.value=String(v)}else if(Number.isFinite(Number(v))){const n=Number(v),min=e.min===''?-Infinity:+e.min,max=e.max===''?Infinity:+e.max;if(n>=min&&n<=max)e.value=String(n)}}e.dispatchEvent(new Event('change'));e.addEventListener('change',()=>{p[id]=e.type==='checkbox'?e.checked:e.value;save()})}}
 function records(bucket,score,extra={}){const list=Array.isArray(data.records[bucket])?data.records[bucket].filter(r=>r&&Number.isFinite(r.score)):[];list.push({score:Math.max(0,Math.round(score)),date:Date.now(),...extra});data.records[bucket]=list.sort((a,b)=>b.score-a.score).slice(0,10);save();return data.records[bucket][0].score}
 function recordHTML(bucket,unit='分'){const a=Array.isArray(data.records[bucket])?data.records[bucket].filter(r=>r&&Number.isFinite(r.score)):[];return a.length?'<ol>'+a.map(r=>'<li>'+Math.round(r.score)+' '+unit+' · '+new Date(Number(r.date)||0).toLocaleDateString()+'</li>').join(''):'<p>第一次冒險正在等你。</p>'}
 function orientation(){if(window.CxQSession){window.CxQSession.refresh();return;}const req=typeof cfg.orientation==='function'?cfg.orientation():cfg.orientation;const mobile=innerWidth<600||navigator.maxTouchPoints>0||/Android|iPhone|Mobile/.test(navigator.userAgent);const wrong=active&&mobile&&req&&(req==='portrait'?innerWidth>innerHeight:innerHeight>innerWidth);let gate=$('#rotate');if(!gate){gate=document.createElement('div');gate.id='rotate';gate.hidden=true;gate.innerHTML='<div class="paper">'+sprite(data.role,'dialog-role')+'<h2></h2><p>遊戲已暫停，進度會保留。</p></div>';document.body.append(gate)}gate.hidden=!wrong;if(wrong){gate.querySelector('h2').textContent=req==='portrait'?'請直拿手機，讓工作區完整展開':'請橫拿手機，讓路線完整展開';pauseFn();const d=$('#game-dialog');if(d?.open){d.querySelector('h2').textContent=gate.querySelector('h2').textContent;const p=d.querySelector('p');if(p)p.textContent='遊戲已暫停。旋轉手機後，按繼續即可保留目前進度。'}}}
 function playing(value){active=value;document.body.classList.toggle("in-game",value);if(value)resumeAudio();orientation()}function hold(){held=true;music.pause();pool.forEach(a=>a.pause())}
 function frame(update,draw){let last=0;function tick(t){const dt=last?Math.min(.035,(t-last)/1000):0;last=t;if(!window.CxQSession?.blocked())update(dt);draw(t);requestAnimationFrame(tick)}requestAnimationFrame(tick)}
 return {$,clamp,roles,sprite,init,save,sound,toast,dialog,rolePicker,load,drawRole,records,recordHTML,orientation,playing,settings,hold,resumeAudio,frame,images,get data(){return data}};
})();
