const fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'..');const p=path.join(root,'assets/index-XdRDscQx.js');let s=fs.readFileSync(p,'utf8');
if(!s.includes('id:"lucky-town"')){const anchor='const Rg=[';if(s.split(anchor).length!==2)throw Error('Game hub anchor changed');s=s.replace(anchor,anchor+'{id:"lucky-town",title:"CxQ 幸運小鎮",label:"多樣拉霸・角色小屋與換裝",cover:"assets/game-covers/lucky-town.webp?v=20261006-town2",url:"games/lucky-town/index.html?v=20261006-town2"},');const marker='children:"點擊開始遊戲"';if(s.split(marker).length!==2)throw Error('Game hub status anchor changed');s=s.replace(marker,'children:u.id==="lucky-town"?"製作中｜可遊玩":"點擊開始遊戲"');fs.writeFileSync(p,s)}
const html=path.join(root,'index.html');fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace('v=20261004-army3','v=20261006-town2'));
fs.copyFileSync(path.join(root,'games/lucky-town/art/cover.webp'),path.join(root,'assets/game-covers/lucky-town.webp'));console.log('Registered lucky-town with cover and playable work-in-progress status.');
// Native React feature card on the homepage; no DOM injection into the app.
s=fs.readFileSync(p,'utf8');
if(!s.includes('function LuckyTownFeatured(')){
 const anchor='function Bg(';if(s.split(anchor).length!==2)throw Error('Homepage function changed');
 const component='function LuckyTownFeatured(){return r.jsxs("a",{className:"lucky-town-home-entry",href:"games/lucky-town/index.html?v=20261006-town2","aria-label":"CxQ 幸運小鎮 製作中 可遊玩",children:[r.jsx("img",{src:"assets/game-covers/lucky-town.webp?v=20261006-town2",alt:"童話夥伴、幸運遊戲館與溫暖小屋",loading:"lazy"}),r.jsxs("div",{children:[r.jsx("span",{className:"lucky-town-entry-status",children:"製作中｜可遊玩"}),r.jsx("h2",{children:"CxQ 幸運小鎮"}),r.jsx("p",{children:"10 位夥伴・6 種拉霸・用金幣布置小屋與換裝"}),r.jsx("b",{children:"進入小鎮 →"})]})]})}';
 s=s.replace(anchor,component+anchor);const nav='r.jsxs("nav",{className:"home-text-nav-v38"';if(s.split(nav).length!==2)throw Error('Homepage navigation anchor changed');s=s.replace(nav,'r.jsx(LuckyTownFeatured,{}),'+nav);
 const state='[u,f]=D.useState("home")';if(s.split(state).length!==2)throw Error('Page state anchor changed');s=s.replace(state,'[u,f]=D.useState(()=>new URLSearchParams(window.location.search).get("view")==="game-hub"?"game-hub":"home")');fs.writeFileSync(p,s);
}
let h=fs.readFileSync(html,'utf8');if(!h.includes('lucky-town-entry.css')){h=h.replace('</head>','  <link rel="stylesheet" href="./assets/lucky-town-entry.css?v=20261006-town2">\n  </head>');fs.writeFileSync(html,h)}
