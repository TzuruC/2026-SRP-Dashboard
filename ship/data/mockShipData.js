function lerp(a, b, t) { return a + (b - a) * t; }

const BASE_MS = new Date('2026-04-20T00:00:00+08:00').getTime();
function addHoursIso(h) { return new Date(BASE_MS + h * 3_600_000).toISOString(); }
function fmtIso(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function riskLevel(pct) {
  if (pct >= 65) return '高';
  if (pct >= 35) return '中';
  return '低';
}

/* ── Ship definitions ───────────────────────────────── */

const SHIPS = [
  {
    id: 'SHP001',
    name: '永盛號',
    imo: '9795372',
    flag: '巴拿馬',
    type: '貨櫃船',
    startPort: '高雄港',
    endPort: '上海港',
    startPos: { lat: 22.57, lng: 120.30 },
    endPos:   { lat: 31.23, lng: 121.50 },
    expectedEtaH: 34,
    fuels: [
      { type: 'HFO',   name: '重油',       capacity:  800, initial: 620, burnRate: 14 },
      { type: 'MGO',   name: '輕油',       capacity:  180, initial: 150, burnRate:  2 },
      { type: 'VLSFO', name: '低硫燃料油', capacity:  220, initial: 150, burnRate:  2 },
    ],
    events: [
      { hour: 3,  type: 'speedAnomaly', severity: 'medium', label: '速度異常', description: '航速降至 12 節，偏離預定速度 6 節' },
      { hour: 7,  type: 'eca',          severity: 'low',    label: 'ECA 警示', description: '預計於 3 小時後進入東海 ECA 管制區' },
      { hour: 10, type: 'weather',      severity: 'high',   label: '天氣警報', description: '遭遇 6 級風浪，船速持續受影響' },
      { hour: 14, type: 'delay',        severity: 'high',   label: '延誤確認', description: '預計延誤 4 小時抵達上海港' },
      { hour: 18, type: 'info',         severity: 'low',    label: '狀態更新', description: '天候改善，航速恢復正常至 18 節' },
      { hour: 22, type: 'info',         severity: 'low',    label: '靠泊通報', description: '已通報上海港引水站，預計靠泊 D7 碼頭' },
    ],
    portEvents: [
      { hour: 36, type: 'berthing',    label: '靠泊',       severity: 'low',    description: '靠泊上海港 D7 碼頭，引水員登船引導' },
      { hour: 38, type: 'cargoOps',    label: '卸貨作業',   severity: 'low',    description: '開始卸載貨櫃，預計 18 小時完成' },
      { hour: 44, type: 'crewChange',  label: '船員交接',   severity: 'medium', description: '陳大衛（船長）、李明恩（大副）服務期滿，安排交接' },
      { hour: 52, type: 'bunkering',   label: 'HFO 補給',   severity: 'medium', description: 'HFO 補給 350T，預計 6 小時，接管確認中' },
      { hour: 62, type: 'inspection',  label: 'PSC 檢查',   severity: 'high',   description: '中國海事局港口國管制例行檢查' },
      { hour: 80, type: 'certRenewal', label: '證書更新',   severity: 'medium', description: 'SOLAS 安全證書（到期 05-15）送審更新' },
    ],
    crew: [
      { name: '陳大衛', rank: '船長',   serviceDays: 165, maxDays: 180 },
      { name: '李明恩', rank: '大副',   serviceDays: 158, maxDays: 180 },
      { name: '王志峰', rank: '輪機長', serviceDays: 142, maxDays: 180 },
    ],
    certificates: [
      { name: 'SOLAS 安全證書',     expiry: '2026-05-15', status: '即將到期' },
      { name: '船級社年度檢驗',     expiry: '2026-08-22', status: '正常' },
      { name: 'ISM 安全管理證書',   expiry: '2027-01-10', status: '正常' },
    ],
  },
  {
    id: 'SHP002',
    name: '太平洋先鋒號',
    imo: '9123456',
    flag: '賴比瑞亞',
    type: '散裝貨船',
    startPort: '台中港',
    endPort: '釜山港',
    startPos: { lat: 24.29, lng: 120.53 },
    endPos:   { lat: 35.10, lng: 129.04 },
    expectedEtaH: 44,
    fuels: [
      { type: 'HFO',   name: '重油',       capacity: 1100, initial: 760, burnRate: 17 },
      { type: 'MGO',   name: '輕油',       capacity:  250, initial: 180, burnRate:  3 },
      { type: 'VLSFO', name: '低硫燃料油', capacity:  250, initial: 160, burnRate:  2 },
    ],
    events: [
      { hour: 5,  type: 'info',    severity: 'low',    label: '航路更新', description: '通過台灣海峽北口，轉向東北方' },
      { hour: 12, type: 'weather', severity: 'medium', label: '天氣提示', description: '局部陣雨，能見度降低至 5 海里' },
      { hour: 19, type: 'info',    severity: 'low',    label: 'VTS 報告', description: '已進入韓國 VTS 報告區，等待進港許可' },
    ],
    portEvents: [
      { hour: 46, type: 'berthing',    label: '靠泊',       severity: 'low',    description: '靠泊釜山港 HBCT 碼頭' },
      { hour: 48, type: 'cargoOps',    label: '散貨卸載',   severity: 'low',    description: '鐵礦砂卸貨作業，抓斗式卸貨，預計 24 小時' },
      { hour: 60, type: 'bunkering',   label: 'MGO 補給',   severity: 'low',    description: 'MGO 補給 120T，燃油驗收進行中' },
      { hour: 72, type: 'inspection',  label: '船級檢驗',   severity: 'medium', description: '韓國船級社（KR）定期檢驗' },
      { hour: 96, type: 'crewChange',  label: '船員輪換',   severity: 'low',    description: '一般輪換作業，3 名船員替換' },
    ],
    crew: [
      { name: '張建國', rank: '船長', serviceDays: 95,  maxDays: 180 },
      { name: '吳柏霖', rank: '大副', serviceDays: 88,  maxDays: 180 },
      { name: '方俊傑', rank: '二副', serviceDays: 72,  maxDays: 180 },
    ],
    certificates: [
      { name: 'ISM 安全管理證書',       expiry: '2026-11-30', status: '正常' },
      { name: '防污染證書（MARPOL）',   expiry: '2026-09-18', status: '正常' },
    ],
  },
  {
    id: 'SHP003',
    name: '東方之星號',
    imo: '9234567',
    flag: '馬紹爾群島',
    type: '油輪',
    startPort: '基隆港',
    endPort: '廣州港',
    startPos: { lat: 25.15, lng: 121.74 },
    endPos:   { lat: 23.10, lng: 113.24 },
    expectedEtaH: 44,
    fuels: [
      { type: 'HFO',   name: '重油',       capacity:  650, initial: 510, burnRate: 11 },
      { type: 'MGO',   name: '輕油',       capacity:  150, initial: 120, burnRate:  2 },
      { type: 'VLSFO', name: '低硫燃料油', capacity:  200, initial: 150, burnRate:  2 },
    ],
    events: [
      { hour: 4,  type: 'eca',          severity: 'medium', label: 'ECA 進入', description: '進入南海 ECA 管制區，已切換低硫燃油' },
      { hour: 8,  type: 'routeControl', severity: 'medium', label: '航線管制', description: '台灣海峽南口水道管制，服從 VTS 指令' },
      { hour: 13, type: 'delay',        severity: 'high',   label: '延誤通報', description: '廣州港進港預約壅塞，預計延誤 8 小時' },
      { hour: 17, type: 'weather',      severity: 'medium', label: '天氣警報', description: '南海東北季風增強，蒲福風級 5 級' },
      { hour: 21, type: 'info',         severity: 'low',    label: '代理通知', description: '已確認廣州港代理，修正靠泊時間' },
    ],
    portEvents: [
      { hour: 52, type: 'berthing',    label: '延誤靠泊',   severity: 'high',   description: '港口壅塞，延誤靠泊廣州港 6 號浮筒' },
      { hour: 54, type: 'cargoOps',    label: '油品卸載',   severity: 'medium', description: '原油卸載，管線接泊，注意靜電管控' },
      { hour: 62, type: 'inspection',  label: 'PSC 緊急',   severity: 'high',   description: 'MARPOL Annex II 證書過期，啟動緊急 PSC 檢查' },
      { hour: 68, type: 'certRenewal', label: '緊急換證',   severity: 'high',   description: 'MARPOL Annex II 緊急換證，需取得分類許可' },
      { hour: 80, type: 'crewChange',  label: '船員交接',   severity: 'medium', description: '劉威廷（船長）172 天服務期，優先安排交接' },
      { hour: 92, type: 'bunkering',   label: 'VLSFO 補給', severity: 'medium', description: 'VLSFO 補給 150T，下段 ECA 航程備用' },
    ],
    crew: [
      { name: '劉威廷', rank: '船長',   serviceDays: 172, maxDays: 180 },
      { name: '黃信豪', rank: '大副',   serviceDays: 169, maxDays: 180 },
      { name: '林柏宇', rank: '輪機長', serviceDays: 155, maxDays: 180 },
    ],
    certificates: [
      { name: 'MARPOL Annex II 證書', expiry: '2026-04-30', status: '緊急' },
      { name: '油輪特別檢驗（SCS）',  expiry: '2026-06-01', status: '即將到期' },
      { name: 'ISPS 保全證書',        expiry: '2027-03-15', status: '正常' },
    ],
  },
];

/* ── Risk profile generators ────────────────────────── */

function calcRisk(shipId, h) {
  switch (shipId) {
    case 'SHP001': return {
      lateArrival:  h < 8  ? Math.round(15 + 20 * (h/8))
                  : h < 14 ? Math.round(35 + 47 * ((h-8)/6))
                  : h < 20 ? Math.round(82 - 10 * ((h-14)/6))
                  : Math.round(72 - 12 * ((h-20)/4)),
      fuelShortage: Math.round(8 + 14 * (h/24)),
      ecaEntry:     h < 6  ? 5
                  : h < 10 ? Math.round(5 + 85 * ((h-6)/4))
                  : h < 16 ? 90
                  : Math.round(90 - 75 * ((h-16)/8)),
      routeControl: Math.round(5 + 13 * (h/24)),
    };
    case 'SHP002': return {
      lateArrival:  Math.round(5 + 10 * (h/24)),
      fuelShortage: Math.round(8 + 32 * (h/24)),
      ecaEntry:     5,
      routeControl: Math.round(3 + 7 * (h/24)),
    };
    case 'SHP003': return {
      lateArrival:  h < 12 ? Math.round(20 + 25 * (h/12)) : Math.round(45 + 20 * ((h-12)/12)),
      fuelShortage: Math.round(12 + 20 * (h/24)),
      ecaEntry:     h < 4  ? Math.round(10 + 28 * (h/4))
                  : h < 12 ? Math.round(38 + 42 * ((h-4)/8))
                  : Math.round(80 - 20 * ((h-12)/12)),
      routeControl: h < 8  ? Math.round(15 + 45 * (h/8))
                  : h < 12 ? 60
                  : Math.round(60 - 42 * ((h-12)/12)),
    };
    default: return { lateArrival: 0, fuelShortage: 0, ecaEntry: 0, routeControl: 0 };
  }
}

function calcDelayMinutes(shipId, h) {
  switch (shipId) {
    case 'SHP001':
      return h < 5  ? Math.round(lerp(0, 30, h/5))
           : h < 10 ? Math.round(lerp(30, 180, (h-5)/5))
           : h < 15 ? Math.round(lerp(180, 240, (h-10)/5))
           : h < 20 ? 240
           : Math.round(lerp(240, 230, (h-20)/4));
    case 'SHP002': return 0;
    case 'SHP003':
      return h < 8  ? 0
           : h < 14 ? Math.round(lerp(0, 480, (h-8)/6))
           : 480;
    default: return 0;
  }
}

/* ── Multi-fuel ECA helpers ─────────────────────────── */

function isInECA(shipId, h) {
  if (shipId === 'SHP001') return h >= 10 && h < 16; // 東海 ECA
  if (shipId === 'SHP003') return h >= 4;             // 南海 ECA
  return false;
}

/** 單小時實際燃耗（ECA 時 HFO→0，VLSFO 承接主燃） */
function calcHourlyBurn(shipId, h, fuel, hfoBurnRate) {
  if (isInECA(shipId, h)) {
    if (fuel.type === 'HFO')   return 0;
    if (fuel.type === 'VLSFO') return hfoBurnRate + fuel.burnRate;
  }
  return fuel.burnRate;
}

/* ── Snapshot generator ─────────────────────────────── */

function generateSnapshots(ship) {
  return Array.from({ length: 25 }, (_, h) => {
    const t = h / 24;
    const raw = calcRisk(ship.id, h);
    const risk = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, { level: riskLevel(v), pct: v }])
    );

    // Multi-fuel: accumulate burn per hour for each fuel type
    const hfoDef = ship.fuels.find(f => f.type === 'HFO');
    const hfoBase = hfoDef ? hfoDef.burnRate : 0;
    const fuelItems = ship.fuels.map(f => {
      let burned = 0;
      for (let i = 0; i < h; i++) burned += calcHourlyBurn(ship.id, i, f, hfoBase);
      burned = Math.round(burned);
      const tonnes = Math.max(0, f.initial - burned);
      const pct    = Math.round(tonnes / f.capacity * 1000) / 10;
      return { type: f.type, name: f.name, tonnes, capacity: f.capacity, percentage: pct };
    });
    const totalTonnes    = fuelItems.reduce((s, f) => s + f.tonnes, 0);
    const totalCapacity  = fuelItems.reduce((s, f) => s + f.capacity, 0);
    const overallPct     = Math.round(totalTonnes / totalCapacity * 1000) / 10;
    const overallStatus  = overallPct > 50 ? '正常' : overallPct > 30 ? '注意' : '警告';
    const activeType     = isInECA(ship.id, h) ? 'VLSFO（ECA 模式）' : 'HFO（一般航行）';

    const delayMinutes = calcDelayMinutes(ship.id, h);
    const etaH         = ship.expectedEtaH + delayMinutes / 60;
    const etaIso       = addHoursIso(etaH);

    const portOp = h <= 2
      ? { name: '離港準備作業', status: '進行中', pier: `${ship.startPort} 出港碼頭`, cargo: '－',
          remaining: `約 ${2-h} 小時`, estCompletion: fmtIso(addHoursIso(2)), lastUpdate: fmtIso(addHoursIso(h)) }
      : h >= 22
      ? { name: '進港作業準備', status: '待命',   pier: `${ship.endPort} 進港引水站`, cargo: '－',
          remaining: `約 ${24-h} 小時`, estCompletion: fmtIso(addHoursIso(24)), lastUpdate: fmtIso(addHoursIso(h)) }
      : { name: '航行中',       status: '無碼頭作業', pier: '－', cargo: '－',
          remaining: '－', estCompletion: '－', lastUpdate: fmtIso(addHoursIso(Math.max(0, h-2))) };

    return {
      hour: h,
      timestamp: addHoursIso(h),
      timeLabel: fmtIso(addHoursIso(h)),
      position: {
        lat: lerp(ship.startPos.lat, ship.endPos.lat, t),
        lng: lerp(ship.startPos.lng, ship.endPos.lng, t),
      },
      speed: h === 0 ? 0 : h < 2 ? 10 : (h >= 9 && h <= 14) ? 13 : 18,
      delayMinutes,
      eta: fmtIso(etaIso),
      expectedEta: fmtIso(addHoursIso(ship.expectedEtaH)),
      fuelStatus: {
        // Legacy fields (backward compat)
        tonnes:     totalTonnes,
        capacity:   totalCapacity,
        percentage: overallPct,
        type:       activeType,
        status:     overallStatus,
        lastUpdate: fmtIso(addHoursIso(h)),
        // Multi-fuel fields
        fuels:             fuelItems,
        totalTonnes,
        totalCapacity,
        overallPercentage: overallPct,
      },
      portOperation: portOp,
      risk,
      events: ship.events.filter(e => e.hour <= h),
    };
  });
}

/* ── Export ─────────────────────────────────────────── */

export const mockData = {
  ships: SHIPS,
  snapshots: Object.fromEntries(SHIPS.map(s => [s.id, generateSnapshots(s)])),
};
