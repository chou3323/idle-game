# 還原（Restore）
目前版本：割草大畫面 v5（工具列移到場景下方、手機/平板/桌機版面稽核修正、body.stg 縮窄 bug 修正）。舊遊戲永遠在 /old/，沒被動過。

備份 tag（皆已推到 GitHub）：
- `pre-horde5-20261028-2133` = v5 之前（v4，commit 7707752）；本機備份：/workspace/backups/aurevia_pre_horde5_20261028-2133/site_tree_7707752.tgz
- `pre-horde4-20261028-1741` = v4 之前（v3，commit a5aed77）；本機備份 bundle：/workspace/backups/aurevia_pre_horde4_20261028-1741/idle-game.bundle
- `pre-horde3-20261028-1648` = v3 之前（v2，commit 2c247ec）
- `pre-horde2-20261028-1511` = v1 割草
- `pre-horde-20261028` = 原遊戲 root

## 還原到 v5 之前（v4）— 推薦
    git clone https://github.com/chou3323/idle-game.git && cd idle-game
    git revert --no-edit 163a178   # v5 commit
    git push origin main
或：`git checkout pre-horde5-20261028-2133 -- . && git commit -am "restore pre-horde5" && git push origin main`

## 還原到 v4 之前（v3）
    git clone https://github.com/chou3323/idle-game.git && cd idle-game
    git revert --no-edit ec9279c   # v4 commit
    git push origin main
或：`git checkout pre-horde4-20261028-1741 -- . && git commit -am "restore pre-horde4" && git push origin main`

## 還原到 v3 之前（v2）— 推薦（revert，保留歷史、不 force-push）
    git clone https://github.com/chou3323/idle-game.git && cd idle-game
    git revert --no-edit 3b31439   # v3 commit
    git push origin main
## 或直接把檔案內容回到 tag
    git checkout pre-horde3-20261028-1648 -- . && git commit -am "restore pre-horde3" && git push origin main
（若 v3 新增檔案要一併移除：`git rm -r data/aur_*.json rotheme.css stage.css …` 或用 revert 即可自動處理。）

## 只想換回 Windows XP 外觀
頁面上方「外觀」按鈕，或 localStorage `aur_theme` = `xp`；不需還原。

## 仙境冒險 v2 測試版（/v2/，2026-10-29 14:26 UTC+8）
只新增 `v2/` 資料夾（靜態測試頁），首頁、/old/、API、資料庫皆未變動。備份 tag：`pre-hdv2-20261029-1425`，離線檔 /workspace/backups/idle-game-pre-hdv2-20261029-1425.tar.gz
移除：`git rm -r v2 && git commit -m "remove v2 test" && git push origin main`（或 git revert 該 commit）

## 首頁換成仙境冒險 v2（2026-10-29 14:35 UTC+8）
根目錄 index.html 改為 v2（`<base href="/v2/">`），舊首頁移到 `/prev-horde-20261029/`，/old/、gm.html、API、資料庫未動；sw.js 快取名改 aur-hdv2-1。
備份 tag：`pre-hdv2-root-20261029-1431`；離線檔 /workspace/backups/idle-game-pre-hdv2-root-20261029-1431.tar.gz
一行還原：`git revert --no-edit 3afd33d && git push origin main`

## v2 更新 r3（2026-10-29 14:36 UTC+8）
手機設定選單、手機擊殺進度條、畫質選項、標題修正、平衡數值 it6。備份 tag：`pre-hdv2-r3-20261029-1436`；離線檔 /workspace/backups/idle-game-pre-hdv2-r3-20261029-1436.tar.gz。還原：`git revert <此 commit>` 後 push。

## v2 r4（2026-10-29 14:39 UTC+8）
手機底部選單與面板、safe-area、移除暫停/加速、離線收益（僅本機）。備份 tag：`pre-hdv2-r4-20261029-1439`。還原：git revert 此 commit 後 push。
