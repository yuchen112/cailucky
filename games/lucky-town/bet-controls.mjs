// Root stays mounted while the saved state refreshes the machine controls.
export function bindBetControls(root, change) {
  let timer, token=0, pointer=null, started=0, direction=0;
  const stop=()=>{token++;clearTimeout(timer);pointer=null;};
  async function repeat(id) {
    if(id!==token)return;
    const elapsed=Date.now()-started;
    const changed=await change(direction,elapsed>2500?10:elapsed>1200?5:1);
    if(id===token&&changed)timer=setTimeout(()=>repeat(id),elapsed>1200?90:170);
  }
  root.addEventListener('pointerdown',async e=>{
    const button=e.target.closest('[data-action="bet-step"]');
    if(!button||button.disabled||!e.isPrimary||e.button!==0)return;
    e.preventDefault();stop();pointer=e.pointerId;direction=Number(button.dataset.step);started=Date.now();
    root.setPointerCapture(pointer);
    const id=token;
    const changed=await change(direction,1);
    if(id===token&&changed)timer=setTimeout(()=>repeat(id),450);
  });
  root.addEventListener('click',async e=>{
    const button=e.target.closest('[data-action="bet-step"]');
    if(!button)return;
    e.stopImmediatePropagation();
    // Mouse/touch is handled on pointerdown; keyboard clicks have detail zero.
    if(e.detail===0&&!button.disabled){
      const step=Number(button.dataset.step);
      await change(step,1);
      const next=root.querySelector(`[data-action="bet-step"][data-step="${step}"]`);
      if(next&&!next.disabled)next.focus();
    }
  },true);
  for(const event of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(event,e=>{if(e.pointerId===pointer)stop();});
  window.addEventListener('blur',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
}
