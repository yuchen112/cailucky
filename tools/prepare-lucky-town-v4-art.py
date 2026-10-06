from pathlib import Path
import json, shutil
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]
art=root/'games/lucky-town/art'; out=root/'preview/lucky-town/v4';out.mkdir(parents=True,exist_ok=True)
jobs=json.loads((art/'generation-v4-prompts.json').read_text(encoding='utf8'))
manifest={j['id']:j for j in json.loads((art/'manifest.json').read_text(encoding='utf8'))}
for j in jobs:
 src=Path(j['source']);png=art/(j['id']+'.png');shutil.copy2(src,png);im=Image.open(src).convert('RGBA')
 if j['id'].startswith(('outfit-','sit-','walk-','furniture-')):
  box=im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
  if box:im=im.crop(box)
  im.thumbnail((700,700),Image.Resampling.LANCZOS)
 else:im.thumbnail((1200,900),Image.Resampling.LANCZOS)
 dst=png.with_suffix('.webp');im.save(dst,'WEBP',quality=90,method=4)
 manifest[j['id']]={'id':j['id'],'file':dst.name,'size':list(im.size),'alpha':im.getchannel('A').getextrema()[0]<255,'bytes':dst.stat().st_size}
(art/'manifest.json').write_text(json.dumps(list(manifest.values()),ensure_ascii=False,indent=2),encoding='utf8')
for kind,cols,w,h in [('outfit-',5,200,230),('furniture-',8,150,175),('room-',3,400,285),('window-',3,300,280)]:
 items=[j for j in jobs if j['id'].startswith(kind)]
 if not items:continue
 board=Image.new('RGB',(cols*w,((len(items)+cols-1)//cols)*h),'#ecdfcb');draw=ImageDraw.Draw(board)
 for i,j in enumerate(items):
  im=Image.open(art/(j['id']+'.webp')).convert('RGBA');im.thumbnail((w-10,h-30));x=(i%cols)*w+(w-im.width)//2;y=(i//cols)*h;board.paste(im,(x,y),im);draw.text(((i%cols)*w+3,y+h-22),j['id'].replace(kind,''),fill='#342f23')
 board.save(out/(kind.strip('-')+'-board.jpg'))
print('Prepared',len(jobs),'independent assets; total manifest',len(manifest))
