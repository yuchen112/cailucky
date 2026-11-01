// Local original recordings: no remote streaming, no autoplay before interaction.
export class RealmAudio {
 constructor({settings,onError=()=>{},Context=globalThis.AudioContext||globalThis.webkitAudioContext,fetcher=globalThis.fetch?.bind(globalThis),base=new URL('../audio/',import.meta.url)}={}){
  this.settings=settings;this.onError=onError;this.Context=Context;this.fetcher=fetcher;this.base=base;this.cache=new Map();this.voices=new Set();this.musicVoices=new Set();this.scene='home';this.hidden=false;this.paused=false;this.ready=false;this.revision=0;this.lastSfx=new Map();this.reported=false;
 }
 async unlock(){
  if(!this.Context)return;
  try{if(!this.ctx){this.ctx=new this.Context();this.musicBus=this.ctx.createGain();this.sfxBus=this.ctx.createGain();this.musicBus.connect(this.ctx.destination);this.sfxBus.connect(this.ctx.destination);this.applyVolumes();}
   if(this.hidden)return;if(this.ctx.state==='suspended')await this.ctx.resume();this.ready=this.ctx.state==='running';if(this.ready)this.syncMusic();
  }catch(e){this.error(e);}
 }
 error(e){if(!this.reported){this.reported=true;this.onError(e);}}
 async buffer(id){if(!this.cache.has(id)){const p=(async()=>{const r=await this.fetcher(new URL(id+(id.startsWith('music-')?'.mp3':'.wav'),this.base));if(!r.ok)throw Error('音訊載入失敗：'+id);return this.ctx.decodeAudioData(await r.arrayBuffer());})();this.cache.set(id,p);p.catch(()=>{if(this.cache.get(id)===p)this.cache.delete(id);});}return this.cache.get(id);}
 applyVolumes(){if(!this.ctx)return;const s=this.settings(),t=this.ctx.currentTime;this.musicBus.gain.setTargetAtTime(s.music===false?0:(s.musicVolume??.45)*(this.paused?.30:1),t,.12);this.sfxBus.gain.setTargetAtTime(s.sound===false?0:(s.soundVolume??.7),t,.03);}
 update(){this.applyVolumes();this.syncMusic();}
 setScene(scene,paused=false){const changed=this.scene!==scene,changedPause=this.paused!==paused;this.scene=scene;this.paused=paused;if(changedPause)this.applyVolumes();if(changed)this.syncMusic();}
 setHidden(hidden){this.hidden=hidden;this.revision++;this.pending=null;if(hidden){this.stopMusic(.04);for(const v of this.voices){try{v.stop();}catch{}}this.voices.clear();this.ctx?.suspend().catch(()=>{});}else if(this.ctx)this.unlock();}
 stopMusic(fade=.65){this.playing=null;for(const v of this.musicVoices){if(v.retiring)continue;v.retiring=true;const now=this.ctx.currentTime;v.gain.gain.cancelScheduledValues(now);v.gain.gain.setValueAtTime(v.gain.gain.value,now);v.gain.gain.linearRampToValueAtTime(0,now+fade);try{v.source.stop(now+fade+.02);}catch{}}}
 async syncMusic(){
  const s=this.settings();if(!this.ready||this.hidden||!this.ctx)return;
  if(s.music===false){this.revision++;this.pending=null;this.stopMusic(.2);return;}
  const id='music-'+this.scene;if(this.playing===id||this.pending===id)return;
  const rev=++this.revision;this.pending=id;
  try{const buffer=await this.buffer(id);if(rev!==this.revision||this.hidden||this.settings().music===false)return;
   this.stopMusic();const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),t=this.ctx.currentTime;source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.musicBus);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(1,t+.8);const voice={source,gain};this.musicVoices.add(voice);source.onended=()=>{source.disconnect();gain.disconnect();this.musicVoices.delete(voice);};source.start();this.playing=id;
  }catch(e){this.error(e);}finally{if(rev===this.revision&&this.pending===id)this.pending=null;}
 }
 async play(id){
  if(!this.ready||this.hidden||this.settings().sound===false||!this.ctx)return;
  const now=this.ctx.currentTime;if(now-(this.lastSfx.get(id)??-100)<.055)return;this.lastSfx.set(id,now);
  try{const buffer=await this.buffer(id);if(this.hidden||this.settings().sound===false||this.ctx.state!=='running')return;
   if(this.voices.size>=10){const oldest=this.voices.values().next().value;oldest.stop();this.voices.delete(oldest);}
   const source=this.ctx.createBufferSource();source.buffer=buffer;source.connect(this.sfxBus);this.voices.add(source);source.onended=()=>{source.disconnect();this.voices.delete(source);};source.start();this.lastCue=id;
  }catch(e){this.error(e);}
 }
 status(){return {state:this.ctx?.state||'locked',track:this.playing||'',cue:this.lastCue||'',voices:this.voices.size,musicVoices:this.musicVoices.size};}
}
