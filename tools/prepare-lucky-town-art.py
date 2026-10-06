"""Encode project-bound independent images; no atlas slicing or recoloring."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import json
root=Path(__file__).resolve().parents[1]
art=root/'games/lucky-town/art'
manifest=[]
for path in art.glob('*.png'):
    im=Image.open(path).convert('RGBA')
    original=im.size
    # Only trim empty alpha margins for objects / UI, preserving each independent asset.
    if path.stem.startswith(('furniture-','outfit-','sit-','symbol-','accessory-')) or path.stem=='button':
        alpha=im.getchannel('A')
        bbox=alpha.point(lambda x:255 if x>12 else 0).getbbox()
        if bbox: im=im.crop(bbox)
    edge=1200 if path.stem in ('cover','town','room','room-rose','room-night') else 850 if path.stem.startswith(('outfit-','sit-','machine-')) else 520
    im.thumbnail((edge,edge),Image.Resampling.LANCZOS)
    target=path.with_suffix('.webp')
    im.save(target,'WEBP',quality=90,method=4)
    manifest.append({'id':path.stem,'file':target.name,'original':original,'size':im.size,'alpha':im.getchannel('A').getextrema()[0]<255,'bytes':target.stat().st_size})
(art/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
# Contact sheets are QA-only, never consumed as game sprites.
qa=root/'preview/lucky-town'
qa.mkdir(parents=True,exist_ok=True)
for prefix in ('machine-','furniture-','outfit-','sit-'):
    files=sorted(art.glob(prefix+'*.webp'))
    if not files: continue
    cols=3 if prefix=='machine-' else 5
    rows=(len(files)+cols-1)//cols
    board=Image.new('RGB',(cols*300,rows*330),'#f5eee4')
    draw=ImageDraw.Draw(board)
    for idx,path in enumerate(files):
        im=Image.open(path).convert('RGBA');im.thumbnail((280,290))
        x=idx%cols*300+(300-im.width)//2;y=idx//cols*330
        board.paste(im,(x,y),im);draw.text((idx%cols*300+10,y+300),path.stem,fill='#594737')
    board.save(qa/(prefix+'contact.png'))
print(f'Encoded {len(manifest)} independent assets ({sum(x["bytes"] for x in manifest)/1e6:.1f} MB)')
