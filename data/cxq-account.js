const dialog = document.querySelector("#cxq-account");
const status = dialog.querySelector("[role=status]");
const action = dialog.querySelector("[data-google]");
const identity = dialog.querySelector("[data-identity]");
const name = identity.querySelector("strong");
const email = identity.querySelector("span");
const root = document.querySelector("#root");
const toggle = document.createElement("button");
toggle.type = "button";
toggle.className = "cxq-account-toggle";
toggle.textContent = "登入";
toggle.setAttribute("aria-haspopup", "dialog");
toggle.setAttribute("aria-controls", dialog.id);

function mount() {
  const admin = root.querySelector("button.admin-button");
  if (!admin) return;
  admin.hidden = true;
  if (toggle.parentElement !== admin.parentElement) admin.before(toggle);
}

new MutationObserver(mount).observe(root, { childList: true, subtree: true });
mount();
toggle.addEventListener("click", () => dialog.showModal());
dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());
dialog.querySelector("[data-admin]").addEventListener("click", () => {
  dialog.close();
  root.querySelector("button.admin-button")?.click();
});

const incoming = new URL(location.href);
let user = null;
let busy = false;

function show(session) {
  user = session?.user ?? null;
  const displayName = user?.user_metadata?.full_name?.trim() || user?.user_metadata?.name?.trim();
  const address = user?.email || "";
  const label = displayName || address || "已登入";
  toggle.textContent = user ? label : "登入";
  toggle.title = user ? label : "";
  identity.hidden = !user;
  name.textContent = user ? label : "";
  email.textContent = user && address !== label ? address : "";
  action.textContent = user ? "登出" : "使用 Google 登入";
  action.disabled = busy;
  status.textContent = "";
}

try {
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm");
  const accounts = createClient(
    "https://eramtyebcstklubnvarn.supabase.co",
    "sb_publishable_8fbgJKm_adkHI3dkoX9gGA_RXptheFt",
    { auth: { flowType: "pkce", storageKey: "cxq-official-account" } }
  );
  action.addEventListener("click", async () => {
    if (busy) return;
    busy = action.disabled = true;
    status.textContent = user ? "正在登出…" : "正在開啟 Google 登入…";
    try {
      const result = user
        ? await accounts.auth.signOut({ scope: "local" })
        : await accounts.auth.signInWithOAuth({
          provider: "google", options: { redirectTo: new URL("../", import.meta.url).href }
        });
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
  if (incoming.searchParams.has("code") || incoming.searchParams.has("error") || incoming.hash.includes("error=")) {
    if (!user) status.textContent = "登入未完成，請重新使用你的 Google 帳號登入。";
    if (!dialog.open) dialog.showModal();
  } else if (error) {
    status.textContent = "無法確認登入狀態，請稍後再試。";
  }
} catch {
  status.textContent = "Google 登入暫時無法載入，請重新整理頁面。";
}
