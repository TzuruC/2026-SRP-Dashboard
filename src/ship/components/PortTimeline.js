const BASE_MS = new Date("2026-04-20T00:00:00+08:00").getTime();
const PORT_TOTAL = 72; // 72 hours post-ETA

const PORT_EVENT_COLORS = {
  berthing:    "#58a6ff",
  cargoOps:    "#3fb950",
  crewChange:  "#d29922",
  bunkering:   "#ff7b72",
  inspection:  "#f85149",
  certRenewal: "#bc8cff",
};

function portEventColor(ev) {
  return PORT_EVENT_COLORS[ev.type] || "#8b949e";
}

function portTimeLabel(step, etaH) {
  const d = new Date(BASE_MS + (etaH + step) * 3_600_000);
  const pad = (n) => String(n).padStart(2, "0");
  return `ETA+${step}h  (${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00)`;
}

/* ── Module-level controller (port domain) ──────────── */

let _ptCtrl = null;
let _ptPlaying = false;
let _ptTimerId = null;
let _ptOnChange = null;

function _ptStopPlay() {
  _ptPlaying = false;
  clearInterval(_ptTimerId);
  if (_ptCtrl) {
    _ptCtrl.playBtn.classList.remove("active");
    _ptCtrl.playBtn.innerHTML = "&#9654;";
  }
}

function _ptGo(step) {
  const v = Math.min(Math.max(step, 0), PORT_TOTAL);
  if (_ptCtrl) {
    _ptCtrl.slider.value = v;
    _ptCtrl.timeDisp.textContent = portTimeLabel(v, _ptCtrl.etaH);
  }
  if (_ptOnChange) _ptOnChange(v);
}

/* ── Public API ─────────────────────────────────────── */

/**
 * @param {HTMLElement} container
 * @param {{
 *   portStep  : number,                         // 0-72 hours after ETA
 *   window    : { start: number, end: number },  // within 0-72
 *   events    : Array,                           // ship.portEvents
 *   etaH      : number,                          // expected ETA hour (absolute)
 *   focusId   : string|null,
 *   onChange  : (portStep: number) => void
 * }} props
 */
export function renderPortTimeline(container, props) {
  const {
    portStep = 0,
    window: win = { start: 0, end: 24 },
    events = [],
    etaH = 0,
    focusId = null,
    onChange,
  } = props;

  _ptOnChange = onChange;

  if (!_ptCtrl || _ptCtrl.container !== container) {
    _ptBuildDOM(container, etaH);
  }

  _ptCtrl.etaH = etaH;
  _ptUpdate({ portStep, win, events, etaH, focusId });
}

/* ── DOM builder ────────────────────────────────────── */

function _ptBuildDOM(container, etaH) {
  _ptStopPlay();

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0">
      <span class="tl-label">港口時間軸</span>
      <span style="
        font-size:10px;font-weight:700;letter-spacing:.06em;
        padding:1px 7px;border-radius:10px;
        background:rgba(210,153,34,.15);color:#d29922;
        border:1px solid rgba(210,153,34,.4);
      ">PORT</span>
    </div>

    <div class="tl-btn-group">
      <button class="tl-btn" id="pt-start" title="跳至 ETA">&#9664;&#9664;</button>
      <button class="tl-btn" id="pt-play"  title="播放 / 暫停">&#9654;</button>
      <button class="tl-btn" id="pt-end"   title="跳至 ETA+72h">&#9654;&#9654;</button>
    </div>

    <div class="tl-track-wrap">
      <div class="tl-events-layer" id="pt-events-layer"></div>
      <div class="tl-win-overlay"  id="pt-win-overlay"></div>
      <div class="tl-anchor-line"  id="pt-anchor-line" style="display:none"></div>
      <input type="range" class="tl-slider" id="pt-slider"
             min="0" max="${PORT_TOTAL}" value="0" step="1" />
      <div class="tl-ticks" id="pt-ticks"></div>
    </div>

    <span class="tl-time" id="pt-time">${portTimeLabel(0, etaH)}</span>
  `;

  _ptCtrl = {
    container,
    etaH,
    slider:     container.querySelector("#pt-slider"),
    timeDisp:   container.querySelector("#pt-time"),
    evLayer:    container.querySelector("#pt-events-layer"),
    winOvl:     container.querySelector("#pt-win-overlay"),
    anchorLine: container.querySelector("#pt-anchor-line"),
    ticks:      container.querySelector("#pt-ticks"),
    playBtn:    container.querySelector("#pt-play"),
  };

  container.querySelector("#pt-start").addEventListener("click", () => {
    _ptStopPlay();
    _ptGo(0);
  });
  container.querySelector("#pt-end").addEventListener("click", () => {
    _ptStopPlay();
    _ptGo(PORT_TOTAL);
  });
  _ptCtrl.playBtn.addEventListener("click", () => {
    if (_ptPlaying) {
      _ptStopPlay();
    } else {
      if (parseInt(_ptCtrl.slider.value) >= PORT_TOTAL) _ptGo(0);
      _ptPlaying = true;
      _ptCtrl.playBtn.classList.add("active");
      _ptCtrl.playBtn.innerHTML = "&#9646;&#9646;";
      _ptTimerId = setInterval(() => {
        const cur = parseInt(_ptCtrl.slider.value);
        if (cur >= PORT_TOTAL) { _ptStopPlay(); return; }
        _ptGo(cur + 1);
      }, 500);
    }
  });
  _ptCtrl.slider.addEventListener("input", () => {
    _ptStopPlay();
    _ptGo(parseInt(_ptCtrl.slider.value));
  });
}

/* ── Updater ─────────────────────────────────────────── */

function _ptUpdate({ portStep, win, events, etaH, focusId }) {
  const { start, end } = win;

  _ptCtrl.slider.value = portStep;
  _ptCtrl.timeDisp.textContent = portTimeLabel(portStep, etaH);

  // Window overlay — always amber (port domain)
  const winL = (start / PORT_TOTAL) * 100;
  const winW = ((end - start) / PORT_TOTAL) * 100;
  _ptCtrl.winOvl.style.left       = `${winL}%`;
  _ptCtrl.winOvl.style.width      = `${winW}%`;
  _ptCtrl.winOvl.style.background  = "rgba(210,153,34,.08)";
  _ptCtrl.winOvl.style.borderColor = "rgba(210,153,34,.25)";

  // Anchor line for focused event
  if (focusId) {
    const focusHour   = parseInt(focusId.split("_").pop(), 10);
    const focusOffset = focusHour - etaH;
    if (focusOffset >= 0 && focusOffset <= PORT_TOTAL) {
      const anchorPct = (focusOffset / PORT_TOTAL) * 100;
      Object.assign(_ptCtrl.anchorLine.style, {
        display:     "block",
        left:        `${anchorPct}%`,
        borderColor: "rgba(210,153,34,.7)",
      });
    } else {
      _ptCtrl.anchorLine.style.display = "none";
    }
  } else {
    _ptCtrl.anchorLine.style.display = "none";
  }

  // Event dots — within window, positioned by offset from etaH
  const inWindow = events.filter((ev) => {
    const offset = ev.hour - etaH;
    return offset >= start && offset <= end;
  });
  _ptCtrl.evLayer.innerHTML = inWindow.map((ev) => {
    const offset    = ev.hour - etaH;
    const pct       = (offset / PORT_TOTAL) * 100;
    const color     = portEventColor(ev);
    const evId      = `${ev.type}_${ev.hour}`;
    const isPast    = offset < portStep;
    const isFocused = focusId && evId === focusId;
    const focusStyle = isFocused ? `box-shadow:0 0 10px ${color};transform:scale(1.9);` : "";
    const dimStyle   = isPast   ? "opacity:.35;" : "";
    return `<div class="tl-ev-dot"
      style="left:calc(${pct}% - 5px);border-left:5px solid transparent;border-right:5px solid transparent;border-top:10px solid ${color};${dimStyle}${focusStyle}"
      title="${ev.label}：${ev.description}"></div>`;
  }).join("");

  // Ticks: every 12h within window (port events are spread over 72h)
  const tickStart = Math.ceil(start / 12) * 12;
  const ticks = [];
  for (let h = tickStart; h <= end; h += 12) ticks.push(h);
  if (!ticks.includes(portStep)) ticks.push(portStep);
  ticks.sort((a, b) => a - b);

  _ptCtrl.ticks.innerHTML = ticks.map((h) => {
    const pct = (h / PORT_TOTAL) * 100;
    const cls = h === portStep ? "tl-tick cur" : "tl-tick";
    return `<span class="${cls}" style="left:${pct}%">+${h}h</span>`;
  }).join("");
}
