const assert=require('node:assert/strict');
const {bounds,draw}=require('../games/shared/orb-art.js');
for(const meta of [{cx:.5,cy:.5,radius:.48},{cx:.49,cy:.51,radius:.43}])for(const radius of [15,19,32,95]){
 const b=bounds(meta,150,300,radius);
 assert(Math.abs(b.x+meta.cx*b.width-150)<1e-9);
 assert(Math.abs(b.y+meta.cy*b.height-300)<1e-9);
 assert(Math.abs(b.width*meta.radius-radius)<1e-9);
 const calls=[];draw({drawImage:(...args)=>calls.push(args)},{naturalWidth:256},meta,150,300,radius);
 assert.equal(calls[0].length,5,'whole image draw, never an atlas source crop');
}
console.log('Orb artwork: visual centres and radii match physics at all tested sizes, whole images only');
