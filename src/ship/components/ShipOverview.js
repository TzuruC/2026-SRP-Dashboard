function delayDisplay(minutes) {
  if (minutes === 0) return { text: "準時", cls: "success" };
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  const str = h > 0 ? `${h} 小時 ${m > 0 ? m + " 分" : ""}` : `${m} 分`;
  return minutes > 0
    ? { text: `延誤 +${str}`, cls: "warning" }
    : { text: `提前 ${str}`, cls: "success" };
}

function fuelStatusCls(status) {
  if (status === "警告") return "danger";
  if (status === "注意") return "warning";
  return "success";
}

const FUEL_COLORS = { HFO: "#6e7681", MGO: "#58a6ff", VLSFO: "#3fb950" };

function renderFuelRow(f, burnRate, warn) {
  const color = FUEL_COLORS[f.type] || "#8b949e";
  const pct = f.percentage;
  const burnHtml = burnRate != null
    ? `<span style="font-size:11px;color:var(--text-muted);margin-left:6px">耗：${burnRate} T/h</span>`
    : "";
  const warnHtml = warn
    ? `<div style="font-size:11px;color:var(--warning);margin-top:2px">⚠ ${warn}</div>`
    : "";
  return `
    <div style="padding:6px 0;border-bottom:1px solid var(--border-color)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:12px;color:${color};font-weight:600">
          ${f.name}<span style="color:var(--text-muted);font-weight:400"> (${f.type})</span>${burnHtml}
        </span>
        <span style="font-size:13px;font-weight:600">${f.tonnes} / ${f.capacity} T</span>
      </div>
      <div style="height:5px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width .3s"></div>
      </div>
      <div style="font-size:11px;color:var(--text-muted);text-align:right;margin-top:2px">${pct}%</div>
      ${warnHtml}
    </div>`;
}

export function renderShipOverview(container, ship, snapshot) {
  const delay    = delayDisplay(snapshot.delayMinutes);
  const fuelCls  = fuelStatusCls(snapshot.fuelStatus.status);
  const overallPct = snapshot.fuelStatus.overallPercentage ?? snapshot.fuelStatus.percentage;
  const po = snapshot.portOperation;

  // ── Endurance & burn rate computation ───────────────
  const totalBurnRate    = ship.fuels.reduce((s, f) => s + f.burnRate, 0);
  const enduranceHours   = Math.round(snapshot.fuelStatus.totalTonnes / totalBurnRate);
  const etaHoursFromNow  = Math.max(0, Math.round(
    ship.expectedEtaH + snapshot.delayMinutes / 60 - snapshot.hour
  ));
  const fuelInsufficient = enduranceHours < etaHoursFromNow;

  // Per-fuel burn rate map (base rates from ship definition)
  const fuelBurnMap = Object.fromEntries(ship.fuels.map(f => [f.type, f.burnRate]));

  // ── Per-fuel warnings ────────────────────────────────
  const fuelWarns = {};
  const vlsfo = (snapshot.fuelStatus.fuels || []).find(f => f.type === "VLSFO");
  if (vlsfo && vlsfo.percentage < 20) {
    fuelWarns["VLSFO"] = "存量偏低（< 20%），進入 ECA 前請確認補給";
  }

  // ── Upcoming ECA within next 6 hours ────────────────
  const upcomingECA = ship.events.find(
    e => e.type === "eca" && e.hour > snapshot.hour && e.hour <= snapshot.hour + 6
  );

  // ── Burn rate anomaly (mock: low-speed slow steaming) ─
  const burnAnomaly = snapshot.speed > 0 && snapshot.speed < 15;

  // ── Fuel rows HTML ───────────────────────────────────
  const fuelRowsHtml = (snapshot.fuelStatus.fuels || [])
    .map(f => renderFuelRow(f, fuelBurnMap[f.type], fuelWarns[f.type]))
    .join("");

  // ── Endurance section HTML ───────────────────────────
  const enduranceColor = fuelInsufficient ? "var(--danger)" : "var(--success)";
  const enduranceSectionHtml = `
    <div style="padding:8px 12px;border-top:1px solid var(--border-color)">
      <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">
        航程續航評估
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-size:12px;color:var(--text-muted)">可航行時間</span>
        <span style="font-size:13px;font-weight:600;color:${enduranceColor}">${enduranceHours} 小時</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
        <span style="font-size:12px;color:var(--text-muted)">預估到港時間</span>
        <span style="font-size:13px;font-weight:600">${etaHoursFromNow} 小時</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${burnAnomaly ? '3px' : '0'}">
        <span style="font-size:12px;color:var(--text-muted)">目前油耗</span>
        <span style="font-size:13px;font-weight:600">${totalBurnRate} 噸 / 小時</span>
      </div>
      ${burnAnomaly ? `
        <div style="font-size:12px;color:var(--warning);margin-bottom:3px">
          ⚠ 油耗高於正常值（低速操車狀態）
        </div>` : ""}
      ${fuelInsufficient ? `
        <div style="margin-top:5px;padding:6px 8px;background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:4px">
          <div style="font-size:12px;color:var(--danger);margin-bottom:2px">⚠ 油量不足以支撐航程</div>
          <div style="font-size:11px;color:var(--text-muted)">👉 建議：補給或降低航速</div>
        </div>` : ""}
      ${upcomingECA ? `
        <div style="margin-top:5px;padding:6px 8px;background:rgba(210,153,34,.1);border:1px solid rgba(210,153,34,.3);border-radius:4px">
          <div style="font-size:12px;color:var(--warning)">⚠ 預計 ${upcomingECA.hour - snapshot.hour} 小時後進入 ECA 管制區</div>
          <div style="font-size:11px;color:var(--text-muted)">請確認 VLSFO 庫存是否充足</div>
        </div>` : ""}
    </div>`;

  container.innerHTML = `
    <div class="overview-header">
      <span class="overview-ship-title">${ship.name}</span>
      <span class="overview-tag">${ship.imo}</span>
      <span class="overview-tag">${ship.type}</span>
      <span class="overview-tag">${ship.flag}</span>
    </div>

    <div class="overview-meta-bar py-3">
      <div class="overview-field">
        <span class="overview-field-label">預計延誤</span>
        <span class="overview-field-value ${delay.cls}">${delay.text}</span>
      </div>
      <div class="overview-field">
        <span class="overview-field-label">起迄港</span>
        <span class="overview-field-value">${ship.startPort} → ${ship.endPort}</span>
      </div>
      <div class="overview-field">
        <span class="overview-field-label">預計抵達（ETA）</span>
        <span class="overview-field-value ${delay.cls === "warning" ? "warning" : ""}">${snapshot.eta}</span>
      </div>
      <div class="overview-field">
        <span class="overview-field-label">原定抵達</span>
        <span class="overview-field-value">${snapshot.expectedEta}</span>
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
          ${fuelRowsHtml}
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
        ${enduranceSectionHtml}
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
          <span class="sub-value ${po.status === "進行中" ? "accent" : ""}" style="${po.status === "進行中" ? "color:var(--accent)" : ""}">${po.status}</span>
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
