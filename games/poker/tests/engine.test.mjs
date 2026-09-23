import test from "node:test";
import assert from "node:assert/strict";
import {
  createProfile,
  reduce,
  autoAction,
  validateProfile,
} from "../engine.mjs";
import * as R from "../rules.mjs";
function rng(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
for (const type of Object.keys(R.GAMES))
  test(type + " deterministic full rounds, restore and settlement", () => {
    for (let seed = 1; seed <= 8; seed++) {
      const random = rng(seed);
      let p = reduce(
          createProfile(),
          { type: "open", id: "table-" + type + seed, game: type },
          random,
        ),
        moves = 0;
      const opening = p.table.players.reduce((s, x) => s + x.chips, 0);
      while (
        !["roundEnd", "tableEnd"].includes(p.table.phase) &&
        moves++ < 1000
      ) {
        const t = p.table;
        let a;
        if (type === "thirteen") {
          const i = t.arrangements.filter(Boolean).length,
            g = R.arrange13(t.players[i].hand);
          let out = g.next();
          while (!out.done) out = g.next();
          a = { type: "arrange", seat: i, arrangement: out.value };
        } else if (t.phase === "betting")
          a = { type: "bet", seat: t.turn, amount: 10 };
        else a = autoAction(t, random);
        assert.ok(a, type);
        p = reduce(p, a, random);
        p = validateProfile(JSON.parse(JSON.stringify(p)));
      }
      assert.ok(moves < 1000, type + " stalled");
      if (!["blackjack", "dragon"].includes(type))
        assert.equal(
          p.table.players.reduce((s, x) => s + x.chips, 0),
          opening,
        );
      assert.equal(p.stats[type].rounds, 1);
      const t = p.table,
        expected = 2500 + t.players[0].chips;
      p = reduce(p, { type: "leave" });
      assert.equal(p.wallet, expected);
      assert.throws(() => reduce(p, { type: "leave" }));
    }
  });
test("cannot leave or reopen live round and no invalid bet", () => {
  const p = reduce(createProfile(), {
    type: "open",
    id: "table-check",
    game: "blackjack",
  });
  assert.throws(() => reduce(p, { type: "leave" }));
  assert.throws(() =>
    reduce(p, { type: "open", id: "other-table", game: "big2" }),
  );
  for (const amount of [-1, 0, 501, NaN, Infinity])
    assert.throws(() => reduce(p, { type: "bet", seat: 0, amount }));
  assert.equal(p.wallet, 2500);
});
test("invalid saves and duplicate cards rejected", () => {
  const p = reduce(createProfile(), {
    type: "open",
    id: "table-invalid",
    game: "big2",
  });
  p.table.players[0].hand[0] = p.table.players[1].hand[0];
  assert.throws(() => validateProfile(p));
});
test("rescue capped, helper reward cannot duplicate", () => {
  let p = createProfile();
  p.wallet = 0;
  p = reduce(p, { type: "rescue", id: "rescue-one" });
  assert.equal(p.wallet, 100);
  assert.throws(() => reduce(p, { type: "rescue", id: "rescue-two" }));
  p = reduce(p, { type: "helperStart", id: "help-one", game: "tea" });
  assert.throws(() =>
    reduce(p, { type: "helperFinish", id: "help-one", score: 5 }),
  );
  p.helper.started -= 16000;
  p = reduce(p, { type: "helperFinish", id: "help-one", score: 5 });
  assert.equal(p.wallet, 250);
  assert.throws(() =>
    reduce(p, { type: "helperFinish", id: "help-one", score: 5 }),
  );
});
