const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['games/2048/index.html','games/link/index.html','games/tetris/index.html','games/memory/index.html']){
 const src=fs.readFileSync(file,'utf8');
 assert(src.startsWith('<!doctype'),file+' must retain early UTF-8 declaration');
 for(const m of src.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){
  if(!m[1].includes('src=')&&m[2].trim())new vm.Script(m[2],{filename:file});
 }
 assert(!src.split('</html>')[1]?.trim(),file+' has no code after HTML');
}
const html=fs.readFileSync('games/2048/index.html','utf8');
const reducer=html.slice(html.indexOf('function line(a)'),html.indexOf('function commitMove'));
const c={};vm.createContext(c);vm.runInContext(reducer,c);
for(const [input,expected,score] of [
 [[2,2,2,2],[4,4,0,0],8],[[4,4,8,0],[8,8,0,0],8],
 [[0,2,0,2],[4,0,0,0],4],[[2,4,8,16],[2,4,8,16],0],
 [[0,0,0,0],[0,0,0,0],0]
]){
 const [output,gain]=c.line(input);
 assert.deepEqual(Array.from(output),expected);assert.equal(gain,score);
}
for(const f of ['games/2048/home.js','games/click-core/home.js','games/click-core/src/game.js','games/dream-match/game.js','games/mines/mobile24.js','games/shared/runtime.js','games/storybook/studio.js']){
 new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
}
assert(!/四葉鈴狐|暖心絨絨|光線編織者/.test(fs.readFileSync('games/tetris/index.html','utf8')));
assert(!/n:'芽芽'|n:'暖暖'/.test(fs.readFileSync('games/click-core/src/game.js','utf8')));
console.log('PASS mobile29 HTML boundaries, inline/external JS syntax, 2048 merge invariants, canonical role labels');
