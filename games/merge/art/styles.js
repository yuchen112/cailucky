const gameArtSlots = ["dock","explosion","home","merge-orb-0","merge-orb-1","merge-orb-10","merge-orb-11","merge-orb-2","merge-orb-3","merge-orb-4","merge-orb-5","merge-orb-6","merge-orb-7","merge-orb-8","merge-orb-9","merge-vessel","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "board": ".playfield",
  "hud": ".stats > div"
};
