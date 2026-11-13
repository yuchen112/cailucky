(() => {
  const styles = ["emerald", "toy", "paper", "pixel"];
  const game = document.body.dataset.mobileGame;
  const manifest = window.CxQGameArtFiles || {};
  const sprites = new Map();
  const enabled = styles.some(style => manifest[style]?.length);
  const original = new WeakMap();
  const panels = {
    stage: "body",
    dock: ".mobile-title-dock",
    primary: ".mobile-primary",
    button: ".mobile-function",
    return: ".mobile-return",
    pause: ".cp-card",
    result: ".rp-panel",
    panel: ".mg-panel",
  };
  const imageSlots = {
    ".mobile-title-art": "home",
    ".mobile-game-logo": "title",
  };

  const activeStyle = () => document.documentElement.dataset.visualTheme;
  function art(style, slot) {
    if (!styles.includes(style) || !manifest[style]?.includes(slot)) return null;
    return new URL("art/" + style + "/" + slot + ".webp", location.href).href;
  }
  function spriteSlot(src) {
    const url = new URL(src, location.href);
    return url.pathname.split("/").pop().replace(/\.[^.]+$/, "");
  }
  function refreshSprites() {
    for (const [image, entry] of sprites) {
      const url = art(activeStyle(), spriteSlot(entry.src));
      entry.pending = url;
      if (!url) {
        if (image.src !== entry.src) image.src = entry.src;
        continue;
      }
      if (image.src === url) continue;
      const replacement = new Image();
      replacement.src = url;
      replacement.decode().then(() => {
        if (entry.pending === url) image.src = url;
      }).catch(() => {});
    }
  }
  window.CxQGameArt = {
    sprite(image, src) {
      image.src = src;
      if (!enabled) return image;
      sprites.set(image, {src: image.src});
      if (art(activeStyle(), spriteSlot(src))) refreshSprites();
      return image;
    },
  };

  function swap(image, slot, style) {
    if (!original.has(image)) original.set(image, image.getAttribute("src"));
    const source = art(style, slot) || original.get(image);
    if (source && image.getAttribute("src") !== source) image.setAttribute("src", source);
  }
  function refreshDOM() {
    const style = activeStyle();
    for (const [selector, slot] of Object.entries(imageSlots)) {
      for (const image of document.querySelectorAll(selector)) swap(image, slot, style);
    }
    for (const image of document.querySelectorAll(".cxq-theme-picker [data-visual-choice] img")) {
      swap(image, "preview", image.closest("[data-visual-choice]").dataset.visualChoice);
    }
    for (const image of document.querySelectorAll("main img, .mobile-function img, .mg-panel img, .cp-card img, .rp-panel img")) {
      const source = original.get(image) || image.getAttribute("src");
      if (source) swap(image, spriteSlot(source), style);
    }

    const rules = [];
    for (const [slot, selector] of Object.entries({...panels, ...window.CxQGameArtPanels})) {
      const url = art(style, slot);
      if (url) rules.push(selector + " { background-image: url(" + JSON.stringify(url) + ") !important; }");
    }
    if (sheet.textContent !== rules.join("\n")) sheet.textContent = rules.join("\n");
  }
  if (!enabled) return;
  const sheet = document.createElement("style");
  sheet.dataset.gameArt = game;
  document.head.append(sheet);
  const observer = new MutationObserver((records) => {
    if (records.some(record => record.addedNodes.length)) refreshDOM();
  });
  observer.observe(document.body, {childList: true, subtree: true});
  window.addEventListener("cxq-theme-change", () => {
    refreshDOM();
    refreshSprites();
  });
  refreshDOM();
})();
