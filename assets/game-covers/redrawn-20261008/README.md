# CxQ game cover redraw

Version: 20261008-covers1

The falling-block cover was refined to remove unnecessary characters and show a four-square T piece.

All 19 currently published game covers were drawn independently with the built-in image_gen tool. Existing covers serve only as character/world references; each new cover has its own composition and full prompt in manifest.json. No montage was cropped to produce these assets.

Each game has a 768x768 WebP and a 320x320 thumbnail selected through responsive image candidates. Titles match the game center. Existing old source files remain available; gameplay and save formats are unchanged.

Reimport an original generated source with node tools/import-game-cover.mjs GAME_ID SOURCE_PATH. Validate with node tools/check-game-covers.mjs.

- CxQ 心光對決 — heartlight-duel
- CxQ 幸運小鎮 — lucky-town
- CxQ 童話大富翁 — richman
- CxQ 魔法泡泡龍 — magic-bubble
- CxQ 夢境消除 — dream-match
- CxQ 童話塔防 — fairytale-defense
- CxQ 每日占卜 — fortune
- CxQ 夢境織光・角色連連看 — link
- CxQ 心光旅團：記憶核心 — brick
- CxQ 星願旅團：點亮夢境 — clickcore
- CxQ 星願 2048 — twenty48
- CxQ 暮光回憶收藏室 — memory
- CxQ 心境織境・方塊物語 — tetris
- CxQ 森林敲敲樂 — whack
- CxQ 心光合成屋 — merge
- CxQ 星願飛行郵差 — flappy
- CxQ 森林急件快遞 — dino
- CxQ 撲克館 — poker
- CxQ 四葉草探險地圖 — mines
