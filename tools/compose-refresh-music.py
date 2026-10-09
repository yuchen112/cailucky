"""Original, deterministic stereo scores; no external samples or player data."""
import json, math, pathlib, subprocess, wave
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'games/shared/audio-v3'; OUT.mkdir(parents=True,exist_ok=True)
TMP=ROOT/'outputs/integrated-refresh-20261009/music'; TMP.mkdir(parents=True,exist_ok=True)
SR=32000
SPECS=[('dino',118,62,'pluck'),('flappy',102,67,'flute'),('merge',88,60,'marimba'),('mines',82,57,'piano'),('whack',130,65,'pluck'),('dream-match',96,64,'celesta'),('magic-bubble',114,69,'flute'),('2048',92,62,'piano'),('brick-breaker',126,60,'synth'),('click-core',108,65,'marimba'),('link',98,67,'celesta'),('memory',78,59,'piano'),('tetris',136,62,'synth'),('fortune',72,60,'flute'),('poker',94,57,'piano'),('richman',110,65,'marimba'),('lucky-town',104,62,'celesta'),('heartlight-duel',140,64,'synth'),('fairytale-defense',116,57,'pluck')]
def add(a,t,d,midi,gain,kind,pan=0):
 start=int(t*SR); n=min(int(d*SR),len(a)-start)
 if n<=0:return
 s=np.arange(n,dtype=np.float32)/SR; f=440*2**((midi-69)/12); p=2*np.pi*f*s
 attack=np.minimum(1,s/(.025 if kind=='flute' else .008))
 if kind=='flute': v=np.sin(p)+.18*np.sin(2*p)+.06*np.sin(3*p); env=attack*np.minimum(1,(d-s)/.09)*np.exp(-s/(d*2))
 elif kind=='synth':v=np.sin(p)+.34*np.sin(2*p)+.2*np.sin(3*p)+.09*np.sin(4*p);env=attack*np.exp(-s/(d*.65))
 elif kind=='marimba':v=np.sin(p)*np.exp(-s*4)+.4*np.sin(3.99*p)*np.exp(-s*13)+.12*np.sin(10*p)*np.exp(-s*22);env=attack*np.exp(-s/(d*.7))
 elif kind=='celesta':v=np.sin(p)+.35*np.sin(2.01*p)*np.exp(-s*7)+.15*np.sin(5.97*p)*np.exp(-s*12);env=attack*np.exp(-s/(d*.5))
 elif kind=='pad':v=.6*np.sin(p)+.2*np.sin(p*1.003)+.12*np.sin(2*p);env=np.minimum(1,s/.15)*np.minimum(1,(d-s)/.3)
 else:v=np.sin(p)+.3*np.sin(2*p)*np.exp(-s*5)+.16*np.sin(3*p)*np.exp(-s*9)+.08*np.sin(5*p)*np.exp(-s*18);env=attack*np.exp(-s/(d*.5))
 signal=(v*env*gain).astype(np.float32)
 a[start:start+n,0]+=signal*math.sqrt((1-pan)/2);a[start:start+n,1]+=signal*math.sqrt((1+pan)/2)
def drum(a,t,kind,rng,gain):
 d=.24 if kind=='kick' else .13 if kind=='snare' else .04;start=int(t*SR);n=min(int(d*SR),len(a)-start);s=np.arange(n)/SR
 if kind=='kick':v=np.sin(2*np.pi*(65*s-80*s*s))*np.exp(-s*24)
 else:v=rng.uniform(-1,1,n)*np.exp(-s*(28 if kind=='snare' else 120))
 a[start:start+n]+=((v*gain)[:,None]).astype(np.float32)
manifest={'originalComposition':True,'externalSamples':False,'sampleRate':SR,'channels':2,'tracks':[]}
for ordinal,(id,bpm,key,instrument) in enumerate(SPECS):
 rng=np.random.default_rng(8910+ordinal);beat=60/bpm;seconds=beat*128+2;a=np.zeros((int(seconds*SR),2),dtype=np.float32)
 quiet=id in ['mines','memory','fortune','poker','2048','merge'];minor=id in ['heartlight-duel','fairytale-defense','memory','fortune'];scale=[0,2,3 if minor else 4,5,7,8 if minor else 9,10 if minor else 11,12]
 progressions=[[0,5,3,4],[0,3,5,4],[0,4,5,3],[0,5,1,4]];prog=progressions[ordinal%4];motif=[int(x) for x in rng.integers(0,8,8)];motif[0]=0;motif[-1]=4
 for bar in range(32):
  section=bar//8;root=key+scale[prog[bar%4]];t=bar*4*beat
  for tone in [0,3 if minor else 4,7]:add(a,t,beat*3.9,root+tone,.032,'pad',(-.35 if tone==0 else .35))
  for k in range(4):
   if not quiet or k%2==0:add(a,t+k*beat,beat*.85,root-24+(7 if k==2 else 0),.085,'pluck')
   if not quiet:drum(a,t+k*beat,'snare' if k%2 else 'kick',rng,.055);drum(a,t+(k+.5)*beat,'hat',rng,.014)
  for k in range(8):
   if (section==0 and k%3==1) or (section==3 and bar%4==3 and k>4):continue
   degree=(motif[(k+bar%2*2)%8]+(1 if section==1 else 0))%8;pitch=root+12+scale[degree]
   add(a,t+k*beat/2,beat*(1.4 if quiet else .85),pitch,.07,instrument,-.2 if k%2 else .2)
   if section==2 and k%2==0:add(a,t+(k+.3)*beat/2,beat*.7,pitch+12,.025,'celesta',.55)
  if section in [1,2] and bar%2: add(a,t+3*beat,beat*1.4,root+19,.035,'flute',-.55)
 # Stereo room reflections and smooth boundaries; score repeats only after 32 changing bars.
 delay=int(SR*.19);a[delay:,0]+=.16*a[:-delay,1];a[delay:,1]+=.16*a[:-delay,0]
 fade=int(SR*.35);a[:fade]*=np.linspace(0,1,fade)[:,None];a[-int(SR*1.8):]*=np.linspace(1,0,int(SR*1.8))[:,None]
 peak=float(np.max(np.abs(a)));a=np.tanh(a/max(.4,peak)*.85);pcm=(a*28000).astype('<i2');wav=TMP/(id+'.wav')
 with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
 ffmpeg=json.loads((TMP/'ffmpeg.json').read_text())
 subprocess.run([ffmpeg,'-y','-hide_banner','-loglevel','error','-i',str(wav),'-codec:a','libmp3lame','-b:a','112k',str(OUT/(id+'.mp3'))],check=True)
 manifest['tracks'].append({'id':id,'file':id+'.mp3','bpm':bpm,'instrument':instrument,'motif':motif,'seconds':seconds,'rms':float(np.sqrt(np.mean(a*a))),'peak':float(np.max(np.abs(a))),'bytes':(OUT/(id+'.mp3')).stat().st_size})
 print('Composed '+id,flush=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
(OUT/'CREDITS.md').write_text('CxQ original stereo scores, 2026-10-09. Procedural synthesis from original melodies; no external samples. Source: tools/compose-refresh-music.py. Existing credited music remains available in the playlist.\n',encoding='utf8')
