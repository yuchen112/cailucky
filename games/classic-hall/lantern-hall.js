const games=[{"id":"tetris","name":"CxQ 心境織境","kind":"俄羅斯方塊","description":"旋轉與排列落下的方塊，填滿一整行即可消除。","url":"../tetris/index.html?v=20261012-mobile1","art":"art-v2/tetris.webp"},{"id":"twenty48","name":"CxQ 星願 2048","kind":"2048","description":"滑動棋盤，讓相同數字合併，挑戰 2048。","url":"../2048/index.html?v=20261012-mobile1","art":"art-v2/twenty48.webp"},{"id":"mines","name":"CxQ 四葉草探險地圖","kind":"踩地雷","description":"依照周圍陷阱數字找出安全格，插旗標記疑點。","url":"../mines/index.html?v=20261012-mobile1","art":"art-v2/mines.webp"},{"id":"memory","name":"CxQ 暮光回憶收藏室","kind":"翻牌配對","description":"翻開兩張卡片，找出相同圖案的一對。","url":"../memory/index.html?v=20261012-mobile1","art":"art-v2/memory.webp"},{"id":"link","name":"CxQ 夢境織光","kind":"連連看","description":"找出相同圖案，用不超過兩次轉彎的路線連接。","url":"../link/index.html?v=20261012-mobile1","art":"art-v2/link.webp"},{"id":"whack","name":"CxQ 森林敲敲樂","kind":"打地鼠","description":"看準冒出來的小夥伴，在時間內點擊得分。","url":"../whack/index.html?v=20261012-mobile1","art":"art-v2/whack.webp"},{"id":"brick","name":"CxQ 心光旅團：記憶核心","kind":"打磚塊","description":"移動擋板反彈球，打破上方的磚塊。","url":"../brick-breaker/index.html?v=20261012-mobile1","art":"art-v2/brick.webp"},{"id":"dino","name":"CxQ 森林急件快遞","kind":"跑酷","description":"跳過障礙與下滑躲避，完成森林配送挑戰。","url":"../dino/index.html?v=20261012-mobile1","art":"art-v2/dino.webp"},{"id":"flappy","name":"CxQ 星願飛行郵差","kind":"點按飛行","description":"點按調整飛行高度，穿過障礙之間的空隙。","url":"../flappy/index.html?v=20261012-mobile1","art":"art-v2/flappy.webp"},{"id":"magic-bubble","name":"CxQ 魔法泡泡龍","kind":"泡泡龍","description":"瞄準並發射泡泡，連起三顆以上同色泡泡。","url":"../magic-bubble/index.html?v=20261012-mobile1","art":"art-v2/magic-bubble.webp"},{"id":"dream-match","name":"CxQ 夢境消除","kind":"三消","description":"交換相鄰寶石，連成三顆以上相同寶石。","url":"../dream-match/index.html?v=20261012-mobile1","art":"art-v2/dream-match.webp"},{"id":"merge","name":"CxQ 心光合成屋","kind":"合成球","description":"移動落點並放下球，讓相同球相遇合成更大的球。","url":"../merge/index.html?v=20261012-mobile1","art":"art-v2/merge.webp"}];
const groups = [
  {id:'board-games', label:'棋盤與記憶', indexes:[0,1,2,3,4]},
  {id:'action-games', label:'反應與動作', indexes:[5,6,7,8]},
  {id:'combo-games', label:'消除與合成', indexes:[9,10,11]},
];
const covers=['tetris','2048','mines','memory'].map(name=>'../'+name+'/lantern-cover.webp');
const dialog=document.querySelector('#gameDetails');
const audio=CxQAudioEngine?.create({id:'classic-hall',tracks:['audio-original/music-loop.mp3'],effects:{select:'audio-original/select.wav',close:'audio-original/close.wav',enable:'audio-original/enable.wav'}});
let music=false;
audio?.hold(true);
document.querySelector('#hallSound').onclick=event=>{
  music=!music;
  audio?.hold(!music);
  if(music)audio?.sound('enable');
  event.currentTarget.setAttribute('aria-pressed',String(music));
  event.currentTarget.textContent='館內音樂：'+(music?'開':'關');
};
function openGame(game,art){
  document.querySelector('#detailKind').textContent=game.kind;
  document.querySelector('#detailTitle').textContent=game.name;
  document.querySelector('#detailDescription').textContent=game.description;
  document.querySelector('#detailArt').src=art;
  document.querySelector('#detailPlay').href=game.url;
  dialog.showModal();
  audio?.sound('select');
}
dialog.addEventListener('close',()=>audio?.sound('close'));
document.addEventListener('visibilitychange',()=>audio?.hold(!music||document.hidden));
for(const group of groups){
  const link=document.createElement('a');
  link.href='#'+group.id;link.textContent=group.label;
  document.querySelector('#hallSections').append(link);
  const section=document.createElement('section');
  section.className='hall-group';section.id=group.id;
  const title=document.createElement('h2');title.textContent=group.label;
  const grid=document.createElement('div');grid.className='hall-grid';
  for(const index of group.indexes){
    const game=games[index],art=covers[index]||game.art;
    const button=document.createElement('button');button.className='hall-card';
    const image=document.createElement('img');image.src=art;image.alt='';image.loading=index<4?'eager':'lazy';
    const name=document.createElement('strong');name.textContent=game.name;
    const kind=document.createElement('span');kind.textContent=game.kind;
    button.append(image,name,kind);button.onclick=()=>openGame(game,art);grid.append(button);
  }
  section.append(title,grid);document.querySelector('#catalog').append(section);
}
