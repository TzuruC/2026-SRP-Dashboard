export const mockData = {
  ships: [
    // ── delay: true ──────────────────────────────────
    {
      id: 'SHP001',
      name: 'Ever Fortune',
      lat: 25.12, lng: 122.34,
      speed: 18.5,
      eta: '2026-04-21T08:30:00Z',
      expectedEta: '2026-04-21T06:00:00Z',
      status: { delay: true, speedAnomaly: false, routeDeviation: false },
    },
    {
      id: 'SHP004',
      name: 'Meridian Bay',
      lat: 20.33, lng: 118.76,
      speed: 14.8,
      eta: '2026-04-21T20:00:00Z',
      expectedEta: '2026-04-21T16:30:00Z',
      status: { delay: true, speedAnomaly: false, routeDeviation: true },
    },

    // ── 提早抵達 ─────────────────────────────────────
    {
      id: 'SHP005',
      name: 'Coral Express',
      lat: 24.88, lng: 124.11,
      speed: 22.4,
      eta: '2026-04-21T06:00:00Z',
      expectedEta: '2026-04-21T07:30:00Z',
      status: { delay: false, speedAnomaly: false, routeDeviation: false },
    },

    // ── 其他異常 / 正常 ───────────────────────────────
    {
      id: 'SHP002',
      name: 'Pacific Pioneer',
      lat: 22.45, lng: 120.18,
      speed: 6.2,
      eta: '2026-04-21T14:00:00Z',
      expectedEta: '2026-04-21T14:00:00Z',
      status: { delay: false, speedAnomaly: true, routeDeviation: false },
    },
    {
      id: 'SHP003',
      name: 'Orient Star',
      lat: 28.67, lng: 125.89,
      speed: 21.3,
      eta: '2026-04-21T10:15:00Z',
      expectedEta: '2026-04-21T10:15:00Z',
      status: { delay: false, speedAnomaly: false, routeDeviation: false },
    },
    {
      id: 'SHP006',
      name: 'Northern Cross',
      lat: 30.22, lng: 123.45,
      speed: 9.1,
      eta: '2026-04-21T23:00:00Z',
      expectedEta: '2026-04-21T23:00:00Z',
      status: { delay: false, speedAnomaly: true, routeDeviation: false },
    },
    {
      id: 'SHP007',
      name: 'Azure Horizon',
      lat: 21.77, lng: 121.99,
      speed: 17.6,
      eta: '2026-04-21T12:30:00Z',
      expectedEta: '2026-04-21T12:30:00Z',
      status: { delay: false, speedAnomaly: false, routeDeviation: false },
    },
  ],
  events: [
    { id: 'EVT001', shipId: 'SHP001', type: 'delay',          severity: 'medium', timestamp: '2026-04-20T22:15:00Z' },
    { id: 'EVT002', shipId: 'SHP002', type: 'speedAnomaly',   severity: 'high',   timestamp: '2026-04-20T21:30:00Z' },
    { id: 'EVT003', shipId: 'SHP004', type: 'routeDeviation', severity: 'high',   timestamp: '2026-04-20T20:45:00Z' },
    { id: 'EVT004', shipId: 'SHP004', type: 'delay',          severity: 'medium', timestamp: '2026-04-20T19:30:00Z' },
    { id: 'EVT005', shipId: 'SHP005', type: 'info',           severity: 'low',    timestamp: '2026-04-20T18:00:00Z' },
    { id: 'EVT006', shipId: 'SHP006', type: 'speedAnomaly',   severity: 'high',   timestamp: '2026-04-20T17:00:00Z' },
  ],
};
