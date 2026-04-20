export function renderKpiBar(container, ships) {
  const total      = ships.length;
  const delayed    = ships.filter(s => s.status.delay).length;
  const anomalies  = ships.filter(s => s.status.speedAnomaly).length;
  const deviations = ships.filter(s => s.status.routeDeviation).length;
  const atRisk     = ships.filter(s => s.status.delay || s.status.speedAnomaly || s.status.routeDeviation).length;

  const now = new Date().toUTCString().replace('GMT', 'UTC').slice(0, 25);

  container.innerHTML = `
    <div class="d-flex align-items-center h-100">
      <div class="dashboard-title d-flex align-items-center h-100">
        船隊風險儀表板
      </div>
      <div class="d-flex align-items-center h-100 ps-2">
        <div class="kpi-item">
          <span class="kpi-value">${total}</span>
          <span class="kpi-label">船隻總數</span>
        </div>
        <div class="kpi-item">
          <span class="kpi-value warning">${delayed}</span>
          <span class="kpi-label">延誤中</span>
        </div>
        <div class="kpi-item">
          <span class="kpi-value danger">${anomalies}</span>
          <span class="kpi-label">速度異常</span>
        </div>
        <div class="kpi-item">
          <span class="kpi-value danger">${deviations}</span>
          <span class="kpi-label">航線偏差</span>
        </div>
        <div class="kpi-item" style="border-right:none">
          <span class="kpi-value accent">${atRisk}</span>
          <span class="kpi-label">風險船隻（24h）</span>
        </div>
      </div>
      <div class="ms-auto d-flex align-items-center pe-3">
        <div class="live-indicator">
          <span class="live-dot"></span>
          <span>即時</span>
          <span style="margin-left:8px">${now}</span>
        </div>
      </div>
    </div>
  `;
}
