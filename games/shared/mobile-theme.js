/* Shared visual preference. Raster assets change; rules and saves do not. */
(() => {
  "use strict";
  const root = new URL(".", document.currentScript.src),
    key = "cxq-visual-theme-v1";
  let current = "night";
  try {
    if (localStorage.getItem(key) === "candy") current = "candy";
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
  async function choose(theme) {
    if (theme === "candy")
      await Promise.all(
        files.map((f) => {
          const i = new Image();
          i.src = new URL("candy/" + f + ".webp", root);
          return i.decode();
        }),
      );
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
        '<h2>選擇遊戲配色</h2><p>十二款共用這項選擇，下次開啟也會記住。</p><div class="cxq-theme-options"><button data-visual-choice="night"><img src="' +
        new URL("rebuilt/panel.webp", root) +
        '" alt=""><strong>星夜經典</strong><span>深藍、森林綠與金色</span></button><button data-visual-choice="candy"><img src="' +
        new URL("candy/panel.webp", root) +
        '" alt=""><strong>晴日糖果</strong><span>奶油白、蜜桃粉與薄荷綠</span></button></div><p class="cxq-theme-status" role="status"></p><button data-theme-close>完成</button>';
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
              await choose(b.dataset.visualChoice);
              status.textContent = "配色已儲存";
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
    if (e.key === key) void choose(e.newValue === "candy" ? "candy" : "night");
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
