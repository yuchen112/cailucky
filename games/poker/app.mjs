import {fitHands,capture,animateTable,cancelMotion} from "./presentation.mjs?v=20260924-controls3";
import * as R from "./rules.mjs";
import { reduce, autoAction } from "./engine.mjs";
import * as Store from "./storage.mjs";
const app = document.querySelector("#app"),
  modal = document.querySelector("#modal"),
  toastEl = document.querySelector("#toast");
let damagedRaw = null;
let profile,
  view = "home",
  game = "big2",
  selected = [],
  target = null,
  arr = { front: [], middle: [], back: [] },
  pile = "back",
  paused = false,
  busy = false,
  visualBusy = false,
  motionEpoch = 0,
  timer,
  noticeTimer,
  workerId = 0,
  helperRun = null;
let handGesture=null,handPreview=null,suppressHandClick=0;
const portrait = (k) => `../storybook/art-mobile24/portrait-${k}.webp`,
  name = (k) => R.ROLES.find((x) => x[0] === k)?.[1] || "夥伴",
  ended = (t) => ["roundEnd", "tableEnd"].includes(t?.phase),
  escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const label = {
  big2: "茶香牌局",
  thirteen: "星月三墩",
  blackjack: "午夜書房",
  highlow: "晨光庭院",
  dragon: "龍門水榭",
  redpoint: "紅葉茶室",
  sevens: "四季花廊",
  oldmaid: "精靈閣樓",
};
const help = {
  big2: "3 最小、2 最大；同點花色梅花＜方塊＜紅心＜黑桃。單張、對子、三條須同張數比較。五張：順子＜同花＜葫蘆＜鐵支＜同花順。順子預設從 34567 至 10JQKA，不含 2；選項 A2345 當最小順子。三家跳過即清桌。剩 7／10／13 張分別按 2／3／4 倍罰分。",
  thirteen:
    "分成頭墩 3 張、中墩 5 張、尾墩 5 張。尾墩不小於中墩，中墩不小於頭墩。每兩家逐墩比較，每墩一水，平手不計；本版不含特殊牌型、打槍加倍。籌碼不足時按應付比例分配。",
  blackjack:
    "A 為 1 或 11，J/Q/K 為 10。超過 21 爆牌；起手 21 點優先於多張 21 點，雙方起手 21 點平手。Blackjack 淨贏 1.5 倍（奇數注向下取整）。兩張牌且本金足夠時可加倍，只補一張。無分牌與保險。",
  highlow:
    "四家各翻一張，A 最大、2 最小。同點比較黑桃＞紅心＞方塊＞梅花；最大者收其餘三家底注，最多支付現有桌上籌碼。",
  dragon:
    "A 算 14。第三張嚴格落在兩張門牌之間即贏；等於門牌為撞柱；外側為未進門。門牌同點重發。各家輪流一回合，結算後才輪下一家。收益與虧損由虛擬莊家結算。",
  redpoint:
    "每家起手 6 張，桌面 4 張。每回合先出一張手牌，再翻一張牌庫牌；翻牌有配對時自動撿取紅點較高的桌牌。手牌與桌牌點數湊 10 即可撿取；A 算 1，10/J/Q/K 須同牌面配對。紅 A 20 分，紅 2～9 按點數，紅 10/J/Q/K 10 分；黑桃 A 可設為 30 分。最後桌牌歸最後撿牌者。按四家分差結算。",
  sevens:
    "紅心 7 首出。各花色從 7 向 A 與 K 兩側接牌；有合法牌必須出，否則跳過。最先出完者獲勝，其餘按剩牌張數支付底注。",
  oldmaid:
    "52 張牌加一張鬼牌；先移除相同點數的對子。依序向下一個仍有手牌的座位抽一張，配成對就移除。出完即安全離局；最後持鬼牌者向三家各支付底注。",
};
function btn(text, action, attrs = "") {
  return `<button class="btn" data-action="${action}" ${attrs}>${text}</button>`;
}
function cardHTML(c, action = "", small = false, back = false) {
  return `<button ${back ? 'data-back="true"' : `data-face="${c}"`} class="card ${small ? "small" : ""} ${selected.includes(c) && !back ? "selected" : ""}" ${action ? `data-action="${action}" data-card="${c}"` : "disabled"} aria-label="${back ? "背面手牌" : R.card(c).label}" ${selected.includes(c) ? 'aria-pressed="true"' : ""}><img src="art/card-${back ? "back" : c}.webp" alt="" draggable="false"></button>`;
}
function note(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => toastEl.classList.remove("show"), 3500);
}
function show(title, body, actions = btn("返回", "close")) {
  cancelPresentation();
  clearTimeout(timer);
  modal.innerHTML = `<h2>${title}</h2><div class="dialog-body">${body}</div><div class="toolbar">${actions}</div>`;
  if (!modal.open) modal.showModal();
}
function close() {
  modal.close();
  schedule();
}
function dispatch(a) {
  if (busy || visualBusy) return false;
  try {
    const before = captureCards();
    profile = Store.commit(profile, a);
    visualBusy = view === 'table';
    render();
    animateCards(before, {...a, reveal: a.type==="draw"&&a.seat===0?profile.table?.shown?.[0]:null, deltas:profile.table?.result?.deltas});
    return true;
  } catch (e) {
    note(e.message);
    return false;
  }
}
function header(title) {
  return `<header class="bar"><h1>${title}</h1><span class="wallet">錢包 ${profile.wallet.toLocaleString()}</span><nav>${btn("存檔", "saves")}<button class="gear" data-action="settings" aria-label="遊戲設定"></button></nav></header>`;
}
function render() {
  clearHandPreview();
  clearTimeout(timer);
  document.body.classList.toggle("reduced", profile.settings.reduced);
  document.documentElement.classList.toggle("large", profile.settings.large);
  app.style.backgroundImage = `url('art/${view === "table" && profile.table ? "room-" + profile.table.type : "room-big2"}.webp')`;
  if (view === "home")
    app.innerHTML = `<section class="home"><div class="home-menu panel">${btn("進入撲克館", "lobby")}${profile.table ? btn("繼續牌局", "resume") : ""}${btn("存檔與備份", "saves")}${btn("遊戲設定", "settings")}</div></section>`;
  if (view === "lobby")
    app.innerHTML =
      header("CxQ 撲克館") +
      `<main class="screen"><div class="toolbar">${btn("角色席位", "roles")}${btn("會館小幫手", "helpers")}${btn("遊玩紀錄", "stats")}${profile.table ? btn("繼續牌局", "resume") : ""}</div><section class="lobby">${Object.entries(
        R.GAMES,
      )
        .map(
          ([k, n]) =>
            `<button class="game-tile" data-action="choose" data-game="${k}"><img src="art/cover-${k}${k === "dragon" ? "-v4" : ["thirteen", "sevens"].includes(k) ? "-v2" : ""}.webp" alt="${n}・${label[k]}" loading="lazy"></button>`,
        )
        .join("")}</section></main>`;
  if (view === "setup") renderSetup();
  if (view === "table") renderTable();
  if (view === "helper") renderHelper();
  schedule();
}
function renderSetup() {
  app.innerHTML =
    header(R.GAMES[game] + "・開桌") +
    `<main class="screen setup"><section class="panel"><h2>${label[game]}</h2><div class="seat-summary">${profile.seats.map((k, i) => `<div><img src="${portrait(k)}" alt=""><strong>${i === 0 ? "你" : "對手 " + i}</strong><span>${name(k)}</span></div>`).join("")}</div><div class="toolbar">${btn("選擇角色", "roles")}${btn("全部隨機", "random-all")}</div><details class="rules"><summary>玩法與規則</summary><p>${help[game]}</p></details></section><section class="panel"><label class="field">桌上本金<input id="buy" type="number" value="${Math.min(500, profile.wallet)}" min="100" max="10000" step="100"></label><label class="field">底注／每分<input id="unit" type="number" value="10" min="1" max="1000"></label><label class="field">牌桌<select id="mode"><option value="quick">快速桌・5 局</option><option value="continuous">持續桌</option></select></label>${["big2", "blackjack"].includes(game) ? '<label class="field">難度<select id="level"><option value="easy">簡單</option><option selected value="normal">普通</option><option value="hard">進階</option></select></label>' : '<input id="level" type="hidden" value="normal">'}<details class="rules"><summary>進階規則</summary>${ruleFields()}</details><div class="toolbar">${btn("返回", "lobby")}${btn("開始開桌", "open")}</div><small>只有桌上本金參與本桌輸贏，錢包其餘餘額不受影響。</small></section></main>`;
}
function seatsHTML() {
  return `<div class="seats">${profile.seats.map((k, i) => `<div class="seat-editor"><img src="${portrait(k)}" alt="${name(k)}"><strong>${i === 0 ? "你" : `對手 ${i}`}</strong><select data-seat="${i}" aria-label="${i === 0 ? "玩家" : "對手" + i}角色">${R.ROLES.map(([key, n]) => `<option value="${key}" ${key === k ? "selected" : ""}>${n}</option>`).join("")}</select><label><input type="checkbox" data-lock="${i}" ${profile.locks[i] ? "checked" : ""}>鎖定</label><button data-action="random-one" data-seat="${i}">隨機</button></div>`).join("")}</div>`;
}
function ruleFields() {
  const fields = {
    big2: [
      ["c3", "梅花 3 首出", true],
      ["aLow", "允許 A2345", false],
      ["twos", "剩 2 加罰", false],
      ["spadeTwo", "黑桃 2 加罰", false],
    ],
    blackjack: [["soft17", "莊家軟 17 補牌", false]],
    dragon: [["pillarDouble", "撞柱賠雙倍", true]],
    redpoint: [["spadeAce", "黑桃 A 計 30 分", true]],
  };
  return (
    (fields[game] || [])
      .map(
        ([k, n, v]) =>
          `<label class="field">${n}<input type="checkbox" data-rule="${k}" ${v ? "checked" : ""}></label>`,
      )
      .join("") || "<p>此玩法採標準簡明規則。</p>"
  );
}
function renderTable() {
  const t = profile.table;
  if (!t) {
    view = "lobby";
    render();
    return;
  }

  if (t.type === "thirteen")
    arr = structuredClone(t.arrangements[0] || t.draft || arr);
  let drawFrom = "",
    center = "",
    actions = "",
    hand = t.players[0].hand;
  const human = t.turn === 0 && !ended(t) && !paused;
  if (t.type === "thirteen") {
    const placed = Object.values(arr).flat();
    hand = hand.filter((c) => !placed.includes(c));
    center = `<div class="pile-grid">${["front", "middle", "back"].map((k, i) => `<div class="pile"><button data-action="pile" data-pile="${k}" aria-pressed="${pile === k}">${["頭墩", "中墩", "尾墩"][i]} ${arr[k].length}/${i === 0 ? 3 : 5}</button><div class="cards">${arr[k].map((c) => cardHTML(c, "unplace", true)).join("")}</div></div>`).join("")}</div>`;
    actions =
      btn("自動理牌", "arrange-auto") +
      btn("重排", "arrange-clear") +
      btn("確認比牌", "arrange-submit");
  } else if (t.type === "blackjack") {
    const showDealer = ended(t);
    center = `<div class="cards dealer-cards">${t.dealer.map((c, i) => cardHTML(c, "", true, !showDealer && i > 0)).join("")}</div>`;
    if (t.phase === "playing")
      actions =
        btn("要牌", "hit", human ? "" : "disabled") +
        btn("停牌", "stand", human ? "" : "disabled") +
        btn(
          "加倍",
          "double",
          human &&
            t.players[0].hand.length === 2 &&
            t.players[0].chips >= t.bets[0] * 2
            ? ""
            : "disabled",
        );
  } else if (t.type === "sevens") {
    center = `<div class="sevens-rows">${R.SUITS.map((s) => `<div class="sevens-row">${t.rows[s] ? [...new Set([t.rows[s][0], t.rows[s][1]])].map((r) => cardHTML(s + (r === 1 ? "A" : R.RANKS[r - 1]), "", true)).join("<span>～</span>") : cardHTML(s + "7", "", true, true)}</div>`).join("")}</div>`;
    actions =
      btn("接牌", "play", human ? "" : "disabled") +
      btn("跳過", "pass", human ? "" : "disabled") +
      btn("提示", "hint", human ? "" : "disabled");
  } else if (t.type === "redpoint") {
    center = `<div class="cards">${t.board.map((c) => cardHTML(c, "target", true)).join("")}</div><p>你的紅點：${t.players[0].captured.reduce((s, c) => s + R.redScore(c, t.rules.spadeAce), 0)}</p>`;
    actions =
      btn("出牌／撿取", "play", human ? "" : "disabled") +
      btn("提示", "hint", human ? "" : "disabled");
  } else if (t.type === "oldmaid") {
    let source = (t.turn + 1) % 4;
    while (!t.players[source].hand.length) source = (source + 1) % 4;
    drawFrom = name(t.players[source].role);
    center = `<div class="cards">${t.players[source].hand.map((_, i) => `<button class="card small" data-action="draw" data-index="${i}" ${human ? "" : "disabled"} aria-label="第 ${i + 1} 張背面手牌"><img src="art/card-back.webp" alt=""></button>`).join("")}</div>`;
    actions = "<p>點選一張背面牌抽取，配對後自動收牌。</p>";
  } else {
    center = `<div class="cards">${(t.type === "big2" ? (t.last ? t.shown || [] : []) : t.board).map((c) => cardHTML(c, "", t.type === "big2")).join("")}</div>`;
    if (t.type === "big2")
      actions =
        btn("出牌", "play", human ? "" : "disabled") +
        btn("跳過", "pass", human ? "" : "disabled") +
        btn("提示", "hint", human ? "" : "disabled");
    else hand = [];
  }
  if (t.phase === "betting") {
    actions =
      `<label>下注 <input id="bet" type="number" min="1" max="${t.players[t.turn].chips}" value="${Math.min(t.unit, t.players[t.turn].chips)}"></label>` +
      btn(
        t.type === "highlow" ? "翻牌" : t.type === "dragon" ? "射門" : "發牌",
        "bet",
        human ? "" : "disabled",
      ) +
      (t.type === "dragon" ? btn("跳過", "pass", human ? "" : "disabled") : "");
  }
  if (ended(t)) {
    hand = [];
    center = `<section class="panel result-panel"><h2>${t.phase === "tableEnd" ? "本桌結束" : "本局結算"}</h2><p>${escape(t.result.detail)}</p>${["highlow", "dragon", "big2", "sevens"].includes(t.type) ? '<div class="cards result-reveal">' + (["big2","sevens"].includes(t.type)?t.shown:t.board).map((c, i) => "<div>" + cardHTML(c, "", true) + (t.type === "highlow" ? "<small>" + name(t.players[i].role) + "</small>" : "") + "</div>").join("") + "</div>" : ""}${t.type === "blackjack" ? "<p>莊家 " + R.bj(t.dealer).total + ' 點</p><div class="cards">' + t.dealer.map((c) => cardHTML(c, "", true)).join("") + "</div>" : ""}<div class="result-grid">${t.players.map((x, i) => `<div data-delta="${t.result.deltas[i]}"><img src="art/seat-${x.role}${t.result.deltas[i]>0?"-win":""}.webp" alt="${name(x.role)}"><strong>${name(x.role)}</strong><div class="delta">${t.result.deltas[i] > 0 ? "+" : ""}${t.result.deltas[i]}</div><small>桌上 ${x.chips}</small></div>`).join("")}</div></section>`;
    actions =
      (t.phase === "roundEnd" ? btn("下一局", "next") : "") +
      btn("結回錢包並離桌", "leave") +
      btn("牌局明細", "details");
  }
  app.innerHTML = `<main class="table-screen ${ended(t) ? "is-ended" : ""}" data-game="${t.type}" data-last-seat="${t.lastSeat??0}"><header class="bar"><strong>${R.GAMES[t.type]}・第 ${t.round} 局</strong><span>${t.mode === "quick" ? "快速桌 5 局" : "持續桌"}</span><div>${btn("說明", "help")}${btn("暫停", "pause")}</div></header><section class="arena">${stacksHTML(t)}${[1, 2, 3].map((i) => `<div class="seat s${i} ${i === t.turn && !ended(t) ? "active" : ""}"><img class="table-character" src="art/seat-${t.players[i].role}.webp" alt="${name(t.players[i].role)}坐在牌桌旁">${opponentCards(t.players[i].hand.length)}<div><strong>${name(t.players[i].role)}</strong><br>${t.players[i].chips} 籌碼<br>${t.type === "blackjack" && t.players[i].hand.length ? R.bj(t.players[i].hand).total + " 點" : t.players[i].hand.length + " 張"}</div></div>`).join("")}<div class="play-area"><p class="message">${ended(t) ? "本局已完成" : busy ? "正在理牌…" : paused ? "已暫停" : t.phase === "arrange" ? "請完成三墩排牌" : drawFrom ? `向 ${drawFrom} 抽牌` : `輪到 ${name(t.players[t.turn].role)}`} · ${t.type==="big2"&&t.last?`${name(t.players[t.lastSeat].role)} 出牌 · `:""}${escape(t.message)}</p>${center}</div></section>${hand.length ? `<section class="hand-wrap"><div class="player-info"><img class="table-character" src="art/seat-${t.players[0].role}.webp" alt="${name(t.players[0].role)}"><div>${name(t.players[0].role)}<br>${t.players[0].chips} 籌碼${t.type === "blackjack" ? "<br>" + R.bj(t.players[0].hand).total + " 點" : ""}</div></div><div class="hand">${hand.map((c) => cardHTML(c, t.type === "thirteen" ? "place" : ["oldmaid", "blackjack"].includes(t.type) ? "" : "select")).join("")}</div></section>` : `<section class="empty-hand"><div class="player-info"><img class="table-character" src="art/seat-${t.players[0].role}.webp" alt="${name(t.players[0].role)}"><div>${name(t.players[0].role)}<br>${t.players[0].chips} 籌碼</div></div></section>`}<footer class="actions">${actions}</footer></main>`;
  const el = app.querySelector(".hand");
  fitHands(app);
}
function schedule() {
  clearTimeout(timer);
  if (!profile) return;
  const t = profile.table;
  if (
    view !== "table" ||
    !t ||
    ended(t) ||
    paused ||
    busy ||
    visualBusy ||
    modal.open ||
    document.hidden ||
    innerHeight > innerWidth
  )
    return;
  if (t.type === "thirteen") {
    if (t.arrangements[0]) timer = setTimeout(completeArrangers, 100);
    return;
  }
  if (t.turn === 0) return;
  timer = setTimeout(
    () => {
      if (paused || modal.open || document.hidden || innerHeight > innerWidth)
        return;
      const action = autoAction(profile.table) || {
        type: "bet",
        seat: profile.table.turn,
        amount: Math.min(
          profile.table.unit,
          profile.table.players[profile.table.turn].chips,
        ),
      };
      dispatch(action);
    },
    profile.settings.fast ? 350 : 1000,
  );
}
async function arrange(hand) {
  const id = ++workerId;
  return new Promise((resolve, reject) => {
    const worker = new Worker("./arranger.worker.mjs", { type: "module" });
    worker.onmessage = (e) => {
      if (e.data.id !== id) return;
      worker.terminate();
      e.data.error ? reject(Error(e.data.error)) : resolve(e.data.result);
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(Error(e.message));
    };
    worker.postMessage({ id, hand });
  });
}
function randomSeats(indices) {
  const seats = [...profile.seats],
    change = indices.filter((i) => !profile.locks[i]),
    fixed = seats.filter((_, i) => !change.includes(i)),
    pool = R.shuffled(
      R.ROLES.map((r) => r[0]).filter((k) => !fixed.includes(k)),
    );
  change.forEach((i) => (seats[i] = pool.pop()));
  dispatch({ type: "seats", seats });
  if (modal.open && modal.dataset.kind === "roles") showRoles();
}
function showRoles() {
  if (profile.table) return note("請先結束現有牌桌再更換角色");
  modal.dataset.kind = "roles";
  show(
    "選擇角色與對手",
    seatsHTML(),
    btn("全部隨機", "random-all") +
      btn("對手隨機", "random-ai") +
      btn("完成", "close"),
  );
}
function showSettings() {
  modal.dataset.kind = "settings";
  show(
    "遊戲設定",
    `<label class="field">背景音樂<select id="music">${[
      ["tea", "茶館輕樂"],
      ["wood", "木屋時光"],
      ["moon", "星月夢境"],
      ["off", "關閉音樂"],
    ]
      .map(
        ([v, n]) =>
          `<option value="${v}" ${profile.settings.music === v ? "selected" : ""}>${n}</option>`,
      )
      .join(
        "",
      )}</select></label><label class="field">音樂音量<input id="musicVolume" type="range" min="0" max="1" step=".05" value="${profile.settings.musicVolume}"></label><label class="field">音效音量<input id="soundVolume" type="range" min="0" max="1" step=".05" value="${profile.settings.soundVolume}"></label>${[
      ["fast", "快速節奏"],
      ["reduced", "減少動態效果"],
      ["large", "易讀文字"],
    ]
      .map(
        ([k, n]) =>
          `<label class="field">${n}<input id="${k}" type="checkbox" ${profile.settings[k] ? "checked" : ""}></label>`,
      )
      .join(
        "",
      )}<p><a href="credits.html" target="_blank" rel="noopener">音樂授權與製作名單</a></p>`,
    btn("全螢幕", "fullscreen") +
      btn("套用設定", "settings-save") +
      btn("返回", "close"),
  );
}
function showSaves() {
  modal.dataset.kind = "saves";
  show(
    "存檔與備份",
    `<p>${Store.WARNING}</p><p>即時存檔：${new Date(profile.updated).toLocaleString()} · 錢包 ${profile.wallet}</p>${Store.slots()
      .map(
        ({ n, profile: p, invalid }) =>
          `<div class="field"><span>紀錄 ${n}：${invalid ? "檔案損毀" : p ? new Date(p.updated).toLocaleString() : "尚未儲存"}</span>${btn("儲存", "slot-save", `data-slot="${n}"`)}${btn("讀取", "slot-load", `data-slot="${n}" ${!p ? "disabled" : ""}`)}</div>`,
      )
      .join("")}`,
    btn("匯出備份", "export") +
      btn("匯入備份", "import") +
      btn("返回", "close"),
  );
}
const audio = new Audio();
audio.loop = true;
audio.preload = "none";
let activeMusic = "",
  audioReady = false;
function music() {
  if (!audioReady || !profile) return;
  if (
    document.hidden ||
    innerHeight > innerWidth ||
    profile.settings.music === "off"
  ) {
    audio.pause();
    return;
  }
  const key = profile.settings.music;
  if (key !== activeMusic) {
    audio.pause();
    audio.src = `audio/${key}-small.mp3`;
    activeMusic = key;
  }
  audio.volume = profile.settings.musicVolume;
  audio.play().catch(() => {});
}
let ac;
function sound(kind="tap") {
  if (!profile.settings.soundVolume) return;
  try {
    ac ??= new AudioContext();
    if(kind==='card'||kind==='deal'){
      const buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*.075),ac.sampleRate),d=buffer.getChannelData(0);
      for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
      const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),gain=ac.createGain();
      source.buffer=buffer;filter.type='bandpass';filter.frequency.value=kind==='deal'?1800:1000;
      gain.gain.value=profile.settings.soundVolume*.25;
      source.connect(filter).connect(gain).connect(ac.destination);source.start();return;
    }
    const osc = ac.createOscillator(),
      gain = ac.createGain();
    osc.type = kind==="card"||kind==="deal"?"triangle":"sine";
    osc.frequency.setValueAtTime(({card:260,deal:420,win:880,pass:220})[kind]||600, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(360, ac.currentTime + 0.06);
    gain.gain.setValueAtTime(
      profile.settings.soundVolume * 0.06,
      ac.currentTime,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.08);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.09);
  } catch {}
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || b.disabled) return;
  const a = b.dataset.action;
  if(visualBusy&&!['pause','help','settings','close','unpause'].includes(a))return;
  if (!profile) return;
  audioReady = true;
  music();
  sound();
  try {
    if (a === "close") {
      close();
      return;
    }
    if (a === "lobby") {
      view = "lobby";
      render();
      return;
    }
    if (a === "resume") {
      view = "table";
      paused = false;
      render();
      return;
    }
    if (a === "choose") {
      if (profile.table) {
        view = "table";
        render();
        note("現有牌局尚未結束，請先完成或存檔。");
        return;
      }
      game = b.dataset.game;
      view = "setup";
      render();
      return;
    }
    if (a === "roles") return showRoles();
    if (a === "random-all") return randomSeats([0, 1, 2, 3]);
    if (a === "random-ai") return randomSeats([1, 2, 3]);
    if (a === "random-one") return randomSeats([Number(b.dataset.seat)]);
    if (a === "open") {
      if (!profile.acknowledged) {
        show(
          "本機存檔提醒",
          `<p>${Store.WARNING}</p>`,
          btn("我了解，返回開桌", "ack"),
        );
        return;
      }
      const rules = Object.fromEntries(
        [...app.querySelectorAll("[data-rule]")].map((x) => [
          x.dataset.rule,
          x.checked,
        ]),
      );
      const act = {
        type: "open",
        id: crypto.randomUUID(),
        game,
        buy: Number(document.querySelector("#buy").value),
        unit: Number(document.querySelector("#unit").value),
        mode: document.querySelector("#mode").value,
        level: document.querySelector("#level").value,
        rules,
      };
      b.disabled = true;
      try {
        await prepareGame(act.game);
      } finally {
        b.disabled = false;
      }
      if (profile.table || view !== "setup" || game !== act.game) return;
      if (dispatch(act)) {
        selected = [];
        arr = { front: [], middle: [], back: [] };
        view = "table";
        paused = false;
        render();
        animateCards(new Map(), { type: "deal", seat: 0 });
      }
      return;
    }
    if (a === "ack") {
      dispatch({ type: "ack" });
      close();
      return;
    }
    if (a === "fullscreen") {
      await enterFullscreen();
      return;
    }
    if (a === "settings") return showSettings();
    if (a === "settings-save") {
      const values = Object.fromEntries(
        ["music", "musicVolume", "soundVolume", "fast", "reduced", "large"].map(
          (k) => [
            k,
            ["fast", "reduced", "large"].includes(k)
              ? document.getElementById(k).checked
              : k === "music"
                ? document.getElementById(k).value
                : Number(document.getElementById(k).value),
          ],
        ),
      );
      dispatch({ type: "settings", values });
      music();
      close();
      return;
    }
    if (a === "saves") return showSaves();
    if (a === "slot-save") {
      Store.saveSlot(profile, Number(b.dataset.slot));
      note("存檔已儲存");
      showSaves();
      return;
    }
    if (a === "slot-load") {
      const slot = Number(b.dataset.slot);
      show(
        "確認讀取",
        "<p>讀取會將整個錢包與牌局還原為此紀錄。現在的進度請先備份。</p>",
        btn("取消", "saves") +
          btn("確認讀取", "slot-confirm", `data-slot="${slot}"`),
      );
      return;
    }
    if (a === "slot-confirm") {
      profile = Store.restoreSlot(profile, Number(b.dataset.slot));
      view = "home";
      arr = { front: [], middle: [], back: [] };
      close();
      render();
      return;
    }
    if (a === "export") {
      const text = await Store.exportBackup(profile),
        url = URL.createObjectURL(
          new Blob([text], { type: "application/json" }),
        ),
        link = document.createElement("a");
      link.href = url;
      link.download =
        "CxQ-撲克館-" + new Date().toISOString().slice(0, 10) + ".json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      note("備份已交由瀏覽器下載，請確認檔案已保存");
      return;
    }
    if (a === "import") {
      document.querySelector("#backup-file").click();
      return;
    }
    if (a === "pause") {
      paused = true;
      show(
        "牌局暫停",
        "<p>進度已自動記錄。未結束的回合需保留，不能重新發牌。</p>",
        btn("繼續", "unpause") +
          btn("存檔備份", "saves") +
          btn("遊戲設定", "settings") +
          btn("返回館內大廳", "pause-lobby"),
      );
      return;
    }
    if (a === "unpause") {
      paused = false;
      close();
      render();
      return;
    }
    if (a === "pause-lobby") {
      view = "lobby";
      close();
      render();
      return;
    }
    if (a === "help") {
      show(
        R.GAMES[profile.table.type] + "玩法",
        `<p>${help[profile.table.type]}</p>`,
      );
      return;
    }
    if (a === "stats") {
      show(
        "遊玩紀錄",
        Object.entries(R.GAMES)
          .map(([k, n]) => {
            const s = profile.stats[k] || { rounds: 0, wins: 0 };
            return `<p>${n}：${s.rounds} 局 · ${s.wins} 局淨獲利</p>`;
          })
          .join("") +
          `<details class="ledger"><summary>錢包紀錄</summary>${profile.ledger
            .slice()
            .reverse()
            .map(
              (x) =>
                `<p>${escape(x.label)} ${x.delta > 0 ? "+" : ""}${x.delta}</p>`,
            )
            .join("")}</details>`,
      );
      return;
    }
    if (a === "helpers") {
      if (profile.table) return note("請先完成牌局並離桌，才能領取補助");
      show(
        "會館小幫手",
        `<p>錢包低於 500 時開放獎勵；每次完成可獲 100～200，補至 500 為止。不需下注，不扣籌碼。</p><div class="toolbar">${[
          ["tea", "茶館送茶"],
          ["stars", "星光接接樂"],
          ["pairs", "幸運配對"],
        ]
          .map(([k, n]) =>
            btn(
              n,
              "helper-start",
              `data-helper="${k}" ${profile.wallet >= 500 ? "disabled" : ""}`,
            ),
          )
          .join("")}</div>`,
        btn("返回", "close") +
          btn(
            "救急補至 100",
            "rescue",
            profile.wallet >= 100 ? "disabled" : "",
          ),
      );
      return;
    }
    if (a === "rescue") {
      dispatch({ type: "rescue", id: crypto.randomUUID() });
      close();
      return;
    }
    if (a === "helper-start") {
      if (profile.helper) {
        helperRun = makeHelper(profile.helper.game);
      } else if (
        dispatch({
          type: "helperStart",
          id: crypto.randomUUID(),
          game: b.dataset.helper,
        })
      )
        helperRun = makeHelper(b.dataset.helper);
      if (helperRun) {
        view = "helper";
        close();
        render();
        startHelper();
      }
      return;
    }
    if (a.startsWith("helper-")) return helperAction(a, b);
    const t = profile.table;
    if (!t) return;
    if (a === "next") {
      selected = [];
      target = null;
      arr = { front: [], middle: [], back: [] };
      dispatch({ type: "next" });
      return;
    }
    if (a === "leave") {
      if (dispatch({ type: "leave" })) {
        view = "lobby";
        render();
      }
      return;
    }
    if (a === "details") {
      show(
        "本局牌局明細",
        t.players
          .map(
            (x, i) =>
              `<section><h3>${name(x.role)}：${t.result.deltas[i] > 0 ? "+" : ""}${t.result.deltas[i]}</h3>${t.type === "thirteen" ? ["front", "middle", "back"].map((k, j) => "<p>" + ["頭墩", "中墩", "尾墩"][j] + "・" + R.poker(t.arrangements[i][k]).name + '</p><div class="cards">' + t.arrangements[i][k].map((c) => cardHTML(c, "", true)).join("") + "</div>").join("") : '<div class="cards">' + (t.type === "highlow" ? [t.board[i]] : x.hand).map((c) => cardHTML(c, "", true)).join("") + "</div>"}</section>`,
          )
          .join(""),
      );
      return;
    }
    if (a === "pile") {
      pile = b.dataset.pile;
      render();
      return;
    }
    if (a === "place") {
      if (ended(t) || busy || t.arrangements[0]) return;
      const c = b.dataset.card;
      if (Object.values(arr).flat().includes(c)) return;
      if (arr[pile].length >= (pile === "front" ? 3 : 5))
        return note("此墩已滿");
      arr[pile].push(c);
      dispatch({ type: "draft", arrangement: arr });
      return;
    }
    if (a === "unplace") {
      if (busy || t.arrangements[0]) return;
      for (const k of Object.keys(arr))
        arr[k] = arr[k].filter((c) => c !== b.dataset.card);
      dispatch({ type: "draft", arrangement: arr });
      return;
    }
    if (a === "arrange-clear") {
      if (busy || t.arrangements[0]) return;
      arr = { front: [], middle: [], back: [] };
      dispatch({ type: "draft", arrangement: arr });
      return;
    }
    if (a === "arrange-auto") {
      if (busy || t.arrangements[0]) return;
      busy = true;
      render();
      try {
        arr = await arrange(t.players[0].hand);
        if (profile.table?.id === t.id && profile.table.round === t.round)
          profile = Store.commit(profile, { type: "draft", arrangement: arr });
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (a === "arrange-submit") {
      if (t.arrangements[0]) return completeArrangers();
      if (!R.thirteenValid(arr, t.players[0].hand))
        return note("請確認牌數與墩序，頭墩不能大於中墩");
      if (dispatch({ type: "arrange", seat: 0, arrangement: arr }))
        await completeArrangers();
      return;
    }
    if (t.turn !== 0 || paused || busy || visualBusy || ended(t)) return;
    if (a === "select") {
      const c = b.dataset.card;
      const beforeSelect=captureCards();
      selected =
        t.type === "big2"
          ? selected.includes(c)
            ? selected.filter((x) => x !== c)
            : [...selected, c]
          : selected[0] === c
            ? []
            : [c];
      target = null;
      render();
      if(!profile.settings.reduced)for(const el of app.querySelectorAll('.hand .card')){
 const old=beforeSelect.cards.find(c=>c.key===el.dataset.face),r=el.getBoundingClientRect();
 if(old)el.animate([{translate:'0 '+(old.rect.y-r.y)+'px'},{translate:'0 0'}],{duration:140,easing:'ease-out'});
}
      return;
    }
    if (a === "target") {
      if (selected.length !== 1) return note("請先選一張手牌");
      if (!R.redMatch(selected[0], b.dataset.card))
        return note("這兩張牌無法配對");
      target = b.dataset.card;
      note("已選桌牌：" + R.card(target).label);
      return;
    }
    if (a === "hint") {
      const x = autoAction(t);
      if (x?.cards) {
        selected = x.cards;
        target = x.target;
        render();
        note("已選取建議牌");
      } else note("目前可跳過");
      return;
    }
    let action;
    if (a === "play") {
      action = { type: "play", seat: 0, cards: [...selected], target };
      if (t.type === "redpoint" && !target && selected.length === 1) {
        const matches = t.board.filter((c) => R.redMatch(selected[0], c));
        if (matches.length === 1) action.target = matches[0];
      }
    }
    if (["pass", "hit", "stand", "double"].includes(a))
      action = { type: a, seat: 0 };
    if (a === "bet")
      action = {
        type: "bet",
        seat: 0,
        amount: Number(document.querySelector("#bet").value),
      };
    if (a === "draw")
      action = { type: "draw", seat: 0, index: Number(b.dataset.index) };
    if (action) {
      selected = [];
      target = null;
      dispatch(action);
    }
  } catch (error) {
    note(error.message);
    busy = false;
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  try {
    if (el.matches("[data-seat]")) {
      const i = Number(el.dataset.seat),
        seats = [...profile.seats],
        other = seats.indexOf(el.value);
      if (profile.locks[i] || (other !== -1 && profile.locks[other])) {
        note("此席位已鎖定，請先解除鎖定");
        if (modal.open) showRoles();
        else render();
        return;
      }
      if (other !== -1) [seats[i], seats[other]] = [seats[other], seats[i]];
      else seats[i] = el.value;
      dispatch({ type: "seats", seats });
      if (modal.open) showRoles();
    }
    if (el.matches("[data-lock]")) {
      const locks = [...profile.locks];
      locks[Number(el.dataset.lock)] = el.checked;
      dispatch({ type: "seats", seats: profile.seats, locks });
    }
  } catch (error) {
    note(error.message);
  }
});
let pendingImport = null;
document.querySelector("#backup-file").addEventListener("change", async (e) => {
  try {
    const f = e.target.files[0];
    if (!f) return;
    pendingImport = await Store.parseBackup(await f.text());
    show(
      "匯入備份",
      `<p>備份時間 ${new Date(pendingImport.updated).toLocaleString()}，錢包 ${pendingImport.wallet}。匯入會取代目前進度。</p>`,
      btn("取消", "close") + btn("確認匯入", "import-confirm"),
    );
  } catch (error) {
    note(error.message);
  } finally {
    e.target.value = "";
  }
});
document.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="import-confirm"]') && pendingImport) {
    try {
      if (profile) {
        pendingImport.revision = profile.revision + 1;
        pendingImport.updated = Date.now();
        profile = Store.saveProfile(pendingImport, profile.revision);
      } else profile = Store.recoverProfile(pendingImport, damagedRaw);
      pendingImport = null;
      view = "home";
      close();
      render();
    } catch (error) {
      note(error.message);
    }
  }
});
function suspend() {
  cancelPresentation();
  clearTimeout(timer);
  if (profile?.table && !ended(profile.table)) {
    paused = true;
    if (view === "table" && !modal.open)
      show(
        "進度已保留",
        "<p>回到橫式畫面後，按繼續恢復牌局。</p>",
        btn("繼續", "unpause"),
      );
  }
  music();
}
document.addEventListener("visibilitychange", () =>
  document.hidden ? suspend() : music(),
);
window.addEventListener("resize", () => {
  cancelPresentation();fitHands(app);schedule();
  if (innerHeight > innerWidth) suspend();
});
window.addEventListener("storage", (e) => {
  if (e.key === Store.KEY) {
    paused = true;
    clearTimeout(timer);
    show(
      "其他分頁已更新存檔",
      "<p>為避免覆蓋進度，請重新整理此分頁。</p>",
      btn("重新載入", "reload"),
    );
  }
});
document.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="reload"]')) location.reload();
});
modal.addEventListener("cancel", (e) => {
  e.preventDefault();
  close();
});
document.addEventListener("contextmenu", (e) => {
  if (e.target.closest(".card")) e.preventDefault();
});
function makeHelper(type) {
  return {
    type,
    score: 0,
    left: 30,
    last: performance.now(),
    order: Math.floor(Math.random() * 3),
    cards: R.shuffled([0, 1, 2, 3, 0, 1, 2, 3]),
    open: [],
    matched: [],
    x: 50,
    fall: 0,
    fallX: 20 + Math.random() * 60,
  };
}
function renderHelper() {
  app.innerHTML =
    header("會館小幫手") +
    `<main class="screen panel helper-screen"><h2>${{ tea: "茶館送茶", stars: "星光接接樂", pairs: "幸運配對" }[helperRun.type]}</h2><p id="helper-status"></p><section class="helper-board helper-${helperRun.type}" id="helper-board"></section><p>不扣籌碼，完成即可領取基本獎勵。</p></main>`;
  drawHelper();
}
function drawHelper() {
  if (view !== "helper" || !helperRun) return;
  const h = helperRun,
    board = document.querySelector("#helper-board");
  document.querySelector("#helper-status").textContent =
    `剩餘 ${Math.ceil(h.left)} 秒 · 成功 ${h.score} 次`;
  if (h.type === "tea")
    board.innerHTML = `<div>請送上<img src="art/helper-tea-${h.order}.webp" alt="茶點 ${h.order + 1}"></div>${[0, 1, 2].map((i) => `<button data-action="helper-tea" data-value="${i}" aria-label="送出茶點 ${i + 1}"><img src="art/helper-tea-${i}.webp" alt=""></button>`).join("")}`;
  else if (h.type === "pairs")
    board.innerHTML = h.cards
      .map(
        (v, i) =>
          `<button class="card" data-action="helper-pair" data-index="${i}" ${h.matched.includes(i) ? "disabled" : ""} aria-label="配對卡 ${i + 1}"><img src="art/${h.open.includes(i) || h.matched.includes(i) ? "helper-tea-" + v : "card-back"}.webp" alt=""></button>`,
      )
      .join("");
  else {
    if (!board.querySelector(".helper-target"))
      board.innerHTML = `<img class="helper-target" src="art/helper-star.webp" style="left:${h.fallX}%;top:${h.fall}%" alt="星光"><img class="helper-basket" src="art/helper-basket.webp" style="left:${h.x}%" alt="接星籃">`;
    board.querySelector(".helper-target").style.left = h.fallX + "%";
    board.querySelector(".helper-target").style.top = h.fall + "%";
    board.querySelector(".helper-basket").style.left = h.x + "%";
    board.onpointermove = (e) => {
      const r = board.getBoundingClientRect();
      h.x = Math.max(0, Math.min(85, ((e.clientX - r.left) / r.width) * 100));
    };
    board.onpointerdown = board.onpointermove;
  }
}
function startHelper() {
  const tick = () => {
    if (view !== "helper" || !helperRun) return;
    const h = helperRun,
      now = performance.now(),
      dt = Math.min(0.1, (now - h.last) / 1000);
    h.last = now;
    if (!document.hidden && innerWidth > innerHeight && !modal.open) {
      h.left -= dt;
      if (h.type === "stars") {
        h.fall += dt * 45;
        if (h.fall > 70) {
          if (Math.abs(h.fallX - h.x) < 15) h.score++;
          h.fall = 0;
          h.fallX = 5 + Math.random() * 75;
        }
      }
      if (h.left <= 0) {
        const score = h.score;
        helperRun = null;
        view = "lobby";
        dispatch({ type: "helperFinish", id: profile.helper.id, score });
        render();
        note("幫手工作完成，補助已存入錢包");
        return;
      }
      if (h.type === "stars") {
        drawHelper();
      } else {
        document.querySelector("#helper-status").textContent =
          `剩餘 ${Math.ceil(h.left)} 秒 · 成功 ${h.score} 次`;
      }
    }
    requestAnimationFrame(tick);
  };
  tick();
}
function helperAction(a, b) {
  const h = helperRun;
  if (!h) return;
  if (a === "helper-tea") {
    if (Number(b.dataset.value) === h.order) {
      h.score++;
      h.order = (h.order + 1 + Math.floor(Math.random() * 2)) % 3;
    }
    drawHelper();
  }
  if (a === "helper-pair") {
    const i = Number(b.dataset.index);
    if (h.open.length >= 2 || h.open.includes(i) || h.matched.includes(i))
      return;
    h.open.push(i);
    if (h.open.length === 2) {
      const [x, y] = h.open;
      if (h.cards[x] === h.cards[y]) {
        h.matched.push(x, y);
        h.score++;
        h.open = [];
        if (h.matched.length === 8) {
          h.cards = R.shuffled(h.cards);
          h.matched = [];
        }
      } else
        setTimeout(() => {
          if (helperRun === h) {
            h.open = [];
            drawHelper();
          }
        }, 600);
    }
    drawHelper();
  }
}
async function enterFullscreen() {
  try {
    if (!document.fullscreenElement)
      await document.documentElement.requestFullscreen?.();
    await screen.orientation?.lock?.("landscape");
  } catch {
    note("此瀏覽器不支援鎖定方向；請橫放手機遊玩");
  }
}
function opponentCards(count){
 return '<span class="opponent-hand" aria-label="'+count+' 張背面手牌">'+Array.from({length:Math.min(5,count)},(_,i)=>'<img src="art/card-back.webp" alt="" style="--fan:'+i+'">').join('')+'</span>';
}
function stacksHTML(t){
 const stack=(n,cls,label)=>n?'<div class="'+cls+'" aria-label="'+label+' '+n+' 張">'+Array.from({length:Math.min(5,Math.ceil(n/4))},(_,i)=>'<img src="art/card-back.webp" alt="" style="--layer:'+i+'">').join('')+'<small>'+label+' '+n+'</small></div>':'';
 return '<div class="table-stacks">'+stack(t.deck?.length||0,'deck-stack','牌庫')+stack((t.discard?.length||0)-(t.type==='big2'&&t.last?(t.shown?.length||0):0)||t.players.reduce((n,p)=>n+(p.captured?.length||0),0),'discard-stack','收牌')+'</div>';
}
function captureCards(){return capture(app);}
function cancelPresentation(){
 motionEpoch++;cancelMotion();clearHandPreview();visualBusy=false;
 app.removeAttribute('aria-busy');
}
async function animateCards(previous,action){
 const epoch=++motionEpoch;
 visualBusy=view==='table';clearTimeout(timer);
 app.setAttribute('aria-busy',String(visualBusy));
 try{
   if(view==='table')await animateTable(app,previous instanceof Map?{cards:[],seats:[]}:previous,action,profile.settings,sound);
 }catch(error){
   cancelMotion();console.warn('Presentation skipped; committed game state preserved',error);
 }finally{
   if(epoch===motionEpoch){visualBusy=false;app.removeAttribute('aria-busy');schedule();}
 }
}
document.addEventListener('click',e=>{
 if(view==='table'&&!visualBusy&&selected.length&&e.target.closest('.arena,.hand-wrap')&&!e.target.closest('button')){
  selected=[];target=null;render();
 }
});
const handResize=new ResizeObserver(()=>fitHands(app));
handResize.observe(app);
async function completeArrangers() {
  if (
    busy ||
    profile.table?.type !== "thirteen" ||
    ended(profile.table) ||
    !profile.table.arrangements[0]
  )
    return;
  busy = true;
  clearTimeout(timer);
  render();
  const tableId = profile.table.id,
    round = profile.table.round;
  try {
    for (let i = 1; i < 4; i++) {
      if (profile.table.arrangements[i]) continue;
      const result = await arrange(profile.table.players[i].hand);
      if (profile.table?.id !== tableId || profile.table.round !== round)
        return;
      profile = Store.commit(profile, {
        type: "arrange",
        seat: i,
        arrangement: result,
      });
    }
  } catch (e) {
    note(e.message);
  } finally {
    busy = false;
    render();
  }
}
async function acquireTab() {
  if (!navigator.locks) return true;
  return new Promise((resolve, reject) => {
    navigator.locks
      .request("cxq-poker-exclusive-tab", { ifAvailable: true }, (lock) => {
        resolve(!!lock);
        if (lock) return new Promise(() => {});
      })
      .catch(reject);
  });
}
document.addEventListener("click", (e) => {
  if (e.target.closest('[data-recovery="import"]'))
    document.querySelector("#backup-file").click();
  if (e.target.closest('[data-recovery="raw"]')) {
    const url = URL.createObjectURL(
        new Blob([damagedRaw || ""], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "CxQ-poker-original-data.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});
if (!(await acquireTab())) {
  app.innerHTML =
    '<section class="panel recovery"><h1>撲克館已在其他分頁開啟</h1><p>請關閉另一分頁後重新載入，避免進度互相覆蓋。</p>' +
    btn("重新載入", "reload") +
    "</section>";
} else
  try {
    profile = Store.readProfile();
    render();
  } catch (error) {
    damagedRaw = localStorage.getItem(Store.KEY);
    app.innerHTML =
      '<section class="panel recovery"><h1>存檔需要檢查</h1><p>未覆蓋原有資料。可以先下載原始資料，再匯入已保存的備份。</p><button class="btn" data-recovery="raw">下載原始資料</button><button class="btn" data-recovery="import">匯入備份恢復</button></section>';
    note(error.message);
  }
const loadedImages = new Map();
function warmImage(src) {
  if (loadedImages.has(src)) return loadedImages.get(src);
  const p = new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(src);
    i.onerror = () => {
      loadedImages.delete(src);
      reject(Error("圖片載入中斷，請確認連線後再試一次"));
    };
    i.src = src;
  });
  loadedImages.set(src, p);
  return p;
}
async function prepareGame(type) {
  const queue = [
    ...R.deck(type === "oldmaid").map((c) => "art/card-" + c + ".webp"),
    "art/card-back.webp",
    "art/chip-stack.webp",
    ...profile.seats.flatMap(k=>["art/seat-"+k+".webp","art/seat-"+k+"-win.webp"]),
    "art/room-" + type + ".webp",
  ];
  if (queue.every((s) => loadedImages.has(s))) return;
  note("正在準備牌桌與牌面…");
  let at = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (at < queue.length) await warmImage(queue[at++]);
    }),
  );
  toastEl.classList.remove("show");
}
// Sliding over an overlapping hand previews one public card, selecting only on release.
function clearHandPreview(){handPreview?.remove();handPreview=null;handGesture=null;}
document.addEventListener('pointerdown',e=>{
 if(visualBusy||paused||e.button!==0||e.isPrimary===false)return;
 const hand=e.target.closest('.hand'),button=e.target.closest('[data-action="select"]');
 if(!hand||!button)return;
 handGesture={id:e.pointerId,x:e.clientX,y:e.clientY,hand,button,moved:false};
});
document.addEventListener('pointermove',e=>{
 const g=handGesture;if(!g||e.pointerId!==g.id)return;
 if(Math.hypot(e.clientX-g.x,e.clientY-g.y)<10&&!g.moved)return;
 g.moved=true;
 const r=g.hand.getBoundingClientRect();
 if(e.clientY<r.top-35||e.clientY>r.bottom+35){clearHandPreview();return;}
 const cards=[...g.hand.querySelectorAll('[data-action="select"]')];
 g.button=cards.filter(b=>b.getBoundingClientRect().left<=e.clientX).at(-1)||cards[0];
 if(!g.button)return;
 handPreview??=Object.assign(new Image(),{className:'hand-preview'});
 handPreview.src=g.button.querySelector('img').src;handPreview.alt=g.button.ariaLabel;
 document.body.append(handPreview);
 handPreview.style.left=Math.max(4,Math.min(innerWidth-84,e.clientX-40))+'px';
 handPreview.style.top=Math.max(50,r.top-112)+'px';
});
document.addEventListener('pointerup',e=>{
 const g=handGesture;if(!g||e.pointerId!==g.id)return;
 const b=g.button,moved=g.moved;clearHandPreview();
 if(moved){suppressHandClick=performance.now()+350;b?.click();}
});
document.addEventListener('click',e=>{
 if(e.isTrusted&&performance.now()<suppressHandClick&&e.target.closest('.hand')){e.preventDefault();e.stopImmediatePropagation();}
},true);
document.addEventListener('pointercancel',clearHandPreview);
document.addEventListener('visibilitychange',clearHandPreview);
