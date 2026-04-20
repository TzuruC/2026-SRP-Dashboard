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

export function renderShipOverview(container, ship, snapshot) {
  const delay = delayDisplay(snapshot.delayMinutes);
  const fuelCls = fuelStatusCls(snapshot.fuelStatus.status);
  const fuelBarCls = snapshot.fuelStatus.percentage > 50 ? 'success'
                   : snapshot.fuelStatus.percentage > 30 ? 'warning' : 'danger';
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
        <div class="fuel-bar-wrap">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px;color:var(--text-muted)">當前油量</span>
            <span style="font-size:16px;font-weight:600">${snapshot.fuelStatus.tonnes} 公噸 / ${snapshot.fuelStatus.capacity} 公噸</span>
          </div>
          <div class="fuel-bar">
            <div class="fuel-fill ${fuelBarCls}" style="width:${snapshot.fuelStatus.percentage}%;background:var(--${fuelBarCls === 'success' ? 'success' : fuelBarCls === 'warning' ? 'warning' : 'danger'})"></div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);text-align:right;margin-top:2px">${snapshot.fuelStatus.percentage}%</div>
        </div>
        <div class="sub-row">
          <span class="sub-label">狀態</span>
          <span class="sub-value ${fuelCls}">${snapshot.fuelStatus.status}</span>
        </div>
        <div class="sub-row">
          <span class="sub-label">燃油類型</span>
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
