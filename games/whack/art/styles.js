const gameArtSlots = ["bomb","burrow","burrow-front","dock","hammer","heart","home","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","title","whack-bomb","whack-burrow","whack-clearing","whack-heart","whack-hole-back","whack-hole-front","whack-star","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "board": ".field",
  "hole": ".hole"
};
