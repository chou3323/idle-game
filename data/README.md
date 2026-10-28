# data/ — 來源說明
- `monsters_ro.json`：由 ro.dvg.cn/monster.php（及其怪物詳細頁）解析出的**純數值事實**（等級、HP、攻防、屬性、種族、體型、經驗、掉落率…），**不含任何圖片或文字內容**。2026-10-28 抓取，單執行緒、每次請求間隔 2 秒、帶識別 UA，僅抓一輪。
- `aur_map.json`：36 隻 Aurevia 怪 → 對應的 RO 怪（只用其數值形狀）。
- `aur_mobs.json`：換算後實際給遊戲用的數值（HP/ATK/DEF/屬性/掉落形狀/BOSS 屬性）。
- `parse_ro.py`、`../tools/build_balance.py`：產生以上檔案的腳本。
- 原始 HTML（`raw/`，約 41 MB）**不納入版本庫**。
- 數值僅作為平衡參考；怪物名稱、美術、地圖全為 Aurevia 原創。若要公開，請自行確認來源站使用條款。
