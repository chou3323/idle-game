# 還原（Restore）
目前版本：割草大畫面 v2。舊版備份 tag：`pre-horde2-20261028-1511`（v1 割草）、`pre-horde-20261028`（原遊戲 root）。舊遊戲永遠在 /old/。

還原到 v2 之前（推薦，保留歷史）：
    git revert --no-edit <v2 commit> && git push origin main
或直接回到 tag 內容：
    git checkout pre-horde2-20261028-1511 -- . && git commit -m "restore pre-horde2" && git push origin main
