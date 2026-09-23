import { createProfile, validateProfile, reduce } from "./engine.mjs";
export const KEY = "cxq.poker.v1";
export const WARNING =
  "進度只儲存在目前瀏覽器，並非雲端存檔。清除網站資料、使用無痕模式或更換裝置可能遺失進度。請定期匯出備份；本機與備份皆遺失時無法恢復。";
export function readProfile(storage = localStorage) {
  const raw = storage.getItem(KEY);
  if (!raw) return createProfile();
  return validateProfile(JSON.parse(raw));
}
export function saveProfile(next, expected, storage = localStorage) {
  validateProfile(next);
  const old = storage.getItem(KEY);
  if (old && JSON.parse(old).revision !== expected)
    throw Error("另一個分頁已更新存檔，請重新載入後繼續");
  if (old) storage.setItem(KEY + ".previous", old);
  storage.setItem(KEY, JSON.stringify(next));
  if (storage.getItem(KEY) !== JSON.stringify(next))
    throw Error("存檔驗證失敗，請匯出備份");
  return next;
}
export function commit(profile, action, storage = localStorage) {
  const next = reduce(profile, action);
  return saveProfile(next, profile.revision, storage);
}
export function saveSlot(p, n, storage = localStorage) {
  if (![1, 2, 3, 4].includes(n)) throw Error("無效存檔槽");
  validateProfile(p);
  storage.setItem(KEY + ".slot" + n, JSON.stringify(p));
}
export function slots(storage = localStorage) {
  return [1, 2, 3, 4].map((n) => {
    try {
      const raw = storage.getItem(KEY + ".slot" + n);
      return { n, profile: raw ? validateProfile(JSON.parse(raw)) : null };
    } catch {
      return { n, invalid: true };
    }
  });
}
export function restoreSlot(current, n, storage = localStorage) {
  const raw = storage.getItem(KEY + ".slot" + n);
  if (!raw) throw Error("此槽沒有存檔");
  const next = validateProfile(JSON.parse(raw));
  next.revision = current.revision + 1;
  next.updated = Date.now();
  return saveProfile(next, current.revision, storage);
}
async function checksum(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function exportBackup(profile) {
  const payload = JSON.stringify(validateProfile(profile));
  return JSON.stringify({
    app: "CxQ Poker Backup",
    schema: 1,
    checksum: await checksum(payload),
    payload,
  });
}
export async function parseBackup(text) {
  if (text.length > 2000000) throw Error("備份檔案過大");
  const e = JSON.parse(text);
  if (
    e.app !== "CxQ Poker Backup" ||
    e.schema !== 1 ||
    typeof e.payload !== "string" ||
    e.checksum !== (await checksum(e.payload))
  )
    throw Error("備份格式或完整性檢查失敗");
  return validateProfile(JSON.parse(e.payload));
}
export function recoverProfile(next, originalRaw, storage = localStorage) {
  validateProfile(next);
  if (storage.getItem(KEY) !== originalRaw)
    throw Error("原始資料已變更，請重新載入再恢復");
  if (originalRaw) storage.setItem(KEY + ".damaged", originalRaw);
  const restored = structuredClone(next);
  restored.revision++;
  restored.updated = Date.now();
  storage.setItem(KEY, JSON.stringify(restored));
  if (storage.getItem(KEY) !== JSON.stringify(restored))
    throw Error("恢復寫入失敗");
  return restored;
}
