/* Scoped to the eight refreshed games, never loaded by Richman. */
(() => {
  const rules={'magic-bubble':'portrait','dream-match':'portrait','fairytale-defense':'landscape',whack:'portrait',merge:'portrait',flappy:'portrait',dino:'landscape',mines:'adaptive'};
  const id=location.pathname.split('/').find(x=>rules[x]);if(!id)return;
  document.body.dataset.game=id;document.body.classList.add('game-surface');
  let interrupted=false,wrong=false,remaining=0,last=0,raf=0;
  const main=document.querySelector('main');
  const gate=document.createElement('section');gate.id='session-gate';gate.hidden=true;gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');gate.innerHTML='<div><img src="../../assets/characters/cxq-role-'+({dino:'growth','fairytale-defense':'trust','dream-match':'night',whack:'joy',merge:'healing',flappy:'hope',mines:'memory'}[id]||'dream')+'.webp" alt=""><h2></h2><p>進度已保留。</p><button type="button">繼續遊戲</button></div>';document.body.append(gate);
  const playing=()=>{const play=document.querySelector('#play');return play?!play.hidden:!!document.querySelector('.game-entry[hidden]')&&!document.querySelector('#result:not([hidden])');};
  function direction(){if(rules[id]!=='adaptive')return rules[id];return document.querySelectorAll('#board .cell').length&&parseInt(document.querySelector('#board').style.getPropertyValue('--cols'))>10?'landscape':'portrait';}
  function blocked(){return document.hidden||wrong||interrupted||remaining>0||!!document.querySelector('dialog[open]');}
  function paint(){const show=playing()&&(wrong||interrupted||remaining>0);gate.hidden=!show;document.body.classList.toggle('session-playing',playing());document.body.classList.toggle('session-blocked',show);if(show){main.inert=true;gate.querySelector('h2').textContent=wrong?(direction()==='portrait'?'請直拿手機':'請橫拿手機'):remaining>0?'準備繼續 '+Math.ceil(remaining/1000):'遊戲已暫停';gate.querySelector('button').hidden=wrong||remaining>0;}else if(!document.querySelector('.game-entry:not([hidden])'))main.inert=false;}
  function resize(){if(!playing()){interrupted=false;remaining=0;cancelAnimationFrame(raf);}const phone=matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<=600;const mismatch=playing()&&phone&&(direction()==='portrait'?innerWidth>innerHeight:innerHeight>innerWidth);if(mismatch&&!wrong)interrupted=true;wrong=mismatch;if(wrong){remaining=0;cancelAnimationFrame(raf)}paint();}
  gate.querySelector('button').onclick=()=>{if(wrong||document.hidden)return;interrupted=false;remaining=2000;last=performance.now();function step(t){if(document.hidden||wrong){remaining=0;interrupted=true;paint();return}remaining=Math.max(0,remaining-(t-last));last=t;paint();if(remaining)raf=requestAnimationFrame(step);else if(typeof CxQ!=='undefined')CxQ.resume();}raf=requestAnimationFrame(step);paint();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing()){interrupted=true;remaining=0;cancelAnimationFrame(raf)}resize()});
  addEventListener('resize',resize);addEventListener('orientationchange',resize);
  new MutationObserver(resize).observe(main,{subtree:true,attributes:true,attributeFilter:['hidden']});
  const entry=document.querySelector('.game-entry');if(entry)new MutationObserver(resize).observe(entry,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea,[contenteditable],dialog'))e.preventDefault()});
  document.addEventListener('dragstart',e=>{if(e.target.closest('img,canvas,#board'))e.preventDefault()});
  document.addEventListener('keydown',e=>{if(blocked()&&main.contains(e.target)&&!e.target.closest('dialog,input,select,textarea')&&['Space','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyX','KeyF','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('close',()=>{if(!wrong&&!document.hidden){interrupted=false;remaining=0;paint();}},true);
  const reducedMotion=()=>document.body.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion:reduce)').matches;
  const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(reducedMotion())options=typeof options==='number'?1:{...options,duration:1,delay:0,iterations:1};return animate.call(this,frames,options);};
  window.CxQSession={blocked,reducedMotion,async waitReady(){while(blocked())await new Promise(r=>setTimeout(r,100));},orientation:direction,refresh:resize};
  function addSettings(){for(const form of document.querySelectorAll('#audio-dialog form,#cxq-audio-panel form')){if(form.dataset.sessionSettings)continue;form.dataset.sessionSettings='true';if(document.documentElement.requestFullscreen){const button=document.createElement('button');button.type='button';button.textContent='切換全螢幕';button.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{button.textContent='此瀏覽器不支援全螢幕';}};form.append(button);}const label=document.createElement('label');label.textContent='減少動畫　';const toggle=document.createElement('input');toggle.type='checkbox';try{toggle.checked=localStorage.getItem('cxq-reduced-motion')==='true';}catch{}const change=()=>{document.body.classList.toggle('reduced-motion',toggle.checked);try{localStorage.setItem('cxq-reduced-motion',String(toggle.checked));}catch{}};toggle.onchange=change;change();label.append(toggle);form.append(label);}}
  function settingsReady(){addSettings();const sound=document.querySelector('#cxq-audio');if(sound){sound.replaceChildren();const icon=new Image();icon.src='../storybook/art-20260914/icon-gear.webp';icon.alt='';sound.append(icon);}}
  settingsReady();addEventListener('DOMContentLoaded',settingsReady);
  if(id==='magic-bubble'){
    const c=document.querySelector('canvas'),holder=c.parentElement;
    const fit=()=>{if(innerHeight<=innerWidth){c.style.width='';c.style.height='';return;}const width=Math.min(holder.clientWidth,(holder.clientHeight-28)*c.width/c.height);if(width>0){c.style.width=width+'px';c.style.height=width*c.height/c.width+'px';}};
    new ResizeObserver(fit).observe(holder);addEventListener('resize',fit);fit();
  }
  resize();
})();
