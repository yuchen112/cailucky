"use strict";
const EVENTS = [
  ["王國節慶", "獲得 $6,000", (p) => cashGain(p, 6000), "kingdomFestival"],
  ["突發修繕", "支付 $3,500", (p) => (p.cash -= 3500), "emergencyRepairs"],
  ["精靈贈禮", "獲得一張卡片", (p) => drawCard(p), "fairyGift"],
  ["幸運噴泉", "獲得 $4,500", (p) => cashGain(p, 4500), "luckyFountain"],
  ["迷路", "下一回合暫停一次", (p) => (p.skip += 1), "lostInMaze"],
  ["市場熱潮", "獲得 $5,000", (p) => cashGain(p, 5000), "marketBoom"],
  ["惡作劇", "損失 $2,000", (p) => (p.cash -= 2000), "mischief"],
  ["旅人委託", "獲得 2 點券", (p) => (p.tickets += 2), "travelerQuest"],
  ["守護祝福", "得到一次護盾", (p) => (p.shield += 1), "guardianBlessing"],
  ["稅務日", "支付資產稅 $4,000", (p) => (p.cash -= 4000), "taxDay"],
  ["星光雨", "獲得 $7,000", (p) => cashGain(p, 7000), "starlightRain"],
  [
    "交換市集",
    "免費抽兩張卡",
    (p) => {
      drawCard(p);
      drawCard(p);
    },
    "exchangeMarket",
  ],
  ["道路施工", "下一回合骰子最多 3 點", (p) => (p.slow = 1), "roadConstruction"],
  ["王國補助", "獲得 $3,000", (p) => cashGain(p, 3000), "kingdomSubsidy"],
  ["失物招領", "獲得 $2,500", (p) => cashGain(p, 2500), "lostAndFound"],
  [
    "魔法失控",
    "隨機損失一張卡",
    (p) => {
      if (p.cards.length)
        p.cards.splice(Math.floor(Math.random() * p.cards.length), 1);
    },
    "lostCard",
    "magicMalfunction",
  ],
  ["月光紅利", "獲得 $5,500", (p) => cashGain(p, 5500), "moonlightDividend"],
  [
    "森林迷霧",
    "後退 2 格",
    (p) => (p.pos = (p.pos - 2 + S.board.tiles.length) % S.board.tiles.length),
    "forestMist",
  ],
  [
    "雲端順風",
    "前進 2 格",
    (p) => (p.pos = (p.pos + 2) % S.board.tiles.length),
    "cloudTailwind",
  ],
  ["商會回饋", "獲得 $4,000", (p) => cashGain(p, 4000), "merchantGuildReward"],
  [
    "卡片遺失",
    "隨機失去一張卡",
    (p) => {
      if (p.cards.length)
        p.cards.splice(Math.floor(Math.random() * p.cards.length), 1);
    },
  ],
  [
    "幸運日",
    "獲得護盾與 1 點券",
    (p) => {
      p.shield++;
      p.tickets++;
    },
    "luckyDay",
  ],
  ["土地維護", "支付 $2,500", (p) => (p.cash -= 2500), "landMaintenance"],
  ["精靈加護", "免費升級一塊自己的土地", (p) => upgradeRandomLand(p), "fairyBlessing"],
  ["意外受傷", "送往童話醫院休養 2 回合", (p) => admitPlayer(p, "hospital", 2, "意外受傷，住院 2 回合。")],
  ["王國稽查", "送往童話警察局拘留 2 回合", (p) => admitPlayer(p, "jail", 2, "接受王國調查，拘留 2 回合。")],
  ["康復祝福", "立即解除住院狀態", (p) => { if (p.detained?.facility === "hospital") { p.detained = null; p.skip = 0; } }],
  ["無罪證明", "立即解除拘留狀態", (p) => { if (p.detained?.facility === "jail") { p.detained = null; p.skip = 0; } }],
];
const CARD_DEFS = [
  {
    id: "precision",
    name: "精準骰子",
    cost: 20,
    cover: "precision_dice",
    desc: "指定本回合骰子點數",
    timing: "turn",
  },
  {
    id: "remote",
    name: "遙控骰子",
    cost: 25,
    cover: "remote_dice",
    desc: "自由選擇 1～6 點",
    timing: "turn",
  },
  {
    id: "shield",
    name: "護身符",
    cost: 30,
    cover: "shield",
    desc: "抵銷一次租金或負面效果",
    timing: "turn",
  },
  {
    id: "speed",
    name: "星光機車",
    cost: 35,
    cover: "speed",
    desc: "裝備後 5 回合使用兩顆骰子",
    timing: "turn",
    kind: "tool",
  },
  {
    id: "roadblock",
    name: "路障卡",
    cost: 15,
    cover: "roadblock",
    desc: "在指定道路設置路障",
    timing: "target",
    kind: "tool",
  },
  {
    id: "teleport",
    name: "傳送卡",
    cost: 40,
    cover: "teleport",
    desc: "移動到指定地點",
    timing: "target",
  },
  {
    id: "buyland",
    name: "購地卡",
    cost: 45,
    cover: "land_purchase",
    desc: "強制購買腳下無主土地",
    timing: "arrival",
  },
  {
    id: "upgrade",
    name: "免費升級卡",
    cost: 50,
    cover: "free_upgrade",
    desc: "免費升級一棟自己的房屋",
    timing: "turn",
  },
  {
    id: "discount",
    name: "地產折價券",
    cost: 20,
    cover: "discount",
    desc: "下次購地價格七五折",
    timing: "turn",
  },
  {
    id: "rent",
    name: "租金加倍卡",
    cost: 35,
    cover: "rent",
    desc: "下一次收取租金提高",
    timing: "turn",
  },
  {
    id: "swap",
    name: "交換卡",
    cost: 45,
    cover: "swap",
    desc: "與指定玩家交換位置",
    timing: "target",
  },
  {
    id: "stop",
    name: "停留卡",
    cost: 25,
    cover: "stop",
    desc: "指定玩家暫停一回合",
    timing: "target",
  },
  {
    id: "car",
    name: "星願汽車",
    cost: 55,
    cover: "car",
    desc: "裝備後 5 回合使用三顆骰子",
    timing: "turn",
    kind: "tool",
  },
  {
    id: "hospitalpass",
    name: "醫院通行證",
    cost: 30,
    cover: "hospital_pass",
    desc: "解除住院，或抵銷下一次住院",
    timing: "turn",
  },
  {
    id: "bail",
    name: "保釋卡",
    cost: 35,
    cover: "bail",
    desc: "解除拘留，或抵銷下一次拘留",
    timing: "turn",
  },
  {
    id: "bomb",
    name: "定時炸彈",
    cost: 40,
    cover: "bomb",
    desc: "裝到指定對手身上，移動 12 步後爆炸並住院",
    timing: "target",
    kind: "tool",
  },
];
const CARD_POOL = CARD_DEFS.filter((c) => c.kind !== "tool").map((c) => c.id);
const TOOL_POOL = CARD_DEFS.filter((c) => c.kind === "tool").map((c) => c.id);
const LEGACY_CARD_MAP = {
  精準骰子: "precision",
  遙控骰子: "remote",
  護身符: "shield",
  加速靴: "speed",
  財富卡: "discount",
  地產折價券: "discount",
  幸運符: "shield",
  免費升級卡: "upgrade",
  租金加倍卡: "rent",
  交換卡: "swap",
  瞬移卡: "teleport",
  停留卡: "stop",
};
// Branch-capable movement remains in the engine, but these three oval-road maps
// deliberately contain no invisible shortcuts. A map may opt in only when its
// authored background includes the matching fork geometry.
const MAP_BRANCHES = {};
function cardDef(v) {
  const normalized = LEGACY_CARD_MAP[v] || v;
  return (
    CARD_DEFS.find((c) => c.id === normalized || c.name === normalized) ||
    CARD_DEFS[0]
  );
}
function toolDef(v) {
  const d = cardDef(v);
  return d.kind === "tool" ? d : CARD_DEFS.find((item) => item.kind === "tool");
}
const baseScenePopup = scenePopup;
scenePopup = function (q, b, p) {
  if (q.kind === "branch") {
    contain(IM.abilityPanel, 400, 115, 800, 650, 0.99);
    txt("前方道路分岔", 800, 205, 40, "center", "#fff0a5", 1000, true);
    paragraph("選擇本回合要前進的道路；剩餘點數會沿選定方向繼續移動。", 800, 290, 610, 20, 30, 2, "center", "#fff", 900, true);
    q.choices.forEach((dest, i) => {
      const tile = b.tiles[dest];
      btn("branchChoice" + i, `${i ? "捷徑" : "大道"}｜前往第 ${dest + 1} 格・${typeName(tile.type)}`, 525, 385 + i * 105, 550, 78, i === 1);
    });
    return true;
  }
  if (q.kind === "cardTileTarget") {
    contain(IM.abilityPanel, 360, 85, 880, 730, 0.99);
    const d = cardDef(p.cards[q.cardIndex]);
    txt(d.name, 800, 165, 38, "center", "#fff0a5", 1000, true);
    paragraph(d.desc + "｜選擇目標格。", 800, 230, 610, 19, 29, 2, "center", "#fff", 900, true);
    q.targets.slice(0, 8).forEach((index, i) => {
      const t = b.tiles[index];
      btn("cardTile" + index, `第 ${index + 1} 格｜${t.type === "land" ? regionName(t.region) : typeName(t.type)}`, 455 + (i % 2) * 360, 315 + Math.floor(i / 2) * 78, 330, 62, i === 0);
    });
    btn("cardCancel", "返回卡片冊", 650, 680, 300, 64, false);
    return true;
  }
  if (q.kind === "tile" && q.tile?.type === "land") {
    const t = q.tile,
      owner = t.owner >= 0 ? b.players.find((x) => x.id === t.owner) : null,
      mine = t.owner === p.id,
      buy = buyCost(p, t),
      cost = upgradeCost(t),
      art = buildingImage(t) || IM.tile_land;
    contain(IM.abilityPanel, 250, 70, 1100, 760, 0.99);
    fitTxt(
      `${regionName(t.region)}｜${owner ? `Lv${t.level} 地產` : "待售土地"}`,
      800,
      140,
      900,
      38,
      "center",
      "#fff0a5",
      1000,
      true,
      22,
    );
    contain(art, 300, 205, 430, 430, 1);
    if (owner) {
      stretch(IM["playerSeatP" + owner.id], 325, 615, 380, 76, 0.98);
      contain(IM["portrait" + owner.char], 337, 620, 66, 66, 1);
      fitTxt(
        `${owner.id + 1}P ${CHAR_NAMES[owner.char]}｜地主`,
        540,
        650,
        250,
        20,
        "center",
        PLAYER_COLORS[owner.id],
        1000,
        true,
        13,
      );
    } else txt("尚未有地主", 515, 655, 24, "center", "#dceaff", 900, true);
    const specialName =
      t.special === "hotel"
        ? "星光旅館"
        : t.special === "mall"
          ? "童話商場"
          : t.special === "park"
            ? "祝福公園"
            : "";
    const lines = owner
      ? [
          `土地價值　$${t.price.toLocaleString()}`,
          `建築狀態　${specialName || `Lv${t.level} ${t.level ? "建築" : "空地"}`}`,
          `目前租金　$${rentEstimate(t, p).toLocaleString()}`,
          mine && t.level < 5 ? `下階費用　$${cost.toLocaleString()}` : mine ? "已達最高建築階級" : "抵達後必須支付租金",
        ]
      : [
          `售價　　　$${buy.toLocaleString()}`,
          `基礎租金　$${baseRent(t).toLocaleString()}`,
          "購買後可逐級興建",
          "Lv5 可改建旅館／商場／公園",
        ];
    lines.forEach((line, i) =>
      fitTxt(line, 1010, 275 + i * 62, 475, 23, "center", i === 2 ? "#ffe477" : "#fff", 900, true, 15),
    );
    if (!owner) {
      btn("buy", `購買土地　$${buy.toLocaleString()}`, 795, 555, 430, 72, true);
      btn("skip", "暫時略過", 795, 650, 430, 68, false);
    } else if (mine) {
      if (t.level < 5)
        btn("upgrade", t.level === 4 ? "選擇大型建築" : `升級至 Lv${t.level + 1}`, 795, 555, 430, 72, true);
      btn("skip", "完成回合", 795, t.level < 5 ? 650 : 600, 430, 68, false);
    } else btn("pay", p.shield > 0 ? "使用護盾／結算" : `支付租金　$${rentEstimate(t, p).toLocaleString()}`, 795, 600, 430, 74, true);
    return true;
  }
  if (q.kind === "shop") {
    const tab = q.tab || "cards",
      stock = tab === "tools" ? b.toolStock || [] : b.shopStock || [];
    contain(IM.abilityPanel, 230, 55, 1140, 800, 0.99);
    txt("童話百貨公司", 800, 112, 38, "center", "#fff0a5", 1000, true);
    txt(
      `點券 ${p.tickets}｜卡片 ${p.cards.length}/15｜道具 ${(p.tools || []).length}/8`,
      800,
      154,
      18,
      "center",
      "#fff",
      900,
      true,
    );
    btn("shopTabCards", "卡片", 500, 195, 285, 54, tab === "cards");
    btn("shopTabTools", "道具", 815, 195, 285, 54, tab === "tools");
    stock
      .slice(0, 6)
      .forEach((c, i) => {
        const renderer = tab === "tools" ? richTool : richCard;
        renderer(c, 350 + (i % 3) * 305, 260 + Math.floor(i / 3) * 210, 220, 190, "shopItem" + i);
      });
    btn("shopSell", tab === "tools" ? "出售道具" : "出售卡片", 470, 710, 300, 72, false);
    btn("skip", "離開百貨公司", 830, 710, 300, 72, true);
    return true;
  }
  if (q.kind === "specialBuild") {
    const t = q.tile,
      cost = upgradeCost(t);
    contain(IM.abilityPanel, 360, 90, 880, 720, 0.99);
    txt("選擇大型建築", 800, 170, 38, "center", "#fff0a5", 1000, true);
    paragraph(
      `Lv5 改建費 $${cost.toLocaleString()}；每種設施具有獨立的收租與抵達效果。`,
      800,
      245,
      620,
      19,
      29,
      2,
      "center",
      "#fff",
      900,
      true,
    );
    btn("buildHotel", "星光旅館｜高租金＋房客停留", 480, 345, 640, 72, true);
    btn("buildMall", "童話商場｜租金＋地主點券", 480, 440, 640, 72, false);
    btn("buildPark", "祝福公園｜低租金＋地主收入", 480, 535, 640, 72, false);
    btn("buildCancel", "暫不改建", 610, 650, 380, 68, false);
    return true;
  }
  if (q.kind === "shopSell") {
    const tools = q.tab === "tools",
      inventory = tools ? p.tools || [] : p.cards;
    contain(IM.abilityPanel, 170, 55, 1260, 800, 0.99);
    txt(tools ? "出售道具" : "出售卡片", 800, 105, 38, "center", "#fff0a5", 1000, true);
    txt(
      `點選${tools ? "道具" : "卡片"}出售，可取回售價一半的點券`,
      800,
      145,
      17,
      "center",
      "#fff",
      900,
      true,
    );
    inventory
      .slice(0, 10)
      .forEach((c, i) => {
        const renderer = tools ? richTool : richCard;
        renderer(c, 245 + (i % 5) * 225, 175 + Math.floor(i / 5) * 270, 170, 245, (tools ? "sellTool" : "sellCard") + i);
      });
    btn("shopSellBack", "返回商品架", 650, 760, 300, 65, true);
    return true;
  }
  if (q.kind === "bank") {
    contain(IM.abilityPanel, 420, 100, 760, 700, 0.99);
    txt("童話銀行", 800, 190, 40, "center", "#fff0a5", 1000, true);
    txt(
      `現金 $${p.cash.toLocaleString()}`,
      800,
      300,
      24,
      "center",
      "#fff",
      900,
      true,
    );
    txt(
      `存款 $${(p.bank || 0).toLocaleString()}`,
      800,
      350,
      24,
      "center",
      "#d9efff",
      900,
      true,
    );
    btn("bankDeposit", "存入 $10,000", 545, 445, 240, 70, false);
    btn("bankWithdraw", "提領 $10,000", 815, 445, 240, 70, false);
    btn("skip", "離開銀行", 625, 560, 350, 72, true);
    return true;
  }
  if (q.kind === "cards") {
    contain(IM.abilityPanel, 170, 55, 1260, 800, 0.99);
    txt("卡片冊", 800, 105, 38, "center", "#fff0a5", 1000, true);
    txt(
      `卡片 ${p.cards.length}/15｜點選卡片使用`,
      800,
      145,
      17,
      "center",
      "#fff",
      900,
      true,
    );
    if (q.error) fitTxt(q.error, 800, 171, 920, 15, "center", "#ffcf8a", 1000, true, 11);
    const page = Math.max(0, Math.min(q.page || 0, Math.ceil(p.cards.length / 8) - 1)), start = page * 8;
    txt(`第 ${page + 1}/${Math.max(1, Math.ceil(p.cards.length / 8))} 頁`, 1280, 145, 16, "center", "#d9efff", 900, true);
    p.cards
      .slice(start, start + 8)
      .forEach((c, i) =>
        richCard(
          c,
          270 + (i % 4) * 270,
          180 + Math.floor(i / 4) * 270,
          180,
          235,
          "useCard" + (start + i),
        ),
      );
    if (page > 0) btn("cardsPrev", "上一頁", 400, 760, 210, 62, false);
    if (start + 8 < p.cards.length) btn("cardsNext", "下一頁", 990, 760, 210, 62, false);
    btn("closeCards", "返回棋盤", 650, 760, 300, 65, true);
    return true;
  }
  if (q.kind === "tools") {
    contain(IM.abilityPanel, 170, 55, 1260, 800, 0.99);
    txt("道具箱", 800, 105, 38, "center", "#fff0a5", 1000, true);
    txt(`道具 ${(p.tools || []).length}/8｜車輛、路障與定時炸彈`, 800, 145, 17, "center", "#fff", 900, true);
    (p.tools || []).slice(0, 8).forEach((c, i) =>
      richTool(c, 270 + (i % 4) * 270, 185 + Math.floor(i / 4) * 270, 200, 240, "useTool" + i),
    );
    btn("closeTools", "返回棋盤", 650, 760, 300, 65, true);
    return true;
  }
  if (q.kind === "toolTarget") {
    contain(IM.abilityPanel, 400, 110, 800, 680, 0.99);
    txt(toolDef(p.tools[q.toolIndex]).name, 800, 185, 38, "center", "#fff0a5", 1000, true);
    living().filter((x) => x.id !== p.id).forEach((x, i) =>
      btn("toolTarget" + x.id, `${x.id + 1}P ${CHAR_NAMES[x.char]}`, 500, 285 + i * 90, 600, 68, i === 0),
    );
    btn("closeTools", "取消", 650, 675, 300, 62, false);
    return true;
  }
  if (q.kind === "toolTileTarget") {
    contain(IM.abilityPanel, 360, 85, 880, 730, 0.99);
    txt("設置路障", 800, 165, 38, "center", "#fff0a5", 1000, true);
    q.targets.forEach((index, i) =>
      btn("toolTile" + index, `道路第 ${index + 1} 格`, 455 + (i % 2) * 360, 270 + Math.floor(i / 2) * 86, 330, 66, i === 0),
    );
    btn("closeTools", "取消", 650, 680, 300, 62, false);
    return true;
  }
  if (q.kind === "carddraw") {
    const d = cardDef(q.card);
    contain(IM.abilityPanel, 460, 70, 680, 760, 0.99);
    richCard(q.card, 620, 155, 360, 500);
    fitTxt(d.desc, 800, 690, 520, 19, "center", "#fff", 900, true, 13);
    btn("cardOk", "收入卡冊", 625, 750, 350, 65, true);
    return true;
  }
  if (q.kind === "playerDetail") {
    const x = q.player,
      lands = b.tiles.filter((t) => t.owner === x.id),
      buildings = lands.reduce((n, t) => n + t.level, 0),
      effect =
        (x.effects || []).map((e) => `${e.kind} ${e.turns}回合`).join("、") ||
        "無";
    const tab = q.tab || "overview";
    contain(IM.abilityPanel, 190, 45, 1220, 820, 0.99);
    contain(IM["portrait" + x.char], 245, 120, 220, 220);
    fitTxt(
      `${x.id + 1}P ${CHAR_NAMES[x.char]}`,
      500,
      120,
      360,
      36,
      "left",
      "#fff0a5",
      1000,
      true,
      22,
    );
    txt(
      `${x.type === "human" ? "真人玩家" : "電腦 AI"}｜${CHAR_ROLES[x.char]}`,
      500,
      165,
      19,
      "left",
      "#d9efff",
      900,
      true,
    );
    btn("playerTabOverview", "總覽", 430, 205, 150, 54, tab === "overview");
    btn("playerTabLands", "地產", 590, 205, 150, 54, tab === "lands");
    btn("playerTabCards", "卡片", 750, 205, 150, 54, tab === "cards");
    btn("playerTabTools", "道具", 910, 205, 150, 54, tab === "tools");
    btn("playerTabEffects", "狀態", 1070, 205, 150, 54, tab === "effects");
    const rows = [
      `現金　$${x.cash.toLocaleString()}`,
      `銀行存款　$${(x.bank || 0).toLocaleString()}`,
      `總資產　$${netWorth(x).toLocaleString()}`,
      `點券　${x.tickets}`,
      `土地　${lands.length}　｜建築層數　${buildings}`,
      `卡片　${x.cards.length}/15`,
      `道具　${(x.tools || []).length}/8`,
      `交通工具　${x.vehicle === "car" ? "星願汽車（三顆骰子）" : x.vehicle === "motorcycle" ? "星光機車（兩顆骰子）" : "步行（一顆骰子）"}`,
      `狀態／神明　${effect}`,
    ];
    if (tab === "overview")
      rows.forEach((s, i) =>
        fitTxt(
          s,
          515,
          310 + i * 52,
          760,
          20,
          "left",
          i === 2 ? "#ffe17b" : "#fff",
          900,
          true,
          13,
        ),
      );
    if (tab === "lands") {
      txt(
        "點選地產可將鏡頭移至該格",
        800,
        292,
        16,
        "center",
        "#d9efff",
        850,
        true,
      );
      lands
        .slice(0, 10)
        .forEach((t, i) =>
          btn(
            "propertyJump" + t.index,
            `${regionName(t.region)} ${t.index + 1}｜Lv${t.level}｜租 $${rentEstimate(t).toLocaleString()}`,
            360 + (i % 2) * 445,
            325 + Math.floor(i / 2) * 72,
            420,
            60,
            false,
          ),
        );
      if (!lands.length)
        txt("目前尚未持有地產", 800, 440, 22, "center", "#fff", 900, true);
    }
    if (tab === "cards") {
      x.cards
        .slice(0, 10)
        .forEach((c, i) =>
          richCard(
            c,
            300 + (i % 5) * 205,
            300 + Math.floor(i / 5) * 245,
            155,
            220,
          ),
        );
      if (!x.cards.length)
        txt("目前沒有卡片", 800, 440, 22, "center", "#fff", 900, true);
    }
    if (tab === "tools") {
      (x.tools || []).slice(0, 8).forEach((c, i) =>
        richTool(c, 300 + (i % 4) * 245, 300 + Math.floor(i / 4) * 245, 180, 220),
      );
      if (!(x.tools || []).length)
        txt("目前沒有道具", 800, 440, 22, "center", "#fff", 900, true);
    }
    if (tab === "effects") {
      const statuses = [
        ...(x.effects || []).map((e) => `${e.kind}｜剩餘 ${e.turns} 回合`),
        x.shield ? `護盾｜可抵銷 ${x.shield} 次` : "",
        x.skip ? `暫停｜剩餘 ${x.skip} 回合` : "",
        x.vehicleTurns ? `機車｜剩餘 ${x.vehicleTurns} 回合` : "",
      ].filter(Boolean);
      statuses.forEach((s, i) =>
        btn("noopStatus" + i, s, 470, 315 + i * 72, 660, 60, false),
      );
      if (!statuses.length)
        txt(
          "目前沒有附身神明或特殊狀態",
          800,
          440,
          22,
          "center",
          "#fff",
          900,
          true,
        );
    }
    btn("closeCards", "返回棋盤", 670, 770, 260, 62, true);
    return true;
  }
  return baseScenePopup(q, b, p);
};
const NPC_DEFS = [
  { name: "財神", desc: "獲得 $8,000", apply: (p) => cashGain(p, 8000) },
  { name: "窮神", desc: "損失 $5,000，租金負擔提高", apply: (p) => (p.cash -= 5000) },
  {
    name: "福神",
    desc: "獲得 2 張卡片",
    apply: (p) => {
      drawCard(p);
      drawCard(p);
    },
  },
  { name: "衰神", desc: "下一回合骰子最多 3 點", apply: (p) => (p.slow = 1) },
  {
    name: "土地公",
    desc: "停留土地時可強制占有",
    apply: () => {},
  },
  {
    name: "天使",
    desc: "停留建築時加蓋一層，持續 7 回合",
    apply: (p) => attachEffect(p, "天使", 7),
  },
  {
    name: "惡魔",
    desc: "停留建築時拆除一層，持續 7 回合",
    apply: (p) => attachEffect(p, "惡魔", 7),
  },
  {
    name: "死神",
    desc: "失去所有卡片並跟隨 13 回合",
    apply: (p) => {
      p.cards = [];
      p.tools = [];
      attachEffect(p, "死神", 13);
    },
  },
  { name: "乞丐", desc: "施捨 $1,000", apply: (p) => (p.cash -= 1000) },
  { name: "惡犬", desc: "休息 3 回合", apply: (p) => (p.skip += 3) },
];
const GOD_TRANSFORMS = {
  天使: "惡魔", 惡魔: "天使", 土地公: "惡犬",
  財神: "窮神", 窮神: "財神", 福神: "衰神", 衰神: "福神",
};
function makeOvalRoute(cx = 1600, cy = 900, rx = 1180, ry = 620) {
  return Array.from({ length: 36 }, (_, i) => {
    const angle = Math.PI / 2 + (i * Math.PI * 2) / 36;
    return [
      Math.round(cx + Math.cos(angle) * rx),
      Math.round(cy + Math.sin(angle) * ry),
    ];
  });
}
const MAP_ROUTES = Object.fromEntries(
  MAPS.map((map) => [map.key, makeOvalRoute()]),
);
const ROUTE = new Proxy([], {
  get(_, prop) {
    const route = MAP_ROUTES[MAPS[S.mapIndex]?.key] || MAP_ROUTES.starwish;
    if (prop === "length") return route.length;
    if (prop === Symbol.iterator) return route[Symbol.iterator].bind(route);
    if (prop in Array.prototype) {
      const v = Array.prototype[prop];
      return typeof v === "function" ? v.bind(route) : v;
    }
    return route[prop];
  },
});
const TYPE_PATTERN = [
  "start",
  "land",
  "news",
  "land",
  "card",
  "land",
  "shop",
  "land",
  "event",
  "land",
  "minigame",
  "land",
  "land",
  "land",
  "card",
  "land",
  "event",
  "land",
  "bank",
  "land",
  "land",
  "land",
  "event",
  "land",
  "minigame",
  "land",
  "card",
  "land",
  "magic",
  "land",
  "event",
  "police",
  "hospital",
  "land",
  "coupon",
  "land",
];
function cashGain(p, n) {
  p.cash += p.char === 0 ? Math.round(n * 1.2) : n;
  sfx("gain");
}
function attachEffect(p, kind, turns) {
  p.effects = p.effects || [];
  const e = p.effects.find((x) => x.kind === kind);
  if (e) e.turns = Math.max(e.turns, turns);
  else p.effects.push({ kind, turns });
}
function isGodEffect(effect) {
  return NPC_DEFS.some((d) => d.name === effect?.kind && !["乞丐", "惡犬"].includes(d.name));
}
function releaseGod(name, nearPos = 0) {
  const b = S.board;
  if (!b?.gods || !name || b.npcs.some((n) => n.name === name)) return;
  const occupied = new Set([
    ...b.players.filter((p) => !p.bankrupt).map((p) => p.pos),
    ...b.npcs.map((n) => n.pos),
  ]);
  let pos = (nearPos + 4 + Math.floor(Math.random() * Math.max(1, b.tiles.length - 8))) % b.tiles.length;
  for (let i = 0; i < b.tiles.length && occupied.has(pos); i++) pos = (pos + 1) % b.tiles.length;
  b.npcs.push({ name, pos, dir: Math.random() < 0.5 ? -1 : 1 });
}
function tickEffects(p) {
  for (const e of p.effects || []) {
    if (e.kind === "財神") cashGain(p, 1800);
    else if (e.kind === "窮神") p.cash -= 1200;
    else if (e.kind === "福神" && Math.random() < 0.35) drawCard(p);
    else if (e.kind === "衰神") p.slow = 1;
    else if (e.kind === "死神" && p.cards.length && Math.random() < 0.3)
      p.cards.splice(Math.floor(Math.random() * p.cards.length), 1);
  }
  const expired = (p.effects || []).filter((e) => e.turns <= 1 && isGodEffect(e));
  p.effects = (p.effects || [])
    .map((e) => ({ ...e, turns: e.turns - 1 }))
    .filter((e) => e.turns > 0);
  for (const e of expired) {
    const replacement = GOD_TRANSFORMS[e.kind] || e.kind;
    releaseGod(replacement, p.pos);
    addLog(`${e.kind}離開 ${p.id + 1}P，${replacement}回到道路巡遊`);
  }
  if (S.board?.gods) spawnNPCs(3);
}
function markUpgrade(t) {
  if (S.board) S.board.buildAnim = { tile: t, at: performance.now() };
  sfx("reward");
}
function upgradeRandomLand(p) {
  const a = S.board?.tiles.filter((t) => t.owner === p.id && t.level < 5) || [];
  if (a.length) {
    const t = a[Math.floor(Math.random() * a.length)];
    t.level++;
    markUpgrade(t);
  }
}
function downgradeRandomLand(p) {
  const a = S.board?.tiles.filter((t) => t.owner === p.id && t.level > 0) || [];
  if (a.length) a[Math.floor(Math.random() * a.length)].level--;
}
function drawCard(p) {
  if (p.cards.length < 15)
    p.cards.push(CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
  if (p.char === 2 && p.cards.length < 15 && Math.random() < 0.22)
    p.cards.push(CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]);
}
function addLog(s) {
  S.board.log.push(s);
  if (S.board.log.length > 8) S.board.log.shift();
  S.msg = s;
}
function openPopup(kind, data = {}) {
  S.board.popup = { kind, openedAt: performance.now(), ...data };
}
function typeName(t) {
  return (
    {
      start: "起點",
      land: "土地",
      event: "命運",
      news: "新聞",
      card: "卡片點",
      shop: "百貨公司",
      minigame: "小遊戲",
      bank: "銀行",
      magic: "魔法屋",
      hospital: "醫院",
      coupon: "點券格",
    }[t] || t
  );
}
function regionName(reg) {
  return (
    (MAPS[S.board?.mapIndex ?? S.mapIndex]?.regions || REGION_NAMES)[reg] ||
    REGION_NAMES[reg]
  );
}
function activePlayers() {
  return S.board.players.filter((p) => !p.bankrupt);
}
function cp() {
  return S.board.players[S.board.turn];
}
function living() {
  return activePlayers();
}
function regionOwned(pid, reg) {
  const lands = S.board.tiles.filter(
    (t) => t.type === "land" && t.region === reg,
  );
  return lands.length > 0 && lands.every((t) => t.owner === pid);
}
function buyCost(p, t) {
  let c = Math.round(t.price * marketIndex());
  if (p.char === 6) c = Math.round(c * 0.9);
  if (p.discount) c = Math.round(c * 0.75);
  return c;
}
function upgradeCost(t) {
  const nextLevel = Math.min(5, (t.level || 0) + 1);
  return Math.round(t.price * (0.61 + nextLevel * 0.07) * marketIndex());
}
function baseRent(t) {
  return Math.round(
    t.price * 0.25 * (S.board?.mapRules?.rentRate || 1) * marketIndex(),
  );
}
function shopCost(p) {
  return p.char === 4 ? 2000 : 2500;
}
function rentFor(t, payer = null) {
  let r = Math.round(
    t.price *
      (0.25 + t.level * 0.22) *
      (S.board?.mapRules?.rentRate || 1) *
      marketIndex(),
  );
  if (t.owner >= 0 && regionOwned(t.owner, t.region)) r = Math.round(r * 1.5);
  const owner = S.board.players.find((x) => x.id === t.owner);
  if (owner?.char === 8) r = Math.round(r * 1.15);
  if (owner?.rentBoost) {
    r = Math.round(r * 1.5);
    owner.rentBoost = 0;
  }
  if (payer?.char === 3) r = Math.round(r * 0.8);
  if ((payer?.effects || []).some((e) => e.kind === "財神")) r = 0;
  if ((payer?.effects || []).some((e) => e.kind === "窮神")) r = Math.round(r * 2);
  if (t.special === "hotel") r = Math.round(r * 1.4);
  else if (t.special === "mall") r = Math.round(r * 1.2);
  else if (t.special === "park") r = Math.round(r * 0.65);
  return r;
}
function rentEstimate(t, payer = null) {
  let r = Math.round(
    t.price *
      (0.25 + t.level * 0.22) *
      (S.board?.mapRules?.rentRate || 1) *
      marketIndex(),
  );
  if (t.owner >= 0 && regionOwned(t.owner, t.region)) r = Math.round(r * 1.5);
  const owner = S.board.players.find((x) => x.id === t.owner);
  if (owner?.char === 8) r = Math.round(r * 1.15);
  if (owner?.rentBoost) r = Math.round(r * 1.5);
  if (payer?.char === 3) r = Math.round(r * 0.8);
  if ((payer?.effects || []).some((e) => e.kind === "財神")) r = 0;
  if ((payer?.effects || []).some((e) => e.kind === "窮神")) r = Math.round(r * 2);
  if (t.special === "hotel") r = Math.round(r * 1.4);
  else if (t.special === "mall") r = Math.round(r * 1.2);
  else if (t.special === "park") r = Math.round(r * 0.65);
  return r;
}
function marketIndex() {
  const round = Math.max(1, S.board?.round || 1);
  return Math.min(2, 1 + Math.floor((round - 1) / 10) * 0.1);
}
function applyPropertyArrival(t, payer, owner) {
  if (!owner || !t.special) return;
  if (t.special === "hotel") payer.skip += 1;
  else if (t.special === "mall") owner.tickets += 2;
  else if (t.special === "park") owner.cash += 2500;
}
function applyGodArrival(t, p) {
  if (t.type !== "land") return;
  const effects = new Set((p.effects || []).map((e) => e.kind));
  if (effects.has("土地公") && t.owner !== p.id) {
    t.owner = p.id;
    t.level = Math.max(0, t.level || 0);
    markUpgrade(t);
    addLog(`${p.id + 1}P 受土地公協助占有土地`);
  }
  if (effects.has("天使") && t.owner >= 0 && t.level < 5) {
    t.level++;
    markUpgrade(t);
    addLog(`天使為第 ${t.index + 1} 格加蓋一層`);
  }
  if (effects.has("惡魔") && t.owner >= 0 && t.level > 0) {
    t.level--;
    markUpgrade(t);
    addLog(`惡魔拆除第 ${t.index + 1} 格一層建築`);
  }
}
function netWorth(p) {
  let v = p.cash + (p.bank || 0);
  S.board.tiles.forEach((t) => {
    if (t.owner === p.id)
      v += Math.round(
        (t.price + t.price * 0.65 * t.level) * marketIndex(),
      );
  });
  return v;
}
function focus(now = false) {
  const b = S.board,
    p = cp(),
    t = b.tiles[p.pos],
    tx = Math.max(0, Math.min(MW - W, t.x - W / 2)),
    ty = Math.max(0, Math.min(MH - H, t.y - H / 2));
  if (now) {
    b.cam.x = tx;
    b.cam.y = ty;
    b.cam.target = null;
  } else b.cam.target = { x: tx, y: ty };
}
function spawnNPCs(target = 3) {
  const b = S.board,
    pool = NPC_DEFS.filter((n) => !["乞丐", "惡犬"].includes(n.name)),
    attached = new Set(b.players.flatMap((p) => (p.effects || []).filter(isGodEffect).map((e) => e.kind))),
    names = new Set((b.npcs || []).map((n) => n.name)),
    occupied = new Set([
      ...b.players.filter((p) => !p.bankrupt).map((p) => p.pos),
      ...(b.npcs || []).map((n) => n.pos),
    ]);
  b.npcs ||= [];
  const available = pool.filter((d) => !attached.has(d.name) && !names.has(d.name));
  while (b.npcs.length < target && available.length) {
    const pick = Math.floor(Math.random() * available.length),
      d = available.splice(pick, 1)[0];
    let pos = 2 + Math.floor(Math.random() * (b.tiles.length - 3));
    for (let i = 0; i < b.tiles.length && occupied.has(pos); i++) pos = (pos + 1) % b.tiles.length;
    occupied.add(pos);
    b.npcs.push({
      name: d.name,
      pos,
      dir: Math.random() < 0.5 ? -1 : 1,
    });
  }
}
function moveNPCs() {
  const b = S.board;
  if (!b.npcs) return;
  for (const n of b.npcs) {
    n.pos =
      (n.pos + n.dir * (1 + Math.floor(Math.random() * 3)) + b.tiles.length) %
      b.tiles.length;
    if (Math.random() < 0.18) n.dir *= -1;
  }
}
function adjustedTypes(mapRules) {
  const types = TYPE_PATTERN.slice(),
    factor =
      ({ low: 0.7, standard: 1, high: 1.4 }[S.eventLevel] || 1) *
      mapRules.eventRate,
    target = Math.max(2, Math.min(9, Math.round(5 * factor))),
    current = types.filter((x) => x === "event").length;
  if (target > current) {
    const candidates = [5, 9, 13, 19, 25, 31, 35];
    for (let i = 0; i < target - current && i < candidates.length; i++)
      types[candidates[i]] = "event";
  } else if (target < current) {
    const events = types
      .map((x, i) => (x === "event" ? i : -1))
      .filter((i) => i >= 0);
    for (let i = 0; i < current - target; i++)
      types[events[events.length - 1 - i]] = "land";
  }
  return types;
}
function makeBoard() {
  const mapRules = MAPS[S.mapIndex] || MAPS[0],
    typePattern = adjustedTypes(mapRules),
    tiles = ROUTE.map((p, i) => ({
      index: i,
      x: p[0],
      y: p[1],
      type: typePattern[i],
      owner: -1,
      level: 0,
      region: Math.floor(i / 9) % 4,
      price: Math.round((9000 + (i % 7) * 1800) * mapRules.priceRate),
    }));
  const players = activeSeatIds().map((si, id) => ({
    id,
    seat: si,
    type: S.seats[si].type,
    char: S.seats[si].char,
    diff: S.seats[si].diff,
    cash: S.money + (S.seats[si].char === 9 ? 2000 : 0),
    bank: 0,
    pos: 0,
    cards: [],
    tools: [],
    tickets: 0,
    skip: 0,
    shield: 0,
    bankrupt: false,
    effects: [],
    hopeUsed: false,
    rentBoost: 0,
    discount: 0,
    slow: 0,
    diceCount: 1,
    vehicleTurns: 0,
    direction: 1,
    detained: null,
    hospitalPass: 0,
    bailPass: 0,
  }));
  S.board = {
    worldW: MW,
    worldH: MH,
    mapIndex: S.mapIndex,
    mapRules: {
      key: mapRules.key,
      name: mapRules.name,
      rentRate: mapRules.rentRate,
      eventRate: mapRules.eventRate,
    },
    victory: S.victory,
    eventLevel: S.eventLevel,
    startingCards: S.startingCards,
    gods: S.gods,
    tiles,
    players,
    turn: 0,
    round: 1,
    phase: "turn-start",
    cam: { x: 650, y: 900, target: null },
    popup: null,
    mini: null,
    buildAnim: null,
    selectedTile: null,
    log: [`${mapRules.name}冒險開始！`],
    winner: null,
    npcs: [],
    roadblocks: [],
    shopStock: [],
    toolStock: [],
    turnBanner: { player: 0, start: performance.now() },
  };
  players.forEach((p) => {
    for (let i = 0; i < S.startingCards; i++) drawCard(p);
  });
  if (S.gods) spawnNPCs();
  focus(true);
  saveGame();
}
function npcAt(pos) {
  return S.board.npcs?.find((n) => n.pos === pos);
}
function applyNPCByName(name, p) {
  const n = NPC_DEFS.find((x) => x.name === name);
  if (!n) return;
  const old = (p.effects || []).find((e) =>
    NPC_DEFS.some((d) => d.name === e.kind),
  );
  if (old) {
    p.effects = p.effects.filter((e) => e !== old);
    releaseGod(old.kind, p.pos);
    addLog(`${old.kind}離開 ${p.id + 1}P，由${name}接替附身`);
  }
  n.apply(p);
  if (!(p.effects || []).some((e) => e.kind === name))
    attachEffect(p, name, ["死神"].includes(name) ? 13 : 7);
  S.board.npcs = S.board.npcs.filter((x) => x.name !== name);
  openPopup("npc", { name: n.name, desc: n.desc });
  addLog(`${p.id + 1}P 遇到${n.name}，將跟隨角色並持續發揮效果`);
}
function resolveTile() {
  const b = S.board,
    p = cp(),
    t = b.tiles[p.pos],
    n = npcAt(p.pos);
  b.phase = "arrival";
  if (n) {
    applyNPCByName(n.name, p);
    return;
  }
  if (t.type === "start") {
    addLog(`${p.id + 1}P 停留起點休息`);
  }
  applyGodArrival(t, p);
  if (p.type === "ai" && !["start", "land"].includes(t.type)) {
    if (t.type === "bank") {
      const amount = Math.max(0, Math.min(10000, p.cash - 50000));
      p.cash -= amount;
      p.bank = (p.bank || 0) + amount;
      addLog(`${p.id + 1}P 在銀行存入 $${amount.toLocaleString()}`);
      openPopup("event", { name: "童話銀行", desc: `${p.id + 1}P 存入 $${amount.toLocaleString()}。`, aiDecision: true });
      return;
    }
    applySpecial(t, p);
    return;
  }
  openPopup("tile", { tile: t });
  if (p.type === "ai") aiResolve();
}
function applySpecial(t, p) {
  if (t.type === "event" || t.type === "news") {
    const e = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    e[2](p);
    openPopup("event", {
      name: (t.type === "news" ? "王國新聞｜" : "命運事件｜") + e[0],
      desc: e[1],
      art: e[3] || null,
    });
    addLog(`${p.id + 1}P：${e[0]}・${e[1]}`);
  } else if (t.type === "card") {
    drawCard(p);
    const c = p.cards[p.cards.length - 1];
    openPopup("carddraw", { card: c });
    addLog(`${p.id + 1}P 抽到 ${cardDef(c).name}`);
  } else if (t.type === "shop") {
    S.board.shopStock = Array.from(
      { length: 6 },
      () => CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)],
    );
    S.board.toolStock = Array.from(
      { length: 4 },
      () => TOOL_POOL[Math.floor(Math.random() * TOOL_POOL.length)],
    );
    openPopup("shop", { tab: "cards" });
    addLog(`${p.id + 1}P 進入童話百貨公司`);
  } else if (t.type === "coupon") {
    p.tickets += 3;
    addLog(`${p.id + 1}P 獲得 3 點券`);
    openPopup("event", {
      name: "點券獎勵",
      desc: "獲得 3 點券，可在百貨公司購買卡片。",
    });
  } else if (t.type === "bank") {
    openPopup("bank");
    addLog(`${p.id + 1}P 抵達銀行`);
  } else if (t.type === "magic") {
    const o = living().filter((x) => x.id !== p.id)[
      Math.floor(Math.random() * Math.max(1, living().length - 1))
    ];
    if (o) {
      const z = p.pos;
      p.pos = o.pos;
      o.pos = z;
    }
    openPopup("event", {
      name: "魔法屋",
      desc: o ? `與 ${o.id + 1}P 交換位置。` : "魔法暫時沉睡。",
    });
  } else if (t.type === "hospital") {
    admitPlayer(p, "hospital", 2, "接受照護，住院 2 回合。");
  } else if (t.type === "police") {
    admitPlayer(p, "jail", 2, "接受調查，拘留 2 回合。");
  } else if (t.type === "minigame") {
    if (p.type === "ai") {
      p.tickets += 2;
      cashGain(p, p.char === 7 ? 3200 : 2500);
      addLog(`${p.id + 1}P 完成小遊戲，獲得獎勵`);
      openPopup("event", { name: "AI 小遊戲結果", desc: "獲得獎金與 2 點券。", aiDecision: true });
    } else {
      const kind = Math.floor(Math.random() * 3),
        names = ["星光接接樂", "月港氣球祭", "雲端寶箱"];
      S.board.mini = {
        kind,
        pos: 0,
        dir: 1,
        last: performance.now(),
        name: names[kind],
        winningChest: Math.floor(Math.random() * 3),
      };
      openPopup("mini", { name: S.board.mini.name });
    }
  }
}
function admitPlayer(p, facility, turns, reason) {
  const passKey = facility === "jail" ? "bailPass" : "hospitalPass";
  if (p[passKey] > 0) {
    p[passKey]--;
    openPopup("event", { name: "通行證生效", desc: `${p.id + 1}P 抵銷了本次${facility === "jail" ? "拘留" : "住院"}。`, aiDecision: p.type === "ai" });
    addLog(`${p.id + 1}P 使用通行證免除${facility === "jail" ? "拘留" : "住院"}`);
    return;
  }
  p.detained = { facility, turns };
  p.skip = Math.max(p.skip || 0, turns);
  const name = facility === "jail" ? "童話警察局" : "童話醫院";
  openPopup("event", { name, desc: reason, facility, aiDecision: p.type === "ai" });
  addLog(`${p.id + 1}P 前往${name}，停留 ${turns} 回合`);
}
function ensureSolvent(p) {
  if (p.cash >= 0) return;
  const houses = S.board.tiles
    .filter((t) => t.owner === p.id && t.level > 0)
    .sort((a, b) => b.level - a.level);
  for (const t of houses) {
    while (t.level > 0 && p.cash < 0) {
      p.cash += Math.round(t.price * 0.32);
      t.level--;
      addLog(`${p.id + 1}P 變賣房屋籌措資金`);
    }
  }
  const lands = S.board.tiles.filter((t) => t.owner === p.id);
  for (const t of lands) {
    if (p.cash >= 0) break;
    p.cash += Math.round(t.price * 0.55);
    t.owner = -1;
    t.level = 0;
    addLog(`${p.id + 1}P 出售土地籌措資金`);
  }
  if (p.cash < 0 && p.char === 9 && !p.hopeUsed) {
    p.hopeUsed = true;
    p.cash = 10000;
    addLog(`${p.id + 1}P 的希望之力避免破產，恢復 $10,000`);
  }
  if (p.cash < 0) {
    p.bankrupt = true;
    p.cash = 0;
    S.board.tiles.forEach((t) => {
      if (t.owner === p.id) {
        t.owner = -1;
        t.level = 0;
      }
    });
    addLog(`${p.id + 1}P 破產退場！`);
    sfx("loss");
    spawnNPCs();
  }
}
function finishAction() {
  const p = cp(),
    q = S.board.popup,
    last = S.board.log.at(-1) || "",
    ownChange =
      q?.kind === "tile" &&
      q.tile?.owner === p.id &&
      last.startsWith(`${p.id + 1}P `),
    propertyMoment =
      ownChange && (last.includes("購買") || last.includes("升到"));
  if (ownChange && last.includes("購買")) markUpgrade(q.tile);
  ensureSolvent(p);
  S.board.popup = null;
  S.board.mini = null;
  saveGame();
  if (propertyMoment) {
    S.rolling = true;
    setTimeout(() => {
      S.rolling = false;
      nextTurn();
    }, 700);
  } else nextTurn();
}
function finishGame(w) {
  const b = S.board;
  b.winner = w || null;
  b.popup = null;
  b.mini = null;
  sfx("win");
  saveGame();
  S.scene = "result";
}
function nextTurn() {
  const b = S.board;
  if (living().length <= 1) {
    finishGame(living()[0]);
    return;
  }
  let wrapped = false,
    guard = 0;
  do {
    b.turn++;
    if (b.turn >= b.players.length) {
      b.turn = 0;
      b.round++;
      wrapped = true;
    }
    guard++;
  } while (cp().bankrupt && guard < 10);
  if (wrapped && b.gods) moveNPCs();
  if (b.round > S.rounds && b.victory === "assets") {
    const sorted = living()
      .slice()
      .sort((a, b) => netWorth(b) - netWorth(a));
    finishGame(sorted[0]);
    return;
  }
  if (b.round > S.rounds && b.victory === "survival") {
    b.round = 1;
    addLog("生存賽進入新一季，直到只剩最後一名玩家");
  }
  const p = cp();
  b.turnBanner = { player: p.id, start: performance.now() };
  b.phase = "turn-start";
  tickEffects(p);
  if (p.skip > 0) {
    p.skip--;
    if (p.detained) {
      const facility = p.detained.facility,
        releaseCard = facility === "jail" ? "bail" : "hospitalpass",
        releaseIndex = p.cards.indexOf(releaseCard);
      if (p.type === "ai" && releaseIndex >= 0) {
        p.cards.splice(releaseIndex, 1);
        p.detained = null;
        p.skip = 0;
        openPopup("event", { name: "AI 使用解除卡", desc: `${p.id + 1}P 使用${cardDef(releaseCard).name}，立即恢復行動資格。`, detainedTurn: true, released: true });
        addLog(`${p.id + 1}P 使用${cardDef(releaseCard).name}解除狀態`);
        return;
      }
      p.detained.turns = Math.max(0, p.detained.turns - 1);
      const place = p.detained.facility === "jail" ? "警察局" : "醫院";
      openPopup("event", { name: `${place}停留`, desc: `${p.id + 1}P 尚需停留 ${p.detained.turns} 回合。`, detainedTurn: true, facility, releaseIndex });
      if (!p.detained.turns) p.detained = null;
    } else openPopup("event", { name: "暫停回合", desc: `${p.id + 1}P 本回合無法行動。`, detainedTurn: true });
    return;
  }
  focus();
  b.phase = "pre-roll";
  if (p.type === "ai") setTimeout(aiTurn, 700);
}
function branchAt(pos) {
  const key = S.board?.mapRules?.key || MAPS[S.mapIndex]?.key;
  return MAP_BRANCHES[key]?.[pos] || null;
}
function finishMovement() {
  const b = S.board, p = cp();
  p.moveAnim = null;
  b.pendingMove = null;
  S.rolling = false;
  resolveTile();
}
function moveToTile(next) {
  const b = S.board, p = cp(), move = b.pendingMove;
  if (!move) return;
  const old = p.pos, from = b.tiles[old], to = b.tiles[next], dur = 280;
  p.pos = next;
  p.moveAnim = { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y }, start: performance.now(), dur };
  move.remaining--;
  if (npcAt(p.pos)) {
    move.remaining = 0;
    addLog(`${p.id + 1}P 在途中遇見巡遊角色，移動停止`);
  }
  if (p.bombSteps > 0 && --p.bombSteps === 0) {
    p.detained = { facility: "hospital", turns: 3 };
    p.skip += 3;
    move.remaining = 0;
    addLog(`${p.id + 1}P 的定時炸彈爆炸，將住院休息 3 回合`);
    sfx("loss");
  }
  move.branchHandledAt = old;
  sfx("step");
  if (p.pos === 0 && old !== 0) {
    cashGain(p, 5000);
    addLog(`${p.id + 1}P 通過起點 +$5,000`);
  }
  const roadIndex = (b.roadblocks || []).indexOf(p.pos);
  if (roadIndex >= 0) {
    b.roadblocks.splice(roadIndex, 1);
    move.remaining = 0;
    addLog(`${p.id + 1}P 撞上路障，移動提前結束`);
  }
  focus();
  setTimeout(() => { p.moveAnim = null; advanceMovement(); }, dur);
}
function chooseBranch(next) {
  const b = S.board, move = b.pendingMove, choices = branchAt(cp().pos);
  if (!move || !choices?.includes(next)) return;
  b.popup = null;
  moveToTile(next);
}
function advanceMovement() {
  const b = S.board, p = cp(), move = b.pendingMove;
  if (!move || move.remaining <= 0) { finishMovement(); return; }
  const choices = p.direction > 0 ? branchAt(p.pos) : null;
  if (choices && move.branchHandledAt !== p.pos) {
    b.phase = "branch-choice";
    if (p.type === "ai") {
      const destination = p.diff === "easy" ? choices[Math.floor(Math.random() * choices.length)] : choices[1];
      setTimeout(() => chooseBranch(destination), 300);
    } else openPopup("branch", { choices });
    return;
  }
  const next = (p.pos + (p.direction || 1) + b.tiles.length) % b.tiles.length;
  moveToTile(next);
}
function moveSteps(steps) {
  const b = S.board;
  S.rolling = true;
  b.phase = "moving";
  b.pendingMove = { remaining: steps, branchHandledAt: -1 };
  advanceMovement();
}
function rollDice() {
  if (S.rolling || !S.board || S.board.popup || S.board.winner) return;
  const p = cp();
  S.board.turnBanner = null;
  S.board.phase = "rolling";
  S.rolling = true;
  const previewCount = S.forcedDice
    ? 1
    : Math.max(1, Math.min(3, p.diceCount || 1));
  S.diceResults = [];
  S.diceAnim = { start: performance.now(), duration: 920, count: previewCount };
  let spins = 0;
  const timer = setInterval(() => {
    S.dice = 1 + Math.floor(Math.random() * 6);
    spins++;
    if (spins >= 9) {
      clearInterval(timer);
      const count = S.forcedDice
        ? 1
        : Math.max(1, Math.min(3, p.diceCount || 1));
      const results = S.forcedDice
        ? [S.forcedDice]
        : Array.from(
            { length: count },
            () => 1 + Math.floor(Math.random() * 6),
          );
      let d = results.reduce((sum, value) => sum + value, 0);
      S.forcedDice = 0;
      if (p.char === 1 && d === 1 && Math.random() < 0.5) d = 2;
      if (p.char === 5 && d <= 2 && Math.random() < 0.3) d = 3;
      if (p.slow) {
        d = Math.min(d, 3);
        p.slow = 0;
      }
      S.diceResults = results;
      S.diceAnim.results = results;
      S.diceAnim.settleAt = performance.now();
      S.dice = results[0];
      if (p.vehicleTurns > 0 && --p.vehicleTurns === 0) {
        p.diceCount = 1;
        p.vehicle = null;
      }
      sfx("dice");
      if (S.settings.vibrate && navigator.vibrate)
        navigator.vibrate([24, 35, 32]);
      addLog(`${p.id + 1}P 擲出 ${results.join("＋")}，合計 ${d} 點`);
      setTimeout(() => {
        S.diceAnim = null;
        S.rolling = false;
        moveSteps(d);
      }, 320);
    }
  }, 70);
}
function aiResolve() {
  const b = S.board,
    p = cp(),
    q = b.popup;
  if (!q) return;
  const smart = p.diff === "smart",
    easy = p.diff === "easy";
  if (q.kind === "tile") {
    const t = q.tile;
    if (t.type === "land") {
      if (t.owner < 0) {
        const cost = buyCost(p, t),
          reserve = easy ? 70000 : smart ? 25000 : 45000;
        if (p.cash - cost > reserve) {
          p.cash -= cost;
          if (p.discount) p.discount = 0;
          t.owner = p.id;
          addLog(`${p.id + 1}P 購買 ${REGION_NAMES[t.region]} 土地`);
        }
        openPopup("event", { name: "AI 購地決策", desc: t.owner === p.id ? `${p.id + 1}P 購買了這塊土地。` : `${p.id + 1}P 決定保留資金。`, aiDecision: true });
        return;
      }
      if (t.owner === p.id) {
        const cost = upgradeCost(t),
          want =
            t.level < 5 &&
            p.cash - cost > (easy ? 90000 : smart ? 30000 : 55000);
        if (want) {
          p.cash -= cost;
          t.level++;
          if (t.level === 5)
            t.special = smart ? "hotel" : easy ? "park" : "mall";
          markUpgrade(t);
          addLog(`${p.id + 1}P 將土地升到 Lv${t.level}`);
        }
        openPopup("event", { name: "AI 建築決策", desc: want ? `${p.id + 1}P 將房屋升至 Lv${t.level}。` : `${p.id + 1}P 本回合不升級。`, aiDecision: true });
        return;
      }
      const r = rentFor(t, p);
      if (p.shield > 0) {
        p.shield--;
        addLog(`${p.id + 1}P 使用護盾免除租金`);
      } else {
        p.cash -= r;
        const o = b.players.find((x) => x.id === t.owner);
        if (o && !o.bankrupt) {
          o.cash += r;
          applyPropertyArrival(t, p, o);
        }
      }
      openPopup("event", { name: "AI 租金結算", desc: `${p.id + 1}P 完成租金結算，請確認後繼續。`, aiDecision: true });
      return;
    }
    if (["event", "card", "shop", "minigame", "npc"].includes(t.type)) {
      applySpecial(t, p);
      return;
    }
    openPopup("event", { name: "AI 行動結果", desc: `${p.id + 1}P 的格子效果已完成。`, aiDecision: true });
    return;
  }
  if (q.kind === "shop") {
    const wantsTool = (p.tools || []).length < 3 && p.diceCount === 1 && Math.random() < (smart ? 0.7 : 0.4),
      source = wantsTool ? b.toolStock || [] : b.shopStock || [],
      choices = source
      .map((id, index) => ({ ...cardDef(id), index }))
      .filter((d) => d.cost <= p.tickets)
      .sort((a, z) => z.cost - a.cost);
    const inventory = wantsTool ? (p.tools ||= []) : p.cards,
      capacity = wantsTool ? 8 : 15;
    if (choices.length && inventory.length < capacity) {
      const d = easy
        ? choices[Math.floor(Math.random() * choices.length)]
        : choices[0];
      p.tickets -= d.cost;
      inventory.push(d.id);
      source.splice(d.index, 1);
      addLog(`${p.id + 1}P 以 ${d.cost} 點券購買 ${d.name}`);
    }
    openPopup("event", { name: "AI 商店結果", desc: choices.length ? `${p.id + 1}P 已完成購物。` : `${p.id + 1}P 沒有購買商品。`, aiDecision: true });
    return;
  }
  if (["event", "npc", "carddraw"].includes(q.kind)) {
    return;
  }
}
function aiTurn() {
  const p = cp();
  if (!p || p.type !== "ai" || S.board.popup || S.board.winner) return;
  const smart = p.diff === "smart",
    easy = p.diff === "easy",
    chance = easy ? 0.25 : smart ? 0.9 : 0.58;
  const tools = p.tools || [];
  if (p.diceCount === 1) {
    const vehicleIndex = tools.findIndex((id) => id === "car" || id === "speed");
    if (vehicleIndex >= 0) useTool(vehicleIndex);
  }
  const roadblockIndex = tools.indexOf("roadblock");
  if (roadblockIndex >= 0 && Math.random() < chance) {
    p.tools.splice(roadblockIndex, 1);
    const pos = (p.pos + 4) % S.board.tiles.length;
    if (!S.board.roadblocks.includes(pos)) S.board.roadblocks.push(pos);
  }
  const bombIndex = tools.indexOf("bomb");
  if (bombIndex >= 0 && Math.random() < chance) {
    const target = living().filter((x) => x.id !== p.id).sort((a, b) => netWorth(b) - netWorth(a))[0];
    if (target) { p.tools.splice(bombIndex, 1); target.bombSteps = 12; }
  }
  if (Math.random() < chance) {
    const own = S.board.tiles.some((t) => t.owner === p.id && t.level < 5),
      priorities = [];
    if (p.shield === 0) priorities.push("shield");
    if (own) priorities.push("upgrade", "rent");
    if (p.cash > 90000) priorities.push("discount");
    priorities.push(smart ? "precision" : "remote", "stop");
    const wanted = priorities.find((c) => p.cards.includes(c));
    if (wanted) {
      useCard(p.cards.indexOf(wanted));
      addLog(`${p.id + 1}P 的 AI 策略使用 ${cardDef(wanted).name}`);
    }
  }
  if (!S.rolling && !S.board.popup) setTimeout(rollDice, 260);
}
function useTool(i) {
  const p = cp(), c = (p.tools || [])[i], d = toolDef(c);
  if (!c || S.board.phase !== "pre-roll") return;
  if (c === "roadblock") {
    openPopup("toolTileTarget", { toolIndex: i, targets: Array.from({ length: 6 }, (_, n) => (p.pos + n + 1) % S.board.tiles.length) });
    return;
  }
  if (c === "bomb") {
    openPopup("toolTarget", { toolIndex: i });
    return;
  }
  p.tools.splice(i, 1);
  if (c === "speed") {
    p.diceCount = 2;
    p.vehicleTurns = 5;
    p.vehicle = "motorcycle";
  } else if (c === "car") {
    p.diceCount = 3;
    p.vehicleTurns = 5;
    p.vehicle = "car";
  }
  addLog(`${p.id + 1}P 裝備 ${d.name}`);
  S.board.popup = null;
  saveGame();
}
function useCard(i) {
  const p = cp(),
    c = p.cards[i],
    d = cardDef(c);
  if (!c) return;
  if (p.type === "human" && ["remote", "precision"].includes(c)) {
    openPopup("cardDice", { cardIndex: i });
    return;
  }
  if (p.type === "human" && ["swap", "stop"].includes(c)) {
    openPopup("cardTarget", { cardIndex: i, card: c });
    return;
  }
  if (p.type === "human" && ["teleport", "buyland", "upgrade"].includes(c)) {
    let targets;
    if (c === "buyland") {
      const underfoot = S.board.tiles[p.pos];
      targets = underfoot?.type === "land" && underfoot.owner < 0 ? [p.pos] : [];
    } else if (c === "upgrade") {
      targets = S.board.tiles.filter((t) => t.type === "land" && t.owner === p.id && t.level < 5).map((t) => t.index);
    } else targets = Array.from({ length: 8 }, (_, n) => (p.pos + n + 1) % S.board.tiles.length);
    if (!targets.length) {
      openPopup("cards", { page: Math.floor(i / 8), error: c === "buyland" ? "購地卡只能用於腳下的無主土地。" : "目前沒有可以升級的房屋。" });
      return;
    }
    openPopup("cardTileTarget", { cardIndex: i, targets });
    return;
  }
  p.cards.splice(i, 1);
  if (c === "precision") S.forcedDice = 6;
  else if (c === "remote") S.forcedDice = 3;
  else if (c === "shield") p.shield++;
  else if (c === "discount") p.discount = 1;
  else if (c === "upgrade") return;
  else if (c === "buyland") {
    const t = S.board.tiles[p.pos];
    if (t?.type === "land" && t.owner < 0 && p.cash >= buyCost(p, t)) {
      p.cash -= buyCost(p, t);
      t.owner = p.id;
      markUpgrade(t);
    }
  } else if (c === "rent") p.rentBoost = 1;
  else if (c === "hospitalpass") {
    if (p.detained?.facility === "hospital") { p.detained = null; p.skip = 0; }
    else p.hospitalPass = 1;
  } else if (c === "bail") {
    if (p.detained?.facility === "jail") { p.detained = null; p.skip = 0; }
    else p.bailPass = 1;
  }
  else if (c === "swap") {
    const o = living()
      .filter((x) => x.id !== p.id)
      .sort((a, b) => b.cash - a.cash)[0];
    if (o) {
      const z = p.pos;
      p.pos = o.pos;
      o.pos = z;
      focus();
    }
  } else if (c === "teleport") {
    const valuable = S.board.tiles
      .filter((t) => t.type === "land" && (t.owner < 0 || t.owner === p.id))
      .sort((a, b) => (b.owner === p.id ? 1 : 0) - (a.owner === p.id ? 1 : 0));
    p.pos = (valuable[0] || S.board.tiles[(p.pos + 6) % S.board.tiles.length]).index;
    focus();
  } else if (c === "stop") {
    const o = living()
      .filter((x) => x.id !== p.id)
      .sort((a, b) => b.cash - a.cash)[0];
    if (o) o.skip++;
  }
  addLog(`${p.id + 1}P 使用 ${d.name}`);
  S.board.popup = null;
  saveGame();
}
function useChosenDice(n) {
  const p = cp(),
    q = S.board.popup,
    i = q?.cardIndex;
  if (q?.kind !== "cardDice" || !["remote", "precision"].includes(p.cards[i]))
    return;
  p.cards.splice(i, 1);
  S.forcedDice = n;
  addLog(`${p.id + 1}P 將骰子設定為 ${n} 點`);
  S.board.popup = null;
  saveGame();
}
function useTargetCard(targetId) {
  const p = cp(),
    q = S.board.popup,
    i = q?.cardIndex,
    c = p.cards[i],
    o = living().find((x) => x.id === targetId && x.id !== p.id);
  if (q?.kind !== "cardTarget" || !o || !["swap", "stop"].includes(c)) return;
  p.cards.splice(i, 1);
  if (c === "swap") {
    const z = p.pos;
    p.pos = o.pos;
    o.pos = z;
    focus();
  } else o.skip++;
  addLog(`${p.id + 1}P 對 ${o.id + 1}P 使用 ${cardDef(c).name}`);
  S.board.popup = null;
  saveGame();
}
function saveGame() {
  if (!S.board) return;
  try {
    localStorage.setItem(
      SAVE,
      JSON.stringify({
        version: 2,
        seats: S.seats,
        mapIndex: S.mapIndex,
        money: S.money,
        rounds: S.rounds,
        victory: S.victory,
        eventLevel: S.eventLevel,
        startingCards: S.startingCards,
        gods: S.gods,
        settings: S.settings,
        board: S.board,
      }),
    );
  } catch (e) {}
}
function loadGame() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE));
    if (!d || !d.board) return false;
    S.seats = d.seats || S.seats;
    S.mapIndex = Number.isInteger(d.mapIndex)
      ? d.mapIndex
      : d.board.mapIndex || 0;
    S.money = d.money || S.money;
    S.rounds = d.rounds || S.rounds;
    S.victory = d.victory || d.board.victory || "assets";
    S.eventLevel = d.eventLevel || d.board.eventLevel || "standard";
    S.startingCards = Number.isInteger(d.startingCards)
      ? d.startingCards
      : d.board.startingCards || 0;
    S.gods = typeof d.gods === "boolean" ? d.gods : d.board.gods !== false;
    S.settings = d.settings || S.settings;
    S.board = d.board;
    S.board.victory = S.board.victory || S.victory;
    S.board.eventLevel = S.board.eventLevel || S.eventLevel;
    S.board.gods = typeof S.board.gods === "boolean" ? S.board.gods : S.gods;
    S.board.mapRules = S.board.mapRules || {
      key: "starwish",
      name: "星願花園",
      rentRate: 1,
      eventRate: 1,
    };
    S.board.popup = null;
    S.board.mini = null;
    S.board.selectedTile = null;
    S.board.npcs = S.board.npcs || [];
    S.board.phase = "pre-roll";
    S.board.roadblocks = S.board.roadblocks || [];
    S.board.shopStock = S.board.shopStock || [];
    S.board.toolStock = S.board.toolStock || [];
    const savedRoute = MAP_ROUTES[MAPS[S.mapIndex]?.key] || MAP_ROUTES.starwish;
    S.board.tiles.forEach((t, i) => {
      t.index = i;
      if (savedRoute[i]) {
        t.x = savedRoute[i][0];
        t.y = savedRoute[i][1];
      }
      if (t.type === "npc") t.type = "land";
    });
    S.board.players.forEach((p) => {
      p.effects = p.effects || [];
      const legacyGod = p.effects.filter(isGodEffect).at(-1);
      p.effects = p.effects.filter((e) => !isGodEffect(e) || e === legacyGod);
      const migrated = (p.cards || []).map((c) => cardDef(c).id).filter(Boolean);
      p.tools = [...(p.tools || []), ...migrated.filter((c) => cardDef(c).kind === "tool")]
        .map((c) => toolDef(c).id)
        .slice(0, 8);
      p.cards = migrated
        .filter((c) => cardDef(c).kind !== "tool")
        .map((c) => cardDef(c).id)
        .filter(Boolean)
        .slice(0, 15);
      p.bank = p.bank || 0;
      p.diceCount = p.diceCount || 1;
      p.vehicleTurns = p.vehicleTurns || 0;
      p.vehicle = p.vehicle || (p.diceCount === 3 ? "car" : p.diceCount === 2 ? "motorcycle" : null);
      p.bombSteps = p.bombSteps || 0;
      p.direction = p.direction || 1;
      p.detained = p.detained || null;
      p.hospitalPass = p.hospitalPass || 0;
      p.bailPass = p.bailPass || 0;
    });
    const attachedGods = new Set(S.board.players.flatMap((p) => p.effects.filter(isGodEffect).map((e) => e.kind))),
      seenGods = new Set();
    S.board.npcs = S.board.gods
      ? S.board.npcs.filter((n) => {
          if (!NPC_DEFS.some((d) => d.name === n.name) || attachedGods.has(n.name) || seenGods.has(n.name)) return false;
          seenGods.add(n.name);
          n.pos = ((Number(n.pos) || 0) + S.board.tiles.length) % S.board.tiles.length;
          n.dir = n.dir === -1 ? -1 : 1;
          return true;
        })
      : [];
    if (S.board.gods) spawnNPCs(3);
    S.scene = S.board.winner ? "result" : "game";
    if (S.scene === "game") {
      focus(true);
      if (cp().type === "ai") setTimeout(aiTurn, 700);
    }
    return true;
  } catch (e) {
    return false;
  }
}
function game() {
  const b = S.board;
  if (b.cam && b.cam.target) {
    b.cam.x += (b.cam.target.x - b.cam.x) * 0.11;
    b.cam.y += (b.cam.target.y - b.cam.y) * 0.11;
    if (Math.hypot(b.cam.target.x - b.cam.x, b.cam.target.y - b.cam.y) < 1)
      b.cam.target = null;
  }
  b.cam.x = Math.max(0, Math.min(MW - W, b.cam.x));
  b.cam.y = Math.max(0, Math.min(MH - H, b.cam.y));
  X.save();
  X.translate(-b.cam.x, -b.cam.y);
  drawMap();
  X.restore();
  hud();
  turnBannerHud();
  X.save();
  popup();
  X.restore();
  if (b.mini && b.popup && b.popup.kind === "mini" && b.mini.kind < 2) {
    const now = performance.now(),
      dt = Math.min(0.04, (now - b.mini.last) / 1000);
    b.mini.last = now;
    b.mini.pos += b.mini.dir * dt * 0.82;
    if (b.mini.pos >= 1) {
      b.mini.pos = 1;
      b.mini.dir = -1;
    }
    if (b.mini.pos <= 0) {
      b.mini.pos = 0;
      b.mini.dir = 1;
    }
  }
}
function cycleVal(v, arr) {
  const i = arr.indexOf(v);
  if (i < 0) return arr.find((x) => typeof x === "number" && x >= v) ?? arr[0];
  return arr[(i + 1) % arr.length];
}
function action(id) {
  if (!id) return;
  if (
    S.scene === "home" &&
    !HOME.locked &&
    ["start", "continue", "help", "settings"].includes(id)
  ) {
    if (id === "continue" && !localStorage.getItem(SAVE)) return;
    HOME.locked = true;
    HOME.pressed = id;
    HOME.leaving = id;
    HOME.leaveAt = performance.now();
    setTimeout(() => {
      HOME.pressed = null;
      if (id === "start") S.scene = "setup";
      else if (id === "continue") {
        if (!loadGame()) S.scene = "setup";
      } else S.scene = id;
      HOME.locked = false;
      HOME.leaving = null;
    }, 260);
    return;
  }
  if (id === "home") {
    S.scene = "home";
    S.board = null;
    resetHome();
    return;
  }
  if (id === "back") {
    S.scene = "home";
    resetHome();
    return;
  }
  if (S.scene === "settings") {
    if (id === "master")
      S.settings.master = cycleVal(S.settings.master, [0, 25, 50, 75, 100]);
    else if (id === "bgm")
      S.settings.bgm = cycleVal(S.settings.bgm, [0, 25, 50, 75, 100]);
    else if (id === "sfx")
      S.settings.sfx = cycleVal(S.settings.sfx, [0, 25, 50, 75, 100]);
    else if (id === "vibrate") S.settings.vibrate = !S.settings.vibrate;
    savePrefs();
    return;
  }
  if (S.scene === "setup") {
    if (id === "prevChar") {
      SETUP_VIEW.char =
        (SETUP_VIEW.char + CHAR_KEYS.length - 1) % CHAR_KEYS.length;
      return;
    }
    if (id === "nextChar") {
      SETUP_VIEW.char = (SETUP_VIEW.char + 1) % CHAR_KEYS.length;
      return;
    }
    if (id === "confirmChar") {
      chooseChar(SETUP_VIEW.char);
      return;
    }
    if (id.startsWith("seatType")) {
      const i = +id.slice(8),
        s = S.seats[i];
      S.activeSeat = i;
      if (s.type === "human") {
        if (humanCount() <= 1) {
          SETUP_VIEW.notice = "至少需要保留一名真人玩家";
          SETUP_VIEW.noticeUntil = performance.now() + 1800;
          return;
        }
        s.type = "ai";
      } else if (s.type === "ai") s.type = "off";
      else s.type = "human";
      SETUP_VIEW.char = s.char;
      return;
    }
    if (id.startsWith("seat")) {
      S.activeSeat = +id.slice(4);
      SETUP_VIEW.char = S.seats[S.activeSeat].char;
      return;
    }
    if (id.startsWith("diff")) {
      const i = +id.slice(4);
      S.seats[i].diff = cycleVal(S.seats[i].diff, [
        "easy",
        "standard",
        "smart",
      ]);
      return;
    }
    if (id === "money") {
      S.money = cycleVal(S.money, [100000, 200000, 300000, 500000]);
      return;
    }
    if (id === "rounds") {
      S.rounds = cycleVal(S.rounds, [10, 20, 30, 45, 60]);
      return;
    }
    if (id === "startGame") {
      S.scene = "mapSelect";
      return;
    }
  }
  if (S.scene === "mapSelect") {
    if (id === "mapBack") {
      S.scene = "setup";
      return;
    }
    if (id.startsWith("chooseMap")) {
      S.mapIndex = +id.slice(9);
      return;
    }
    if (id === "mapNext") {
      S.scene = "rules";
      return;
    }
  }
  if (S.scene === "rules") {
    if (id === "rulesBack") {
      S.scene = "mapSelect";
      return;
    }
    if (id === "ruleMoney") {
      S.money = cycleVal(S.money, [100000, 200000, 300000, 500000]);
      return;
    }
    if (id === "ruleRounds") {
      S.rounds = cycleVal(S.rounds, [10, 20, 30, 45, 60]);
      return;
    }
    if (id === "ruleVictory") {
      S.victory = cycleVal(S.victory, ["assets", "survival"]);
      return;
    }
    if (id === "ruleCards") {
      S.startingCards = cycleVal(S.startingCards, [0, 1, 2, 3]);
      return;
    }
    if (id === "ruleEvents") {
      S.eventLevel = cycleVal(S.eventLevel, ["low", "standard", "high"]);
      return;
    }
    if (id === "ruleGods") {
      S.gods = !S.gods;
      return;
    }
    if (id === "launchGame") {
      makeBoard();
      S.scene = "game";
      if (cp().type === "ai") setTimeout(aiTurn, 700);
      return;
    }
  }
  if (S.scene === "result") {
    if (id === "resultHome") {
      S.scene = "home";
      S.board = null;
      resetHome();
      return;
    }
    if (id === "rematch") {
      makeBoard();
      S.scene = "game";
      if (cp().type === "ai") setTimeout(aiTurn, 700);
      return;
    }
  }
  if (S.scene === "game" && S.board && id.startsWith("shopItem")) {
    const p = cp(),
      si = +id.slice(8),
      tab = S.board.popup?.tab || "cards",
      stock = tab === "tools" ? S.board.toolStock : S.board.shopStock,
      c = stock?.[si],
      d = cardDef(c);
    const inventory = tab === "tools" ? (p.tools ||= []) : p.cards,
      capacity = tab === "tools" ? 8 : 15;
    if (c && p.tickets >= d.cost && inventory.length < capacity) {
      p.tickets -= d.cost;
      inventory.push(c);
      stock.splice(si, 1);
      addLog(`${p.id + 1}P 以 ${d.cost} 點券購買 ${d.name}`);
    }
    openPopup("shop", { tab });
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("shopTab")) {
    openPopup("shop", { tab: id === "shopTabTools" ? "tools" : "cards" });
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("branchChoice")) {
    const choice = S.board.popup?.choices?.[+id.slice(12)];
    if (Number.isInteger(choice)) chooseBranch(choice);
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("cardTile")) {
    const p = cp(), q = S.board.popup, index = +id.slice(8), c = p.cards[q?.cardIndex], t = S.board.tiles[index];
    if (q?.kind !== "cardTileTarget" || !q.targets.includes(index) || !t) return;
    if (c === "buyland") {
      const cost = buyCost(p, t);
      if (t.type !== "land" || t.owner >= 0 || p.cash < cost) {
        addLog("現金不足或該土地已無法購買");
        return;
      }
    }
    p.cards.splice(q.cardIndex, 1);
    if (c === "teleport") {
      p.pos = index;
      focus();
    } else if (c === "buyland" && t.type === "land" && t.owner < 0) {
      const cost = buyCost(p, t);
      p.cash -= cost; t.owner = p.id; markUpgrade(t);
    } else if (c === "upgrade" && t.type === "land" && t.owner === p.id && t.level < 5) {
      t.level++;
      markUpgrade(t);
    }
    addLog(`${p.id + 1}P 使用 ${cardDef(c).name}`);
    S.board.popup = null;
    saveGame();
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("playerTab")) {
    const tab = id.slice(9).toLowerCase();
    openPopup("playerDetail", { player: cp(), tab });
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("propertyJump")) {
    const tile = S.board.tiles[+id.slice(12)];
    if (tile) {
      S.board.popup = null;
      S.board.selectedTile = tile;
      S.board.cam.target = {
        x: Math.max(0, Math.min(MW - W, tile.x - W / 2)),
        y: Math.max(0, Math.min(MH - H, tile.y - H / 2)),
      };
    }
    return;
  }
  if (S.scene === "game" && S.board && id === "shopSell") {
    openPopup("shopSell", { tab: S.board.popup?.tab || "cards" });
    return;
  }
  if (S.scene === "game" && S.board && id === "shopSellBack") {
    openPopup("shop", { tab: S.board.popup?.tab || "cards" });
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("sellCard")) {
    const p = cp(),
      index = +id.slice(8),
      c = p.cards[index];
    if (c) {
      const d = cardDef(c);
      p.cards.splice(index, 1);
      p.tickets += Math.max(1, Math.floor(d.cost / 2));
      addLog(`${p.id + 1}P 出售 ${d.name}`);
    }
    openPopup("shopSell");
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("sellTool")) {
    const p = cp(), index = +id.slice(8), c = (p.tools || [])[index];
    if (c) {
      const d = toolDef(c);
      p.tools.splice(index, 1);
      p.tickets += Math.max(1, Math.floor(d.cost / 2));
      addLog(`${p.id + 1}P 出售 ${d.name}`);
    }
    openPopup("shopSell", { tab: "tools" });
    return;
  }
  if (S.scene === "game" && S.board && id === "bankDeposit") {
    const p = cp(),
      n = Math.min(10000, p.cash);
    p.cash -= n;
    p.bank = (p.bank || 0) + n;
    finishAction();
    return;
  }
  if (S.scene === "game" && S.board && id === "bankWithdraw") {
    const p = cp(),
      n = Math.min(10000, p.bank || 0);
    p.bank -= n;
    p.cash += n;
    finishAction();
    return;
  }
  if (
    S.scene === "game" &&
    S.board &&
    id === "upgrade" &&
    S.board.popup?.tile?.level >= 3
  ) {
    const p = cp(),
      t = S.board.popup.tile,
      cost = upgradeCost(t);
    if (t.level === 4) {
      openPopup("specialBuild", { tile: t });
      return;
    }
    if (t.level < 5 && p.cash >= cost) {
      p.cash -= cost;
      t.level++;
      markUpgrade(t);
      addLog(`${p.id + 1}P 將土地升到 Lv${t.level}`);
    }
    finishAction();
    return;
  }
  if (S.scene === "game" && S.board && id.startsWith("build")) {
    const q = S.board.popup,
      p = cp(),
      t = q?.tile;
    if (id === "buildCancel") {
      openPopup("tile", { tile: t });
      return;
    }
    const kind = { buildHotel: "hotel", buildMall: "mall", buildPark: "park" }[
      id
    ];
    if (q?.kind === "specialBuild" && t && kind) {
      const cost = upgradeCost(t);
      if (p.cash >= cost) {
        p.cash -= cost;
        t.level = 5;
        t.special = kind;
        markUpgrade(t);
        addLog(
          `${p.id + 1}P 完成${kind === "hotel" ? "星光旅館" : kind === "mall" ? "童話商場" : "祝福公園"}`,
        );
      }
      finishAction();
      return;
    }
  }
  if (S.scene === "game" && S.board) {
    const b = S.board,
      p = cp(),
      q = b.popup;
    if (id === "pause") {
      openPopup("pause");
      return;
    }
    if (id === "roster") {
      if (p.type === "human") openPopup("playerDetail", { player: p });
      return;
    }
    if (id === "rosterBack") {
      openPopup("playerDetail", { player: p });
      return;
    }
    if (id.startsWith("inspectPlayer")) {
      if (+id.slice(13) === p.id) openPopup("playerDetail", { player: p });
      return;
    }
    if (id === "focusCurrent") {
      focus();
      return;
    }
    if (id === "closeInspect") {
      b.popup = null;
      b.selectedTile = null;
      return;
    }
    if (id === "resume") {
      b.popup = null;
      return;
    }
    if (id === "saveHome") {
      saveGame();
      S.scene = "home";
      S.board = null;
      resetHome();
      return;
    }
    if (id === "roll") {
      rollDice();
      return;
    }
    if (id === "cards") {
      openPopup("cards", { page: 0 });
      return;
    }
    if (id === "cardsPrev" || id === "cardsNext") {
      const page = Math.max(0, (b.popup?.page || 0) + (id === "cardsNext" ? 1 : -1));
      openPopup("cards", { page });
      return;
    }
    if (id === "tools") {
      openPopup("tools");
      return;
    }
    if (id === "closeCards") {
      b.popup = null;
      return;
    }
    if (id === "closeTools") {
      b.popup = null;
      return;
    }
    if (id === "cardCancel") {
      openPopup("cards");
      return;
    }
    if (id.startsWith("cardDice")) {
      useChosenDice(+id.slice(8));
      return;
    }
    if (id.startsWith("cardTarget")) {
      useTargetCard(+id.slice(10));
      return;
    }
    if (id.startsWith("useCard")) {
      useCard(+id.slice(7));
      return;
    }
    if (id.startsWith("useTool")) {
      useTool(+id.slice(7));
      return;
    }
    if (id.startsWith("toolTile")) {
      const index = +id.slice(8), q = b.popup;
      if (q?.kind === "toolTileTarget" && q.targets.includes(index)) {
        p.tools.splice(q.toolIndex, 1);
        if (!b.roadblocks.includes(index)) b.roadblocks.push(index);
        addLog(`${p.id + 1}P 在第 ${index + 1} 格設置路障`);
        b.popup = null; saveGame();
      }
      return;
    }
    if (id.startsWith("toolTarget")) {
      const target = living().find((x) => x.id === +id.slice(10)), q = b.popup;
      if (q?.kind === "toolTarget" && target && target.id !== p.id) {
        p.tools.splice(q.toolIndex, 1);
        target.bombSteps = 12;
        addLog(`${p.id + 1}P 將定時炸彈交給 ${target.id + 1}P`);
        b.popup = null; saveGame();
      }
      return;
    }
    if (id === "buy") {
      const t = q.tile,
        cost = buyCost(p, t);
      if (p.cash >= cost) {
        p.cash -= cost;
        if (p.discount) p.discount = 0;
        t.owner = p.id;
        addLog(`${p.id + 1}P 購買 ${REGION_NAMES[t.region]} 土地`);
      }
      finishAction();
      return;
    }
    if (id === "upgrade") {
      const t = q.tile,
        cost = upgradeCost(t);
      if (t.level < 4 && p.cash >= cost) {
        p.cash -= cost;
        t.level++;
        markUpgrade(t);
        addLog(`${p.id + 1}P 將土地升到 Lv${t.level}`);
      }
      finishAction();
      return;
    }
    if (id === "pay") {
      const t = q.tile,
        r = rentFor(t, p);
      if (p.shield > 0) {
        p.shield--;
        addLog(`${p.id + 1}P 使用護盾免除租金`);
      } else {
        p.cash -= r;
        const o = b.players.find((x) => x.id === t.owner);
        if (o && !o.bankrupt) {
          o.cash += r;
          applyPropertyArrival(t, p, o);
        }
        addLog(`${p.id + 1}P 支付 $${r.toLocaleString()} 租金`);
      }
      finishAction();
      return;
    }
    if (id === "skip" || id === "ok") {
      finishAction();
      return;
    }
    if (id === "special") {
      applySpecial(q.tile, p);
      return;
    }
    if (id === "eventOk" || id === "npcOk" || id === "cardOk") {
      finishAction();
      return;
    }
    if (id === "releaseDetained") {
      const q = b.popup,
        cardId = q?.facility === "jail" ? "bail" : "hospitalpass",
        cardIndex = p.cards.indexOf(cardId);
      if (q?.detainedTurn && cardIndex >= 0) {
        p.cards.splice(cardIndex, 1);
        p.detained = null;
        p.skip = 0;
        addLog(`${p.id + 1}P 使用${cardDef(cardId).name}解除狀態`);
      }
      finishAction();
      return;
    }
    if (id === "shopBuy") {
      const c = shopCost(p);
      if (p.cash >= c) {
        p.cash -= c;
        drawCard(p);
        addLog(`${p.id + 1}P 購買卡片：${p.cards[p.cards.length - 1]}`);
      }
      finishAction();
      return;
    }
    if (id === "miniStop" || id === "miniPop" || id.startsWith("miniChest")) {
      let reward = 2200,
        tickets = 1;
      if (id.startsWith("miniChest")) {
        const pick = +id.slice(9),
          win = pick === (b.mini?.winningChest ?? 0);
        reward = win ? 7000 : 2800;
        tickets = win ? 2 : 1;
      } else {
        const dist = Math.abs((b.mini?.pos ?? 0) - 0.5);
        reward = dist < 0.07 ? 7000 : dist < 0.18 ? 4500 : 2200;
        tickets = dist < 0.18 ? 2 : 1;
      }
      if (p.char === 7) reward = Math.round(reward * 1.25);
      p.cash += reward;
      p.tickets += tickets;
      addLog(`${p.id + 1}P 小遊戲獲得 $${reward.toLocaleString()}`);
      finishAction();
      return;
    }
  }
}
const BOARD_INPUT = {
  active: false,
  moved: false,
  x: 0,
  y: 0,
  camX: 0,
  camY: 0,
};
C.addEventListener("pointerdown", (e) => {
  if (S.scene !== "game" || !S.board || S.board.popup || S.rolling) return;
  const p = pointerToGame(e);
  if (hit(p.x, p.y) || p.y < 205 || p.y > 650) return;
  BOARD_INPUT.active = true;
  BOARD_INPUT.moved = false;
  BOARD_INPUT.x = p.x;
  BOARD_INPUT.y = p.y;
  BOARD_INPUT.camX = S.board.cam.x;
  BOARD_INPUT.camY = S.board.cam.y;
  S.board.cam.target = null;
  try {
    C.setPointerCapture(e.pointerId);
  } catch (_) {}
});
C.addEventListener("pointermove", (e) => {
  if (!BOARD_INPUT.active || !S.board) return;
  const p = pointerToGame(e),
    dx = p.x - BOARD_INPUT.x,
    dy = p.y - BOARD_INPUT.y;
  if (Math.hypot(dx, dy) > 8) BOARD_INPUT.moved = true;
  if (BOARD_INPUT.moved) {
    S.board.cam.x = Math.max(0, Math.min(MW - W, BOARD_INPUT.camX - dx));
    S.board.cam.y = Math.max(0, Math.min(MH - H, BOARD_INPUT.camY - dy));
  }
});
C.addEventListener(
  "wheel",
  (e) => {
    if (S.scene !== "game" || !S.board || S.board.popup) return;
    e.preventDefault();
    S.board.cam.target = null;
    S.board.cam.x = Math.max(
      0,
      Math.min(MW - W, S.board.cam.x + e.deltaX + e.deltaY * 0.7),
    );
    S.board.cam.y = Math.max(0, Math.min(MH - H, S.board.cam.y + e.deltaY));
  },
  { passive: false },
);
C.addEventListener("pointerup", (e) => {
  audioGesture();
  const p = pointerToGame(e),
    button = hit(p.x, p.y);
  HOME.pressed = null;
  if (button) {
    BOARD_INPUT.active = false;
    sfx("click");
    action(button.id);
    return;
  }
  if (
    S.scene === "game" &&
    S.board &&
    !S.board.popup &&
    !S.rolling &&
    BOARD_INPUT.active &&
    !BOARD_INPUT.moved
  ) {
    const wx = p.x + S.board.cam.x,
      wy = p.y + S.board.cam.y,
      t = S.board.tiles.reduce((best, x) => {
        const visual = tileVisualPosition(x),
          d = Math.hypot(visual.x - wx, visual.y - wy);
        return d < (best?.d ?? 86) ? { tile: x, d } : best;
      }, null)?.tile;
    if (t) {
      S.board.selectedTile = t;
      openPopup("tileInspect", { tile: t });
      sfx("click");
    }
  }
  BOARD_INPUT.active = false;
});
C.addEventListener("pointercancel", () => {
  BOARD_INPUT.active = false;
});
function frame() {
  begin();
  if (S.scene === "home") home();
  else if (S.scene === "setup") setup();
  else if (S.scene === "mapSelect") mapSelect();
  else if (S.scene === "rules") rulesSetup();
  else if (S.scene === "game" && S.board) game();
  else if (S.scene === "result" && S.board) result();
  else if (S.scene === "help") help();
  else if (S.scene === "settings") settings();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
