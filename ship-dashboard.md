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

# 九、現有實作現況（2026-04-21 分析）

## 9.1 檔案結構

```
ship-dashboard.html              # 入口 HTML
src/ship/
  main-ship.js                 # 主控制器（state + 組裝元件）
  style-ship.css               # 深色主題 CSS（CSS 變數）
  data/
    mockShipData.js              # 模擬資料產生器
  components/
    ShipList.js                  # 船舶列表
    ShipOverview.js              # 船舶現況區（含油量 + 碼頭作業）
    MapPanel.js                  # Leaflet 地圖
    EventList.js                 # 決策事件列表
    CrewPanel.js                 # 船員服務時間 + 證書警報
    Timeline.js                  # 時間軸回放控制
    RiskPanel.js                 # 風險面板（目前 comment 掉，未啟用）
```

## 9.2 資料模型（實際實作）

### 船舶靜態資料（SHIPS）

```js
{
  id, name, imo, flag, type,
  startPort, endPort,
  startPos: { lat, lng },
  endPos: { lat, lng },
  expectedEtaH,       // 預期到達小時數（從 BASE_MS 起算）
  fuelCapacity,        // 油箱容量（公噸）
  initialFuel,         // 出發油量（公噸）
  fuelBurnRate,        // 每小時耗油（公噸）
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
  speed,               // 節
  delayMinutes,
  eta, expectedEta,    // 格式化字串
  fuelStatus: { tonnes, capacity, percentage, type, status, lastUpdate },
  portOperation: { name, status, pier, cargo, remaining, estCompletion, lastUpdate },
  risk: {
    lateArrival:  { level: '高'|'中'|'低', pct: number },
    fuelShortage: { ... },
    ecaEntry:     { ... },
    routeControl: { ... }
  },
  events: []           // 累積至當前 hour 的事件
}
```

## 9.3 State 管理（main-ship.js）

```js
const state = {
  selectedShipId: mockData.ships[0].id, // 預設選第 1 艘
  currentStep: 0, // Timeline 時間步驟（0–24）
};
```

- `selectShip(shipId)` → 切換船舶，重置 step 為 0，重繪全部
- `onTimeStep(step)` → 更新 step，重繪除船舶列表以外的所有區塊

## 9.4 模擬船舶資料（3 艘）

| ID     | 名稱         | 路線            | 特色                            |
| ------ | ------------ | --------------- | ------------------------------- |
| SHP001 | 永盛號       | 高雄港 → 上海港 | 延誤 4 小時，天氣事件，ECA 警示 |
| SHP002 | 太平洋先鋒號 | 台中港 → 釜山港 | 準時到達，低風險                |
| SHP003 | 東方之星號   | 基隆港 → 廣州港 | 延誤 8 小時，碼頭壅塞，ECA 進入 |

## 9.5 風險評分規則

- **高**：pct ≥ 65
- **中**：pct ≥ 35
- **低**：pct < 35

風險面板（RiskPanel.js）已完成開發，但在 main-ship.js 中被 comment 掉，可隨時啟用：

```js
// import { renderRiskPanel } from './components/RiskPanel.js';
// renderRiskPanel(document.getElementById('risk-panel-pane'), snap.risk);
```

HTML 中亦無對應的 `#risk-panel-pane` 容器，啟用時需一併新增。

## 9.6 地圖實作（MapPanel.js）

- 使用 **Leaflet.js** + CartoDB dark_all 底圖
- 船舶位置：藍色圓形標記，選取時加大 + 白框
- 目的地：綠色圓形標記
- 過去軌跡：藍色實線（`#58a6ff`）
- 未來預測航路：灰色虛線（`#8b949e`，dashArray `5 6`）
- 切換船舶時自動 `fitBounds` 調整視野
- 時間步驟變更時以動畫 `panTo` 移動

## 9.7 CSS 設計變數

```css
--bg-primary: #0d1117 --bg-secondary: #161b22 --bg-tertiary: #21262d
  --border-color: #30363d --text-primary: #c9d1d9 --text-muted: #8b949e
  --accent: #58a6ff --warning: #d29922 --danger: #f85149 --success: #3fb950
  --map-h: 320px /* 地圖固定高度 */;
```

## 9.8 與原始需求的差異 / 待確認事項

| 需求                  | 現況                                            |
| --------------------- | ----------------------------------------------- |
| RiskPanel（風險面板） | 已開發但未掛載，需手動啟用                      |
| 資料格式 `risk`       | 實作為 `{ level, pct }` 物件，非純字串          |
| 資料格式 `crewAlert`  | 實際拆分為 `crew[]` + `certificates[]` 靜態欄位 |
| `timelineData`        | 以 `snapshots` 陣列實作（25 個時間點）          |
| styles.css            | 實際為 `style-ship.css`                         |
