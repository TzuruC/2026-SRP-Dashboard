function getRiskLevel(ship) {
  if (ship.status.speedAnomaly || ship.status.routeDeviation) return 'danger';
  if (ship.status.delay) return 'warning';
  return 'ok';
}

export function renderShipList(container, ships, selectedId, onSelect) {
  const items = ships.map(ship => {
    const risk     = getRiskLevel(ship);
    const selected = ship.id === selectedId ? 'selected' : '';
    const flags    = [];
    if (ship.status.delay)          flags.push('延誤');
    if (ship.status.speedAnomaly)   flags.push('速異');
    if (ship.status.routeDeviation) flags.push('偏航');

    return `
      <div class="ship-item ${selected}" data-id="${ship.id}">
        <span class="status-dot ${risk}"></span>
        <div>
          <div class="ship-name">${ship.name}</div>
          <div class="ship-meta">${ship.id}${flags.length ? ' · ' + flags.join(' ') : ''}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="panel-header">船隻清單（${ships.length}）</div>${items}`;

  container.querySelectorAll('.ship-item').forEach(el => {
    el.addEventListener('click', () => onSelect(el.dataset.id));
  });
}
