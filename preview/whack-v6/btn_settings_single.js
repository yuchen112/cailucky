window.CXQ_UI=window.CXQ_UI||{};window.CXQ_UI.btn_settings='';
window.addEventListener('load',async()=>{
  try{
    const bufs=await Promise.all([0,1,2,3,4,5].map(i=>fetch(`home_v7/part${i}.bin?v=7`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`asset ${i}: ${r.status}`);return r.arrayBuffer();})));
    const total=bufs.reduce((n,b)=>n+b.byteLength,0),merged=new Uint8Array(total);let off=0;
    for(const b of bufs){merged.set(new Uint8Array(b),off);off+=b.byteLength;}
    const url=URL.createObjectURL(new Blob([merged],{type:'image/webp'}));
    const h=document.getElementById('home'),bg=document.getElementById('homeBg');if(!h||!bg)return;
    bg.src=url;bg.style.objectFit='cover';bg.style.objectPosition='center top';
    const title=h.querySelector('.homeTitle'),shade=h.querySelector('.homeShade'),menu=h.querySelector('.homeMenu');
    if(title)title.style.display='none';if(shade)shade.style.display='none';if(menu)menu.style.display='none';
    let layer=document.getElementById('v7Hotspots');if(!layer){layer=document.createElement('div');layer.id='v7Hotspots';Object.assign(layer.style,{position:'absolute',inset:'0',zIndex:'20',pointerEvents:'none'});h.appendChild(layer);}
    const specs=[['mode',22,52,56,11],['howto',24,63,52,9],['rank',24,72,52,9],['settings',24,81,52,9]];
    for(const [screen,x,y,w,hh] of specs){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',screen);Object.assign(b.style,{position:'absolute',left:x+'%',top:y+'%',width:w+'%',height:hh+'%',border:'0',padding:'0',margin:'0',background:'transparent',cursor:'pointer',pointerEvents:'auto'});b.addEventListener('click',()=>{document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));const t=document.getElementById(screen);if(t)t.classList.add('active');if(screen==='rank'&&typeof renderRank==='function')renderRank();});layer.appendChild(b);}
  }catch(e){console.error('v7 homepage load failed',e);}
});