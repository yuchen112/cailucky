import json
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1];art=root/'games/lucky-town/art';out=root/'preview/lucky-town/v5';jobs={j['id']:j for j in json.loads((art/'generation-v5-prompts.json').read_text(encoding='utf-8'))}
for p in art.glob('generation-v5-job-*.json'):
 j=json.loads(p.read_text(encoding='utf-8'));jobs[j['id']]=j
(art/'generation-v5-prompts.json').write_text(json.dumps(list(jobs.values()),ensure_ascii=False,indent=2),encoding='utf-8')
pets=[j for j in jobs.values() if j.get('pet') and j['id']=='pet-'+j['pet']]
board=Image.new('RGB',(4*260,2*270),'#ecdfcb');d=ImageDraw.Draw(board)
for i,j in enumerate(pets):
 im=Image.open(j['source']).convert('RGBA');im.thumbnail((250,245));x=i%4*260;y=i//4*270;board.paste(im,(x+(260-im.width)//2,y),im);d.text((x+8,y+247),j['id'],fill='black')
board.save(out/'new-pet-references.jpg');print('Merged',len(jobs),'assets; new pet bases',len(pets))
