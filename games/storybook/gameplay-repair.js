/* Only the five audited games load this file. */
(() => {
  const q=s=>document.querySelector(s),game=document.body.dataset.game;
  document.documentElement.dataset.release='20260923-repair1';
  if(game==='mines'){
    const gear=q('#sound'),notes=q('.field-notes'),play=q('#play');
    if(gear&&notes){
      const origin=document.createComment('settings-home-position');gear.before(origin);
      const dock=document.createElement('div');dock.className='settings-dock';
      const title=document.createElement('strong');title.textContent='探索工具';dock.append(title);notes.prepend(dock);
      const place=()=>{if(play.hidden)origin.after(gear);else dock.append(gear);};
      new MutationObserver(place).observe(play,{attributes:true,attributeFilter:['hidden']});place();
    }
    q('#contrast').addEventListener('change',()=>document.body.classList.toggle('high-contrast',q('#contrast').checked));
  }
  if(game==='fairytale-defense'){
    const help=document.createElement('button');help.className='battle-help';help.textContent='玩法';help.onclick=()=>q('#guide').showModal();q('.hud').append(help);
    const descriptions={growth:'快速單體',dream:'範圍破甲',luck:'命中緩速',trust:'增幅支援'};
    document.querySelectorAll('.tower').forEach(b=>{b.querySelector('small').textContent=descriptions[b.dataset.kind];});
    q('#field').setAttribute('aria-label','守護地圖，點選編號守護台部署或升級');
  }
})();
