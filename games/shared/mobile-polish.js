(() => {
  "use strict";
  const game = document.body.dataset.mobileGame,
    guide = window.CxQModeGuide?.[game];
  if (!guide) return;
  document.body.classList.add("mg-polished");
  if(game==='tetris'){
    const board=document.querySelector('#board');
    const frame=document.createElement('div');frame.className='mp-tetris-frame';board.before(frame);frame.append(board);
  }
  let brickArtPrepared=false;const bypass=new WeakSet();
  document.addEventListener('click',async event=>{
    if(game!=='brick-breaker'||brickArtPrepared)return;
    const button=event.target.closest('#startBtn,#continueBtn,.map-nodes button');
    if(!button||bypass.has(button)||button.disabled)return;
    event.preventDefault();event.stopImmediatePropagation();const label=button.textContent;button.disabled=true;button.textContent='準備遊玩素材…';
    try{await window.CxQBrickArtReady();brickArtPrepared=true;button.disabled=false;button.textContent=label;bypass.add(button);button.click();}
    catch{button.disabled=false;button.textContent='素材未完成載入，點此重試';}
  },true);
  const $ = (s) => document.querySelector(s),
    make = (tag, cls, text) => {
      const n = document.createElement(tag);
      n.className = cls;
      if (text) n.textContent = text;
      return n;
    };
  const isForm = (n) =>
    n?.closest?.("input,textarea,select,[contenteditable=true]");
  // Protect rapid game inputs without swallowing the second click or multi-touch controls.
  document.addEventListener("selectstart", (e) => {
    if (!isForm(e.target)) e.preventDefault();
  });
  document.addEventListener("dragstart", (e) => {
    if (!isForm(e.target)) e.preventDefault();
  });
  document.addEventListener("contextmenu", (e) => {
    if (!isForm(e.target)) e.preventDefault();
  });
  const touches = new Map();
  let lastTap = null;
  document.addEventListener(
    "touchstart",
    (e) => {
      for (const t of e.changedTouches)
        touches.set(t.identifier, {
          x: t.clientX,
          y: t.clientY,
          multi: e.touches.length > 1,
        });
      if (e.touches.length > 1) {
        lastTap = null;
        for (const p of touches.values()) p.multi = true;
      }
    },
    { passive: true },
  );
  document.addEventListener(
    "touchcancel",
    () => {
      touches.clear();
      lastTap = null;
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    (e) => {
      const t = e.changedTouches[0],
        p = t && touches.get(t.identifier);
      for (const item of e.changedTouches) touches.delete(item.identifier);
      if (
        !p ||
        p.multi ||
        e.touches.length ||
        isForm(e.target) ||
        Math.hypot(t.clientX - p.x, t.clientY - p.y) > 12
      ) {
        lastTap = null;
        return;
      }
      const now = performance.now(),
        double =
          lastTap &&
          now - lastTap.time < 360 &&
          Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30;
      lastTap = { time: now, x: t.clientX, y: t.clientY };
      if (double && e.cancelable) {
        e.preventDefault();
        const button = e.target.closest("button,a,[role=button]");
        if (button && !button.disabled && !button.onpointerdown)
          button.dispatchEvent(
            new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              detail: 1,
              clientX: t.clientX,
              clientY: t.clientY,
            }),
          );
      }
    },
    { passive: false },
  );
  document.addEventListener(
    "gesturestart",
    (e) => {
      if (e.target.closest("canvas,#board,.controls,.action-buttons"))
        e.preventDefault();
    },
    { passive: false },
  );
  document.querySelectorAll("img").forEach((n) => (n.draggable = false));

  function selectedMode() {
    if (guide.field === "whack-mode")
      return $("[data-mode][aria-pressed=true]")?.dataset.mode || "timed";
    if (guide.field === "entry-mode")
      return (
        $(".game-entry article select")?.value || Object.keys(guide.modes)[0]
      );
    return (
      (guide.field && $("#" + guide.field)?.value) ||
      Object.keys(guide.modes)[0]
    );
  }
  function showGuide() {
    const d = make("dialog", "mg-panel mp-guide");
    d.setAttribute("aria-label", guide.title + "玩法比較");
    d.append(make("h2", "", guide.title + "・玩法比較"));
    for (const [key, [name, short, description]] of Object.entries(
      guide.modes,
    )) {
      const a = make("article", "mp-guide-mode");
      if (key === selectedMode()) a.classList.add("is-current");
      a.append(
        make("h3", "", name),
        make("strong", "", short),
        make("p", "", description),
      );
      d.append(a);
    }
    d.append(make("p", "mp-guide-note", guide.note));
    const close = make("button", "primary", "知道了");
    close.onclick = () => d.close();
    d.append(close);
    d.addEventListener("close", () => d.remove(), { once: true });
    document.body.append(d);
    d.showModal();
  }
  function info() {
    const n = make("section", "mp-mode-info"),
      h = make("h3", ""),
      p = make("p", ""),
      button = make("button", "mp-compare", "比較全部玩法");
    button.type = "button";
    button.onclick = showGuide;
    n.append(h, p, button);
    n.update = () => {
      const v = guide.modes[selectedMode()] || Object.values(guide.modes)[0];
      if (h.textContent !== v[1]) h.textContent = v[1];
      if (p.textContent !== v[2]) p.textContent = v[2];
    };
    n.update();
    return n;
  }
  function soundButton() {
    const b = make("button", "mp-sound", "音樂與音效設定");
    b.type = "button";
    b.onclick = () => {
      const native =
        $("#cxq-audio") ||
        document.querySelector("body > #sound") ||
        $("#link-audio") ||
        $("#soundBtn");
      native?.click();
    };
    return b;
  }
  function tabs(host, definitions) {
    const nav = make("nav", "mp-tabs"),
      pages = make("div", "mp-pages");
    nav.setAttribute("aria-label", "整備分類");
    nav.setAttribute("role", "tablist");
    const list = definitions.filter((x) => x.nodes.length);
    list.forEach((def, i) => {
      const page = make("section", "mp-page mp-page-" + def.key),
        button = make("button", "mp-tab", def.label);
      page.id = "mp-" + game + "-" + def.key;
      page.setAttribute("role", "tabpanel");
      button.id = page.id + "-tab";
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", page.id);
      page.setAttribute("aria-labelledby", button.id);
      page.hidden = i !== 0;
      button.setAttribute("aria-selected", String(i === 0));
      const fields = make("div", "mp-page-fields");
      fields.append(...def.nodes);
      page.append(fields);
      if (def.key === "main") page.append(info());
      button.onclick = () => {
        for (const p of pages.children) p.hidden = p !== page;
        for (const b of nav.children)
          b.setAttribute("aria-selected", String(b === button));
      };
      nav.append(button);
      pages.append(page);
    });
    host.replaceChildren(nav, pages);
    host.classList.add("mp-tabbed");
    return pages;
  }
  function party(section, extras = []) {
    if (!section) return null;
    const grid = section.querySelector(
      "#roster,#roles,#characterRail,#cast-list",
    );
    const preview = make("div", "mp-party-preview"),
      choices = make("div", "mp-party-choices");
    if (grid) choices.append(grid);
    for (const n of extras) if (n) preview.append(n);
    for (const n of [...section.children]) {
      if (n.matches("details")) {
        const summary = n.querySelector("summary");
        if (summary) {
          summary.hidden = true;
          preview.append(summary);
        }
        continue;
      }
      if (n !== grid) preview.append(n);
    }
    const result=section.tagName==='DETAILS'?make('section',section.className):section;
    if(result!==section)section.replaceWith(result);
    result.replaceChildren(preview, choices);
    result.classList.add("mp-party");
    return result;
  }
  function arrangePreparation() {
    const selectors = {
      tetris: "#menu",
      mines: "#home",
      whack: "#home",
      dino: "#home",
      flappy: "#home",
      merge: "#home",
      "brick-breaker": "#menuOverlay .menu-card",
    };
    const host = selectors[game] && $(selectors[game]);
    if (!host || host.dataset.paged) return;
    const content = host.querySelector(":scope>.mg-prepare-content"),
      options = content?.querySelector(".mg-options");
    if (!options) return;
    host.dataset.paged = "true";
    const main = [],
      target = [],
      settings = [],
      vehicles = [],
      extras = [];
    for (const n of [...options.children]) {
      if (
        n.querySelector("#preset") ||
        n.id === "custom" ||
        n.querySelector("#routes,#stage") ||
        n.id === "mission-row"
      )
        target.push(n);
      else if(game==='flappy'&&n.querySelector('#vehicle'))vehicles.push(n);
      else if (
        n.querySelector(
          "#hand,#route,#vehicle,#trail,#theme,#guide,#preview",
        ) ||
        (["dino", "whack"].includes(game) && n.querySelector("#difficulty")) ||
        n.matches("details")
      )
        settings.push(n);
      else if (
        ["pilot", "companion", "greeting", "skill-description"].includes(n.id)
      )
        extras.push(n);
      else main.push(n);
    }
    const originalParty = content.querySelector(".mg-companions"),
      crew = party(originalParty, extras);
    if (game === "mines")
      for (const detail of settings.filter((n) => n.matches("details")))
        detail.open = true;
    const controls = make("section", "mp-preferences");
    controls.append(...settings, soundButton());
    if(vehicles.length){const preview=make('div','mp-vehicle-preview');const image=new Image();image.id='mp-flight-preview';image.alt='角色乘坐目前載具的預覽';preview.append(image,make('p','','載具只改變外觀，操作與碰撞規則相同。'));vehicles.unshift(preview);}
    const definitions = [
      { key: "main", label: "玩法", nodes: main },
      {
        key: "target",
        label:
          game === "mines"
            ? "地圖"
            : game === "flappy"
              ? "郵站"
              : game === "merge"
                ? "任務"
                : "路線",
        nodes: target,
      },
      {
        key: "party",
        label: game === "whack" ? "夥伴" : "旅伴",
        nodes: crew ? [crew] : extras,
      },
      {key:'vehicle',label:'載具',nodes:vehicles},
      {key:'operation',label:'操作',nodes:game==='mines'?[...controls.querySelectorAll('details')]:[]},
      { key: "settings", label: "設定", nodes: [controls] },
    ];
    tabs(content, definitions);
  }
  function arrangeLink() {
    if (game !== "link") return;
    const host = $("#setup .modal");
    if (!host || host.dataset.paged) return;
    host.dataset.paged = "true";
    const difficulty = $("#difficulty").closest(".field"),
      mode = $("#mode").closest(".field"),
      themes = $(".theme-grid").closest(".field"),
      actions = host.querySelector(".actions"),
      heading = host.querySelector(".mg-heading");
    const content = make("div", "mg-prepare-content"),
      settings = make("section", "mp-preferences");
    settings.append(soundButton());
    tabs(content, [
      { key: "main", label: "玩法", nodes: [mode] },
      { key: "deck", label: "牌桌", nodes: [difficulty, themes] },
      { key: "settings", label: "設定", nodes: [settings] },
    ]);
    const hidden = [$("#modalTitle"), $("#modalDesc")];
    hidden.forEach((n) => {
      n.hidden = true;
    });
    host.replaceChildren(...hidden, heading, content, actions);
    actions.classList.add("mg-prepare-footer");
    host.classList.add("mp-link-setup");
  }
  function arrangeMemory() {
    if (game !== "memory") return;
    const form = $("#layer.show .form");
    if(!form){$('#modal')?.classList.remove('mp-memory-setup');return;}
    if (form.dataset.paged) return;
    form.dataset.paged = "true";
    const groups = { main: [], deck: [], back: [] };
    const retained = [];
    for (const n of [...form.children]) {
      if (n.querySelector("#setMode")) groups.main.push(n);
      else if (n.querySelector("#setDiff,input[name=deck]"))
        groups.deck.push(n);
      else if (n.querySelector("input[name=back]")) groups.back.push(n);
      else {
        n.hidden = true;
        retained.push(n);
      }
    }
    tabs(form, [
      { key: "main", label: "玩法", nodes: groups.main },
      { key: "deck", label: "牌桌", nodes: groups.deck },
      { key: "back", label: "牌背", nodes: groups.back },
    ]);
    form.append(...retained);
    $("#modal").classList.add("mp-memory-setup");
  }
  function arrangePuzzle() {
    if (!["magic-bubble", "dream-match"].includes(game)) return;
    const article = $(".game-entry article");
    if (!article || article.dataset.paged) return;
    article.dataset.paged = "true";
    const labels = [...article.querySelectorAll(":scope>label")],
      start = [...article.querySelectorAll(":scope>button")].find(
        (n) => !/比較|設定/.test(n.textContent),
      ),
      heading = article.querySelector(".mg-heading");
    if (!start || !labels.length) return;
    const content = make("div", "mg-prepare-content"),
      settings = make("section", "mp-preferences");
    settings.append(soundButton());
    tabs(content, [
      { key: "main", label: "玩法", nodes: [labels[0]] },
      {
        key: "target",
        label: "關卡",
        nodes: labels
          .slice(1)
          .filter((n) =>
            [...n.querySelectorAll("select")].some((s) => s.options.length),
          ),
      },
      { key: "settings", label: "設定", nodes: [settings] },
    ]);
    const footer = make("footer", "mg-prepare-footer");
    footer.append(start);
    const home = $(".game-entry>.mobile-menu-home");
    article.replaceChildren(
      ...[home, heading, content, footer].filter(Boolean),
    );
    article.classList.add("mp-puzzle-setup");
  }
  const pagers = new WeakMap();
  function paginateSelect(select) {
    const group = select.nextElementSibling;
    if (!group?.matches(".mg-choice-group")) return;
    if (select.options.length < 5) return;
    let state = pagers.get(select);
    if (!state) {
      const bar = make("div", "mp-selector-pages"),
        prev = make("button", "", "上一頁"),
        label = make("span", ""),
        next = make("button", "", "下一頁");
      prev.type = next.type = "button";
      bar.append(prev, label, next);
      group.after(bar);
      state = {
        page: Math.floor(select.selectedIndex / 4),
        value: select.value,
        count: select.options.length,
        bar,
        label,
        prev,
        next,
      };
      pagers.set(select, state);
      prev.onclick = () => {
        state.page--;
        update();
      };
      next.onclick = () => {
        state.page++;
        update();
      };
      group.classList.add("mp-paginated");
    }
    function update() {
      const count = Math.ceil(select.options.length / 4);
      state.page = Math.max(0, Math.min(state.page, count - 1));
      [...group.children].forEach((n, i) => {
        n.hidden = Math.floor(i / 4) !== state.page;
      });
      state.prev.disabled = state.page === 0;
      state.next.disabled = state.page >= count - 1;
      const text = `${state.page + 1} / ${count}`;
      if (state.label.textContent !== text) state.label.textContent = text;
    }
    if (state.value !== select.value || state.count !== select.options.length) {
      state.page = Math.floor(select.selectedIndex / 4);
      state.value = select.value;
      state.count = select.options.length;
    }
    update();
  }
  function modeSelect(select) {
    return guide.field === "entry-mode"
      ? select === $(".game-entry article select")
      : select.id === guide.field;
  }
  function enrich() {
    if(game==='flappy'&&$('#mp-flight-preview')){const image=$('#mp-flight-preview'),role=typeof G!=='undefined'?G.data.role:0,src=window.CxQFlightArt(role,$('#vehicle').value);if(image.getAttribute('src')!==src)image.src=src;}
    document.querySelectorAll("select").forEach((select) => {
      paginateSelect(select);
      if (!modeSelect(select)) return;
      for (const b of select.nextElementSibling?.querySelectorAll(
        "button[data-value]",
      ) || []) {
        const entry = guide.modes[b.dataset.value];
        if (!entry || b.querySelector(".mp-mode-short")) continue;
        b.append(make("small", "mp-mode-short", entry[1]));
      }
    });
    if (game === "whack")
      for (const b of document.querySelectorAll("#modes button")) {
        if (!b.querySelector(".mp-mode-short"))
          b.append(
            make(
              "small",
              "mp-mode-short",
              guide.modes[b.dataset.mode]?.[1] || "",
            ),
          );
      }
    document.querySelectorAll(".mp-mode-info").forEach((n) => n.update?.());
    document.querySelectorAll(".mp-page-target").forEach((page) => {
      const children = [...page.querySelector(".mp-page-fields").children],
        available = children.some(
          (n) =>
            !n.hidden &&
            (!n.querySelector("select") ||
              [...n.querySelectorAll("select")].some((s) => !s.disabled)),
        );
      const tab = document.getElementById(page.id + "-tab");
      if (tab) {
        tab.disabled = !available;
        tab.title = available ? "" : "目前玩法不需要指定此項";
      }
    });
    const bar = $(".mobile-title .mobile-function-bar");
    if (bar && !bar.querySelector(".mp-home-guide")) {
      const b = make(
        "button",
        "mobile-function mp-home-guide",
        Object.keys(guide.modes).length > 1 ? "玩法比較" : "玩法",
      );
      b.type = "button";
      const img = new Image();
      img.src = "../shared/mobile-brand/guide.webp";
      img.alt = "";
      b.prepend(img);
      b.onclick = showGuide;
      bar.append(b);
    }
    for (const panel of document.querySelectorAll(
      ".pause-card,#pauseOverlay .menu-card,#game-dialog",
    )) {
      if (!/暫停|休息|停下/.test(panel.querySelector("h2")?.textContent || ""))
        continue;
      if (!panel.querySelector(".mp-sound")) panel.append(soundButton());
    }
  }
  function refresh() {
    arrangePreparation();
    arrangeLink();
    arrangeMemory();
    arrangePuzzle();
    enrich();
    const homeButton=document.querySelector(".mobile-menu-home"), homeHeading=document.querySelector(".mg-preparation .mg-heading,.mp-puzzle-setup .mg-heading,.mp-link-setup .mg-heading");
    if(homeButton&&homeHeading&&homeButton.parentElement!==homeHeading)homeHeading.prepend(homeButton);
  }
  document.addEventListener("change", () => queueMicrotask(refresh));
  document.addEventListener("click", (e) => {
      if (e.target.closest("[data-mode],.roster button,.char-card")) queueMicrotask(refresh);
  });
  let scheduled = false;
  new MutationObserver((records) => {
    const relevant = records.some((r) =>
      r.type === "attributes"
        ? r.target.matches("select,option,.mobile-title")
        : [...r.addedNodes].some(
            (n) =>
              n.nodeType === 1 &&
              (n.matches(
                "select,option,dialog,.form,.game-entry,.mobile-function-bar,h2",
              ) ||
                n.querySelector("select,.form,h2")),
          ) || r.target.matches?.("h2,#modalTitle,#resultTitle"),
    );
    if (relevant && !scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        refresh();
      });
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["open", "disabled"],
  });
  window.CxQMobileGuide = { open: showGuide, refresh };
  refresh();
})();
