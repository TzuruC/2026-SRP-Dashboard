function markerColor(ship) {
  if (ship.status.speedAnomaly || ship.status.routeDeviation) return '#f85149';
  if (ship.status.delay) return '#d29922';
  return '#3fb950';
}

function buildIcon(ship, selected) {
  const color = markerColor(ship);
  const size  = selected ? 16 : 11;
  const glow  = selected ? 12 : 6;
  const bdr   = selected ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.25)';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${bdr};
      box-shadow:0 0 ${glow}px ${color};
      cursor:pointer;transition:transform .15s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function tooltipHtml(ship) {
  const eta    = new Date(ship.eta);
  const expEta = new Date(ship.expectedEta);
  const delay  = Math.round((eta - expEta) / 60000);
  const flags  = [];
  if (ship.status.delay)          flags.push(`<span style="color:#d29922">⚠ 延誤</span>`);
  if (ship.status.speedAnomaly)   flags.push(`<span style="color:#f85149">⚡ 速度異常</span>`);
  if (ship.status.routeDeviation) flags.push(`<span style="color:#f85149">↗ 航線偏差</span>`);

  return `
    <div style="min-width:160px">
      <div style="font-weight:700;font-size:13px;margin-bottom:4px">${ship.name}</div>
      <div style="color:#8b949e;font-size:12px;margin-bottom:4px">${ship.id}</div>
      <div style="font-size:12px;margin-bottom:2px">速度：<strong>${ship.speed} 節</strong></div>
      <div style="font-size:12px">預計抵達：<strong>${eta.toUTCString().slice(5, 22)} UTC</strong></div>
      ${delay > 0 ? `<div style="font-size:12px;color:#d29922;margin-top:2px">延誤：+${delay} 分鐘</div>` : ''}
      ${flags.length ? `<div style="margin-top:6px;font-size:12px;line-height:1.6">${flags.join('<br>')}</div>` : ''}
    </div>
  `;
}

export function initMap(container, ships, onShipSelect) {
  const mapDiv = document.createElement('div');
  mapDiv.id = 'map';
  Object.assign(mapDiv.style, { width: '100%', height: '100%', position: 'absolute', inset: '0' });
  container.style.position = 'relative';
  container.appendChild(mapDiv);

  const map = L.map('map', {
    center: [24.5, 123.0],
    zoom: 6,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  const markers = {};
  let selectedId = null;

  ships.forEach(ship => {
    const marker = L.marker([ship.lat, ship.lng], { icon: buildIcon(ship, false) }).addTo(map);

    marker.bindTooltip(tooltipHtml(ship), {
      direction: 'top',
      offset: [0, -8],
      opacity: 1,
    });

    marker.on('click', () => onShipSelect(ship.id));
    markers[ship.id] = { marker, ship };
  });

  return {
    selectShip(shipId) {
      if (selectedId && markers[selectedId]) {
        markers[selectedId].marker.setIcon(buildIcon(markers[selectedId].ship, false));
      }
      selectedId = shipId;
      if (shipId && markers[shipId]) {
        markers[shipId].marker.setIcon(buildIcon(markers[shipId].ship, true));
        map.panTo([markers[shipId].ship.lat, markers[shipId].ship.lng], { animate: true, duration: 0.4 });
      }
    },
  };
}
