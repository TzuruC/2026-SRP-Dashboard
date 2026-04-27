function buildTooltip(ship, snapshot) {
  const fuelLines = snapshot.fuelStatus && snapshot.fuelStatus.fuels
    ? snapshot.fuelStatus.fuels.map(f =>
        `<div style="font-size:12px">${f.name}：<strong>${f.tonnes} T</strong> <span style="color:var(--text-muted)">(${f.percentage}%)</span></div>`
      ).join('')
    : `<div style="font-size:12px">油量：<strong>${snapshot.fuelStatus.tonnes} T</strong></div>`;

  return `<div style="min-width:160px">
    <div style="font-weight:700;font-size:14px;margin-bottom:4px">${ship.name}</div>
    <div style="font-size:12px">速度：<strong>${snapshot.speed} 節</strong></div>
    <div style="font-size:12px">ETA：<strong>${snapshot.eta}</strong></div>
    <div style="border-top:1px solid rgba(255,255,255,.15);margin:5px 0 3px;padding-top:3px;font-size:11px;color:#aaa">油量</div>
    ${fuelLines}
  </div>`;
}

function shipIcon(selected) {
  const size = selected ? 14 : 10;
  const color = "#58a6ff";
  const glow = selected ? 10 : 5;
  const bdr = selected ? "2px solid #fff" : "2px solid rgba(255,255,255,0.3)";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${bdr};
      box-shadow:0 0 ${glow}px ${color};cursor:pointer;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function destIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:10px;height:10px;border-radius:50%;
      background:#3fb950;border:2px solid rgba(255,255,255,0.4);
      box-shadow:0 0 6px #3fb950;
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

export function initMapPanel(container) {
  const mapDiv = document.createElement("div");
  mapDiv.id = "ship-map";
  Object.assign(mapDiv.style, { width: "100%", height: "100%" });
  container.appendChild(mapDiv);

  const map = L.map("ship-map", {
    center: [25, 121],
    zoom: 6,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  let shipMarker = null;
  let destMarker = null;
  let pastTrack = null;
  let futureTrack = null;
  let currentShipId = null;

  return {
    update(ship, snapshot, step, allSnapshots) {
      const shipChanged = ship.id !== currentShipId;
      currentShipId = ship.id;

      // Destination marker
      if (shipChanged) {
        if (destMarker) destMarker.remove();
        destMarker = L.marker([ship.endPos.lat, ship.endPos.lng], {
          icon: destIcon(),
        })
          .bindTooltip(`<strong>${ship.endPort}</strong>（目的地）`, {
            direction: "top",
            offset: [0, -8],
            opacity: 1,
          })
          .addTo(map);
      }

      // Ship marker
      const pos = snapshot.position;
      if (!shipMarker) {
        shipMarker = L.marker([pos.lat, pos.lng], { icon: shipIcon(true) })
          .bindTooltip(buildTooltip(ship, snapshot), { direction: "top", offset: [0, -8], opacity: 1 })
          .addTo(map);
      } else {
        shipMarker.setLatLng([pos.lat, pos.lng]);
        shipMarker.setTooltipContent(buildTooltip(ship, snapshot));
      }

      // Past track (solid blue)
      const past = allSnapshots
        .slice(0, step + 1)
        .map((s) => [s.position.lat, s.position.lng]);
      if (pastTrack) pastTrack.remove();
      pastTrack = L.polyline(past, {
        color: "#58a6ff",
        weight: 2,
        opacity: 0.8,
      }).addTo(map);

      // Future track (dashed gray)
      const future = allSnapshots
        .slice(step)
        .map((s) => [s.position.lat, s.position.lng]);
      if (futureTrack) futureTrack.remove();
      futureTrack = L.polyline(future, {
        color: "#8b949e",
        weight: 1.5,
        opacity: 0.4,
        dashArray: "5 6",
      }).addTo(map);

      // Center map on ship when ship changes
      if (shipChanged) {
        map.fitBounds(
          [
            [ship.startPos.lat, ship.startPos.lng],
            [ship.endPos.lat, ship.endPos.lng],
          ],
          { padding: [30, 30] },
        );
      } else {
        map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.3 });
      }
    },
  };
}
