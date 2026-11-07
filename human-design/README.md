# 人類圖知識分析（Human Design & Knowledge Analysis）

以「國樂百科」模板（`D:\_WWW_325_public\guoyue-encyclopedia`）為骨架改寫的純靜態知識站，
版面語法、class 名稱、`js/main.js` 六個互動功能全部沿用模板，只換主題與內容，並加上三個可互動的「知識算命」工具。

- 入口：`index.html`
- 語言：繁體中文（zh-Hant）
- 技術：純 HTML／CSS／JS，無框架、無後端、無外部資源

## 一、站台結構

```
人類圖與知識分析/
├─ index.html                    首頁
├─ 404.html
├─ css/style.css                模板樣式 + 本站擴充
├─ js/main.js                   模板原檔（未改）
├─ js/hd-data.js                由 build.py 產生（64 閘門／9 中心／36 通道／五迴路／五類型／曼陀羅）
├─ js/hd-core.js                計算核心：天文曆算 → 閘門／爻線、體圖推導、SVG 繪圖
├─ js/tools.js                  三個工具的 DOM 綁定
├─ 概論／類型／能量中心／權威／人生角色／閘門／通道／輪迴交叉／知識分析／工具
│   └─ 每類一個 index.html 總覽頁，底下掛文章頁（共 19 篇）
└─ _build/                      產生器與檢查腳本（不屬於網站內容，可獨立保留）
```

十大分類（MegaMenu 編號 01–10）：概論、類型、能量中心、內在權威、人生角色、
六十四閘門、三十六通道、輪迴交叉、知識分析、分析工具。

## 二、模板沿用的地方

| 模板元素 | 本站做法 |
|---|---|
| header：brand + nav-toggle + nav（nav-item 帶兩位數 nav-no、caret、megamenu cols-2/3/4） | 完全沿用，10 類每個都有 MegaMenu（mm-top／mm-grid／mm-bottom） |
| 子頁 page-head + article-layout（article-main + 288px sticky sidebar：toc-box + side-nav-box） | 完全沿用；TOC 由產生器依 h2/h3 自動生成 |
| `#catFilter` 下拉篩選、`[data-cat]`、`#filterInfo` | 閘門總覽（依九中心分組）、通道總覽（依五迴路分組）都掛上 |
| `#siteSearch`、`#navToggle`、`body[data-nav]` 高亮、`.toc-nav` 捲動同步 | 原檔 `js/main.js` 未改一行 |
| 卡片／時間軸／比較表／CTA | 沿用 `.card`、`.timeline`、`.cmp-wrap`、`.btn-main` |
| 六張國樂照片 | 不沿用，改以 CSS 漸層 + 內嵌 SVG 圖示的 `.card-visual`（v0–v3 四種漸層） |

## 三、三個工具（本站自行加上）

1. **太陽閘門速查**（`工具/太陽閘門速查.html`）
   輸入出生日期、時間、時區 → 以 Meeus 低精度太陽黃經 + 視黃經修正，換算曼陀羅位置，
   輸出六個啟動：人格太陽／地球、設計太陽／地球、南北交（平均節點，標示為參考值）。
   曼陀羅常數：Gate 41 起點黃經 302°、每閘門 5.625°、每爻 0.9375°、地球＝對宮（+180°）、設計＝太陽 −88°。
2. **體圖建構器**（`工具/體圖建構器.html`）
   勾選 64 個閘門 → 自動接通通道 → 中心連通判定 → 推導類型與內在權威，
   即時畫出九中心 SVG 體圖（36 條通道線、已接通加粗並標兩端閘門號）。
3. **類型自測**（`工具/類型自測.html`）
   八題行為傾向，計分規則公開，結果含五型長條圖、權威傾向與「下一步」，並明示準確率有限。

## 四、建置與驗證

```powershell
python _build\build.py        # 重新產生 31 個 HTML + js\hd-data.js
python _build\verify.py       # 靜態自檢：曼陀羅、資料層、標籤配對、內部連結、錨點
node   _build\test-core.js    # 計算核心單元測試（node + vm 載入兩支 JS）
python _build\browser_check.py# Playwright 實機互動與截圖（已指定本機 Chrome）
```

`_build\fix_content.py` 為一次性內容修正紀錄（16 處 HTML 缺陷），保留供追溯。

驗證現況：`verify.py` 失敗項 0、`test-core.js` 全通過、`browser_check.py` console 錯誤 0，
1440／1331／1200／1100／900／390 六個寬度實測無橫向溢出，截圖存於 `_build/shots/`。

## 五、已知邊界（頁面上也寫明）

- 太陽閘門速查只算 6 個啟動，不是完整 26 個啟動；黃經誤差約 0.01°（≈15 分鐘），
  太陽落在閘門邊界 15 分鐘內時結果可能不同。
- 南北交採月亮平均節點，非真交點，屬參考值。
- 體圖建構器只做通道／中心／類型／權威的結構推導，不做爻線分析、不做流年流日。
- 全站不構成醫療、法律、財務或人生決策建議；不做恐嚇式解讀、不販售課程。
