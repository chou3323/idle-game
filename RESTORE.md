# 還原（Restore）
目前版本：割草大畫面 v4（RO 風格框架重做＋怪物/BOSS 精緻重畫）。舊遊戲永遠在 /old/，沒被動過。

備份 tag（皆已推到 GitHub）：
- `pre-horde4-20261028-1741` = v4 之前（v3，commit a5aed77）；本機備份 bundle：/workspace/backups/aurevia_pre_horde4_20261028-1741/idle-game.bundle
- `pre-horde3-20261028-1648` = v3 之前（v2，commit 2c247ec）
- `pre-horde2-20261028-1511` = v1 割草
- `pre-horde-20261028` = 原遊戲 root

## 還原到 v4 之前（v3）— 推薦
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
