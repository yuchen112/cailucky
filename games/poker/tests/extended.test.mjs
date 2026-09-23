import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../engine.mjs";
import * as R from "../rules.mjs";
import * as S from "../storage.mjs";
for (const game of Object.keys(R.GAMES))
  test(
    game + " five-round quick table, stable restore, no double settlement",
    () => {
      let p = E.reduce(E.createProfile(), {
        type: "open",
        id: "five-round-" + game,
        game,
        buy: 1000,
        unit: 1,
      });
      let rounds = 0;
      while (p.table.phase !== "tableEnd" && rounds < 6) {
        let moves = 0;
        while (!["roundEnd", "tableEnd"].includes(p.table.phase)) {
          const t = p.table;
          let a;
          if (game === "thirteen") {
            const i = t.arrangements.filter(Boolean).length;
            const g = R.arrange13(t.players[i].hand);
            let x = g.next();
            while (!x.done) x = g.next();
            a = { type: "arrange", seat: i, arrangement: x.value };
          } else
            a =
              t.phase === "betting"
                ? { type: "bet", seat: t.turn, amount: 1 }
                : E.autoAction(t);
          p = E.reduce(p, a);
          assert.ok(++moves < 1000);
        }
        rounds++;
        assert.throws(() =>
          E.reduce(p, { type: "play", seat: 0, cards: ["C3"] }),
        );
        p = E.validateProfile(JSON.parse(JSON.stringify(p)));
        if (p.table.phase === "roundEnd") p = E.reduce(p, { type: "next" });
      }
      assert.equal(rounds, 5);
      assert.equal(p.stats[game].rounds, 5);
      assert.throws(() => E.reduce(p, { type: "next" }));
      p = E.reduce(p, { type: "leave" });
      assert.equal(p.table, null);
    },
  );
test("redpoint flips one stock card per turn, card conservation", () => {
  let p = E.reduce(E.createProfile(), {
    type: "open",
    id: "red-flip-test",
    game: "redpoint",
  });
  const n = p.table.deck.length;
  const a = E.autoAction(p.table);
  p = E.reduce(p, a);
  assert.equal(p.table.deck.length, n - 1);
  assert.equal(p.table.players[0].hand.length, 5);
  E.validateProfile(p);
});
test("partial thirteen save resumes without changing confirmed arrangement", () => {
  let p = E.reduce(E.createProfile(), {
    type: "open",
    id: "thirteen-resume",
    game: "thirteen",
  });
  const g = R.arrange13(p.table.players[0].hand);
  let x = g.next();
  while (!x.done) x = g.next();
  const a = { type: "arrange", seat: 0, arrangement: x.value };
  p = E.reduce(p, a);
  const q = E.validateProfile(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(q.table.arrangements[0], x.value);
  assert.throws(() => E.reduce(q, a));
});
test("corrupt save recovery preserves raw data and rejects changed source", () => {
  const m = new Map([[S.KEY, "broken"]]),
    storage = {
      getItem: (k) => m.get(k) ?? null,
      setItem: (k, v) => m.set(k, v),
    };
  const p = S.recoverProfile(E.createProfile(), "broken", storage);
  assert.equal(m.get(S.KEY + ".damaged"), "broken");
  assert.equal(S.readProfile(storage).revision, p.revision);
  assert.throws(() => S.recoverProfile(p, "broken", storage));
});
test("missing card and illegal settings rejected", () => {
  const p = E.reduce(E.createProfile(), {
    type: "open",
    id: "missing-card",
    game: "big2",
  });
  p.table.players[0].hand.pop();
  assert.throws(() => E.validateProfile(p));
  assert.throws(() =>
    E.reduce(E.createProfile(), {
      type: "settings",
      values: { musicVolume: 3 },
    }),
  );
});
test("thirteen unfinished draft survives JSON restore and rejects foreign cards", () => {
  let p = E.reduce(E.createProfile(), {
    type: "open",
    id: "draft-round-test",
    game: "thirteen",
  });
  const c = p.table.players[0].hand[0];
  p = E.reduce(p, {
    type: "draft",
    arrangement: { front: [c], middle: [], back: [] },
  });
  const q = E.validateProfile(JSON.parse(JSON.stringify(p)));
  assert.equal(q.table.draft.front[0], c);
  assert.throws(() =>
    E.reduce(q, {
      type: "draft",
      arrangement: {
        front: [q.table.players[1].hand[0]],
        middle: [],
        back: [],
      },
    }),
  );
});
