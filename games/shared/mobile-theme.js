/* Shared visual preference. Raster assets change; rules and saves do not. */
(() => {
  "use strict";
  const root = new URL(".", document.currentScript.src),
    key = "cxq-visual-theme-v1";
  const themes = ["night", "candy", "paper", "pixel"];
  let current = "night";
  try {
    const saved = localStorage.getItem(key);
    if (themes.includes(saved)) current = saved;
  } catch {}
  document.documentElement.dataset.visualTheme = current;
  const files = [
      "panel",
      "card",
      "primary",
      "board",
      "hud",
      "active",
      "garden",
      "sky",
      "clearing",
      "run",
      "bubble",
      "vessel",
      "sky-forest",
      "sky-moon",
      "run-rain",
      "run-moon",
    ],
    bindings = new Map(),
    descriptor = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      "src",
    );
  function asset(value, theme = current) {
    if (theme !== "candy") return value;
    let path;
    try {
      path = new URL(value, document.baseURI).pathname;
    } catch {
      return value;
    }
    let name = null;
    if (/stage-run-rain\.webp$/.test(path)) name = "run-rain";
    else if (/stage-run-moon\.webp$/.test(path)) name = "run-moon";
    else if (/stage-fly-forest\.webp$/.test(path)) name = "sky-forest";
    else if (/stage-fly-moon\.webp$/.test(path)) name = "sky-moon";
    else if (/brick-moon\.webp$/.test(path)) name = "sky-moon";
    else if (/brick-archive\.webp$/.test(path)) name = "garden";
    else if (/\/stage-run[^/]*\.webp$/.test(path)) name = "run";
    else if (/\/stage-fly[^/]*\.webp$/.test(path)) name = "sky";
    else if (/\/merge-vessel\.webp$/.test(path)) name = "vessel";
    else if (
      /\/mobile-art\/(tetris|2048|mines|memory|link|whack|brick-breaker|dino|flappy|magic-bubble|dream-match|merge)\.webp$/.test(
        path,
      )
    )
      name = "garden";
    else if (
      /\/(?:mobile-art\/stage-brick|rebuilt\/brick-(?:moon|forest|memory|rain|scene))[^/]*\.webp$/.test(
        path,
      )
    )
      name = "bubble";
    return name ? new URL("candy/" + name + ".webp", root).href : value;
  }
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    ...descriptor,
    set(value) {
      const original = String(value);
      const mapped = asset(original);
      if (asset(original, "candy") !== original) bindings.set(this, original);
      descriptor.set.call(this, mapped);
    },
  });
  let selection = 0;
  async function choose(theme) {
    if (!themes.includes(theme)) throw new Error("Unknown visual style");
    const request = ++selection;
    if (theme === "candy")
      await Promise.all(
        files.map((f) => {
          const i = new Image();
          i.src = new URL("candy/" + f + ".webp", root);
          return i.decode();
        }),
      );
    if (request !== selection) return;
    current = theme;
    document.documentElement.dataset.visualTheme = theme;
    try {
      localStorage.setItem(key, theme);
    } catch {}
    for (const [image, source] of bindings)
      descriptor.set.call(image, asset(source));
    document
      .querySelectorAll("[data-visual-choice]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.visualChoice === theme),
        ),
      );
    dispatchEvent(new Event("cxq-theme-change"));
  }
  function button() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cxq-theme-button";
    b.textContent = "風格";
    b.onclick = open;
    return b;
  }
  let dialog;
  function open() {
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "mg-panel cxq-theme-picker";
      dialog.setAttribute("aria-label", "遊戲風格");
      dialog.innerHTML =
        '<h2>選擇遊戲風格</h2><p>十二款共用這項選擇，下次開啟也會記住。</p><div class="cxq-theme-options"><button data-visual-choice="night"><img src="' +
        new URL("rebuilt/panel.webp", root) +
        '" alt=""><strong>翡翠街機</strong><span>雕金與琺瑯</span></button><button data-visual-choice="candy"><img src="' +
        new URL("candy/panel.webp", root) +
        '" alt=""><strong>奶油玩具屋</strong><span>木製玩具與柔和色彩</span></button><button data-visual-choice="paper"><strong>童話紙劇場</strong><span>剪紙與分層舞台</span></button><button data-visual-choice="pixel"><strong>像素掌機</strong><span>點陣與掌機風格</span></button></div><p class="cxq-theme-status" role="status"></p><button data-theme-close>完成</button>';
      document.body.append(dialog);
      dialog.querySelectorAll("[data-visual-choice]").forEach(
        (b) =>
          (b.onclick = async () => {
            const status = dialog.querySelector(".cxq-theme-status");
            status.textContent = "準備風格素材…";
            dialog
              .querySelectorAll("[data-visual-choice]")
              .forEach((b) => (b.disabled = true));
            try {
              await choose(b.dataset.visualChoice);
              status.textContent = "風格已儲存";
            } catch {
              status.textContent = "素材載入失敗，請點選重試";
            } finally {
              dialog
                .querySelectorAll("[data-visual-choice]")
                .forEach((b) => (b.disabled = false));
            }
          }),
      );
      dialog.querySelector("[data-theme-close]").onclick = () => dialog.close();
    }
    dialog
      .querySelectorAll("[data-visual-choice]")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.visualChoice === current),
        ),
      );
    dialog.showModal();
  }
  function decorate() {
    const title = document.querySelector(".mobile-title");
    if (title && !title.querySelector(".cxq-theme-button")) {
      title.querySelector("header").append(button());
    }
    for (const host of document.querySelectorAll(".mp-preferences,.cp-card"))
      if (!host.querySelector(".cxq-theme-button")) host.append(button());
  }
  addEventListener("DOMContentLoaded", () => {
    const game = document.body.dataset.mobileGame;
    if (game === "tetris") {
      const toast = document.querySelector("#toast");
      document.querySelector(".round-head").after(toast);
      const controls = document.querySelector(".controls");
      const order = ["left", "right", "rotate", "soft", "hold", "drop"];
      for (const a of order)
        controls.append(controls.querySelector("[data-act=" + a + "]"));
      controls.querySelectorAll(":scope>div").forEach((d) => d.remove());
      controls.querySelector("[data-act=soft]").textContent = "慢降";
      controls.querySelector("[data-act=drop]").textContent = "直接落底";
    }
    decorate();
    new MutationObserver((records) => {
      if (
        records.some((r) =>
          r.type === "attributes"
            ? r.target.matches(".cp-card")
            : [...r.addedNodes].some(
                (n) =>
                  n.nodeType === 1 &&
                  (n.matches("dialog,.cp-card,.mp-preferences,h2") ||
                    n.querySelector("h2,.cp-card,.mp-preferences")),
              ),
        )
      )
        queueMicrotask(decorate);
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  });
  addEventListener("storage", (e) => {
    if (e.key === key) {
      void choose(themes.includes(e.newValue) ? e.newValue : "night").catch(() => {});
    }
  });
  window.CxQTheme = {
    get current() {
      return current;
    },
    choose,
    open,
    asset,
  };
})();
