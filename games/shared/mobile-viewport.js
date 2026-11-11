/* One fixed game viewport; only genuinely overflowing inner surfaces may scroll. */
(() => {
  "use strict";
  const root = document.documentElement;
  function size() {
    const h = Math.min(
      innerHeight,
      window.visualViewport?.height || innerHeight,
    );
    root.style.setProperty(
      "--cxq-screen-height",
      Math.round(h * 100) / 100 + "px",
    );
    root.style.setProperty("--cxq-screen-width", innerWidth + "px");
  }
  size();
  addEventListener("resize", size);
  window.visualViewport?.addEventListener("resize", size);
  addEventListener("pageshow", size);
  let gesture = null;
  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) {
        gesture = null;
        return;
      }
      gesture = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        target: e.target,
      };
    },
    { capture: true, passive: true },
  );
  function canScroll(target, dx, dy) {
    for (
      let node = target instanceof Element ? target : target?.parentElement;
      node && node !== document.body && node !== root;
      node = node.parentElement
    ) {
      const style = getComputedStyle(node),
        ax =
          /auto|scroll/.test(style.overflowX) &&
          node.scrollWidth > node.clientWidth + 2,
        ay =
          /auto|scroll/.test(style.overflowY) &&
          node.scrollHeight > node.clientHeight + 2;
      if (Math.abs(dy) >= Math.abs(dx) && ay) {
        const max = node.scrollHeight - node.clientHeight;
        if (
          (dy > 0 && node.scrollTop > 1) ||
          (dy < 0 && node.scrollTop < max - 1)
        )
          return true;
      }
      if (Math.abs(dx) > Math.abs(dy) && ax) {
        const max = node.scrollWidth - node.clientWidth;
        if (
          (dx > 0 && node.scrollLeft > 1) ||
          (dx < 0 && node.scrollLeft < max - 1)
        )
          return true;
      }
    }
    return false;
  }
  document.addEventListener(
    "touchmove",
    (e) => {
      if (!gesture || e.touches.length !== 1) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      const t = e.touches[0],
        dx = t.clientX - gesture.x,
        dy = t.clientY - gesture.y;
      gesture.x = t.clientX;
      gesture.y = t.clientY;
      // Native sliders/editors retain their own direct input handling.
      if (
        gesture.target.closest?.(
          "input[type=range],input,textarea,[contenteditable=true]",
        )
      )
        return;
      if (!canScroll(gesture.target, dx, dy) && e.cancelable)
        e.preventDefault();
    },
    { capture: true, passive: false },
  );
  document.addEventListener(
    "touchend",
    () => {
      gesture = null;
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    "touchcancel",
    () => {
      gesture = null;
    },
    { capture: true, passive: true },
  );
  window.CxQViewport = { refresh: size, canScroll };
})();
