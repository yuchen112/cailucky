# CxQ 童話大富翁 v8 角色動畫來源

每位角色保留一份 320×360、七幀、七個標籤的 Aseprite 原生來源：
`idle`、`blink`、`windup`、`toss`、`receive`、`pay`、`skill`。
每個姿勢原本都是獨立繪製的透明圖；圖集只負責打包，沒有從生成的大圖裁切角色。
主畫面的步行另外沿用共享六幀行走圖集。

在 Aseprite 編輯並保存 `.aseprite` 後，於 repository 根目錄執行：

```powershell
node tools/build-richman-atlas-v8.mjs
```

此命令從原生來源匯出四欄 WebP 圖集與姿勢座標；不會覆寫原生來源。
`--import-poses` 只供從七張獨立素材重新建立來源，會覆寫來源，編輯後請勿使用。
獨立素材及完整生成提示詞、來源、雜湊見 `games/cxq-fairytale-richman/art/v8/manifest.json`。
