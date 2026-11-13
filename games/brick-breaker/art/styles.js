const gameArtSlots = ["ball","boss-0","boss-1","boss-2","boss-3","boss-4","boss-5","boss-6","brick-archive","brick-armor","brick-ball","brick-blast","brick-bonus","brick-breaker","brick-moon","brick-normal","brick-paddle","burst","dock","heart","home","paddle","paddle-leaf","paddle-moon","power-grow","power-laser","power-slow","power-split","primary","shield","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "hud": ".stats > div"
};
