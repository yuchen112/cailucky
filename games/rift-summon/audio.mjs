const sounds = {deploy:[280,500],attack:[340,120],hit:[140,55],death:[200,65],hero:[440,880],skill:[650,330],end:[523,784]};
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
function clip(kind) {
  if (buffers.has(kind)) return buffers.get(kind);
  const [from,to] = sounds[kind];
  const duration = kind === 'hero' || kind === 'end' ? .32 : .18;
  const size = Math.ceil(duration * context.sampleRate);
  const buffer = context.createBuffer(1,size,context.sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;
  for (let i=0;i<size;i++) {
    const progress = i / size;
    const freq = from + (to - from) * progress;
    phase += 2 * Math.PI * freq / context.sampleRate;
    data[i] = (Math.sin(phase) + .28 * Math.sin(phase * 2.01)) * Math.min(1,i/100) * (1-progress)**2 * .22;
  }
  buffers.set(kind, buffer);
  return buffer;
}
export function prepare() {
  if (context) for (const kind of Object.keys(sounds)) clip(kind);
}
export function play(kind) {
  if (!sounds[kind] || context?.state !== 'running' || document.hidden || muted || active.size >= 6) return;
  if ([...active].filter(entry => entry.kind === kind).length >= 2) return;
  const source=context.createBufferSource();
  source.buffer=clip(kind);
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
    lobby:[57,64,69,71,69,64,60,64,55,62,67,69,67,62,59,64],
    battle:[45,57,60,64,43,55,59,62,41,53,57,60,43,55,62,64],
    boss:[38,50,53,57,37,49,52,55,36,48,51,55,37,49,55,58],
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
    samples[i] = ((Math.sin(phase)+.25*Math.sin(2*phase)) * Math.exp(-local*4)*.25 + pad) * attack*release;
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
