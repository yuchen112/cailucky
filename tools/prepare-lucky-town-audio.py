from pathlib import Path
import subprocess,shutil,json,os
root=Path(__file__).resolve().parents[1];out=root/'games/lucky-town/audio'
ff=Path(os.environ.get('LUCKY_TOWN_FFMPEG') or shutil.which('ffmpeg') or '')
if not ff.is_file():raise RuntimeError('Set LUCKY_TOWN_FFMPEG to a working FFmpeg executable')
for zone,name in [('intro','carefree'),('town','daily-beetle'),('arcade','pixelland'),('home','wallpaper')]:
 subprocess.run([str(ff),'-hide_banner','-loglevel','error','-y','-ss','8','-i',str(out/(name+'.mp3')),'-t','48','-af','loudnorm=I=-20:TP=-2:LRA=8,afade=t=in:d=0.7,afade=t=out:st=47:d=1','-ar','44100','-ac','2','-b:a','96k',str(out/('music-'+zone+'.mp3'))],check=True)
sounds={'click':('ui-audio','click1'),'select':('ui-audio','switch2'),'coin':('casino-audio','chips-stack-3'),'roll':('casino-audio','dice-shake-1'),'stop':('casino-audio','chip-lay-1'),'scratch':('casino-audio','card-shove-2'),'reveal':('casino-audio','cards-pack-open-1'),'dress':('rpg-audio','cloth1'),'place':('rpg-audio','bookPlace1'),'step':('rpg-audio','footstep00'),'pet':('ui-audio','rollover3'),'win':('casino-audio','chips-handle-1'),'bigwin':('casino-audio','chips-collide-3')}
for name,(pack,src) in sounds.items():
 source=out/pack/(src+'.ogg')
 subprocess.run([str(ff),'-hide_banner','-loglevel','error','-y','-i',str(source),'-af','loudnorm=I=-20:TP=-2:LRA=7,afade=t=in:d=0.005','-ar','44100','-ac','1','-b:a','96k',str(out/('sfx-'+name+'.mp3'))],check=True)
for p in ['casino-audio','ui-audio','rpg-audio']:shutil.copyfile(out/p/'License.txt',out/(p+'-LICENSE.txt'))
print('Prepared 4 music loops and 13 licensed sound effects')
