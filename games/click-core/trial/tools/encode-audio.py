"""Encode original Starwish WAV music masters with gapless MP3 metadata."""
from pathlib import Path
import sys,subprocess,json,hashlib,wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]/'audio'
manifest=json.loads((ROOT/'manifest.json').read_text(encoding='utf8'))
for track in manifest['tracks']:
    source=ROOT/(track['id']+'.wav')
    if track['kind']=='music':
        dest=source.with_suffix('.mp3')
        subprocess.run([sys.argv[1],'-hide_banner','-loglevel','error','-y','-i',str(source),'-c:a','libmp3lame','-b:a','112k','-ar','24000','-write_xing','1',str(dest)],check=True)
        track['master']=source.name;track['masterSha256']=hashlib.sha256(source.read_bytes()).hexdigest();track['file']=dest.name;track['sha256']=hashlib.sha256(dest.read_bytes()).hexdigest()
    with wave.open(str(source),'rb') as w:
        assert w.getnchannels()==2 and w.getframerate()==24000 and w.getsampwidth()==2
        data=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float64)/32768
        assert np.max(np.abs(data))<.99,track['id']
        assert np.sqrt(np.mean(data*data))>.005,track['id']
        assert abs(len(data)/2/24000-track['seconds'])<.001
(ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'tracks':len(manifest['tracks']),'runtimeBytes':sum((ROOT/t['file']).stat().st_size for t in manifest['tracks']),'validation':'PASS: stereo PCM masters, duration, audible RMS, no clipping, SHA256 recorded'},indent=2))
