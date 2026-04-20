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
│ ├── row：地圖 + 風險評估（中）
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

## 3️⃣ 中間：地圖 + 風險評估（左右並排）

### 左側：地圖區（約 20~30%）

- 使用 placeholder（不用串地圖 API）
- 顯示當前船位置（mock）
- 顯示航行軌跡（簡單線條模擬）

---

### 右側：風險評估

標題：
「風險評估」

內容（請使用「半量化表示」）：

- 遲到機率：高 / 中 / 低（附百分比）
- 燃油不足風險：高 / 中 / 低
- ECA 進入風險：高 / 中 / 低
- 航線管制風險：高 / 中 / 低

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

在頁面底部加入 timeline 控制元件：

- 可拖動時間
- 顯示時間刻度

### 互動要求（強制實作）

當 timeline 改變時：

- 更新船舶現況資料（mock）
- 更新地圖位置
- 更新風險評估
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
   - RiskPanel.js
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
