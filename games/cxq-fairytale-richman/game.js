"use strict";
const EQUIPMENT_DEFS = [
  { id: "deed", name: "地契印章", group: "property", desc: "首次購地享有八折優惠。" },
  { id: "toolkit", name: "建築工具箱", group: "property", desc: "所有建築升級費用降低 12%。" },
  { id: "charm", name: "幸運徽章", group: "fortune", desc: "正向命運事件出現機率提高。" },
  { id: "guardian", name: "守護吊墜", group: "fortune", desc: "每 8 回合抵銷一次負面事件。" },
  { id: "bell", name: "收租鈴鐺", group: "income", desc: "收到的租金提高 10%。" },
  { id: "boots", name: "旅行靴", group: "movement", desc: "骰出 1 點時修正為 2 點。" },
  { id: "compass", name: "星願羅盤", group: "movement", desc: "每 6 回合可自動重投過低點數。" },
  { id: "manual", name: "修繕手冊", group: "defense", desc: "首次建築受損時抵銷降級。" },
];
function equipmentDef(id) { return EQUIPMENT_DEFS.find((item) => item.id === id); }
function hasEquipment(p, id) { return (p?.equipment || []).includes(id); }
function autoEquipmentForSeat(seat) {
  const byChar = [["charm","bell"],["compass","boots"],["guardian","compass"],["guardian","manual"],["deed","toolkit"],["boots","compass"],["deed","toolkit"],["charm","guardian"],["bell","deed"],["manual","guardian"]];
  seat.equipment = (byChar[seat.char] || ["deed","boots"]).slice(0, 2);
  return seat.equipment;
}
const EVENTS = [
  ["王國節慶", "節慶分紅收入", (p) => cashGain(p, 6000), "kingdomFestival", "positive"],
  ["幸運噴泉", "獲得旅行祝福金", (p) => cashGain(p, 4500), "luckyFountain", "positive"],
  ["市場熱潮", "名下土地帶來額外收入", (p) => cashGain(p, 2500 + ownedLands(p).length * 900), "marketBoom", "positive"],
  ["守護祝福", "下一次負面命運將被抵銷", (p) => (p.shield += 1), "guardianBlessing", "positive"],
  ["星光雨", "獲得大量星光獎金", (p) => cashGain(p, 7000), "starlightRain", "positive"],
  ["王國補助", "依目前回合獲得補助", (p) => cashGain(p, 2500 + S.board.round * 120), "kingdomSubsidy", "positive"],
  ["月光紅利", "獲得月光港紅利", (p) => cashGain(p, 5500), "moonlightDividend", "positive"],
  ["商會回饋", "依持有建築獲得回饋", (p) => cashGain(p, 3000 + ownedLands(p).reduce((n,t)=>n+t.level,0)*350), "merchantGuildReward", "positive"],
  ["精靈加護", "一塊自己的土地免費升級", (p) => upgradeRandomLand(p), "fairyBlessing", "positive"],
  ["突發修繕", "支付必要的建築維護費", (p) => (p.cash -= Math.min(6500, 2200 + ownedLands(p).length * 450)), "emergencyRepairs", "negative"],
  ["迷路", "沿道路後退兩格", (p) => (p.pos = (p.pos - 2 + S.board.tiles.length) % S.board.tiles.length), "lostInMaze", "negative"],
  ["惡作劇", "損失少量旅行資金", (p) => (p.cash -= 2500), "mischief", "negative"],
  ["稅務日", "依土地數支付王國稅金", (p) => (p.cash -= 1800 + ownedLands(p).length * 650), "taxDay", "negative"],
  ["道路施工", "下一次移動最多三步", (p) => (p.slow = 1), "roadConstruction", "negative"],
  ["魔法失控", "一棟建築可能降低一級", (p) => damageRandomLand(p), "magicMalfunction", "negative"],
  ["森林迷霧", "沿道路後退兩格", (p) => (p.pos = (p.pos - 2 + S.board.tiles.length) % S.board.tiles.length), "forestMist", "negative"],
  ["雲端順風", "沿道路前進兩格", (p) => (p.pos = (p.pos + 2) % S.board.tiles.length), "cloudTailwind", "positive"],
  ["土地維護", "支付名下土地維護費", (p) => (p.cash -= 1200 + ownedLands(p).length * 500), "landMaintenance", "negative"],
];
const baseScenePopup = scenePopup;
scenePopup = function (q, b, p) {
  if (q.kind === "facilityVisit") {
    const police = q.facility === "jail",
      title = police ? "童話警察局" : "童話醫院",
      helpers = police
        ? [["thief", "小偷", IM.npcThief], ["bandit", "強盜", IM.npcBandit]]
        : [["spy", "間諜", IM.npcSpy], ["hooligan", "流氓", IM.npcHooligan]],
      detained = b.players.filter((target) => !target.bankrupt && target.detained?.facility === q.facility);
    contain(IM.abilityPanel, 270, 50, 1060, 820, 0.99);
    fitTxt(`${title}｜協助中心`, 800, 112, 850, 38, "center", "#fff0a5", 1000, true, 22);
    paragraph("30 點券可協助一名玩家立即離開；300 點券可雇用一名特殊角色執行一次行動。", 800, 164, 820, 18, 27, 2, "center", "#fff", 900, true);
    txt(`目前點券 ${p.tickets}`, 800, 225, 22, "center", "#ffe16d", 1000, true);
    txt("協助離開｜30 點券", 510, 280, 24, "center", "#dceaff", 1000, true);
    if (!detained.length) txt("目前沒有可協助的玩家", 510, 360, 18, "center", "#aebbd2", 800, true);
    detained.slice(0, 3).forEach((target, i) =>
      btn(`facilityRelease${target.id}`, `${target.id + 1}P ${CHAR_NAMES[target.char]}｜剩 ${target.detained.turns} 回合`, 315, 315 + i * 82, 390, 62, p.tickets >= 30),
    );
    txt("特殊角色｜300 點券", 1030, 280, 24, "center", "#dceaff", 1000, true);
    helpers.forEach(([id, name, art], i) => {
      contain(art, 790 + i * 250, 310, 200, 230, 1);
      btn(`facilityHelper${id}`, `雇用${name}`, 790 + i * 250, 535, 200, 62, p.tickets >= 300);
    });
    btn("facilityLeave", "離開", 650, 740, 300, 66, true);
    return true;
  }
  if (q.kind === "surrenderConfirm") {
    contain(IM.abilityPanel, 400, 115, 800, 650, 0.99);
    txt("確認認輸", 800, 205, 40, "center", "#ffd2a0", 1000, true);
    paragraph("認輸後會出售全部土地並退出本局；若仍有兩名以上玩家，才會進入死神召喚選擇。", 800, 300, 610, 20, 32, 3, "center", "#fff", 900, true);
    btn("surrenderConfirm", "確認退出本局", 520, 525, 560, 76, false);
    btn("surrenderCancel", "取消", 650, 635, 300, 64, true);
    return true;
  }
  if (q.kind === "deathTarget") {
    contain(IM.abilityPanel, 360, 75, 880, 760, 0.99);
    txt("魔法屋｜死神召喚", 800, 150, 40, "center", "#e7d1ff", 1000, true);
    paragraph("選擇一名仍在場的玩家。死神會清除其卡片與道具並跟隨 13 回合；也可以放棄召喚。", 800, 220, 650, 19, 29, 3, "center", "#fff", 900, true);
    living().forEach((target, i) =>
      btn("deathTarget" + target.id, `${target.id + 1}P ${CHAR_NAMES[target.char]}`, 500, 335 + i * 82, 600, 64, i === 0),
    );
    btn("deathSkip", "不召喚死神", 650, 710, 300, 62, false);
    return true;
  }
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
    const lines = owner
      ? [
          `土地價值　$${t.price.toLocaleString()}`,
          `建築狀態　${t.level >= 5 ? `${CHAR_NAMES[owner.char]}專屬地標` : `Lv${t.level} ${t.level ? "建築" : "空地"}`}`,
          `目前租金　$${rentEstimate(t, p).toLocaleString()}`,
          mine && t.level < 5 ? `下階費用　$${cost.toLocaleString()}` : mine ? "已達最高建築階級" : "抵達後必須支付租金",
        ]
      : [
          `售價　　　$${buy.toLocaleString()}`,
          `基礎租金　$${baseRent(t).toLocaleString()}`,
          "購買後可逐級興建",
          "Lv5 建成地主角色的專屬地標",
        ];
    lines.forEach((line, i) =>
      fitTxt(line, 1010, 275 + i * 62, 475, 23, "center", i === 2 ? "#ffe477" : "#fff", 900, true, 15),
    );
    if (!owner) {
      btn("buy", (p.effects || []).some((e) => e.kind === "死神") ? "死神附身｜無法購地" : `購買土地　$${buy.toLocaleString()}`, 795, 555, 430, 72, true);
      btn("skip", "暫時略過", 795, 650, 430, 68, false);
    } else if (mine) {
      if (t.level < 5)
        btn("upgrade", (p.effects || []).some((e) => e.kind === "死神") ? "死神附身｜無法加建" : t.level === 4 ? `建成${CHAR_NAMES[p.char]}專屬地標` : `升級至 Lv${t.level + 1}`, 795, 555, 430, 72, true);
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
    txt(`道具 ${(p.tools || []).length}/8｜遙控骰子、車輛、路障與定時炸彈`, 800, 145, 17, "center", "#fff", 900, true);
    if (q.error) fitTxt(q.error, 800, 171, 920, 15, "center", "#ffcf8a", 1000, true, 11);
    (p.tools || []).slice(0, 8).forEach((c, i) =>
      richTool(c, 270 + (i % 4) * 270, 185 + Math.floor(i / 4) * 270, 200, 240, "useTool" + i),
    );
    btn("closeTools", "返回棋盤", 650, 760, 300, 65, true);
    return true;
  }
  if (q.kind === "toolTarget") {
    contain(IM.abilityPanel, 400, 110, 800, 680, 0.99);
    txt(toolDef(p.tools[q.toolIndex]).name, 800, 185, 38, "center", "#fff0a5", 1000, true);
    living().filter((x) => x.id !== p.id && !(x.bombSteps > 0)).forEach((x, i) =>
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
    contain(IM.abilityPanel, 250, 55, 1100, 800, 0.99);
    contain(IM["portrait" + x.char], 315, 125, 180, 180);
    fitTxt(
      `${x.id + 1}P ${CHAR_NAMES[x.char]}`,
      525,
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
      525,
      165,
      19,
      "left",
      "#d9efff",
      900,
      true,
    );
    btn("playerTabOverview", "總覽", 520, 215, 180, 54, tab === "overview");
    btn("playerTabLands", "地產", 710, 215, 180, 54, tab === "lands");
    btn("playerTabEquipment", "裝備", 900, 215, 180, 54, tab === "equipment");
    btn("playerTabEffects", "狀態", 1090, 215, 180, 54, tab === "effects");
    const rows = [
      `現金　$${x.cash.toLocaleString()}`,
      `總資產　$${netWorth(x).toLocaleString()}`,
      `土地　${lands.length}　｜建築層數　${buildings}`,
      `常駐裝備　${(x.equipment || []).map((id) => equipmentDef(id)?.name).filter(Boolean).join("、") || "無"}`,
      `狀態／神明　${effect}`,
    ];
    if (tab === "overview")
      rows.forEach((s, i) =>
        fitTxt(
          s,
          500,
          330 + i * 66,
          700,
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
    if (tab === "equipment") {
      (x.equipment || []).slice(0, 2).forEach((id, i) => {
        const def = equipmentDef(id), ex = 480 + i * 360;
        contain(IM["equip_" + id], ex + 15, 315, 190, 190, 1);
        fitTxt(def?.name || "常駐裝備", ex + 110, 548, 260, 23, "center", "#fff0a5", 1000, true, 15);
        paragraph(def?.desc || "", ex + 110, 588, 245, 15, 22, 3, "center", "#fff", 850, true);
      });
      if (!(x.equipment || []).length)
        txt("目前沒有攜帶常駐裝備", 800, 460, 22, "center", "#fff", 900, true);
    }
    if (tab === "effects") {
      const statuses = [
        ...(x.effects || []).map((e) => `${e.kind}｜剩餘 ${e.turns} 回合`),
        x.shield ? `護盾｜可抵銷 ${x.shield} 次` : "",
        x.skip ? `暫停｜剩餘 ${x.skip} 回合` : "",
        hasEquipment(x, "guardian") ? `守護徽章｜${(x.guardianReadyAt || 0) <= b.round ? "可發動" : `${x.guardianReadyAt - b.round} 回合後恢復`}` : "",
        hasEquipment(x, "compass") ? `星辰羅盤｜${(x.compassReadyAt || 0) <= b.round ? "可發動" : `${x.compassReadyAt - b.round} 回合後恢復`}` : "",
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
    desc: "獲得祝福金並免費升級一塊土地",
    apply: (p) => { cashGain(p, 5000); upgradeRandomLand(p); },
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
    desc: "封鎖收入並跟隨 13 回合",
    apply: (p) => {
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
const TRANSIENT_NPCS = new Set(["乞丐", "惡犬"]);
function makeMapRoute({ cx, cy, rx, ry, startAngle = Math.PI / 2 }) {
  return Array.from({ length: 36 }, (_, i) => {
    const angle = startAngle + (i * Math.PI * 2) / 36;
    return [
      Math.round(cx + Math.cos(angle) * rx),
      Math.round(cy + Math.sin(angle) * ry),
    ];
  });
}
const MAP_ROUTES = Object.fromEntries(
  MAPS.map((map) => [map.key, makeMapRoute(map.road)]),
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
  "start", "land", "event", "land", "land", "land",
  "event", "land", "land", "land", "event", "land",
  "magic", "land", "event", "land", "land", "land",
  "event", "land", "land", "land", "event", "land",
  "magic", "land", "event", "land", "land", "land",
  "event", "land", "land", "land", "event", "land",
];
function cashGain(p, n) {
  if ((p.effects || []).some((effect) => effect.kind === "死神")) {
    addLog(`${p.id + 1}P 的收入被死神吞噬`);
    return;
  }
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
  return NPC_DEFS.some((d) => d.name === effect?.kind) && !TRANSIENT_NPCS.has(effect?.kind);
}
function releaseGod(name, nearPos = 0) {
  const b = S.board;
  if (!b?.gods || !name || name === "死神" || b.npcs.some((n) => n.name === name)) return;
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
    else if (e.kind === "福神" && Math.random() < 0.35) {
      cashGain(p, 1500);
      upgradeRandomLand(p);
    }
    else if (e.kind === "衰神") p.slow = 1;
    else if (e.kind === "死神") p.cash = Math.max(0, p.cash - 1200);
  }
  const expired = (p.effects || []).filter((e) => e.turns <= 1 && isGodEffect(e));
  p.effects = (p.effects || [])
    .map((e) => ({ ...e, turns: e.turns - 1 }))
    .filter((e) => e.turns > 0);
  for (const e of expired) {
    if (e.kind === "死神") {
      addLog(`死神離開 ${p.id + 1}P，返回魔法世界`);
      continue;
    }
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
  if (a.length) {
    const t = a[Math.floor(Math.random() * a.length)];
    t.level--;
    if (t.level < 5) t.special = null;
    markUpgrade(t);
  }
}
function ownedLands(p) {
  return S.board?.tiles.filter((t) => t.type === "land" && t.owner === p.id) || [];
}
function damageRandomLand(p) {
  const lands = ownedLands(p).filter((t) => t.level > 0);
  if (!lands.length) return;
  if (hasEquipment(p, "manual") && !p.manualUsed) {
    p.manualUsed = true;
    addLog(`${p.id + 1}P 的修繕手冊抵銷一次建築受損`);
    return;
  }
  const t = lands[Math.floor(Math.random() * lands.length)];
  t.level--;
  if (t.level < 5) t.special = null;
  markUpgrade(t);
}
function addLog(s) {
  S.board.log.push(s);
  if (S.board.log.length > 8) S.board.log.shift();
  S.msg = s;
}
const TURN_PHASES = new Set([
  "turn-start",
  "pre-roll",
  "rolling",
  "moving",
  "branch-choice",
  "arrival",
  "awaiting-confirmation",
  "turn-end",
]);
function setTurnPhase(next) {
  if (!S.board || !TURN_PHASES.has(next)) return false;
  S.board.phase = next;
  return true;
}
function openPopup(kind, data = {}) {
  S.board.popup = { kind, openedAt: performance.now(), ...data };
  if (
    S.board.phase === "arrival" ||
    (S.board.phase === "turn-start" && data.detainedTurn)
  )
    setTurnPhase("awaiting-confirmation");
}
function typeName(t) {
  return (
    {
      start: "起點",
      land: "土地",
      event: "命運",
      news: "新聞",
      magic: "魔法屋",
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
  if (hasEquipment(p, "deed") && !p.deedUsed) c = Math.round(c * 0.8);
  return c;
}
function upgradeCost(t, p = null) {
  const nextLevel = Math.min(5, (t.level || 0) + 1);
  let cost = t.price * (0.61 + nextLevel * 0.07) * marketIndex();
  if (hasEquipment(p || (S.board ? cp() : null), "toolkit")) cost *= 0.88;
  return Math.round(cost);
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
  if ((owner?.effects || []).some((e) => e.kind === "死神")) return 0;
  if (owner?.char === 8) r = Math.round(r * 1.15);
  if (hasEquipment(owner, "bell")) r = Math.round(r * 1.1);
  if (owner?.rentBoost) {
    r = Math.round(r * 1.5);
    owner.rentBoost = 0;
  }
  if (payer?.char === 3) r = Math.round(r * 0.8);
  if ((payer?.effects || []).some((e) => e.kind === "財神")) r = 0;
  if ((payer?.effects || []).some((e) => e.kind === "窮神")) r = Math.round(r * 2);
  if ((payer?.effects || []).some((e) => e.kind === "死神")) r = Math.round(r * 2);
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
  if ((owner?.effects || []).some((e) => e.kind === "死神")) return 0;
  if (owner?.char === 8) r = Math.round(r * 1.15);
  if (hasEquipment(owner, "bell")) r = Math.round(r * 1.1);
  if (owner?.rentBoost) r = Math.round(r * 1.5);
  if (payer?.char === 3) r = Math.round(r * 0.8);
  if ((payer?.effects || []).some((e) => e.kind === "財神")) r = 0;
  if ((payer?.effects || []).some((e) => e.kind === "窮神")) r = Math.round(r * 2);
  if ((payer?.effects || []).some((e) => e.kind === "死神")) r = Math.round(r * 2);
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
  else if (t.special === "mall") owner.cash += 1800;
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
    if (t.level < 5) t.special = null;
    markUpgrade(t);
    addLog(`惡魔拆除第 ${t.index + 1} 格一層建築`);
  }
}
function netWorth(p) {
  let v = p.cash;
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
    pool = NPC_DEFS.filter((n) => !["乞丐", "惡犬", "死神"].includes(n.name)),
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
    equipment: [...(S.seats[si].equipment || [])],
    cash: S.money + (S.seats[si].char === 9 ? 2000 : 0),
    pos: 0,
    shield: 0,
    bankrupt: false,
    effects: [],
    hopeUsed: false,
    skip: 0,
    slow: 0,
    diceCount: 1,
    direction: 1,
    deedUsed: false,
    manualUsed: false,
    guardianReadyAt: 1,
    compassReadyAt: 1,
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
    gods: S.gods,
    tiles,
    players,
    turn: 0,
    round: 1,
    phase: "pre-roll",
    cam: { x: 650, y: 900, target: null },
    popup: null,
    buildAnim: null,
    selectedTile: null,
    log: [`${mapRules.name}冒險開始！`],
    winner: null,
    npcs: [],
    turnBanner: { player: 0, start: performance.now() },
  };
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
  const companion = !TRANSIENT_NPCS.has(name),
    old = (p.effects || []).find(isGodEffect);
  if (old) {
    p.effects = p.effects.filter((e) => e !== old);
    releaseGod(old.kind, p.pos);
    addLog(`${old.kind}離開 ${p.id + 1}P，由${name}接替附身`);
  }
  n.apply(p);
  if (companion && !(p.effects || []).some((e) => e.kind === name))
    attachEffect(p, name, ["死神"].includes(name) ? 13 : 7);
  S.board.npcs = S.board.npcs.filter((x) => x.name !== name);
  openPopup("npc", { name: n.name, desc: n.desc });
  addLog(
    companion
      ? `${p.id + 1}P 遇到${n.name}，將跟隨角色並持續發揮效果`
      : `${p.id + 1}P 遇到${n.name}，立即結算路上事件`,
  );
}
function surrenderPlayer(p) {
  if (!p || p.bankrupt) return;
  p.bankrupt = true;
  p.cash = 0;
  p.effects = [];
  S.board.tiles.forEach((tile) => {
    if (tile.owner === p.id) {
      tile.owner = -1;
      tile.level = 0;
      tile.special = null;
    }
  });
  addLog(`${p.id + 1}P 認輸並退出本局`);
}
function summonDeathGod(target) {
  if (!target || target.bankrupt) return false;
  const former = (target.effects || []).find(isGodEffect);
  if (former) releaseGod(former.kind, target.pos);
  target.effects = (target.effects || []).filter((effect) => !isGodEffect(effect));
  attachEffect(target, "死神", 13);
  addLog(`魔法屋召喚死神附身 ${target.id + 1}P，持續 13 回合`);
  return true;
}
function resolveTile() {
  const b = S.board,
    p = cp(),
    t = b.tiles[p.pos],
    n = npcAt(p.pos);
  setTurnPhase("arrival");
  if (n) {
    applyNPCByName(n.name, p);
    return;
  }
  if (t.type === "start") {
    addLog(`${p.id + 1}P 停留起點休息`);
  }
  applyGodArrival(t, p);
  if (p.type === "ai" && !["start", "land"].includes(t.type)) {
    applySpecial(t, p);
    return;
  }
  openPopup("tile", { tile: t });
  if (p.type === "ai") aiResolve();
}
function applySpecial(t, p) {
  if (t.type === "event") {
    const weighted = hasEquipment(p, "charm")
      ? [...EVENTS, ...EVENTS.filter((event) => event[4] === "positive")]
      : EVENTS,
      e = weighted[Math.floor(Math.random() * weighted.length)],
      negative = e[4] === "negative",
      guardianReady = hasEquipment(p, "guardian") && S.board.round >= (p.guardianReadyAt || 1),
      protectedByShield = negative && (p.shield > 0 || guardianReady);
    if (guardianReady && negative) p.guardianReadyAt = S.board.round + 8;
    if (protectedByShield && p.shield > 0) p.shield--;
    else e[2](p);
    openPopup("event", {
      name: "命運事件｜" + e[0],
      desc: protectedByShield ? `${guardianReady ? "守護吊墜" : "守護效果"}生效，已抵銷「${e[0]}」。` : e[1],
      art: e[3] || null,
    });
    addLog(
      protectedByShield
        ? `${p.id + 1}P 抵銷 ${e[0]}`
        : `${p.id + 1}P：${e[0]}・${e[1]}`,
    );
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
  }
}
function releaseDetainedPlayer(visitor, target) {
  if (!target?.detained || visitor.tickets < 30) return false;
  visitor.tickets -= 30;
  target.detained = null;
  target.skip = 0;
  addLog(`${visitor.id + 1}P 使用 30 點券協助 ${target.id + 1}P 立即離開`);
  return true;
}
function applyFacilityHelper(visitor, helper) {
  if (visitor.tickets < 300) return "點券不足，無法雇用。";
  const opponents = living().filter((target) => target.id !== visitor.id);
  if (!opponents.length) return "目前沒有可執行行動的對手。";
  visitor.tickets -= 300;
  const richest = opponents.slice().sort((a, b) => netWorth(b) - netWorth(a))[0];
  if (helper === "thief" || helper === "spy") {
    const stock = [...richest.cards.map((id) => ({ id, kind: "card" })), ...richest.tools.map((id) => ({ id, kind: "tool" }))];
    if (!stock.length) return `${helper === "thief" ? "小偷" : "間諜"}查探後發現對手沒有卡片或道具。`;
    const item = stock[Math.floor(Math.random() * stock.length)], source = item.kind === "card" ? richest.cards : richest.tools,
      destination = item.kind === "card" ? visitor.cards : visitor.tools;
    source.splice(source.indexOf(item.id), 1);
    if (destination.length < 15) destination.push(item.id);
    return `${helper === "thief" ? "小偷" : "間諜"}從 ${richest.id + 1}P 取得${item.kind === "card" ? "卡片" : "道具"}「${cardDef(item.id).name}」。`;
  }
  if (helper === "bandit") {
    const amount = Math.min(10000, Math.max(0, richest.cash));
    richest.cash -= amount;
    cashGain(visitor, amount);
    return `強盜從 ${richest.id + 1}P 取回 $${amount.toLocaleString()}。`;
  }
  const land = S.board.tiles.filter((tile) => tile.owner === richest.id && tile.level > 0).sort((a, b) => b.level - a.level)[0];
  if (!land) return "流氓巡查後沒有找到可破壞的建築。";
  land.level--;
  if (land.level < 5) land.special = null;
  markUpgrade(land);
  return `流氓使 ${richest.id + 1}P 的一棟建築降低一級。`;
}
function resolveAIFacility(p, facility) {
  const detained = S.board.players.filter((target) => !target.bankrupt && target.detained?.facility === facility),
    ally = detained.find((target) => target.id === p.id) || detained.find((target) => target.type === "ai");
  let desc = "完成例行拜訪，沒有使用點券。";
  if (ally && p.tickets >= 30 && releaseDetainedPlayer(p, ally)) desc = `使用 30 點券協助 ${ally.id + 1}P 立即離開。`;
  else if (p.tickets >= 300) {
    const helper = facility === "jail" ? (Math.random() < 0.5 ? "thief" : "bandit") : (Math.random() < 0.5 ? "spy" : "hooligan");
    desc = applyFacilityHelper(p, helper);
  }
  openPopup("event", { name: facility === "jail" ? "AI 警察局決策" : "AI 醫院決策", desc, aiDecision: true });
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
  const facilityType = facility === "jail" ? "police" : "hospital",
    facilityTile = S.board.tiles.find((tile) => tile.type === facilityType);
  if (facilityTile) {
    p.pos = facilityTile.index;
    focus();
  }
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
      if (t.level < 5) t.special = null;
      addLog(`${p.id + 1}P 變賣房屋籌措資金`);
    }
  }
  const lands = S.board.tiles.filter((t) => t.owner === p.id);
  for (const t of lands) {
    if (p.cash >= 0) break;
    p.cash += Math.round(t.price * 0.55);
    t.owner = -1;
    t.level = 0;
    t.special = null;
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
        t.special = null;
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
  setTurnPhase("turn-end");
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
  b.resultAnimStart = performance.now();
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
  setTurnPhase("turn-start");
  tickEffects(p);
  if (p.skip > 0) {
    p.skip--;
    openPopup("event", { name: "暫停回合", desc: `${p.id + 1}P 本回合休息，尚餘 ${p.skip} 回合。`, detainedTurn: true });
    return;
  }
  focus();
  setTurnPhase("pre-roll");
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
  const old = p.pos, from = b.tiles[old], to = b.tiles[next], dur = ANIMATION_MIN_MS + 20;
  p.pos = next;
  p.moveAnim = { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y }, start: performance.now(), dur };
  move.remaining--;
  move.branchHandledAt = old;
  sfx("step");
  if (p.pos === 0 && old !== 0) {
    cashGain(p, 5000);
    addLog(`${p.id + 1}P 通過起點 +$5,000`);
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
    setTurnPhase("branch-choice");
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
  setTurnPhase("moving");
  b.pendingMove = { remaining: steps, branchHandledAt: -1 };
  advanceMovement();
}
function resolveDiceRoll(results, p) {
  const faces = results.map((value) => Math.max(1, Math.min(6, Number(value) || 1))),
    adjustments = [];
  let rolledTotal = faces.reduce((sum, value) => sum + value, 0);
  if (hasEquipment(p, "compass") && rolledTotal <= 2 && S.board.round >= (p.compassReadyAt || 1)) {
    faces[0] = 3 + Math.floor(Math.random() * 4);
    rolledTotal = faces.reduce((sum, value) => sum + value, 0);
    p.compassReadyAt = S.board.round + 6;
    adjustments.push(`星願羅盤：重新投擲為 ${rolledTotal} 點`);
  }
  let finalSteps = rolledTotal;
  if (hasEquipment(p, "boots") && finalSteps === 1) {
    finalSteps = 2;
    adjustments.push("旅行靴：最低前進 2 步");
  }
  if (p.char === 1 && finalSteps === 1 && Math.random() < 0.5) {
    finalSteps = 2;
    adjustments.push("角色能力：最低前進 2 步");
  }
  if (p.char === 5 && finalSteps <= 2 && Math.random() < 0.3) {
    finalSteps = 3;
    adjustments.push("角色能力：低點數改為 3 步");
  }
  if (p.slow) {
    const before = finalSteps;
    finalSteps = Math.min(finalSteps, 3);
    p.slow = 0;
    if (finalSteps !== before) adjustments.push("衰神：本回合最多前進 3 步");
  }
  return { faces, rolledTotal, finalSteps, adjustments };
}
function rollDice() {
  if (
    S.rolling ||
    !S.board ||
    S.board.popup ||
    S.board.winner ||
    S.board.phase !== "pre-roll"
  ) return;
  const p = cp();
  S.board.turnBanner = null;
  setTurnPhase("rolling");
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
      const resolution = resolveDiceRoll(results, p);
      S.forcedDice = 0;
      S.rollResolution = resolution;
      S.diceResults = resolution.faces;
      S.diceAnim.results = resolution.faces;
      S.diceAnim.resolution = resolution;
      S.diceAnim.settleAt = performance.now();
      S.dice = resolution.faces[0];
      if (p.vehicleTurns > 0 && --p.vehicleTurns === 0) {
        p.diceCount = 1;
        p.vehicle = null;
      }
      sfx("dice");
      if (S.settings.vibrate && navigator.vibrate)
        navigator.vibrate([24, 35, 32]);
      addLog(
        `${p.id + 1}P 擲出 ${resolution.faces.join("＋")}，` +
          (resolution.finalSteps === resolution.rolledTotal
            ? `前進 ${resolution.finalSteps} 步`
            : `原始 ${resolution.rolledTotal} 點，修正為 ${resolution.finalSteps} 步`),
      );
      setTimeout(() => {
        S.diceAnim = null;
        S.rolling = false;
        moveSteps(resolution.finalSteps);
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
          reserve = easy ? 70000 : smart ? 25000 : 45000,
          canInvest = !(p.effects || []).some((e) => e.kind === "死神");
        if (canInvest && p.cash - cost > reserve) {
          p.cash -= cost;
          if (hasEquipment(p, "deed") && !p.deedUsed) p.deedUsed = true;
          t.owner = p.id;
          addLog(`${p.id + 1}P 購買 ${REGION_NAMES[t.region]} 土地`);
        }
        openPopup("event", { name: "AI 購地決策", desc: t.owner === p.id ? `${p.id + 1}P 購買了這塊土地。` : `${p.id + 1}P 決定保留資金。`, art: "systemLandPurchase", aiDecision: true });
        return;
      }
      if (t.owner === p.id) {
        const cost = upgradeCost(t, p),
          want =
            !(p.effects || []).some((e) => e.kind === "死神") &&
            t.level < 5 &&
            p.cash - cost > (easy ? 90000 : smart ? 30000 : 55000);
        if (want) {
          p.cash -= cost;
          t.level++;
          if (t.level === 5) t.special = null;
          markUpgrade(t);
          addLog(`${p.id + 1}P 將土地升到 Lv${t.level}`);
        }
        openPopup("event", { name: "AI 建築決策", desc: want ? `${p.id + 1}P 將房屋升至 Lv${t.level}。` : `${p.id + 1}P 本回合不升級。`, art: "systemBuildUpgrade", aiDecision: true });
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
      openPopup("event", { name: "AI 租金結算", desc: `${p.id + 1}P 完成租金結算，請確認後繼續。`, art: "systemRentPayment", aiDecision: true });
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
  if (!p || p.type !== "ai" || S.board.popup || S.board.winner || S.board.phase !== "pre-roll") return;
  // The streamlined ruleset has no in-match inventory. AI equipment is passive,
  // so its only pre-roll decision is when to begin the physical dice sequence.
  // Keeping this path inventory-free prevents migrated saves from reactivating
  // removed card, tool, vehicle, roadblock or bomb behaviour.
  setTimeout(() => {
    if (cp() === p && p.type === "ai" && !S.board.popup && S.board.phase === "pre-roll")
      rollDice();
  }, p.diff === "easy" ? 520 : p.diff === "smart" ? 240 : 360);
}
function useTool(i) {
  const p = cp(), c = (p.tools || [])[i], d = toolDef(c);
  if (!c || !d || S.board.phase !== "pre-roll") return;
  if (c === "remote") {
    if (p.type === "human") {
      openPopup("toolDice", { toolIndex: i });
      return;
    }
    const candidates = Array.from({ length: 6 }, (_, n) => {
      const steps = n + 1,
        tile = S.board.tiles[(p.pos + steps * (p.direction || 1) + S.board.tiles.length) % S.board.tiles.length];
      let score = 0;
      if (tile.type === "land" && tile.owner < 0) score += 8;
      if (tile.type === "land" && tile.owner === p.id) score += 5;
      if (["card", "coupon", "minigame"].includes(tile.type)) score += 4;
      if (tile.type === "event") score += p.diff === "easy" ? 1 : -1;
      if (tile.type === "land" && tile.owner >= 0 && tile.owner !== p.id) score -= 7;
      if (npcAt(tile.index)) score += ["財神", "福神", "土地公", "天使"].includes(npcAt(tile.index).name) ? 5 : -5;
      return { steps, score };
    }).sort((a, b) => b.score - a.score || b.steps - a.steps);
    p.tools.splice(i, 1);
    S.forcedDice = candidates[0].steps;
    addLog(`${p.id + 1}P 使用遙控骰子設定 ${S.forcedDice} 點`);
    return;
  }
  if (c === "roadblock") {
    const occupied = new Set([
      ...living().map((x) => x.pos),
      ...(S.board.npcs || []).map((x) => x.pos),
      ...(S.board.roadblocks || []),
    ]),
      targets = Array.from({ length: 6 }, (_, n) => (p.pos + n + 1) % S.board.tiles.length)
        .filter((pos) => !occupied.has(pos));
    if (!targets.length) {
      openPopup("tools", { error: "前方六格目前沒有可放置路障的位置。" });
      return;
    }
    openPopup("toolTileTarget", { toolIndex: i, targets });
    return;
  }
  if (c === "bomb") {
    if (!living().some((x) => x.id !== p.id && !(x.bombSteps > 0))) {
      openPopup("tools", { error: "目前沒有可裝上定時炸彈的對手。" });
      return;
    }
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
  if (!c || S.board.phase !== "pre-roll") return;
  if (p.type === "human" && ["swap", "stop", "reverse", "snatch"].includes(c)) {
    if (c === "snatch" && !living().some((x) => x.id !== p.id && x.cards.length)) {
      openPopup("cards", { page: Math.floor(i / 8), error: "目前沒有持有卡片的對手可供搶奪。" });
      return;
    }
    openPopup("cardTarget", { cardIndex: i, card: c });
    return;
  }
  if (p.type === "human" && ["teleport", "buyland", "upgrade", "demolition"].includes(c)) {
    let targets;
    if (c === "buyland") {
      const underfoot = S.board.tiles[p.pos];
      targets = underfoot?.type === "land" && underfoot.owner < 0 ? [p.pos] : [];
    } else if (c === "upgrade") {
      targets = S.board.tiles.filter((t) => t.type === "land" && t.owner === p.id && t.level < 5).map((t) => t.index);
    } else if (c === "demolition") {
      targets = S.board.tiles.filter((t) => t.type === "land" && t.owner >= 0 && t.owner !== p.id && t.level > 0).map((t) => t.index);
    } else targets = Array.from({ length: 8 }, (_, n) => (p.pos + n + 1) % S.board.tiles.length);
    if (!targets.length) {
      openPopup("cards", { page: Math.floor(i / 8), error: c === "buyland" ? "購地卡只能用於腳下的無主土地。" : c === "demolition" ? "目前沒有可拆除的對手建築。" : "目前沒有可以升級的房屋。" });
      return;
    }
    openPopup("cardTileTarget", { cardIndex: i, targets });
    return;
  }
  p.cards.splice(i, 1);
  if (c === "shield") p.shield++;
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
  else if (c === "equalize") {
    const participants = living(),
      total = participants.reduce((sum, player) => sum + Math.max(0, player.cash), 0),
      share = Math.floor(total / participants.length),
      remainder = total - share * participants.length;
    participants.forEach((player, index) => {
      player.cash = share + (index === 0 ? remainder : 0);
    });
  }
  else if (c === "demolition") {
    const target = S.board.tiles
      .filter((t) => t.type === "land" && t.owner >= 0 && t.owner !== p.id && t.level > 0)
      .sort((a, b) => b.level - a.level)[0];
    if (target) {
      target.level--;
      if (target.level < 5) target.special = null;
    }
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
  } else if (c === "reverse") {
    const o = living().filter((x) => x.id !== p.id).sort((a, b) => netWorth(b) - netWorth(a))[0];
    if (o) o.direction = -(o.direction || 1);
  } else if (c === "snatch") {
    const o = living().filter((x) => x.id !== p.id && x.cards.length).sort((a, b) => b.cards.length - a.cards.length)[0];
    if (o && p.cards.length < 15) p.cards.push(o.cards.splice(Math.floor(Math.random() * o.cards.length), 1)[0]);
  }
  addLog(`${p.id + 1}P 使用 ${d.name}`);
  S.board.popup = null;
  saveGame();
}
function useChosenDice(n) {
  const p = cp(),
    q = S.board.popup,
    i = q?.toolIndex;
  if (S.board.phase !== "pre-roll" || q?.kind !== "toolDice" || p.tools[i] !== "remote")
    return;
  p.tools.splice(i, 1);
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
  if (S.board.phase !== "pre-roll" || q?.kind !== "cardTarget" || !o || !["swap", "stop", "reverse", "snatch"].includes(c)) return;
  if (c === "snatch" && (!o.cards.length || p.cards.length >= 15)) return;
  p.cards.splice(i, 1);
  if (c === "swap") {
    const z = p.pos;
    p.pos = o.pos;
    o.pos = z;
    focus();
  } else if (c === "stop") o.skip++;
  else if (c === "reverse") o.direction = -(o.direction || 1);
  else if (c === "snatch") p.cards.push(o.cards.splice(Math.floor(Math.random() * o.cards.length), 1)[0]);
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
        version: 3,
        seats: S.seats,
        mapIndex: S.mapIndex,
        money: S.money,
        rounds: S.rounds,
        victory: S.victory,
        eventLevel: S.eventLevel,
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
    S.board.selectedTile = null;
    S.board.npcs = S.board.npcs || [];
    setTurnPhase("pre-roll");
    const savedRoute = MAP_ROUTES[MAPS[S.mapIndex]?.key] || MAP_ROUTES.starwish;
    const currentTypes = adjustedTypes(MAPS[S.mapIndex] || MAPS[0]);
    S.board.tiles.forEach((t, i) => {
      t.index = i;
      t.type = currentTypes[i] || "land";
      if (savedRoute[i]) {
        t.x = savedRoute[i][0];
        t.y = savedRoute[i][1];
      }
    });
    S.board.players.forEach((p) => {
      p.effects = p.effects || [];
      const legacyGod = p.effects.filter(isGodEffect).at(-1);
      p.effects = p.effects.filter((e) => !isGodEffect(e) || e === legacyGod);
      p.equipment = (p.equipment || S.seats[p.seat]?.equipment || autoEquipmentForSeat(S.seats[p.seat ?? p.id])).slice(0, 2);
      p.diceCount = p.diceCount || 1;
      p.direction = p.direction || 1;
      p.skip = p.skip || 0;
      p.deedUsed = !!p.deedUsed;
      p.manualUsed = !!p.manualUsed;
      p.guardianReadyAt = p.guardianReadyAt || 1;
      p.compassReadyAt = p.compassReadyAt || 1;
      ["cards", "tools", "bank", "tickets", "vehicle", "vehicleTurns", "bombSteps", "detained", "hospitalPass", "bailPass", "discount", "rentBoost"].forEach((key) => delete p[key]);
    });
    const attachedGods = new Set(S.board.players.flatMap((p) => p.effects.filter(isGodEffect).map((e) => e.kind))),
      seenGods = new Set();
    S.board.npcs = S.board.gods
      ? S.board.npcs.filter((n) => {
          if (n.name === "死神" || !NPC_DEFS.some((d) => d.name === n.name) || attachedGods.has(n.name) || seenGods.has(n.name)) return false;
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
    b.mini.pos += b.mini.dir * dt * (b.mini.speed || 0.82);
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
      activeSeatIds().forEach((i) => {
        S.seats[i].equipment ||= [];
        if (S.seats[i].type === "ai") autoEquipmentForSeat(S.seats[i]);
      });
      S.activeSeat = activeSeatIds()[0];
      S.scene = "loadout";
      return;
    }
  }
  if (S.scene === "loadout") {
    if (id === "loadoutBack") { S.scene = "setup"; return; }
    if (id.startsWith("loadoutSeat")) { S.activeSeat = +id.slice(11); return; }
    if (id.startsWith("equip")) {
      const item = equipmentDef(id.slice(5)), seat = S.seats[S.activeSeat];
      if (!item || seat.type === "off") return;
      seat.equipment ||= [];
      if (seat.equipment.includes(item.id)) seat.equipment = seat.equipment.filter((x) => x !== item.id);
      else if (seat.equipment.length < 2 && !seat.equipment.some((x) => equipmentDef(x)?.group === item.group)) seat.equipment.push(item.id);
      return;
    }
    if (id === "loadoutNext" && activeSeatIds().every((i) => (S.seats[i].equipment || []).length > 0)) { S.scene = "mapSelect"; return; }
  }
  if (S.scene === "mapSelect") {
    if (id === "mapBack") {
      S.scene = "loadout";
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
    if (c === "upgrade" && t.type === "land" && t.owner === p.id && t.level === 4) {
      openPopup("specialBuild", {
        tile: t,
        fromCard: true,
        freeCardIndex: q.cardIndex,
      });
      return;
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
    } else if (c === "demolition" && t.type === "land" && t.owner >= 0 && t.owner !== p.id && t.level > 0) {
      t.level--;
      if (t.level < 5) t.special = null;
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
    if ((p.effects || []).some((e) => e.kind === "死神")) {
      addLog(`${p.id + 1}P 受死神影響，本回合無法加建`);
      finishAction();
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
      if (q?.fromCard)
        openPopup("cards", { page: Math.floor((q.freeCardIndex || 0) / 8) });
      else openPopup("tile", { tile: t });
      return;
    }
    const kind = { buildHotel: "hotel", buildMall: "mall", buildPark: "park" }[
      id
    ];
    if (q?.kind === "specialBuild" && t && kind) {
      const cost = q.fromCard ? 0 : upgradeCost(t),
        freeCardValid = !q.fromCard || p.cards[q.freeCardIndex] === "upgrade";
      if (freeCardValid && p.cash >= cost) {
        if (q.fromCard) p.cards.splice(q.freeCardIndex, 1);
        p.cash -= cost;
        t.level = 5;
        t.special = kind;
        markUpgrade(t);
        addLog(
          `${p.id + 1}P 完成${kind === "hotel" ? "星光旅館" : kind === "mall" ? "童話商場" : "祝福公園"}`,
        );
      }
      if (q.fromCard) {
        S.board.popup = null;
        saveGame();
        return;
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
    if (id === "surrender") {
      if (p.type === "human" && !p.bankrupt) openPopup("surrenderConfirm");
      return;
    }
    if (id === "surrenderCancel") {
      openPopup("pause");
      return;
    }
    if (id === "surrenderConfirm") {
      if (q?.kind !== "surrenderConfirm" || p.type !== "human") return;
      surrenderPlayer(p);
      if (living().length <= 1) {
        finishGame(living()[0]);
      } else {
        openPopup("deathTarget", { surrenderedId: p.id });
      }
      return;
    }
    if (id.startsWith("deathTarget")) {
      const target = living().find((player) => player.id === +id.slice(11));
      if (q?.kind === "deathTarget" && target) summonDeathGod(target);
      b.popup = null;
      nextTurn();
      return;
    }
    if (id === "deathSkip") {
      if (q?.kind === "deathTarget") {
        b.popup = null;
        nextTurn();
      }
      return;
    }
    if (id.startsWith("facilityRelease")) {
      if (q?.kind !== "facilityVisit" || p.type !== "human") return;
      const target = b.players.find((player) => player.id === +id.slice(15));
      if (target && target.detained?.facility === q.facility && releaseDetainedPlayer(p, target))
        openPopup("event", { name: "協助完成", desc: `${target.id + 1}P 已立即離開${q.facility === "jail" ? "警察局" : "醫院"}。` });
      return;
    }
    if (id.startsWith("facilityHelper")) {
      if (q?.kind !== "facilityVisit" || p.type !== "human") return;
      const helper = id.slice(14), desc = applyFacilityHelper(p, helper);
      addLog(`${p.id + 1}P：${desc}`);
      openPopup("event", { name: "特殊角色行動", desc });
      return;
    }
    if (id === "facilityLeave") {
      if (q?.kind === "facilityVisit") finishAction();
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
      if (p.type === "human" && b.phase === "pre-roll") rollDice();
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
    if (id.startsWith("toolDice")) {
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
      if ((p.effects || []).some((e) => e.kind === "死神")) {
        addLog(`${p.id + 1}P 受死神影響，本回合無法購地`);
      } else if (p.cash >= cost) {
        p.cash -= cost;
        if (hasEquipment(p, "deed") && !p.deedUsed) p.deedUsed = true;
        t.owner = p.id;
        addLog(`${p.id + 1}P 購買 ${REGION_NAMES[t.region]} 土地`);
      }
      finishAction();
      return;
    }
    if (id === "upgrade") {
      const t = q.tile,
        cost = upgradeCost(t, p);
      if ((p.effects || []).some((e) => e.kind === "死神")) {
        addLog(`${p.id + 1}P 受死神影響，本回合無法加建`);
      } else if (t.level < 5 && p.cash >= cost) {
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
      if (q?.resumeAiRoll) {
        b.popup = null;
        setTurnPhase("pre-roll");
        setTimeout(rollDice, 260);
        return;
      }
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
        tickets = 1,
        grade = "完成挑戰";
      if (id.startsWith("miniChest")) {
        if (performance.now() < (b.mini?.revealUntil || 0)) return;
        const pick = +id.slice(9),
          win = pick === (b.mini?.winningChest ?? 0);
        reward = win ? 7000 : 2800;
        tickets = win ? 2 : 1;
        grade = win ? "記憶正確｜找到星光寶箱" : "選錯寶箱｜仍獲得參加獎";
      } else {
        const dist = Math.abs((b.mini?.pos ?? 0) - (b.mini?.target ?? 0.5));
        reward = dist < 0.07 ? 7000 : dist < 0.18 ? 4500 : 2200;
        tickets = dist < 0.18 ? 2 : 1;
        grade = dist < 0.07 ? "完美命中" : dist < 0.18 ? "漂亮命中" : "擦邊完成";
      }
      if (p.char === 7) reward = Math.round(reward * 1.25);
      p.cash += reward;
      p.tickets += tickets;
      addLog(`${p.id + 1}P 小遊戲獲得 $${reward.toLocaleString()}`);
      openPopup("miniResult", {
        kindIndex: b.mini?.kind || 0,
        reward,
        tickets,
        grade,
      });
      return;
    }
    if (id === "miniResultOk") {
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
        const visual = plotAnchor(x),
          road = roadAnchor(x),
          d = Math.min(
            Math.hypot(visual.x - wx, visual.y - wy),
            Math.hypot(road.x - wx, road.y - wy),
          );
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
  else if (S.scene === "loadout") loadout();
  else if (S.scene === "mapSelect") mapSelect();
  else if (S.scene === "rules") rulesSetup();
  else if (S.scene === "game" && S.board) game();
  else if (S.scene === "result" && S.board) result();
  else if (S.scene === "help") help();
  else if (S.scene === "settings") settings();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
