# 曙光 Aurevia — 割草大畫面 v2（原型・假資料）
純前端、無後端、不碰 API/DB/玩家資料。存檔只在瀏覽器 localStorage（key `aur_horde_v2`）。

## 內容
- **裝備**（E）：8 個欄位（頭飾/武器/鎧甲/鞋子/披風/副手/飾品×2），背包 24 格，品階色框、對比、賣普通/賣優良；裝備直接影響 ATK/MATK/DEF/HP/暴擊/攻速與角色光環（外觀會微調亮度）。
- **技能**（K）：11 職 × 4 技能，各有獨立戰場特效（火箭/冰霜新星/雷柱/隕石、斬擊波、治癒光環、音波、爆彈…），自動施放開關、手動施放、熱鍵 1–4、底部技能列含冷卻動畫與 SP 條。
- **地圖**（M）：6 張主題場景（霧沼濕地/荒漠/洞窟/雪原/熔岩/遺跡），各 12 種怪（3 階 × 12 款）、不同體型/顏色/行為（衝撞、飛行、遠程、固定、重甲、追擊）與各自 BOSS。
- **掉落**（L）：素材統計 + 掉落紀錄；HUD 有等級、Base/Job 經驗、HP/SP、Zeny。
- XP 風格視窗：桌機可拖曳、點擊置頂；手機（≤600px）為底部彈出面板。

## 執行
    cd horde && python3 -m http.server 18440 --bind 127.0.0.1
    http://127.0.0.1:18440/index.html

## URL 參數
`seed` `fresh`(不讀存檔) `map`(f1 d1 c2 s2 l3 r3) `job`(kni lnc mer mnk acl arc rgr brd dnc gun hsn) `g`(f|m) `q`(0-3 鎖定畫質) `chars` `mobs` `gather` `mobile`(0|1) `big` `side` `ff`(快轉秒) `ffb` `boss` `nograde`(關掉角色提亮) `log`(full|sum|hl) `zoom` `open`(equip|skills|map|drops|help)

## 驗證
    node /workspace/tools/pp/shot.js "<url>" out.png 1280 800 1 4000 0     # 桌機
    node /workspace/tools/pp/shot.js "<url>" out.png 390 844 2 4000 1      # 手機
目標：桌機 60 fps、手機 30 fps、console 無錯誤（畫質自動降階 Q3→Q0）。

---
## 換成官方風格素材（chou 自行提供）
**本專案內建的怪物、圖示、背景全是原創像素風，不含任何官方 RO 素材，也沒有從官網/遊戲抓取。**
若你想換成自己擁有授權/自製的素材包（含官方風格），**授權責任在你自己**；程式端已預留「放進去就換」的流程，不用改程式。

### 做法
1. 把圖放到 `assets/custom/`（任意子資料夾）。
2. 編輯 `assets/custom/manifest.json`（格式同 `assets/manifest.json`，**只寫要換的項目**，會深度合併覆蓋）。
3. 重新整理頁面即可。刪掉該項目就回到內建素材。

### 範例
```json
{
  "mobs": {
    "t1_bunny": { "src": "assets/custom/mobs/rabbit.png", "frames": 4, "fw": 64, "fh": 64, "base": 58, "fps": 6, "h": 46, "flip": true },
    "t2_slime": { "src": "assets/custom/mobs/slime.png", "frames": 2, "fw": 48, "fh": 48, "base": 44,
                  "recolor": { "hue": 0, "sat": 0.9, "bri": 1.08, "con": 0.95, "tint": "#ffffff", "tintA": 0.12 } }
  },
  "bosses": { "hills_boss": { "src": "assets/custom/boss_hills.png" } },
  "maps":   { "f1": { "bg": "assets/custom/bg_field.png" } },
  "icons":  { "wp_sword_2": "assets/custom/icons/sword2.png" },
  "chars":  { "grade": { "bri": 1.08, "sat": 1.0, "con": 0.97 } }
}
```

### 各欄位規格
| 項目 | 規格 |
|---|---|
| `mobs.<id>` | 橫向並排 sprite strip，PNG 透明底。`frames` 幀數、`fw`×`fh` 單幀像素、`base` 腳底 y（單幀內像素）、`fps` 動畫速度、`h` 遊戲內顯示高度（省略用預設）。預設圖朝**左**；你的朝右就加 `"flip": true`。 |
| 怪物 id | `t1_/t2_/t3_` + `bunny slime bee beetle mush ghost bat snake crab golem plant fox`（共 36）；t1=初級、t2=中級、t3=高級。 |
| `bosses.<key>` | `hills_boss` `cave_boss` `magma_boss`，單張透明 PNG（其餘 BOSS 以這三張色相偏移）。 |
| `maps.<mapId>.bg` | 單張地面背景（建議 ≥1600×1200，可無縫平鋪更佳）；`null` = 用內建程序繪製。mapId：`f1 d1 c2 s2 l3 r3`。 |
| `icons.<itemId>` | 32×32（建議 64×64）PNG。itemId 見 `data.js`：`wp_<武器>_<0-4>`、`hd_/sh_/ar_/ck_/…_<0-4>`。 |
| `chars` | 角色 sheet 由 `assets/chars/sheets.json` 描述（`file/cw/ch/base/act{idle,walk,hit,down,chant,release}/attack`）；可在 custom 內指定新的 `sheets`/`dir`。`grade` 為整體提亮（bri/sat/con）。 |
| `recolor` | `hue`(度) `sat` `bri` `con` `tint`(#rrggbb) `tintA`(0–1)。載入時一次性處理，不影響執行效能；改 `hue` 會走較慢的 HSL 路徑（只在載入時）。 |

### 調色（不換圖也能「換皮、改白一點」）
- 角色整體：`chars.grade`（現為 bri 1.05 / sat 1.03 / con 0.98，偏亮偏白）。
- 單一怪物：`mobs.<id>.recolor`。
- 想全部更白：把 `bri` 調到 1.1、`sat` 調到 0.95，並在 `recolor.tint:"#ffffff", tintA:0.1`。

## 重新產生內建素材
- `python3 tools/gen_mobs.py` → `assets/mobs/t{1,2,3}_*.png`（36 隻原創怪，含 `_preview.png`）。
- `python3 prep_assets.py` → 角色 sheet（來源 /workspace/art/v2）。

## 檔案
`index.html`（入口）· `horde.js`（戰鬥/渲染/AI/技能）· `ui.js` + `ui.css`（選單、視窗、技能列）· `data.js`（怪物/地圖/職業/技能/裝備資料）· `art.js`（manifest、recolor、程序圖示）· `bgart.js`（場景）· `xp.css` `horde.css`（樣式）。
