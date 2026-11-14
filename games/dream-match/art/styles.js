const gameArtSlots = ["dock","home","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","special-prism","special-row","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "tile": "#board .cell",
  "hud": ".stats > div",
  "board": "#board"
};
