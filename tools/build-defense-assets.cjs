const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../games/fairytale-defense/rebuild'),files={},characters={};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0,16);
for(const name of fs.readdirSync(path.join(root,'art')).sort())if(name.endsWith('.webp'))files['art/'+name]=hash(path.join(root,'art',name));
for(const name of fs.readdirSync(path.join(root,'audio')).sort())if(/\.(mp3|ogg)$/.test(name))files['audio/'+name]=hash(path.join(root,'audio',name));
for(const name of fs.readdirSync(path.resolve(root,'../../../assets/characters')).sort())if(/^cxq-role-.*\.webp$/.test(name)){const id=name.slice(9,-5),p='../../../assets/characters/'+name;characters[id]=hash(path.resolve(root,p));files[p]=characters[id];}
const data={files,characters};fs.writeFileSync(path.join(root,'asset-revisions.mjs'),'export const ASSET_REVISIONS='+JSON.stringify(data)+';\n');fs.writeFileSync(path.join(root,'asset-revisions.json'),JSON.stringify(data));const worker=path.join(root,'asset-cache.js'),build=crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0,16);fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace(/const BUILD='[^']*';/,"const BUILD='"+build+"';"));console.log('Revisioned assets:',Object.keys(files).length);
