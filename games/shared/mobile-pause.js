/* Pause UI stays outside document flow; game engines retain their own pause state. */
(() => {
  "use strict";
  const game = document.body.dataset.mobileGame;
  if (!game) return;
  const $ = (s) => document.querySelector(s);
  let custom = null,
    lastFocus = null,
    animationHold = new Set(),
    syncing = false,
    modalBlocked = false;
  const isShown = (e) =>
    e &&
    e.getClientRects().length &&
    getComputedStyle(e).visibility !== "hidden";
  function pauseRoots() {
    return [
      ...document.querySelectorAll(
        "dialog[open]:not(.mobile-title):not(.mg-orientation),#pause.pause-overlay.show,#pauseOverlay:not(.hidden),#layer.show",
      ),
    ].filter(isShown);
  }
  function blocked() {
    return document.hidden || modalBlocked;
  }
  window.CxQSession = {
    blocked,
    async waitReady() {
      while (blocked()) await new Promise((r) => setTimeout(r, 40));
    },
  };
  function resumeAnimations() {
    for (const a of animationHold)
      try {
        if (a.playState === "paused") a.play();
      } catch {}
    animationHold.clear();
  }
  function sync() {
    if (syncing) return;
    syncing = true;
    try {
      const roots = pauseRoots();
      const locked = roots.length > 0;
      modalBlocked =
        locked ||
        !!$("dialog[open],#pauseLayer.show,.game-entry:not([hidden])");
      for (const e of [document.documentElement, document.body])
        if (e.classList.contains("cp-lock") !== locked)
          e.classList.toggle("cp-lock", locked);
      for (const root of roots) {
        const heading = root.querySelector("h2")?.textContent || "";
        const pause =
          root === custom ||
          root.id === "pause" ||
          root.id === "pauseOverlay" ||
          (root.id === "game-dialog" &&
            /繼續|探索|回到/.test(root.textContent)) ||
          /暫停|等你回來|已妥善收好/.test(heading);
        const card = root.matches("dialog")
          ? root
          : root.querySelector(".pause-card,.menu-card,#modal") || root;
        if (!pause) {
          if (card.classList.contains("cp-card")) {
            card.classList.remove("cp-card");
            card.removeAttribute("aria-label");
          }
          continue;
        }
        if (!card.classList.contains("cp-card")) card.classList.add("cp-card");
        card.setAttribute("aria-label", "遊戲暫停");
        if (!root.matches("dialog")) {
          root.setAttribute("role", "dialog");
          root.setAttribute("aria-modal", "true");
        }
      }
      if (locked) {
        for (const a of document.getAnimations())
          if (
            a.playState === "running" &&
            !roots.some((r) => r.contains(a.effect?.target))
          ) {
            a.pause();
            animationHold.add(a);
          }
      } else resumeAnimations();
      if (game === "link" && $("#pauseLayer.show") && !custom) showCustom(true);
    } finally {
      syncing = false;
    }
  }
  function confirm(title, message, accept) {
    const d = document.createElement("dialog");
    d.className = "mg-panel cp-confirm";
    const h = document.createElement("h2");
    h.textContent = title;
    const p = document.createElement("p");
    p.textContent = message;
    const row = document.createElement("div");
    row.className = "cp-actions";
    const no = document.createElement("button");
    no.textContent = "保留目前遊戲";
    const yes = document.createElement("button");
    yes.textContent = "確定";
    row.append(no, yes);
    d.append(h, p, row);
    document.body.append(d);
    no.onclick = () => d.close();
    yes.onclick = () => {
      d.close();
      accept();
    };
    d.oncancel = (e) => {
      e.preventDefault();
      d.close();
    };
    d.onclose = () => d.remove();
    d.showModal();
    no.focus();
  }
  function closeCustom(resume = true) {
    if (!custom) return;
    const d = custom;
    custom = null;
    d.close();
    d.remove();
    if (!resume && game === "link") $("#pauseLayer")?.classList.remove("show");
    if (resume) {
      if (game === "link" && $("#pauseLayer.show")) $("#pause").click();
      else window.CxQ?.resume();
    }
    sync();
    lastFocus?.focus({ preventScroll: true });
  }
  function showCustom(fromLink = false) {
    if (custom) return;
    lastFocus = document.activeElement;
    const d = document.createElement("dialog");
    custom = d;
    d.className = "mg-panel cp-card cp-dialog";
    d.innerHTML =
      '<h2>遊戲暫停</h2><p>目前進度已保留，準備好再繼續。</p><div class="cp-actions"><button data-cp="resume" class="primary">繼續遊戲</button><button data-cp="restart">重新開始</button><button data-cp="home">返回遊戲首頁</button></div>';
    const restart =
      game === "2048"
        ? $("#new")
        : game === "link"
          ? $("#restart")
          : $("#restart");
    if (!restart) d.querySelector("[data-cp=restart]").remove();
    d.querySelector("[data-cp=resume]").onclick = () => closeCustom();
    d.querySelector("[data-cp=restart]")?.addEventListener("click", () => {
      closeCustom();
      restart.click();
    });
    d.querySelector("[data-cp=home]").onclick = () => {
      closeCustom(game !== "link");
      if (game === "2048") $("#numberHome")?.click();
      if (["magic-bubble", "dream-match"].includes(game)) {
        const entry = $(".game-entry");
        if (entry) entry.hidden = false;
        $("main").inert = true;
      }
      if (game === "link") {
        $("#link-home").hidden = false;
        $(".app").inert = true;
      }
      window.CxQTitle?.show();
    };
    d.oncancel = (e) => {
      e.preventDefault();
      closeCustom();
    };
    document.body.append(d);
    if (!fromLink) window.CxQ?.hold();
    d.showModal();
    d.querySelector("[data-cp=resume]").focus();
    sync();
  }
  const bypass = new WeakSet();
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest("button");
      if (!b || bypass.has(b) || !b.closest(".cp-card")) return;
      const text = b.textContent.trim(),
        action = b.dataset.cp;
      const leaving = action === "home" || /返回|回到|回主/.test(text),
        restart = action === "restart" || /重新|重開/.test(text);
      if (!leaving && !restart) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      confirm(
        leaving ? "返回遊戲首頁？" : "重新開始？",
        leaving
          ? "即將離開目前這局；已取得的紀錄仍會保留。"
          : "將重新開始這局，已取得的歷史紀錄仍會保留。",
        () => {
          bypass.add(b);
          b.click();
          bypass.delete(b);
        },
      );
    },
    true,
  );
  if (["2048", "memory", "magic-bubble", "dream-match"].includes(game)) {
    const host =
      game === "2048"
        ? $(".number-actions")
        : game === "memory"
          ? $(".memory-tools")
          : $(".puzzle-round");
    const b = document.createElement("button");
    b.type = "button";
    b.id = "cp-pause";
    b.textContent = "暫停";
    b.className = "mg-icon-control";
    b.style.setProperty(
      "--control-art",
      "url('../shared/rebuilt/icon-pause.webp')",
    );
    b.onclick = () => (game === "memory" ? window.CxQ.hold() : showCustom());
    host?.append(b);
  }
  document.addEventListener(
    "keydown",
    (e) => {
      const roots = pauseRoots(),
        top = roots.at(-1);
      if (!top) return;
      if (e.key === "Escape" && !top.matches("dialog")) {
        const resume = top.querySelector("#resume,#resumeBtn,#resumeMemory");
        if (resume) {
          e.preventDefault();
          resume.click();
        }
      }
      if (e.key === "Tab" && !top.matches("dialog")) {
        const controls = [...top.querySelectorAll("button,a,input")].filter(
          isShown,
        );
        if (!controls.length) return;
        let i = controls.indexOf(document.activeElement);
        i = (i + (e.shiftKey ? -1 : 1) + controls.length) % controls.length;
        e.preventDefault();
        controls[i].focus();
      }
      if (
        !e.target.closest(
          "dialog[open],.pause-overlay.show,#pauseOverlay:not(.hidden),#layer.show",
        )
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  new MutationObserver((records) => {
    if (
      records.some((r) =>
        r.type === "attributes"
          ? r.target.matches(
              "dialog,.game-entry,.pause-overlay,#pauseOverlay,#layer,#pauseLayer",
            )
          : r.target.matches?.("h2") ||
            [...r.addedNodes, ...r.removedNodes].some(
              (n) =>
                n.nodeType === 1 &&
                (n.matches("dialog,h2,.menu-card,.pause-card") ||
                  n.querySelector("dialog,h2")),
            ),
      )
    )
      queueMicrotask(sync);
  }).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open", "class", "hidden"],
  });
  if (["2048", "magic-bubble", "dream-match"].includes(game))
    document.addEventListener("visibilitychange", () => {
      if (
        document.hidden &&
        !custom &&
        !$(".mobile-title[open]") &&
        !$(".game-entry")
      )
        showCustom();
    });
  sync();
})();
