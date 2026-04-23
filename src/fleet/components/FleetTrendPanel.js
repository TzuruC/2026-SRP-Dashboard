import { mockFleetData } from '../data/mockFleetData.js';

const SHIP_COLORS = ['#58a6ff', '#3fb950', '#f0883e'];

const PERIOD_TABS = [
  { key: 'daily',     label: '日' },
  { key: 'weekly',    label: '週' },
  { key: 'monthly',   label: '月' },
  { key: 'quarterly', label: '季' },
  { key: 'yearly',    label: '年' },
];

const Y_UNIT  = { fuel: 'MT', delay: '%' };
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
    const canvas = container.querySelector('#fleet-trend-chart');
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
      const wrap = container.querySelector('.trend-chart-wrap');
      if (wrap) wrap.innerHTML = '<div class="trend-empty">圖表庫載入中...</div>';
      return;
    }

    const pd = td[state.period];
    const { labels, datasets } = buildDatasets(ships, pd, state);
    const isStacked = state.metric === 'fuel' && state.fuelMode === 'breakdown' && state.mode === 'fleet';

    _chart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: buildChartOptions(state, isStacked),
    });
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
    : `<div class="trend-chart-wrap"><canvas id="fleet-trend-chart"></canvas></div>`;

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

/* ── Dataset builder ──────────────────────────────────────── */

function buildDatasets(ships, pd, state) {
  const labels   = pd.labels;
  const datasets = [];
  const n        = ships.length;

  if (state.mode === 'fleet') {
    if (state.metric === 'fuel') {
      if (state.fuelMode === 'total') {
        datasets.push(lineDs('船隊燃油消耗', pd.fleetFuelTotal, '#58a6ff', 'rgba(88,166,255,0.15)', true));
      } else {
        datasets.push(lineDs('主機燃油', pd.fleetFuelMain, '#58a6ff', 'rgba(88,166,255,0.45)', true));
        datasets.push(lineDs('輔機燃油', pd.fleetFuelAux,  '#f0883e', 'rgba(240,136,62,0.45)',  true));
      }
    } else {
      datasets.push(lineDs('延誤率', pd.fleetDelayRate, '#d29922', 'rgba(210,153,34,0.15)', true));
    }
  } else {
    state.compareShips.forEach((shipId, idx) => {
      const ship   = ships.find(s => s.id === shipId);
      if (!ship) return;
      const shipPd = pd.ships[shipId];
      if (!shipPd) return;
      const data   = state.metric === 'fuel' ? shipPd.fuel : shipPd.delay;
      datasets.push(lineDs(ship.name, data, SHIP_COLORS[idx], SHIP_COLORS[idx] + '28', false));
    });

    if (state.showAverage && state.compareShips.length > 0) {
      const avgData = state.metric === 'fuel'
        ? pd.fleetFuelTotal.map(v => +(v / n).toFixed(1))
        : pd.fleetDelayRate;
      datasets.push({
        label:           '船隊平均',
        data:            avgData,
        borderColor:     'rgba(200,210,220,0.55)',
        backgroundColor: 'transparent',
        borderWidth:     1.5,
        borderDash:      [6, 3],
        pointRadius:     0,
        tension:         0.3,
        fill:            false,
      });
    }
  }

  return { labels, datasets };
}

function lineDs(label, data, borderColor, backgroundColor, fill) {
  return { label, data, borderColor, backgroundColor, borderWidth: 2, pointRadius: 3, tension: 0.3, fill };
}

/* ── Chart options ────────────────────────────────────────── */

function buildChartOptions(state, isStacked) {
  const unit = Y_UNIT[state.metric];
  return {
    responsive:          true,
    maintainAspectRatio: false,
    interaction:         { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display:  true,
        position: 'bottom',
        labels: {
          color:    '#8b949e',
          boxWidth: 12,
          padding:  12,
          font:     { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#161b22',
        titleColor:      '#e6edf3',
        bodyColor:       '#8b949e',
        borderColor:     '#30363d',
        borderWidth:     1,
        padding:         10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color: 'rgba(48,54,61,0.6)' },
        ticks: { color: '#8b949e', font: { size: 11 } },
      },
      y: {
        stacked: isStacked,
        grid:    { color: 'rgba(48,54,61,0.6)' },
        title:   { display: true, text: Y_TITLE[state.metric], color: '#8b949e', font: { size: 11 } },
        ticks: {
          color: '#8b949e',
          font:  { size: 11 },
          callback: v => `${v}`,
        },
      },
    },
  };
}
