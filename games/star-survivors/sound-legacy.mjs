const assets = new URL('./audio-legacy/', import.meta.url);
const cueNames = new Set([
  'hover', 'click', 'pickup', 'shoot', 'hit', 'dash', 'hurt', 'pulse', 'meteor',
  'chain', 'beam', 'shatter', 'summon', 'boss', 'upgrade', 'chest', 'evolve', 'win', 'lose'
]);
const quietCues = new Set(['hover', 'hit', 'shoot', 'summon', 'pickup']);

export class Sound {
  constructor(muted = false) {
    this._muted = muted;
    this.unlocked = false;
    this.mode = 'home';
    this.boss = false;
    this.track = new Audio();
    this.track.loop = true;
    this.track.preload = 'none';
    this.track.volume = .32;
    this.effects = new Map();
    this.last = new Map();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopEffects();
      this.syncMusic();
    });
    addEventListener('pagehide', () => {
      this.track.pause();
      this.stopEffects();
    });
    addEventListener('pageshow', () => this.syncMusic());
  }

  get muted() { return this._muted; }

  set muted(value) {
    this._muted = value;
    if (value) this.stopEffects();
    this.syncMusic();
  }

  unlock() {
    if (this.muted) return;
    this.unlocked = true;
    this.syncMusic();
  }

  stopEffects() {
    for (const pool of this.effects.values()) for (const voice of pool) voice.pause();
  }

  music(mode, boss = false) {
    if (mode === this.mode && boss === this.boss) return;
    this.mode = mode;
    this.boss = boss;
    this.syncMusic();
  }

  syncMusic() {
    if (!this.unlocked || this.muted || document.hidden || !['home', 'playing', 'upgrade', 'cinematic'].includes(this.mode)) {
      this.track.pause();
      return;
    }
    const scene = this.mode === 'home' ? 'camp' : this.boss ? 'boss' : 'battle';
    if (scene !== this.scene) {
      this.scene = scene;
      this.track.src = new URL('music-' + scene + '.mp3', assets).href;
    }
    this.track.volume = this.mode === 'upgrade' || this.mode === 'cinematic' ? .18 : .32;
    if (this.track.paused) this.track.play().catch(() => {});
  }

  play(name) {
    if (!this.unlocked || this.muted || document.hidden || !cueNames.has(name)) return;
    const now = performance.now();
    const gap = name === 'summon' ? 200 : quietCues.has(name) ? 85 : 50;
    if (now - (this.last.get(name) ?? -Infinity) < gap) return;
    this.last.set(name, now);

    let pool = this.effects.get(name);
    if (!pool) this.effects.set(name, pool = []);
    let voice = pool.find(item => item.paused || item.ended);
    if (!voice) {
      if (pool.length >= 3) return;
      voice = new Audio(new URL(name + '.wav', assets).href);
      voice.preload = 'none';
      pool.push(voice);
    }
    voice.volume = quietCues.has(name) ? .27 : .58;
    voice.currentTime = 0;
    voice.play().catch(() => {});
  }
}
