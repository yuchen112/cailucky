from pathlib import Path
import urllib.request,re,zipfile,io,json
root=Path(__file__).resolve().parents[1];out=root/'games/lucky-town/audio';out.mkdir(exist_ok=True)
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read()
for pack in ['casino-audio','ui-audio','rpg-audio']:
 html=get('https://kenney.nl/assets/'+pack).decode();url=re.search(r'https://[^\s\"\x27]+\.zip',html).group();z=zipfile.ZipFile(io.BytesIO(get(url)))
 folder=out/pack;folder.mkdir(exist_ok=True)
 for n in z.namelist():
  if n.lower().endswith(('.ogg','.wav','.txt')):(folder/Path(n).name).write_bytes(z.read(n))
 print(pack,len(list(folder.iterdir())))
for name in ['Carefree','Daily Beetle','Pixelland','Wallpaper']:
 url='https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+urllib.parse.quote(name)+'.mp3'
 try:(out/(name.lower().replace(' ','-')+'.mp3')).write_bytes(get(url));print(name,'downloaded')
 except Exception as e:print(name,str(e))
(out/'sources.json').write_text(json.dumps({'effects':[{'author':'Kenney','license':'CC0','source':'https://kenney.nl/assets/'+p}for p in ['casino-audio','ui-audio','rpg-audio']],'music':[{'title':n,'author':'Kevin MacLeod','license':'CC BY 4.0','source':'https://incompetech.com/music/royalty-free/','file':n.lower().replace(' ','-')+'.mp3'}for n in ['Carefree','Daily Beetle','Pixelland','Wallpaper']],'musicLicense':'https://creativecommons.org/licenses/by/4.0/','modifications':'Edited loops with fades and loudness balancing for game use.'},ensure_ascii=False,indent=2),encoding='utf8')
