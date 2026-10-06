from pathlib import Path
import json, shutil
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]
art=root/'games/lucky-town/art'
jobs=json.loads((root/'preview/lucky-town/v3-jobs.json').read_text(encoding='utf8'))
for job in jobs:
 src=Path(job['source']); dst=art/(job['id']+'.png');shutil.copy2(src,dst)
 im=Image.open(dst).convert('RGBA'); edge=1600 if job['id'].startswith(('cover','ticket')) else 700
 if job['id'].startswith(('walk','cheer')):
  box=im.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
  if box: im=im.crop(box)
 im.thumbnail((edge,edge),Image.Resampling.LANCZOS);im.save(dst.with_suffix('.webp'),'WEBP',quality=90,method=4)
manifest=json.loads((art/'manifest.json').read_text(encoding='utf8'))
existing={x['id']:x for x in manifest}
for job in jobs:
 im=Image.open(art/(job['id']+'.webp'));existing[job['id']]={'id':job['id'],'file':job['id']+'.webp','size':im.size,'alpha':im.getchannel('A').getextrema()[0]<255 if im.mode=='RGBA' else False,'bytes':(art/(job['id']+'.webp')).stat().st_size}
(art/'manifest.json').write_text(json.dumps(list(existing.values()),ensure_ascii=False,indent=2),encoding='utf8')
(art/'generation-v3-prompts.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf8')
files=[art/(j['id']+'.webp') for j in jobs if j['id'].startswith(('cover','ticket'))]
board=Image.new('RGB',(1200,((len(files)+2)//3)*260),'#12302d');draw=ImageDraw.Draw(board)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGBA');im.thumbnail((390,230));board.paste(im,((i%3)*400,(i//3)*260),im);draw.text(((i%3)*400+5,(i//3)*260+234),p.stem,fill='white')
board.save(root/'preview/lucky-town/v3-scenes.jpg')
print('Encoded',len(jobs),'v3 assets')
