function fmtUtc(iso) {
  return new Date(iso).toUTCString().slice(5, 22) + ' UTC';
}

function delayInfo(eta, expectedEta) {
  const min = Math.round((new Date(eta) - new Date(expectedEta)) / 60000);
  if (min > 0) return { text: `延誤 +${min} 分鐘`, cls: 'warning' };
  if (min < 0) return { text: `提前 ${Math.abs(min)} 分鐘`, cls: 'success' };
  return { text: '準時', cls: 'success' };
}

function flag(active, label) {
  return `<span class="flag-badge ${active ? 'flag-active' : 'flag-inactive'}">${label}</span>`;
}

export function renderShipDetail(container, ship) {
  if (!ship) {
    container.innerHTML = `
      <div class="panel-header">船隻詳細資訊</div>
      <div class="no-selection">
        <div class="no-selection-icon">⚓</div>
        <div>請選取一艘船隻以查看詳細資訊</div>
      </div>
    `;
    return;
  }

  const delay = delayInfo(ship.eta, ship.expectedEta);

  container.innerHTML = `
    <div class="panel-header">船隻資訊 — ${ship.name}</div>

    <div class="detail-section">
      <div class="detail-row">
        <span class="detail-label">船隻編號</span>
        <span class="detail-value">${ship.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">目前航速</span>
        <span class="detail-value">${ship.speed} 節</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">目前位置</span>
        <span class="detail-value">${ship.lat.toFixed(2)}°N &nbsp;${ship.lng.toFixed(2)}°E</span>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-row">
        <span class="detail-label">預計抵達時間</span>
        <span class="detail-value ${delay.cls === 'warning' ? 'warning' : ''}">${fmtUtc(ship.eta)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">預期抵達時間</span>
        <span class="detail-value">${fmtUtc(ship.expectedEta)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">延誤狀態</span>
        <span class="detail-value ${delay.cls}">${delay.text}</span>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-label" style="margin-bottom:6px">狀態標記</div>
      <div class="d-flex flex-wrap gap-1 mt-1">
        ${flag(ship.status.delay,          '延誤')}
        ${flag(ship.status.speedAnomaly,   '速度異常')}
        ${flag(ship.status.routeDeviation, '航線偏差')}
      </div>
    </div>
  `;
}
