const sounds = {deploy:[280,500],attack:[340,120],hit:[140,55],death:[200,65],hero:[440,880],skill:[650,330],end:[523,784],capsule:[190,830],reveal:[780,1370],coin:[1280,660],upgrade:[420,1050]};
Object.assign(sounds,{
  'summon-gold':[115,61],'summon-gems':[780,1530],
  'reveal-card':[480,1030],'reveal-rune':[360,660],'reveal-hero':[175,485],
  'rank-N':[490,510],'rank-R':[650,880],'rank-SR':[750,1180],'rank-S':[660,1320],
  'rank-SS':[580,1480],'rank-SSR':[395,1490],'rank-UUR':[300,1760],
  shield:[1040,280],impact:[87,49],rune:[540,1080],
});
const heroSound = {
  hope:[620,1120], trust:[294,588], growth:[315,720], healing:[640,480], joy:[510,1360],
  luck:[900,350], memory:[390,850], night:[440,630], sadness:[980,510], dream:[580,1520],
};
let context, bus, music, musicBus;
const buffers = new Map();
const tracks = new Map();
const active = new Set();
let muted = false;
let levels = {sfx:.65,bgm:.17};

export async function unlock() {
  try {
    const Audio = window.AudioContext ?? window.webkitAudioContext;
    if (!Audio) return;
    if (!context) {
      context = new Audio();
      bus = context.createGain();
      bus.gain.value = muted ? 0 : levels.sfx;
      bus.connect(context.destination);
    }
    await context.resume();
  } catch {}
}
function clip(kind, hero) {
  const specific = kind === 'hero' && heroSound[hero];
  const key = specific ? `hero:${hero}` : kind;
  if (buffers.has(key)) return buffers.get(key);
  const [from,to] = specific || sounds[kind];
  const duration = kind.startsWith('rank-') ? .29 : kind.startsWith('summon-')||kind==='hero'||kind==='end' ? .48 : .22;
  const size = Math.ceil(duration * context.sampleRate);
  const buffer = context.createBuffer(1,size,context.sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;
  for (let i=0;i<size;i++) {
    const progress = i / size;
    const freq = from + (to - from) * progress;
    phase += 2 * Math.PI * freq / context.sampleRate;
    const overtone = specific ? .25 * Math.sin(phase * 1.5) + .12 * Math.sin(phase * 2.74) : .28 * Math.sin(phase * 2.01);
    const metallic=kind==='shield'||kind==='deploy'||kind==='summon-gold';
    const impact=['attack','hit','death','impact'].includes(kind);
    const grit=impact||metallic?(Math.random()*2-1)*Math.exp(-progress*15)*.55:0;
    const spectrum=metallic?.25*Math.sin(phase*3.48):0;
    const fifth=kind.startsWith('rank-')?.24*Math.sin(phase*1.5):0;
    data[i]=(Math.sin(phase)+overtone+grit+spectrum+fifth)*Math.min(1,i/100)*(1-progress)**2*.19;
  }
  buffers.set(key, buffer);
  return buffer;
}
export function prepare(hero) {
  if (context) for (const kind of Object.keys(sounds)) clip(kind,hero);
}
export function play(kind, hero) {
  if (!sounds[kind] || context?.state !== 'running' || document.hidden || muted || active.size >= 6) return;
  if ([...active].filter(entry => entry.kind === kind).length >= 2) return;
  const source=context.createBufferSource();
  source.buffer=clip(kind,hero);
  source.connect(bus);
  const entry={kind,source};
  active.add(entry);
  source.onended=()=>active.delete(entry);
  source.start();
}
export function toggleMute() {
  muted = !muted;
  updateVolume(levels);
  return muted;
}
export function updateVolume(next) {
  levels = next;
  if (bus) bus.gain.value = muted ? 0 : levels.sfx;
  if (musicBus) musicBus.gain.value = muted ? 0 : levels.bgm;
}
function score(scene) {
  if (tracks.has(scene)) return tracks.get(scene);
  const phrases = {
    title:[57,64,69,72,71,69,64,60,55,62,67,71,69,67,64,57],
    lobby:[57,64,69,71,69,64,60,64,55,62,67,69,67,62,59,64],
    battle:[45,57,60,64,43,55,59,62,41,53,57,60,43,55,62,64],
    boss:[38,50,53,57,37,49,52,55,36,48,51,55,37,49,55,58],
    capsule:[60,67,72,76,62,69,74,77,64,71,76,79,67,74,79,83],
    end:[60,64,67,72,67,72,76,72],
    loss:[57,60,64,62,55,52,48,45],
  };
  const notes = phrases[scene];
  const period = scene === 'boss' ? .33 : scene === 'battle' ? .42 : .65;
  const rate = context.sampleRate;
  const length = Math.floor(notes.length * period * rate);
  const buffer = context.createBuffer(1,length,rate);
  const samples = buffer.getChannelData(0);
  for (let i=0;i<length;i++) {
    const time = i/rate;
    const note = Math.floor(time/period);
    const local = time - note*period;
    const frequency = 440 * 2**((notes[note]-69)/12);
    const phase = 2*Math.PI*frequency*local;
    const bass = 440 * 2**((notes[note-note%4]-81)/12);
    const attack = Math.min(1,local*90);
    const release = Math.min(1,(period-local)*18);
    const pad = Math.sin(2*Math.PI*bass*time)*.15 + Math.sin(2*Math.PI*bass*1.5*time)*.065;
    const pulse=scene==='battle'||scene==='boss';
    const drum=pulse&&note%2===0?Math.sin(2*Math.PI*(51*local+1.8*(1-Math.exp(-local*34))))*Math.exp(-local*18)*.28:0;
    const harmony=(Math.sin(2*Math.PI*bass*2.51*time)+Math.sin(2*Math.PI*bass*3*time))*.033;
    const lead=(Math.sin(phase)+.23*Math.sin(2*phase)+.055*Math.sin(3*phase))*Math.exp(-local*(pulse?7:4))*.24;
    samples[i]=(lead+pad+harmony+drum)*attack*release;
  }
  tracks.set(scene,buffer);
  return buffer;
}
export function setMusic(scene) {
  if (!context) return;
  music?.stop();
  music = null;
  if (!scene || document.hidden || context.state !== 'running') return;
  music = context.createBufferSource();
  music.buffer = score(scene);
  music.loop = scene !== 'end' && scene !== 'loss';
  if (!musicBus) {
    musicBus = context.createGain();
    musicBus.connect(context.destination);
  }
  musicBus.gain.value = muted ? 0 : levels.bgm;
  music.connect(musicBus);
  music.start();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    setMusic(null);
    for (const entry of active) entry.source.stop();
    active.clear();
  }
});
