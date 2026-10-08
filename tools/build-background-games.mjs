import fs from 'node:fs';import {toolDependency} from './refresh-deps.mjs';
import './build-upgrade-active.mjs';
const esbuild=toolDependency('esbuild'),town='games/lucky-town',styles=['style.css','premium.css','landscape.css','collection.css','release.css','ticket-fix.css'];
const css=styles.map(p=>fs.readFileSync(town+'/'+p,'utf8')).join('\n').replace(/url\((['"]?)art\//g,'url($1delivery/');fs.writeFileSync(town+'/game-v2.bundle.css',(await esbuild.transform(css,{loader:'css',minify:true})).code);console.log('Background UI and scoped game bundles built');
