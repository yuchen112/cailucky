(() => {
 const root=document.querySelector('#app'),home=document.createElement('section');
 home.id='clicker-home';
 home.innerHTML='<h1>星願旅團</h1><p>點亮夢境，與夥伴一起照顧星願村莊。</p><img alt="鈴可" src="../tetris/assets/characters/F158E7B0-D03B-4208-91BE-6C1454836CA9.speed24.webp"><button id="enter-clicker">進入村莊</button><p class="save-note">進度自動保存在這台裝置；清除網站資料會失去紀錄。</p>';
 document.body.append(home);root.inert=true;
 home.querySelector('button').onclick=()=>{home.hidden=true;root.inert=false;CxQ.resume();};
 const back=document.createElement('button');back.id='clicker-title';back.textContent='遊戲首頁';back.onclick=()=>{root.inert=true;home.hidden=false;};
 document.body.append(back);
})();
