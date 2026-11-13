const gameArtSlots = ["animal-0","animal-1","animal-10","animal-11","animal-12","animal-13","animal-14","animal-15","animal-2","animal-3","animal-4","animal-5","animal-6","animal-7","animal-8","animal-9","artifact-0","artifact-1","artifact-10","artifact-11","artifact-12","artifact-13","artifact-14","artifact-15","artifact-2","artifact-3","artifact-4","artifact-5","artifact-6","artifact-7","artifact-8","artifact-9","dessert-0","dessert-1","dessert-10","dessert-11","dessert-12","dessert-13","dessert-14","dessert-15","dessert-2","dessert-3","dessert-4","dessert-5","dessert-6","dessert-7","dessert-8","dessert-9","dock","home","primary","role-dream","role-growth","role-healing","role-hope","role-joy","role-luck","role-memory","role-night","role-sadness","role-trust","title","preview"];
window.CxQGameArtFiles = Object.fromEntries(["emerald", "toy", "paper", "pixel"].map(style => [style, gameArtSlots]));

window.CxQGameArtPanels = {
  "tile": "#board .tile",
  "board": "#board"
};
