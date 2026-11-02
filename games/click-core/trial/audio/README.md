# 星願旅團專屬聲音

本套為此重製試玩版新寫的程式編曲、樂器合成與擬音。未使用《幻裝圖境》或其他遊戲音檔、旋律或第三方錄音；不是 AI 音樂生成，也不是實體樂器錄音。

## 配樂

- `music-home.mp3`：83.47825 秒、92 BPM、D 大調。32 小節星願工坊主題，星鐘／木琴旋律交替，豎琴分解和弦、柔和低音與輕刷節拍。
- `music-collection.mp3`：82.285708 秒、70 BPM、D 大調。24 小節收藏夜曲，稀疏星鐘、豎琴與溫暖長和弦。

兩首均有循環音尾與環繞式殘響，WAV 母帶首尾樣本跳差低於一般波形導數範圍。MP3 使用 LAME/Xing gapless metadata；WebAudio decode 後應使用完整 buffer 循環。

## 音效

`tap`、`back`、`collect`、`critical`、`buy`、`upgrade`、`achievement`、`denied`、`cometAppear`、`cometGift`、`cometBoost`、`skin`、`save`、`offline`、`burst`。

點擊收集音 `collect` 僅 0.15 秒，採低音柔木與銅鈴短音尾；事件與升級採專屬 D 大調星鐘／豎琴樂句及合成星砂擬音。

播放資源總計 3,831,052 bytes（2 MP3 + 15 WAV），另保留兩首 WAV 母帶。`manifest.json` 列出檔名、時長、峰值、RMS、SHA-256 與來源說明；`validation.json` 為 PCM、音量與雜湊檢查紀錄。

## 再製作

```text
python tools/render-audio.py
python tools/encode-audio.py <ffmpeg-path>
```

需要 NumPy 與 FFmpeg。輸出為 24 kHz 立體聲，母帶 16-bit PCM；音量已保留大量餘裕，無削波。實際瀏覽器播放與整合由遊戲主程式驗證。
