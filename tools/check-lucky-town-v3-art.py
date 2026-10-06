from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]; art=root/'games/lucky-town/art';out=root/'preview/lucky-town/v3';out.mkdir(parents=True,exist_ok=True)
roles=['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope']
for role in roles:
 board=Image.new('RGB',(900,840),'#d6e0d8');draw=ImageDraw.Draw(board)
 for row,suffix in enumerate(['original','','-day','-gala']):
  key=role if suffix=='original' else 'outfit-'+role+suffix
  standing=root/'assets/characters'/('cxq-role-'+role+'.webp') if suffix=='original' else art/(key+'.webp')
  files=[standing]+[art/('walk-'+key+'-'+p+'.webp') for p in ['a','c','b','d']]
  for col,file in enumerate(files):
   im=Image.open(file).convert('RGBA');im.thumbnail((170,180));board.paste(im,(col*180+(180-im.width)//2,row*210),im);draw.text((col*180+5,row*210+183),file.stem,fill='#14312b')
 board.save(out/('motion-'+role+'.jpg'))
files=[art/('cheer-'+r+'.webp') for r in roles]+[art/('pet-'+p+'-cheer.webp') for p in ['cloud','sprout','star','moon']]
board=Image.new('RGB',(900,630),'#d6e0d8');draw=ImageDraw.Draw(board)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGBA');assert im.getchannel('A').getextrema()[0]==0,p.name;im.thumbnail((170,180));board.paste(im,(i%5*180+(180-im.width)//2,i//5*210),im);draw.text((i%5*180+4,i//5*210+185),p.stem,fill='#14312b')
board.save(out/'reactions.jpg')
for p in art.glob('walk-*-*.webp'):
 im=Image.open(p).convert('RGBA');assert im.getchannel('A').getextrema()[0]==0,p.name
for p in art.glob('ticket-*-*.webp'):
 im=Image.open(p).convert('RGBA');assert im.getchannel('A').getextrema()[0]==0,p.name;assert im.getpixel((im.width//2,im.height//2))[3]>250,p.name
print('Independent alpha assets and all character motion contact sheets checked')
