(() => {
  const styles = {
    emerald: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud","help","records","compare","result","pause","sidebar"],
    toy: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud","help","records","compare","result","pause","sidebar"],
    paper: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud","help","records","compare","result","pause","sidebar"],
    pixel: ["stage","closed","dock","flag","home","open","preview","primary","title","trap","panel","button","hud","help","records","compare","result","pause","sidebar"],
  };
  const root = document.documentElement;
  const body = document.body;
  const source = new WeakMap();
  const checked = new Map();

  function ready(url) {
    if (!checked.has(url)) {
      const image = new Image();
      checked.set(url, false);
      image.src = url;
      image.decode().then(() => {
        checked.set(url, true);
        refresh();
      }).catch(() => {});
    }
    return checked.get(url);
  }
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
    const art = (name) => new URL("art/" + style + "/" + name + ".webp?v=20261114-mines15", location.href).href;

    for (const name of ["stage", "flag", "trap", "closed", "open", "dock", "primary",
      "button", "panel", "sidebar", "board", "hud", "pause", "result", "settings", "return"]) {
      if (available.includes(name) && ready(art(name))) body.style.setProperty("--mines-" + name, 'url("' + art(name) + '")');
      else body.style.removeProperty("--mines-" + name);
    }

    function swap(img, name) {
      if (!source.has(img)) source.set(img, img.getAttribute("src"));
      const original = source.get(img);
      const url = available.includes(name) && ready(art(name)) ? art(name) : window.CxQTheme?.asset(original, style) || original;
      if (url && img.getAttribute("src") !== url) img.setAttribute("src", url);
    }

    for (const [selector, name] of images) {
      for (const img of document.querySelectorAll(selector)) swap(img, name);
    }
    for (const img of document.querySelectorAll(".cxq-theme-picker [data-visual-choice] img")) {
      const choice = img.closest("[data-visual-choice]").dataset.visualChoice;
      if (styles[choice]?.includes("preview")) {
        const url = new URL("art/" + choice + "/preview.webp?v=20261114-mines15", location.href).href;
        if (ready(url) && img.src !== url) img.src = url;
      }
    }
    for (const img of document.querySelectorAll(roles)) {
      const original = source.get(img) || img.getAttribute("src");
      const name = original?.match(/\/(role-[\w-]+)\.webp/)?.[1];
      if (name) swap(img, name);
    }
    for (const img of document.querySelectorAll(".mobile-function img")) {
      const action = img.closest("button")?.getAttribute("aria-label");
      const name = action?.includes("紀錄") ? "records" :
        action?.includes("比較") ? "compare" : "help";
      swap(img, name);
    }
  }

  let queued = false;
  const observer = new MutationObserver((records) => {
    if (queued || !records.some(({type, addedNodes}) => type === "attributes" || [...addedNodes].some(node =>
      node.nodeType === 1 && (node.matches("img") || node.querySelector("img"))
    ))) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refresh();
    });
  });
  observer.observe(body, {childList: true, subtree: true, attributes: true, attributeFilter: ["src"]});
  window.addEventListener("cxq-theme-change", refresh);
  refresh();
})();
