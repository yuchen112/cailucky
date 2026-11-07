import {createEffectAudio} from '../shared/effect-audio.mjs?v=20261108-buffered1';
const root = new URL('./audio/v5/', import.meta.url);
const effectCues={"shoot":"shoot","impact":"impact","hurt":"hurt","pickup":"pickup","level-up":"level-up","evolve":"evolve","boss":"boss","victory":"victory","defeat":"defeat","hit":"impact","upgrade":"level-up","chest":"pickup","material":"pickup","win":"victory","lose":"defeat"};
const effectNames=["attack-dream","attack-growth","attack-healing","attack-hope","attack-joy","attack-luck","attack-memory","attack-night","attack-sadness","attack-trust","ban","beam","block","boss","chain","chest","click","craft","dash","enemyCast","error","evolve","heal","hit","hover","hurt","lose","map","material","meteor","objective","pickup","pulse","rain","reroll","select","shatter","skill-dream","skill-growth","skill-healing","skill-hope","skill-joy","skill-luck","skill-memory","skill-night","skill-sadness","skill-trust","skip","summon","upgrade","warning","win"];
const effectURL=name=>effectCues[name]?new URL('./audio-original/'+effectCues[name]+'.wav',import.meta.url).href:new URL(name+'.wav',root).href;
const maps = new Set(['forest', 'cave', 'clock', 'coast', 'sky']);

export class Sound {
  constructor(preferences) {
    this.preferences = preferences;
    this.track = new Audio();
    this.track.loop = true;
    this.effects = new Map();
    this.bufferedEffects=createEffectAudio();
    this.unlocked = false;
    document.addEventListener('visibilitychange', () => {if(document.hidden)this.bufferedEffects?.stop();this.sync();});
    addEventListener('pagehide',()=>{this.track.pause();this.bufferedEffects?.stop();});
    document.addEventListener('pointerdown',()=>{if(this.unlocked&&this.level('sfx'))this.bufferedEffects?.unlock();},{passive:true});
  }

  unlock() {
    this.unlocked = true;
    this.rejected = false;
    if(this.level('sfx')){this.bufferedEffects?.unlock();for(const name of effectNames)void this.bufferedEffects?.prepare(effectURL(name));}
    this.sync();
  }

  setPreferences(preferences) {
    this.preferences = preferences;
    if(this.unlocked&&this.level('sfx'))this.bufferedEffects?.unlock();
    this.sync();
    for (const pool of this.effects.values()) {
      for (const voice of pool) {
        voice.volume = this.level('sfx');
        if (!voice.volume) voice.pause();
      }
    }
  }

  level(bus) {
    if (!this.preferences[bus + 'Enabled']) return 0;
    return Math.max(0, Math.min(1, Number(this.preferences[bus + 'Volume']) || 0));
  }

  sync() {
    this.bufferedEffects?.setVolume(this.level('sfx'));
    this.track.volume = this.level('music');
    if (!this.unlocked || !this.track.volume || document.hidden || this.suspended || !this.trackName) {
      this.track.pause();
      return;
    }
    if (this.track.paused && !this.pending && !this.rejected) {
      this.pending = this.track.play().catch(() => { this.rejected = true; }).finally(() => {
        this.pending = null;
      });
    }
  }

  music(mode, boss, map) {
    const name = mode === 'home' || !maps.has(map) ? 'camp' : boss ? (map === 'sky' ? 'boss-sky' : 'boss') : map;
    const suspended = ['paused', 'result'].includes(mode),effectsPaused=mode==='paused';
    if (this.trackName === name && this.suspended === suspended&&this.effectsPaused===effectsPaused) return;
    this.suspended = suspended;
    this.effectsPaused=effectsPaused;
    if(effectsPaused)this.bufferedEffects?.stop();
    if (this.trackName !== name) {
      this.trackName = name;
      if (!this.track.getAttribute('src')) this.track.src = new URL('./audio-original/music-loop.mp3', import.meta.url).href;
    }
    this.sync();
  }

  play(name) {
    if (!this.unlocked || document.hidden || !this.level('sfx')) return;

    let pool = this.effects.get(name);
    if (!pool) this.effects.set(name, pool = []);
    const now = performance.now();
    if (now - (pool.last || -Infinity) < 65) return;
    pool.last = now;
    const allowed=()=>this.unlocked&&!document.hidden&&!this.effectsPaused&&this.level('sfx')>0;
    if(this.bufferedEffects){
      this.bufferedEffects.setVolume(this.level('sfx'));
      void this.bufferedEffects.play(effectURL(name),{allowed}).then(played=>{if(!played&&allowed())this.playMedia(name,pool);});
    }else this.playMedia(name,pool);
  }

  playMedia(name,pool){
    let voice = pool.find(item => item.paused || item.ended);
    if (!voice) {
      if (pool.length >= 3) return;
      voice = new Audio(effectURL(name));
      pool.push(voice);
    }
    voice.volume = this.level('sfx');
    voice.currentTime = 0;
    voice.play().catch(() => {});
  }

}
