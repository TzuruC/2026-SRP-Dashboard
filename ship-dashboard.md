你是一位資深前端工程師，請在「既有 Vite + Vanilla JS + Bootstrap 5 專案」中，新增一個「單船 Dashboard 頁面」。

請務必遵守以下要求：

# 一、技術限制

- 使用 Bootstrap 5（grid + utility）
- 使用 Vanilla JavaScript（ES6）
- 不使用任何框架（React / Vue 禁止）
- 不破壞現有專案結構
- 採模組化 JS（component-based）
- 不使用 inline JS

# 二、頁面目的（非常重要）

此頁面為「單船決策支援 Dashboard」，用來幫助使用者：

1. 了解船舶當前狀態
2. 判斷未來是否有風險（例如延誤、燃油不足）
3. 回顧歷史航行狀態（透過 timeline）

# 三、整體 UI 風格

- 深色主題（dark theme）
- 工業感 / 監控系統風格
- 資訊密度中等
- 簡潔但偏數據導向
- 所有文字使用「台灣繁體中文」

# 四、Layout 結構（Bootstrap 12 grid）

container-fluid
├── row
│ ├── col-2：船舶列表（左側固定）
│ └── col-10：主內容區
│ ├── row：船舶現況區（上）
│ ├── row：地圖 + 時間軸（中，col-12 全寬）
│ │ └── col-12
│ │ ├── 地圖區（全寬顯示）
│ │ └── 時間軸控制列（地圖正下方）
│ └── row：決策資訊 + 船員資訊（下）

# 五、各區塊設計（全部用繁體中文）

## 1️⃣ 左側：船舶列表

- 可點擊切換船舶
- 顯示船名 + IMO
- 高亮目前選擇船舶
- 可滾動

---

## 2️⃣ 上方：船舶現況區

顯示：

- 船名 / IMO
- 船籍
- 船舶類型
- 起迄港
- ETA
- 預估總航行時間
- 預計延誤時間

### 現況區塊（需分兩段）

#### (1) 油量資訊

標題：
「油量資訊（最後更新時間：xxxx）」

內容：

- 當前油量
- 狀態（碼頭 / 料源 / 剩餘量 / 預計完工時間）

#### (2) 碼頭作業

標題：
「碼頭作業（最後更新時間：xxxx）」

內容：

- 作業名稱
- 狀態（碼頭 / 料源 / 剩餘量 / 預計完工時間）

---

## 3️⃣ 中間：地圖區（col-12 全寬）

- 使用 Leaflet.js（CartoDB 深色底圖）
- 顯示當前船位置標記（mock 資料）
- 顯示已航行軌跡（實線）與未來預測航路（虛線）
- 懸停標記顯示船名、速度、ETA

---

## 4️⃣ 下方：決策資訊 + 船員資訊

### (1) 決策資訊

- 事件列表（event list）
- 顯示：
  - 類型（delay / anomaly）
  - 時間
  - 描述

---

### (2) 船員資訊

標題：
「船員警報」

內容：

- 船員服務時間警報
- 船員證書警報

---

## 5️⃣ Timeline（非常重要）

位於地圖下方（中間列 col-12 內），緊接在地圖區塊正下方：

- 可拖動時間（0～24 小時）
- 顯示目前時間刻度
- 提供播放 / 暫停 / 跳至開始 / 跳至結束控制

### 互動要求（強制實作）

當 timeline 改變時：

- 更新船舶現況資料（mock）
- 更新地圖位置與航跡
- 更新事件列表

👉 請實作「單一資料來源 state」，由 timeline 控制整體畫面

---

# 六、資料格式（請使用 mock data）

請設計如下結構：

{
ship: {
id,
name,
imo,
flag,
type,
route,
eta,
totalDuration,
delayTime
},
fuelStatus: {...},
portOperation: {...},
risk: {...},
crewAlert: {...},
timelineData: [...]
}

---

# 七、檔案輸出要求

請產出：

1. index.html（或新頁面 html）
2. main.js
3. components：
   - ShipList.js
   - ShipOverview.js
   - MapPanel.js
   - EventList.js
   - CrewPanel.js
   - Timeline.js

4. styles.css（深色主題）

---

# 八、重要設計原則

- UI 必須乾淨、可擴充
- 所有區塊需可獨立更新
- JS 使用模組化（import/export）
- 所有顯示文字使用「台灣繁體中文」
- 不要寫死資料在 HTML（用 JS render）

---

請直接產出完整可執行範例。

---


# 九、現有實作現況（2026-04-21 更新）

## 9.1 檔案結構

```
ship-dashboard.html              # 入口 HTML（含 RWD Bootstrap class）
src/ship/
  main-ship.js                   # 主控制器（state + 組裝元件）
  style-ship.css                 # 深色主題 CSS（CSS 變數 + RWD media query）
  data/
    mockShipData.js              # 模擬資料產生器（多燃料結構）
  components/
    ShipList.js                  # 船舶列表
    ShipOverview.js              # 船舶現況區（多燃料彩色條）
    MapPanel.js                  # Leaflet 地圖（含多燃料 tooltip）
    EventList.js                 # 決策事件列表（可點擊跳轉 Timeline）
    CrewPanel.js                 # 船員服務時間 + 證書警報
    Timeline.js                  # 決策導向 Timeline（NOW / EVENT 模式）
    RiskPanel.js                 # 風險面板（已掛載啟用）
checker/
  index.js                       # 自動化品質檢查入口（runChecks）
  htmlSeo.js                     # HTML / SEO 8 項 Cheerio 檢查
  responsive.js                  # 響應式設計 3 視窗 Playwright 檢查
  report.js                      # 評分計算與彩色報告輸出
```

## 9.2 資料模型（實際實作）

### 船舶靜態資料（SHIPS）

```js
{
  id, name, imo, flag, type,
  startPort, endPort,
  startPos: { lat, lng },
  endPos: { lat, lng },
  expectedEtaH,        // 預期到達小時數（從 BASE_MS 起算）
  fuels: [             // 多燃料陣列（HFO / MGO / VLSFO）
    { type, name, capacity, initial, burnRate }
  ],
  events: [{ hour, type, severity, label, description }],
  crew: [{ name, rank, serviceDays, maxDays }],
  certificates: [{ name, expiry, status }]
}
```

### 快照資料（snapshots，每艘船 25 步 hour 0–24）

```js
{
  hour, timestamp, timeLabel,
  position: { lat, lng },
  speed,
  delayMinutes,
  eta, expectedEta,
  fuelStatus: {
    fuels: [{ type, name, current, capacity, percentage }], // 各燃料即時狀態
    totalTonnes, totalCapacity, overallPercentage,          // 總量摘要
    type, status, lastUpdate                                // 向下相容欄位
  },
  portOperation: { name, status, pier, cargo, remaining, estCompletion, lastUpdate },
  risk: {
    lateArrival:  { level, pct },
    fuelShortage: { level, pct },
    ecaEntry:     { level, pct },
    routeControl: { level, pct }
  },
  events: []  // 累積至當前 hour 的事件
}
```

## 9.3 State 管理（main-ship.js）

```js
const state = {
  selectedShipId: mockData.ships[0].id,  // 預設選第 1 艘
  currentStep:    0,                      // Timeline 時間步驟（0–24）
  timelineMode:   'NOW',                 // 'NOW' | 'EVENT'
  focusEventId:   null,                  // 焦點事件 ID（EVENT 模式用）
  window:         { start: 0, end: 24 }, // Timeline 顯示視窗範圍（小時）
};
```

| 函式 | 說明 |
| ---- | ---- |
| selectShip(shipId) | 切換船舶，重置為 NOW 模式 step=0，重繪全部 |
| onTimeStep(step) | 更新 step，NOW 模式自動更新 ±12h 視窗，重繪 |
| onEventClick(event) | 切換至 EVENT 模式，聚焦到事件時間點 ±12h |
| onNow() | 返回 NOW 模式，重置視窗 |
| updateWindow() | NOW → clamp(step±12, 0, 24)；EVENT → 保持不變 |

## 9.4 模擬船舶資料（3 艘）

| ID     | 名稱         | 路線            | 特色                                       |
| ------ | ------------ | --------------- | ------------------------------------------ |
| SHP001 | 永盛號       | 高雄港 → 上海港 | 延誤 4h，天氣事件，ECA 警示（h=10–15）     |
| SHP002 | 太平洋先鋒號 | 台中港 → 釜山港 | 準時到達，低風險                           |
| SHP003 | 東方之星號   | 基隆港 → 廣州港 | 延誤 8h，碼頭壅塞，ECA 進入（h≥4）         |

### ECA 切換邏輯（isInECA / calcHourlyBurn）

- SHP001 h=10–15：進入東海 ECA，HFO burnRate=0，VLSFO 吸收 HFO 用量
- SHP003 h≥4：進入南海 ECA，同上

## 9.5 RiskPanel（風險面板）

已完整重構並掛載於 ship-dashboard.html 的 ottom-row（col-12 col-md-7）：

- enderRiskPanel(container, risk, fuelStatus) — 3 參數 API
- 頂部橫條顯示各燃料即時百分比（HFO / MGO / VLSFO 彩色）
- deriveFuelRisks(fuelStatus) 自動衍生燃料風險規則：
  - VLSFO < 30% → 高風險
  - 總油量 < 35% → 中風險
  - ECA 區段 HFO 未清空 → 中風險

## 9.6 地圖實作（MapPanel.js）

- 使用 **Leaflet.js** + CartoDB dark_all 底圖
- 船舶位置：藍色圓形標記，選取時加大 + 白框
- 目的地：綠色圓形標記
- 過去軌跡：藍色實線（#58a6ff）
- 未來預測航路：灰色虛線（#8b949e，dashArray 5 6）
- 懸停 tooltip 顯示各燃料明細（uildTooltip 函式）
- 切換船舶時自動 itBounds；時間步驟變更以動畫 panTo 移動

## 9.7 CSS 設計變數

```css
--bg-primary: #0d1117;    --bg-secondary: #161b22;   --bg-tertiary: #21262d;
--border-color: #30363d;  --text-primary: #c9d1d9;   --text-muted: #8b949e;
--accent: #58a6ff;        --warning: #d29922;         --danger: #f85149;
--success: #3fb950;       --map-h: 320px;
```

### RWD Media Query

```css
/* 手機 < 768px */
@media (max-width: 767.98px) { #map-panel-pane { height: 220px; } ... }
/* 平板 768–992px */
@media (min-width: 768px) and (max-width: 991.98px) { #map-panel-pane { height: 260px; } }
```

## 9.8 與原始需求的差異 / 現狀對照

| 需求                  | 現況                                                |
| --------------------- | --------------------------------------------------- |
| RiskPanel（風險面板） | ✅ 已重構並掛載（bottom-row col-md-7）               |
| 多燃料系統            | ✅ HFO / MGO / VLSFO 三燃料，含 ECA 切換邏輯        |
| 資料格式 isk       | 實作為 { level, pct } 物件，非純字串              |
| 資料格式 crewAlert  | 實際拆分為 crew[] + certificates[] 靜態欄位     |
| 	imelineData        | 以 snapshots 陣列實作（25 個時間點）              |
| styles.css          | 實際為 style-ship.css（含 RWD media query）       |
| Timeline 互動         | ✅ NOW / EVENT 雙模式，±12h 視窗，EventList 聯動    |
| 自動化品質檢查        | ✅ 
pm run test（11 項 HTML/SEO + 響應式）         |

---

# 十、決策導向 Timeline（2026-04-21 實作）

## 10.1 設計目標

讓操作員能快速在「目前時間點」與「事件發生時間點」之間切換，聚焦於異常時段。

## 10.2 雙模式

| 模式 | 觸發方式 | 視窗行為 |
| ---- | -------- | -------- |
| **NOW 模式** | 預設 / 點擊「回到現在」 | 自動跟隨 currentStep ± 12h |
| **EVENT 模式** | 點擊 EventList 任一事件 | 固定於 event.hour ± 12h |

## 10.3 Timeline 元件 API（Timeline.js）

```js
renderTimeline(container, {
  currentStep,  // 目前步驟（0–24）
  window,       // { start, end } 視窗範圍
  events,       // 船舶全部事件（含未來）
  mode,         // 'NOW' | 'EVENT'
  onChange,     // (step) => void
  onNow,        // () => void — 返回 NOW 模式
})
```

## 10.4 視覺元素

- **事件點（dot）**：位於 track 上方，顏色依類型區分
  - delay → 黃色 #d29922
  - speedAnomaly / weather / severity=high → 紅色 #f85149
  - 其他 → 灰色 #8b949e
- **視窗 Overlay**：半透明藍色覆蓋當前視窗範圍
- **時間刻度**：根據視窗寬度自動調整間距（1h / 2h / 4h）
- **「回到現在」按鈕**：僅在 EVENT 模式顯示

## 10.5 EventList 聯動

```js
// EventList.js — 第三參數 onEventClick
renderEventList(container, events, onEventClick)
// 點擊後 main-ship.js 的 onEventClick(event) 被呼叫
// → state.timelineMode = 'EVENT'
// → state.window = { start: event.hour - 12, end: event.hour + 12 }
// → state.currentStep = event.hour
```

---

# 十一、自動化品質檢查工具（checker/）

## 11.1 執行方式

```bash
npm run test                              # 預設 http://localhost:5173/ship-dashboard.html
node checker/index.js <URL>              # 指定任意 URL
```

## 11.2 評分規則

- 共 11 項（8 項 HTML/SEO + 3 項響應式）
- 每項 100 ÷ 11 ≈ 9.09 分，通過即得分，最終四捨五入
- 等級：≥90 優秀、≥70 良好、≥50 待改善、< 50 不合格

## 11.3 檢查項目

### HTML / SEO（Cheerio）

| # | 項目 | 檢查內容 |
|---|------|----------|
| 1 | 基本 HTML 結構 | <html> <head> <body> 是否存在 |
| 2 | 語言屬性 | <html lang> 是否有值 |
| 3 | 字元編碼 | <meta charset="UTF-8"> |
| 4 | 頁面標題 | <title> 存在且非空 |
| 5 | Meta Description | <meta name="description"> 且 50–160 字元 |
| 6 | 主標題 | <h1> 唯一存在 |
| 7 | 圖片 alt | 所有 <img> 有 lt 屬性 |
| 8 | 連結有效性 | <a href> 非空且非 # |

### 響應式設計（Playwright Chromium）

| # | 裝置 | 寬度 | 檢查項目 |
|---|------|------|----------|
| 9  | 手機版 | 320px  | 無水平捲動 |
| 10 | 平板版 | 768px  | 無水平捲動 |
| 11 | 桌機版 | 1440px | 無水平捲動 |

## 11.4 實測結果（ship-dashboard.html）

```
通過項目：9 / 11  →  總分：82 分（良好 👍）
❌ Meta Description：缺少 <meta name="description">
❌ 主標題（h1）：缺少 <h1>
✅ 手機版 / 平板版 / 桌機版：均無水平捲動
```