const copy = document.querySelector("#copy");
const status = document.querySelector("#copy-status");
if (navigator.clipboard?.writeText) {
  copy.hidden = false;
  copy.addEventListener("click", async () => {
    status.hidden = false;
    try {
      await navigator.clipboard.writeText(new URL(".", location.href).href);
      status.textContent = "已複製工作台下載頁面連結。";
    } catch {
      status.textContent = "無法複製，請從瀏覽器網址列複製連結。";
    }
  });
}
