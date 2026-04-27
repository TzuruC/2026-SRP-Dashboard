/* Fleet Distribution Map — Leaflet-powered vessel & port layer */

// Module-level singletons (one map per page lifetime)
let _map          = null;
let _activeShipId = null;
let _routeLayers  = { historical: null, predicted: null };
const _shipMarkers = {};
const _portMarkers = {};
let _ships    = [];
let _portsMap = {};

// Static origin-port lookup (avoids modifying ship data objects)
const SHIP_ORIGINS = {
  SHP001: '釜山港',
  SHP002: '大阪港',
  SHP003: '台北港',
  SHP004: '基隆港',
  SHP005: '大阪港',
  SHP006: '大阪港',
  SHP007: '大阪港',
};

// Visual path scale: degrees per (knot × hour) — tuned for East-Asia regional zoom
const VIS_SCALE = 0.0014;

/* ── Public API ───────────────────────────────────────────── */

export function destroyMapPanel() {
  if (_map) { _map.remove(); _map = null; }
  _activeShipId = null;
  _routeLayers  = { historical: null, predicted: null };
  for (const k in _shipMarkers) delete _shipMarkers[k];
  for (const k in _portMarkers) delete _portMarkers[k];
}

export function focusShipOnMap(shipId) {
  if (!_map) return;
  const ship = _ships.find(s => s.id === shipId);
  if (!ship) return;
  onShipClick(ship, _portsMap);
}

export function renderFleetMapPanel(container, ships, ports) {
  container.innerHTML = buildPanelHTML();
  // Defer Leaflet init one frame so the container is measured before map tiles render
  requestAnimationFrame(() => initLeafletMap(container, ships, ports));
}

/* ── Panel HTML ───────────────────────────────────────────── */

function buildPanelHTML() {
  return `
    <div class="fm-wrap">
      <div class="fm-layer-bar">
        <span class="fm-layer-label">圖層</span>
        <label class="fm-layer-toggle active" data-layer="vessel">
          <input type="checkbox" checked> 船舶
        </label>
        <label class="fm-layer-toggle active" data-layer="port">
          <input type="checkbox" checked> 港口
        </label>
        <label class="fm-layer-toggle active" data-layer="anomaly">
          <input type="checkbox" checked> 異常圖示
        </label>
        <div class="fm-layer-sep"></div>
        <span class="fm-hint">點擊船舶查看詳情與路徑 · 再次點擊取消</span>
      </div>
      <div class="fm-map-container" id="fleet-map-leaflet"></div>
    </div>`;
}

/* ── Leaflet initialisation ───────────────────────────────── */

function initLeafletMap(container, ships, ports) {
  const mapEl = container.querySelector('#fleet-map-leaflet');
  if (!mapEl || typeof L === 'undefined') return;

  _ships   = ships;
  _portsMap = Object.fromEntries(ports.map(p => [p.name, p]));
  const portsMap = _portsMap;

  const avgLat = ships.reduce((s, sh) => s + sh.lat, 0) / ships.length;
  const avgLng = ships.reduce((s, sh) => s + sh.lng, 0) / ships.length;

  _map = L.map(mapEl, { center: [avgLat, avgLng], zoom: 5, zoomControl: true });

  // Dark CartoDB tile layer — free, no API key required
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 18,
  }).addTo(_map);

  addShipMarkers(ships, portsMap);
  addPortMarkers(ports);
  bindLayerToggles(container);
}

/* ── Marker registration ──────────────────────────────────── */

function addShipMarkers(ships, portsMap) {
  ships.forEach(ship => {
    const marker = L.marker([ship.lat, ship.lng], {
      icon: createShipIcon(ship),
      title: ship.name,
      zIndexOffset: 100,
    });

    marker.bindTooltip(ship.name, {
      permanent: false,
      direction: 'top',
      className: 'fm-tooltip',
      offset: [0, -20],
    });

    marker.on('click', () => onShipClick(ship, portsMap));
    marker.addTo(_map);
    _shipMarkers[ship.id] = marker;
  });
}

function addPortMarkers(ports) {
  ports.forEach(port => {
    const marker = L.marker([port.lat, port.lng], {
      icon: createPortIcon(port),
      title: port.name,
    });

    marker.bindTooltip(port.name, {
      permanent: false,
      direction: 'top',
      className: 'fm-tooltip',
      offset: [0, -14],
    });

    marker.on('click', () => onPortClick(port));
    marker.addTo(_map);
    _portMarkers[port.id] = marker;
  });
}

/* ── Interaction handlers ─────────────────────────────────── */

function onShipClick(ship, portsMap) {
  // Second click on the same ship → toggle off
  if (_activeShipId === ship.id) {
    clearRoutes();
    _activeShipId = null;
    _map.closePopup();
    return;
  }

  clearRoutes();
  _activeShipId = ship.id;

  _map.setView([ship.lat, ship.lng], 6, { animate: true, duration: 0.5 });

  const { historical, predicted } = computePaths(ship, portsMap);

  _routeLayers.historical = L.polyline(historical, {
    color: '#8b949e', weight: 2, opacity: 0.75,
  }).addTo(_map);

  _routeLayers.predicted = L.polyline(predicted, {
    color: '#58a6ff', weight: 2, opacity: 0.7, dashArray: '6 4',
  }).addTo(_map);

  L.popup({ className: 'fm-popup', maxWidth: 290, closeButton: true })
    .setLatLng([ship.lat, ship.lng])
    .setContent(buildShipCard(ship))
    .openOn(_map);
}

function onPortClick(port) {
  L.popup({ className: 'fm-popup', maxWidth: 260, closeButton: true })
    .setLatLng([port.lat, port.lng])
    .setContent(buildPortCard(port))
    .openOn(_map);
}

function clearRoutes() {
  if (_routeLayers.historical) { _routeLayers.historical.remove(); _routeLayers.historical = null; }
  if (_routeLayers.predicted)  { _routeLayers.predicted.remove();  _routeLayers.predicted  = null; }
}

/* ── Path computation ─────────────────────────────────────── */

function computePaths(ship, portsMap) {
  const dest = portsMap[ship.destination];
  const cur  = [ship.lat, ship.lng];
  if (!dest) return { historical: [cur], predicted: [cur] };

  const dLat = dest.lat - ship.lat;
  const dLng = dest.lng - ship.lng;
  const d    = Math.sqrt(dLat * dLat + dLng * dLng);
  if (d < 0.01) return { historical: [cur], predicted: [cur, [dest.lat, dest.lng]] };

  const uLat = dLat / d;
  const uLng = dLng / d;
  // Use 15 kn as proxy speed for docked ships so the trail is visible
  const spd  = ship.speed > 1 ? ship.speed : 15;

  // Historical trail — 5 points at 48 h, 36 h, 24 h, 12 h, 0 h ago
  const historical = [];
  for (let step = 4; step >= 0; step--) {
    const dist = spd * step * 12 * VIS_SCALE;
    historical.push([ship.lat - uLat * dist, ship.lng - uLng * dist]);
  }

  // Predicted route — current → destination (2 intermediate waypoints)
  const predicted = [cur];
  predicted.push([ship.lat + dLat / 3, ship.lng + dLng / 3]);
  predicted.push([ship.lat + dLat * 2 / 3, ship.lng + dLng * 2 / 3]);
  predicted.push([dest.lat, dest.lng]);

  return { historical, predicted };
}

/* ── Icon factories ───────────────────────────────────────── */

function createShipIcon(ship) {
  const isInPort  = ship.status === 'in_port';
  const isAnomaly = ship.status === 'anomaly' || ship.delayMinutes > 30;
  const cls       = isInPort ? 'in-port' : isAnomaly ? 'anomaly' : 'normal';

  const badges = [];
  if (!isInPort) {
    if (ship.delayMinutes > 60)        badges.push('<span class="fm-anom" title="確定誤點">⛔</span>');
    else if (ship.delayMinutes > 0)    badges.push('<span class="fm-anom" title="誤點風險">⚠️</span>');
    if (ship.anomalies.routeDeviation) badges.push('<span class="fm-anom" title="偏離航線">↗</span>');
    if (ship.anomalies.speedAnomaly)   badges.push('<span class="fm-anom" title="速度異常">⚡</span>');
  }

  const badgesHtml = badges.length
    ? `<div class="fm-vessel-badges">${badges.join('')}</div>` : '';
  const pulseHtml  = isAnomaly && !isInPort ? '<div class="fm-vessel-pulse"></div>' : '';
  const symbol     = isInPort ? '⚓' : '▲';

  const html = `<div class="fm-vessel-marker fm-vessel--${cls}">${symbol}${badgesHtml}${pulseHtml}</div>`;
  return L.divIcon({ html, className: '', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -22] });
}

function createPortIcon(port) {
  const symbol    = port.type === 'major' ? '◆' : '◇';
  const fuelBadge = port.isFuel ? '<span class="fm-port-fuel">⛽</span>' : '';
  const html      = `<div class="fm-port-marker fm-port--${port.type}">${symbol}${fuelBadge}</div>`;
  return L.divIcon({ html, className: '', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -14] });
}

/* ── Info card builders ───────────────────────────────────── */

function buildShipCard(ship) {
  const delay    = formatDelay(ship.delayMinutes);
  const eta      = fmtDT(ship.eta);
  const anomTags = buildAnomalyTags(ship);
  const origin   = SHIP_ORIGINS[ship.id] || '—';

  return `
    <div class="fm-ship-card">
      <div class="fm-card-head">
        <div class="fm-card-name">${ship.name}</div>
        <div class="fm-card-meta">${ship.type} &middot; ${ship.flag}</div>
      </div>
      <div class="fm-card-route">${origin} <span class="fm-route-arrow">→</span> ${ship.destination}</div>
      ${anomTags ? `<div class="fm-card-anomalies">${anomTags}</div>` : ''}
      <div class="fm-card-stats">
        <div class="fm-stat"><span class="fm-stat-lbl">航速</span><span class="fm-stat-val">${ship.speed} kn</span></div>
        <div class="fm-stat"><span class="fm-stat-lbl">油耗</span><span class="fm-stat-val">${ship.fuel.burnRate} MT/day</span></div>
        <div class="fm-stat"><span class="fm-stat-lbl">ETA</span><span class="fm-stat-val">${eta}</span></div>
        <div class="fm-stat"><span class="fm-stat-lbl">狀態</span><span class="fm-stat-val ${delay.cls}">${delay.txt}</span></div>
      </div>
      <a href="ship-dashboard.html?shipId=${ship.id}" class="fm-card-link">查看單船詳情 →</a>
    </div>`;
}

function buildPortCard(port) {
  const lastStr  = fmtDT(port.lastVisit);
  const typeStr  = port.type === 'major' ? '主要港口' : '一般港口';
  const fuelStr  = port.isFuel ? ' · ⛽ 加油港' : '';

  return `
    <div class="fm-port-card">
      <div class="fm-card-head">
        <div class="fm-card-name">${port.name}</div>
        <div class="fm-card-meta">${typeStr}${fuelStr}</div>
      </div>
      <div class="fm-card-stats fm-card-stats--col1">
        <div class="fm-stat"><span class="fm-stat-lbl">船隊靠泊次數</span><span class="fm-stat-val">${port.callCount} 次</span></div>
        <div class="fm-stat"><span class="fm-stat-lbl">最近停靠</span><span class="fm-stat-val">${lastStr}</span></div>
        <div class="fm-stat"><span class="fm-stat-lbl">目前在港</span><span class="fm-stat-val">${port.inPort} 艘</span></div>
        <div class="fm-stat"><span class="fm-stat-lbl">24h 預計到港</span><span class="fm-stat-val">${port.arriving24h} 艘</span></div>
      </div>
    </div>`;
}

/* ── Layer toggles ────────────────────────────────────────── */

function bindLayerToggles(container) {
  container.querySelectorAll('[data-layer] input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const toggle = cb.closest('[data-layer]');
      toggle?.classList.toggle('active', cb.checked);
      applyLayerVisibility(toggle?.dataset.layer, cb.checked);
    });
  });
}

function applyLayerVisibility(layer, visible) {
  if (!_map) return;
  if (layer === 'vessel') {
    Object.values(_shipMarkers).forEach(m => visible ? _map.addLayer(m) : _map.removeLayer(m));
  }
  if (layer === 'port') {
    Object.values(_portMarkers).forEach(m => visible ? _map.addLayer(m) : _map.removeLayer(m));
  }
  if (layer === 'anomaly') {
    document.querySelectorAll('.fm-vessel-badges, .fm-vessel-pulse').forEach(el => {
      el.style.display = visible ? '' : 'none';
    });
  }
}

/* ── Helpers ──────────────────────────────────────────────── */

function formatDelay(minutes) {
  if (minutes === 0) return { txt: '準時', cls: 'success' };
  if (minutes < 0)   return { txt: `提前 ${Math.abs(minutes)}m`, cls: 'success' };
  const h = Math.floor(minutes / 60), m = minutes % 60;
  const txt = h > 0 ? `延誤 ${h}h${m > 0 ? m + 'm' : ''}` : `延誤 ${m}m`;
  return { txt, cls: minutes > 60 ? 'danger' : 'warning' };
}

function fmtDT(isoStr) {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function buildAnomalyTags(ship) {
  const tags = [];
  if (ship.delayMinutes > 60)        tags.push('⛔ 確定誤點');
  else if (ship.delayMinutes > 0)    tags.push('⚠️ 誤點風險');
  if (ship.anomalies.routeDeviation) tags.push('↗ 偏離航線');
  if (ship.anomalies.speedAnomaly)   tags.push('⚡ 速度異常');
  return tags.map(t => `<span>${t}</span>`).join('');
}
