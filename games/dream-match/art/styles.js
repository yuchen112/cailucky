const gameArtSlots = ["board","tile","dock","home","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, [...gameArtSlots, "goals", "button", "pause", "result"]]));

window.CxQGameArtPanels = {
  "tile": "html[data-visual-theme] body.mg-game[data-mobile-game=dream-match] .boardWrap #board .cell",
  "goals": "html[data-visual-theme] body.mg-game[data-mobile-game=dream-match] .puzzle-game .goals-row",
  "button": "html[data-visual-theme] body.mg-game[data-mobile-game=dream-match] :is(.mobile-function-bar .mobile-function, .puzzle-actions button, .puzzle-round button)",
  "pause": "html[data-visual-theme] body.mg-game[data-mobile-game=dream-match] .cp-card",
  "result": "html[data-visual-theme] body.mg-game[data-mobile-game=dream-match] #result section",
  "hud": ".stats > div",
  "board": "html[data-visual-theme] body.mg-game[data-mobile-game=dream-match] .boardWrap #board"
};
