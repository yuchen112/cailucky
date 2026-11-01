"""Encode original WAV masters for lightweight playback. Usage: script ffmpeg-path."""
from pathlib import Path
import subprocess,json,hashlib,sys
root=Path(__file__).resolve().parents[1]/'audio'
manifest=json.loads((root/'manifest.json').read_text(encoding='utf8'))
for track in manifest['tracks']:
 if track['kind']!='music':continue
 source=root/(track['id']+'.wav');target=source.with_suffix('.mp3')
 subprocess.run([sys.argv[1],'-hide_banner','-loglevel','error','-y','-i',str(source),'-c:a','libmp3lame','-b:a','112k','-ar','24000','-write_xing','1',str(target)],check=True)
 track['master']=source.name;track['file']=target.name;track['sha256']=hashlib.sha256(target.read_bytes()).hexdigest()
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print('Playback bytes:',sum((root/t['file']).stat().st_size for t in manifest['tracks']))
