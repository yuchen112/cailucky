const gameArtSlots = ["burst","dock","home","orb-aqua","orb-gold","orb-leaf","orb-orange","orb-ruby","orb-violet","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "board": ".board-wrap",
  "hud": ".stats > div"
};
