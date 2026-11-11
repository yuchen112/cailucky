/* Shared visual preference. Raster assets change; rules and saves do not. */
(() => {
  "use strict";
  const root = new URL(".", document.currentScript.src),
    key = "cxq-visual-theme-v1";
  const themes = {
    night: { name: "星夜經典", description: "深藍、森林綠與金色", preview: "rebuilt/panel.webp" },
    candy: { name: "晴日糖果", description: "奶油白、蜜桃粉與薄荷綠", preview: "candy/panel.webp" },
  };
  const knownTheme = (value) => Object.prototype.hasOwnProperty.call(themes, value);
  let current = "night";
  let selection = 0;
  try {
    const saved = localStorage.getItem(key);
    if (knownTheme(saved)) current = saved;
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
  async function choose(theme, { persist = true } = {}) {
    if (!knownTheme(theme)) throw new RangeError("Unknown visual theme");
    const request = ++selection;
    if (theme === "candy")
      await Promise.all(
        files.map((f) => {
          const i = new Image();
          i.src = new URL("candy/" + f + ".webp", root);
          return i.decode();
        }),
      );
    if (request !== selection) return false;
    current = theme;
    document.documentElement.dataset.visualTheme = theme;
    try {
      if (persist) localStorage.setItem(key, theme);
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
    return true;
  }
  function button() {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cxq-theme-button";
    b.textContent = "配色";
    b.onclick = open;
    return b;
  }
  let dialog;
  function open() {
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "mg-panel cxq-theme-picker";
      dialog.setAttribute("aria-label", "遊戲配色");
      dialog.innerHTML =
        '<h2>選擇遊戲配色</h2><p>十二款共用這項選擇，下次開啟也會記住。</p><div class="cxq-theme-options"></div><p class="cxq-theme-status" role="status"></p><button data-theme-close>完成</button>';
      const options = dialog.querySelector(".cxq-theme-options");
      for (const [id, theme] of Object.entries(themes)) {
        const choice = document.createElement("button");
        choice.type = "button";
        choice.dataset.visualChoice = id;
        const preview = new Image();
        preview.src = new URL(theme.preview, root);
        preview.alt = "";
        const name = document.createElement("strong");
        name.textContent = theme.name;
        const description = document.createElement("span");
        description.textContent = theme.description;
        choice.append(preview, name, description);
        options.append(choice);
      }
      document.body.append(dialog);
      dialog.querySelectorAll("[data-visual-choice]").forEach(
        (b) =>
          (b.onclick = async () => {
            const status = dialog.querySelector(".cxq-theme-status");
            status.textContent = "準備配色素材…";
            dialog
              .querySelectorAll("[data-visual-choice]")
              .forEach((b) => (b.disabled = true));
            try {
              const applied = await choose(b.dataset.visualChoice);
              status.textContent = applied ? "配色已儲存" : "";
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
  const defaultRole = {
    tetris: "luck",
    2048: "hope",
    mines: "memory",
    memory: "night",
    link: "luck",
    whack: "joy",
    "brick-breaker": "hope",
    dino: "growth",
    flappy: "hope",
    "magic-bubble": "dream",
    "dream-match": "night",
    merge: "healing",
  };
  function decorate() {
    const title = document.querySelector(".mobile-title");
    if (title && !title.querySelector(".cxq-theme-button")) {
      title.querySelector("header").append(button());
      const hero = new Image();
      hero.className = "candy-title-role";
      hero.src = new URL(
        "rebuilt/role-" +
          defaultRole[document.body.dataset.mobileGame] +
          ".webp",
        root,
      );
      hero.alt = "";
      title.querySelector(".mobile-title-dock").before(hero);
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
    if (e.key !== key) return;
    const theme = knownTheme(e.newValue) ? e.newValue : "night";
    void choose(theme, { persist: false }).catch(() => {});
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
