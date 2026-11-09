/* Shared scrolling surface for actual dialogs/results, separate from setup screens. */
(() => {
  "use strict";
  const seen = new WeakMap();
  let pending = false;
  function shown(e) {
    return (
      e.getClientRects().length > 0 &&
      getComputedStyle(e).visibility !== "hidden"
    );
  }
  function refresh() {
    pending = false;
    const panels = [
      ...document.querySelectorAll(
        "dialog[open]:not(.mobile-title):not(.mg-orientation),#layer.show>#modal,.modal-mask.show>.modal,.overlay.show>.modal,#result:not([hidden])>section,#result:not([hidden])>div,#resultOverlay:not(.hidden) .menu-card,#pause.pause-overlay.show>.pause-card,#pauseOverlay:not(.hidden) .menu-card,#rulesOverlay:not(.hidden)>.rules-book,#mapOverlay:not(.hidden)>.map-screen",
      ),
    ];
    for (const e of panels) {
      if (
        !shown(e) ||
        e.matches(".mg-preparation,.mp-memory-setup,.mp-link-setup") ||
        e.querySelector(".form,.mg-prepare-content")
      )
        continue;
      if (!e.classList.contains("rp-panel")) e.classList.add("rp-panel");
      const h = e.querySelector("h2,h1"),
        signature =
          (h?.textContent || "") +
          "|" +
          [...e.querySelectorAll("button")].map((b) => b.textContent).join("|");
      if (seen.get(e) !== signature) {
        seen.set(e, signature);
        requestAnimationFrame(() => {
          if (!shown(e)) return;
          e.scrollTop = 0;
          if (h) {
            h.tabIndex = -1;
            h.focus({ preventScroll: true });
          }
        });
      }
    }
    for (const e of document.querySelectorAll(".rp-panel"))
      if (!panels.includes(e) || !shown(e)) {
        seen.delete(e);
      }
  }
  function schedule() {
    if (!pending) {
      pending = true;
      queueMicrotask(refresh);
    }
  }
  new MutationObserver((rs) => {
    if (
      rs.some((r) =>
        r.type === "attributes"
          ? r.target.matches(
              "dialog,.modal-mask,.overlay,#layer,.pause-overlay,#pauseOverlay,#resultOverlay",
            )
          : r.target.matches?.("h2,h1") ||
            [...r.addedNodes].some(
              (n) =>
                n.nodeType === 1 &&
                (n.matches("dialog,h2,h1,.modal,.menu-card,.pause-card") ||
                  n.querySelector("h2,h1,dialog")),
            ),
      )
    )
      schedule();
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["open", "class", "hidden"],
  });
  addEventListener("resize", schedule);
  if (document.body.dataset.mobileGame === "tetris") {
    const trigger = document.querySelector("#showHowto");
    if (trigger)
      trigger.onclick = () => {
        let d = document.querySelector("#rp-tetris-help");
        if (!d) {
          d = document.createElement("dialog");
          d.id = "rp-tetris-help";
          d.className = "mg-panel";
          const h = document.createElement("h2");
          h.textContent = "操作說明";
          d.append(
            h,
            ...[...document.querySelector("#howto").children].map((n) =>
              n.cloneNode(true),
            ),
          );
          const close = document.createElement("button");
          close.textContent = "返回遊戲首頁";
          close.onclick = () => d.close();
          d.append(close);
          d.addEventListener("close", () => {
            trigger.setAttribute("aria-expanded", "false");
            window.CxQTitle?.show();
          });
          document.body.append(d);
        }
        trigger.setAttribute("aria-expanded", "true");
        d.showModal();
        schedule();
      };
  }
  window.CxQPanels = { refresh };
  refresh();
})();
