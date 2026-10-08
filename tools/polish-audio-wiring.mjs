import fs from 'node:fs';
function edit(p,fn){let s=fs.readFileSync(p,'utf8');const replace=(a,b)=>{if(!s.includes(a))throw Error(p+' missing '+a.slice(0,60));s=s.replace(a,()=>b)};fn(replace,()=>s);fs.writeFileSync(p,s);}
edit('games/storybook/common.js',(r)=>{
 r('let cfg={},data={},music,','let audioEngine;let cfg={},data={},music,');
 r("music=new Audio(cfg.music);music.loop=true;music.preload='none';",`music=new Audio(cfg.music);music.loop=true;music.preload='none';
 if(window.CxQAudioEngine){const aliases={step:'tap',land:'drop',flag:'flip',merge:'match',skill:'upgrade'};const effects=Object.fromEntries(Object.keys(soundFiles).map(name=>[name,[0,1,2].map(i=>new URL('../shared/audio-v2/'+(aliases[name]||name)+'-'+i+'.mp3',location.href).href)]));audioEngine=CxQAudioEngine.create({id:cfg.id,settings:()=>({music:data.music,sfx:data.sfx*.7}),tracks:[new URL('../shared/audio-v2/'+cfg.id+'.mp3',location.href).href,new URL(cfg.music,location.href).href],effects});}`);
 r('music.volume=data.music;save()','music.volume=data.music;audioEngine?.sync();save()');
 r("function playMusic(){if(unlocked", "function playMusic(){if(audioEngine){audioEngine.hold(held);return;}if(unlocked");
 r("function sound(name='tap',rate=1){if", "function sound(name='tap',rate=1){if(audioEngine){audioEngine.sound(name,{rate});return;}if");
 r('function hold(){held=true;music.pause();','function hold(){held=true;audioEngine?.hold();music.pause();');
 r('<h2>調整旅途的聲音</h2>','<h2>調整旅途的聲音</h2><p data-audio-status>點擊畫面啟用聲音</p><button type="button" id="audio-preview">試聽音效</button>');
 r("$('#mute').onclick=", "$('#audio-preview').onclick=()=>{held=false;audioEngine?.hold(false);sound('collect');};$('#mute').onclick=");
 r('music.pause();save()};dialog.onclose','music.pause();audioEngine?.sync();save()};dialog.onclose');
});
edit('games/shared/runtime.js',(r)=>{
 r('let unlocked=false,music=null,','let audioEngine;let unlocked=false,music=null,');
 r('function playMusic(){if(unlocked', 'function playMusic(){if(audioEngine){audioEngine.hold(paused);return;}if(unlocked');
 r("function sound(name='tap'){if", "function sound(name='tap'){if(audioEngine){audioEngine.sound(name);return;}if");
 r('paused=true;music?.pause();','paused=true;audioEngine?.hold();music?.pause();');
 r("configure(options={}){controller=options;",`configure(options={}){controller=options;if(window.CxQAudioEngine){const id=location.pathname.split('/').filter(Boolean).find((v,i,a)=>a[i-1]==='games')||'2048';audioEngine?.dispose();audioEngine=CxQAudioEngine.create({id,settings:()=>settings,tracks:[new URL('audio-v2/'+id+'.mp3',base).href,new URL('audio/'+(options.music||'heavenly')+'.mp3',base).href],effects:Object.fromEntries(Object.keys(files).map(n=>[n,[0,1,2].map(i=>new URL('audio-v2/'+n+'-'+i+'.mp3',base).href)]))});} `);
 r('<h2>旅途的聲音</h2>','<h2>旅途的聲音</h2><p data-audio-status>點擊畫面啟用聲音</p><button type="button" data-audio-preview>試聽音效</button>');
 r("button.onclick=()=>{hold('settings');panel.showModal()}","panel.querySelector('[data-audio-preview]').onclick=()=>{audioEngine?.hold(false);audioEngine?.test()};button.onclick=()=>{hold('settings');panel.showModal()}");
 r('music.volume=settings.music;if(!settings.music)music.pause()','music.volume=settings.music;if(!settings.music)music.pause();audioEngine?.sync()');
 r("paused=false;sound('match');paused=true","paused=false;audioEngine?.hold(false);sound('match');paused=true;audioEngine?.hold()");
});
console.log('Classic audio adapters wired with preview and audible status');
