const CII_COLOR  = { A: '#3fb950', B: '#58a6ff', C: '#d29922', D: '#f85149', E: '#f85149' };
const RISK_LABEL = (s) => s >= 75 ? { txt: '高', cls: 'danger' } : s >= 40 ? { txt: '中', cls: 'warning' } : { txt: '低', cls: 'success' };

function delayText(minutes) {
  if (minutes === 0)   return { txt: '準時',         cls: 'success' };
  if (minutes < 0)     return { txt: `提前 ${Math.abs(minutes)} 分`, cls: 'success' };
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return { txt: h > 0 ? `延誤 ${h}h${m > 0 ? m + 'm' : ''}` : `延誤 ${m}m`, cls: 'warning' };
}

function miniEffBar(pct) {
  const color = pct >= 80 ? '#3fb950' : pct >= 60 ? '#d29922' : '#f85149';
  return `
    <div style="display:flex;align-items:center;gap:6px">
      <div style="width:60px;height:5px;background:var(--fc-border);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px"></div>
      </div>
      <span style="font-size:11px;color:var(--fc-muted)">${pct}%</span>
    </div>`;
}

export function renderFleetStrategyPanel(container, ships) {
  // Sort by riskScore descending (worst first — operators focus on problems)
  const ranked = [...ships].sort((a, b) => b.riskScore - a.riskScore);

  const avgSpeed = (ships.reduce((s, sh) => s + sh.speed, 0) / ships.length).toFixed(1);
  const avgFuel  = Math.round(ships.reduce((s, sh) => s + sh.fuel.efficiency, 0) / ships.length);
  const avgCII   = Math.round(ships.reduce((s, sh) => s + sh.cii.score, 0) / ships.length);
  const delayed  = ships.filter(s => s.delayMinutes > 0).length;
  const anomalous = ships.filter(s => s.status === 'anomaly').length;

  const rows = ranked.map((sh, i) => {
    const delay  = delayText(sh.delayMinutes);
    const risk   = RISK_LABEL(sh.riskScore);
    const ciiClr = CII_COLOR[sh.cii.rating] || '#8b949e';
    return `
      <tr class="strategy-row">
        <td class="rank-cell">${i + 1}</td>
        <td>
          <div class="strategy-ship-name">${sh.name}</div>
          <div class="strategy-ship-sub">${sh.type} · ${sh.flag}</div>
        </td>
        <td><span style="font-weight:700;color:${ciiClr}">${sh.cii.rating}</span>
            <span class="strategy-score">${sh.cii.score}</span></td>
        <td>${miniEffBar(sh.fuel.efficiency)}</td>
        <td><span class="${delay.cls}" style="font-size:12px">${delay.txt}</span></td>
        <td>
          <span class="fk-risk-badge ${risk.cls}">${risk.txt}</span>
          <span class="strategy-score">${sh.riskScore}</span>
        </td>
      </tr>`;
  }).join('');

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

      <!-- Fleet Ranking Table -->
      <div class="strategy-section">
        <div class="strategy-section-title">船隊排名（依風險評分，高至低）</div>
        <div class="strategy-table-wrap">
          <table class="strategy-table">
            <thead>
              <tr>
                <th>#</th>
                <th>船名</th>
                <th>CII</th>
                <th>燃油效率</th>
                <th>延誤狀態</th>
                <th>風險評分</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
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
}
