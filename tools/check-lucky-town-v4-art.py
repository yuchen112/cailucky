from pathlib import Path
from PIL import Image,ImageDraw
import json
root=Path(__file__).resolve().parents[1];art=root/'games/lucky-town/art';out=root/'preview/lucky-town/v4';jobs=json.loads((art/'generation-v4-prompts.json').read_text(encoding='utf8'));errors=[]
for j in jobs:
 im=Image.open(art/(j['id']+'.png')).convert('RGBA');a=im.getchannel('A');low,high=a.getextrema();transparent=j['id'].startswith(('outfit-','sit-','walk-','furniture-'))
 if transparent:
  if low>5 or high<250:errors.append((j['id'],'bad alpha',low,high))
  corners=[a.getpixel((x,y)) for x,y in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]]
  if max(corners)>5:errors.append((j['id'],'opaque corner',corners))
 else:
  if low<250:errors.append((j['id'],'room/window must be opaque',low))
 if not (art/(j['id']+'.webp')).is_file():errors.append((j['id'],'missing encoded image'))
ids={j['id'] for j in jobs};looks=sorted(j['id'] for j in jobs if j['id'].startswith('outfit-'));complete=all(all(x in ids for x in ['sit-'+key]+['walk-'+key+'-'+p for p in ['a','b','c','d']]) for key in looks)
if complete:
 for role in ['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope']:
  selected=[k for k in looks if k.startswith('outfit-'+role+'-')];board=Image.new('RGB',(1080,len(selected)*210),'#ece0ca');draw=ImageDraw.Draw(board)
  for row,key in enumerate(selected):
   for col,id in enumerate([key,'walk-'+key+'-a','walk-'+key+'-c','walk-'+key+'-b','walk-'+key+'-d','sit-'+key]):
    im=Image.open(art/(id+'.webp')).convert('RGBA');im.thumbnail((165,178));board.paste(im,(col*180+(180-im.width)//2,row*210),im);draw.text((col*180+3,row*210+184),id.replace('outfit-'+role+'-',''),fill='#302820')
  board.save(out/('motion-'+role+'.jpg'))
print(json.dumps({'checked':len(jobs),'completeNewLooks':len(looks) if complete else 0,'errors':errors}));assert not errors,errors
