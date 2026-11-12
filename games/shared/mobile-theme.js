/* Shared visual preference. Raster assets change; rules and saves do not. */
(() => {
  "use strict";
  const root = new URL(".", document.currentScript.src),
    key = "cxq-visual-theme-v1";
  const additions = {
    emerald: ["翡翠街機", "翡翠琺瑯與雕金"],
    toy: ["奶油玩具屋", "奶油色木製玩具"],
    paper: ["童話紙劇場", "分層剪紙與紙雕"],
    pixel: ["像素掌機", "復古點陣與掌機邊框"],
  };
  const tetrisPath = new URL("../tetris/", root).pathname;
  const isTetris = tetrisPath === new URL(".", location.href).pathname;
  const isNewTheme = (theme) => Object.hasOwn(additions, theme);
  const localArt = (theme, name) => new URL("../tetris/art/" + theme + "/" + name + ".webp?v=" + (name === "home" ? "20261113-parity1" : "20261113-audit2"), root).href;
  const supported = (theme) => theme === "night" || theme === "candy" || (isTetris && isNewTheme(theme));
  const tetrisImages = {
    "mobile-art/tetris.webp": "home",
    "mobile-brand/tetris.webp": "title",
    "mobile-brand/guide.webp": "icon-guide",
    "rebuilt/icon-play.webp": "icon-play",
    "rebuilt/icon-rotate.webp": "icon-rotate",
    "rebuilt/icon-pause.webp": "icon-pause",
    "rebuilt/icon-drop.webp": "icon-drop",
    "rebuilt/icon-hold.webp": "icon-hold",
  };
  for (const [index, type] of [..."IOTSZJL"].entries())
    tetrisImages["rebuilt/block-" + index + ".webp"] = "block-" + type;
  const roles = ["luck", "healing", "growth", "memory", "joy", "night", "trust", "dream", "sadness", "hope"];
  for (const role of roles) {
    for (const name of ["role-" + role, role + "-idle", role + "-victory"])
      tetrisImages["rebuilt/" + name + ".webp"] = name;
  }
  const tetrisSurfaces = ["panel", "card", "active", "primary", "hud", "board", "dock", "secondary", "home-primary", "toolbar", "stage"];
  function tetrisArtName(path) {
    if (path === tetrisPath + "lantern-cover.webp") return "cover";
    return path.startsWith(root.pathname) ? tetrisImages[path.slice(root.pathname.length)] : undefined;
  }
  let current = "night";
  try {
    const saved = localStorage.getItem(key);
    if (supported(saved)) current = saved;
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
    if (theme !== "candy" && !(isTetris && isNewTheme(theme))) return value;
    let path;
    try {
      path = new URL(value, document.baseURI).pathname;
    } catch {
      return value;
    }
    const tetrisName = isTetris ? tetrisArtName(path) : undefined;
    if (theme === "candy" && tetrisName?.startsWith("block-")) return localArt(theme, tetrisName);
    if (isTetris && isNewTheme(theme)) {
      const name = tetrisName;
      return name ? localArt(theme, name) : value;
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
      if (asset(original, "candy") !== original || (isTetris && asset(original, "emerald") !== original))
        bindings.set(this, original);
      descriptor.set.call(this, mapped);
    },
  });
  let request = 0;
  async function choose(theme, { remember = true } = {}) {
    if (!supported(theme)) return;
    const selection = ++request;
    if (isNewTheme(theme)) {
      const visibleNames = [...bindings.values()].map(source => {
        const path = new URL(source, document.baseURI).pathname;
        return tetrisArtName(path);
      }).filter(Boolean);
      await Promise.all([...new Set([...tetrisSurfaces, ...visibleNames])].map((name) => {
        const image = new Image();
        image.src = localArt(theme, name);
        return image.decode();
      }));
    }
    if (theme === "candy")
      await Promise.all(
        [...files.map(f => new URL("candy/" + f + ".webp", root).href),
          ...(isTetris ? [
            new URL("rebuilt/role-luck.webp", root).href,
            ...[..."IOTSZJL"].map(type => localArt("candy", "block-" + type)),
          ] : [])].map((src) => {
          const i = new Image();
          i.src = src;
          return i.decode();
        }),
      );
    if (selection !== request) return;
    current = theme;
    document.documentElement.dataset.visualTheme = theme;
    if (remember) {
      try {
        localStorage.setItem(key, theme);
      } catch {}
    }
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
      if (isTetris) {
        const options = dialog.querySelector(".cxq-theme-options");
        for (const [style, [name, description]] of Object.entries(additions)) {
          const option = document.createElement("button");
          option.type = "button";
          option.dataset.visualChoice = style;
          option.innerHTML = '<img alt=""><strong></strong><span></span>';
          option.querySelector("img").src = new URL("styles/" + style + "/panel.webp", root);
          option.querySelector("strong").textContent = name;
          option.querySelector("span").textContent = description;
          options.append(option);
        }
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
      if (isTetris) hero.fetchPriority = "high";
      title.querySelector(".mobile-title-dock").before(hero);
    }
    for (const host of document.querySelectorAll(".mp-preferences,.cp-card"))
      if (!host.querySelector(".cxq-theme-button")) host.append(button());
  }
  addEventListener("DOMContentLoaded", () => {
    const game = document.body.dataset.mobileGame;
    if (isTetris) {
      for (const image of document.images) {
        const source = image.getAttribute("src");
        if (source && !bindings.has(image) && asset(source, "emerald") !== source)
          image.src = source;
      }
    }
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
    if (e.key === key) void choose(supported(e.newValue) ? e.newValue : "night", { remember: false }).catch(() => {});
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
