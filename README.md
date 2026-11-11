# 🐟 魚樂匯 水族販賣機網站

純靜態網站（HTML + CSS + JavaScript），部署在 GitHub Pages：
https://joyfulfish.github.io/joyfulfish-vending/

顧客瀏覽商品、加入詢價清單，一鍵把清單帶到 LINE 官方帳號 `@joyfulfish`。

## 日常更新流程

1. 編輯 `水族商品階梯報價.xlsx` 並儲存
2. （選用）雙擊 `檢查重複商品.command`
3. 雙擊 `更新商品.command`，產生 `products.json` 並同步圖片到 `images/`
4. （選用）雙擊 `本地測試.command`，在瀏覽器預覽
5. 雙擊 `上傳到GitHub.command`，確認變更摘要後按 Enter 即上傳

上傳後約 1-2 分鐘網站自動更新。

## Excel 欄位

| 欄位 | 說明 |
|---|---|
| 分類、品名、尺寸 | 品名 + 尺寸不可重複 |
| 商品標籤 | 例如 🔥熱門、✨新到，可留空 |
| 在庫 | `V` 正常販售、`S` 售完展示（只顯示圖片）、空白 = 下架 |
| 備註 | 例如「雌雄各半」 |
| 第一階數量 / 第一～三組單價、總價、原價 | 第一組必填，第二、三組選填；有填原價才會顯示「省 NT$」 |

注意：第一組的數量欄叫「第一階數量」，第二、三組叫「第二組數量」「第三組數量」。

## 商品圖片

圖片放在共用資料夾（本資料夾的 `商品圖影檔` 捷徑指向它），腳本依下列順序找檔名：
`品名1` → `品名-1` → `品名 1` → `品名2…3` → `品名`，副檔名支援 jpg / jpeg / png。
找到的圖片會複製到 `images/`。若共用資料夾不在這台電腦上，只會使用 `images/` 內既有圖片。

## 資料夾結構

```
工作資料夾/
├── index.html              網站頁面
├── css/style.css           樣式
├── js/                     前端程式（依 index.html 的載入順序）
│   ├── config.js           LINE 帳號、組別名稱
│   ├── utils.js            共用工具（提示、剪貼簿）
│   ├── products.js         商品載入、分類、搜尋、卡片
│   ├── cart.js             詢價清單
│   ├── line-order.js       送出到 LINE
│   ├── stats.js            訪客統計（本地模擬）
│   └── main.js             進入點
├── products.json           商品資料（由腳本產生，勿手改）
├── images/                 商品圖片（網站實際使用）
├── logo.png, line_qrcode.png
├── tools/                  更新與檢查腳本（不會上傳）
├── 水族商品階梯報價.xlsx    資料來源（不會上傳）
├── *.command               雙擊執行的指令
├── 預購表單系統/            獨立系統（不會上傳）
└── _archive/               重構前的舊檔案備份（確認沒問題後可刪除）
```

只有 `.gitignore` 白名單內的檔案會上傳到 GitHub（網站檔案與 `images/`），Excel 報價不會公開。

## 常見問題

- **更新商品時跳出「商品數量比現有少很多」**：Excel 可能不是最新版，確認後再繼續。
- **圖片沒顯示**：檢查圖片檔名是否符合上述規則，並確認已執行 `更新商品.command`。
- **上傳失敗**：確認網路與 GitHub 登入（終端機執行 `gh auth status`）。變更已存在本機，修好後重新執行 `上傳到GitHub.command` 即可。
- **需要 Python 套件**：`pip3 install pandas openpyxl`

## 環境需求

macOS、Python 3、`pandas`、`openpyxl`、`git`（已登入 GitHub）。
