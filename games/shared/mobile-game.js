/* Mobile presentation owns layout and input affordances; original engines own rules and saves. */
(() => {
  "use strict";
  const game = document.body.dataset.mobileGame;
  if (!game) return;
  const $ = (s) => document.querySelector(s);
  const landscape = ["mines", "link", "dino"].includes(game);
  document.body.classList.add("mg-game");
  document.body.dataset.orientation = landscape ? "landscape" : "portrait";
  const root = "../shared/rebuilt/";
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  function heading() {
    const h = make("header", "mg-heading");
    const image = new Image();
    image.src = "../shared/mobile-brand/" + game + ".webp";
    image.alt = document.title.replace("CxQ ", "");
    const p = make("p", "mg-kicker", "準備旅程");
    h.append(image, p);
    return h;
  }
  function field(node, label) {
    const wrap = make("div", "mg-field");
    if (label) wrap.append(make("h3", "", label));
    wrap.append(node);
    return wrap;
  }
  function prepare(host, panels, buttons, role) {
    if (!host) return;
    host.classList.add("mg-preparation");
    const existingHome = host.querySelector(".mobile-menu-home");
    const content = make("div", "mg-prepare-content");
    const options = make("div", "mg-options");
    panels.filter(Boolean).forEach((n) => options.append(n));
    content.append(options);
    if (role) {
      role.classList.add("mg-companions");
      content.append(role);
    }
    const footer = make("footer", "mg-prepare-footer");
    buttons.filter(Boolean).forEach((n) => footer.append(n));
    host.replaceChildren(
      ...[existingHome, heading(), content, footer].filter(Boolean),
    );
  }
  if (game === "tetris") {
    const role = make("section", "mg-party");
    role.append(
      make("h2", "", "選擇旅伴"),
      $("#detailCharImg"),
      $("#detailCharName"),
      $("#detailCharPower"),
      $("#roster"),
    );
    prepare(
      $("#menu"),
      [
        field($("#journeyRule"), "旅程規則"),
        $("#blessingMode").closest("label"),
      ],
      [$("#start"), $("#backHome")],
      role,
    );
  }
  if (game === "mines") {
    const role = make("section", "mg-party");
    role.append(make("h2", "", "探險夥伴"), $("#roles"), $("#partner-line"));
    prepare(
      $("#home"),
      [
        field($("#mode"), "勘查規則"),
        field($("#preset"), "地圖大小"),
        $("#custom"),
        $("#home details"),
      ],
      [$("#start"), $("#tutorial"), $("#records")],
      role,
    );
  }
  if (["dino", "flappy", "merge", "whack"].includes(game)) {
    const setup = $(".action-setup");
    const nodes = [...setup.children].filter(
      (n) => !n.matches("h2,button,nav"),
    );
    const buttons = [
      ...setup.querySelectorAll(":scope > button,:scope > nav > button"),
    ];
    const role = nodes.find(
      (n) => n.matches("details") && n.querySelector("#roles,#cast-list"),
    );
    prepare(
      $("#home"),
      nodes.filter((n) => n !== role),
      buttons,
      role,
    );
    if (role) role.open = true;
  }
  if (game === "link") {
    $("#setup .modal").classList.add("mg-preparation", "mg-link-prepare");
    $("#setup .modal").prepend(heading());
    $("#modalTitle").textContent = "選擇織光旅程";
  }
  if (game === "2048") {
    const stage = $(".number-play"),
      toolbar = $(".number-actions");
    toolbar.append(...$(".number-tools").children);
    const nodes = [
      $(".number-panel .stats"),
      $("#board"),
      $(".number-panel .hero"),
      toolbar,
      $(".tip"),
      $("#toast"),
    ];
    stage.replaceChildren(...nodes);
    stage.classList.add("mg-number-play");
  }
  if (game === "brick-breaker") {
    const card = $("#menuOverlay .menu-card");
    const role = make("section", "mg-party");
    role.append(
      $("#heroArt"),
      $("#selectedCharName"),
      $("#skillName"),
      $("#skillDesc"),
      $("#characterRail"),
    );
    prepare(
      card,
      [field($("#difficulty"), "旅程難度"), field($("#mode"), "旅程模式")],
      [$("#startBtn"), $("#howBtn"), $("#mapBtn"), $("#characterBackBtn")],
      role,
    );
  }
  // Upgrade actual selects rather than keeping a second set of gameplay settings.
  const enhanced = new WeakMap();
  const illustrations = {
    marathon: "rotate",
    sprint: "drop",
    zen: "hold",
    standard: "flag",
    logic: "hint",
    practice: "play",
    easy: "play",
    medium: "star",
    normal: "star",
    hard: "skill",
    expert: "skill",
    mission: "flag",
    endless: "rotate",
    classic: "play",
    time: "drop",
    preview: "hint",
    chaos: "shuffle",
    sky: "plane",
    forest: "leaf",
    moon: "cloud",
    warm: "star",
    night: "skill",
  };
  function enhanceSelect(select) {
    if (
      enhanced.has(select) ||
      select.id === "zoom" ||
      select.closest("#audio-dialog")
    )
      return;
    const group = make("div", "mg-choice-group");
    group.setAttribute("role", "group");
    const label =
      select.getAttribute("aria-label") ||
      select.labels?.[0]?.childNodes[0]?.textContent?.trim() ||
      select.previousElementSibling?.textContent ||
      "選擇設定";
    group.setAttribute("aria-label", label);
    select.classList.add("mg-native-setting");
    select.after(group);
    let signature = "";
    const sync = () => {
      const next = [...select.options]
        .map((o) => [o.value, o.text, o.disabled].join("|"))
        .join(";");
      if (signature !== next) {
        signature = next;
        group.replaceChildren();
        for (const option of select.options) {
          const button = make("button", "mg-choice");
          button.type = "button";
          button.dataset.value = option.value;
          const icon = new Image();
          icon.alt = "";
          icon.src =
            root + "icon-" + (illustrations[option.value] || "star") + ".webp";
          button.append(icon, make("span", "", option.text));
          button.addEventListener("click", (e) => {
            e.preventDefault();
            if (option.disabled || select.disabled) return;
            select.value = option.value;
            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));
            sync();
            queueMicrotask(() =>
              document
                .querySelectorAll("select")
                .forEach((s) => enhanced.get(s)?.()),
            );
          });
          group.append(button);
        }
      }
      [...group.children].forEach((b) => {
        const option = [...select.options].find(
          (o) => o.value === b.dataset.value,
        );
        b.classList.toggle("is-selected", select.value === b.dataset.value);
        b.setAttribute(
          "aria-pressed",
          String(select.value === b.dataset.value),
        );
        b.disabled = select.disabled || !!option?.disabled;
      });
    };
    enhanced.set(select, sync);
    select.addEventListener("change", sync);
    sync();
  }
  const iconMap = {
    left: "left",
    right: "right",
    soft: "down",
    rotate: "rotate",
    drop: "drop",
    hold: "hold",
  };
  function decorate() {
    document.querySelectorAll("select").forEach(enhanceSelect);
    document.querySelectorAll(".stars").forEach((stars) => {
      if (stars.dataset.illustrated || !/[★☆]/.test(stars.textContent)) return;
      const earned = [...stars.textContent].filter((c) => c === "★").length;
      stars.dataset.illustrated = "true";
      stars.setAttribute("aria-label", `獲得 ${earned} 顆星，共 3 顆`);
      stars.replaceChildren(
        ...Array.from({ length: 3 }, (_, i) => {
          const icon = new Image();
          icon.src = root + "star.webp";
          icon.alt = "";
          icon.className = i < earned ? "earned" : "unearned";
          return icon;
        }),
      );
    });
    document
      .querySelectorAll(".mg-preparation select")
      .forEach((s) => enhanced.get(s)?.());
    const controls = {
      pauseBtn: "pause",
      pause: "pause",
      pauseBtn2: "pause",
      resume: "play",
      resumeBtn: "play",
      hint: "hint",
      shuffle: "shuffle",
      undo: "undo",
      jump: "jump",
      slide: "slide",
      skill: "skill",
      ability: "skill",
      "flag-mode": "flag",
      "reveal-mode": "hand",
      activeSkillBtn: "skill",
      burst: "skill",
      next: "shuffle",
    };
    for (const [id, icon] of Object.entries(controls)) {
      const n = $("#" + id);
      if (n?.tagName === "BUTTON" && !n.closest(".mobile-title")) {
        n.classList.add("mg-icon-control");
        n.style.setProperty("--control-art", `url('${root}icon-${icon}.webp')`);
      }
    }
    document.querySelectorAll("[data-act]").forEach((n) => {
      n.classList.add("mg-icon-control");
      n.style.setProperty(
        "--control-art",
        `url('${root}icon-${iconMap[n.dataset.act]}.webp')`,
      );
    });
    document
      .querySelectorAll(
        "#modal,.modal-mask>.modal,dialog:not(.mobile-title):not(.mg-orientation),.pause-card,#result>section,#result>div,#pauseOverlay .menu-card,#resultOverlay .menu-card,.rules-book,.map-screen",
      )
      .forEach((n) => n.classList.add("mg-panel"));
    const roles = [
      "luck",
      "healing",
      "growth",
      "memory",
      "joy",
      "night",
      "trust",
      "dream",
      "sadness",
      "hope",
    ];
    const defaults = {
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
    let role = defaults[game];
    if (typeof G !== "undefined" && Number.isInteger(G.data?.role))
      role = roles[G.data.role];
    if (game === "brick-breaker")
      role =
        { rain: "sadness", heal: "healing", forest: "growth" }[
          window.heartlightCharacter
        ] ||
        window.heartlightCharacter ||
        "hope";
    for (const panel of document.querySelectorAll(".mg-panel")) {
      if (
        panel.classList.contains("mg-preparation") ||
        panel.classList.contains("mg-orientation") ||
        panel.querySelector(":scope>img:not(.mg-panel-mark)")
      )
        continue;
      const heading = panel.querySelector("h2")?.textContent || "";
      if (!/暫停|休息|完成|結束|相遇|解鎖|沉睡|紀錄|手冊|玩法/.test(heading))
        continue;
      let mark = panel.querySelector(".mg-panel-mark");
      if (!mark) {
        mark = new Image();
        mark.className = "mg-panel-mark";
        mark.alt = "";
        panel.prepend(mark);
      }
      const src = /紀錄/.test(heading)
        ? "../shared/mobile-brand/records.webp"
        : /手冊|玩法/.test(heading)
          ? "../shared/mobile-brand/guide.webp"
          : root +
            role +
            (/完成|相遇|解鎖/.test(heading) ? "-victory" : "-idle") +
            ".webp";
      if (mark.getAttribute("src") !== src) mark.src = src;
    }
    const memory = game === "memory" && $("#layer.show .form");
    if (memory) $("#modal").classList.add("mg-memory-prepare");
    else if (game === "memory")
      $("#modal")?.classList.remove("mg-memory-prepare");
    const entry = $(".game-entry article");
    if (entry && !entry.classList.contains("mg-preparation")) {
      entry.classList.add("mg-preparation");
      entry.prepend(heading());
      entry.querySelector(".entry-title")?.remove();
      entry.querySelector(".entry-cast")?.remove();
    }
  }
  let scheduled = false;
  const observer = new MutationObserver((records) => {
    const relevant=records.some(record=>record.target.matches?.('select,h2,#modalTitle,#resultTitle')||[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches('select,option,dialog,.form,.game-entry,.modalBtns,.stars,h2')||node.querySelector('select,.form,h2'))));
    if(!relevant)return;
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        decorate();
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  decorate();
  // Prevent the browser from interpreting game controls as page gestures.
  document
    .querySelectorAll("canvas,#board,.controls,.action-buttons")
    .forEach((n) => {
      n.style.touchAction =
        n.id === "board" && ["memory", "mines", "link"].includes(game)
          ? "pan-x pan-y"
          : "none";
      n.addEventListener("contextmenu", (e) => e.preventDefault());
    });
  // Pause before covering a running game; resuming remains an explicit player action.
  function pauseForViewport() {
    if (window.CxQ?.hold) {
      window.CxQ.hold("orientation");
      return;
    }
    if (typeof G !== "undefined" && G.hold) G.hold();
    const button =
      game === "brick-breaker"
        ? $("#pauseBtn")
        : $("#play:not([hidden]) #pause");
    if (
      button &&
      !document.querySelector(
        "dialog[open]:not(.mg-orientation),.pause-overlay.show,#pauseOverlay:not(.hidden)",
      )
    )
      button.click();
  }
  const gate = make("dialog", "mg-orientation mg-panel");
  gate.setAttribute("aria-label", "手機方向提示");
  const phone = new Image();
  phone.src = root + "icon-rotate.webp";
  phone.alt = "";
  gate.append(
    phone,
    make("h2", "", landscape ? "請橫拿手機" : "請直拿手機"),
    make(
      "p",
      "",
      landscape
        ? "橫向操作能看清完整路線與棋盤。"
        : "直向操作能保留完整遊玩高度。",
    ),
  );
  gate.addEventListener("cancel", (e) => e.preventDefault());
  document.body.append(gate);
  let wrongBefore = false;
  function orientation() {
    const touch =
      matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    const wrong =
      touch &&
      (landscape ? innerHeight > innerWidth : innerWidth > innerHeight);
    document.body.classList.toggle("mg-wrong-direction", wrong);
    if (wrong && !wrongBefore) {
      pauseForViewport();
      if (!gate.open) gate.showModal();
    }
    if (!wrong && gate.open) gate.close();
    if (!wrong && wrongBefore && game === "2048") window.CxQ?.resume();
    wrongBefore = wrong;
  }
  addEventListener("resize", orientation);
  addEventListener("orientationchange", orientation);
  orientation();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseForViewport();
  });
  if (window.CxQ?.orientation)
    window.CxQ.orientation = (required, active) => {
      const mismatch =
        (navigator.maxTouchPoints > 0 ||
          matchMedia("(pointer:coarse)").matches) &&
        (required === "portrait"
          ? innerWidth > innerHeight
          : innerHeight > innerWidth);
      if (active && mismatch) window.CxQ.hold("orientation");
      return active && mismatch;
    };
  const returnIDs = {
    tetris: ["home", "backHome"],
    memory: ["back"],
    2048: ["numberHome"],
    "brick-breaker": ["characterBackBtn", "backMenuBtn", "resultMenuBtn"],
    link: ["close"],
  };
  for (const id of returnIDs[game] || [])
    $("#" + id)?.addEventListener("click", () =>
      setTimeout(() => window.CxQTitle?.show(), 0),
    );
  function confirmChoice(message, accept) {
    const dialog = make("dialog", "mg-panel mg-confirm");
    dialog.append(make("h2", "", "重新開始？"), make("p", "", message));
    const actions = make("div", "dialog-actions"),
      cancel = make("button", "", "保留目前旅程"),
      yes = make("button", "primary", "開始新旅程");
    cancel.type = yes.type = "button";
    cancel.onclick = () => dialog.close();
    yes.onclick = () => {
      dialog.close();
      accept();
    };
    actions.append(cancel, yes);
    dialog.append(actions);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
    cancel.focus();
  }
  window.CxQMobile = {
    game,
    orientation: landscape ? "landscape" : "portrait",
    checkOrientation: orientation,
    refresh: decorate,
    confirm: confirmChoice,
  };
})();
