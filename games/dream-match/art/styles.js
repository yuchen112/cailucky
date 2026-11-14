const gameArtSlots = ["board","dock","home","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "tile": "#board .cell",
  "hud": ".stats > div",
  "board": "html[data-visual-theme] body.mg-game[data-mobile-game=dream-match] .boardWrap #board"
};
