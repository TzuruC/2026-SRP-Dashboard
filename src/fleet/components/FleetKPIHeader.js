const CII_COLOR = { A: '#3fb950', B: '#58a6ff', C: '#d29922', D: '#f85149', E: '#f85149' };

function fleetCIIAvg(ships) {
  const avg = Math.round(ships.reduce((s, sh) => s + sh.cii.score, 0) / ships.length);
  let rating = 'E';
  if (avg >= 80) rating = 'A';
  else if (avg >= 65) rating = 'B';
  else if (avg >= 50) rating = 'C';
  else if (avg >= 35) rating = 'D';
  return { rating, score: avg };
}

function weeklyTrend(ships) {
  const last = ships.reduce((s, sh) => {
    const w = sh.weeklyEfficiency;
    return s + (w[0] + w[1] + w[2]) / 3;
  }, 0) / ships.length;
  const curr = ships.reduce((s, sh) => {
    const w = sh.weeklyEfficiency;
    return s + (w[4] + w[5] + w[6]) / 3;
  }, 0) / ships.length;
  const diff = +(curr - last).toFixed(1);
  return diff;
}

export function renderFleetKPIHeader(container, ships) {
  const total     = ships.length;
  const sailing   = ships.filter(s => s.status === 'sailing').length;
  const inPort    = ships.filter(s => s.status === 'in_port').length;
  const anomaly   = ships.filter(s => s.status === 'anomaly').length;
  const totalCost = ships.reduce((s, sh) => s + sh.fuel.dailyCost, 0);
  const cii       = fleetCIIAvg(ships);
  const trend     = weeklyTrend(ships);
  const trendCls  = trend >= 0 ? 'success' : 'danger';
  const trendTxt  = trend >= 0 ? `↑ +${trend}%` : `↓ ${trend}%`;
  const costStr   = `$${totalCost.toLocaleString()}`;
  const ciiColor  = CII_COLOR[cii.rating] || '#8b949e';
  const now       = new Date().toUTCString().replace('GMT', 'UTC').slice(0, 25);

  container.innerHTML = `
    <div class="fk-inner">
      <div class="fk-brand">
        <span class="fk-brand-icon">⛵</span>
        <span class="fk-brand-text">船隊總覽</span>
        <span class="fk-live-dot"></span>
        <span class="fk-live-time">${now}</span>
      </div>

      <div class="fk-chips">
        <div class="fk-chip">
          <span class="fk-chip-val">${total}</span>
          <span class="fk-chip-lbl">總船數</span>
        </div>
        <div class="fk-chip">
          <span class="fk-chip-val" style="color:var(--fc-accent)">
            <span class="fk-status-dot sailing"></span>${sailing}
          </span>
          <span class="fk-chip-lbl">運行中</span>
        </div>
        <div class="fk-chip">
          <span class="fk-chip-val" style="color:var(--fc-muted)">
            <span class="fk-status-dot in_port"></span>${inPort}
          </span>
          <span class="fk-chip-lbl">靠港中</span>
        </div>
        <div class="fk-chip">
          <span class="fk-chip-val" style="color:var(--fc-danger)">
            <span class="fk-status-dot anomaly"></span>${anomaly}
          </span>
          <span class="fk-chip-lbl">異常中</span>
        </div>
        <div class="fk-chip fk-chip--sep">
          <span class="fk-chip-val">${costStr}</span>
          <span class="fk-chip-lbl">燃油成本 / 日</span>
        </div>
        <div class="fk-chip">
          <span class="fk-chip-val" style="color:${ciiColor}">
            ${cii.rating} <span style="font-size:11px;font-weight:400;color:var(--fc-muted)">(${cii.score})</span>
          </span>
          <span class="fk-chip-lbl">平均 CII</span>
        </div>
        <div class="fk-chip">
          <span class="fk-chip-val fk-trend ${trendCls}">${trendTxt}</span>
          <span class="fk-chip-lbl">本週效率</span>
        </div>
      </div>
    </div>
  `;
}
