(() => {
  const styles = {
    emerald: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud"],
    toy: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud"],
    paper: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud"],
    pixel: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud"],
  };
  const root = document.documentElement;
  const body = document.body;
  const source = new WeakMap();
  const images = [
    [".mobile-title-art", "home"],
    [".mobile-game-logo", "title"],
    [".expedition-cast > img", "partner-banner"],
    [".tutorial-grid img, .hold-preview", "flag"],
  ];
  const roles = ".expedition-cast img.role-art, #play-role img.role-art, #game-dialog img.role-art";

  function refresh() {
    const style = root.dataset.visualTheme;
    const available = styles[style] || [];
    const art = (name) => new URL("art/" + style + "/" + name + ".webp?v=20261114-mines4", location.href).href;

    for (const name of ["stage", "flag", "trap", "closed", "open", "dock", "primary",
      "button", "panel", "board", "hud", "pause", "result", "settings", "return"]) {
      if (available.includes(name)) body.style.setProperty("--mines-" + name, 'url("' + art(name) + '")');
      else body.style.removeProperty("--mines-" + name);
    }

    function swap(img, name) {
      if (!source.has(img)) source.set(img, img.getAttribute("src"));
      const url = available.includes(name) ? art(name) : source.get(img);
      if (url && img.getAttribute("src") !== url) img.setAttribute("src", url);
    }

    for (const [selector, name] of images) {
      for (const img of document.querySelectorAll(selector)) swap(img, name);
    }
    for (const img of document.querySelectorAll(".cxq-theme-picker [data-visual-choice] img")) {
      const choice = img.closest("[data-visual-choice]").dataset.visualChoice;
      if (styles[choice]?.includes("preview")) {
        const url = new URL("art/" + choice + "/preview.webp?v=20261114-mines4", location.href).href;
        if (img.src !== url) img.src = url;
      }
    }
    for (const img of document.querySelectorAll(roles)) {
      const original = source.get(img) || img.getAttribute("src");
      const name = original?.match(/\/(role-[\w-]+)\.webp/)?.[1];
      if (name) swap(img, name);
    }
    for (const img of document.querySelectorAll(".mobile-function img")) {
      const action = img.closest("button")?.getAttribute("aria-label");
      const name = action?.includes("紀錄") ? "icon-records" :
        action?.includes("玩法") ? "icon-help" : "icon-start";
      swap(img, name);
    }
  }

  let queued = false;
  const observer = new MutationObserver((records) => {
    if (queued || !records.some(({addedNodes}) => [...addedNodes].some(node =>
      node.nodeType === 1 && (node.matches("img") || node.querySelector("img"))
    ))) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refresh();
    });
  });
  observer.observe(body, {childList: true, subtree: true});
  window.addEventListener("cxq-theme-change", refresh);
  refresh();
})();
