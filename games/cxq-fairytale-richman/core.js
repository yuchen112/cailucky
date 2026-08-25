"use strict";
function richCard(c, x, y, w, h, buttonId = "") {
  const d = cardDef(c),
    im = IM["card_" + d.cover];
  contain(im, x, y, w, h, 1);
  X.save();
  X.fillStyle = "rgba(4,10,31,.9)";
  X.fillRect(x, y + h - 68, w, 68);
  X.restore();
  fitTxt(
    d.name,
    x + w / 2,
    y + h - 45,
    w - 16,
    16,
    "center",
    "#fff3b3",
    1000,
    true,
    10,
  );
  txt(
    `${d.cost} 點券`,
    x + w / 2,
    y + h - 19,
    12,
    "center",
    "#d9efff",
    900,
    true,
  );
  if (buttonId) S.buttons.push({ id: buttonId, x, y, w, h, en: true });
}
function richTool(c, x, y, w, h, buttonId = "") {
  const d = toolDef(c),
    im = IM["tool_" + d.cover];
  contain(IM.mapCardFrame, x, y, w, h, 0.98);
  contain(im, x + 18, y + 12, w - 36, h - 82, 1);
  fitTxt(d.name, x + w / 2, y + h - 50, w - 20, 16, "center", "#fff3b3", 1000, true, 10);
  txt(`${d.cost} 點券`, x + w / 2, y + h - 23, 12, "center", "#d9efff", 900, true);
  if (buttonId) S.buttons.push({ id: buttonId, x, y, w, h, en: true });
}
const C = document.getElementById("game"),
  X = C.getContext("2d", { alpha: false });
const W = 1600,
  H = 900,
  MW = 3200,
  MH = 1800,
  A = "assets/";
const IM = {};
const CHAR_KEYS = [
  "joy",
  "dream",
  "night",
  "sadness",
  "trust",
  "memory",
  "growth",
  "healing",
  "luck",
  "hope",
];
const CHAR_NAMES = [
  "快樂",
  "夢想",
  "夜晚陪伴",
  "悲傷",
  "信任",
  "回憶",
  "成長",
  "療癒",
  "幸運",
  "希望",
];
const CHAR_TITLES = [
  "派對小彩星",
  "星願魔法師",
  "月夜守護者",
  "雨天陪伴者",
  "鑰匙守護者",
  "回憶收藏家",
  "森林旅伴",
  "暖心絨絨",
  "四葉鈴狐",
  "光線編織者",
];
const CHAR_CONCEPTS = [
  "把日常變成值得笑的時刻。",
  "替願望點亮下一步。",
  "在夜晚陪你安靜前進。",
  "陪你把難過慢慢放下。",
  "守住約定與安心感。",
  "把重要片段收進披風裡。",
  "一步一步長大的森林夥伴。",
  "陪你把低落安靜地走過。",
  "帶著剛剛好的好運同行。",
  "溫柔地把明天點亮。",
];
const CHAR_ROLES = [
  "幸運型",
  "骰控型",
  "卡片型",
  "防禦型",
  "商店型",
  "移動型",
  "土地型",
  "小遊戲型",
  "收租型",
  "特殊型",
];
const ROLE_DESC = [
  "正向事件獎金提高",
  "骰點過低時有機會修正",
  "抽卡時有機會額外獲得卡片",
  "支付租金時享有減免",
  "商店價格較低",
  "移動能力較穩定",
  "購地價格享有折扣",
  "小遊戲現金獎勵提高",
  "收到的租金提高",
  "首次瀕臨破產可獲救",
];
const PLAYER_COLORS = ["#ff716e", "#6db9ff", "#7ed87c", "#ffd05d"];
let REGION_NAMES = ["星願花圃", "月輝城鎮", "森語溪谷", "玫瑰商街"];
const MAPS = [
  {
    key: "starwish",
    name: "星願花園",
    tag: "初次冒險",
    difficulty: "輕鬆",
    desc: ["道路平穩、價格均衡", "適合第一次遊玩"],
    regions: ["星願花圃", "月輝城鎮", "森語溪谷", "玫瑰商街"],
    priceRate: 1,
    rentRate: 1,
    eventRate: 1,
  },
  {
    key: "moonharbor",
    name: "月光港灣",
    tag: "潮汐之路",
    difficulty: "標準",
    desc: ["租金較高、卡片活躍", "港口事件改變局勢"],
    regions: ["月港碼頭", "潮汐街區", "燈塔山坡", "星砂商埠"],
    priceRate: 1.08,
    rentRate: 1.15,
    eventRate: 1.2,
  },
  {
    key: "cloudbazaar",
    name: "雲端市集",
    tag: "空島競逐",
    difficulty: "挑戰",
    desc: ["土地昂貴、事件頻繁", "適合熟悉規則的玩家"],
    regions: ["風鈴雲階", "彩霞工坊", "飛艇驛站", "天穹商街"],
    priceRate: 1.18,
    rentRate: 1.28,
    eventRate: 1.45,
  },
];
const SAVE = "cxq_richman_latest_save_v4",
  PREF = "cxq_richman_pref_v1";
const S = {
  scene: "home",
  buttons: [],
  seats: [
    { type: "human", char: 6, diff: "standard" },
    { type: "ai", char: 1, diff: "standard" },
    { type: "off", char: 2, diff: "standard" },
    { type: "off", char: 3, diff: "standard" },
  ],
  activeSeat: 0,
  mapIndex: 0,
  money: 200000,
  rounds: 30,
  victory: "assets",
  eventLevel: "standard",
  startingCards: 1,
  gods: true,
  board: null,
  msg: "",
  rolling: false,
  dice: 1,
  diceResults: [1],
  forcedDice: 0,
  pickAnim: null,
  settings: {
    master: 80,
    bgm: 70,
    sfx: 80,
    vibrate: true,
    lang: "zh-Hant",
    graphics: "medium",
  },
};
REGION_NAMES = new Proxy(REGION_NAMES, {
  get(target, prop) {
    if (/^\d+$/.test(String(prop)))
      return (
        (MAPS[S.board?.mapIndex ?? S.mapIndex]?.regions || target)[
          Number(prop)
        ] || target[Number(prop)]
      );
    return Reflect.get(target, prop);
  },
});
try {
  Object.assign(S.settings, JSON.parse(localStorage.getItem(PREF) || "{}"));
} catch (e) {}

const ASSET_REV = "20260825-2245";
function load(k, u, priority = "auto") {
  const i = new Image();
  i.decoding = "async";
  i.fetchPriority = priority;
  i.onload = () => {
    IM[k] = i;
  };
  i.onerror = () => {
    IM[k] = null;
  };
  i.src = u + "?v=" + ASSET_REV;
  IM[k] = i;
  return i;
}
load("homeBg", A + "backgrounds/home_scene_v7.webp", "high");
load("homeMenuNew", A + "ui/home_menu_new_v1.webp", "high");
load("homeMenuContinue", A + "ui/home_menu_continue_v1.webp", "high");
load("homeMenuHelp", A + "ui/home_menu_help_v1.webp", "high");
load("homeMenuSettings", A + "ui/home_menu_settings_v1.webp", "high");
load("btnBlue", A + "ui/btn_blue.webp", "high");
load("btnRed", A + "ui/btn_red.webp", "high");
load("setupBg", A + "backgrounds/setup_scene_v4.webp", "high");
load("playerSeat", A + "ui/player_seat_v2.webp");
load("roleInfo", A + "ui/role_info_v2.webp");
load("characterStage", A + "ui/character_stage_v1.webp");
load("abilityPanel", A + "ui/ability_panel_v1.webp");
load("actionConsole", A + "ui/action_console_v1.webp");
load("mapCardFrame", A + "ui/map_card_frame_v1.webp");
for (let i = 0; i < 4; i++)
  load("playerSeatP" + i, A + `ui/player_seat_wide_p${i + 1}_v1.webp`);
load("statusHuman", A + "ui/status_human_v1.webp");
load("statusAi", A + "ui/status_ai_v1.webp");
load("statusOff", A + "ui/status_off_v1.webp");
MAPS.forEach((m, i) =>
  load("mapWorld" + i, A + "maps/map_world_" + m.key + "_v2.webp"),
);
MAPS.forEach((m, i) =>
  load("mapPreview" + i, A + "maps/map_world_" + m.key + "_v2.webp"),
);
load("tile_land", A + "tiles/land_parcel_v1.webp");
load("tile_card", A + "tiles/card_v2.webp");
load("tile_shop", A + "tiles/shop.webp");
load("tile_minigame", A + "tiles/minigame.webp");
// Known-corrupt start/event rasters are intentionally not loaded. They are visually quarantined.
for (let i = 1; i <= 6; i++) load("dice" + i, A + "dice/dice_" + i + ".webp");
for (let i = 1; i <= 6; i++)
  load("diceThrow" + i, A + `dice/dice_throw_${i}_v2.webp`);
MAPS.forEach((m, i) =>
  load("eventScene" + i, A + `events/${m.key}_event_v1.webp`),
);
load("miniStar", A + "minigames/star_catch_v1.webp");
load("miniBalloon", A + "minigames/balloon_pop_v1.webp");
load("miniTreasure", A + "minigames/treasure_timing_v1.webp");
[
  "precision_dice",
  "remote_dice",
  "shield",
  "teleport",
  "land_purchase",
  "free_upgrade",
  "discount",
  "rent",
  "swap",
  "stop",
].forEach((k) => load("card_" + k, A + "cards/" + k + "_v1.webp"));
load("tool_speed", A + "tools/motorcycle_v1.webp");
load("tool_car", A + "tools/car_v1.webp");
load("tool_roadblock", A + "tools/roadblock_v1.webp");
load("tool_bomb", A + "tools/bomb_v1.webp");
load("facilityBank", A + "facilities/bank_token_v2.webp");
load("facilityNews", A + "facilities/news_token_v2.webp");
load("facilityCoupon", A + "facilities/coupon_token_v2.webp");
load("facilityMagic", A + "facilities/magic_token_v2.webp");
load("facilityHospital", A + "facilities/hospital_token_v2.webp");
load("facilityPolice", A + "facilities/police_token_v1.png");
load("facilityStart", A + "facilities/start_token_v2.webp");
load("npcWealth", A + "npc/wealth_v1.webp");
load("npcFortune", A + "npc/fortune_v1.webp");
load("npcPoverty", A + "npc/poverty_v1.webp");
load("npcMisfortune", A + "npc/misfortune_v1.webp");
load("npcLand", A + "npc/land_v1.webp");
load("npcAngel", A + "npc/angel_v1.webp");
load("npcDemon", A + "npc/demon_v1.webp");
load("npcDeath", A + "npc/death_v1.webp");
CHAR_KEYS.forEach((k, i) => {
  load("c" + i, "../../assets/characters/cxq-role-" + k + ".webp");
  load("portrait" + i, A + "characters/portraits/" + k + "_portrait_v1.webp");
});
CHAR_KEYS.forEach((k) => {
  load(
    k + "WalkRightContact",
    A + "characters/" + k + "/walk_right_contact_v1.webp",
  );
  load(
    k + "WalkRightPassing",
    A + "characters/" + k + "/walk_right_passing_v1.webp",
  );
});
MAPS.forEach((m, mi) => {
  for (let level = 1; level <= 5; level++)
    load(`building${mi}_${level}`, A + `buildings/${m.key}_l${level}_v1.webp`);
});
CHAR_KEYS.forEach((key) =>
  load(`landmark_${key}`, A + `buildings/landmark_${key}_v1.webp`),
);
load("buildingSpecialHotel", A + "buildings/special_hotel_v1.webp");
load("buildingSpecialMall", A + "buildings/special_mall_v1.webp");
load("buildingSpecialPark", A + "buildings/special_park_v1.webp");

const VIEW = { scale: 1, ox: 0, oy: 0 };
function resize() {
  const d = Math.min(devicePixelRatio || 1, 2),
    vw = window.visualViewport?.width || innerWidth,
    vh = window.visualViewport?.height || innerHeight;
  C.width = Math.max(1, Math.round(vw * d));
  C.height = Math.max(1, Math.round(vh * d));
  const sx = C.width / W,
    sy = C.height / H;
  VIEW.scale = Math.min(sx, sy);
  VIEW.ox = (C.width - W * VIEW.scale) / 2;
  VIEW.oy = 0;
}
addEventListener("resize", resize);
addEventListener("orientationchange", () => {
  resize();
  setTimeout(resize, 180);
  setTimeout(resize, 520);
});
if (window.visualViewport) visualViewport.addEventListener("resize", resize);
resize();
function sceneBackdrop() {
  if (S.scene === "home") return IM.homeBg;
  if (
    ["setup", "mapSelect", "rules", "result", "help", "settings"].includes(
      S.scene,
    )
  )
    return IM.setupBg;
  if (S.scene === "game" && S.board)
    return IM["mapWorld" + (S.board.mapIndex || 0)];
  return IM.homeBg;
}
function begin() {
  X.setTransform(1, 0, 0, 1, 0, 0);
  X.fillStyle = "#071325";
  X.fillRect(0, 0, C.width, C.height);
  const edgeBg = sceneBackdrop();
  if (edgeBg && edgeBg.complete && edgeBg.naturalWidth) {
    const r = Math.max(
        C.width / edgeBg.naturalWidth,
        C.height / edgeBg.naturalHeight,
      ),
      iw = edgeBg.naturalWidth * r,
      ih = edgeBg.naturalHeight * r;
    X.save();
    X.globalAlpha = 0.78;
    X.filter = "blur(14px) saturate(.86) brightness(.62)";
    X.drawImage(edgeBg, (C.width - iw) / 2, (C.height - ih) / 2, iw, ih);
    X.filter = "none";
    X.restore();
  }
  X.setTransform(VIEW.scale, 0, 0, VIEW.scale, VIEW.ox, VIEW.oy);
  S.buttons = [];
}
function pointerToGame(e) {
  const r = C.getBoundingClientRect(),
    px = ((e.clientX - r.left) / r.width) * C.width,
    py = ((e.clientY - r.top) / r.height) * C.height;
  return { x: (px - VIEW.ox) / VIEW.scale, y: (py - VIEW.oy) / VIEW.scale };
}
function txt(s, x, y, z = 26, a = "center", c = "#fff", w = 800, o = true) {
  X.save();
  X.font = `${w} ${z}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;
  X.textAlign = a;
  X.textBaseline = "middle";
  if (o) {
    X.lineJoin = "round";
    X.lineWidth = Math.max(2, z / 7);
    X.strokeStyle = "rgba(20,14,28,.9)";
    X.strokeText(String(s), x, y);
  }
  X.fillStyle = c;
  X.fillText(String(s), x, y);
  X.restore();
}
function fitTxt(
  s,
  x,
  y,
  maxW,
  z = 26,
  a = "center",
  c = "#fff",
  w = 800,
  o = true,
  min = 12,
) {
  let size = z;
  X.save();
  while (size > min) {
    X.font = `${w} ${size}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;
    if (X.measureText(String(s)).width <= maxW) break;
    size--;
  }
  X.restore();
  txt(s, x, y, size, a, c, w, o);
  return size;
}
function wrapLines(s, maxW, z = 22, w = 800, maxLines = 3) {
  const chars = Array.from(String(s)),
    lines = [];
  let line = "";
  X.save();
  X.font = `${w} ${z}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;
  for (const ch of chars) {
    const next = line + ch;
    if (line && X.measureText(next).width > maxW) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines - 1) break;
    } else line = next;
  }
  const used = lines.join("").length;
  if (lines.length === maxLines - 1 && used + line.length < chars.length) {
    while (line.length && X.measureText(line + "…").width > maxW)
      line = line.slice(0, -1);
    line += "…";
  }
  if (line) lines.push(line);
  X.restore();
  return lines.slice(0, maxLines);
}
function paragraph(
  s,
  x,
  y,
  maxW,
  z = 22,
  lineH = 30,
  maxLines = 3,
  a = "center",
  c = "#fff",
  w = 800,
  o = true,
) {
  const lines = wrapLines(s, maxW, z, w, maxLines),
    start = y - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => txt(line, x, start + i * lineH, z, a, c, w, o));
  return lines.length;
}
function contain(im, x, y, w, h, alpha = 1) {
  if (!im || !im.complete || !im.naturalWidth) return false;
  const r = Math.min(w / im.naturalWidth, h / im.naturalHeight),
    iw = im.naturalWidth * r,
    ih = im.naturalHeight * r;
  X.save();
  X.imageSmoothingEnabled = true;
  X.imageSmoothingQuality = "high";
  X.globalAlpha = alpha;
  X.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  X.restore();
  return true;
}
function cover(im, x, y, w, h, alpha = 1) {
  if (!im || !im.complete || !im.naturalWidth) return false;
  const r = Math.max(w / im.naturalWidth, h / im.naturalHeight),
    iw = im.naturalWidth * r,
    ih = im.naturalHeight * r;
  X.save();
  X.imageSmoothingEnabled = true;
  X.imageSmoothingQuality = "high";
  X.globalAlpha = alpha;
  X.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  X.restore();
  return true;
}
function stretch(im, x, y, w, h, alpha = 1) {
  if (!im || !im.complete || !im.naturalWidth) return false;
  X.save();
  X.imageSmoothingEnabled = true;
  X.imageSmoothingQuality = "high";
  X.globalAlpha = alpha;
  X.drawImage(im, x, y, w, h);
  X.restore();
  return true;
}
function containFacing(im, x, y, w, h, faceRight = true, alpha = 1) {
  if (!im || !im.complete || !im.naturalWidth) return false;
  const r = Math.min(w / im.naturalWidth, h / im.naturalHeight),
    iw = im.naturalWidth * r,
    ih = im.naturalHeight * r,
    cx = x + w / 2,
    iy = y + (h - ih) / 2;
  X.save();
  X.imageSmoothingEnabled = true;
  X.imageSmoothingQuality = "high";
  X.globalAlpha = alpha;
  X.translate(cx, 0);
  X.scale(faceRight ? 1 : -1, 1);
  X.drawImage(im, -iw / 2, iy, iw, ih);
  X.restore();
  return true;
}
const UI_BUTTON = { hover: null, pressed: null };
function btn(id, label, x, y, w, h, red = false, alpha = 1, en = true) {
  const pressed = en && UI_BUTTON.pressed === id,
    hovered = en && UI_BUTTON.hover === id,
    expand = pressed ? -3 : hovered ? 2 : 0,
    bx = x - expand,
    by = y - expand,
    bw = w + expand * 2,
    bh = h + expand * 2;
  X.save();
  if (hovered && !pressed) {
    X.shadowColor = red ? "rgba(255,150,185,.9)" : "rgba(115,220,255,.9)";
    X.shadowBlur = 18;
  }
  contain(red ? IM.btnRed : IM.btnBlue, bx, by, bw, bh, alpha * (en ? 1 : 0.38));
  X.restore();
  fitTxt(
    label,
    x + w / 2,
    y + h * 0.49 + (pressed ? 3 : 0),
    w * 0.72,
    Math.min(29, h * 0.34),
    "center",
    "#fff",
    900,
    true,
    12,
  );
  S.buttons.push({ id, x, y, w, h, en });
}
function hit(x, y) {
  return S.buttons
    .slice()
    .reverse()
    .find(
      (b) => b.en && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
    );
}
function activeSeatIds() {
  return S.seats
    .map((s, i) => (s.type === "off" ? -1 : i))
    .filter((i) => i >= 0);
}
function humanCount() {
  return S.seats.filter((s) => s.type === "human").length;
}
function assigned(ci) {
  return activeSeatIds().find((i) => S.seats[i].char === ci);
}
const HOME = {
  enteredAt: performance.now(),
  hover: null,
  pressed: null,
  leaving: null,
  leaveAt: 0,
  locked: false,
};
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
function easeOut(v) {
  v = clamp01(v);
  return 1 - Math.pow(1 - v, 3);
}
function homeIntro(delay, duration = 420) {
  return easeOut((performance.now() - HOME.enteredAt - delay) / duration);
}
function resetHome() {
  HOME.enteredAt = performance.now();
  HOME.hover = HOME.pressed = HOME.leaving = null;
  HOME.leaveAt = 0;
  HOME.locked = false;
}
function homeTile(id, label, image, x, y, size, index, enabled = true) {
  const a = homeIntro(330 + index * 90, 360);
  if (a <= 0) return;
  const active = HOME.pressed === id || HOME.hover === id,
    down = HOME.pressed === id;
  const scale = down ? 0.955 : active ? 1.035 : 1,
    drawSize = size * scale,
    dx = x - (drawSize - size) / 2,
    dy = y - (drawSize - size) / 2 + (1 - a) * 24;
  contain(image, dx, dy, drawSize, drawSize, a * (enabled ? 1 : 0.38));
  X.save();
  X.globalAlpha = a * (enabled ? 1 : 0.56);
  txt(
    label,
    x + size / 2,
    y + size * 0.815 + (1 - a) * 24,
    25,
    "center",
    enabled ? "#fff7dd" : "#cfcee0",
    1000,
    true,
  );
  X.restore();
  if (active && enabled) {
    X.save();
    X.globalAlpha = a * 0.72;
    txt(
      down ? "放開確認" : "點擊進入",
      x + size / 2,
      y + size - 17,
      12,
      "center",
      "#fff4b8",
      900,
      true,
    );
    X.restore();
  }
  S.buttons.push({ id, x, y, w: size, h: size, en: enabled && !HOME.locked });
}
function home() {
  const now = performance.now(),
    sceneA = homeIntro(0, 620),
    canContinue = !!localStorage.getItem(SAVE);
  cover(IM.homeBg, 0, 0, W, H, 1);
  X.save();
  X.globalAlpha = sceneA;
  contain(IM.playerSeat, 1120, 38, 430, 94, 0.9);
  txt("童話棋盤冒險", 1335, 67, 18, "center", "#fff7dc", 1000, true);
  txt(
    "擲骰・買地・蓋房・收租・卡片・神明事件",
    1335,
    98,
    13,
    "center",
    "#fff",
    850,
    true,
  );
  X.restore();
  const logoA = homeIntro(80, 520),
    logoY = (1 - logoA) * 30;
  X.save();
  X.globalAlpha = logoA;
  txt("CxQ", 330, 78 + logoY, 72, "center", "#ffe27a", 1000, true);
  txt("童話大富翁", 330, 145 + logoY, 52, "center", "#fff1be", 1000, true);
  txt(
    "夢想王國資產大冒險",
    330,
    190 + logoY,
    17,
    "center",
    "#f7f2dc",
    900,
    true,
  );
  X.restore();
  homeTile("start", "新遊戲", IM.homeMenuNew, 62, 226, 250, 0);
  homeTile(
    "continue",
    "繼續遊戲",
    IM.homeMenuContinue,
    338,
    226,
    250,
    1,
    canContinue,
  );
  homeTile("help", "遊戲說明", IM.homeMenuHelp, 62, 500, 250, 2);
  homeTile("settings", "系統設定", IM.homeMenuSettings, 338, 500, 250, 3);
  const infoA = homeIntro(740, 380);
  X.save();
  X.globalAlpha = infoA;
  contain(IM.roleInfo, 70, 776, 510, 82, 0.94);
  txt(
    canContinue ? "已有冒險紀錄｜可繼續上次進度" : "尚無冒險紀錄｜請開始新遊戲",
    325,
    803,
    16,
    "center",
    "#60462d",
    900,
    false,
  );
  txt(
    "2–4 人｜真人／電腦自由配置",
    325,
    832,
    14,
    "center",
    "#76583b",
    850,
    false,
  );
  X.restore();
  if (HOME.leaving) {
    const p = clamp01((now - HOME.leaveAt) / 300);
    X.save();
    X.globalAlpha = 1 - p;
    txt(
      HOME.leaving === "start"
        ? "前往角色與玩家配置…"
        : HOME.leaving === "continue"
          ? "讀取冒險紀錄…"
          : "",
      800,
      860,
      16,
      "center",
      "#fff5c7",
      900,
      true,
    );
    X.restore();
  }
  txt(
    "CxQ FAIRYTALE RICHMAN",
    1515,
    874,
    11,
    "right",
    "rgba(255,255,255,.82)",
    800,
    true,
  );
}

const SETUP = {
  stageX: 260,
  stageY: 104,
  stageW: 520,
  stageH: 520,
  seatY: 728,
  seatX: [5, 405, 805, 1205],
};
const SETUP_VIEW = {
  char: S.seats[S.activeSeat].char,
  notice: "",
  noticeUntil: 0,
};
function seatTarget(i) {
  return { x: SETUP.seatX[i] + 78, y: SETUP.seatY + 72 };
}
function chooseChar(ci) {
  if (S.pickAnim || S.seats[S.activeSeat].type === "off") return;
  const a = S.activeSeat,
    b = assigned(ci),
    old = S.seats[a].char;
  if (old === ci && b === a) return;
  S.pickAnim = {
    char: ci,
    seat: a,
    swapSeat: b !== undefined && b !== a ? b : -1,
    oldChar: old,
    start: performance.now(),
    dur: 650,
    from: {
      x: SETUP.stageX + SETUP.stageW / 2,
      y: SETUP.stageY + SETUP.stageH * 0.52,
    },
    to: seatTarget(a),
  };
}
function updatePickAnim() {
  const q = S.pickAnim;
  if (!q) return;
  const t = Math.min(1, (performance.now() - q.start) / q.dur);
  if (t >= 1) {
    S.seats[q.seat].char = q.char;
    if (q.swapSeat >= 0) S.seats[q.swapSeat].char = q.oldChar;
    S.pickAnim = null;
  }
}
function drawPickAnim() {
  const q = S.pickAnim;
  if (!q) return;
  const t = Math.min(1, (performance.now() - q.start) / q.dur),
    e = 1 - Math.pow(1 - t, 3),
    x = q.from.x + (q.to.x - q.from.x) * e,
    y = q.from.y + (q.to.y - q.from.y) * e,
    key = CHAR_KEYS[q.char],
    contact = IM[key + "WalkRightContact"],
    passing = IM[key + "WalkRightPassing"],
    step = Math.floor((performance.now() - q.start) / 95) % 2,
    frame = step ? passing : contact;
  if (frame?.complete)
    containFacing(frame, x - 72, y - 105, 144, 164, q.to.x >= q.from.x);
  else contain(IM["c" + q.char], x - 66, y - 92, 132, 154, 1);
}
function seatPanel(i, x, y) {
  const s = S.seats[i],
    sel = S.activeSeat === i,
    typeLabel =
      s.type === "human" ? "真人" : s.type === "ai" ? "電腦 AI" : "空席";
  const alpha = s.type === "off" ? 0.48 : sel ? 1 : 0.94;
  stretch(IM["playerSeatP" + i], x, y, 390, 150, alpha);
  S.buttons.push({ id: "seat" + i, x, y, w: 390, h: 150, en: !S.pickAnim });
  if (!(S.pickAnim && S.pickAnim.seat === i) && s.type !== "off")
    contain(IM["portrait" + s.char], x + 24, y + 20, 108, 108, 0.99);
  contain(
    s.type === "human"
      ? IM.statusHuman
      : s.type === "ai"
        ? IM.statusAi
        : IM.statusOff,
    x + 105,
    y + 102,
    42,
    42,
    s.type === "off" ? 0.72 : 1,
  );
  txt(
    i + 1 + "P",
    x + 170,
    y + 30,
    19,
    "center",
    sel ? "#ffe67a" : "#fff",
    1000,
    true,
  );
  fitTxt(
    s.type === "off" ? "尚未參賽" : CHAR_NAMES[s.char],
    x + 290,
    y + 30,
    170,
    16,
    "center",
    i === 3 ? "#fff3cf" : "#fff",
    950,
    true,
    12,
  );
  btn(
    "seatType" + i,
    typeLabel,
    x + 154,
    y + 50,
    210,
    45,
    s.type === "human",
    s.type === "off" ? 0.55 : 1,
    !S.pickAnim,
  );
  if (s.type === "ai")
    btn(
      "diff" + i,
      "AI 難度：" +
        (s.diff === "easy" ? "輕鬆" : s.diff === "standard" ? "標準" : "聰明"),
      x + 154,
      y + 99,
      210,
      39,
      false,
      0.94,
      !S.pickAnim,
    );
  else
    fitTxt(
      s.type === "human" ? "點擊切換為電腦" : "點擊重新加入",
      x + 259,
      y + 119,
      194,
      13,
      "center",
      "#fff5cf",
      850,
      true,
      10,
    );
}
function setup() {
  updatePickAnim();
  cover(IM.setupBg, 0, 0, W, H, 1);
  btn("back", "返回首頁", 18, 15, 190, 64, false, 1, !S.pickAnim);
  txt("角色選擇", 800, 42, 40, "center", "#fff0b6", 1000, true);
  txt(
    "選擇 P1～P4 席位與冒險角色；遊戲條件將於後續設定",
    800,
    80,
    16,
    "center",
    "#fff",
    850,
    true,
  );
  const ci = SETUP_VIEW.char,
    owner = assigned(ci);
  if (!(S.pickAnim && S.pickAnim.char === ci))
    contain(
      IM["c" + ci],
      SETUP.stageX + 105,
      SETUP.stageY + 72,
      SETUP.stageW - 210,
      SETUP.stageH - 120,
      0.99,
    );
  contain(
    IM.characterStage,
    SETUP.stageX,
    SETUP.stageY,
    SETUP.stageW,
    SETUP.stageH,
    0.99,
  );
  btn("prevChar", "◀", 132, 306, 108, 96, false, 1, !S.pickAnim);
  btn("nextChar", "▶", 672, 306, 108, 96, false, 1, !S.pickAnim);
  txt(
    `${ci + 1} / ${CHAR_KEYS.length}`,
    520,
    588,
    19,
    "center",
    "#fff5cf",
    900,
    true,
  );
  btn(
    "confirmChar",
    owner === undefined || owner === S.activeSeat
      ? "選擇這名角色"
      : `與 ${owner + 1}P 交換`,
    350,
    606,
    340,
    68,
    true,
    1,
    !S.pickAnim && S.seats[S.activeSeat].type !== "off",
  );
  contain(IM.abilityPanel, 850, 104, 420, 420, 0.99);
  fitTxt(
    CHAR_NAMES[ci],
    1060,
    164,
    310,
    30,
    "center",
    "#fff4c8",
    1000,
    true,
    20,
  );
  fitTxt(
    CHAR_TITLES[ci] + "｜" + CHAR_ROLES[ci],
    1060,
    207,
    300,
    17,
    "center",
    "#d9eaff",
    950,
    true,
    13,
  );
  paragraph(
    CHAR_CONCEPTS[ci],
    1060,
    284,
    292,
    16,
    25,
    2,
    "center",
    "#fff",
    850,
    true,
  );
  txt("專屬能力", 1060, 348, 15, "center", "#ffe17b", 1000, true);
  paragraph(
    ROLE_DESC[ci],
    1085,
    407,
    260,
    15,
    24,
    2,
    "center",
    "#fff6d6",
    900,
    true,
  );
  txt("★", 935, 407, 32, "center", "#75d8ff", 1000, true);
  txt(
    `目前選擇：${S.activeSeat + 1}P`,
    1060,
    473,
    18,
    "center",
    PLAYER_COLORS[S.activeSeat],
    1000,
    true,
  );
  contain(IM.roleInfo, 1280, 145, 285, 168, 0.95);
  txt(
    `參賽 ${activeSeatIds().length} 人`,
    1422,
    190,
    22,
    "center",
    "#fff5cf",
    1000,
    true,
  );
  txt(`真人 ${humanCount()} 人`, 1422, 232, 18, "center", "#fff", 900, true);
  txt("資金、回合、事件與神明", 1422, 276, 14, "center", "#d9eaff", 850, true);
  txt("下一階段再設定", 1422, 299, 14, "center", "#d9eaff", 850, true);
  btn(
    "startGame",
    "確認角色，選擇地圖",
    1260,
    350,
    320,
    82,
    true,
    1,
    activeSeatIds().length >= 2 && humanCount() >= 1 && !S.pickAnim,
  );
  if (SETUP_VIEW.notice && performance.now() < SETUP_VIEW.noticeUntil)
    fitTxt(
      SETUP_VIEW.notice,
      1060,
      558,
      380,
      17,
      "center",
      "#ffe27a",
      1000,
      true,
      13,
    );
  for (let i = 0; i < 4; i++) seatPanel(i, SETUP.seatX[i], SETUP.seatY);
  drawPickAnim();
}

function mapSelect() {
  cover(IM.setupBg, 0, 0, W, H, 0.82);
  txt("選擇冒險地圖", 800, 52, 42, "center", "#fff0b6", 1000, true);
  txt(
    "縮圖、路線與實際棋盤主題完全對應",
    800,
    94,
    17,
    "center",
    "#fff",
    850,
    true,
  );
  btn("mapBack", "返回選角", 22, 20, 190, 62, false);
  const xs = [55, 575, 1095];
  MAPS.forEach((m, i) => {
    const x = xs[i],
      selected = S.mapIndex === i;
    X.save();
    X.beginPath();
    X.roundRect(x + 50, 182, 350, 222, 12);
    X.clip();
    cover(IM["mapPreview" + i], x + 50, 182, 350, 222, selected ? 1 : 0.67);
    X.restore();
    stretch(IM.mapCardFrame, x, 126, 450, 600, selected ? 1 : 0.8);
    if (selected) {
      X.save();
      X.strokeStyle = "#ffe27a";
      X.shadowColor = "#ffd65b";
      X.shadowBlur = 20;
      X.lineWidth = 6;
      X.beginPath();
      X.roundRect(x + 9, 135, 432, 574, 28);
      X.stroke();
      X.restore();
    }
    fitTxt(m.name, x + 225, 425, 330, 29, "center", "#fff2bd", 1000, true, 20);
    fitTxt(
      m.tag + "｜" + m.difficulty,
      x + 225,
      463,
      330,
      17,
      "center",
      "#d9eaff",
      900,
      true,
      13,
    );
    paragraph(
      m.desc.join("，"),
      x + 225,
      512,
      330,
      16,
      25,
      2,
      "center",
      "#fff",
      850,
      true,
    );
    txt(
      `土地 ×${m.priceRate.toFixed(2)}　租金 ×${m.rentRate.toFixed(2)}`,
      x + 225,
      568,
      14,
      "center",
      "#ffe17b",
      850,
      true,
    );
    txt(
      `事件 ×${m.eventRate.toFixed(2)}`,
      x + 225,
      596,
      14,
      "center",
      "#d8f2ff",
      850,
      true,
    );
    btn(
      "chooseMap" + i,
      selected ? "已選擇" : "選擇地圖",
      x + 75,
      634,
      300,
      62,
      selected,
      false,
      1,
    );
  });
  btn("mapNext", "遊戲條件", 630, 772, 340, 84, true);
}

function rulesSetup() {
  const m = MAPS[S.mapIndex];
  cover(IM.setupBg, 0, 0, W, H, 0.82);
  txt("遊戲條件", 800, 58, 44, "center", "#fff0b6", 1000, true);
  txt(
    `${m.name}｜${activeSeatIds().length} 名參賽者`,
    800,
    103,
    18,
    "center",
    "#fff",
    900,
    true,
  );
  btn("rulesBack", "返回地圖", 22, 20, 190, 62, false);
  contain(IM.abilityPanel, 180, 145, 560, 560, 0.98);
  txt("基本規則", 460, 205, 30, "center", "#fff2bd", 1000, true);
  btn(
    "ruleMoney",
    "起始資金　$" + S.money.toLocaleString(),
    250,
    265,
    420,
    68,
    false,
  );
  btn("ruleRounds", "遊戲回合　" + S.rounds, 250, 350, 420, 68, false);
  btn(
    "ruleVictory",
    "勝利條件　" + (S.victory === "assets" ? "總資產最高" : "最後生存者"),
    250,
    435,
    420,
    68,
    false,
  );
  btn(
    "ruleCards",
    "起始卡片　" + S.startingCards + " 張",
    250,
    520,
    420,
    68,
    false,
  );
  contain(IM.abilityPanel, 860, 145, 560, 560, 0.98);
  txt("事件規則", 1140, 205, 30, "center", "#fff2bd", 1000, true);
  btn(
    "ruleEvents",
    "事件頻率　" +
      (S.eventLevel === "low"
        ? "較少"
        : S.eventLevel === "standard"
          ? "標準"
          : "熱鬧"),
    930,
    265,
    420,
    68,
    false,
  );
  btn(
    "ruleGods",
    "神明／NPC　" + (S.gods ? "開啟" : "關閉"),
    930,
    350,
    420,
    68,
    false,
  );
  txt(
    `地圖租金倍率 ×${m.rentRate.toFixed(2)}`,
    1140,
    460,
    18,
    "center",
    "#fff7dd",
    900,
    true,
  );
  txt(
    "所有設定都可在開局前再次調整",
    1140,
    510,
    16,
    "center",
    "#d9eaff",
    850,
    true,
  );
  btn("launchGame", "開始冒險", 630, 772, 340, 84, true);
}

function tileImage(type) {
  if (type === "start") return IM.tile_shop || IM.tile_land;
  if (type === "event") return IM.tile_card || IM.tile_land;
  return IM["tile_" + type] || IM.tile_land;
}
function facilityImage(type) {
  return {
    start: IM.facilityStart,
    bank: IM.facilityBank,
    news: IM.facilityNews,
    coupon: IM.facilityCoupon,
    magic: IM.facilityMagic,
    hospital: IM.facilityHospital,
    police: IM.facilityPolice,
  }[type];
}
function npcImage(name) {
  return (
    {
      財神: IM.npcWealth,
      福神: IM.npcFortune,
      窮神: IM.npcPoverty,
      衰神: IM.npcMisfortune,
      乞丐: IM.npcPoverty,
      惡犬: IM.npcPoverty,
      土地公: IM.npcLand,
      天使: IM.npcAngel,
      惡魔: IM.npcDemon,
      死神: IM.npcDeath,
    }[name] || IM.npcLand
  );
}
function npcMarker(n, t) {
  const bob = Math.sin(performance.now() / 330 + n.pos) * 7;
  X.save();
  X.shadowColor = "rgba(255,225,120,.9)";
  X.shadowBlur = 22;
  contain(npcImage(n.name), t.x - 74, t.y - 162 + bob, 148, 174, 1);
  X.restore();
  contain(IM.roleInfo, t.x - 65, t.y - 180 + bob, 130, 38, 0.94);
  txt(n.name, t.x, t.y - 161 + bob, 13, "center", "#fff8ce", 1000, true);
}
function buildingImage(t) {
  if (t.owner < 0 || t.level < 1) return null;
  if (t.special)
    return {
      hotel: IM.buildingSpecialHotel,
      mall: IM.buildingSpecialMall,
      park: IM.buildingSpecialPark,
    }[t.special] || null;
  const mi = S.board?.mapIndex || 0,
    isLandmark = isRegionLandmark(t);
  if (isLandmark) {
    const owner = S.board.players.find((p) => p.id === t.owner);
    return IM[`landmark_${CHAR_KEYS[owner?.char || 0]}`];
  }
  return IM[`building${mi}_${Math.min(5, t.level)}`];
}
function isRegionLandmark(t) {
  if (t.owner < 0 || t.level < 5 || !regionOwned(t.owner, t.region)) return false;
  return (
    S.board.tiles.find(
      (land) => land.type === "land" && land.region === t.region,
    ) === t
  );
}
function tileVisualPosition(t) {
  if (t.type !== "land" || !S.board) return { x: t.x, y: t.y };
  const b = S.board;
  if (!b.plotCenter) {
    const points = b.tiles || [];
    b.plotCenter = points.reduce(
      (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
      { x: 0, y: 0 },
    );
  }
  let dx = t.x - b.plotCenter.x,
    dy = t.y - b.plotCenter.y;
  const length = Math.hypot(dx, dy) || 1,
    offset = -190;
  dx /= length;
  dy /= length;
  return {
    x: Math.max(76, Math.min(MW - 76, t.x + dx * offset)),
    y: Math.max(116, Math.min(MH - 76, t.y + dy * offset)),
  };
}
function drawTile(t) {
  const visual = tileVisualPosition(t),
    shiftX = visual.x - t.x,
    shiftY = visual.y - t.y,
    tileSize = t.type === "land" ? 132 : 152;
  // A land has two authored anchors: the road tile where the pawn stands and
  // the roadside lot where its building grows. Draw their physical connection
  // explicitly so plots never look like floating UI cards.
  if (t.type === "land") {
    X.save();
    X.strokeStyle = "rgba(255,225,145,.55)";
    X.lineWidth = 10;
    X.lineCap = "round";
    X.beginPath();
    X.moveTo(t.x, t.y);
    X.lineTo(visual.x, visual.y);
    X.stroke();
    X.strokeStyle = "rgba(69,45,32,.68)";
    X.lineWidth = 3;
    X.stroke();
    contain(IM.tile_land, t.x - 58, t.y - 58, 116, 116, 1);
    if (t.owner >= 0) {
      X.strokeStyle = PLAYER_COLORS[t.owner];
      X.lineWidth = 8;
      X.beginPath();
      X.arc(t.x, t.y, 58, 0, Math.PI * 2);
      X.stroke();
    }
    X.restore();
  }
  X.save();
  X.translate(shiftX, shiftY);
  if (t.type === "land" && t.owner >= 0) {
    X.save();
    X.strokeStyle = PLAYER_COLORS[t.owner];
    X.fillStyle = PLAYER_COLORS[t.owner] + "33";
    X.lineWidth = 13;
    X.shadowColor = PLAYER_COLORS[t.owner];
    X.shadowBlur = 16;
    X.beginPath();
    X.arc(t.x, t.y, 72, 0, Math.PI * 2);
    X.fill();
    X.stroke();
    X.restore();
  }
  contain(
    tileImage(t.type),
    t.x - tileSize / 2,
    t.y - tileSize / 2,
    tileSize,
    tileSize,
    1,
  );
  const facility = facilityImage(t.type);
  if (facility) contain(facility, t.x - 66, t.y - 150, 132, 140, 1);
  if (t.type === "start" || t.type === "event")
    txt(
      t.type === "start" ? "起點" : "事件",
      t.x,
      t.y + 4,
      16,
      "center",
      "#fff6d2",
      1000,
      true,
    );
  if (S.board?.selectedTile === t) {
    X.save();
    X.strokeStyle = "#fff076";
    X.lineWidth = 7;
    X.shadowColor = "#ffd84f";
    X.shadowBlur = 22;
    X.beginPath();
    X.arc(t.x, t.y, tileSize * 0.48, 0, Math.PI * 2);
    X.stroke();
    X.restore();
  }
  if (t.type === "land") {
    if (t.owner >= 0) {
      const pulse =
          S.board?.buildAnim?.tile === t
            ? Math.max(0, 1 - (performance.now() - S.board.buildAnim.at) / 850)
            : 0,
        owner = S.board.players.find((p) => p.id === t.owner);
      const building = buildingImage(t);
      if (building) {
        const grow = 1 + pulse * 0.18,
          landmark = isRegionLandmark(t),
          sz = (landmark ? 178 : 145) * grow;
        X.save();
        X.shadowColor = PLAYER_COLORS[t.owner];
        X.shadowBlur = 28 + 30 * pulse;
        contain(building, t.x - sz / 2, t.y + 22 - sz, sz, sz, 1);
        X.restore();
        if (t.special)
          txt(
            t.special === "hotel"
              ? "星光旅館"
              : t.special === "mall"
                ? "童話商場"
                : "祝福公園",
            t.x,
            t.y - 148,
            12,
            "center",
            "#fff2ae",
            1000,
            true,
          );
        if (pulse > 0)
          txt(
            "★ 升級完成 ★",
            t.x,
            t.y - 170,
            14,
            "center",
            "#ffe274",
            1000,
            true,
          );
      }
      stretch(IM["playerSeatP" + t.owner], t.x - 73, t.y + 18, 146, 46, 0.99);
      contain(IM["portrait" + owner?.char], t.x - 67, t.y + 22, 38, 38, 0.99);
      fitTxt(
        `${t.owner + 1}P ${owner ? CHAR_NAMES[owner.char] : ""} Lv${t.level}`,
        t.x + 20,
        t.y + 41,
        88,
        12,
        "center",
        "#ffffff",
        1000,
        true,
        9,
      );
      if (!building && pulse > 0)
        txt(
          "★ 地契已取得 ★",
          t.x,
          t.y - 142,
          14,
          "center",
          "#ffe274",
          1000,
          true,
        );
    }
    txt(
      "$" + Math.round(t.price / 1000) + "K",
      t.x,
      t.y + 78,
      13,
      "center",
      "#fff6d2",
      900,
      true,
    );
  }
  X.restore();
}
function drawPlayers() {
  const b = S.board,
    now = performance.now();
  for (const p of b.players) {
    if (p.bankrupt) continue;
    const t = b.tiles[p.pos],
      same = b.players.filter((q) => !q.bankrupt && q.pos === p.pos),
      idx = same.indexOf(p),
      off = (idx - (same.length - 1) / 2) * 34;
    let x = t.x + off,
      y = t.y;
    if (p.moveAnim) {
      const q = p.moveAnim,
        u = Math.min(1, (now - q.start) / q.dur),
        e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      x = q.from.x + (q.to.x - q.from.x) * e + off;
      y = q.from.y + (q.to.y - q.from.y) * e;
    }
    const key = CHAR_KEYS[p.char],
      contact = IM[key + "WalkRightContact"],
      passing = IM[key + "WalkRightPassing"];
    if (p.vehicle)
      contain(IM["tool_" + (p.vehicle === "car" ? "car" : "speed")], x - 82, y - 88, 164, 112, 1);
    X.save();
    X.shadowColor = PLAYER_COLORS[p.id];
    X.shadowBlur = 18;
    if (p.moveAnim && !p.vehicle && contact?.complete && passing?.complete) {
      const q = p.moveAnim,
        frame = Math.floor((now - q.start) / 105) % 2 ? passing : contact;
      containFacing(frame, x - 74, y - 144, 148, 164, q.to.x >= q.from.x);
    } else contain(IM["c" + p.char], x - (p.vehicle ? 46 : 62), y - (p.vehicle ? 145 : 126), p.vehicle ? 92 : 124, p.vehicle ? 108 : 144);
    X.restore();
    stretch(IM["playerSeatP" + p.id], x - 55, y - 146, 110, 34, 0.98);
    txt(
      p.id + 1 + "P",
      x,
      y - 129,
      13,
      "center",
      PLAYER_COLORS[p.id],
      1000,
      true,
    );
    const god = (p.effects || []).find((e) => isGodEffect(e));
    if (god) {
      X.save();
      X.shadowColor = "rgba(255,225,120,.9)";
      X.shadowBlur = 14;
      contain(npcImage(god.kind), x - 102, y - 112, 76, 88, 0.98);
      X.restore();
      stretch(IM.roleInfo, x - 104, y - 50, 82, 28, 0.96);
      fitTxt(`${god.kind} ${god.turns}`, x - 63, y - 36, 72, 11, "center", "#fff4bd", 1000, true, 8);
    }
    if (p.bombSteps > 0) {
      contain(IM.tool_bomb, x + 36, y - 112, 64, 64, 1);
      txt(String(p.bombSteps), x + 69, y - 94, 13, "center", "#fff2a5", 1000, true);
    }
  }
}
function drawMap() {
  const b = S.board;
  stretch(IM["mapWorld" + (b.mapIndex || 0)] || IM.mapWorld0, 0, 0, MW, MH, 1);
  b.tiles.forEach(drawTile);
  if (b.npcs)
    for (const n of b.npcs) {
      const t = b.tiles[n.pos];
      if (t) npcMarker(n, t);
    }
  for (const pos of b.roadblocks || []) {
    const t = b.tiles[pos];
    if (t) contain(IM.tool_roadblock, t.x - 72, t.y - 116, 144, 96, 1);
  }
  drawPlayers();
}
function playerHudCard(p, i) {
  const b = S.board,
    x = 12 + i * 286,
    y = 12,
    w = 274,
    h = 106,
    current = p.id === cp().id;
  stretch(IM["playerSeatP" + p.id], x, y, w, h, current ? 1 : 0.82);
  contain(
    IM["portrait" + p.char],
    x + 7,
    y + 10,
    80,
    80,
    p.bankrupt ? 0.45 : 1,
  );
  fitTxt(
    `${p.id + 1}P ${CHAR_NAMES[p.char]}`,
    x + 98,
    y + 22,
    162,
    18,
    "left",
    current ? "#ffe894" : "#fff",
    1000,
    true,
    13,
  );
  fitTxt(
    `現金 $${Math.max(0, p.cash).toLocaleString()}`,
    x + 98,
    y + 47,
    162,
    15,
    "left",
    "#fff5d3",
    900,
    true,
    11,
  );
  const land = b.tiles.filter((t) => t.owner === p.id).length;
  fitTxt(
    `資產 $${netWorth(p).toLocaleString()}`,
    x + 98,
    y + 70,
    162,
    14,
    "left",
    "#d9efff",
    850,
    true,
    10,
  );
  txt(
    `土地 ${land}　卡片 ${p.cards.length}`,
    x + 98,
    y + 91,
    12,
    "left",
    "#d7e6f4",
    800,
    true,
  );
  const effect = (p.effects || [])[0];
  if (effect) {
    contain(npcImage(effect.kind), x + w - 42, y + 62, 34, 34, 0.98);
    txt(
      String(effect.turns),
      x + w - 13,
      y + 89,
      10,
      "center",
      "#ffe07a",
      1000,
      true,
    );
  }
  if (current) {
    X.save();
    X.strokeStyle = "#fff4ad";
    X.lineWidth = 4;
    X.beginPath();
    X.roundRect(x - 2, y - 2, w + 4, h + 4, 20);
    X.stroke();
    X.restore();
  }
}
function diceThrowOverlay() {
  const q = S.diceAnim;
  if (!q) return;
  const now = performance.now(),
    u = Math.min(1, (now - q.start) / q.duration),
    count = q.count || 1,
    results = q.results?.length
      ? q.results
      : Array.from({ length: count }, (_, i) => ((S.dice + i * 2 - 1) % 6) + 1),
    total = results.reduce((sum, value) => sum + value, 0);
  X.save();
  const shade = Math.sin(Math.min(1, u * 1.5) * Math.PI) * 0.22;
  X.fillStyle = `rgba(3,7,22,${shade})`;
  X.fillRect(0, 0, W, H);
  X.restore();
  results.forEach((value, index) => {
    const offset = (index - (results.length - 1) / 2) * 245,
      travel = Math.min(1, u / 0.72),
      ease = 1 - Math.pow(1 - travel, 3),
      launchX = 1350 + index * 24,
      targetX = 800 + offset,
      x = launchX + (targetX - launchX) * ease,
      groundY = 505 + Math.abs(offset) * 0.035,
      lift = Math.sin(travel * Math.PI) * (250 + index * 28),
      settleAge = q.settleAt ? Math.max(0, now - q.settleAt) : 0,
      bounce = q.settleAt
        ? Math.abs(Math.sin(settleAge / 72)) * Math.max(0, 54 - settleAge * 0.11)
        : 0,
      y = 720 + (groundY - 720) * ease - lift - bounce,
      spin = q.settleAt ? 0 : u * (index % 2 ? -7.5 : 8.5),
      squash = q.settleAt && settleAge < 90 ? 0.9 : 1,
      sz = 205 + Math.sin(travel * Math.PI) * 42;
    X.save();
    X.translate(x, y);
    X.rotate(spin);
    X.scale(1, squash);
    X.shadowColor = "rgba(18,10,4,.72)";
    X.shadowBlur = 28;
    X.shadowOffsetY = 18;
    contain(IM["diceThrow" + value], -sz / 2, -sz / 2, sz, sz, 1);
    X.restore();
  });
  if (q.results?.length)
    txt(
      results.length > 1
        ? `${results.join("＋")}＝${total} 點！`
        : `${total} 點！`,
      800,
      690,
      58,
      "center",
      "#fff0a0",
      1000,
      true,
    );
}
function miniMapHud() {
  const b = S.board,
    x = 18,
    y = 675,
    w = 286,
    h = 168;
  stretch(IM.roleInfo, x, y, w, h, 0.96);
  X.save();
  X.beginPath();
  X.roundRect(x + 18, y + 25, w - 36, h - 48, 12);
  X.clip();
  cover(
    IM["mapPreview" + (b.mapIndex || 0)],
    x + 18,
    y + 25,
    w - 36,
    h - 48,
    0.88,
  );
  X.restore();
  const rx = x + 18 + (b.cam.x / (MW - W)) * (w - 96),
    ry = y + 25 + (b.cam.y / (MH - H)) * (h - 94);
  X.save();
  X.strokeStyle = "#fff073";
  X.lineWidth = 4;
  X.strokeRect(rx, ry, 60, 46);
  X.restore();
  txt(
    "拖曳棋盤｜點格查看",
    x + w / 2,
    y + h - 12,
    12,
    "center",
    "#fff6d2",
    900,
    true,
  );
}
function hud() {
  const b = S.board,
    p = cp();
  b.players.forEach(playerHudCard);
  stretch(IM.roleInfo, 1170, 12, 416, 134, 0.96);
  fitTxt(
    `${b.mapRules?.name || "童話王國"}　　第 ${b.round}/${S.rounds} 回合`,
    1378,
    35,
    360,
    18,
    "center",
    "#fff4c9",
    1000,
    true,
    12,
  );
  fitTxt(
    `現在行動：${p.id + 1}P ${CHAR_NAMES[p.char]}`,
    1378,
    62,
    350,
    17,
    "center",
    PLAYER_COLORS[p.id],
    1000,
    true,
    12,
  );
  fitTxt(
    `現金 $${p.cash.toLocaleString()}　存款 $${(p.bank || 0).toLocaleString()}`,
    1378,
    91,
    350,
    15,
    "center",
    "#e2f1ff",
    850,
    true,
    12,
  );
  fitTxt(
    `總資產 $${netWorth(p).toLocaleString()}　物價指數 ×${marketIndex().toFixed(1)}`,
    1378,
    118,
    350,
    15,
    "center",
    "#ffe58e",
    900,
    true,
    12,
  );
  btn("pause", "選單", 20, 130, 150, 54, false, 0.94, !S.rolling && !b.popup);
  btn(
    "roster",
    "目前角色資料",
    180,
    130,
    220,
    54,
    false,
    0.94,
    !S.rolling && !b.popup && p.type === "human",
  );
  btn("focusCurrent", "回到角色", 410, 130, 170, 54, false, 0.94, !b.popup);
  miniMapHud();
  contain(IM.actionConsole, 955, 575, 635, 318, 0.98);
  contain(IM["portrait" + p.char], 1010, 615, 150, 150, p.bankrupt ? 0.45 : 1);
  fitTxt(
    `${p.id + 1}P ${CHAR_NAMES[p.char]}`,
    1085,
    750,
    150,
    15,
    "center",
    PLAYER_COLORS[p.id],
    1000,
    true,
    11,
  );
  const diceCount = Math.max(1, Math.min(3, p.diceCount || 1));
  for (let i = 0; i < diceCount; i++)
    contain(
      IM["dice" + (S.diceResults?.[i] || S.dice)],
      1215 + i * 105,
      620,
      115,
      115,
    );
  btn(
    "roll",
    "擲骰子",
    1215,
    755,
    340,
    78,
    true,
    1,
    !S.rolling && !b.popup && !b.winner,
  );
  btn(
    "cards",
    "卡片 " + p.cards.length,
    990,
    785,
    100,
    56,
    false,
    0.95,
    !S.rolling && !b.popup && p.type === "human",
  );
  btn(
    "tools",
    "道具 " + (p.tools || []).length,
    1095,
    785,
    100,
    56,
    false,
    0.95,
    !S.rolling && !b.popup && p.type === "human",
  );
  if (S.msg)
    fitTxt(S.msg, 800, 850, 680, 16, "center", "#fff6d2", 800, true, 12);
  diceThrowOverlay();
}
function turnBannerHud() {
  const b = S.board,
    q = b?.turnBanner;
  if (!q) return;
  const age = performance.now() - q.start;
  if (age > 1150) {
    b.turnBanner = null;
    return;
  }
  const p = b.players.find((player) => player.id === q.player) || cp(),
    enter = Math.min(1, age / 260),
    leave = age < 850 ? 1 : Math.max(0, 1 - (age - 850) / 300),
    ease = 1 - Math.pow(1 - enter, 3),
    x = 550,
    y = 192 - (1 - ease) * 90;
  X.save();
  X.globalAlpha = leave;
  X.shadowColor = PLAYER_COLORS[p.id];
  X.shadowBlur = 28;
  stretch(IM["playerSeatP" + p.id], x, y, 500, 108, leave);
  X.shadowBlur = 0;
  contain(IM["portrait" + p.char], x + 22, y + 9, 90, 90, leave);
  fitTxt(
    `第 ${b.round} 回合｜${p.id + 1}P ${CHAR_NAMES[p.char]}`,
    x + 295,
    y + 40,
    335,
    25,
    "center",
    PLAYER_COLORS[p.id],
    1000,
    true,
    16,
  );
  fitTxt(
    p.type === "ai" ? "電腦玩家正在思考" : "輪到你行動了",
    x + 295,
    y + 73,
    320,
    17,
    "center",
    "#fff7d0",
    900,
    true,
    12,
  );
  X.restore();
}
function scenePopup(q, b, p) {
  if (q.kind === "event") {
    contain(IM.abilityPanel, 400, 80, 800, 760, 0.99);
    X.save();
    X.beginPath();
    X.roundRect(493, 155, 614, 330, 22);
    X.clip();
    cover(IM["eventScene" + (b.mapIndex || 0)], 493, 155, 614, 330, 1);
    X.fillStyle = "rgba(5,10,30,.2)";
    X.fillRect(493, 155, 614, 330);
    X.restore();
    fitTxt(q.name, 800, 122, 620, 34, "center", "#fff0a5", 1000, true, 21);
    paragraph(q.desc, 800, 540, 590, 23, 32, 2, "center", "#fff", 900, true);
    btn("eventOk", "收下事件結果", 590, 650, 420, 72, true);
    return true;
  }
  if (q.kind === "npc") {
    contain(IM.abilityPanel, 725, 92, 610, 720, 0.99);
    contain(npcImage(q.name), 220, 160, 500, 560, 1);
    fitTxt(
      `遇見 ${q.name}`,
      1030,
      190,
      450,
      38,
      "center",
      "#fff0a5",
      1000,
      true,
      23,
    );
    paragraph(q.desc, 1030, 320, 430, 25, 36, 3, "center", "#fff", 900, true);
    txt(
      (p.effects || []).some((e) => e.kind === q.name)
        ? `${q.name}將跟隨 ${p.effects.find((e) => e.kind === q.name).turns} 回合`
        : "神明效果立即生效",
      1030,
      440,
      17,
      "center",
      "#ffe17b",
      900,
      true,
    );
    btn("npcOk", "繼續冒險", 855, 575, 350, 74, true);
    return true;
  }
  if (q.kind === "mini") {
    const kind = b.mini?.kind || 0,
      img = [IM.miniStar, IM.miniBalloon, IM.miniTreasure][kind];
    contain(IM.abilityPanel, 345, 70, 910, 790, 0.99);
    X.save();
    X.beginPath();
    X.roundRect(455, 150, 690, 388, 22);
    X.clip();
    cover(img, 455, 150, 690, 388, 1);
    X.restore();
    fitTxt(
      q.name || "童話小遊戲",
      800,
      112,
      700,
      34,
      "center",
      "#fff0a5",
      1000,
      true,
      22,
    );
    if (kind === 0) {
      const pos = b.mini?.pos || 0;
      X.fillStyle = "rgba(12,30,70,.82)";
      X.fillRect(520, 560, 560, 34);
      X.fillStyle = "#ffe067";
      X.fillRect(520 + pos * 540, 551, 20, 52);
      X.strokeStyle = "#fff4bb";
      X.lineWidth = 5;
      X.strokeRect(790, 548, 20, 58);
      txt(
        "星光越接近中央，獎勵越高",
        800,
        625,
        18,
        "center",
        "#fff",
        900,
        true,
      );
      btn("miniStop", "接住星光", 610, 680, 380, 70, true);
    } else if (kind === 1) {
      const pos = b.mini?.pos || 0;
      const bx = 535 + pos * 510;
      X.save();
      X.shadowColor = "#8ff6ff";
      X.shadowBlur = 25;
      X.fillStyle = "#ff78c6";
      X.beginPath();
      X.arc(bx, 575, 28, 0, Math.PI * 2);
      X.fill();
      X.restore();
      txt("看準移動中的魔法氣球", 800, 625, 18, "center", "#fff", 900, true);
      btn("miniPop", "戳破氣球", 610, 680, 380, 70, true);
    } else {
      txt(
        "三個寶箱中只有一個藏著星光大獎",
        800,
        585,
        18,
        "center",
        "#fff",
        900,
        true,
      );
      for (let i = 0; i < 3; i++)
        btn(
          "miniChest" + i,
          `寶箱 ${i + 1}`,
          475 + i * 225,
          650,
          200,
          70,
          i === 1,
        );
    }
    return true;
  }
  if (q.kind === "tileInspect") {
    const t = q.tile,
      owner = t.owner >= 0 ? b.players.find((x) => x.id === t.owner) : null;
    contain(IM.abilityPanel, 440, 105, 720, 690, 0.99);
    fitTxt(
      `第 ${t.index + 1} 格｜${t.type === "land" ? REGION_NAMES[t.region] : typeName(t.type)}`,
      800,
      205,
      610,
      36,
      "center",
      "#fff0a5",
      1000,
      true,
      21,
    );
    const lines =
      t.type === "land"
        ? [
            `地價 $${t.price.toLocaleString()}`,
            owner
              ? `地主 ${owner.id + 1}P ${CHAR_NAMES[owner.char]}`
              : "目前無人持有",
            owner
              ? `建築等級 Lv${t.level}｜租金 $${rentEstimate(t, p).toLocaleString()}`
              : "點選後抵達才可購買",
          ]
        : ["這是" + typeName(t.type) + "格", "角色抵達後會觸發對應內容"];
    lines.forEach((s, i) =>
      txt(
        s,
        800,
        315 + i * 54,
        21,
        "center",
        i === 1 && owner ? PLAYER_COLORS[owner.id] : "#fff",
        900,
        true,
      ),
    );
    btn("closeInspect", "返回棋盤", 590, 610, 420, 72, true);
    return true;
  }
  return false;
}
function popup() {
  const b = S.board,
    q = b.popup;
  if (!q) return;
  const p = cp(),
    age = Math.max(0, performance.now() - (q.openedAt || 0)),
    intro = Math.min(1, age / 220),
    ease = 1 - Math.pow(1 - intro, 3),
    scale = 0.94 + ease * 0.06;
  X.fillStyle = `rgba(4,8,24,${0.72 * ease})`;
  X.fillRect(0, 0, W, H);
  X.translate(W / 2, H / 2);
  X.scale(scale, scale);
  X.translate(-W / 2, -H / 2);
  X.globalAlpha *= ease;
  if (scenePopup(q, b, p)) return;
  contain(IM.abilityPanel, 440, 115, 720, 670, 0.99);
  let title = "冒險訊息",
    body = "",
    actions = [];
  if (q.kind === "tile") {
    const t = q.tile;
    title =
      t.type === "land" ? REGION_NAMES[t.region] + "地產" : typeName(t.type);
    if (t.type === "land") {
      if (t.owner < 0) {
        const rent = baseRent(t);
        body = `空地售價 $${buyCost(p, t).toLocaleString()}｜基礎租金 $${rent.toLocaleString()}｜購買後可升級五階建築`;
        actions = [
          ["buy", "購買土地"],
          ["skip", "暫時略過"],
        ];
      } else if (t.owner === p.id) {
        const names = ["空地", "童話小屋", "精緻旅店", "豪華地標"];
        body =
          t.level < 3
            ? `${names[t.level]}｜目前租金 $${rentEstimate(t, p).toLocaleString()}｜升級費 $${upgradeCost(t).toLocaleString()}`
            : `${regionOwned(p.id, t.region) ? "區域地標已落成" : "最高級建築"}｜目前租金 $${rentEstimate(t, p).toLocaleString()}`;
        actions =
          t.level < 3
            ? [
                ["upgrade", `升級至 ${names[t.level + 1]}`],
                ["skip", "完成回合"],
              ]
            : [["skip", "完成回合"]];
      } else {
        const owner = b.players.find((x) => x.id === t.owner);
        body = `${owner ? owner.id + 1 + "P " + CHAR_NAMES[owner.char] : "對手"}的 Lv${t.level} 地產｜需支付 $${rentEstimate(t, p).toLocaleString()} 租金`;
        actions = [["pay", p.shield > 0 ? "使用護盾／結算" : "支付租金"]];
      }
    } else if (t.type === "start") {
      body = "在起點稍作休息，獲得旅費。";
      actions = [["ok", "繼續冒險"]];
    } else {
      body = `抵達${typeName(t.type)}格`;
      actions = [["special", "查看結果"]];
    }
  } else if (q.kind === "event") {
    title = q.name;
    body = q.desc;
    actions = [["eventOk", "收下結果"]];
  } else if (q.kind === "npc") {
    title = `遇見${q.name}`;
    body = q.desc;
    actions = [["npcOk", "繼續冒險"]];
  } else if (q.kind === "carddraw") {
    title = "獲得卡片";
    body = q.card;
    actions = [["cardOk", "收入卡冊"]];
  } else if (q.kind === "shop") {
    title = "童話商店";
    body = `花費 $${shopCost(p).toLocaleString()} 購買一張隨機卡片`;
    actions = [
      ["shopBuy", "購買卡片"],
      ["skip", "離開商店"],
    ];
  } else if (q.kind === "mini") {
    title = q.name || "童話小遊戲";
    body = "完成本次童話挑戰。";
    actions = [["miniStop", "完成挑戰"]];
  } else if (q.kind === "cards") {
    title = "卡片冊";
    body = p.cards.length
      ? `選擇卡片立即使用｜${p.cards.length} / 8`
      : "目前沒有卡片";
    p.cards.slice(0, 8).forEach((c, i) => actions.push(["useCard" + i, c]));
    actions.push(["closeCards", "關閉卡冊"]);
  } else if (q.kind === "cardDice") {
    title = "遙控骰子";
    body = "選擇本回合要前進的點數";
    for (let i = 1; i <= 6; i++) actions.push(["cardDice" + i, i + " 點"]);
    actions.push(["cardCancel", "返回卡冊"]);
  } else if (q.kind === "cardTarget") {
    title = q.card;
    body = "選擇要施放卡片的對手";
    living()
      .filter((x) => x.id !== p.id)
      .forEach((x) =>
        actions.push([
          "cardTarget" + x.id,
          `${x.id + 1}P ${CHAR_NAMES[x.char]}`,
        ]),
      );
    actions.push(["cardCancel", "返回卡冊"]);
  } else if (q.kind === "pause") {
    title = "冒險選單";
    body = `${b.mapRules?.name || "童話王國"}｜第 ${b.round} 回合`;
    actions = [
      ["resume", "繼續遊戲"],
      ["saveHome", "保存並回首頁"],
    ];
  } else if (q.kind === "roster") {
    title = "玩家與資產";
    body = "查看目前現金、土地、建築、卡片與總資產";
    b.players.forEach((x) => {
      const lands = b.tiles.filter((t) => t.owner === x.id),
        buildings = lands.reduce((n, t) => n + t.level, 0);
      actions.push([
        "inspectPlayer" + x.id,
        `${x.id + 1}P ${CHAR_NAMES[x.char]}｜$${netWorth(x).toLocaleString()}｜地${lands.length} 建${buildings}`,
      ]);
    });
    actions.push(["closeCards", "返回棋盤"]);
  } else if (q.kind === "playerDetail") {
    const x = q.player,
      lands = b.tiles.filter((t) => t.owner === x.id),
      buildings = lands.reduce((n, t) => n + t.level, 0);
    title = `目前角色｜${x.id + 1}P ${CHAR_NAMES[x.char]}`;
    body = `現金 $${x.cash.toLocaleString()}｜總資產 $${netWorth(x).toLocaleString()}｜土地 ${lands.length}｜建築 ${buildings}｜卡片 ${x.cards.length}｜點券 ${x.tickets}`;
    actions = [["closeCards", "返回棋盤"]];
  } else if (q.kind === "winner") {
    title = "本局結果";
    body = q.text;
    actions = [["home", "返回首頁"]];
  }
  fitTxt(title, 800, 205, 610, 38, "center", "#fff0a5", 1000, true, 22);
  paragraph(body, 800, 305, 610, 21, 30, 3, "center", "#fff", 850, true);
  const cols = actions.length > 3 ? 2 : 1,
    w = cols === 2 ? 270 : 420,
    h = 64,
    startY = actions.length > 3 ? 370 : 470;
  actions.forEach((a, i) => {
    const col = i % cols,
      row = Math.floor(i / cols),
      x = cols === 2 ? 515 + col * 300 : 590;
    btn(a[0], a[1], x, startY + row * 74, w, h, i === 0);
  });
}
function help() {
  cover(IM.homeBg, 0, 0, W, H, 0.7);
  txt("遊戲說明", 800, 95, 48, "center", "#ffe58a", 1000, true);
  const lines = [
    "擲出立體骰子逐格前進；分岔路口可選路，路障、瞬移與交通工具會改變走法。",
    "購買土地並升至 Lv5；大型建築可改建旅館、商場或公園，各有獨立收租效果。",
    "拖曳棋盤自由查看世界；點擊格子可確認地價、地主、建築階級與預估租金。",
    "卡片與道具分冊管理；百貨公司可買賣卡片，車輛、路障與炸彈則收入 8 格道具箱。",
    "事件、三種小遊戲及巡遊神明會改變局勢；神明附身效果會持續多個回合。",
    "真人與不同難度 AI 可自由配置 2～4 名；完整角色資料只在該真人回合開放。",
  ];
  lines.forEach((l, i) =>
    fitTxt(l, 800, 200 + i * 72, 1280, 22, "center", "#fff", 850, true, 15),
  );
  btn("home", "回到首頁", 630, 690, 340, 86, true);
}
function result() {
  const b = S.board;
  cover(IM.setupBg, 0, 0, W, H, 0.82);
  txt("冒險結算", 800, 58, 46, "center", "#fff0a5", 1000, true);
  fitTxt(
    `${b.mapRules?.name || "童話王國"}｜${b.victory === "survival" ? "最後生存者" : "總資產競賽"}｜${Math.max(1, b.round - 1)} 回合`,
    800,
    105,
    720,
    18,
    "center",
    "#fff",
    850,
    true,
    13,
  );
  const ranked = b.players
    .slice()
    .sort((a, z) =>
      a.bankrupt !== z.bankrupt
        ? a.bankrupt
          ? 1
          : -1
        : netWorth(z) - netWorth(a),
    );
  ranked.forEach((p, i) => {
    const y = 150 + i * 142,
      alpha = p.bankrupt ? 0.58 : 0.98;
    stretch(IM["playerSeatP" + (p.id % 4)], 220, y, 540, 126, alpha);
    stretch(IM.roleInfo, 770, y, 610, 126, alpha);
    contain(
      IM["portrait" + p.char],
      238,
      y + 12,
      104,
      102,
      p.bankrupt ? 0.48 : 1,
    );
    txt(
      `${i + 1}`,
      365,
      y + 62,
      34,
      "center",
      i === 0 ? "#ffe071" : "#fff",
      1000,
      true,
    );
    fitTxt(
      `${p.id + 1}P ${CHAR_NAMES[p.char]}`,
      420,
      y + 39,
      300,
      23,
      "left",
      "#fff",
      1000,
      true,
      15,
    );
    txt(
      p.bankrupt ? "已破產" : "完成冒險",
      420,
      y + 80,
      16,
      "left",
      p.bankrupt ? "#ffb7b7" : "#dfffdc",
      850,
      true,
    );
    const lands = b.tiles.filter((t) => t.owner === p.id),
      buildings = lands.reduce((n, t) => n + t.level, 0);
    fitTxt(
      `現金 $${p.cash.toLocaleString()}`,
      810,
      y + 36,
      230,
      17,
      "left",
      "#fff6d2",
      900,
      true,
      12,
    );
    txt(
      `土地 ${lands.length}　建築 ${buildings}`,
      810,
      y + 78,
      15,
      "left",
      "#dbeaff",
      850,
      true,
    );
    fitTxt(
      `總資產 $${netWorth(p).toLocaleString()}`,
      1135,
      y + 58,
      330,
      20,
      "center",
      i === 0 ? "#ffe071" : "#fff",
      1000,
      true,
      14,
    );
  });
  btn("resultHome", "返回首頁", 420, 765, 330, 78, false);
  btn("rematch", "同設定再戰", 850, 765, 330, 78, true);
}
let AUDIO_CTX = null,
  MUSIC_TIMER = 0,
  MUSIC_STEP = 0;
function audioGesture() {
  try {
    if (!AUDIO_CTX)
      AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)();
    if (AUDIO_CTX.state === "suspended") AUDIO_CTX.resume();
    if (!MUSIC_TIMER) MUSIC_TIMER = setInterval(musicTick, 880);
  } catch (e) {}
}
function audioTone(freq, dur, level, type = "sine") {
  if (!AUDIO_CTX || AUDIO_CTX.state !== "running" || level <= 0) return;
  const now = AUDIO_CTX.currentTime,
    o = AUDIO_CTX.createOscillator(),
    g = AUDIO_CTX.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), now + 0.018);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g).connect(AUDIO_CTX.destination);
  o.start(now);
  o.stop(now + dur + 0.03);
}
function musicTick() {
  if (
    document.hidden ||
    !S.settings ||
    S.settings.master <= 0 ||
    S.settings.bgm <= 0
  )
    return;
  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46],
    gain = 0.018 * (S.settings.master / 100) * (S.settings.bgm / 100);
  audioTone(notes[MUSIC_STEP++ % notes.length], 0.7, gain, "triangle");
}
function sfx(kind) {
  if (!S.settings || S.settings.master <= 0 || S.settings.sfx <= 0) return;
  const gain = 0.055 * (S.settings.master / 100) * (S.settings.sfx / 100),
    spec = {
      click: [620, 0.1, "triangle"],
      dice: [180, 0.18, "square"],
      step: [330, 0.09, "sine"],
      gain: [880, 0.28, "triangle"],
      loss: [145, 0.35, "sawtooth"],
      win: [1046, 0.55, "triangle"],
    }[kind] || [520, 0.1, "sine"];
  audioTone(spec[0], spec[1], gain, spec[2]);
}
function savePrefs() {
  try {
    localStorage.setItem(PREF, JSON.stringify(S.settings));
  } catch (e) {}
}
function settings() {
  cover(IM.setupBg, 0, 0, W, H, 0.72);
  txt("聲音與操作", 800, 105, 46, "center", "#ffe58a", 1000, true);
  const s = S.settings;
  btn("master", "主音量 " + s.master + "%", 500, 215, 600, 68, false);
  btn("bgm", "背景音樂 " + s.bgm + "%", 500, 305, 600, 68, false);
  btn("sfx", "遊戲音效 " + s.sfx + "%", 500, 395, 600, 68, false);
  btn(
    "vibrate",
    "骰子震動 " + (s.vibrate ? "開" : "關"),
    500,
    485,
    600,
    68,
    false,
  );
  txt(
    "音量變更會立即套用並自動保存",
    800,
    595,
    17,
    "center",
    "#fff6d2",
    850,
    true,
  );
  btn("home", "回到首頁", 630, 650, 340, 78, true);
}

C.addEventListener("pointerdown", (e) => {
  if (S.scene !== "home" || HOME.locked) return;
  const p = pointerToGame(e),
    b = hit(p.x, p.y);
  HOME.pressed = b?.en ? b.id : null;
});
C.addEventListener("pointermove", (e) => {
  if (S.scene !== "home" || HOME.locked) return;
  const p = pointerToGame(e),
    b = hit(p.x, p.y);
  HOME.hover = b?.en ? b.id : null;
});
C.addEventListener("pointerleave", () => {
  HOME.hover = null;
  HOME.pressed = null;
});
C.addEventListener("pointercancel", () => {
  HOME.pressed = null;
});
C.addEventListener("pointerdown", (e) => {
  const p = pointerToGame(e),
    b = hit(p.x, p.y);
  UI_BUTTON.pressed = b?.en ? b.id : null;
});
C.addEventListener("pointermove", (e) => {
  const p = pointerToGame(e),
    b = hit(p.x, p.y);
  UI_BUTTON.hover = b?.en ? b.id : null;
});
C.addEventListener("pointerup", () => {
  UI_BUTTON.pressed = null;
});
C.addEventListener("pointerleave", () => {
  UI_BUTTON.hover = UI_BUTTON.pressed = null;
});
C.addEventListener("pointercancel", () => {
  UI_BUTTON.pressed = null;
});
