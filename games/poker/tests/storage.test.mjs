import test from "node:test";
import assert from "node:assert/strict";
import { createProfile } from "../engine.mjs";
import * as S from "../storage.mjs";
function memory() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}
test("auto save, stale tab protection, slots and read-back", () => {
  const store = memory();
  let p = createProfile();
  p = S.commit(p, { type: "open", id: "save-test-table", game: "big2" }, store);
  const original = structuredClone(p);
  S.saveSlot(p, 1, store);
  p = S.commit(p, { type: "settings", values: { fast: true } }, store);
  assert.throws(() => S.commit(original, { type: "ack" }, store));
  p = S.restoreSlot(p, 1, store);
  assert.deepEqual(p.table, original.table);
  assert.equal(S.readProfile(store).revision, p.revision);
});
test("export/import integrity and corruption rejection", async () => {
  const p = createProfile(),
    raw = await S.exportBackup(p);
  assert.deepEqual(await S.parseBackup(raw), p);
  const e = JSON.parse(raw);
  e.payload = e.payload.replace("3000", "9000");
  await assert.rejects(() => S.parseBackup(JSON.stringify(e)));
});
test("failed storage does not mutate caller state", () => {
  const p = createProfile(),
    storage = {
      getItem: () => null,
      setItem: () => {
        throw Error("quota");
      },
    };
  assert.throws(() =>
    S.commit(p, { type: "open", id: "quota-table", game: "big2" }, storage),
  );
  assert.equal(p.wallet, 3000);
  assert.equal(p.table, null);
});
