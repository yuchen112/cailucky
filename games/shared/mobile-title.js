(() => {
  const game = document.body.dataset.mobileGame;
  const config = {
    2048: {
      title: "星願 2048",
      label: "數字合併",
      description: "輕滑星盤，讓相同的數字相遇。",
      home: ".home-screen",
      actions: [
        ["繼續遊戲", "#homeContinue"],
        ["開始新局", "#homeStart"],
        ["表情圖鑑", "#homeGallery"],
      ],
    },
    tetris: {
      title: "心境織境",
      label: "落下方塊",
      description: "看準落點，消成完整一行。",
      home: "#homeScreen",
      actions: [
        ["選擇旅程", "#enterSetup"],
        ["直接玩經典", "#quickClassic"],
        ["玩法", "#showHowto"],
      ],
    },
    mines: {
      title: "四葉草探險地圖",
      label: "地圖推理",
      description: "依數字找出安全格，替陷阱插上旗。",
      home: "#home",
      actions: [
        ["選擇勘查任務", null],
        ["玩法圖解", "#tutorial"],
        ["探險紀錄", "#records"],
      ],
    },
    memory: {
      title: "暮光回憶收藏室",
      label: "翻牌收藏",
      description: "翻開兩張牌，把相同的回憶收在一起。",
      home: "#home",
      actions: [
        ["選擇回憶旅程", "#start"],
        ["繼續上次的回憶", "@resume"],
        ["紀錄與收藏", "#ranks"],
      ],
    },
    link: {
      title: "夢境織光",
      label: "連線配對",
      description: "最多轉兩次彎，連起一對相同圖案。",
      home: "#link-home",
      actions: [
        ["選擇連線旅程", "#link-begin"],
        ["繼續上次的織光", "@resume"],
        ["玩法", "#link-rules"],
      ],
    },
    whack: {
      title: "森林敲敲樂",
      label: "反應挑戰",
      description: "等夥伴探頭再敲，留意混進來的炸彈。",
      home: "#home",
      actions: [
        ["選擇挑戰", null],
        ["森林紀錄", "#records"],
      ],
    },
    "brick-breaker": {
      title: "心光旅團",
      label: "擋板反彈",
      description: "接住心光球，打開通往下一章的道路。",
      home: "#homeOverlay",
      actions: [
        ["開始旅程", "#homeStartBtn"],
        ["繼續旅程", "@continueBtn"],
        ["旅程地圖", "#homeMapBtn"],
      ],
    },
    dino: {
      title: "森林急件快遞",
      label: "跑酷配送",
      description: "跳過樹根，滑過低枝，把信送到終點。",
      home: "#home",
      actions: [
        ["選擇配送路線", null],
        ["配送手帳", "#journal"],
        ["角色紀錄", "#records"],
      ],
    },
    flappy: {
      title: "星願飛行郵差",
      label: "點按飛行",
      description: "拍翅穿過郵站空隙，把一路上的信收好。",
      home: "#home",
      actions: [
        ["選擇航程", null],
        ["郵件收藏", "#letters"],
        ["航程紀錄", "#records"],
      ],
    },
    "magic-bubble": {
      title: "魔法泡泡龍",
      label: "瞄準射擊",
      description: "拖曳瞄準，連起三顆同色泡泡。",
      home: ".game-entry",
      actions: [
        ["選擇泡泡挑戰", null],
        ["玩法", "#help"],
      ],
    },
    "dream-match": {
      title: "夢境消除",
      label: "寶石三消",
      description: "交換相鄰寶石，完成這一關的夢境目標。",
      home: ".game-entry",
      actions: [
        ["選擇夢境關卡", null],
        ["玩法", "#guideBtn"],
      ],
    },
    merge: {
      title: "心光合成屋",
      label: "落球合成",
      description: "挑好落點，讓一樣的收藏球碰在一起。",
      home: "#home",
      actions: [
        ["選擇合成玩法", null],
        ["打開收藏架", "#collection"],
        ["我的紀錄", "#records"],
      ],
    },
  }[game];
  if (!config) return;
  const select = (selector) => document.querySelector(selector);
  const home = select(config.home);
  if (!home) return;
  const hall = "../classic-hall/index.html?v=20261012-mobile1";
  const title = document.createElement("dialog");
  title.className = "mobile-title";
  title.dataset.theme = game;
  title.setAttribute("aria-labelledby", "mobile-game-title");
  title.innerHTML =
    '<div class="mobile-title-layout"><img class="mobile-title-art" alt="">' +
    '<header><a class="mobile-return">‹ 返回</a><span>CxQ</span></header>' +
    '<div class="mobile-title-name"><p></p><img class="mobile-game-logo" alt=""><h1 id="mobile-game-title" tabindex="-1"></h1></div>' +
    '<section class="mobile-title-dock" aria-label="遊戲選單"><p></p><div class="mobile-title-actions"></div><nav class="mobile-function-bar" aria-label="遊戲功能"></nav></section></div>';
  const scene = title.querySelector(".mobile-title-art");
  const logo = title.querySelector(".mobile-game-logo");
  const role = new Image();
  role.className = "mobile-title-role";
  role.alt = "";
  logo.alt = config.title;
  const illustration = document.createElement("div");
  illustration.className = "mobile-title-illustration";
  illustration.append(role);
  title.querySelector(".mobile-title-dock").before(illustration);
  const propName = { tetris: "block-T.webp", 2048: "tile.webp", flappy: "title-glider.webp", whack: "burrow.webp", "brick-breaker": "paddle.webp" }[game];
  const prop = propName ? new Image() : null;
  if (prop) {
    prop.className = "mobile-title-prop";
    prop.alt = "";
    illustration.append(prop);
  }
  const sceneNames = {
    tetris: "home", whack: "clearing", dino: "forest", flappy: "sky",
  };
  function syncTitleArt() {
    const theme = document.documentElement.dataset.visualTheme;
    const style = { candy: "toy", paper: "paper", pixel: "pixel" }[theme] || "emerald";
    const folder = "art/" + style + "/";
    scene.src = folder + (sceneNames[game] || "stage") + ".webp";
    logo.src = folder + "title.webp";
    role.src = folder + "title-role.webp";
    if (prop) prop.src = folder + propName;
  }
  syncTitleArt();
  addEventListener("cxq-theme-change", syncTitleArt);
  title.querySelector("header a").href = hall;
  title.querySelector(".mobile-title-name p").textContent =
    "CxQ　·　" + config.label;
  title.querySelector("h1").textContent = config.title;
  title.querySelector(".mobile-title-dock p").textContent = config.description;
  const actions = title.querySelector(".mobile-title-actions");
  const newButton = document.createElement("button");
  newButton.type = "button";
  newButton.className = "mobile-menu-home";
  newButton.textContent = "‹ 遊戲首頁";
  home.prepend(newButton);

  function destination(target) {
    if (target === "@resume")
      return [...home.querySelectorAll("button")].find(
        (button) =>
          !button.hidden && button.textContent.trim().startsWith("繼續上次"),
      );
    if (target === "@continueBtn") {
      const button = select("#continueBtn");
      return button && !button.disabled ? button : null;
    }
    return target ? select(target) : null;
  }

  function showTitle() {
    if (title.open) return;
    actions.replaceChildren();
    const functions = title.querySelector(".mobile-function-bar");
    functions.replaceChildren();
    for (const [label, target] of config.actions) {
      if (target?.startsWith("@") && !destination(target)) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", label);
      const primary = !actions.children.length;
      button.className = primary ? "mobile-primary" : "mobile-function";
      if (primary) {
        const strong = document.createElement("strong");
        strong.textContent = label.includes("繼續") ? "繼續遊戲" : "開始遊戲";
        const sub = document.createElement("small");
        sub.textContent = game==="tetris"?"選擇模式與旅伴":label;
        button.append(strong, sub);
      } else {
        const icon = document.createElement("img");
        icon.alt = "";
        icon.src =
          "../shared/mobile-brand/" +
          (/紀錄/.test(label)
            ? "records"
            : /收藏|圖鑑|地圖/.test(label)
              ? "collection"
              : /經典/.test(label)
                ? "settings"
                : "guide") +
          ".webp";
        const text = document.createElement("span");
        text.textContent = target?.startsWith("@")
          ? "繼續進度"
          : target === "#homeStart"
            ? "開始新局"
            : label.replace(
                /打開|我的|森林|航程|角色|探險|旅程|配送|表情|與收藏/g,
                "",
              );
        if(game==="tetris"){if(target==="#quickClassic"){icon.src="../shared/rebuilt/icon-play.webp";text.textContent="經典快玩";}else if(target==="#showHowto"){text.textContent="操作說明";}}
        button.append(icon, text);
      }
      button.addEventListener("click", () => {
        title.close();
        const next = destination(target);
        if (next) next.click();
        else
          (
            home.querySelector("select, button:not(.mobile-menu-home)") ||
            newButton
          ).focus();
      });
      (primary ? actions : functions).append(button);
    }
    title.showModal();
    title.querySelector("h1").focus({ preventScroll: true });
  }

  document.body.append(title);
  newButton.addEventListener("click", showTitle);
  title.addEventListener("cancel", (event) => event.preventDefault());
  window.CxQTitle = {show:showTitle};
  showTitle();
})();
