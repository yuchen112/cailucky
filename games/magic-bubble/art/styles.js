const gameArtSlots = ["panel","pause","result","button","board","hud","burst","dock","home","orb-aqua","orb-gold","orb-leaf","orb-orange","orb-ruby","orb-violet","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "board": ".board-wrap",
  "panel": "html[data-visual-theme] body[data-mobile-game=magic-bubble] :is(.game-entry, #guide, #bubble-difficulty, .mg-panel:not(.cp-card):not(.rp-panel))",
  "pause": "html[data-visual-theme] body[data-mobile-game=magic-bubble] .cp-card",
  "result": "html[data-visual-theme] body[data-mobile-game=magic-bubble] #result > div",
  "button": "html[data-visual-theme] body[data-mobile-game=magic-bubble] :is(.puzzle-actions, .puzzle-round, .cp-card, #result) button",
  "hud": ".stats > div"
};
