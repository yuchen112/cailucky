const fs=require('fs'),path=require('path'),vm=require('vm');
const root=__dirname,games=['magic-bubble','dream-match','fairytale-defense'];
for(const game of games){
  const dir=path.join(root,game),html=fs.readFileSync(path.join(dir,'index.html'),'utf8'),css=fs.readFileSync(path.join(dir,'game.css'),'utf8'),js=fs.readFileSync(path.join(dir,'game.js'),'utf8');
  new vm.Script(js,{filename:game+'/game.js'});
  for(const required of ['../shared/runtime.js','game.css','game.js','遊戲大廳'])if(!html.includes(required))throw new Error(game+' missing '+required);
  if(!css.includes('Illustrated skin'))throw new Error(game+' missing illustrated UI skin');
  const refs=[...html.matchAll(/(?:src|href)="([^"?#]+\.(?:png|webp|mp3|ogg))"/g),...css.matchAll(/url\(['"]?([^)'"?#]+\.(?:png|webp))/g),...js.matchAll(/['`](assets\/[^'`${}]+\.(?:png|webp))/g)].map(m=>m[1]);
  for(const ref of refs){const target=path.resolve(dir,ref);if(!fs.existsSync(target))throw new Error(game+' missing asset '+ref)}
}
const hub=fs.readFileSync(path.resolve(root,'../assets/index-XdRDscQx.js'),'utf8');
for(const game of games)if(!hub.includes('games/'+game+'/index.html'))throw new Error('hub missing '+game);
console.log('Three illustrated CxQ games passed syntax, asset and game-hub checks.');
