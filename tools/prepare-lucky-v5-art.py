import json, shutil
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1];art=root/'games/lucky-town/art';out=root/'preview/lucky-town/v5';out.mkdir(parents=True,exist_ok=True)
jobs=json.loads((art/'generation-v5-prompts.json').read_text(encoding='utf-8'));manifest={x['id']:x for x in json.loads((art/'manifest.json').read_text(encoding='utf-8'))}
for j in jobs:
 src=Path(j['source']);assert src.is_file(),j['id'];dst=art/(j['id']+'.webp');shutil.copy2(src,art/(j['id']+'.png'));im=Image.open(src).convert('RGBA')
 box=im.getchannel('A').point(lambda x:255 if x>12 else 0).getbbox();assert box,j['id'];im=im.crop(box);im.thumbnail((700,700) if j['id'].startswith(('lie-','pet-')) else (1200,900),Image.Resampling.LANCZOS);im.save(dst,'WEBP',quality=90,method=4)
 manifest[j['id']]={'id':j['id'],'file':dst.name,'size':list(im.size),'alpha':im.getchannel('A').getextrema()[0]<255,'bytes':dst.stat().st_size}
(art/'manifest.json').write_text(json.dumps(list(manifest.values()),ensure_ascii=False,indent=2),encoding='utf-8')
for prefix,cols,w,h in [('lie-',9,180,160),('pet-',8,180,180),('ticket-',3,360,230)]:
 rows=[j for j in jobs if j['id'].startswith(prefix)]
 if not rows:continue
 board=Image.new('RGB',(cols*w,((len(rows)+cols-1)//cols)*h),'#ede1cb');d=ImageDraw.Draw(board)
 for i,j in enumerate(rows):
  im=Image.open(art/(j['id']+'.webp')).convert('RGBA');im.thumbnail((w-10,h-25));x=i%cols*w;y=i//cols*h;board.paste(im,(x+(w-im.width)//2,y+(h-25-im.height)//2),im);d.text((x+3,y+h-20),j['id'].replace(prefix,''),fill='#332f28')
 board.save(out/(prefix.strip('-')+'-board.jpg'))
print('Prepared',len(jobs),'v5 assets; total',len(manifest))
