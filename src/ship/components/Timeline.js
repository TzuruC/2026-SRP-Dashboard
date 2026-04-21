const BASE_MS = new Date('2026-04-20T00:00:00+08:00').getTime();
const TOTAL   = 24;

function stepLabel(h) {
  const d   = new Date(BASE_MS + h * 3_600_000);
  const pad = n => String(n).padStart(2, '0');
  return `2026-04-${pad(d.getDate())} ${pad(d.getHours())}:00 UTC+8`;
}

function stepHH(h) {
  const d = new Date(BASE_MS + h * 3_600_000);
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function eventDotColor(ev) {
  if (ev.type === 'delay')         return '#d29922';
  if (ev.type === 'speedAnomaly')  return '#f85149';
  if (ev.type === 'weather')       return '#f85149';
  if (ev.severity === 'high')      return '#f85149';
  if (ev.severity === 'medium')    return '#d29922';
  return '#8b949e';
}

/* ── Module-level controller ────────────────────────── */

let _ctrl     = null;   // { container, slider, timeDisp, evLayer, winOvl, ticks, nowBtn, playBtn }
let _playing  = false;
let _timerId  = null;
let _onChange = null;
let _onNow    = null;

function _stopPlay() {
  _playing = false;
  clearInterval(_timerId);
  if (_ctrl) {
    _ctrl.playBtn.classList.remove('active');
    _ctrl.playBtn.innerHTML = '&#9654;';
  }
}

function _go(step) {
  const v = Math.min(Math.max(step, 0), TOTAL);
  if (_ctrl) {
    _ctrl.slider.value          = v;
    _ctrl.timeDisp.textContent  = stepLabel(v);
  }
  if (_onChange) _onChange(v);
}

/* ── Public API ─────────────────────────────────────── */

/**
 * @param {HTMLElement} container
 * @param {{
 *   currentStep : number,
 *   window      : { start: number, end: number },
 *   events      : Array,
 *   mode        : 'NOW'|'EVENT',
 *   onChange    : (step: number) => void,
 *   onNow       : () => void
 * }} props
 */
export function renderTimeline(container, props) {
  const {
    currentStep = 0,
    window: win  = { start: 0, end: 24 },
    events       = [],
    mode         = 'NOW',
    onChange,
    onNow,
  } = props;

  // Always keep callbacks up-to-date (new closure each render is fine)
  _onChange = onChange;
  _onNow    = onNow;

  if (!_ctrl || _ctrl.container !== container) {
    _buildDOM(container);
  }

  _update({ currentStep, win, events, mode });
}

/* ── DOM builder (runs once per container) ──────────── */

function _buildDOM(container) {
  _stopPlay();

  container.innerHTML = `
    <span class="tl-label">時間軸</span>
    <button class="tl-btn" id="tl-start" title="跳至開始">&#10073;&#10073;</button>
    <button class="tl-btn" id="tl-play"  title="播放 / 暫停">&#9654;</button>
    <button class="tl-btn" id="tl-end"   title="跳至結束">&#10073;&#10073;</button>
    <button class="tl-btn tl-now-btn" id="tl-now" style="display:none">&#8617; 回到現在</button>
    <div class="tl-track-wrap">
      <div class="tl-events-layer" id="tl-events-layer"></div>
      <div class="tl-win-overlay"  id="tl-win-overlay"></div>
      <input type="range" class="tl-slider" id="tl-slider"
             min="0" max="${TOTAL}" value="0" step="1" />
      <div class="tl-ticks" id="tl-ticks"></div>
    </div>
    <span class="tl-time" id="tl-time">${stepLabel(0)}</span>
  `;

  _ctrl = {
    container,
    slider:   container.querySelector('#tl-slider'),
    timeDisp: container.querySelector('#tl-time'),
    evLayer:  container.querySelector('#tl-events-layer'),
    winOvl:   container.querySelector('#tl-win-overlay'),
    ticks:    container.querySelector('#tl-ticks'),
    nowBtn:   container.querySelector('#tl-now'),
    playBtn:  container.querySelector('#tl-play'),
  };

  container.querySelector('#tl-start').addEventListener('click', () => {
    _stopPlay(); _go(0);
  });
  container.querySelector('#tl-end').addEventListener('click', () => {
    _stopPlay(); _go(TOTAL);
  });
  _ctrl.playBtn.addEventListener('click', () => {
    if (_playing) {
      _stopPlay();
    } else {
      if (parseInt(_ctrl.slider.value) >= TOTAL) _go(0);
      _playing = true;
      _ctrl.playBtn.classList.add('active');
      _ctrl.playBtn.innerHTML = '&#9646;&#9646;';
      _timerId = setInterval(() => {
        const cur = parseInt(_ctrl.slider.value);
        if (cur >= TOTAL) { _stopPlay(); return; }
        _go(cur + 1);
      }, 700);
    }
  });
  _ctrl.slider.addEventListener('input', () => {
    _stopPlay();
    _go(parseInt(_ctrl.slider.value));
  });
  _ctrl.nowBtn.addEventListener('click', () => {
    _stopPlay();
    if (_onNow) _onNow();
  });
}

/* ── Updater (runs every render) ────────────────────── */

function _update({ currentStep, win, events, mode }) {
  const { start, end } = win;

  // Slider position & timestamp (min/max stay 0–24 for full navigation)
  _ctrl.slider.value         = currentStep;
  _ctrl.timeDisp.textContent = stepLabel(currentStep);

  // "回到現在" button visible only in EVENT mode
  _ctrl.nowBtn.style.display = mode === 'EVENT' ? '' : 'none';

  // Window highlight overlay (shows active window on the full 0–24 rail)
  const winL = (start / TOTAL) * 100;
  const winW = ((end - start) / TOTAL) * 100;
  _ctrl.winOvl.style.left  = `${winL}%`;
  _ctrl.winOvl.style.width = `${winW}%`;

  // Event dots — only those within the window
  const inWindow = events.filter(ev => ev.hour >= start && ev.hour <= end);
  _ctrl.evLayer.innerHTML = inWindow.map(ev => {
    const pct    = (ev.hour / TOTAL) * 100;
    const color  = eventDotColor(ev);
    const isCur  = ev.hour === currentStep;
    const glow   = isCur ? `box-shadow:0 0 6px ${color};transform:scale(1.5);` : '';
    return `<div class="tl-ev-dot"
      style="left:calc(${pct}% - 5px);background:${color};${glow}"
      title="${ev.label}：${ev.description}"></div>`;
  }).join('');

  // Tick labels for window range only
  const range    = end - start || 1;
  const tickStep = range <= 8 ? 1 : range <= 16 ? 2 : 4;
  let ticksHtml  = '';
  for (let h = start; h <= end; h += tickStep) {
    const pct   = (h / TOTAL) * 100;
    const isCur = h === currentStep;
    ticksHtml += `<span class="tl-tick${isCur ? ' cur' : ''}" style="left:${pct}%">${stepHH(h)}</span>`;
  }
  _ctrl.ticks.innerHTML = ticksHtml;
}