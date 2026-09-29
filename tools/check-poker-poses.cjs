// Isolated browser profile only. Does not read or write the player's real save.
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs'),os=require('node:os');
const browser=process.env.CXQ_BROWSER_CLI||'C:/Users/User/AppData/Local/npm-cache/_npx/6de2aa2fded2970c/node_modules/agent-browser/bin/agent-browser-win32-x64.exe';
const url=process.env.CXQ_POKER_URL||'http://127.0.0.1:4173/games/poker/?v=20260930-poses2';
// Windows browser daemons can inherit pipe handles; use a dedicated output file
// so a successful CLI exit does not wait on the long-lived daemon's stdout.
const logDir=fs.mkdtempSync(path.join(os.tmpdir(),'cxq-pose-qa-'));
const logFile=path.join(logDir,'command.log');
const run=(...args)=>{
 const fd=fs.openSync(logFile,'w');
 try{execFileSync(browser,['--session','pose-qa30',...args],{stdio:['ignore',fd,fd],timeout:30000});}
 finally{fs.closeSync(fd);}
 return fs.readFileSync(logFile,'utf8');
};
const groups=[['night','sadness','trust','memory'],['healing','hope','luck','dream'],['growth','joy','night','hope']];
try{
 run('open',url);run('set','viewport','640','320');
 for(const [i,seats] of groups.entries()){
  run('eval',`(async()=>{const m=await import('./engine.mjs?v=20260929-switch1');let p=m.createProfile();p.seats=${JSON.stringify(seats)};p.acknowledged=true;p=m.reduce(p,{type:'open',id:'pose-qa-group-${i}',game:'big2'});p.table.turn=0;p.table.rules.c3=false;localStorage.setItem('cxq.poker.v1',JSON.stringify(p));})()`);
  run('reload');run('snapshot','-i');run('find','role','button','click','--name','繼續牌局');run('snapshot','-i');
  const result=run('eval',`(async()=>{
   const m=await import('./presentation.mjs?v=20260930-poses2'),root=document.querySelector('#app'),roles=${JSON.stringify(seats)},checks=[];
   await Promise.all(roles.map(r=>m.warmPlayPose(m.playPosePath('art/seat-'+r+'.webp'))));
   for(let seat=0;seat<4;seat++){
    const promise=m.animateTable(root,m.capture(root),{type:'play',seat},{fast:false,reduced:false});
    const sprite=document.querySelector('img.motion-card[src*=play-v1]');
    if(!sprite||sprite.getAttribute('src')!=='art/seat-'+roles[seat]+'-play-v1.webp')throw Error('Wrong or missing pose: '+roles[seat]);
    const r=sprite.getBoundingClientRect();
    if(r.x<0||r.y<0||r.right>innerWidth||r.bottom>innerHeight)throw Error('Pose outside viewport');
    checks.push(roles[seat]);m.cancelMotion();await promise;
    if(document.querySelector('.motion-card'))throw Error('Ghost after cancellation');
    if([...root.querySelectorAll('.table-character')].some(e=>getComputedStyle(e).opacity!=='1'))throw Error('Character did not restore');
   }
   await m.animateTable(root,m.capture(root),{type:'play',seat:0},{reduced:true});
   if(document.querySelector('.motion-card'))throw Error('Reduced motion ignored');
   window.posePreview=m.animateTable(root,m.capture(root),{type:'play',seat:0},{fast:false,reduced:false});
   document.getAnimations().forEach(a=>{a.pause();a.currentTime=260});
   return {passed:checks,reduced:true};
  })()`);
  console.log(result.trim());
  console.log(run('screenshot').trim());
  run('eval',`(async()=>{const m=await import('./presentation.mjs?v=20260930-poses2');m.cancelMotion();await window.posePreview;})()`);
 }
 const errors=run('errors').trim();if(errors)throw Error(errors);
 console.log('PASS: all 10 roles, mobile bounds, cancellation and reduced motion.');
}finally{try{run('close');}finally{fs.unlinkSync(logFile);fs.rmdirSync(logDir);}}
