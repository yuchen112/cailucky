const assert=require('node:assert/strict'),{chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,channel:'msedge',args:process.env.LUCKY_TOWN_HTTP1?['--disable-http2']:[]});try{
 const p=await b.newPage();p.on('console',m=>{if(m.text().startsWith('Image verification'))console.log(m.text())});
 await p.goto(process.env.LUCKY_TOWN_URL||'http://127.0.0.1:4179/games/lucky-town/');
 const result=await p.evaluate(async()=>{
  const list=await(await fetch('art/manifest.json?v=20261007-town8')).json(),ids=new Set(list.map(x=>x.id));
  for(const role of ['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'])for(const suffix of ['original','','-day','-gala','-sleep','-journey','-craft','-winter','-festival']){
   const key=suffix==='original'?role:'outfit-'+role+suffix;for(const pose of ['lie-'+key,'sit-'+key,'walk-'+key+'-a','walk-'+key+'-b','walk-'+key+'-c','walk-'+key+'-d'])if(!ids.has(pose))throw Error('Missing '+pose)
  }
  for(const kind of ['match','number','home','treasure','coinlines','flowers','multiplier','bingo'])for(const cost of [20,100,500])if(!ids.has('ticket-'+kind+'-'+cost))throw Error('Missing ticket art');
  for(const role of ['joy','dream','night','sadness','trust','memory','growth','healing','luck','hope'])if(!ids.has('cheer-'+role))throw Error('Missing role reaction');
  for(const pet of ['cloud','sprout','star','moon','kitten','lop','shiba','fox','hedgehog','deer','owl','slime'])for(const suffix of ['','-walk-a','-walk-b','-sleep','-cheer'])if(!ids.has('pet-'+pet+suffix))throw Error('Missing pet motion '+pet+suffix);
  const failed=[];let decoded=0;
  for(let i=0;i<list.length;i+=8){
   await Promise.all(list.slice(i,i+8).map(async x=>{const a=new Image();a.src='art/'+x.file;let timer;try{
    await Promise.race([a.decode(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('image decode timeout')),20000))]);if(!a.naturalWidth)throw Error('empty');decoded++;
   }catch(e){failed.push({file:x.file,error:e.message})}finally{clearTimeout(timer)}}));
   if(failed.length){console.info('Image verification failed: '+JSON.stringify(failed));break}
   if(i%64===0||i+8>=list.length)console.info('Image verification '+decoded+'/'+list.length)
  }
  return{count:list.length,decoded,failed}
 });
 assert.deepEqual(result.failed,[]);assert.equal(result.count,857);assert.equal(result.decoded,857);console.log('All 857 independent production images decoded, including every required character pose.');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
