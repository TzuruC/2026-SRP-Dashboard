function overallRisk(snapshots) {
  const last = snapshots[snapshots.length - 1];
  const max = Math.max(...Object.values(last.risk).map(r => r.pct));
  if (max >= 65) return 'danger';
  if (max >= 35) return 'warning';
  return 'ok';
}

export function renderShipList(container, ships, allSnapshots, selectedId, onSelect) {
  const items = ships.map(ship => {
    const risk = overallRisk(allSnapshots[ship.id]);
    const sel  = ship.id === selectedId ? 'selected' : '';
    return `
      <div class="s-ship-item ${sel}" data-id="${ship.id}">
        <span class="s-dot ${risk}"></span>
        <div>
          <div class="s-ship-name">${ship.name}</div>
          <div class="s-ship-meta">${ship.imo} · ${ship.type}</div>
          <div class="s-ship-meta">${ship.startPort} → ${ship.endPort}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="panel-header">船舶列表（${ships.length}）</div>${items}`;

  container.querySelectorAll('.s-ship-item').forEach(el => {
    el.addEventListener('click', () => onSelect(el.dataset.id));
  });
}
