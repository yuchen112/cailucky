import * as R from "./rules.mjs";
const clone = (x) => structuredClone(x);
function requireThat(ok, message) {
  if (!ok) throw Error(message);
}
export function createProfile() {
  return {
    format: "cxq-poker",
    version: 1,
    revision: 0,
    wallet: 3000,
    table: null,
    ledger: [],
    stats: {},
    settings: {
      music: "tea",
      musicVolume: 0.3,
      soundVolume: 0.6,
      fast: false,
      reduced: false,
      large: false,
    },
    seats: ["luck", "dream", "growth", "joy"],
    locks: [false, false, false, false],
    acknowledged: false,
    helper: null,
    updated: Date.now(),
  };
}
export function validateProfile(p) {
  requireThat(p && typeof p === "object", "存檔格式異常");
  requireThat(
    Array.isArray(p.locks) &&
      p.locks.length === 4 &&
      p.locks.every((x) => typeof x === "boolean"),
    "席位鎖定資料異常",
  );
  requireThat(
    typeof p.acknowledged === "boolean" && Number.isFinite(p.updated),
    "存檔時間或確認資料異常",
  );
  requireThat(
    p.stats &&
      typeof p.stats === "object" &&
      !Array.isArray(p.stats) &&
      Object.entries(p.stats).every(
        ([k, v]) =>
          R.GAMES[k] &&
          R.safeInt(v.rounds) &&
          R.safeInt(v.wins) &&
          v.wins <= v.rounds,
      ),
    "遊玩紀錄異常",
  );
  requireThat(
    ["fast", "reduced", "large"].every(
      (k) => typeof p.settings?.[k] === "boolean",
    ),
    "設定資料異常",
  );
  requireThat(
    !p.helper ||
      (["tea", "stars", "pairs"].includes(p.helper.game) &&
        typeof p.helper.id === "string" &&
        Number.isFinite(p.helper.started) &&
        R.safeInt(p.helper.seed)),
    "補助紀錄異常",
  );
  requireThat(
    Array.isArray(p.ledger) &&
      p.ledger.every(
        (x) =>
          typeof x.id === "string" &&
          x.id.length <= 200 &&
          Number.isSafeInteger(x.delta) &&
          typeof x.label === "string" &&
          x.label.length <= 100 &&
          Number.isFinite(x.time),
      ) &&
      new Set(p.ledger.map((x) => x.id)).size === p.ledger.length,
    "交易紀錄異常",
  );
  requireThat(
    p?.format === "cxq-poker" && p.version === 1,
    "不是支援的撲克館存檔",
  );
  requireThat(R.safeInt(p.wallet) && R.safeInt(p.revision), "錢包資料異常");
  requireThat(
    Array.isArray(p.ledger) && p.ledger.length <= 300,
    "交易資料異常",
  );
  requireThat(
    Array.isArray(p.seats) &&
      p.seats.length === 4 &&
      new Set(p.seats).size === 4 &&
      p.seats.every((k) => R.ROLES.some((r) => r[0] === k)),
    "角色資料異常",
  );
  requireThat(
    p.settings && ["tea", "wood", "moon", "off"].includes(p.settings.music),
    "設定資料異常",
  );
  for (const k of ["musicVolume", "soundVolume"])
    requireThat(
      Number.isFinite(p.settings[k]) &&
        p.settings[k] >= 0 &&
        p.settings[k] <= 1,
      "音量資料異常",
    );
  if (p.table) {
    const t = p.table;
    requireThat(
      R.GAMES[t.type] &&
        ["playing", "betting", "arrange", "roundEnd", "tableEnd"].includes(
          t.phase,
        ),
      "牌局資料異常",
    );
    requireThat(
      t.players?.length === 4 && t.players.every((x) => R.safeInt(x.chips)),
      "桌上籌碼異常",
    );
    requireThat(
      Number.isInteger(t.turn) &&
        t.turn >= 0 &&
        t.turn < 4 &&
        R.safeInt(t.round, 1, 100000),
      "回合資料異常",
    );
    requireThat(
      t.rules &&
        R.safeInt(t.unit, 1, 1000) &&
        ["quick", "continuous"].includes(t.mode),
      "規則資料異常",
    );
    requireThat(
      typeof t.id === "string" &&
        t.id.length <= 200 &&
        R.safeInt(t.limit, 1, 100) &&
        ["easy", "normal", "hard"].includes(t.level),
      "牌桌設定異常",
    );
    requireThat(
      t.players.every(
        (x) =>
          R.ROLES.some((r) => r[0] === x.role) &&
          R.safeInt(x.before) &&
          Array.isArray(x.hand) &&
          Array.isArray(x.captured),
      ) && new Set(t.players.map((x) => x.role)).size === 4,
      "座位資料異常",
    );
    requireThat(
      Object.keys(R.DEFAULT_RULES).every(
        (k) => typeof t.rules[k] === "boolean",
      ),
      "進階規則異常",
    );
    requireThat(
      ["deck", "dealer", "board", "discard", "bets", "arrangements"].every(
        (k) => Array.isArray(t[k]),
      ) &&
        t.bets.length === 4 &&
        t.bets.every((x) => R.safeInt(x)),
      "牌局欄位異常",
    );
    requireThat(
      R.safeInt(t.moveCount) &&
        R.safeInt(t.passes, 0, 3) &&
        t.rows &&
        typeof t.rows === "object",
      "回合欄位異常",
    );
    for (const [s, r] of Object.entries(t.rows))
      requireThat(
        R.SUITS.includes(s) &&
          Array.isArray(r) &&
          r.length === 2 &&
          R.safeInt(r[0], 1, 7) &&
          R.safeInt(r[1], 7, 13),
        "排七欄位異常",
      );
    if (t.draft) {
      requireThat(
        ["front", "middle", "back"].every(
          (k) =>
            Array.isArray(t.draft[k]) &&
            t.draft[k].length <= (k === "front" ? 3 : 5),
        ),
        "草稿格式錯誤",
      );
      const d = [...t.draft.front, ...t.draft.middle, ...t.draft.back];
      requireThat(
        new Set(d).size === d.length &&
          d.every((c) => t.players[0].hand.includes(c)),
        "草稿牌張錯誤",
      );
    }
    requireThat(
      t.arrangements.length <= 4 &&
        t.arrangements.every(
          (a, i) => !a || R.thirteenValid(a, t.players[i].hand),
        ),
      "排墩資料異常",
    );
    if (["roundEnd", "tableEnd"].includes(t.phase))
      requireThat(
        t.result &&
          typeof t.result.detail === "string" &&
          t.result.detail.length <= 300 &&
          Array.isArray(t.result.deltas) &&
          t.result.deltas.length === 4 &&
          t.result.deltas.every(Number.isSafeInteger),
        "結算資料異常",
      );
    const all = [
      ...(t.deck || []),
      ...t.players.flatMap((x) => x.hand || []),
      ...(t.dealer || []),
      ...(t.board || []),
      ...(t.discard || []),
      ...t.players.flatMap((x) => x.captured || []),
    ];
    requireThat(
      all.length === (t.type === "oldmaid" ? 53 : 52) &&
        all.every((x) => R.deck(t.type === "oldmaid").includes(x)) &&
        new Set(all).size === all.length,
      "牌張缺損或重複",
    );
  }
  return p;
}
function record(p, id, delta, label) {
  requireThat(R.safeInt(Math.abs(delta)), "金額異常");
  if (p.ledger.some((x) => x.id === id)) return false;
  requireThat(R.safeInt(p.wallet + delta), "錢包餘額不足或超過上限");
  p.wallet += delta;
  p.ledger.push({ id, delta, label, time: Date.now() });
  p.ledger = p.ledger.slice(-300);
  return true;
}
function transfer(t, from, to, n) {
  const paid = Math.min(Math.max(0, Math.floor(n)), t.players[from].chips);
  t.players[from].chips -= paid;
  t.players[to].chips += paid;
  return paid;
}
function nextSeat(t, from, withCards = false) {
  for (let d = 1; d <= 4; d++) {
    const i = (from + d) % 4;
    if (!withCards || t.players[i].hand.length) return i;
  }
  return from;
}
function take(t, i, c) {
  const at = t.players[i].hand.indexOf(c);
  requireThat(at >= 0, "這張牌不在手上");
  t.players[i].hand.splice(at, 1);
}
function newRound(t, random) {
  t.round++;
  t.phase = "playing";
  t.turn = 0;
  t.last = null;
  t.shown = [];
  t.passes = 0;
  t.board = [];
  t.discard = [];
  t.rows = {};
  t.dealer = [];
  t.arrangements = [];
  t.draft = { front: [], middle: [], back: [] };
  t.result = null;
  t.moveCount = 0;
  t.bets = [0, 0, 0, 0];
  t.players.forEach((x) => {
    x.hand = [];
    x.captured = [];
    x.before = x.chips;
  });
  t.deck = R.shuffled(R.deck(t.type === "oldmaid"), random);
  t.message = "新一局開始";
  if (["big2", "thirteen", "sevens"].includes(t.type)) {
    for (let k = 0; k < 13; k++)
      for (const p of t.players) p.hand.push(t.deck.pop());
    t.players.forEach((p) => (p.hand = R.sorted(p.hand, t.type === "big2")));
    if (t.type === "big2")
      t.turn = t.rules.c3
        ? t.players.findIndex((p) => p.hand.includes("C3"))
        : (t.round - 1) % 4;
    if (t.type === "sevens")
      t.turn = t.players.findIndex((p) => p.hand.includes("H7"));
    if (t.type === "thirteen") t.phase = "arrange";
  }
  if (t.type === "redpoint") {
    t.board = t.deck.splice(-4);
    for (let k = 0; k < 6; k++)
      for (const p of t.players) p.hand.push(t.deck.pop());
    t.lastCapture = null;
  }
  if (t.type === "oldmaid") {
    let i = 0;
    while (t.deck.length) t.players[i++ % 4].hand.push(t.deck.pop());
    for (const p of t.players) {
      const x = R.discardPairs(p.hand);
      p.hand = R.shuffled(x.hand, random);
      t.discard.push(...x.pairs.flat());
    }
    t.turn = t.players.findIndex((p) => p.hand.length);
  }
  if (["blackjack", "highlow", "dragon"].includes(t.type)) t.phase = "betting";
  if (t.type === "dragon") {
    t.turn = (t.round - 1) % 4;
    drawDoor(t, random);
  }
}
function drawDoor(t, random) {
  if (t.deck.length < 6) {
    t.deck = R.shuffled(R.deck(), random);
    t.discard = [];
  }
  t.board = [];
  do {
    if (t.board.length) t.discard.push(...t.board);
    t.board = [t.deck.pop(), t.deck.pop()];
    if (t.deck.length < 1) {
      t.deck = R.shuffled(R.deck(), random);
      t.discard = [];
      t.board = [];
    }
  } while (
    t.board.length !== 2 ||
    R.card(t.board[0]).r === R.card(t.board[1]).r
  );
}
function finish(p, t, detail, scores = null) {
  if (t.phase === "roundEnd" || t.phase === "tableEnd") return;
  t.result = {
    detail,
    deltas: t.players.map((x) => x.chips - x.before),
    scores,
  };
  t.phase =
    t.players.some((x) => x.chips === 0) ||
    (t.mode === "quick" && t.round >= t.limit)
      ? "tableEnd"
      : "roundEnd";
  const s = (p.stats[t.type] ??= { rounds: 0, wins: 0 });
  s.rounds++;
  if (t.result.deltas[0] > 0) s.wins++;
  t.message = detail;
}
function payWinner(p, t, w, losses, detail) {
  for (let i = 0; i < 4; i++) if (i !== w) transfer(t, i, w, losses[i]);
  finish(p, t, detail);
}
function settleRed(p, t) {
  if (t.board.length) {
    if (t.lastCapture !== null)
      t.players[t.lastCapture].captured.push(...t.board);
    else t.discard.push(...t.board);
    t.board = [];
  }
  const scores = t.players.map((x) =>
    x.captured.reduce((s, c) => s + R.redScore(c, t.rules.spadeAce), 0),
  );
  settlePairwise(t, scores, (a, b) => a - b);
  finish(p, t, "依紅點分差結算", scores);
}
function settlePairwise(t, values, score) {
  const debts = [];
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      const d = score(values[i], values[j]);
      if (d)
        debts.push({
          from: d > 0 ? j : i,
          to: d > 0 ? i : j,
          n: Math.abs(d) * t.unit,
        });
    }
  const outgoing = t.players.map((_, i) =>
    debts.filter((d) => d.from === i).reduce((s, d) => s + d.n, 0),
  );
  const opening = t.players.map((x) => x.chips);
  for (let i = 0; i < 4; i++) {
    const own = debts.filter((d) => d.from === i),
      budget = Math.min(opening[i], outgoing[i]);
    let used = 0;
    own.forEach((d, k) => {
      const n =
        k === own.length - 1
          ? budget - used
          : Math.floor((d.n * budget) / outgoing[i]);
      used += n;
      t.players[i].chips -= n;
      t.players[d.to].chips += n;
    });
  }
}
export function reduce(profile, action, random = Math.random) {
  const p = clone(profile),
    a = action,
    t = p.table;
  requireThat(a && typeof a.type === "string", "無效操作");
  if (a.type === "open") {
    requireThat(!t, "請先完成或離開現有牌桌");
    requireThat(R.GAMES[a.game], "未知玩法");
    const buy = a.buy ?? 500;
    requireThat(R.safeInt(buy, 100, 10000) && buy <= p.wallet, "入桌本金不足");
    requireThat(
      R.safeInt(a.unit ?? 10, 1, 1000) && (a.unit ?? 10) <= buy / 5,
      "底注超出限制",
    );
    requireThat(
      ["easy", "normal", "hard"].includes(a.level ?? "normal"),
      "難度錯誤",
    );
    requireThat(
      ["quick", "continuous"].includes(a.mode ?? "quick"),
      "牌桌模式錯誤",
    );
    const id = a.id;
    requireThat(
      typeof id === "string" &&
        id.length >= 8 &&
        !p.ledger.some((x) => x.id === id),
      "重複的牌桌編號",
    );
    record(p, id, -buy, "入桌本金");
    p.table = {
      id,
      type: a.game,
      unit: a.unit ?? 10,
      level: a.level ?? "normal",
      mode: a.mode ?? "quick",
      limit: 5,
      rules: { ...R.DEFAULT_RULES, ...a.rules },
      round: 0,
      players: p.seats.map((role) => ({
        role,
        chips: buy,
        hand: [],
        captured: [],
      })),
    };
    newRound(p.table, random);
  } else if (a.type === "draft") {
    requireThat(
      t?.type === "thirteen" && t.phase === "arrange" && !t.arrangements[0],
      "此時無法修改排墩",
    );
    const d = a.arrangement;
    requireThat(
      d &&
        ["front", "middle", "back"].every(
          (k) => Array.isArray(d[k]) && d[k].length <= (k === "front" ? 3 : 5),
        ),
      "排墩草稿格式錯誤",
    );
    const all = [...d.front, ...d.middle, ...d.back];
    requireThat(
      new Set(all).size === all.length &&
        all.every((c) => t.players[0].hand.includes(c)),
      "排墩草稿牌張錯誤",
    );
    t.draft = clone(d);
  } else if (a.type === "seats") {
    requireThat(!t, "牌局中不能換角色");
    requireThat(
      a.seats?.length === 4 &&
        new Set(a.seats).size === 4 &&
        a.seats.every((k) => R.ROLES.some((r) => r[0] === k)),
      "角色不能重複",
    );
    p.seats = a.seats;
    p.locks = a.locks ?? p.locks;
  } else if (a.type === "settings") {
    p.settings = { ...p.settings, ...a.values };
  } else if (a.type === "ack") {
    p.acknowledged = true;
  } else if (a.type === "leave") {
    requireThat(
      t && ["roundEnd", "tableEnd"].includes(t.phase),
      "請先完成本局；也可以存檔稍後繼續",
    );
    record(p, t.id + ":exit", t.players[0].chips, "離桌結回");
    p.table = null;
  } else if (a.type === "next") {
    requireThat(t?.phase === "roundEnd", "無法開始下一局");
    newRound(t, random);
  } else if (a.type === "helperStart") {
    requireThat(!t && p.wallet < 500 && !p.helper, "目前不符合補助資格");
    requireThat(["tea", "stars", "pairs"].includes(a.game), "未知幫手遊戲");
    p.helper = {
      id: a.id,
      game: a.game,
      started: Date.now(),
      seed: Math.floor(random() * 1e8),
    };
  } else if (a.type === "helperFinish") {
    requireThat(p.helper && a.id === p.helper.id && !t, "補助紀錄無效");
    requireThat(Date.now() - p.helper.started >= 15000, "請完成幫手遊戲");
    const reward = Math.min(
      500 - p.wallet,
      100 + Math.min(100, Math.max(0, Math.floor(a.score || 0) * 10)),
    );
    record(p, p.helper.id, reward, "會館小幫手");
    p.helper = null;
  } else if (a.type === "rescue") {
    requireThat(!t && p.wallet < 100, "餘額尚足夠");
    record(p, a.id, 100 - p.wallet, "救急補助");
  } else {
    requireThat(t, "尚未開桌");
    requireThat(!["roundEnd", "tableEnd"].includes(t.phase), "本局已結算");
    requireThat(a.seat === t.turn || t.type === "thirteen", "尚未輪到此座位");
    const who = t.players[a.seat];
    requireThat(who, "座位錯誤");
    t.moveCount++;
    if (t.type === "big2") {
      requireThat(t.phase === "playing", "回合錯誤");
      if (a.type === "pass") {
        requireThat(t.last, "清桌不能跳過");
        t.passes++;
        if (t.passes === 3) {
          t.turn = t.lastSeat;
          t.last = null;
          t.passes = 0;
        } else t.turn = (t.turn + 1) % 4;
        t.message = "跳過";
      } else {
        requireThat(a.type === "play" && Array.isArray(a.cards), "請選牌");
        const e = R.big2(a.cards, t.rules);
        requireThat(e && R.beats(a.cards, t.last, t.rules), "這組牌無法出牌");
        requireThat(
          !(t.rules.c3 && t.discard.length === 0) || a.cards.includes("C3"),
          "首出須包含梅花 3",
        );
        a.cards.forEach((c) => take(t, a.seat, c));
        t.discard.push(...a.cards);
        t.last = e;
        t.shown = [...a.cards];
        t.lastSeat = a.seat;
        t.passes = 0;
        t.message = e.name;
        t.turn = (t.turn + 1) % 4;
        if (!who.hand.length) {
          const losses = t.players.map((x) => {
            const n = x.hand.length;
            return (
              t.unit *
              (n * (n >= 13 ? 4 : n >= 10 ? 3 : n >= 7 ? 2 : 1) +
                (t.rules.twos
                  ? x.hand.filter((c) => R.card(c).r === 2).length * 2
                  : 0) +
                (t.rules.spadeTwo && x.hand.includes("S2") ? 4 : 0))
            );
          });
          payWinner(p, t, a.seat, losses, "出完手牌，依剩牌結算");
        }
      }
    } else if (t.type === "highlow") {
      requireThat(a.type === "bet" && t.phase === "betting", "請先下注");
      const bet = validBet(t, a.amount);
      t.board = t.players.map(() => t.deck.pop());
      let w = 0;
      for (let i = 1; i < 4; i++)
        if (
          R.compare(
            [R.card(t.board[i]).r, R.card(t.board[i]).suit],
            [R.card(t.board[w]).r, R.card(t.board[w]).suit],
          ) > 0
        )
          w = i;
      payWinner(p, t, w, [bet, bet, bet, bet], "最大牌收取底注");
    } else if (t.type === "blackjack") {
      if (a.type === "bet") {
        requireThat(t.phase === "betting", "已經下注");
        const bet = validBet(t, a.amount);
        t.bets = t.players.map((x) => Math.min(bet, x.chips));
        for (let k = 0; k < 2; k++) {
          for (const x of t.players) x.hand.push(t.deck.pop());
          t.dealer.push(t.deck.pop());
        }
        t.phase = "playing";
        if (R.bj(t.dealer).natural) settleBJ(p, t);
        else if (R.bj(who.hand).natural) t.turn = 1;
      } else {
        requireThat(
          t.phase === "playing" && ["hit", "stand", "double"].includes(a.type),
          "無效 21 點操作",
        );
        if (a.type === "double") {
          requireThat(
            who.hand.length === 2 && who.chips >= t.bets[a.seat] * 2,
            "籌碼不足以加倍",
          );
          t.bets[a.seat] *= 2;
          who.hand.push(t.deck.pop());
          t.turn++;
        } else if (a.type === "hit") {
          who.hand.push(t.deck.pop());
          if (R.bj(who.hand).total >= 21) t.turn++;
        } else t.turn++;
        if (t.turn >= 4) {
          while (
            R.bj(t.dealer).total < 17 ||
            (t.rules.soft17 &&
              R.bj(t.dealer).total === 17 &&
              R.bj(t.dealer).soft)
          )
            t.dealer.push(t.deck.pop());
          t.turn = 0;
          settleBJ(p, t);
        }
      }
    } else if (t.type === "dragon") {
      requireThat(["bet", "pass"].includes(a.type), "請下注或跳過");
      if (a.type === "bet") {
        const bet = validBet(t, a.amount, a.seat),
          [lo, hi] = t.board.map((c) => R.card(c).r).sort((a, b) => a - b),
          c = t.deck.pop(),
          r = R.card(c).r;
        t.board.push(c);
        let delta =
          r > lo && r < hi
            ? bet
            : -(r === lo || r === hi
                ? (t.rules.pillarDouble ? 2 : 1) * bet
                : bet);
        delta = Math.max(-who.chips, delta);
        who.chips += delta;
        t.message =
          delta > 0 ? "射中" : r === lo || r === hi ? "撞柱" : "未進門";
      } else t.message = "跳過";
      finish(p, t, t.message);
    } else if (t.type === "redpoint") {
      requireThat(a.type === "play" && a.cards?.length === 1, "請選一張手牌");
      const c = a.cards[0],
        targets = t.board.filter((x) => R.redMatch(c, x));
      requireThat(
        !targets.length || targets.includes(a.target),
        "請選擇可配對桌牌",
      );
      requireThat(!a.target || targets.includes(a.target), "配對錯誤");
      take(t, a.seat, c);
      if (a.target) {
        t.board = t.board.filter((x) => x !== a.target);
        who.captured.push(c, a.target);
        t.lastCapture = a.seat;
      } else t.board.push(c);
      t.shown = [c, ...(a.target ? [a.target] : [])];
      if (t.deck.length) {
        const drawn = t.deck.pop(),
          match = t.board
            .filter((x) => R.redMatch(drawn, x))
            .sort(
              (x, y) =>
                R.redScore(y, t.rules.spadeAce) -
                R.redScore(x, t.rules.spadeAce),
            )[0];
        t.shown.push(drawn);
        if (match) {
          t.board = t.board.filter((x) => x !== match);
          who.captured.push(drawn, match);
          t.lastCapture = a.seat;
          t.shown.push(match);
          t.message =
            "翻牌 " + R.card(drawn).label + "，撿取 " + R.card(match).label;
        } else {
          t.board.push(drawn);
          t.message = "翻牌 " + R.card(drawn).label + "，留在桌面";
        }
      }
      t.turn = (t.turn + 1) % 4;
      if (t.players.every((x) => !x.hand.length)) settleRed(p, t);
    } else if (t.type === "sevens") {
      const legal = who.hand.filter((c) => R.sevensLegal(c, t.rows));
      if (a.type === "pass") {
        requireThat(!legal.length, "有牌可接時不能跳過");
        t.passes++;
        requireThat(t.passes < 4, "牌局無合法動作，請保留存檔回報");
      } else {
        const c = a.cards?.[0];
        requireThat(
          a.type === "play" && a.cards.length === 1 && legal.includes(c),
          "此牌不能接",
        );
        if (t.discard.length === 0) requireThat(c === "H7", "由紅心 7 開始");
        take(t, a.seat, c);
        const x = R.card(c),
          r = x.r === 14 ? 1 : x.r;
        t.rows[x.s] = t.rows[x.s]
          ? [Math.min(r, t.rows[x.s][0]), Math.max(r, t.rows[x.s][1])]
          : [7, 7];
        t.discard.push(c);
        t.shown = [c];
        t.passes = 0;
        if (!who.hand.length)
          payWinner(
            p,
            t,
            a.seat,
            t.players.map((x) => x.hand.length * t.unit),
            "率先接完手牌",
          );
      }
      t.turn = (t.turn + 1) % 4;
    } else if (t.type === "oldmaid") {
      requireThat(a.type === "draw", "請抽牌");
      const source = nextSeat(t, a.seat, true),
        h = t.players[source].hand;
      requireThat(
        source !== a.seat &&
          Number.isInteger(a.index) &&
          a.index >= 0 &&
          a.index < h.length,
        "無效抽牌位置",
      );
      const c = h.splice(a.index, 1)[0];
      who.hand.push(c);
      const pairs = R.discardPairs(who.hand);
      who.hand = pairs.hand;
      t.discard.push(...pairs.pairs.flat());
      t.shown = [c];
      const remaining = t.players.filter((x) => x.hand.length);
      if (remaining.length === 1) {
        const loser = t.players.indexOf(remaining[0]);
        for (let i = 0; i < 4; i++)
          if (i !== loser) transfer(t, loser, i, t.unit);
        finish(p, t, "最後持有鬼牌者支付其他三家");
      } else t.turn = nextSeat(t, a.seat, true);
    } else if (t.type === "thirteen") {
      requireThat(
        a.type === "arrange" && t.phase === "arrange",
        "尚未完成排墩",
      );
      requireThat(
        R.thirteenValid(a.arrangement, who.hand),
        "牌數錯誤或倒水：尾墩須不小於中墩，中墩不小於頭墩",
      );
      requireThat(!t.arrangements[a.seat], "此座位已確認排墩");
      t.arrangements[a.seat] = clone(a.arrangement);
      if (t.arrangements.filter(Boolean).length === 4) {
        settlePairwise(t, t.arrangements, (a, b) =>
          ["front", "middle", "back"].reduce(
            (s, k) => s + R.compare(R.poker(a[k]).power, R.poker(b[k]).power),
            0,
          ),
        );
        finish(p, t, "四家逐墩比牌，每墩一水");
      }
    }
  }
  p.revision++;
  p.updated = Date.now();
  validateProfile(p);
  return p;
}
function validBet(t, n, seat = 0) {
  requireThat(R.safeInt(n, 1, t.players[seat].chips), "下注金額超過可用籌碼");
  return n;
}
function settleBJ(p, t) {
  t.players.forEach(
    (x, i) => (x.chips += R.bjDelta(x.hand, t.dealer, t.bets[i])),
  );
  finish(p, t, "已比較莊家與各家的牌型及點數");
}
export function autoAction(t, random = Math.random) {
  const i = t.turn,
    h = t.players[i].hand,
    base = { seat: i };
  if (t.type === "big2") {
    const m = R.big2Moves(h, t.last, t.rules, t.rules.c3 && !t.discard.length);
    if (!m.length) return { ...base, type: "pass" };
    m.sort(
      (a, b) =>
        b.length - a.length ||
        R.compare(R.big2(a, t.rules).power, R.big2(b, t.rules).power),
    );
    if (t.level === "hard") {
      const value = (move) => {
        const left = h.filter((c) => !move.includes(c)),
          counts = new Map();
        for (const c of left)
          counts.set(R.card(c).r, (counts.get(R.card(c).r) || 0) + 1);
        const isolated = [...counts.values()].filter((n) => n === 1).length;
        return (
          left.length * 4 +
          isolated * 2 +
          move.filter((c) => R.card(c).r === 2).length * 1.5 +
          Math.max(...move.map((c) => R.card(c).r)) * 0.03
        );
      };
      m.sort((a, b) => value(a) - value(b));
    }
    const picked =
      t.level === "easy"
        ? m[Math.floor(random() * Math.min(m.length, 5))]
        : m[0];
    return { ...base, type: "play", cards: picked };
  }
  if (t.type === "blackjack") {
    const hand = R.bj(h);
    if (t.level !== "hard")
      return {
        ...base,
        type: hand.total < (t.level === "easy" ? 15 : 16) ? "hit" : "stand",
      };
    const up = Math.min(R.card(t.dealer[0]).r, 10),
      canDouble = h.length === 2 && t.players[i].chips >= t.bets[i] * 2;
    let action;
    if (hand.soft) {
      action =
        hand.total >= 19 || (hand.total === 18 && up <= 8) ? "stand" : "hit";
      if (canDouble && hand.total === 18 && up >= 3 && up <= 6)
        action = "double";
    } else {
      action =
        hand.total >= 17 ||
        (hand.total >= 13 && up <= 6) ||
        (hand.total === 12 && up >= 4 && up <= 6)
          ? "stand"
          : "hit";
      if (
        canDouble &&
        (hand.total === 11 ||
          (hand.total === 10 && up <= 9) ||
          (hand.total === 9 && up >= 3 && up <= 6))
      )
        action = "double";
    }
    return { ...base, type: action };
  }
  if (t.type === "redpoint") {
    const moves = h
      .flatMap((c) =>
        t.board
          .filter((b) => R.redMatch(c, b))
          .map((b) => ({
            c,
            b,
            value:
              R.redScore(c, t.rules.spadeAce) + R.redScore(b, t.rules.spadeAce),
          })),
      )
      .sort((a, b) => b.value - a.value);
    return moves.length
      ? { ...base, type: "play", cards: [moves[0].c], target: moves[0].b }
      : {
          ...base,
          type: "play",
          cards: [h.slice().sort((a, b) => R.redScore(a) - R.redScore(b))[0]],
        };
  }
  if (t.type === "sevens") {
    const legal = h.filter(
      (c) => R.sevensLegal(c, t.rows) && (t.discard.length || c === "H7"),
    );
    return legal.length
      ? { ...base, type: "play", cards: [legal[0]] }
      : { ...base, type: "pass" };
  }
  if (t.type === "dragon") {
    const [lo, hi] = t.board.map((c) => R.card(c).r).sort((a, b) => a - b),
      gap = hi - lo - 1;
    return {
      ...base,
      type: gap < 4 ? "pass" : "bet",
      amount: Math.min(t.players[i].chips, t.unit * (gap > 7 ? 2 : 1)),
    };
  }
  if (t.type === "oldmaid") {
    const source = nextSeat(t, i, true);
    return {
      ...base,
      type: "draw",
      index: Math.floor(random() * t.players[source].hand.length),
    };
  }
  return null;
}
