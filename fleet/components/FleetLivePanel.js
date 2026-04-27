const STATUS_META = {
  sailing: { label: "運行中", cls: "status-sailing" },
  in_port: { label: "靠港中", cls: "status-inport" },
  anomaly: { label: "異常", cls: "status-anomaly" },
};

const CII_COLOR = {
  A: "#3fb950",
  B: "#58a6ff",
  C: "#d29922",
  D: "#f85149",
  E: "#f85149",
};

function fmtEta(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function delayBadge(minutes) {
  if (minutes === 0) return `<span class="live-badge success">準時</span>`;
  if (minutes < 0) {
    return `<span class="live-badge success">提前 ${Math.abs(minutes)} 分</span>`;
  }
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  const txt = h > 0 ? `延誤 ${h}h${m > 0 ? m + "m" : ""}` : `延誤 ${m}m`;
  return `<span class="live-badge warning">${txt}</span>`;
}

function anomalyBadges(anomalies) {
  const badges = [];
  if (anomalies.speedAnomaly)
    badges.push(`<span class="live-badge danger">速度異常</span>`);
  if (anomalies.routeDeviation)
    badges.push(`<span class="live-badge danger">航線偏差</span>`);
  return badges.join("");
}

function fuelBar(pct) {
  const color = pct >= 80 ? "#3fb950" : pct >= 60 ? "#d29922" : "#f85149";
  return `
    <div class="live-mini-label">燃油效率</div>
    <div class="live-fuel-bar">
      <div class="live-fuel-fill" style="width:${pct}%;background:${color}"></div>
    </div>
    <span class="live-fuel-pct">${pct}%</span>`;
}

function shipCard(ship) {
  const status = STATUS_META[ship.status] || STATUS_META.sailing;
  const ciiColor = CII_COLOR[ship.cii.rating] || "#8b949e";
  const location =
    ship.status === "in_port"
      ? ship.currentPort
      : ship.destination
        ? `→ ${ship.destination}`
        : "—";

  return `
    <div class="col-12">
      <div class="live-card" data-ship-id="${ship.id}" data-ship-name="${ship.name}">
        <div class="live-card-header">
          <div>
            <div class="live-ship-name">${ship.name}</div>
            <div class="live-ship-sub">${ship.type} &nbsp;·&nbsp; ${ship.flag}</div>
          </div>
          <span class="live-status-badge ${status.cls}">${status.label}</span>
        </div>

        <div class="live-card-body">
          <div class="live-info-row">
            <span class="live-info-label">目前航速</span>
            <span class="live-info-val">${ship.speed > 0 ? ship.speed + " 節" : "— 靠港"}</span>
          </div>
          <div class="live-info-row">
            <span class="live-info-label">位置 / 目的地</span>
            <span class="live-info-val">${location}</span>
          </div>
          <div class="live-info-row">
            <span class="live-info-label">預計抵達</span>
            <span class="live-info-val">${fmtEta(ship.eta)}</span>
          </div>
        </div>

        <div class="live-card-kpis">
          <div class="live-kpi-cii">
            <span class="live-mini-label">CII</span>
            <span class="live-cii-rating" style="color:${ciiColor}">${ship.cii.rating}</span>
            <span class="live-cii-score">${ship.cii.score}</span>
          </div>
          <div class="live-kpi-fuel">
            ${fuelBar(ship.fuel.efficiency)}
          </div>
        </div>

        <div class="live-card-footer">
          <div class="live-badges">
            ${delayBadge(ship.delayMinutes)}
            ${anomalyBadges(ship.anomalies)}
          </div>
          <button class="live-drill-btn" data-ship-id="${ship.id}">查看詳情 →</button>
        </div>
      </div>
    </div>`;
}

export function renderFleetLivePanel(container, ships, onDrillDown, onMapFocus) {
  const sorted = [...ships].sort((a, b) => b.riskScore - a.riskScore);
  const cards = sorted.map(shipCard).join("");

  container.innerHTML = `
    <div class="live-wrap">
      <div class="live-search-wrap">
        <svg class="live-search-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5"/>
          <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input class="live-search-input" type="text" placeholder="搜尋船名…" autocomplete="off">
      </div>
      <div class="live-header-bar">
        <span class="live-count">${ships.length} 艘船隻</span>
        <span class="live-hint">點擊船卡可定位地圖</span>
      </div>
      <div class="row g-3 live-grid">${cards}</div>
    </div>
  `;

  const searchInput = container.querySelector('.live-search-input');
  const grid = container.querySelector('.live-grid');

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    grid.querySelectorAll('.col-12').forEach(col => {
      const card = col.querySelector('.live-card');
      const name = (card?.dataset.shipName ?? '').toLowerCase();
      col.style.display = name.includes(q) ? '' : 'none';
    });
  });

  container.querySelectorAll('.live-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.live-card').forEach(c => c.classList.remove('live-card--active'));
      card.classList.add('live-card--active');
      if (onMapFocus) onMapFocus(card.dataset.shipId);
    });
  });

  container.querySelectorAll('.live-drill-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (onDrillDown) onDrillDown(btn.dataset.shipId);
    });
  });
}
