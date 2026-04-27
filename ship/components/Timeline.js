const BASE_MS = new Date("2026-04-20T00:00:00+08:00").getTime();
const TOTAL = 24;

function stepLabel(h) {
  const d = new Date(BASE_MS + h * 3_600_000);
  const pad = (n) => String(n).padStart(2, "0");
  return `2026-04-${pad(d.getDate())} ${pad(d.getHours())}:00 UTC+8`;
}

function stepHH(h) {
  const d = new Date(BASE_MS + h * 3_600_000);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

function eventDotColor(ev) {
  if (ev.type === "delay") return "#d29922";
  if (ev.type === "speedAnomaly") return "#f85149";
  if (ev.type === "weather") return "#f85149";
  if (ev.severity === "high") return "#f85149";
  if (ev.severity === "medium") return "#d29922";
  return "#8b949e";
}

/* ── Module-level controller ───────────────────────── */

let _ctrl = null;
let _playing = false;
let _timerId = null;
let _onChange = null;
let _onNow = null;

function _stopPlay() {
  _playing = false;
  clearInterval(_timerId);
  if (_ctrl) {
    _ctrl.playBtn.classList.remove("active");
    _ctrl.playBtn.innerHTML = "&#9654;";
  }
}

function _go(step) {
  const v = Math.min(Math.max(step, 0), TOTAL);
  if (_ctrl) {
    _ctrl.slider.value = v;
    _ctrl.timeDisp.textContent = stepLabel(v);
  }
  if (_onChange) _onChange(v);
}

/* ── Public API ─────────────────────────────────────── */

/**
 * @param {HTMLElement} container
 * @param {{
 *   currentStep  : number,
 *   window       : { start: number, end: number },
 *   events       : Array,
 *   mode         : 'NOW'|'EVENT',
 *   focusEventId : string|null,
 *   onChange     : (step: number) => void,
 *   onNow        : () => void
 * }} props
 */
export function renderTimeline(container, props) {
  const {
    currentStep = 0,
    window: win = { start: 0, end: 24 },
    events = [],
    mode = "NOW",
    focusEventId = null,
    onChange,
    onNow,
  } = props;

  _onChange = onChange;
  _onNow = onNow;

  if (!_ctrl || _ctrl.container !== container) {
    _buildDOM(container);
  }

  _update({ currentStep, win, events, mode, focusEventId });
}

/* ── DOM builder (runs once per container) ──────────── */

function _buildDOM(container) {
  _stopPlay();

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0">
      <span class="tl-label">時間軸</span>
      <span id="tl-mode-badge" style="
        font-size:10px;font-weight:700;letter-spacing:.06em;
        padding:1px 7px;border-radius:10px;
        background:rgba(63,185,80,.15);color:#3fb950;
        border:1px solid rgba(63,185,80,.4);
        transition:background .25s,color .25s,border-color .25s;
      ">NOW</span>
    </div>

    <div class="tl-btn-group">
      <button class="tl-btn" id="tl-start" title="跳至開始">&#9664;&#9664;</button>
      <button class="tl-btn" id="tl-play"  title="播放 / 暫停">&#9654;</button>
      <button class="tl-btn" id="tl-end"   title="跳至結束">&#9654;&#9654;</button>
    </div>

    <div class="tl-track-wrap">
      <div class="tl-events-layer" id="tl-events-layer"></div>
      <div class="tl-win-overlay"  id="tl-win-overlay"></div>
      <div class="tl-anchor-line"  id="tl-anchor-line" style="display:none"></div>
      <input type="range" class="tl-slider" id="tl-slider"
             min="0" max="${TOTAL}" value="0" step="1" />
      <div class="tl-ticks" id="tl-ticks"></div>
    </div>

    <button class="tl-btn tl-now-btn" id="tl-now" style="display:none">
      &#8617; 回到現在
    </button>

    <span class="tl-time" id="tl-time">${stepLabel(0)}</span>
  `;

  _ctrl = {
    container,
    slider:     container.querySelector("#tl-slider"),
    timeDisp:   container.querySelector("#tl-time"),
    evLayer:    container.querySelector("#tl-events-layer"),
    winOvl:     container.querySelector("#tl-win-overlay"),
    anchorLine: container.querySelector("#tl-anchor-line"),
    ticks:      container.querySelector("#tl-ticks"),
    nowBtn:     container.querySelector("#tl-now"),
    playBtn:    container.querySelector("#tl-play"),
    modeBadge:  container.querySelector("#tl-mode-badge"),
  };

  container.querySelector("#tl-start").addEventListener("click", () => {
    _stopPlay();
    _go(0);
  });
  container.querySelector("#tl-end").addEventListener("click", () => {
    _stopPlay();
    _go(TOTAL);
  });
  _ctrl.playBtn.addEventListener("click", () => {
    if (_playing) {
      _stopPlay();
    } else {
      if (parseInt(_ctrl.slider.value) >= TOTAL) _go(0);
      _playing = true;
      _ctrl.playBtn.classList.add("active");
      _ctrl.playBtn.innerHTML = "&#9646;&#9646;";
      _timerId = setInterval(() => {
        const cur = parseInt(_ctrl.slider.value);
        if (cur >= TOTAL) { _stopPlay(); return; }
        _go(cur + 1);
      }, 700);
    }
  });
  _ctrl.slider.addEventListener("input", () => {
    _stopPlay();
    _go(parseInt(_ctrl.slider.value));
  });
  _ctrl.nowBtn.addEventListener("click", () => {
    _stopPlay();
    if (_onNow) _onNow();
  });
}

/* ── Updater (runs every render) ────────────────────── */

function _update({ currentStep, win, events, mode, focusEventId }) {
  const { start, end } = win;
  const isEvent = mode === "EVENT";

  _ctrl.slider.value = currentStep;
  _ctrl.timeDisp.textContent = stepLabel(currentStep);

  // ── Mode badge ─────────────────────────────────────
  if (isEvent) {
    Object.assign(_ctrl.modeBadge.style, {
      background:   "rgba(210,153,34,.15)",
      color:        "#d29922",
      borderColor:  "rgba(210,153,34,.45)",
    });
    _ctrl.modeBadge.textContent = "EVENT";
  } else {
    Object.assign(_ctrl.modeBadge.style, {
      background:   "rgba(63,185,80,.15)",
      color:        "#3fb950",
      borderColor:  "rgba(63,185,80,.4)",
    });
    _ctrl.modeBadge.textContent = "NOW";
  }

  // ── "回到現在" button ──────────────────────────────
  _ctrl.nowBtn.style.display = isEvent ? "" : "none";

  // ── Window highlight overlay ───────────────────────
  const winL = (start / TOTAL) * 100;
  const winW = ((end - start) / TOTAL) * 100;
  _ctrl.winOvl.style.left  = `${winL}%`;
  _ctrl.winOvl.style.width = `${winW}%`;
  if (isEvent) {
    // EVENT: amber tint — "locked" window
    _ctrl.winOvl.style.background   = "rgba(210,153,34,.10)";
    _ctrl.winOvl.style.borderColor  = "rgba(210,153,34,.35)";
  } else {
    // NOW: blue tint — "live" window
    _ctrl.winOvl.style.background   = "rgba(88,166,255,.07)";
    _ctrl.winOvl.style.borderColor  = "rgba(88,166,255,.2)";
  }

  // ── Anchor line (EVENT mode only, marks the focus step) ──
  if (isEvent && focusEventId) {
    const focusHour = parseInt(focusEventId.split("_").pop(), 10);
    const anchorPct = (focusHour / TOTAL) * 100;
    Object.assign(_ctrl.anchorLine.style, {
      display:     "block",
      left:        `${anchorPct}%`,
      borderColor: "rgba(210,153,34,.7)",
    });
  } else {
    _ctrl.anchorLine.style.display = "none";
  }

  // ── Event dots — within window only ───────────────
  const inWindow = events.filter((ev) => ev.hour >= start && ev.hour <= end);
  _ctrl.evLayer.innerHTML = inWindow
    .map((ev) => {
      const pct       = (ev.hour / TOTAL) * 100;
      const color     = eventDotColor(ev);
      const evId      = `${ev.type}_${ev.hour}`;
      const isFocused = focusEventId && evId === focusEventId;
      const focusStyle = isFocused
        ? `box-shadow:0 0 10px ${color};transform:scale(1.9);`
        : "";
      return `<div class="tl-ev-dot"
        style="left:calc(${pct}% - 5px);border-left:5px solid transparent;border-right:5px solid transparent;border-top:10px solid ${color};${focusStyle}"
        title="${ev.label}：${ev.description}"></div>`;
    })
    .join("");

  // ── Window-range ticks: every 2 h within [start, end] ─
  const tickStart = Math.ceil(start / 2) * 2;
  const windowTicks = [];
  for (let h = tickStart; h <= end; h += 2) windowTicks.push(h);
  if (!windowTicks.includes(currentStep)) windowTicks.push(currentStep);
  windowTicks.sort((a, b) => a - b);

  _ctrl.ticks.innerHTML = windowTicks.map((h) => {
    const pct = (h / TOTAL) * 100;
    let cls = "tl-tick";
    if (h === currentStep) cls += " cur";
    return `<span class="${cls}" style="left:${pct}%">${stepHH(h)}</span>`;
  }).join("");
}
