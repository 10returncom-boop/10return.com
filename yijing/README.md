# 易經大白話 · 白話易經知識庫

繁體中文（zh-Hant-TW）多頁式靜態網站：9 大分類、44 篇文章、64 則實務案例、122 個 HTML 頁面，零外部依賴，可直接丟 Cloudflare Pages 或任何靜態空間。

## 網站定位

史上最完整、分類最詳細、資料最正確的白話易經。

## 目錄結構

```
index.html                 首頁（hero＋9 分類＋專業專題 6 卡＋64 卦速查＋全部文章索引）
{分類 slug}/index.html     9 個分類總覽頁（hexagrams 另含 64 卦一覽表，每列有「看案例」）
{分類 slug}/{文章 slug}/index.html   44 篇文章頁（含階層編號 TOC）
hexagrams/cases/index.html  64 則實務案例總覽（上經・下經兩段）
hexagrams/case-XX-{拼音}/index.html  64 個單卦實務案例頁
sitemap.xml / robots.txt / 404.html
assets/                    build 時由 src_assets/ 複製（css / js / img）
build.py                   產生器（改版型、SEO、選單都在這裡）
content1.py ~ content5.py  文章內容（依分類分檔）
content_hex.py             64 卦資料（卦序、上下卦、爻線圖樣、一句白話）
content_cases.py           64 則實務案例：整合、slug、頁面內容組裝
content_cases_1~4.py       案例資料本體（每支 16 卦）
content_menu.py            MegaMenu 主題結構（分類 → 主題 → 條目），擴充選單只改這支
make_assets.py             favicon.svg 與 og-cover.webp 產生器
check_site.py              品質檢查（簡體殘留、斷鏈、SEO 標籤、頁數）
_dev/                      開發過程的截圖與一次性腳本，非網站內容，可整個刪除
```

## 建置

```powershell
python build.py        # 重新產生全部頁面與 assets/
python check_site.py   # 檢查簡體字殘留、斷鏈、SEO 標籤
python make_assets.py  # 重新產生 favicon 與社群分享圖（需 PIL）
```

改樣式請改 `src_assets/css/style.css`，不要改 `assets/`（每次 build 會被整個重建覆蓋）。

## 改網址

`build.py` 頂部 `SITE_URL` 一行即可（目前是佔位 `https://yijing-dabaohua.pages.dev`），改完重跑 build，canonical、OG、JSON-LD、sitemap 會全部同步。

## 九大分類（順序即導覽順序）

| # | 分類 | slug | 篇數 |
|---|------|------|------|
| 1 | 易經入門 | yijing-basics | 5 |
| 2 | 六十四卦 | hexagrams | 5 |
| 3 | 卦象結構 | structure | 4 |
| 4 | 十翼易傳 | ten-wings | 4 |
| 5 | 占卜實務 | divination | 9 |
| 6 | 易學簡史 | history | 4 |
| 7 | 易經與生活 | yijing-in-life | 4 |
| 8 | 易學辭典 | glossary | 3 |
| 9 | 專業專題 | special-topics | 6 |

占卜實務細分四主題：`起卦方法`（金錢卦／蓍草法／梅花易數／六爻納甲）、`問題與準備`、`解卦與判讀`、`觀念與分寸`。分類頁的文章順序會自動跟著主題順序排（`reorder_articles()`）。

## 已實作的功能

- Header 9 項導覽，每個分類的 MegaMenu 是**「分類 → 主題 → 條目」三層結構**（不是文章清單）：面板依主題分欄，每欄一個小標題（01 起卦方法、02 判讀與分寸…），條目掛在主題底下。要調整或新增主題，只改 `content_menu.py`，`build.py` 不用動。
- 「六十四卦」面板：左欄是主題（卦序邏輯／64 卦總表），右邊依 `上經 1–32`、`下經 33–64` 排 64 格，每格帶**自繪卦符（六爻線）＋卦序＋卦名**，點一格跳到該分類頁總表對應列。
- 每頁側欄「全站分類」列出全部 9 類，自動展開當前分類並捲到可見位置。
- 每篇文章自動解析 `## / ### / ####`，產生 `1 / 1.1 / 1.1.1` 階層編號目錄，並隨捲動高亮。
- 每頁輸出 title、description、keywords、canonical、hreflang、Open Graph、Twitter Card、JSON-LD（WebSite／CollectionPage／BreadcrumbList／Article／FAQPage）、sitemap、robots。
- **64 則實務案例**：每一卦一頁（`/hexagrams/case-XX-{pinyin}/`），固定五段結構「情境 → 卦象怎麼對應 → 判讀 → 可以做的三件事 → 最常見的誤用」＋2 題 FAQ；64 卦總表每列有「看案例 →」，另有總覽頁 `hexagrams/cases/index.html`（上經／下經兩段 4 欄格）。選單在「六十四卦」面板左欄的 `02 實務案例`。
- URL 一律語意化英文 slug（`/hexagrams/qian-hexagram/`、`/hexagrams/case-01-qian/`），每層都有 `index.html`。
- 卦象線條為 CSS 自繪（不用 Unicode 卦符，避免字型缺字），64 卦總表符號欄為六爻圖。

## 用字說明

全站統一「無咎」而非通行本寫法的「无咎」，以符合 zh-Hant 用字規範；引用卦爻辭的「于」保留原文寫法（如「繫于苞桑」）。
