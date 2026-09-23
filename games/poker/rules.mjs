// Pure rules: card identities and comparisons never depend on image pixels.
export const SUITS = ["C", "D", "H", "S"];
export const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
export const GAMES = {
  big2: "大老二",
  thirteen: "13 支",
  blackjack: "21 點",
  highlow: "比大小",
  dragon: "射龍門",
  redpoint: "撿紅點",
  sevens: "排七",
  oldmaid: "抽鬼牌",
};
export const ROLES = [
  ["joy", "快樂"],
  ["dream", "夢想"],
  ["night", "夜晚陪伴"],
  ["sadness", "悲傷"],
  ["trust", "信任"],
  ["memory", "回憶"],
  ["growth", "成長"],
  ["healing", "療癒"],
  ["luck", "幸運"],
  ["hope", "希望"],
];
export const DEFAULT_RULES = {
  c3: true,
  aLow: false,
  twos: false,
  spadeTwo: false,
  soft17: false,
  pillarDouble: true,
  spadeAce: true,
};
export function deck(joker = false) {
  const d = SUITS.flatMap((s) => RANKS.map((r) => s + r));
  return joker ? [...d, "JOKER"] : d;
}
const CARD_CACHE = new Map();
export function card(c) {
  if (CARD_CACHE.has(c)) return CARD_CACHE.get(c);
  if (c === "JOKER") return { s: "X", r: 0, suit: 4, label: "鬼牌" };
  if (typeof c !== "string" || !deck().includes(c)) throw Error("無效牌張");
  const s = c[0],
    rank = c.slice(1);
  const value = {
    s,
    r: rank === "A" ? 14 : RANKS.indexOf(rank) + 1,
    suit: SUITS.indexOf(s),
    label: { C: "梅花", D: "方塊", H: "紅心", S: "黑桃" }[s] + rank,
  };
  CARD_CACHE.set(c, value);
  return value;
}
export function shuffled(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function compare(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}
export function combinations(a, n) {
  const out = [];
  function next(at, row) {
    if (row.length === n) {
      out.push(row);
      return;
    }
    for (let i = at; i <= a.length - (n - row.length); i++)
      next(i + 1, [...row, a[i]]);
  }
  next(0, []);
  return out;
}
export function sorted(hand, big2 = false) {
  return [...hand].sort((a, b) => {
    const x = card(a),
      y = card(b);
    return (
      (big2 && x.r === 2 ? 15 : x.r) - (big2 && y.r === 2 ? 15 : y.r) ||
      x.suit - y.suit
    );
  });
}
export function poker(hand) {
  if (![3, 5].includes(hand.length) || new Set(hand).size !== hand.length)
    throw Error("牌數或重複牌錯誤");
  const cs = hand.map(card),
    values = cs.map((c) => c.r).sort((a, b) => b - a),
    groups = [...new Set(values)]
      .map((r) => [values.filter((v) => v === r).length, r])
      .sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const flush = hand.length === 5 && cs.every((c) => c.s === cs[0].s);
  let straight = 0;
  if (groups.length === 5) {
    if (values[0] - values[4] === 4) straight = values[0];
    else if (values.join() === "14,5,4,3,2") straight = 5;
  }
  let p;
  if (flush && straight) p = [8, straight];
  else if (groups[0][0] === 4) p = [7, ...groups.map((g) => g[1])];
  else if (groups[0][0] === 3 && groups[1]?.[0] === 2)
    p = [6, ...groups.map((g) => g[1])];
  else if (flush) p = [5, ...values];
  else if (straight) p = [4, straight];
  else if (groups[0][0] === 3) p = [3, ...groups.map((g) => g[1])];
  else if (groups[0][0] === 2 && groups[1]?.[0] === 2)
    p = [2, ...groups.map((g) => g[1])];
  else if (groups[0][0] === 2) p = [1, ...groups.map((g) => g[1])];
  else p = [0, ...values];
  return {
    power: p,
    name: [
      "高牌",
      "一對",
      "兩對",
      "三條",
      "順子",
      "同花",
      "葫蘆",
      "鐵支",
      "同花順",
    ][p[0]],
  };
}
export function thirteenValid(arr, original) {
  if (
    !arr ||
    arr.front?.length !== 3 ||
    arr.middle?.length !== 5 ||
    arr.back?.length !== 5
  )
    return false;
  const all = [...arr.front, ...arr.middle, ...arr.back];
  if (
    new Set(all).size !== 13 ||
    (original && all.some((c) => !original.includes(c)))
  )
    return false;
  return (
    compare(poker(arr.back).power, poker(arr.middle).power) >= 0 &&
    compare(poker(arr.middle).power, poker(arr.front).power) >= 0
  );
}
export function* arrange13(hand) {
  let best = null,
    bestValue = -Infinity,
    steps = 0;
  for (const back of combinations(hand, 5)) {
    const rest = hand.filter((c) => !back.includes(c)),
      be = poker(back);
    for (const middle of combinations(rest, 5)) {
      const me = poker(middle);
      if (compare(be.power, me.power) < 0) continue;
      const front = rest.filter((c) => !middle.includes(c)),
        fe = poker(front);
      if (compare(me.power, fe.power) < 0) continue;
      const value =
        be.power[0] * 100 +
        me.power[0] * 130 +
        fe.power[0] * 160 +
        be.power[1] * 0.1 +
        me.power[1] * 0.2 +
        fe.power[1] * 0.3;
      if (value > bestValue) {
        bestValue = value;
        best = { front, middle, back };
      }
    }
    if (++steps % 24 === 0) yield null;
  }
  if (!best) throw Error("無合法排墩");
  return best;
}
export function big2(hand, rules = DEFAULT_RULES) {
  if (new Set(hand).size !== hand.length) return null;
  const cs = hand.map(card),
    rs = cs.map((c) => (c.r === 2 ? 15 : c.r)),
    unique = [...new Set(rs)],
    counts = unique
      .map((r) => [rs.filter((x) => x === r).length, r])
      .sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const suit = Math.max(...cs.map((c) => c.suit)),
    n = hand.length;
  if (n === 1) return { n, power: [0, rs[0], suit], name: "單張" };
  if ([2, 3].includes(n) && unique.length === 1)
    return {
      n,
      power: [0, rs[0], n === 2 ? suit : 0],
      name: n === 2 ? "對子" : "三條",
    };
  if (n !== 5) return null;
  const ranks = [...unique].sort((a, b) => a - b),
    flush = cs.every((c) => c.s === cs[0].s);
  let high =
    unique.length === 5 && ranks[4] - ranks[0] === 4 && !ranks.includes(15)
      ? ranks[4]
      : 0;
  if (
    rules.aLow &&
    [...cs.map((c) => c.r)].sort((a, b) => a - b).join() === "2,3,4,5,14"
  )
    high = 5;
  let power, name;
  if (high && flush) {
    power = [4, high, cs.find((c) => c.r === high).suit];
    name = "同花順";
  } else if (counts[0][0] === 4) {
    power = [3, counts[0][1]];
    name = "鐵支";
  } else if (counts[0][0] === 3 && counts[1][0] === 2) {
    power = [2, counts[0][1]];
    name = "葫蘆";
  } else if (flush) {
    power = [1, ...rs.sort((a, b) => b - a), suit];
    name = "同花";
  } else if (high) {
    power = [0, high, cs.find((c) => c.r === high).suit];
    name = "順子";
  } else return null;
  return { n, power, name };
}
export function beats(hand, last, rules) {
  const e = big2(hand, rules);
  return !!e && (!last || (e.n === last.n && compare(e.power, last.power) > 0));
}
export function big2Moves(hand, last, rules, mustC3 = false) {
  return (last ? [last.n] : [1, 2, 3, 5])
    .flatMap((n) => combinations(hand, n))
    .filter((h) => (!mustC3 || h.includes("C3")) && beats(h, last, rules));
}
export function bj(hand) {
  let total = 0,
    aces = 0;
  for (const c of hand) {
    const r = card(c).r;
    total += r === 14 ? 11 : Math.min(r, 10);
    if (r === 14) aces++;
  }
  let soft = aces;
  while (total > 21 && soft) {
    total -= 10;
    soft--;
  }
  return { total, soft: soft > 0, natural: hand.length === 2 && total === 21 };
}
// Integer chips; odd blackjack bets round profit down. Natural vs natural is a push.
export function bjDelta(hand, dealer, bet) {
  const p = bj(hand),
    d = bj(dealer);
  if (p.total > 21) return -bet;
  if (d.natural) return p.natural ? 0 : -bet;
  if (p.natural) return Math.floor(bet * 1.5);
  if (d.total > 21 || p.total > d.total) return bet;
  return p.total < d.total ? -bet : 0;
}
export function redScore(c, spadeAce = true) {
  const x = card(c);
  if (x.s === "S" && x.r === 14) return spadeAce ? 30 : 0;
  if (!["D", "H"].includes(x.s)) return 0;
  return x.r === 14 ? 20 : x.r >= 10 ? 10 : x.r;
}
export function redMatch(a, b) {
  const x = card(a).r === 14 ? 1 : card(a).r,
    y = card(b).r === 14 ? 1 : card(b).r;
  return x >= 10 || y >= 10 ? x === y : x + y === 10;
}
export function sevensLegal(c, rows) {
  const x = card(c),
    r = x.r === 14 ? 1 : x.r,
    row = rows[x.s];
  return row ? r === row[0] - 1 || r === row[1] + 1 : r === 7;
}
export function discardPairs(hand) {
  const groups = new Map(),
    kept = [],
    pairs = [];
  for (const c of hand) {
    if (c === "JOKER") {
      kept.push(c);
      continue;
    }
    const r = card(c).r;
    if (groups.has(r)) {
      pairs.push([groups.get(r), c]);
      groups.delete(r);
    } else groups.set(r, c);
  }
  return { hand: [...kept, ...groups.values()], pairs };
}
export function safeInt(n, min = 0, max = 100000000) {
  return Number.isSafeInteger(n) && n >= min && n <= max;
}
