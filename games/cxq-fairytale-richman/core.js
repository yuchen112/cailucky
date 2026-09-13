"use strict";
const ANIMATION_FPS = 60,
  ANIMATION_MIN_FRAMES = 30,
  ANIMATION_MIN_MS = Math.ceil((ANIMATION_MIN_FRAMES / ANIMATION_FPS) * 1000);
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
  "事件型",
  "防禦型",
  "理財型",
  "移動型",
  "土地型",
  "收益型",
  "收租型",
  "特殊型",
];
const ROLE_DESC = [
  "正向事件獎金提高",
  "骰點過低時有機會修正",
  "負面事件影響較低",
  "支付租金時享有減免",
  "現金事件收益較高",
  "移動能力較穩定",
  "購地價格享有折扣",
  "每圈獎金提高",
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
    road: { cx: 1600, cy: 900, rx: 1190, ry: 620, startAngle: Math.PI / 2 },
  },
  {
    key: "moonharbor",
    name: "月光港灣",
    tag: "潮汐之路",
    difficulty: "標準",
    desc: ["租金較高、事件活躍", "港口事件改變局勢"],
    regions: ["月港碼頭", "潮汐街區", "燈塔山坡", "星砂商埠"],
    priceRate: 1.08,
    rentRate: 1.15,
    eventRate: 1.2,
    road: { cx: 1600, cy: 860, rx: 1100, ry: 580, startAngle: Math.PI / 2 },
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
    road: { cx: 1600, cy: 850, rx: 1120, ry: 570, startAngle: Math.PI / 2 },
  },
];
// Every road space keeps its own roadside construction anchor. These authored
// offsets follow each painted oval instead of deriving a single inward shift,
// so pawns stay on the road while plots/buildings sit consistently outside it.
const MAP_PLOT_OFFSETS = {
  starwish: [[0,122],[-10,104],[-23,120],[-30,100],[-49,112],[-55,88],[-82,91],[-85,60],[-116,39],[-104,0],[-116,-39],[-85,-60],[-82,-91],[-55,-88],[-49,-112],[-30,-100],[-23,-120],[-10,-104],[0,-122],[10,-104],[23,-120],[30,-100],[49,-112],[55,-88],[82,-91],[85,-60],[116,-39],[104,0],[116,39],[85,60],[82,91],[55,88],[49,112],[30,100],[23,120],[10,104]],
  moonharbor: [[0,122],[-10,104],[-23,120],[-30,99],[-49,112],[-55,88],[-82,90],[-86,59],[-116,39],[-104,0],[-116,-39],[-86,-59],[-82,-90],[-55,-88],[-49,-112],[-30,-99],[-23,-120],[-10,-104],[0,-122],[10,-104],[23,-120],[30,-99],[49,-112],[55,-88],[82,-90],[86,-59],[116,-39],[104,0],[116,39],[86,59],[82,90],[55,88],[49,112],[30,99],[23,120],[10,104]],
  cloudbazaar: [[0,122],[-9,104],[-22,120],[-29,100],[-48,112],[-54,89],[-81,92],[-85,60],[-115,40],[-104,0],[-115,-40],[-85,-60],[-81,-92],[-54,-89],[-48,-112],[-29,-100],[-22,-120],[-9,-104],[0,-122],[9,-104],[22,-120],[29,-100],[48,-112],[54,-89],[81,-92],[85,-60],[115,-40],[104,0],[115,40],[85,60],[81,92],[54,89],[48,112],[29,100],[22,120],[9,104]],
};
const SAVE = "cxq_richman_latest_save_v4",
  SAVE_SLOT_PREFIX = "cxq_richman_manual_save_v1_",
  PREF = "cxq_richman_pref_v1";
const S = {
  scene: "home",
  buttons: [],
  seats: [
    { type: "human", char: 6, diff: "standard", equipment: ["deed", "boots"] },
    { type: "ai", char: 1, diff: "standard", equipment: ["compass", "charm"] },
    { type: "off", char: 2, diff: "standard", equipment: [] },
    { type: "off", char: 3, diff: "standard", equipment: [] },
  ],
  activeSeat: 0,
  mapIndex: 0,
  money: 200000,
  rounds: 30,
  victory: "assets",
  eventLevel: "standard",
  gods: true,
  board: null,
  msg: "",
  rolling: false,
  dice: 1,
  diceResults: [1],
  rollResolution: null,
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

const ASSET_REV = "20260913-0610";
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
load("homeMenuNew", A + "ui/home_menu_new_v4.png", "high");
load("homeMenuContinue", A + "ui/home_menu_continue_v4.png", "high");
load("homeMenuHelp", A + "ui/home_menu_help_v4.png", "high");
load("homeMenuSettings", A + "ui/home_menu_settings_v4.png", "high");
load("btnBlue", A + "ui/btn_blue_v5.png", "high");
load("btnRed", A + "ui/btn_red_v5.png", "high");
load("setupBg", A + "backgrounds/setup_scene_v4.webp", "high");
load("playerSeat", A + "ui/player_plate_v5.png");
load("roleInfo", A + "ui/tooltip_plate_v5.png");
load("characterStage", A + "ui/modal_frame_v6.png");
load("abilityPanel", A + "ui/modal_frame_v6.png");
load("actionConsole", A + "ui/info_panel_v5.png");
load("settingsFrame", A + "ui/settings_frame_v5.png");
load("settingsIcon", A + "ui/settings_icon_v6.png", "high");
load("diceFrame", A + "ui/dice_frame_v5.png");
load("mapCardFrame", A + "ui/info_panel_v5.png");
for (let i = 0; i < 4; i++)
  load("playerSeatP" + i, A + "ui/player_plate_v5.png");
load("statusHuman", A + "ui/btn_red_v5.png");
load("statusAi", A + "ui/btn_blue_v5.png");
load("statusOff", A + "ui/tooltip_plate_v5.png");
MAPS.forEach((m, i) =>
  load("mapWorld" + i, A + "maps/map_world_" + m.key + "_v2.webp"),
);
MAPS.forEach((m, i) =>
  load("mapPreview" + i, A + "maps/map_world_" + m.key + "_v2.webp"),
);
load("tile_land", A + "tiles/land_v4.png");
load("tile_event", A + "tiles/event_v4.png");
load("tile_start", A + "tiles/start_v4.png");
load("diceAction", A + "dice/dice_action_v4.png");
// Known-corrupt start/event rasters are intentionally not loaded. They are visually quarantined.
for (let i = 1; i <= 6; i++) load("dice" + i, A + "dice/dice_" + i + ".webp");
for (let i = 1; i <= 6; i++)
  load("diceThrow" + i, A + `dice/dice_throw_${i}_v3.png`);
MAPS.forEach((m, i) =>
  load("eventScene" + i, A + `events/${m.key}_event_v1.webp`),
);
load("event_kingdomFestival", A + "events/kingdom_festival_v2.webp");
load("event_emergencyRepairs", A + "events/emergency_repairs_v2.webp");
load("event_luckyFountain", A + "events/lucky_fountain_v2.webp");
load("event_lostInMaze", A + "events/lost_in_maze_v2.webp");
load("event_marketBoom", A + "events/market_boom_v2.webp");
load("event_mischief", A + "events/mischief_v2.webp");
load("event_guardianBlessing", A + "events/guardian_blessing_v2.webp");
load("event_taxDay", A + "events/tax_day_v2.webp");
load("event_starlightRain", A + "events/starlight_rain_v2.webp");
load("event_roadConstruction", A + "events/road_construction_v2.webp");
load("event_kingdomSubsidy", A + "events/kingdom_subsidy_v2.webp");
load("event_magicMalfunction", A + "events/magic_malfunction_v2.webp");
load("event_moonlightDividend", A + "events/moonlight_dividend_v2.webp");
load("event_forestMist", A + "events/forest_mist_v2.webp");
load("event_cloudTailwind", A + "events/cloud_tailwind_v2.webp");
load("event_merchantGuildReward", A + "events/merchant_guild_reward_v2.webp");
load("event_landMaintenance", A + "events/land_maintenance_v2.webp");
load("event_fairyBlessing", A + "events/fairy_blessing_v2.webp");
load("event_systemLandPurchase", A + "events/system_land_purchase_v1.webp");
load("event_systemRentPayment", A + "events/system_rent_payment_v1.webp");
load("event_systemBuildUpgrade", A + "events/system_build_upgrade_v1.webp");
load("facilityMagic", A + "facilities/magic_token_v2.webp");
load("roadNode", A + "tiles/road_node_v3.webp");
load("npcWealth", A + "npc/wealth_v6.png");
load("npcFortune", A + "npc/fortune_v6.png");
load("npcPoverty", A + "npc/poverty_v6.png");
load("npcMisfortune", A + "npc/misfortune_v6.png");
load("npcLand", A + "npc/land_v6.png");
load("npcAngel", A + "npc/angel_v6.png");
load("npcDemon", A + "npc/demon_v6.png");
load("npcDeath", A + "npc/death_v6.png");
for (let i = 0; i < 4; i++) load("playerFlag" + i, A + `ui/flag_p${i + 1}_v4.png`);
CHAR_KEYS.forEach((k, i) => {
  load("c" + i, A + "characters/" + k + "/idle_v7.png");
  load("portrait" + i, A + "characters/" + k + "/idle_v7.png");
  load(k + "Dice", A + "characters/" + k + "/dice_v7.png");
  load(k + "Surprise", A + "characters/" + k + "/surprise_v7.png");
  load(k + "Victory", A + "characters/" + k + "/victory_v7.png");
});
CHAR_KEYS.forEach((k) => {
  load(k + "WalkRightContact", A + "characters/" + k + "/walk_right_contact_v7.png");
  load(k + "WalkRightPassing", A + "characters/" + k + "/walk_right_passing_v7.png");
});
MAPS.forEach((m, mi) => {
  for (let level = 1; level <= 5; level++)
    load(`building${mi}_${level}`, A + `buildings/shared_l${Math.min(4, level)}_v4.png`);
});
CHAR_KEYS.forEach((key) =>
  load(`landmark_${key}`, A + `buildings/landmark_${key}_v4.png`),
);
load("resultVictory", A + "results/victory_v4.webp");
load("resultDefeat", A + "results/defeat_v4.webp");
[
  "deed", "toolkit", "charm", "guardian", "bell", "boots", "compass", "manual",
].forEach((key) => load("equip_" + key, A + "equipment/" + key + "_v4.png"));

const VIEW = { scale: 1, ox: 0, oy: 0, visibleX: 0, visibleY: 0, visibleW: W, visibleH: H, uiScale: 1, uiOx: 0, uiOy: 0 };
let UI_FIT_ACTIVE = false;
function sceneBackdrop() {
  if (S.scene === "home") return IM.homeBg;
  if (
    ["setup", "loadout", "mapSelect", "rules", "result", "help", "settings", "loadSelect"].includes(
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
    const r = Math.max(C.width / edgeBg.naturalWidth, C.height / edgeBg.naturalHeight),
      iw = edgeBg.naturalWidth * r, ih = edgeBg.naturalHeight * r;
    X.drawImage(edgeBg, (C.width - iw) / 2, (C.height - ih) / 2, iw, ih);
  }
  X.setTransform(VIEW.scale, 0, 0, VIEW.scale, VIEW.ox, VIEW.oy);
  S.buttons = [];
}
function beginUiLayer() {
  X.save();
  UI_FIT_ACTIVE = true;
  X.setTransform(VIEW.uiScale, 0, 0, VIEW.uiScale, VIEW.uiOx, VIEW.uiOy);
}
function endUiLayer() {
  UI_FIT_ACTIVE = false;
  X.restore();
}
function pointerToGame(e) {
  const r = C.getBoundingClientRect(),
    px = ((e.clientX - r.left) / r.width) * C.width,
    py = ((e.clientY - r.top) / r.height) * C.height;
  return { x: (px - VIEW.ox) / VIEW.scale, y: (py - VIEW.oy) / VIEW.scale };
}
function pointerToUi(e) {
  const r = C.getBoundingClientRect(),
    px = ((e.clientX - r.left) / r.width) * C.width,
    py = ((e.clientY - r.top) / r.height) * C.height;
  return { x: (px - VIEW.uiOx) / VIEW.uiScale, y: (py - VIEW.uiOy) / VIEW.uiScale };
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
  X.font = `${w} ${size}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;
  const measured = Math.max(1, X.measureText(String(s)).width),
    scaleX = Math.min(1, maxW / measured);
  X.restore();
  if (scaleX < 0.999) {
    X.save();
    X.translate(x, y);
    X.scale(scaleX, 1);
    txt(s, 0, 0, size, a, c, w, o);
    X.restore();
  } else txt(s, x, y, size, a, c, w, o);
  return size;
}
function wrapLines(s, maxW, z = 22, w = 800, maxLines = 3) {
  const paragraphs = String(s).split("\n"), lines = [];
  X.save();
  X.font = `${w} ${z}px system-ui,-apple-system,"Noto Sans TC",sans-serif`;
  for (let pi = 0; pi < paragraphs.length && lines.length < maxLines; pi++) {
    let line = "";
    for (const ch of Array.from(paragraphs[pi])) {
      const next = line + ch;
      if (line && X.measureText(next).width > maxW) {
        lines.push(line);
        line = ch;
        if (lines.length >= maxLines) break;
      } else line = next;
    }
    if (lines.length < maxLines && line) lines.push(line);
  }
  const sourceLength = paragraphs.join("").length,
    visibleLength = lines.join("").replace(/…/g, "").length;
  if (visibleLength < sourceLength && lines.length) {
    let last = lines.length - 1;
    while (lines[last].length && X.measureText(lines[last] + "…").width > maxW)
      lines[last] = lines[last].slice(0, -1);
    lines[last] += "…";
  }
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
function nineSlice(im, x, y, w, h, left = 96, top = 96, right = 96, bottom = 96, alpha = 1) {
  if (!im?.complete || !im.naturalWidth || !im.naturalHeight) {
    panelPlate(x, y, w, h, alpha);
    return false;
  }
  const sw = im.naturalWidth,
    sh = im.naturalHeight,
    sx = [0, left, sw - right, sw],
    sy = [0, top, sh - bottom, sh],
    cornerScale = Math.min(1, w / (left + right), h / (top + bottom)),
    dl = left * cornerScale,
    dr = right * cornerScale,
    dt = top * cornerScale,
    db = bottom * cornerScale,
    dx = [x, x + dl, x + w - dr, x + w],
    dy = [y, y + dt, y + h - db, y + h];
  X.save();
  X.globalAlpha = alpha;
  X.imageSmoothingEnabled = true;
  X.imageSmoothingQuality = "high";
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++)
      X.drawImage(
        im,
        sx[col], sy[row], sx[col + 1] - sx[col], sy[row + 1] - sy[row],
        dx[col], dy[row], dx[col + 1] - dx[col], dy[row + 1] - dy[row],
      );
  X.restore();
  return true;
}
function portrait(im, x, y, w, h, alpha = 1) {
  X.save();
  X.beginPath();
  X.ellipse(x + w / 2, y + h / 2, w * 0.47, h * 0.47, 0, 0, Math.PI * 2);
  X.clip();
  contain(im, x, y, w, h, alpha);
  X.restore();
}
function cover(im, x, y, w, h, alpha = 1) {
  if (UI_FIT_ACTIVE && im === sceneBackdrop() && x === 0 && y === 0 && w === W && h === H) {
    if (alpha < 1) {
      X.save();
      X.fillStyle = `rgba(2,7,20,${1 - alpha})`;
      X.fillRect(0, 0, W, H);
      X.restore();
    }
    return true;
  }
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
  stretch(red ? IM.btnRed : IM.btnBlue, bx, by, bw, bh, alpha * (en ? 1 : 0.38));
  X.restore();
  const iconOnly = label === "◀" || label === "▶";
  fitTxt(
    label,
    x + w / 2,
    y + h * (iconOnly ? 0.5 : 0.55) + (pressed ? 3 : 0),
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
function panelPlate(x, y, w, h, alpha = 0.94) {
  X.save();
  X.globalAlpha = alpha;
  const g = X.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(12,39,77,.96)");
  g.addColorStop(1, "rgba(3,14,39,.96)");
  X.fillStyle = g;
  X.strokeStyle = "#e6bb57";
  X.lineWidth = 3;
  X.beginPath();
  X.roundRect(x, y, w, h, 18);
  X.fill(); X.stroke();
  X.strokeStyle = "rgba(116,202,255,.55)";
  X.lineWidth = 1;
  X.beginPath();
  X.roundRect(x + 7, y + 7, w - 14, h - 14, 13);
  X.stroke();
  X.restore();
}
function artLabel(text, x, y, w = 150, h = 44, size = 16, color = "#fff6d2", alpha = 0.98) {
  stretch(IM.roleInfo, x, y, w, h, alpha);
  fitTxt(text, x + w / 2, y + h * 0.51, w * 0.68, size, "center", color, 1000, true, 10);
}
function diceIconButton(id, x, y, size, en = true) {
  const pressed = en && UI_BUTTON.pressed === id,
    hovered = en && UI_BUTTON.hover === id,
    d = pressed ? -4 : hovered ? 4 : 0,
    cx = x + size / 2,
    cy = y + size / 2;
  X.save();
  X.globalAlpha = en ? 1 : 0.38;
  X.shadowColor = hovered ? "rgba(255,229,112,.95)" : "rgba(0,0,0,.55)";
  X.shadowBlur = hovered ? 24 : 14;
  const g = X.createRadialGradient(cx, cy - 12, 8, cx, cy, size / 2);
  g.addColorStop(0, "#376fae"); g.addColorStop(1, "#071a43");
  X.fillStyle = g; X.strokeStyle = "#f3cf70"; X.lineWidth = 6;
  X.beginPath(); X.arc(cx, cy, size / 2 - 4 + d / 2, 0, Math.PI * 2); X.fill(); X.stroke();
  contain(IM.diceAction || IM["diceThrow" + (S.dice || 1)], x + 18 - d / 2, y + 15 - d / 2, size - 36 + d, size - 36 + d, 1);
  X.restore();
  S.buttons.push({ id, x, y, w: size, h: size, en });
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
function hasAnySave() {
  if (localStorage.getItem(SAVE)) return true;
  for (let i = 1; i <= 4; i++)
    if (localStorage.getItem(SAVE_SLOT_PREFIX + i)) return true;
  return false;
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
    29,
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
    canContinue = hasAnySave(),
    safeY = UI_FIT_ACTIVE ? 0 : (VIEW.visibleY || 0),
    safeBottom = safeY + (UI_FIT_ACTIVE ? H : (VIEW.visibleH || H)),
    headerY = safeY + 12,
    logoLift = Math.min(52, safeY * 0.64);
  cover(IM.homeBg, 0, 0, W, H, 1);
  X.save();
  X.globalAlpha = sceneA;
  stretch(IM.playerSeat, 1120, headerY, 430, 94, 0.9);
  txt("童話棋盤冒險", 1335, headerY + 29, 22, "center", "#fff7dc", 1000, true);
  txt(
    "擲骰・買地・蓋房・收租・常駐裝備・巡遊神明",
    1335,
    headerY + 60,
    16,
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
  txt("CxQ", 330, 96 + logoY + logoLift, 68, "center", "#ffe27a", 1000, true);
  txt("童話大富翁", 330, 158 + logoY + logoLift, 48, "center", "#fff1be", 1000, true);
  txt(
    "夢想王國資產大冒險",
    330,
    203 + logoY + logoLift,
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
  const infoY = Math.min(766, safeBottom - 112);
  stretch(IM.roleInfo, 54, infoY, 552, 104, 0.98);
  txt(
    canContinue ? "已有冒險紀錄｜可繼續上次進度" : "尚無冒險紀錄｜請開始新遊戲",
    325,
    infoY + 38,
    26,
    "center",
    "#fff2bd",
    950,
    true,
  );
  txt(
    "5 槽存檔：即時紀錄＋4 個自選紀錄",
    325,
    infoY + 72,
    22,
    "center",
    "#ffffff",
    850,
    true,
  );
  X.restore();
  if (HOME.leaving) {
    const p = clamp01((now - HOME.leaveAt) / ANIMATION_MIN_MS);
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

function loadSelect() {
  cover(IM.setupBg, 0, 0, W, H, 0.9);
  X.save();
  X.fillStyle = "rgba(3,8,24,.42)";
  X.fillRect(0, 0, W, H);
  X.restore();
  stretch(IM.abilityPanel, 400, 82, 800, 736, 0.99);
  txt("讀取冒險紀錄", 800, 176, 38, "center", "#fff0a5", 1000, true);
  txt("選擇即時紀錄，或四個自選儲存槽之一", 800, 220, 18, "center", "#ffffff", 850, true);
  const slots = [0, 1, 2, 3, 4];
  slots.forEach((slot, i) => {
    const key = slot === 0 ? SAVE : SAVE_SLOT_PREFIX + slot,
      exists = !!localStorage.getItem(key),
      label = `${slot === 0 ? "即時紀錄" : `自選紀錄 ${slot}`}｜${saveSlotSummary(slot)}`;
    btn(
      `homeLoadSlot${slot}`,
      label,
      505,
      254 + i * 76,
      590,
      60,
      i === 0,
      exists ? 1 : 0.42,
      exists,
    );
  });
  btn("back", "返回首頁", 625, 654, 350, 66, false);
  txt("空白紀錄無法選取，避免誤按", 800, 754, 16, "center", "#dfeaff", 800, true);
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
  if (b !== undefined && b !== a) {
    SETUP_VIEW.notice = `${CHAR_NAMES[ci]}已由 ${b + 1}P 選擇，請選擇其他角色`;
    SETUP_VIEW.noticeUntil = performance.now() + 2200;
    return;
  }
  S.pickAnim = {
    char: ci,
    seat: a,
    swapSeat: -1,
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
  for (let i = 0; i < 6; i++) {
    const trail = Math.max(0, e - i * 0.045),
      tx = q.from.x + (q.to.x - q.from.x) * trail,
      ty = q.from.y + (q.to.y - q.from.y) * trail + Math.sin(t * 13 + i) * 10;
    X.save(); X.globalAlpha = (1 - i / 6) * (1 - t * 0.55); X.fillStyle = i % 2 ? "#74e9ff" : "#ffe478";
    X.beginPath(); X.arc(tx, ty, 5 - i * 0.55, 0, Math.PI * 2); X.fill(); X.restore();
  }
}
function seatPanel(i, x, y) {
  const s = S.seats[i],
    sel = S.activeSeat === i,
    typeLabel =
      s.type === "human" ? "真人" : s.type === "ai" ? "電腦 AI" : "空席";
  const alpha = s.type === "off" ? 0.48 : sel ? 1 : 0.94;
  stretch(IM["playerSeatP" + i], x, y, 390, 150, alpha);
  if (sel) {
    X.save();
    X.strokeStyle = PLAYER_COLORS[i];
    X.lineWidth = 5;
    X.shadowColor = PLAYER_COLORS[i];
    X.shadowBlur = 24;
    X.beginPath();
    X.roundRect(x + 4, y + 4, 382, 142, 24);
    X.stroke();
    X.restore();
    artLabel(`目前編輯 ${i + 1}P`, x + 132, y - 25, 150, 42, 15, PLAYER_COLORS[i]);
  }
  S.buttons.push({ id: "seat" + i, x, y, w: 390, h: 150, en: !S.pickAnim });
  if (!(S.pickAnim && S.pickAnim.seat === i) && s.type !== "off")
    portrait(IM["portrait" + s.char], x + 24, y + 20, 108, 108, 0.99);
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
      15,
      "center",
      "#fff5cf",
      850,
      true,
      12,
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
  contain(
    IM.characterStage,
    SETUP.stageX,
    SETUP.stageY,
    SETUP.stageW,
    SETUP.stageH,
    0.99,
  );
  if (!(S.pickAnim && S.pickAnim.char === ci)) {
    const now = performance.now(),
      breathe = 1 + Math.sin(now / 620) * 0.018,
      floatY = Math.sin(now / 760) * 7,
      sway = Math.sin(now / 1050) * 0.012;
    X.save();
    X.translate(SETUP.stageX + SETUP.stageW / 2, SETUP.stageY + SETUP.stageH / 2 + floatY);
    X.rotate(sway);
    X.scale(2 - breathe, breathe);
    contain(IM["c" + ci], -(SETUP.stageW - 210) / 2, -(SETUP.stageH - 120) / 2, SETUP.stageW - 210, SETUP.stageH - 120, 0.99);
    X.restore();
    for (let i = 0; i < 7; i++) {
      const a = now / 950 + i * 0.897,
        r = 145 + (i % 3) * 17,
        px = SETUP.stageX + SETUP.stageW / 2 + Math.cos(a) * r,
        py = SETUP.stageY + SETUP.stageH / 2 + Math.sin(a * 1.18) * (r * 0.72);
      X.save(); X.globalAlpha = 0.28 + 0.3 * (0.5 + 0.5 * Math.sin(a * 2.4)); X.fillStyle = i % 2 ? "#7ee9ff" : "#ffe990";
      X.beginPath(); X.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2); X.fill(); X.restore();
    }
  }
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
      : `已由 ${owner + 1}P 選擇`,
    350,
    606,
    340,
    68,
    true,
    1,
    !S.pickAnim && S.seats[S.activeSeat].type !== "off" && (owner === undefined || owner === S.activeSeat),
  );
  stretch(IM.abilityPanel, 850, 104, 420, 420, 0.99);
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
    18,
    28,
    3,
    "center",
    "#fff",
    850,
    true,
  );
  txt("專屬能力", 1060, 348, 15, "center", "#ffe17b", 1000, true);
  paragraph(
    ROLE_DESC[ci],
    1060,
    407,
    292,
    17,
    27,
    3,
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
  stretch(IM.roleInfo, 1280, 145, 285, 168, 0.95);
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
  fitTxt("資金、回合、事件與神明", 1422, 272, 230, 16, "center", "#d9eaff", 900, true, 13);
  fitTxt("下一階段再設定", 1422, 300, 230, 16, "center", "#d9eaff", 900, true, 13);
  btn(
    "startGame",
    "確認角色，選擇裝備",
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

function loadout() {
  cover(IM.setupBg, 0, 0, W, H, 0.86);
  btn("loadoutBack", "返回選角", 22, 20, 190, 62, false);
  txt("冒險裝備", 800, 50, 42, "center", "#fff0b6", 1000, true);
  txt("真人選擇常駐裝備；電腦玩家會依角色與難度自動配置", 800, 91, 17, "center", "#fff", 850, true);
  const active = activeSeatIds(),
    humans = active.filter((seatIndex) => S.seats[seatIndex].type === "human");
  if (!humans.includes(S.activeSeat)) S.activeSeat = humans[0];
  const seat = S.seats[S.activeSeat];
  active.forEach((seatIndex, i) => {
    const s = S.seats[seatIndex], x = 245 + i * 285;
    const editable = s.type === "human";
    stretch(IM["playerSeatP" + seatIndex], x, 112, 265, 78, seatIndex === S.activeSeat ? 1 : .62);
    portrait(IM["portrait" + s.char], x + 8, 116, 70, 70, 1);
    btn(
      "loadoutSeat" + seatIndex,
      editable ? `${seatIndex + 1}P ${CHAR_NAMES[s.char]}` : `${seatIndex + 1}P AI｜自動配置`,
      x + 78,
      124,
      178,
      54,
      seatIndex === S.activeSeat,
      editable ? 1 : .72,
      editable,
    );
  });
  EQUIPMENT_DEFS.forEach((item, i) => {
    const x = 105 + (i % 2) * 700, y = 205 + Math.floor(i / 2) * 137,
      selected = (seat.equipment || []).includes(item.id), full = (seat.equipment || []).length >= 2;
    stretch(IM["playerSeatP" + S.activeSeat], x, y, 660, 125, selected ? 1 : .82);
    contain(IM["equip_" + item.id], x + 18, y + 14, 96, 96, selected ? 1 : .74);
    fitTxt(item.name, x + 130, y + 35, 250, 21, "left", selected ? "#ffe37a" : "#fff2c5", 1000, true, 14);
    paragraph(item.desc, x + 130, y + 76, 330, 15, 21, 2, "left", "#dceaff", 900, true);
    btn("equip" + item.id, selected ? "已裝備｜卸下" : full ? "裝備欄已滿" : "裝備", x + 480, y + 35, 160, 55, selected, .96, selected || !full);
  });
  fitTxt(`${S.activeSeat + 1}P 已裝備 ${(seat.equipment || []).length}/2`, 800, 767, 450, 20, "center", "#ffe17b", 1000, true, 14);
  btn("loadoutNext", "確認裝備，選擇地圖", 590, 806, 420, 68, true, 1, active.every((i) => (S.seats[i].equipment || []).length > 0));
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
      17,
      27,
      3,
      "center",
      "#fff",
      850,
      true,
    );
    fitTxt(
      `土地 ×${m.priceRate.toFixed(2)}　租金 ×${m.rentRate.toFixed(2)}`,
      x + 225,
      568,
      330,
      14,
      "center",
      "#ffe17b",
      850,
      true,
    );
    fitTxt(
      `事件 ×${m.eventRate.toFixed(2)}`,
      x + 225,
      596,
      330,
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
  stretch(IM.abilityPanel, 180, 145, 560, 560, 0.98);
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
  fitTxt("每位角色最多攜帶兩件常駐裝備", 460, 525, 400, 18, "center", "#d9efff", 900, true, 14);
  fitTxt("點擊上方欄位即可循環切換設定", 460, 566, 400, 15, "center", "#fff1b8", 850, true, 12);
  stretch(IM.abilityPanel, 860, 145, 560, 560, 0.98);
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
  fitTxt(
    `地圖租金倍率 ×${m.rentRate.toFixed(2)}`,
    1140,
    445,
    400,
    18,
    "center",
    "#fff7dd",
    900,
    true,
  );
  fitTxt(
    "所有設定都可在開局前再次調整",
    1140,
    495,
    400,
    16,
    "center",
    "#d9eaff",
    850,
    true,
  );
  btn("launchGame", "開始冒險", 630, 746, 340, 84, true);
}

function tileImage(type) {
  if (type === "start") return IM.tile_start || IM.roadNode || IM.tile_land;
  if (type === "event") return IM.tile_event || IM.roadNode || IM.tile_land;
  return IM["tile_" + type] || IM.tile_land;
}
function facilityImage(type) {
  return {
    magic: IM.facilityMagic,
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
  const bob = Math.sin(performance.now() / 330 + n.pos) * 4;
  X.save();
  X.shadowColor = "rgba(255,225,120,.9)";
  X.shadowBlur = 14;
  contain(npcImage(n.name), t.x - 42, t.y - 92 + bob, 84, 99, 1);
  X.restore();
  artLabel(n.name, t.x - 58, t.y - 124 + bob, 116, 36, 13, "#fff8ce", 0.98);
}
function buildingImage(t) {
  if (t.owner < 0 || t.level < 1) return null;
  const owner = S.board.players.find((p) => p.id === t.owner);
  if (t.level >= 5) return IM[`landmark_${CHAR_KEYS[owner?.char || 0]}`];
  return IM[`building${S.board.mapIndex || 0}_${Math.min(4, t.level)}`];
}
function drawOwnerFlag(ownerId, x, y, w = 92, h = 112) {
  const flag = IM["playerFlag" + ownerId];
  if (!flag?.complete || !flag.naturalWidth) return false;
  X.save();
  X.imageSmoothingEnabled = true;
  X.imageSmoothingQuality = "high";
  X.shadowColor = "rgba(0,0,0,.55)";
  X.shadowBlur = 10;
  X.drawImage(flag, x, y, w, h);
  X.restore();
  return true;
}
function roadAnchor(t) {
  return { x: t.x, y: t.y };
}
function plotAnchor(t) {
  return { x: t.x, y: t.y };
}
// Backwards-compatible name for popup and input code. A land's visual target is
// its plot, while pawns, roaming NPCs and obstacles always use roadAnchor().
function tileVisualPosition(t) {
  return plotAnchor(t);
}
function drawTile(t) {
  const road = roadAnchor(t),
    visual = plotAnchor(t),
    shiftX = visual.x - t.x,
    shiftY = visual.y - t.y,
    tileSize = t.type === "land" ? 94 : t.type === "start" ? 128 : 114;
  X.save();
  X.translate(shiftX, shiftY);
  if (t.type === "land") {
    const mapGlow = ["rgba(255,218,112,.3)", "rgba(105,174,255,.32)", "rgba(184,149,255,.32)"][S.board?.mapIndex || 0];
    X.fillStyle = mapGlow;
    X.beginPath(); X.ellipse(t.x, t.y + 3, 58, 43, 0, 0, Math.PI * 2); X.fill();
  }
  contain(
    t.type === "land" ? (IM.roadNode || tileImage(t.type)) : tileImage(t.type),
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
      X.save();
      X.strokeStyle = PLAYER_COLORS[t.owner];
      X.lineWidth = 6;
      X.shadowColor = PLAYER_COLORS[t.owner];
      X.shadowBlur = 12;
      X.beginPath();
      X.ellipse(t.x, t.y + 4, 43, 31, 0, 0, Math.PI * 2);
      X.stroke();
      X.restore();
      drawOwnerFlag(t.owner, t.x - 76, t.y - 108, 72, 92);
      if (building) {
        const grow = 1 + pulse * 0.18,
          landmark = t.level >= 5,
          sz = ([0, 82, 100, 118, 136, 154][Math.min(5, t.level)] || 82) * grow;
        X.save();
        X.shadowColor = PLAYER_COLORS[t.owner];
        X.shadowBlur = 28 + 30 * pulse;
        contain(building, t.x - sz / 2, t.y + 17 - sz, sz, sz, 1);
        X.restore();
        if (t.special)
          artLabel(
            t.special === "hotel" ? "星光旅館" : t.special === "mall" ? "童話商場" : "祝福公園",
            t.x - 73,
            t.y - 143,
            146,
            40,
            13,
            "#fff2ae",
          );
        if (pulse > 0)
          artLabel("★ 升級完成 ★", t.x - 86, t.y - 180, 172, 42, 14, "#ffe274");
      }
      if (!building && pulse > 0)
        artLabel("★ 地契已取得 ★", t.x - 86, t.y - 136, 172, 42, 14, "#ffe274");
    }
    if (S.board?.selectedTile === t)
      txt(`$${Math.round(t.price / 1000)}K`, t.x, t.y + 58, 11, "center", "#fff6d2", 900, true);
  }
  X.restore();
}
function drawPlayers() {
  const b = S.board,
    now = performance.now(),
    ordered = b.players.slice().sort((a, z) => (a.id === cp().id) - (z.id === cp().id));
  for (const p of ordered) {
    if (p.bankrupt) continue;
    const t = b.tiles[p.pos],
      same = b.players.filter((q) => !q.bankrupt && q.pos === p.pos),
      idx = same.indexOf(p),
      slots = same.length <= 1
        ? [[0, 0]]
        : same.length === 2
          ? [[-44, 8], [44, 8]]
          : same.length === 3
            ? [[-55, 10], [0, -12], [55, 10]]
            : [[-62, -4], [-22, 18], [22, -4], [62, 18]],
      slotX = slots[idx]?.[0] || 0,
      slotY = slots[idx]?.[1] || 0;
    let x = t.x + slotX,
      y = t.y + slotY;
    if (p.moveAnim) {
      const q = p.moveAnim,
        u = Math.min(1, (now - q.start) / q.dur),
        e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      x = q.from.x + (q.to.x - q.from.x) * e + slotX;
      y = q.from.y + (q.to.y - q.from.y) * e + slotY;
    }
    const key = CHAR_KEYS[p.char],
      contact = IM[key + "WalkRightContact"],
      passing = IM[key + "WalkRightPassing"],
      motionAge = p.moveAnim ? now - p.moveAnim.start : 0,
      stepPhase = motionAge / 105,
      walkingBob = p.moveAnim
        ? -Math.abs(Math.sin(stepPhase * Math.PI)) * 10
        : Math.sin(now / 520 + p.id * 1.7) * 3,
      landingAge = p.landAnimAt ? now - p.landAnimAt : 9999,
      landing = landingAge < 440 ? Math.sin((landingAge / 440) * Math.PI) * Math.exp(-landingAge / 520) : 0,
      idleBreath = p.moveAnim ? 1 : 1 + Math.sin(now / 620 + p.id) * 0.018,
      lean = p.moveAnim ? Math.sin(stepPhase * Math.PI) * 0.035 : Math.sin(now / 900 + p.id) * 0.008;
    X.save();
    X.globalAlpha = p.moveAnim ? 0.42 : 0.3;
    X.fillStyle = "#08101c";
    X.beginPath();
    X.ellipse(x, y + 7, p.moveAnim ? 34 : 39, p.moveAnim ? 9 : 12, 0, 0, Math.PI * 2);
    X.fill();
    X.restore();
    X.save();
    X.shadowColor = PLAYER_COLORS[p.id];
    X.shadowBlur = 18;
    X.translate(x, y);
    X.rotate(lean);
    X.scale(1 + landing * 0.14 - (idleBreath - 1) * 0.45, idleBreath - landing * 0.1);
    if (p.moveAnim && contact?.complete && passing?.complete) {
      const q = p.moveAnim,
        frame = Math.floor((now - q.start) / 105) % 2 ? passing : contact;
      containFacing(frame, -60, -128 + walkingBob, 120, 140, q.to.x >= q.from.x);
    } else contain(IM["c" + p.char], -56, -118 + walkingBob, 112, 132);
    X.restore();
    if (p.moveAnim) {
      const dust = Math.abs(Math.sin(stepPhase * Math.PI));
      X.save();
      X.globalAlpha = 0.34 * dust;
      X.fillStyle = "#fff0b5";
      X.beginPath(); X.arc(x - 18, y + 5, 5 + dust * 4, 0, Math.PI * 2); X.fill();
      X.beginPath(); X.arc(x + 15, y + 8, 3 + dust * 3, 0, Math.PI * 2); X.fill();
      X.restore();
    }
    const labelW = 68;
    stretch(IM["playerSeatP" + p.id], x - labelW / 2, y - 151 + walkingBob * 0.25, labelW, 30, 0.98);
    fitTxt(`${p.id + 1}P`, x, y - 136 + walkingBob * 0.25, labelW - 16, 13, "center", PLAYER_COLORS[p.id], 1000, true, 10);
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
  }
}
function drawMap() {
  const b = S.board;
  cover(IM["mapWorld" + (b.mapIndex || 0)] || IM.mapWorld0, 0, 0, MW, MH, 1);
  b.tiles.forEach(drawTile);
  if (b.npcs)
    for (const n of b.npcs) {
      const t = b.tiles[n.pos];
      if (t) npcMarker(n, t);
    }
  drawPlayers();
}
function playerHudCard(p, i, compact = false) {
  const b = S.board,
    safeX = UI_FIT_ACTIVE ? 0 : (VIEW.visibleX || 0),
    safeY = UI_FIT_ACTIVE ? 0 : (VIEW.visibleY || 0),
    x = compact ? safeX + 394 + i * 220 : safeX + 12,
    y = safeY + 12,
    w = compact ? 216 : 370,
    h = compact ? 92 : 126,
    current = p.id === cp().id;
  stretch(IM["playerSeatP" + p.id], x, y, w, h, current ? 1 : 0.82);
  portrait(
    IM["portrait" + p.char],
    x + 7,
    y + (compact ? 8 : 10),
    compact ? 74 : 100,
    compact ? 74 : 100,
    p.bankrupt ? 0.45 : 1,
  );
  fitTxt(
    `${p.id + 1}P ${CHAR_NAMES[p.char]}`,
    x + (compact ? 88 : 116),
    y + (compact ? 25 : 25),
    compact ? 120 : 238,
    compact ? 20 : 24,
    "left",
    current ? "#ffe894" : "#fff",
    1000,
    true,
    13,
  );
  fitTxt(
    `現金 $${Math.max(0, p.cash).toLocaleString()}`,
    x + (compact ? 88 : 116),
    y + (compact ? 61 : 59),
    compact ? 120 : 238,
    compact ? 18 : 21,
    "left",
    "#fff5d3",
    900,
    true,
    11,
  );
  const owned = b.tiles.filter((t) => t.owner === p.id),
    land = owned.length,
    buildings = owned.reduce((sum, t) => sum + (t.level || 0), 0);
  if (!compact) {
    fitTxt(`資產 $${netWorth(p).toLocaleString()}`, x + 116, y + 88, 232, 18, "left", "#d9efff", 850, true, 12);
    fitTxt(`土地 ${land}　建築 ${buildings}　裝備 ${(p.equipment || []).length}`, x + 116, y + 112, 232, 16, "left", "#d7e6f4", 800, true, 11);
  }
  const effect = (p.effects || [])[0];
  if (effect) {
    contain(npcImage(effect.kind), x + w - 38, y + h - 38, 30, 30, 0.98);
    txt(
      String(effect.turns),
      x + w - 13,
      y + h - 12,
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
    total = results.reduce((sum, value) => sum + value, 0),
    resolution = q.resolution;
  X.save();
  const shade = Math.sin(Math.min(1, u * 1.5) * Math.PI) * 0.22;
  X.fillStyle = `rgba(3,7,22,${shade})`;
  X.fillRect(0, 0, W, H);
  X.restore();
  const acting = cp();
  if (acting) {
    const poseAlpha = Math.min(1, u * 3) * (u < 0.82 ? 1 : Math.max(0, (1 - u) / 0.18));
    contain(IM[CHAR_KEYS[acting.char] + "Dice"], 90, 300, 360, 430, poseAlpha);
  }
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
      resolution && resolution.finalSteps !== resolution.rolledTotal
        ? `${results.join("＋")}＝${total} 點 → 前進 ${resolution.finalSteps} 步`
        : results.length > 1
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
    x = (UI_FIT_ACTIVE ? 0 : (VIEW.visibleX || 0)) + 20,
    w = 260,
    h = 160,
    y = (UI_FIT_ACTIVE ? 0 : (VIEW.visibleY || 0)) + (UI_FIT_ACTIVE ? H : (VIEW.visibleH || H)) - h - 22;
  panelPlate(x - 10, y - 34, w + 20, h + 46, 0.92);
  fitTxt("路線小地圖", x + w / 2, y - 13, w - 20, 17, "center", "#fff0a5", 1000, true, 12);
  X.save();
  X.beginPath();
  X.roundRect(x, y, w, h, 12);
  X.clip();
  cover(IM["mapPreview" + (b.mapIndex || 0)], x, y, w, h, 0.95);
  X.restore();
  const rx = x + (b.cam.x / (MW - W)) * (w - 62),
    ry = y + (b.cam.y / (MH - H)) * (h - 47);
  X.save();
  X.strokeStyle = "#fff073";
  X.lineWidth = 3;
  X.strokeRect(rx, ry, 62, 47);
  X.restore();
}
function hud() {
  const b = S.board,
    p = cp(),
    safeX = UI_FIT_ACTIVE ? 0 : (VIEW.visibleX || 0),
    safeY = UI_FIT_ACTIVE ? 0 : (VIEW.visibleY || 0),
    safeW = UI_FIT_ACTIVE ? W : (VIEW.visibleW || W),
    safeH = UI_FIT_ACTIVE ? H : (VIEW.visibleH || H),
    right = safeX + safeW,
    bottom = safeY + safeH,
    infoX = right - 382,
    infoCX = infoX + 181;
  playerHudCard(p, 0, false);
  b.players.filter((player) => player.id !== p.id).forEach((player, i) => playerHudCard(player, i, true));
  panelPlate(infoX, safeY + 12, 370, 190, 0.97);
  miniMapHud();
  fitTxt(
    `${b.mapRules?.name || "童話王國"}　　第 ${b.round}/${S.rounds} 回合`,
    infoCX,
    safeY + 42,
    280,
    24,
    "center",
    "#fff4c9",
    1000,
    true,
    12,
  );
  fitTxt(
    `現在行動：${p.id + 1}P ${CHAR_NAMES[p.char]}`,
    infoCX,
    safeY + 80,
    326,
    23,
    "center",
    PLAYER_COLORS[p.id],
    1000,
    true,
    12,
  );
  fitTxt(
    `現金 $${p.cash.toLocaleString()}　持有土地 ${ownedLands(p).length}`,
    infoCX,
    safeY + 116,
    326,
    20,
    "center",
    "#e2f1ff",
    850,
    true,
    12,
  );
  fitTxt(
    `總資產 $${netWorth(p).toLocaleString()}　物價指數 ×${marketIndex().toFixed(1)}`,
    infoCX,
    safeY + 150,
    326,
    20,
    "center",
    "#ffe58e",
    900,
    true,
    12,
  );
  const statusText = [
    ...(p.effects || []).map((e) => `${e.kind} ${e.turns}`),
    hasEquipment(p, "guardian") && (p.guardianReadyAt || 0) > b.round ? `守護徽章 ${p.guardianReadyAt - b.round}回合` : "",
    hasEquipment(p, "compass") && (p.compassReadyAt || 0) > b.round ? `星辰羅盤 ${p.compassReadyAt - b.round}回合` : "",
  ].filter(Boolean).join("｜") || "狀態正常";
  fitTxt(statusText, infoCX, safeY + 179, 326, 17, "center", "#fff0a5", 900, true, 12);
  const gearX = right - 96, gearY = safeY + 216, gearEnabled = !S.rolling && !b.popup;
  panelPlate(gearX, gearY, 80, 76, gearEnabled ? 1 : 0.48);
  X.save();
  X.translate(gearX + 40, gearY + 38);
  X.rotate(Math.sin(performance.now() / 1050) * 0.035 + (UI_BUTTON.hover === "pause" ? 0.09 : 0));
  X.shadowColor = UI_BUTTON.hover === "pause" ? "rgba(103,211,255,.95)" : "rgba(255,214,96,.45)";
  X.shadowBlur = UI_BUTTON.hover === "pause" ? 22 : 10;
  contain(IM.settingsIcon, -32, -32, 64, 64, gearEnabled ? 1 : 0.48);
  X.restore();
  S.buttons.push({ id: "pause", x: gearX, y: gearY, w: 80, h: 76, en: gearEnabled });
  (p.equipment || []).slice(0, 2).forEach((id, i) => {
    contain(IM["equip_" + id], safeX + 26 + i * 80, safeY + 145, 68, 68, 1);
    const def = equipmentDef(id);
    artLabel(def?.name || "裝備", safeX + 18 + i * 80, safeY + 207, 84, 34, 11, "#fff0ad", 0.96);
  });
  const canRoll = !S.rolling && !b.popup && !b.winner && b.phase === "pre-roll" && p.type === "human";
  if (canRoll) {
    diceIconButton("roll", right - 166, bottom - 174, 150, true);
    artLabel("點擊骰子投擲", right - 201, bottom - 51, 220, 48, 20, "#fff4b0");
  }
  if (S.msg && S.msg !== S.toastText) { S.toastText = S.msg; S.toastAt = performance.now(); }
  if (S.toastText && !b.popup && !S.diceAnim) {
    const age = performance.now() - (S.toastAt || 0), alpha = age < 2600 ? 1 : Math.max(0, 1 - (age - 2600) / 1300);
    if (alpha > 0) {
      X.save(); X.globalAlpha = alpha;
      panelPlate(safeX + safeW / 2 - 370, bottom - 88, 740, 72, 0.94);
      fitTxt(S.toastText, safeX + safeW / 2, bottom - 52, 690, 24, "center", "#fff6d2", 900, true, 16);
      X.restore();
    } else if (S.msg === S.toastText) S.msg = "";
  }
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
    stretch(IM.abilityPanel, 380, 45, 840, 820, 0.99);
    contain(IM[CHAR_KEYS[p.char] + "Surprise"], 80, 390, 300, 380, 1);
    X.save();
    X.beginPath();
    X.roundRect(490, 176, 620, 286, 22);
    X.clip();
    cover((q.art && IM["event_" + q.art]) || IM["eventScene" + (b.mapIndex || 0)], 490, 176, 620, 286, 1);
    X.fillStyle = "rgba(5,10,30,.2)";
    X.fillRect(490, 176, 620, 286);
    X.restore();
    fitTxt(q.name, 800, 142, 620, 31, "center", "#fff0a5", 1000, true, 21);
    paragraph(q.desc, 800, 540, 620, 20, 29, 4, "center", "#fff", 900, true);
    if (q.detainedTurn && Number.isInteger(q.releaseIndex) && q.releaseIndex >= 0) {
      const cardName = q.facility === "jail" ? "使用保釋卡" : "使用醫院通行證";
      btn("releaseDetained", cardName, 470, 650, 310, 72, true);
      btn("eventOk", "繼續停留", 820, 650, 310, 72, false);
    } else btn("eventOk", "確認事件結果", 590, 680, 420, 72, true);
    return true;
  }
  if (q.kind === "npc") {
    stretch(IM.abilityPanel, 725, 92, 610, 720, 0.99);
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
    stretch(IM.abilityPanel, 345, 70, 910, 790, 0.99);
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
      const pos = b.mini?.pos || 0,
        target = b.mini?.target ?? 0.5,
        targetX = 520 + target * 540;
      X.fillStyle = "rgba(12,30,70,.82)";
      X.fillRect(520, 560, 560, 34);
      X.fillStyle = "rgba(105,255,205,.45)";
      X.fillRect(targetX - 38, 551, 76, 52);
      X.fillStyle = "#ffe067";
      X.fillRect(520 + pos * 540, 551, 20, 52);
      X.strokeStyle = "#fff4bb";
      X.lineWidth = 5;
      X.strokeRect(targetX - 38, 548, 76, 58);
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
      const pos = b.mini?.pos || 0,
        target = b.mini?.target ?? 0.5,
        bx = 535 + pos * 510,
        tx = 535 + target * 510;
      X.save();
      X.strokeStyle = "#fff2a7";
      X.lineWidth = 6;
      X.shadowColor = "#ffe26b";
      X.shadowBlur = 18;
      X.beginPath();
      X.arc(tx, 575, 46, 0, Math.PI * 2);
      X.stroke();
      X.restore();
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
      const revealing = performance.now() < (b.mini?.revealUntil || 0);
      txt(
        revealing ? "記住正在發光的寶箱" : "選出剛才藏有星光的寶箱",
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
          revealing && i === b.mini?.winningChest ? `★ 寶箱 ${i + 1} ★` : `寶箱 ${i + 1}`,
          475 + i * 225,
          650,
          200,
          70,
          i === 1,
          1,
          !revealing,
        );
    }
    return true;
  }
  if (q.kind === "miniResult") {
    const kind = q.kindIndex || 0,
      img = [IM.miniStar, IM.miniBalloon, IM.miniTreasure][kind];
    stretch(IM.abilityPanel, 400, 95, 800, 700, 0.99);
    contain(img, 545, 155, 510, 285, 1);
    txt("小遊戲結算", 800, 500, 38, "center", "#fff0a5", 1000, true);
    fitTxt(q.grade, 800, 555, 620, 24, "center", "#ffe477", 1000, true, 15);
    txt(`獎金 $${q.reward.toLocaleString()}　點券 +${q.tickets}`, 800, 615, 21, "center", "#fff", 900, true);
    btn("miniResultOk", "收下獎勵", 610, 675, 380, 72, true);
    return true;
  }
  if (q.kind === "tileInspect") {
    const t = q.tile,
      owner = t.owner >= 0 ? b.players.find((x) => x.id === t.owner) : null;
    stretch(IM.abilityPanel, 440, 105, 720, 690, 0.99);
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
    intro = Math.min(1, age / ANIMATION_MIN_MS),
    ease = 1 - Math.pow(1 - intro, 3),
    scale = 0.94 + ease * 0.06;
  X.save();
  X.setTransform(1, 0, 0, 1, 0, 0);
  X.fillStyle = `rgba(4,8,24,${0.72 * ease})`;
  X.fillRect(0, 0, C.width, C.height);
  X.restore();
  X.translate(W / 2, H / 2);
  X.scale(scale, scale);
  X.translate(-W / 2, -H / 2);
  X.globalAlpha *= ease;
  if (scenePopup(q, b, p)) return;
  stretch(IM.abilityPanel, 440, 115, 720, 670, 0.99);
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
  } else if (q.kind === "toolDice") {
    title = "遙控骰子";
    body = "選擇本回合要前進的點數";
    for (let i = 1; i <= 6; i++) actions.push(["toolDice" + i, i + " 點"]);
    actions.push(["closeTools", "返回道具箱"]);
  } else if (q.kind === "cardTarget") {
    title = cardDef(q.card).name;
    body = "選擇要施放卡片的對手";
    living()
      .filter((x) => x.id !== p.id && (q.card !== "snatch" || x.cards.length > 0))
      .forEach((x) =>
        actions.push([
          "cardTarget" + x.id,
          `${x.id + 1}P ${CHAR_NAMES[x.char]}`,
        ]),
      );
    actions.push(["cardCancel", "返回卡冊"]);
  } else if (q.kind === "pause") {
    title = "遊戲設定";
    body = `${b.mapRules?.name || "童話王國"}｜第 ${b.round} 回合`;
    actions = [
      ["resume", "繼續遊戲"],
      ["openSaves", "儲存遊戲"],
      ["openLoads", "讀取遊戲"],
      ["roster", "角色與資產"],
      ["focusCurrent", "回到目前角色"],
      ["saveHome", "回到首頁"],
      ["surrender", "認輸投降"],
    ];
  } else if (q.kind === "saveManager" || q.kind === "loadManager") {
    const saving = q.kind === "saveManager";
    title = saving ? "儲存遊戲" : "讀取遊戲";
    body = saving ? "即時紀錄會自動更新；請選擇一個手動儲存槽。" : "選擇要返回的冒險紀錄。";
    actions.push([saving ? "noop" : "loadSlot0", `即時紀錄｜${saveSlotSummary(0)}`]);
    for (let i = 1; i <= 4; i++)
      actions.push([`${saving ? "save" : "load"}Slot${i}`, `紀錄 ${i}｜${saveSlotSummary(i)}`]);
    actions.push(["pause", "返回設定"]);
  } else if (q.kind === "saveConfirm") {
    title = `覆蓋紀錄 ${q.slot}`;
    body = `${saveSlotSummary(q.slot)}\n確定要以目前進度覆蓋這個紀錄嗎？`;
    actions = [[`confirmSave${q.slot}`, "確認覆蓋"], ["openSaves", "取消"]];
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
    "擲出立體骰子逐格前進；骰子點數與角色實際步數會逐步同步呈現。",
    "購買土地並升至 Lv5；最高階可建成該角色專屬地標，外框清楚標示地主顏色。",
    "拖曳棋盤自由查看世界；點擊格子可確認地價、地主、建築階級與預估租金。",
    "選角後可攜帶兩件不同類型常駐裝備；整場自動生效，不需在回合中整理物品。",
    "命運事件與巡遊神明會改變局勢；神明只在角色停留相同位置時觸發附身。",
    "真人與不同難度 AI 可自由配置 2～4 名；遊戲設定內可隨時查看所有在場角色資料。",
  ];
  lines.forEach((l, i) =>
    fitTxt(l, 800, 200 + i * 72, 1280, 22, "center", "#fff", 850, true, 15),
  );
  btn("home", "回到首頁", 630, 690, 340, 86, true);
}
function result() {
  const b = S.board,
    now = performance.now(),
    age = Math.max(0, now - (b.resultAnimStart || now - 2200)),
    intro = Math.min(1, age / ANIMATION_MIN_MS),
    humanVictory = b.winner?.type === "human";
  cover(humanVictory ? IM.resultVictory : IM.resultDefeat, 0, 0, W, H, intro);
  X.save();
  X.fillStyle = `rgba(2,7,22,${0.2 + intro * 0.34})`;
  X.fillRect(0, 0, W, H);
  X.restore();
  for (let i = 0; i < 24; i++) {
    const phase = (age / 1400 + i / 24) % 1,
      px = (i * 211 + Math.sin(i * 7.1) * 90 + 1600) % 1600,
      py = humanVictory ? 30 + phase * 760 : 80 + phase * 700,
      radius = 2 + (i % 4);
    X.save();
    X.globalAlpha = intro * (0.25 + 0.65 * Math.sin(phase * Math.PI));
    X.fillStyle = humanVictory ? "#ffe47a" : "#86a8ff";
    X.beginPath();
    X.arc(px, py, radius, 0, Math.PI * 2);
    X.fill();
    X.restore();
  }
  txt(humanVictory ? "冒險成功" : "冒險結束", 800, 58 - (1 - intro) * 55, 46, "center", humanVictory ? "#fff0a5" : "#d8e2ff", 1000, true);
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
  if (ranked.length <= 2 && ranked[0]) {
    contain(IM[CHAR_KEYS[ranked[0].char] + "Victory"], 625, 350, 350, 370, intro);
    fitTxt(
      `冠軍｜${ranked[0].id + 1}P ${CHAR_NAMES[ranked[0].char]}`,
      800,
      365,
      430,
      27,
      "center",
      "#ffe477",
      1000,
      true,
      18,
    );
  }
  ranked.forEach((p, i) => {
    const compact = ranked.length <= 2,
      y = compact ? 155 + i * 150 : 150 + i * 142,
      rowProgress = Math.min(1, Math.max(0, (age - 300 - i * 110) / ANIMATION_MIN_MS)),
      alpha = (p.bankrupt ? 0.58 : 0.98) * rowProgress,
      rowShift = (1 - rowProgress) * (i % 2 ? 260 : -260);
    X.save();
    X.translate(rowShift, 0);
    const rowX = compact ? (i === 0 ? 105 : 985) : 220,
      infoX = compact ? rowX : 770;
    stretch(IM["playerSeatP" + (p.id % 4)], rowX, y, compact ? 510 : 540, 126, alpha);
    if (!compact) stretch(IM.roleInfo, infoX, y, 610, 126, alpha);
    portrait(
      IM["portrait" + p.char],
      rowX + 18,
      y + 12,
      104,
      102,
      p.bankrupt ? 0.48 : 1,
    );
    txt(
      `${i + 1}`,
      rowX + 145,
      y + 62,
      34,
      "center",
      i === 0 ? "#ffe071" : "#fff",
      1000,
      true,
    );
    fitTxt(
      `${p.id + 1}P ${CHAR_NAMES[p.char]}`,
      rowX + 200,
      y + (compact ? 28 : 39),
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
      rowX + 200,
      y + (compact ? 104 : 80),
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
      compact ? rowX + 200 : 810,
      y + (compact ? 52 : 36),
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
      compact ? rowX + 200 : 810,
      y + (compact ? 76 : 78),
      15,
      "left",
      "#dbeaff",
      850,
      true,
    );
    fitTxt(
      `總資產 $${netWorth(p).toLocaleString()}`,
      compact ? rowX + 400 : 1135,
      y + (compact ? 104 : 58),
      compact ? 165 : 330,
      20,
      "center",
      i === 0 ? "#ffe071" : "#fff",
      1000,
      true,
      14,
    );
    X.restore();
  });
  if (age >= 1800) {
    btn("resultHome", "返回首頁", 420, 765, 330, 78, false);
    btn("rematch", "同設定再戰", 850, 765, 330, 78, true);
  }
}
let AUDIO_CTX = null,
  MUSIC_AUDIO = null,
  MUSIC_TIMER = 0,
  MUSIC_STEP = 0;
function audioGesture() {
  try {
    if (!AUDIO_CTX)
      AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)();
    if (AUDIO_CTX.state === "suspended") AUDIO_CTX.resume();
    if (!MUSIC_AUDIO) {
      MUSIC_AUDIO = new Audio(A + "audio/once_upon_a_time_loop_cc0.mp3");
      MUSIC_AUDIO.loop = true;
      MUSIC_AUDIO.preload = "auto";
    }
    musicTick();
    if (!MUSIC_TIMER) MUSIC_TIMER = setInterval(musicTick, 1000);
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
  if (!MUSIC_AUDIO || !S.settings) return;
  const enabled = !document.hidden && S.settings.master > 0 && S.settings.bgm > 0;
  MUSIC_AUDIO.volume = Math.min(1, 0.34 * (S.settings.master / 100) * (S.settings.bgm / 100));
  if (enabled) MUSIC_AUDIO.play().catch(() => {});
  else MUSIC_AUDIO.pause();
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
  const p = pointerToUi(e),
    b = hit(p.x, p.y);
  HOME.pressed = b?.en ? b.id : null;
});
C.addEventListener("pointermove", (e) => {
  if (S.scene !== "home" || HOME.locked) return;
  const p = pointerToUi(e),
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
  const p = pointerToUi(e),
    b = hit(p.x, p.y);
  UI_BUTTON.pressed = b?.en ? b.id : null;
});
C.addEventListener("pointermove", (e) => {
  const p = pointerToUi(e),
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
