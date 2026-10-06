from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
art=root/'games/lucky-town/art';out=root/'preview/lucky-town/v2';out.mkdir(parents=True,exist_ok=True)
roles=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope']
for role in roles:
 sheet=Image.new('RGB',(960,920),'#e2e5df');d=ImageDraw.Draw(sheet)
 for row,suit in enumerate([role,'outfit-'+role,'outfit-'+role+'-day','outfit-'+role+'-gala']):
  standing=art/(suit+'.webp') if row else root/('assets/characters/cxq-role-'+role+'.webp')
  if not standing.exists() and row==0:
   standing=root/('assets/characters/'+role+'.webp')
  for col,path in enumerate([standing,art/('sit-'+suit+'.webp'),art/('walk-'+suit+'-a.webp'),art/('walk-'+suit+'-b.webp')]):
   if not path.exists():raise FileNotFoundError(path)
   im=Image.open(path).convert('RGBA');im.thumbnail((220,205))
   x=col*240+(240-im.width)//2;y=row*230+8
   sheet.paste(im,(x,y),im);d.text((col*240+8,row*230+215),path.stem,fill='#172d2c')
 sheet.save(out/('pose-contact-'+role+'.jpg'))
sheet=Image.new('RGB',(960,800),'#e2e5df');d=ImageDraw.Draw(sheet)
for row,pet in enumerate(['cloud','sprout','star','moon']):
 for col,pose in enumerate(['','-sleep','-walk-a','-walk-b']):
  p=art/('pet-'+pet+pose+'.webp');im=Image.open(p).convert('RGBA');im.thumbnail((220,170));sheet.paste(im,(col*240+(240-im.width)//2,row*200+8),im);d.text((col*240+8,row*200+180),p.stem,fill='#172d2c')
sheet.save(out/'pet-pose-contact.jpg')
print('QA-only contacts for all 40 looks and 16 pet poses saved.')
