// Coordinates measured against the independently generated whole road images.
export const regionFor=s=>s?.map||(!s?.army||s.stage<=5?'forest':s.stage<=10?'moon':'dawn');
const forestPads=[130,258,386].flatMap(y=>[102,195,288].map(x=>({x,y})));
const moonPads=[...[80,255].flatMap(y=>[120,195,270].map(x=>({x,y}))),...[60,135,305].map(x=>({x,y:435}))];
export const routePads=s=>regionFor(s)==='ruins'?[{x:170,y:40},{x:275,y:40},{x:165,y:155},{x:270,y:155},{x:165,y:260},{x:270,y:260},{x:165,y:400},{x:75,y:545},{x:340,y:545}]:regionFor(s)==='moon'?moonPads:forestPads;
export const ROUTES={
 ruins:[[[46,0],[46,425],[48,441],[54,453],[68,467],[83,471],[304,471],[321,466],[334,453],[340,436],[340,121],[337,105],[327,93],[313,84],[298,82],[144,82],[125,88],[114,102],[107,119],[107,297],[112,315],[124,331],[140,336],[218,336],[236,343],[251,360],[258,378],[258,585]]],
 moon:[[[69,0],[69,337],[72,356],[83,373],[102,383],[148,386],[172,395],[190,414],[195,435],[195,585]],[[322,0],[322,337],[317,356],[304,373],[287,383],[241,386],[218,395],[199,414],[195,435],[195,585]]],
 dawn:[[[195,0],[195,53],[202,70],[217,81],[312,82],[328,94],[334,110],[334,184],[329,198],[311,212],[88,214],[68,224],[59,240],[59,318],[70,336],[87,343],[312,343],[330,357],[336,373],[336,445],[328,460],[312,472],[220,472],[203,482],[195,497],[195,585]]]
};
const lengths=path=>path.slice(1).map((p,i)=>Math.hypot(p[0]-path[i][0],p[1]-path[i][1]));
const specs=Object.fromEntries(Object.entries(ROUTES).map(([region,paths])=>[region,paths.map(path=>({path,lengths:lengths(path)}))]));
function spec(s,route=0){const list=specs[regionFor(s)];return list?.[route%list.length];}
export function routeLength(s,route=0){const v=spec(s,route);return v?.lengths.reduce((a,b)=>a+b,0);}
export function routePoint(distance,s,route=0){const v=spec(s,route);if(!v)return null;let d=Math.max(0,distance);for(let i=0;i<v.lengths.length;i++){const n=v.lengths[i];if(d<=n){const t=d/n;return {x:v.path[i][0]+(v.path[i+1][0]-v.path[i][0])*t,y:v.path[i][1]+(v.path[i+1][1]-v.path[i][1])*t};}d-=n;}const p=v.path.at(-1);return {x:p[0],y:p[1]};}
export function commandPoints(s){return regionFor(s)==='moon'?[{x:125,y:165},{x:265,y:165},{x:90,y:530}]:regionFor(s)==='dawn'?[{x:35,y:145},{x:355,y:275},{x:35,y:410}]:[{x:355,y:145},{x:35,y:273},{x:355,y:401}];}
export function alignCommander(s){if(s.hero)Object.assign(s.hero,{x:195,y:545});return s;}
