function delayDisplay(minutes) {
  if (minutes === 0) return { text: '準時', cls: 'success' };
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const str = h > 0 ? `${h} 小時 ${m > 0 ? m + ' 分' : ''}` : `${m} 分`;
  return minutes > 0
    ? { text: `延誤 +${str}`, cls: 'warning' }
    : { text: `提前 ${str}`, cls: 'success' };
}

function fuelStatusCls(status) {
  if (status === '警告') return 'danger';
  if (status === '注意') return 'warning';
  return 'success';
}

const FUEL_COLORS = { HFO: '#6e7681', MGO: '#58a6ff', VLSFO: '#3fb950' };

function renderFuelRow(f) {
  const color = FUEL_COLORS[f.type] || '#8b949e';
  const pct   = f.percentage;
  return `
          <div style="padding:6px 0;border-bottom:1px solid var(--border-color)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:12px;color:${color};font-weight:600">${f.name}<span style="color:var(--text-muted);font-weight:400"> (${f.type})</span></span>
              <span style="font-size:13px;font-weight:600">${f.tonnes} / ${f.capacity} T</span>
            </div>
            <div style="height:5px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width .3s"></div>
            </div>
            <div style="font-size:11px;color:var(--text-muted);text-align:right;margin-top:2px">${pct}%</div>
          </div>`;
}

export function renderShipOverview(container, ship, snapshot) {
  const delay = delayDisplay(snapshot.delayMinutes);
  const fuelCls    = fuelStatusCls(snapshot.fuelStatus.status);
  const overallPct = snapshot.fuelStatus.overallPercentage ?? snapshot.fuelStatus.percentage;
  const po = snapshot.portOperation;

  container.innerHTML = `
    <div class="overview-header">
      <span class="overview-ship-title">${ship.name}</span>
      <span class="overview-tag">${ship.imo}</span>
      <span class="overview-tag">${ship.type}</span>
      <span class="overview-tag">${ship.flag}</span>
    </div>

    <div class="overview-meta-bar">
      <div class="overview-field">
        <span class="overview-field-label">起迄港</span>
        <span class="overview-field-value">${ship.startPort} → ${ship.endPort}</span>
      </div>
      <div class="overview-field">
        <span class="overview-field-label">預計抵達（ETA）</span>
        <span class="overview-field-value ${delay.cls === 'warning' ? 'warning' : ''}">${snapshot.eta}</span>
      </div>
      <div class="overview-field">
        <span class="overview-field-label">原定抵達</span>
        <span class="overview-field-value">${snapshot.expectedEta}</span>
      </div>
      <div class="overview-field">
        <span class="overview-field-label">預計延誤</span>
        <span class="overview-field-value ${delay.cls}">${delay.text}</span>
      </div>
      <div class="overview-field">
        <span class="overview-field-label">目前航速</span>
        <span class="overview-field-value">${snapshot.speed} 節</span>
      </div>
    </div>

    <div class="overview-panels">
      <div class="overview-sub-panel">
        <div class="panel-header">
          油量資訊
          <span class="update-time">最後更新：${snapshot.fuelStatus.lastUpdate}</span>
        </div>
        <div style="padding:0 12px">
          ${(snapshot.fuelStatus.fuels || []).map(renderFuelRow).join('')}
        </div>
        <div class="sub-row" style="margin-top:4px">
          <span class="sub-label">總油量</span>
          <span class="sub-value ${fuelCls}">${snapshot.fuelStatus.totalTonnes ?? snapshot.fuelStatus.tonnes} / ${snapshot.fuelStatus.totalCapacity ?? snapshot.fuelStatus.capacity} T &nbsp;(${overallPct}%)</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">整體狀態</span>
          <span class="sub-value ${fuelCls}">${snapshot.fuelStatus.status}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">當前模式</span>
          <span class="sub-value">${snapshot.fuelStatus.type}</span>
        </div>
      </div>

      <div class="overview-sub-panel">
        <div class="panel-header">
          碼頭作業
          <span class="update-time">最後更新：${po.lastUpdate}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">作業名稱</span>
          <span class="sub-value">${po.name}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">狀態</span>
          <span class="sub-value ${po.status === '進行中' ? 'accent' : ''}" style="${po.status === '進行中' ? 'color:var(--accent)' : ''}">${po.status}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">碼頭</span>
          <span class="sub-value">${po.pier}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">剩餘量</span>
          <span class="sub-value">${po.remaining}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">預計完工</span>
          <span class="sub-value">${po.estCompletion}</span>
        </div>
      </div>
    </div>
  `;
}
