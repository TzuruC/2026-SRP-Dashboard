const TYPE_LABELS = {
  delay:          '延誤',
  speedAnomaly:   '速度異常',
  routeDeviation: '航線偏差',
  stall:          '低速停滯',
  info:           '資訊',
};

const SEV_META = {
  high:   { label: '高',   cls: 'sev-high'   },
  medium: { label: '中',   cls: 'sev-medium' },
  low:    { label: '低',   cls: 'sev-low'    },
};

function fmtTime(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function riskSection(title, icon, items) {
  if (!items.length) return '';
  return `
    <div class="risk-section">
      <div class="risk-section-title">${icon} ${title}（${items.length}）</div>
      ${items.join('')}
    </div>`;
}

function shipRiskRow(ship, tagHtml) {
  return `
    <div class="risk-ship-row">
      <div class="risk-ship-info">
        <span class="risk-ship-name">${ship.name}</span>
        <span class="risk-ship-sub">${ship.type} · ${ship.id}</span>
      </div>
      <div class="risk-ship-tags">${tagHtml}</div>
      <div class="risk-score-wrap">
        <span class="risk-score-label">風險</span>
        <span class="risk-score-val ${ship.riskScore >= 75 ? 'danger' : 'warning'}">${ship.riskScore}</span>
      </div>
    </div>`;
}

function eventRow(ev, shipName) {
  const sev = SEV_META[ev.severity] || SEV_META.low;
  return `
    <div class="risk-event-row">
      <span class="risk-sev-badge ${sev.cls}">${sev.label}</span>
      <div class="risk-event-body">
        <div class="risk-event-ship">${shipName}</div>
        <div class="risk-event-desc">${ev.description || TYPE_LABELS[ev.type] || ev.type}</div>
        <div class="risk-event-time">${fmtTime(ev.timestamp)}</div>
      </div>
    </div>`;
}

export function renderFleetRiskPanel(container, ships, events) {
  const shipMap = Object.fromEntries(ships.map(s => [s.id, s]));

  // 1. Speed anomaly ships
  const speedAnomalyShips = ships
    .filter(s => s.anomalies.speedAnomaly)
    .map(s => shipRiskRow(s, `<span class="risk-tag danger">速度異常</span><span class="risk-tag">${s.speed} 節</span>`));

  // 2. Route deviation ships
  const deviationShips = ships
    .filter(s => s.anomalies.routeDeviation)
    .map(s => shipRiskRow(s, `<span class="risk-tag danger">航線偏差</span>`));

  // 3. Delayed ships (sort by delay desc)
  const delayedShips = ships
    .filter(s => s.delayMinutes > 0)
    .sort((a, b) => b.delayMinutes - a.delayMinutes)
    .map(s => {
      const h = Math.floor(s.delayMinutes / 60), m = s.delayMinutes % 60;
      const txt = h > 0 ? `延誤 ${h}h ${m > 0 ? m + 'm' : ''}` : `延誤 ${m}m`;
      return shipRiskRow(s, `<span class="risk-tag warning">${txt}</span><span class="risk-tag">→ ${s.destination}</span>`);
    });

  // 4. Stall detection: speed < 8 AND status !== 'in_port'
  const stallShips = ships
    .filter(s => s.speed > 0 && s.speed < 8 && s.status !== 'in_port')
    .map(s => shipRiskRow(s, `<span class="risk-tag danger">低速停滯</span><span class="risk-tag">${s.speed} 節</span>`));

  // 5. High-risk events (high severity, sorted newest first)
  const highRiskEvents = [...events]
    .filter(ev => ev.severity === 'high')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(ev => eventRow(ev, shipMap[ev.shipId]?.name ?? ev.shipId));

  // 6. All events sorted newest first
  const allEventRows = [...events]
    .filter(ev => ev.type !== 'info')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(ev => eventRow(ev, shipMap[ev.shipId]?.name ?? ev.shipId));

  const noRisk = !speedAnomalyShips.length && !deviationShips.length
    && !delayedShips.length && !stallShips.length;

  container.innerHTML = `
    <div class="risk-wrap">
      ${noRisk ? `<div class="risk-all-ok"><span>✓</span> 目前船隊無重大風險</div>` : ''}
      ${riskSection('速度異常',   '⚡', speedAnomalyShips)}
      ${riskSection('航線偏差',   '🔀', deviationShips)}
      ${riskSection('延誤船隻',   '⏳', delayedShips)}
      ${riskSection('低速停滯',   '🚨', stallShips)}
      <div class="risk-section">
        <div class="risk-section-title">📋 近期事件記錄（${allEventRows.length}）</div>
        ${allEventRows.length ? allEventRows.join('') : '<div class="risk-empty">無事件記錄</div>'}
      </div>
    </div>
  `;
}
