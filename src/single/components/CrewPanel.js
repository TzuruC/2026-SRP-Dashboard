function serviceClass(days, max) {
  const pct = days / max;
  if (pct >= 0.95) return 'danger';
  if (pct >= 0.85) return 'warning';
  return 'ok';
}

export function renderCrewPanel(container, ship) {
  const serviceItems = ship.crew.map(c => {
    const cls = serviceClass(c.serviceDays, c.maxDays);
    const pct = Math.round(c.serviceDays / c.maxDays * 100);
    return `
      <div class="crew-item">
        <div>
          <div class="crew-name">${c.name}</div>
          <div class="crew-rank">${c.rank}</div>
        </div>
        <div class="service-bar-wrap">
          <div class="service-bar">
            <div class="service-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div class="service-days">${c.serviceDays} / ${c.maxDays} 天</div>
        </div>
      </div>
    `;
  }).join('');

  const certItems = ship.certificates.map(cert => `
    <div class="cert-item">
      <span class="cert-name">${cert.name}</span>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        <span class="cert-badge ${cert.status}">${cert.status}</span>
        <span style="font-size:12px;color:var(--text-muted)">${cert.expiry}</span>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="panel-header">船員警報</div>
    <div class="panel-header" style="font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;background:var(--bg-primary);position:relative;top:auto">
      服務時間警報
    </div>
    ${serviceItems}
    <div class="panel-header" style="font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;background:var(--bg-primary);position:relative;top:auto;margin-top:1px">
      船員證書警報
    </div>
    ${certItems}
  `;
}
