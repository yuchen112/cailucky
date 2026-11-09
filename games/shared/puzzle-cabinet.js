(() => {
  const game = document.body.dataset.puzzle;
  const entry = document.querySelector(".game-entry");
  const article = entry?.querySelector("article");
  if (!article) return;
  const mainImage = article.querySelector("img");
  if (mainImage) {
    mainImage.src = "../shared/cabinet/" + game + ".webp";
    mainImage.alt = "";
  }
  const back = document.createElement("a");
  back.href = "../classic-hall/index.html?v=20261012-mobile1";
  back.className = "puzzle-back";
  back.textContent = "‹ 返回經典遊戲館";
  article.prepend(back);
})();
