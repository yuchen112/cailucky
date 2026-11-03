const root = new URL('./audio/v5/', import.meta.url);
const maps = new Set(['forest', 'cave', 'clock', 'coast', 'sky']);

export class Sound {
  constructor(preferences) {
    this.preferences = preferences;
    this.track = new Audio();
    this.track.loop = true;
    this.effects = new Map();
    this.unlocked = false;
    document.addEventListener('visibilitychange', () => this.sync());
  }

  unlock() {
    this.unlocked = true;
    this.rejected = false;
    this.sync();
  }

  setPreferences(preferences) {
    this.preferences = preferences;
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
    const suspended = ['paused', 'result'].includes(mode);
    if (this.trackName === name && this.suspended === suspended) return;
    this.suspended = suspended;
    if (this.trackName !== name) {
      this.trackName = name;
      this.track.src = new URL('music-' + name + '.mp3', root).href;
    }
    this.sync();
  }

  play(name) {
    if (!this.unlocked || document.hidden || !this.level('sfx')) return;
    name = name === 'shoot' ? 'attack-joy' : name;
    let pool = this.effects.get(name);
    if (!pool) this.effects.set(name, pool = []);
    const now = performance.now();
    if (now - (pool.last || -Infinity) < 65) return;
    pool.last = now;
    let voice = pool.find(item => item.paused || item.ended);
    if (!voice) {
      if (pool.length >= 3) return;
      voice = new Audio(new URL(name + '.wav', root).href);
      pool.push(voice);
    }
    voice.volume = this.level('sfx');
    voice.currentTime = 0;
    voice.play().catch(() => {});
  }
}
