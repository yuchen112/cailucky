"""Original CxQ Starwish trial music and foley. No external recordings or samples.

Render with Python + NumPy; then encode-audio.py <ffmpeg-path> for runtime MP3.
All notes, voicings, rhythms, envelopes and synthesis here are original to this title.
"""
from pathlib import Path
import hashlib,json,wave
import numpy as np

ROOT=Path(__file__).resolve().parents[1]/'audio'
ROOT.mkdir(parents=True,exist_ok=True)
SR=24000
RNG=np.random.default_rng(31112026)
ENTRIES=[]

def instrument(note,duration,voice):
    t=np.arange(round(duration*SR))/SR
    f=440*2**((note-69)/12)
    tail=np.minimum(1,(duration-t)*70)
    if voice=='cloud':
        # Slow, mildly detuned reed/strings body; a single smooth swell per chord.
        env=np.sin(np.pi*np.minimum(t/duration,1))**1.6
        y=(np.sin(2*np.pi*f*t)+.18*np.sin(2*np.pi*f*2*t)+.065*np.sin(2*np.pi*f*3*t))
        y=(y+.12*np.sin(2*np.pi*f*1.0015*t))*env*.46
    elif voice=='harp':
        y=(np.sin(2*np.pi*f*t)+.34*np.sin(2*np.pi*f*2*t)*np.exp(-t*5)+.12*np.sin(2*np.pi*f*4*t)*np.exp(-t*9))
        y*=np.exp(-t*3.5)*(1-np.exp(-t*300))
    elif voice=='marimba':
        y=np.sin(2*np.pi*f*t)*np.exp(-t*5)+.23*np.sin(2*np.pi*f*3.98*t)*np.exp(-t*14)+.08*np.sin(2*np.pi*f*9.1*t)*np.exp(-t*24)
        y*=1-np.exp(-t*800)
    elif voice=='celesta':
        y=np.sin(2*np.pi*f*t)*np.exp(-t*2.5)+.19*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*5.5)+.07*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*10)
        y*=1-np.exp(-t*220)
    elif voice=='bass':
        y=(np.sin(2*np.pi*f*t)+.16*np.sin(2*np.pi*f*2*t))*np.sin(np.pi*np.minimum(t/duration,1))**.8
    elif voice=='brass':
        y=(np.sin(2*np.pi*f*t)+.34*np.sin(2*np.pi*f*2*t)+.13*np.sin(2*np.pi*f*3*t))*np.exp(-t*8)*(1-np.exp(-t*190))
    else:raise ValueError(voice)
    return y*tail

def noise(duration,lo,hi):
    n=round(duration*SR);x=RNG.normal(0,1,n);f=np.fft.rfftfreq(n,1/SR)
    mask=(1-np.exp(-(f/max(1,lo))**4))*np.exp(-(f/hi)**6)
    y=np.fft.irfft(np.fft.rfft(x)*mask,n)
    return y/max(1,np.max(np.abs(y)))

def add(a,y,at,amp=1,pan=0,wrap=False):
    idx=np.arange(len(y))+round(at*SR)
    z=y[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])[None,:]*amp
    if wrap:np.add.at(a,idx%len(a),z)
    else:
        valid=(idx>=0)&(idx<len(a));a[idx[valid]]+=z[valid]

def reverb(a,loop=False):
    dry=a.copy()
    for seconds,gain in [(.083,.11),(.173,.08),(.307,.06),(.457,.04),(.701,.02)]:
        n=round(seconds*SR)
        if loop:a+=np.roll(dry[:,::-1],n,axis=0)*gain
        elif n<len(a):a[n:]+=dry[:-n,::-1]*gain
    return a

def save(name,a,kind,description,bpm=None):
    # Fixed restrained loudness; no clipping, source RMS carried in manifest.
    target=.063 if kind=='music' else .043
    rms=float(np.sqrt(np.mean(a*a)))
    if rms:a*=min(target/rms,3)
    peak=float(np.max(np.abs(a)))
    limit=.60 if kind=='music' else .37
    if peak>limit:a*=limit/peak
    path=ROOT/(name+'.wav')
    with wave.open(str(path),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes(np.int16(np.clip(a,-1,1)*32767).tobytes())
    entry={'id':name,'file':path.name,'kind':kind,'seconds':round(len(a)/SR,6),'sampleRate':SR,'channels':2,'peak':round(float(np.max(np.abs(a))),6),'rms':round(float(np.sqrt(np.mean(a*a))),6),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'description':description,'origin':'original Starwish synthesis; no external sample or reused game recording'}
    if bpm:entry.update(bpm=bpm,key='D major / occasional Lydian colour',loop=True,loopStart=0,loopEnd=round(len(a)/SR,6))
    ENTRIES.append(entry)

# New D-major chord language and melodies. No Picture Realm motifs are reused.
CHORDS=[[50,57,61,66],[47,54,57,62],[43,50,54,59],[45,52,57,61],[42,50,57,62],[40,47,54,57],[43,50,54,61],[45,52,55,61]]
MELODIES=[
 [78,81,76,78,74,71,73,76],
 [81,85,83,78,76,78,74,73],
 [78,76,73,74,81,78,76,73],
 [83,81,78,76,74,73,71,69]
]

def music(name,bpm,bars,collection=False):
    beat=60/bpm;length=bars*4*beat;a=np.zeros((round(length*SR),2))
    for bar in range(bars):
        chord=CHORDS[bar%8];start=bar*4*beat;section=bar//8
        # Two compatible arrangements alternate every eight bars.
        for j,n in enumerate(chord):add(a,instrument(n,beat*4,'cloud'),start,.069 if not collection else .085,-.6+j*.4,True)
        for step in [0,2]:add(a,instrument(chord[0]-12,beat*1.7,'bass'),start+step*beat,.12 if not collection else .085,-.08,True)
        pattern=[0,2,1,3,2,0,3,1]
        for eighth in range(8):
            if collection and eighth%2:continue
            note=chord[pattern[eighth]]+12
            add(a,instrument(note,1.3,'harp'),start+eighth*beat/2,.095 if not collection else .071,.48*(-1 if eighth%2 else 1),True)
        motif=MELODIES[(section+(1 if collection else 0))%4]
        for step in range(4):
            # Breathing spaces on cadence bars prevent constant busy melody.
            if bar%4==3 and step>1:continue
            if collection and bar%2==1 and step==2:continue
            note=motif[(bar%2)*4+step]-(12 if collection else 0)
            add(a,instrument(note,2.5 if collection else 1.9,'celesta' if collection or section%2==0 else 'marimba'),start+(step+.08)*beat,.12 if not collection else .103,.18,True)
        if not collection:
            # Quiet brushed clockwork pulse, distinct from Picture Realm sound.
            for step in range(8):
                d=.075;t=np.arange(round(d*SR))/SR
                brush=noise(d,1700,6300)*np.exp(-t*55)*np.minimum(1,t*900)
                add(a,brush,start+step*beat/2,.032 if step%2 else .048,-.45 if step%2 else .45,True)
            if section%2==1:
                for step in [1.5,3.5]:add(a,instrument(chord[2]+12,.45,'marimba'),start+step*beat,.055,-.2,True)
    reverb(a,True)
    save(name,a,'music','月光星願工坊：溫暖木琴、豎琴、星鐘與輕刷節拍' if not collection else '星願收藏夜曲：稀疏星鐘與柔和豎琴和聲',bpm)

music('music-home',92,32)
music('music-collection',70,24,True)

def effect(name,notes,description,voice='brass',duration=.6,texture=None):
    a=np.zeros((round(duration*SR),2))
    for i,(note,at,d,g) in enumerate(notes):add(a,instrument(note,d,voice),at,g,-.14 if i%2 else .14)
    if texture:
        d,lo,hi,g,decay=texture;t=np.arange(round(d*SR))/SR
        add(a,noise(d,lo,hi)*np.exp(-t*decay)*(1-np.exp(-t*700)),0,g)
    reverb(a);save(name,a,'sfx',description)

effect('tap',[(74,0,.12,.19)],'深藍介面上的溫潤銅木輕點',voice='marimba',duration=.25,texture=(.05,300,2100,.08,65))
effect('back',[(73,0,.16,.16),(69,.055,.18,.14)],'返回頁面的下降木琴短句',voice='marimba',duration=.4)
effect('collect',[(62,0,.085,.14),(74,.012,.065,.055)],'快速收集星願：短促柔木與小銅鈴，不刺耳',voice='marimba',duration=.15,texture=(.035,300,1900,.055,95))
effect('critical',[(81,0,.22,.18),(85,.04,.3,.12)],'星願暴擊：明亮但柔和的雙星鐘',voice='celesta',duration=.65)
effect('buy',[(62,0,.2,.18),(69,.075,.25,.16),(74,.14,.35,.18)],'購買成功：銅木裝置啟動的上行短句',voice='brass',duration=.75,texture=(.10,250,2500,.06,30))
effect('upgrade',[(66,0,.4,.16),(73,.09,.45,.16),(78,.18,.55,.18),(81,.3,.6,.14)],'升級完成：豎琴轉為星鐘的輕盈上升',voice='harp',duration=1.3)
effect('achievement',[(74,0,.65,.17),(78,.15,.65,.17),(81,.3,.7,.17),(86,.5,1.2,.19),(78,.5,1,.08)],'成就解鎖：D 大調星願招牌樂句',voice='celesta',duration=2.3)
effect('denied',[(55,0,.1,.12),(54,.085,.12,.10)],'資源不足：低音木質輕碰',voice='marimba',duration=.35)
effect('cometAppear',[(81,0,.38,.12),(88,.13,.5,.12),(90,.27,.65,.13)],'流星願出現：高空玻璃星砂信號',voice='celesta',duration=1.35,texture=(.4,1800,6800,.055,8))
effect('cometGift',[(74,0,.35,.15),(81,.08,.4,.15),(85,.18,.45,.16),(90,.3,.65,.17)],'流星願贈禮：暖金星砂連落',voice='harp',duration=1.4)
effect('cometBoost',[(62,0,.3,.14),(69,.07,.4,.14),(74,.14,.5,.16),(81,.28,.7,.17),(86,.43,.9,.18)],'流星願增益啟動：銅鐘與星光展開',voice='brass',duration=1.65,texture=(.35,700,4200,.05,9))
effect('skin',[(78,0,.4,.13),(83,.13,.5,.13),(86,.26,.7,.14)],'換裝：輕盈織線與玻璃星片',voice='harp',duration=1.4,texture=(.25,1200,5400,.06,12))
effect('save',[(69,0,.14,.14),(74,.07,.2,.14)],'備份儲存完成的柔木確認',voice='marimba',duration=.45)
effect('offline',[(62,0,.5,.13),(66,.14,.6,.14),(69,.28,.7,.14),(74,.45,.9,.15)],'歸來領取離線星願：溫暖迎接樂句',voice='harp',duration=1.8)
effect('burst',[(74,0,.4,.13),(78,0,.4,.10),(81,.08,.5,.14),(86,.2,.8,.16)],'星願共鳴爆發：短和弦與星砂擴散',voice='celesta',duration=1.5,texture=(.3,900,5400,.07,12))

manifest={'version':'20261103-starwish-audio1','title':'CxQ 星願旅團：點亮夢境｜試玩版','authorship':'Original procedural composition, synthesis and foley created for this Starwish trial. No sampled recordings, borrowed melodies, or audio copied from Picture Realm or other games. Not represented as AI-generated music or human performance.','sampleRate':SR,'channels':2,'tracks':ENTRIES}
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'files':len(ENTRIES),'allPeaksBelowOne':all(t['peak']<1 for t in ENTRIES),'allAudible':all(t['rms']>.005 for t in ENTRIES),'musicSeconds':[t['seconds'] for t in ENTRIES if t['kind']=='music']},indent=2))
