import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm";

const accounts = createClient(
  "https://eramtyebcstklubnvarn.supabase.co",
  "sb_publishable_8fbgJKm_adkHI3dkoX9gGA_RXptheFt",
  { auth: { flowType: "pkce", storageKey: "cxq-official-account" } }
);
const bar = document.querySelector("#cxq-account");
const status = bar.querySelector("[role=status]");
const action = bar.querySelector("button");
const returnUrl = new URL("../", import.meta.url);
const incoming = new URL(location.href);
let user = null;
let busy = false;

function show(session) {
  user = session?.user ?? null;
  action.textContent = user ? "登出" : "使用 Google 登入";
  action.disabled = busy;
  status.textContent = user ? (user.user_metadata?.full_name || user.email || "已登入") : "";
}

action.addEventListener("click", async () => {
  if (busy) return;
  busy = action.disabled = true;
  status.textContent = user ? "正在登出…" : "正在開啟 Google 登入…";
  try {
    const result = user
      ? await accounts.auth.signOut({ scope: "local" })
      : await accounts.auth.signInWithOAuth({ provider: "google", options: { redirectTo: returnUrl.href } });
    if (result.error) throw result.error;
  } catch {
    status.textContent = "帳號操作未完成，請稍後再試。";
  } finally {
    busy = action.disabled = false;
  }
});

accounts.auth.onAuthStateChange((event, session) => show(session));
const { data, error } = await accounts.auth.getSession();
show(data.session);
if (!user && (error || incoming.searchParams.has("error") || incoming.hash.includes("error=") || incoming.searchParams.has("code"))) {
  status.textContent = "登入未完成，請確認使用測試名單內的 Google 帳號。";
}
