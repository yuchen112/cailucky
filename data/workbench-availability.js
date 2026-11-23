(() => {
  'use strict';
  const source = document.currentScript.src;
  const site = new URL('../', source);
  const path = url => url.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  const key = url => url.origin + path(url);
  fetch(new URL('data/workbench-games.json', site), { cache: 'no-cache' })
    .then(response => response.ok ? response.json() : [])
    .then(catalog => {
      if (!Array.isArray(catalog)) return;
      const blocked = new Set(catalog.filter(game => game && game.open === false && typeof game.path === 'string')
        .map(game => new URL(game.path, site)).filter(url => url.origin === site.origin).map(key));
      if (!blocked.size) return;
      function update() {
        for (const link of document.querySelectorAll('a[href]')) {
          if (!blocked.has(key(new URL(link.href)))) continue;
          link.removeAttribute('href');
          link.setAttribute('aria-disabled', 'true');
          link.setAttribute('title', '暫停開放');
          link.addEventListener('click', event => {
            event.preventDefault();
            event.stopImmediatePropagation();
          }, true);
        }
      }
      update();
      new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
    })
    .catch(() => {});
})();
