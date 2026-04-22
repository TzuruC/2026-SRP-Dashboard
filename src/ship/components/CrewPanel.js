const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

/* ── Service fill colour ─────────────────────────────── */
function serviceClass(days, max) {
  const pct = days / max;
  if (pct >= 0.95) return 'danger';
  if (pct >= 0.85) return 'warning';
  return 'ok';
}

/* ── Anomaly detection ───────────────────────────────── */
function detectAnomalies(ship) {
  const anomalies = { service: [], certs: [] };

  ship.crew.forEach(c => {
    const pct = c.serviceDays / c.maxDays;
    if (pct >= 0.85) {
      anomalies.service.push({
        name:        c.name,
        rank:        c.rank,
        serviceDays: c.serviceDays,
        maxDays:     c.maxDays,
        severity:    pct >= 0.95 ? 'danger' : 'warning',
      });
    }
  });

  ship.certificates.forEach(cert => {
    const expiry = new Date(cert.expiry);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((expiry - TODAY) / 86_400_000);
    if (daysLeft <= 30) {
      anomalies.certs.push({
        certName: cert.name,
        expiry:   cert.expiry,
        daysLeft,
        severity: daysLeft <= 0 ? 'danger' : 'warning',
        label:    daysLeft <= 0 ? '已過期' : `剩餘 ${daysLeft} 天`,
      });
    }
  });

  return anomalies;
}

/* ── Anomaly HTML block ──────────────────────────────── */
function buildAnomalyBlock(anomalies) {
  const hasIssues = anomalies.service.length > 0 || anomalies.certs.length > 0;

  if (!hasIssues) {
    return `
      <div class="crew-anomaly-block crew-anomaly-ok">
        <span class="crew-anomaly-icon">✓</span>
        所有船員狀態正常
      </div>`;
  }

  const serviceRows = anomalies.service.map(a => `
    <div class="crew-anomaly-item crew-anomaly-${a.severity}">
      <div class="crew-anomaly-row">
        <span class="crew-anomaly-badge crew-anomaly-badge-${a.severity}">${a.severity === 'danger' ? '危急' : '警告'}</span>
        <span class="crew-anomaly-name">${a.name}</span>
        <span class="crew-anomaly-rank">${a.rank}</span>
      </div>
      <div class="crew-anomaly-detail">服務天數 ${a.serviceDays} / ${a.maxDays} 天</div>
    </div>`).join('');

  const certRows = anomalies.certs.map(a => `
    <div class="crew-anomaly-item crew-anomaly-${a.severity}">
      <div class="crew-anomaly-row">
        <span class="crew-anomaly-badge crew-anomaly-badge-${a.severity}">${a.severity === 'danger' ? '已過期' : '即將到期'}</span>
        <span class="crew-anomaly-name">${a.certName}</span>
        <span class="crew-anomaly-rank">${a.label}</span>
      </div>
      <div class="crew-anomaly-detail">到期日：${a.expiry}</div>
    </div>`).join('');

  return `
    <div class="crew-anomaly-block">
      ${serviceRows}
      ${certRows}
    </div>`;
}

/* ── Main render ─────────────────────────────────────── */
export function renderCrewPanel(container, ship) {
  const anomalies    = detectAnomalies(ship);
  const anomalyBlock = buildAnomalyBlock(anomalies);

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
      </div>`;
  }).join('');

  const certItems = ship.certificates.map(cert => `
    <div class="cert-item">
      <span class="cert-name">${cert.name}</span>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
        <span class="cert-badge ${cert.status}">${cert.status}</span>
        <span style="font-size:12px;color:var(--text-muted)">${cert.expiry}</span>
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="panel-header">船員警報</div>
    ${anomalyBlock}
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
