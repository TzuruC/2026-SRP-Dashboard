const TYPE_LABELS = {
  delay:          '延誤',
  speedAnomaly:   '速度異常',
  routeDeviation: '航線偏差',
};

const SEVERITY_LABELS = {
  high:   '高',
  medium: '中',
  low:    '低',
};

export function renderAlertPanel(container, events, ships, onShipSelect) {
  const shipMap = Object.fromEntries(ships.map(s => [s.id, s]));
  const sorted  = [...events].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const items = sorted.map(ev => {
    const shipName    = shipMap[ev.shipId]?.name ?? ev.shipId;
    const timeStr     = new Date(ev.timestamp).toUTCString().slice(5, 22);
    const severityTxt = SEVERITY_LABELS[ev.severity] ?? ev.severity;
    return `
      <div class="alert-item" data-id="${ev.shipId}">
        <span class="severity-badge severity-${ev.severity}">${severityTxt}</span>
        <div class="flex-grow-1">
          <div class="alert-ship">${shipName}</div>
          <div class="alert-type">${TYPE_LABELS[ev.type] ?? ev.type}</div>
          <div class="alert-time">${timeStr} UTC</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="panel-header">事件 / 警示（${events.length}）</div>${items}`;

  container.querySelectorAll('.alert-item').forEach(el => {
    el.addEventListener('click', () => onShipSelect(el.dataset.id));
  });
}
