"""Original Picture Realm score and foley. Deterministic, no external samples."""
from pathlib import Path
import numpy as np, wave, json, hashlib
ROOT=Path(__file__).resolve().parents[1]/'audio'
ROOT.mkdir(exist_ok=True)
SR=24000
rng=np.random.default_rng(61101)
entries=[]
def write(name,a,kind,description):
    entries[:]=[e for e in entries if e['id']!=name]
    peak=float(np.max(np.abs(a)))
    if peak>.88:a=a*.88/peak
    pcm=np.int16(np.clip(a,-1,1)*32767)
    p=ROOT/(name+'.wav')
    with wave.open(str(p),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR);f.writeframes(pcm.tobytes())
    entries.append(dict(id=name,file=p.name,kind=kind,seconds=round(len(a)/SR,3),peak=round(float(np.max(np.abs(a))),4),rms=round(float(np.sqrt(np.mean(a*a))),4),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),description=description))
def tone(midi,duration,voice='bell'):
    t=np.arange(int(SR*duration))/SR;f=440*2**((midi-69)/12)
    if voice=='pad':
        env=np.sin(np.pi*np.minimum(t/duration,1))**1.4
        y=(np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t)+.08*np.sin(2*np.pi*f*3*t))*env*.42
    elif voice=='felt':
        y=(np.sin(2*np.pi*f*t)*np.exp(-t*2.8)+.23*np.sin(2*np.pi*f*2*t)*np.exp(-t*6)+.07*np.sin(2*np.pi*f*3*t)*np.exp(-t*10))*(1-np.exp(-t*180))
    elif voice=='wood':
        y=(np.sin(2*np.pi*f*t)*np.exp(-t*25)+.25*np.sin(2*np.pi*f*2.7*t)*np.exp(-t*60))*(1-np.exp(-t*700))
    else:
        y=(np.sin(2*np.pi*f*t)*np.exp(-t*3.5)+.27*np.sin(2*np.pi*f*3*t)*np.exp(-t*6)+.08*np.sin(2*np.pi*f*5.02*t)*np.exp(-t*9))*(1-np.exp(-t*240))
    y*=np.minimum(1,(duration-t)*80)
    return y
def add(a,y,at,amp=1,pan=0,wrap=False):
    idx=np.arange(len(y))+int(at*SR)
    stereo=y[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])[None,:]*amp
    if wrap:np.add.at(a,idx%len(a),stereo)
    else:
        valid=idx<len(a);a[idx[valid]]+=stereo[valid]
def room(a,loop=False):
    dry=a.copy()
    for delay,g in [(.107,.12),(.227,.09),(.389,.065),(.613,.035)]:
        n=int(delay*SR)
        if loop:a+=np.roll(dry[:,::-1],n,axis=0)*g
        elif n<len(a):a[n:]+=dry[:-n,::-1]*g
    return a
progression=[[48,55,60,64],[55,59,62,67],[45,52,57,60],[53,57,60,65],[48,55,60,64],[52,55,59,64],[53,57,60,65],[55,59,62,67]]
motifs=[[76,79,83,79,74,76,72,67],[72,76,79,76,74,71,67,71],[79,76,72,76,81,79,76,74],[77,81,84,81,79,77,74,71]]
for k,name in enumerate(['home','slide','jigsaw','gallery']):
    bpm=[80,88,76,72][k];beat=60/bpm;duration=32*beat*2
    a=np.zeros((int(duration*SR),2))
    for bar in range(16):
        chord=progression[bar%8];start=bar*4*beat
        for j,n in enumerate(chord):add(a,tone(n,beat*4,'pad'),start,.075,(-.5+j/3),True)
        add(a,tone(chord[0]-12,beat*2,'felt'),start,.12,-.15,True)
        for step in range(8):
            n=chord[[0,2,1,3,2,1,3,2][step]]+12
            if k!=3 or step%2==0:add(a,tone(n,1.5,'felt'),start+step*beat/2,.10 if k!=1 else .12,(-1 if step%2 else 1)*.4,True)
        motif=motifs[(k+(bar//4))%4]
        for step in range(4):
            if bar%4==3 and step>1:continue
            n=motif[(bar%2)*4+step]
            if k==2:n-=12
            add(a,tone(n,2.1,'bell' if k in [0,3] else 'felt'),start+(step+.12)*beat,.11 if k!=3 else .09,.2,True)
    room(a,True)
    write('music-'+name,a,'music',['星光畫室：暖鋼琴與音樂盒','方塊漫步：輕快木琴與柔和鋼琴','拼片午後：舒緩低音鋼琴','珍藏相簿：慢速星光音樂盒'][k])
def fx(name,notes,description,voice='bell',duration=None):
    duration=duration or max(t+d for n,t,d,g in notes)+.7
    a=np.zeros((int(duration*SR),2))
    for i,(n,t,d,g) in enumerate(notes):add(a,tone(n,d,voice),t,g,(-.15 if i%2 else .15))
    room(a);write(name,a,'sfx',description)
fx('tap',[(79,0,.13,.24)],'柔和介面按鈕','wood',.35)
fx('slide',[(57,0,.1,.30),(64,.035,.1,.13)],'方塊滑入木製凹槽','wood',.32)
fx('pickup',[(76,0,.16,.19)],'拿起拼片','felt',.4)
fx('place',[(60,0,.14,.25)],'放下未接合拼片','wood',.35)
fx('snap',[(79,0,.25,.24),(84,.045,.35,.20)],'拼片成功接合',duration=.9)
fx('rotate',[(72,0,.12,.19),(76,.06,.15,.17)],'旋轉拼片','wood',.4)
fx('hint',[(76,0,.45,.2),(83,.12,.6,.18)],'提示與短暫看圖',duration=1.2)
fx('undo',[(76,0,.18,.18),(72,.07,.22,.17)],'復原一步','felt',.55)
fx('start',[(72,0,.35,.2),(76,.1,.35,.2),(79,.2,.55,.20)],'開啟隨機挑戰',duration=1.1)
fx('pause',[(72,0,.25,.18),(67,.1,.35,.15)],'暫停與返回','felt',.7)
fx('resume',[(67,0,.2,.16),(72,.1,.3,.18)],'繼續挑戰','felt',.65)
fx('page',[(74,0,.12,.13),(79,.035,.13,.10)],'翻頁與開啟相簿','wood',.35)
fx('download',[(72,0,.25,.18),(79,.09,.3,.17),(84,.18,.4,.19)],'下載與備份完成',duration=.95)
fx('error',[(60,0,.14,.14),(59,.12,.15,.12)],'無效操作與錯誤提示','felt',.5)
fx('win',[(72,0,.7,.21),(76,.16,.7,.21),(79,.32,.8,.21),(84,.55,1.4,.25),(76,.55,1.3,.10),(79,.55,1.3,.12)],'通關暖金色和弦',duration=2.8)
fx('unlock',[(84,0,.6,.19),(88,.13,.65,.17),(91,.26,.7,.17),(96,.42,1.1,.18)],'首次解鎖新圖鑑',duration=2.2)
# Exclusive tactile atelier foley: ceramic, paper and soft felt, not arcade beeps.
def texture(duration,low,high):
    n=int(duration*SR);x=rng.normal(0,1,n);f=np.fft.rfftfreq(n,1/SR)
    spectrum=np.fft.rfft(x);mask=(1-np.exp(-(f/max(1,low))**4))*np.exp(-(f/high)**6)
    y=np.fft.irfft(spectrum*mask,n);return y/max(.001,np.max(np.abs(y)))
def foley(name,duration,kind):
    a=np.zeros((int(duration*SR),2));t=np.arange(len(a))/SR
    if kind=='slide':
        brush=texture(duration,350,2800)*np.sin(np.pi*np.minimum(t/.19,1))**2*np.exp(-t*8)
        add(a,brush,0,.16,-.1);add(a,tone(83,.14,'wood'),.13,.22,.15);add(a,tone(64,.11,'wood'),.13,.13,-.1)
    elif kind=='page':
        brush=texture(duration,900,6500)*np.sin(np.pi*t/duration)**2
        add(a,brush,0,.13,-.3);add(a,tone(88,.18,'bell'),.1,.045,.4)
    elif kind=='pickup':
        brush=texture(duration,500,3900)*np.exp(-t*15)*(1-np.exp(-t*90))
        add(a,brush,0,.11,-.2);add(a,tone(79,.17,'felt'),.02,.09,.2)
    elif kind=='snap':
        brush=texture(duration,1300,7500)*np.exp(-t*70)*(1-np.exp(-t*600))
        add(a,brush,0,.18);add(a,tone(91,.28,'bell'),0,.16,-.2);add(a,tone(96,.35,'bell'),.045,.09,.3)
    elif kind=='place':
        brush=texture(duration,180,2400)*np.exp(-t*45)*(1-np.exp(-t*400))
        add(a,brush,0,.22);add(a,tone(60,.13,'wood'),0,.16)
    elif kind=='rotate':
        brush=texture(duration,600,3400)*np.exp(-t*20)*(1-np.exp(-t*180))
        add(a,brush,0,.10,-.2);add(a,tone(83,.10,'wood'),.045,.15,.1);add(a,tone(88,.11,'wood'),.11,.14,.25)
    room(a);write(name,a,'sfx',{'slide':'瓷片在絨布盤滑動並輕扣歸位','page':'柔軟紙頁翻動與細小星砂','pickup':'從絨布墊輕拿拼片','snap':'兩片瓷質拼圖接縫扣合與星砂泛音','place':'拼片輕落畫板','rotate':'拼片轉向的摩擦與瓷角輕扣'}[kind])
for name,duration in [('slide',.4),('page',.34),('pickup',.32),('snap',.85),('place',.3),('rotate',.4)]:foley(name,duration,name)
(ROOT/'manifest.json').write_text(json.dumps({'version':'20261101-audio1','copyright':'Original CxQ Picture Realm procedural composition and synthesized foley. No third-party recordings or samples.','sampleRate':SR,'channels':2,'tracks':entries},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'files':len(entries),'bytes':sum((ROOT/e['file']).stat().st_size for e in entries)},indent=2))
