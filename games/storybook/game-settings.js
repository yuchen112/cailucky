/* One settings surface. Game hooks own state transitions; UI never reloads to exit. */
(() => {
  function setup(){
    const panel=document.querySelector('#audio-dialog,#cxq-audio-panel'),gear=document.querySelector('#sound,#cxq-audio');
    if(!panel||!gear||panel.dataset.unified)return;
    panel.dataset.unified='true';panel.classList.add('session-settings');
    const form=panel.querySelector('form')||panel,actions=document.createElement('div');actions.className='session-actions';
    const title=panel.querySelector('h2');if(title)title.textContent='遊戲設定';
    const playing=()=>{const p=document.querySelector('#play');return p?!p.hidden:!!document.querySelector('.game-entry[hidden]');};
    const audioResume=()=>{if(typeof G!=='undefined')G.resumeAudio();else if(typeof CxQ!=='undefined')CxQ.resume();};
    for(const [name,key]of [['重新開始','restart'],['返回遊戲首頁','home']]){
      const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.gameAction=key;
      b.onclick=()=>{
        if(window.CxQGame?.busy?.()){let note=actions.querySelector('p');if(!note){note=document.createElement('p');actions.append(note);}note.textContent='請先關閉設定，等待這次消除完成後再操作。';return;}
        const fn=window.CxQGame?.[key];if(!fn)return;
        const execute=()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());fn();audioResume();window.CxQSession?.refresh();};
        if(!playing()){execute();return;}
        actions.querySelector('.action-confirm')?.remove();const check=document.createElement('section');check.className='action-confirm';check.setAttribute('role','group');const message=document.createElement('p');message.textContent=key==='restart'?'重新開始這一局？目前進度將清除。':'返回本遊戲首頁？這一局將結束。';const yes=document.createElement('button'),no=document.createElement('button');yes.type=no.type='button';yes.textContent=key==='restart'?'確認重新開始':'確認返回首頁';no.textContent='繼續這一局';yes.onclick=execute;no.onclick=()=>check.remove();check.append(message,yes,no);actions.append(check);check.scrollIntoView({block:'nearest'});yes.focus({preventScroll:true});
      };actions.append(b);
    }
    if(title)title.after(actions);else form.prepend(actions);gear.setAttribute('aria-label','遊戲設定與返回首頁');
    gear.onclick=()=>{actions.querySelector('.action-confirm')?.remove();actions.querySelectorAll('button').forEach(b=>b.hidden=!playing());if(typeof G!=='undefined')G.hold();if(!panel.open)panel.showModal();};
    panel.addEventListener('close',audioResume);
  }
  setup();addEventListener('DOMContentLoaded',setup);
})();
