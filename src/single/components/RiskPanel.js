const RISK_NAMES = {
  lateArrival:  '遲到機率',
  fuelShortage: '燃油不足風險',
  ecaEntry:     'ECA 進入風險',
  routeControl: '航線管制風險',
};

export function renderRiskPanel(container, risk) {
  const items = Object.entries(RISK_NAMES).map(([key, name]) => {
    const { level, pct } = risk[key];
    return `
      <div class="risk-item">
        <div class="risk-item-header">
          <span class="risk-name">${name}</span>
          <span class="risk-badge ${level}">${level}</span>
        </div>
        <div class="risk-bar-wrap">
          <div class="risk-bar">
            <div class="risk-fill ${level}" style="width:${pct}%"></div>
          </div>
          <span class="risk-pct">${pct}%</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="panel-header">風險評估</div>${items}`;
}
