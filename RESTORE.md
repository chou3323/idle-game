# 還原（Restore）
目前版本：割草大畫面 v3（舊版 RO 風格視窗＋難度/討伐模式＋原創怪物/BOSS＋RO 數值平衡）。舊遊戲永遠在 /old/，沒被動過。

備份 tag（皆已推到 GitHub）：
- `pre-horde3-20261028-1648` = v3 之前（v2，commit 2c247ec）
- `pre-horde2-20261028-1511` = v1 割草
- `pre-horde-20261028` = 原遊戲 root

## 還原到 v3 之前（v2）— 推薦（revert，保留歷史、不 force-push）
    git clone https://github.com/chou3323/idle-game.git && cd idle-game
    git revert --no-edit 3b31439   # v3 commit
    git push origin main
## 或直接把檔案內容回到 tag
    git checkout pre-horde3-20261028-1648 -- . && git commit -am "restore pre-horde3" && git push origin main
（若 v3 新增檔案要一併移除：`git rm -r data/aur_*.json rotheme.css stage.css …` 或用 revert 即可自動處理。）

## 只想換回 Windows XP 外觀
頁面上方「外觀」按鈕，或 localStorage `aur_theme` = `xp`；不需還原。
