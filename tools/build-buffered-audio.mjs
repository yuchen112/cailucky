import fs from 'node:fs';
import path from 'node:path';
import {toolDependency} from './refresh-deps.mjs';

const esbuild=toolDependency('esbuild');
const queries={name:'versioned-modules',setup(build){
 build.onResolve({filter:/\.mjs\?v=/},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));
}};
for(const name of ['audio-engine-original','audio-engine-v2']){
 await esbuild.build({entryPoints:['games/shared/'+name+'.source.mjs'],outfile:'games/shared/'+name+'.js',bundle:true,format:'iife',target:'es2022',minify:true});
}
await esbuild.build({entryPoints:['games/fairytale-defense/rebuild/army-ui.mjs'],outfile:'games/fairytale-defense/rebuild/army-bundle.mjs',bundle:true,format:'esm',target:'es2022',minify:true,plugins:[queries]});
console.log('Built shared buffered audio engines and Fairy Tale Defense');
