import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../rules.mjs";
test("52 unique identities and optional joker", () => {
  assert.equal(new Set(R.deck()).size, 52);
  assert.equal(R.deck(true).length, 53);
});
test("natural blackjack ordering and soft aces", () => {
  assert.equal(R.bjDelta(["SA", "SK"], ["HA", "HQ"], 50), 0);
  assert.equal(R.bjDelta(["SA", "SK"], ["S7", "H7", "D7"], 50), 75);
  assert.equal(R.bjDelta(["S7", "H7", "D7"], ["HA", "HQ"], 50), -50);
  assert.equal(R.bj(["SA", "HA", "S5"]).total, 17);
  assert.equal(R.bj(["SA", "HA", "S5"]).soft, true);
});
test("13 front stronger pair is foul", () => {
  assert.equal(
    R.thirteenValid({
      front: ["SA", "HA", "SK"],
      middle: ["S2", "H2", "S3", "S4", "H5"],
      back: ["C7", "C8", "C9", "C10", "CJ"],
    }),
    false,
  );
});
test("big two high card, pair, straight variants and duplicates", () => {
  assert.equal(R.beats(["S2"], R.big2(["SA"]), R.DEFAULT_RULES), true);
  assert.equal(R.big2(["S3", "S3"]), null);
  assert.equal(R.big2(["SA", "H2", "D3", "C4", "S5"]), null);
  assert.equal(
    R.big2(["SA", "H2", "D3", "C4", "S5"], { aLow: true }).name,
    "順子",
  );
  assert.equal(R.beats(["S3", "H3"], R.big2(["S2"]), R.DEFAULT_RULES), false);
});
test("red point scoring and distinct face ranks", () => {
  assert.equal(R.redScore("HA"), 20);
  assert.equal(R.redScore("SA"), 30);
  assert.equal(R.redMatch("HA", "C9"), true);
  assert.equal(R.redMatch("HJ", "CQ"), false);
  assert.equal(R.redMatch("HJ", "CJ"), true);
});
test("sevens ace low and adjacency only", () => {
  assert.equal(R.sevensLegal("SA", { S: [2, 7] }), true);
  assert.equal(R.sevensLegal("S9", { S: [7, 7] }), false);
  assert.equal(R.sevensLegal("H7", {}), true);
});
test("old maid pairs preserve joker and card conservation", () => {
  const x = R.discardPairs(["SA", "HA", "DA", "CA", "S3", "JOKER"]);
  assert.equal(x.pairs.length, 2);
  assert.deepEqual(x.hand.sort(), ["JOKER", "S3"]);
});
test("13 auto arranger returns exactly original legal cards", () => {
  const h = R.deck()
      .filter((_, i) => i % 4 === 0)
      .slice(0, 13),
    g = R.arrange13(h);
  let x = g.next();
  while (!x.done) x = g.next();
  assert.equal(R.thirteenValid(x.value, h), true);
});
