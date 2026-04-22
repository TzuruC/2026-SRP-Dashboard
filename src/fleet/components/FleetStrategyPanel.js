const CII_COLOR = { A: '#3fb950', B: '#58a6ff', C: '#d29922', D: '#f85149', E: '#f85149' };

const KPI_TYPES = [
  { key: 'composite', label: '綜合評分' },
  { key: 'fuel',      label: '燃油效率' },
  { key: 'delay',     label: '延誤率'   },
  { key: 'cii',       label: 'CII 評分' },
  { key: 'anomaly',   label: '異常頻率' },
];

const RISK_LABEL = s =>
  s >= 75 ? { txt: '高', cls: 'danger'  } :
  s >= 40 ? { txt: '中', cls: 'warning' } :
            { txt: '低', cls: 'success' };

function delayText(minutes) {
  if (minutes === 0) return { txt: '準時',                    cls: 'success' };
  if (minutes < 0)   return { txt: `提前 ${Math.abs(minutes)}m`, cls: 'success' };
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return { txt: h > 0 ? `延誤 ${h}h${m > 0 ? m + 'm' : ''}` : `延誤 ${m}m`, cls: 'warning' };
}

function getKPIValue(ship, kpi) {
  switch (kpi) {
    case 'fuel':    return ship.fuel.efficiency;
    case 'delay':   return ship.delayMinutes;
    case 'cii':     return ship.cii.score;
    case 'anomaly':
      return (ship.anomalies.speedAnomaly ? 1 : 0) +
             (ship.anomalies.routeDeviation ? 1 : 0) +
             (ship.anomalies.delay ? 1 : 0);
  }
}

function getPrevKPIValue(ship, kpi) {
  const p = ship.prevPeriod;
  switch (kpi) {
    case 'fuel':    return p.fuelEfficiency;
    case 'delay':   return p.delayMinutes;
    case 'cii':     return p.ciiScore;
    case 'anomaly': return p.anomalyCount;
  }
}

function isHigherBetter(kpi) {
  return kpi === 'fuel' || kpi === 'cii';
}

function formatKPIValue(kpi, value) {
  switch (kpi) {
    case 'fuel':    return `${value}%`;
    case 'cii':     return String(value);
    case 'anomaly': return `${value} 次`;
    case 'delay': {
      if (value < 0)   return `提前 ${Math.abs(value)}m`;
      if (value === 0) return '準時';
      const h = Math.floor(value / 60), m = value % 60;
      return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${value}m`;
    }
  }
}

function buildRanking(ships, kpi) {
  const higher = isHigherBetter(kpi);
  const cmp = (a, b, getter) => higher ? getter(b) - getter(a) : getter(a) - getter(b);

  const sorted     = [...ships].sort((a, b) => cmp(a, b, sh => getKPIValue(sh, kpi)));
  const sortedPrev = [...ships].sort((a, b) => cmp(a, b, sh => getPrevKPIValue(sh, kpi)));

  const prevRankMap = {};
  sortedPrev.forEach((sh, i) => { prevRankMap[sh.id] = i + 1; });

  return sorted.map((sh, i) => ({
    ship: sh,
    rank: i + 1,
    change: prevRankMap[sh.id] - (i + 1),
    value: getKPIValue(sh, kpi),
  }));
}

function rankChangeBadge(change) {
  if (change > 0) return `<span class="rank-up">↑${change}</span>`;
  if (change < 0) return `<span class="rank-down">↓${Math.abs(change)}</span>`;
  return `<span class="rank-same">—</span>`;
}

function rankNumClass(rank) {
  if (rank === 1) return ' gold';
  if (rank === 2) return ' silver';
  if (rank === 3) return ' bronze';
  return '';
}

function rankRow(item, kpi, isBest) {
  return `
    <div class="ranking-row">
      <span class="rank-num${rankNumClass(item.rank)}">${item.rank}</span>
      ${rankChangeBadge(item.change)}
      <div class="rank-ship">
        <div class="rank-ship-name">${item.ship.name}</div>
        <div class="rank-ship-sub">${item.ship.type}</div>
      </div>
      <span class="rank-value ${isBest ? 'best' : 'worst'}">${formatKPIValue(kpi, item.value)}</span>
    </div>`;
}

function miniEffBar(pct) {
  const color = pct >= 80 ? '#3fb950' : pct >= 60 ? '#d29922' : '#f85149';
  return `
    <div style="display:flex;align-items:center;gap:6px">
      <div style="width:60px;height:5px;background:var(--fc-border);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px"></div>
      </div>
      <span>${pct}%</span>
    </div>`;
}

function renderCompositeTable(ships) {
  const ranked = [...ships].sort((a, b) => b.riskScore - a.riskScore);
  const rows = ranked.map((sh, i) => {
    const delay  = delayText(sh.delayMinutes);
    const risk   = RISK_LABEL(sh.riskScore);
    const ciiClr = CII_COLOR[sh.cii.rating] || '#8b949e';
    return `<tr class="strategy-row">
      <td class="rank-cell">${i + 1}</td>
      <td>
        <div class="strategy-ship-name">${sh.name}</div>
        <div class="strategy-ship-sub">${sh.type} · ${sh.flag}</div>
      </td>
      <td><span style="font-weight:700;color:${ciiClr}">${sh.cii.rating}</span>
          <span class="strategy-score">${sh.cii.score}</span></td>
      <td>${miniEffBar(sh.fuel.efficiency)}</td>
      <td><span class="${delay.cls}">${delay.txt}</span></td>
      <td>
        <span class="fk-risk-badge ${risk.cls}">${risk.txt}</span>
        <span class="strategy-score">${sh.riskScore}</span>
      </td>
    </tr>`;
  }).join('');
  return `<div class="strategy-table-wrap">
    <table class="strategy-table">
      <thead><tr><th>#</th><th>船名</th><th>CII</th><th>燃油效率</th><th>延誤狀態</th><th>風險評分</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

export function renderFleetStrategyPanel(container, ships, rankingKPI, onRankingKPIChange) {
  const kpi        = rankingKPI || 'composite';
  const isComposite = kpi === 'composite';

  let ranking, n, topCount, topItems, bottomItems;
  if (!isComposite) {
    ranking     = buildRanking(ships, kpi);
    n           = ships.length;
    topCount    = Math.min(3, Math.floor(n / 2));
    topItems    = ranking.slice(0, topCount);
    bottomItems = ranking.slice(n - topCount);
  }

  const avgSpeed  = (ships.reduce((s, sh) => s + sh.speed, 0) / ships.length).toFixed(1);
  const avgFuel   = Math.round(ships.reduce((s, sh) => s + sh.fuel.efficiency, 0) / ships.length);
  const avgCII    = Math.round(ships.reduce((s, sh) => s + sh.cii.score, 0) / ships.length);
  const delayed   = ships.filter(s => s.delayMinutes > 0).length;
  const anomalous = ships.filter(s => s.status === 'anomaly').length;

  const segButtons = KPI_TYPES.map(t => `
    <button class="ranking-seg-btn${t.key === kpi ? ' active' : ''}" data-kpi="${t.key}">
      ${t.label}
    </button>`).join('');

  container.innerHTML = `
    <div class="strategy-wrap">

      <!-- Fleet Efficiency Summary -->
      <div class="strategy-summary-bar">
        <div class="summary-chip">
          <span class="summary-val">${avgSpeed}</span>
          <span class="summary-lbl">平均航速（節）</span>
        </div>
        <div class="summary-chip">
          <span class="summary-val">${avgFuel}%</span>
          <span class="summary-lbl">平均燃油效率</span>
        </div>
        <div class="summary-chip">
          <span class="summary-val">${avgCII}</span>
          <span class="summary-lbl">平均 CII 評分</span>
        </div>
        <div class="summary-chip">
          <span class="summary-val warning">${delayed}</span>
          <span class="summary-lbl">延誤船隻</span>
        </div>
        <div class="summary-chip">
          <span class="summary-val danger">${anomalous}</span>
          <span class="summary-lbl">異常船隻</span>
        </div>
      </div>

      <!-- Fleet Ranking Panel（來自 1a97a64）-->
      <div class="strategy-section">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="strategy-section-title mb-0">船隊排名</div>
          <span class="rank-period-hint">↑↓ 較上週</span>
        </div>

        <div class="ranking-seg">${segButtons}</div>

        ${isComposite
          ? renderCompositeTable(ships)
          : `<div class="row g-3">
              <div class="col-12 col-lg-6">
                <div class="strategy-section" style="border-color:rgba(63,185,80,.3)">
                  <div class="ranking-panel-head best">🏆 最佳 ${topCount} 艘</div>
                  ${topItems.map(item => rankRow(item, kpi, true)).join('')}
                </div>
              </div>
              <div class="col-12 col-lg-6">
                <div class="strategy-section" style="border-color:rgba(248,81,73,.3)">
                  <div class="ranking-panel-head worst">⚠️ 最差 ${topCount} 艘</div>
                  ${bottomItems.map(item => rankRow(item, kpi, false)).join('')}
                </div>
              </div>
            </div>`
        }
      </div>

      <!-- Trend Chart Placeholders -->
      <div class="strategy-section">
        <div class="strategy-section-title">趨勢分析（待整合圖表庫）</div>
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <div class="chart-placeholder">
              <div class="chart-ph-icon">📈</div>
              <div class="chart-ph-title">燃油效率趨勢</div>
              <div class="chart-ph-sub">7 日燃油效率變化折線圖</div>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="chart-placeholder">
              <div class="chart-ph-icon">🎯</div>
              <div class="chart-ph-title">CII 評級分佈</div>
              <div class="chart-ph-sub">船隊 CII 等級圓餅圖</div>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="chart-placeholder">
              <div class="chart-ph-icon">⏱</div>
              <div class="chart-ph-title">延誤時間分佈</div>
              <div class="chart-ph-sub">各船延誤分鐘數長條圖</div>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="chart-placeholder">
              <div class="chart-ph-icon">🗺</div>
              <div class="chart-ph-title">航路效率地圖</div>
              <div class="chart-ph-sub">偏航 / ECA 管制區疊加</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  container.querySelectorAll('.ranking-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (onRankingKPIChange) onRankingKPIChange(btn.dataset.kpi);
    });
  });
}
