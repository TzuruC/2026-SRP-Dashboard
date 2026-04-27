import { mockFleetData } from '../data/mockFleetData.js';

const SHIP_COLORS = ['#58a6ff', '#3fb950', '#f0883e'];

const PERIOD_TABS = [
  { key: 'daily',     label: '日' },
  { key: 'weekly',    label: '週' },
  { key: 'monthly',   label: '月' },
  { key: 'quarterly', label: '季' },
  { key: 'yearly',    label: '年' },
];

const Y_UNIT  = { fuel: ' MT', delay: '%' };
const Y_TITLE = { fuel: '燃油消耗（MT）', delay: '延誤率（%）' };

let _chart = null;

export function destroyTrendChart() {
  if (_chart) { _chart.destroy(); _chart = null; }
}

export function renderFleetTrendPanel(container, ships) {
  const td = mockFleetData.trendData;

  const state = {
    metric:       'fuel',
    fuelMode:     'total',
    mode:         'fleet',
    period:       'weekly',
    compareShips: [],
    showAverage:  false,
  };

  function repaint() {
    container.innerHTML = buildHTML(ships, state);
    attachEvents();
    drawChart();
  }

  function attachEvents() {
    container.querySelectorAll('[data-period]').forEach(btn =>
      btn.addEventListener('click', () => { state.period = btn.dataset.period; repaint(); })
    );
    container.querySelectorAll('[data-metric]').forEach(btn =>
      btn.addEventListener('click', () => { state.metric = btn.dataset.metric; repaint(); })
    );
    container.querySelectorAll('[data-fuelmode]').forEach(btn =>
      btn.addEventListener('click', () => { state.fuelMode = btn.dataset.fuelmode; repaint(); })
    );
    container.querySelectorAll('[data-mode]').forEach(btn =>
      btn.addEventListener('click', () => {
        state.mode = btn.dataset.mode;
        if (state.mode === 'fleet') { state.compareShips = []; state.showAverage = false; }
        repaint();
      })
    );
    container.querySelectorAll('[data-compare-ship]').forEach(cb =>
      cb.addEventListener('change', () => {
        const sid = cb.dataset.compareShip;
        if (cb.checked) {
          if (state.compareShips.length < 3) state.compareShips.push(sid);
          else cb.checked = false;
        } else {
          state.compareShips = state.compareShips.filter(s => s !== sid);
        }
        drawChart();
      })
    );
    const avgCb = container.querySelector('#trend-show-avg');
    if (avgCb) avgCb.addEventListener('change', () => { state.showAverage = avgCb.checked; drawChart(); });
  }

  function drawChart() {
    destroyTrendChart();
    const chartDiv = container.querySelector('#fleet-trend-chart');
    if (!chartDiv) return;
    if (typeof Highcharts === 'undefined') {
      const wrap = container.querySelector('.trend-chart-wrap');
      if (wrap) wrap.innerHTML = '<div class="trend-empty">圖表庫載入中...</div>';
      return;
    }

    const pd        = td[state.period];
    const isStacked = state.metric === 'fuel' && state.fuelMode === 'breakdown' && state.mode === 'fleet';
    const series    = buildSeries(ships, pd, state);

    _chart = Highcharts.chart(chartDiv, buildHighchartsConfig(pd.labels, series, state, isStacked));
  }

  repaint();
}

/* ── HTML builder ─────────────────────────────────────────── */

function buildHTML(ships, state) {
  const periodTabs = PERIOD_TABS.map(p =>
    `<button class="trend-period-btn${state.period === p.key ? ' active' : ''}" data-period="${p.key}">${p.label}</button>`
  ).join('');

  const metricBtns = [
    { key: 'fuel',  label: '燃油消耗' },
    { key: 'delay', label: '延誤率'   },
  ].map(m =>
    `<button class="trend-seg-btn${state.metric === m.key ? ' active' : ''}" data-metric="${m.key}">${m.label}</button>`
  ).join('');

  const fuelModeBtns = state.metric === 'fuel'
    ? [{ key: 'total', label: '總量' }, { key: 'breakdown', label: '分項' }].map(fm =>
        `<button class="trend-seg-btn${state.fuelMode === fm.key ? ' active' : ''}" data-fuelmode="${fm.key}">${fm.label}</button>`
      ).join('')
    : '';

  const modeBtns = [
    { key: 'fleet',   label: '一般模式' },
    { key: 'compare', label: '比較模式' },
  ].map(m =>
    `<button class="trend-seg-btn${state.mode === m.key ? ' active' : ''}" data-mode="${m.key}">${m.label}</button>`
  ).join('');

  const comparePanel = state.mode === 'compare' ? buildComparePanelHTML(ships, state) : '';

  const chartArea = state.mode === 'compare' && state.compareShips.length === 0
    ? `<div class="trend-empty">請選擇最多 3 艘船進行比較</div>`
    : `<div class="trend-chart-wrap"><div id="fleet-trend-chart"></div></div>`;

  return `
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
      <div class="strategy-section-title mb-0">Trend Overview</div>
      <div class="trend-period-tabs">${periodTabs}</div>
    </div>

    <div class="trend-toolbar">
      <div class="trend-seg">${metricBtns}</div>
      ${fuelModeBtns ? `<div class="trend-seg">${fuelModeBtns}</div>` : ''}
      <div class="trend-seg ms-auto">${modeBtns}</div>
    </div>

    ${comparePanel}
    ${chartArea}
  `;
}

function buildComparePanelHTML(ships, state) {
  const shipChecks = ships.map(sh => {
    const idx     = state.compareShips.indexOf(sh.id);
    const checked = idx !== -1 ? 'checked' : '';
    const dot     = `<span class="trend-color-dot" style="background:${idx !== -1 ? SHIP_COLORS[idx] : 'var(--fc-border)'}"></span>`;
    return `<label class="trend-ship-check">
      <input type="checkbox" data-compare-ship="${sh.id}" ${checked}>
      ${dot}<span>${sh.name}</span>
    </label>`;
  }).join('');

  return `
    <div class="trend-compare-ships">
      <div class="trend-compare-label">選擇比較船隻（最多 3 艘）</div>
      <div class="trend-compare-row">
        ${shipChecks}
        <label class="trend-avg-toggle">
          <input type="checkbox" id="trend-show-avg" ${state.showAverage ? 'checked' : ''}>
          <span>船隊平均</span>
        </label>
      </div>
    </div>`;
}

/* ── Highcharts series builder ────────────────────────────── */

function hex2rgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function areaSeries(name, data, color, solidFill) {
  return {
    name,
    type:      'area',
    data,
    color,
    fillColor: solidFill
      ? hex2rgba(color, 0.45)
      : {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, hex2rgba(color, 0.35)],
            [1, hex2rgba(color, 0.02)],
          ],
        },
    lineWidth: 2,
    marker:    { radius: 3, symbol: 'circle' },
  };
}

function lineSeries(name, data, color) {
  return {
    name,
    type:      'line',
    data,
    color,
    lineWidth: 2,
    marker:    { radius: 3, symbol: 'circle' },
  };
}

function buildSeries(ships, pd, state) {
  const series = [];
  const n      = ships.length;

  if (state.mode === 'fleet') {
    if (state.metric === 'fuel') {
      if (state.fuelMode === 'total') {
        series.push(areaSeries('船隊燃油消耗', pd.fleetFuelTotal, '#58a6ff', false));
      } else {
        series.push(areaSeries('主機燃油', pd.fleetFuelMain, '#58a6ff', true));
        series.push(areaSeries('輔機燃油', pd.fleetFuelAux,  '#f0883e', true));
      }
    } else {
      series.push(areaSeries('延誤率', pd.fleetDelayRate, '#d29922', false));
    }
  } else {
    state.compareShips.forEach((shipId, idx) => {
      const ship   = ships.find(s => s.id === shipId);
      if (!ship) return;
      const shipPd = pd.ships[shipId];
      if (!shipPd) return;
      const data   = state.metric === 'fuel' ? shipPd.fuel : shipPd.delay;
      series.push(lineSeries(ship.name, data, SHIP_COLORS[idx]));
    });

    if (state.showAverage && state.compareShips.length > 0) {
      const avgData = state.metric === 'fuel'
        ? pd.fleetFuelTotal.map(v => +(v / n).toFixed(1))
        : pd.fleetDelayRate;
      series.push({
        name:       '船隊平均',
        type:       'line',
        data:       avgData,
        color:      'rgba(200,210,220,0.55)',
        dashStyle:  'Dash',
        lineWidth:  1.5,
        marker:     { enabled: false },
      });
    }
  }

  return series;
}

/* ── Highcharts config ────────────────────────────────────── */

function buildHighchartsConfig(labels, series, state, isStacked) {
  const unit = Y_UNIT[state.metric];
  return {
    chart: {
      backgroundColor: 'transparent',
      plotBorderWidth:  0,
      animation:        { duration: 300 },
      style:            { fontFamily: "'Segoe UI', system-ui, sans-serif" },
    },
    title:   { text: null },
    credits: { enabled: false },
    legend: {
      enabled:        true,
      align:          'center',
      verticalAlign:  'bottom',
      itemStyle:      { color: '#8b949e', fontSize: '12px', fontWeight: '500' },
      itemHoverStyle: { color: '#e6edf3' },
    },
    xAxis: {
      categories:    labels,
      gridLineColor: 'rgba(48,54,61,0.6)',
      lineColor:     '#30363d',
      tickColor:     '#30363d',
      labels:        { style: { color: '#8b949e', fontSize: '11px' } },
    },
    yAxis: {
      title:         { text: Y_TITLE[state.metric], style: { color: '#8b949e', fontSize: '11px' } },
      gridLineColor: 'rgba(48,54,61,0.6)',
      labels:        { style: { color: '#8b949e', fontSize: '11px' }, format: `{value}` },
    },
    tooltip: {
      backgroundColor: '#161b22',
      borderColor:     '#30363d',
      borderRadius:    6,
      style:           { color: '#e6edf3', fontSize: '12px' },
      shared:          true,
      valueSuffix:     unit,
    },
    plotOptions: {
      area: {
        stacking:  isStacked ? 'normal' : undefined,
        lineWidth: 2,
        states:    { hover: { lineWidth: 2 } },
        marker:    { radius: 3, symbol: 'circle', states: { hover: { radius: 5 } } },
      },
      line: {
        lineWidth: 2,
        states:    { hover: { lineWidth: 2 } },
        marker:    { radius: 3, symbol: 'circle', states: { hover: { radius: 5 } } },
      },
    },
    series,
  };
}
