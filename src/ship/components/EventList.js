const BASE_MS = new Date('2026-04-20T00:00:00+08:00').getTime();

function hourToTime(h) {
  const d = new Date(BASE_MS + h * 3_600_000);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── Port event type colours ─────────────────────────── */
const PORT_TYPE_COLORS = {
  berthing:    '#58a6ff',
  cargoOps:    '#3fb950',
  crewChange:  '#d29922',
  bunkering:   '#ff7b72',
  inspection:  '#f85149',
  certRenewal: '#bc8cff',
};

/* ══════════════════════════════════════════════════════
   VOYAGE event list
   ══════════════════════════════════════════════════════ */

/**
 * @param {HTMLElement} container
 * @param {Array}       events         - voyage events (filtered to current snapshot)
 * @param {Function}    [onEventClick] - called with the event object
 * @param {string|null} [focusEventId] - "{type}_{hour}" of focused event (EVENT mode)
 */
export function renderEventList(container, events, onEventClick, focusEventId = null) {
  if (!events.length) {
    container.innerHTML = `
      <div class="panel-header">航程事件（0）</div>
      <div class="no-events">目前尚無航程事件記錄</div>
    `;
    return;
  }

  const sorted = [...events].sort((a, b) => b.hour - a.hour);

  const items = sorted.map(ev => {
    const evId = `${ev.type}_${ev.hour}`;
    const isFocused = focusEventId === evId;
    const focusStyle = isFocused
      ? 'border-left:3px solid var(--accent);background:rgba(88,166,255,.08);'
      : '';
    const focusAttr = isFocused ? ' data-focus="1"' : '';
    return `
      <div class="event-item${onEventClick ? ' event-clickable' : ''}"
           data-hour="${ev.hour}" data-type="${ev.type}"
           style="${focusStyle}"${focusAttr}>
        <span class="event-type-badge ${ev.severity}">${ev.label}</span>
        <div>
          <div class="event-body-desc">${ev.description}</div>
          <div class="event-time">2026-04-20 ${hourToTime(ev.hour)} UTC+8</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="panel-header">航程事件（${events.length}）</div>
    ${items}
  `;

  if (onEventClick) {
    container.querySelectorAll('.event-item').forEach(el => {
      el.addEventListener('click', () => {
        const hour = parseInt(el.dataset.hour);
        const type = el.dataset.type;
        const ev   = events.find(e => e.hour === hour && e.type === type);
        if (ev) onEventClick(ev);
      });
    });
  }

  container.querySelector('[data-focus]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ══════════════════════════════════════════════════════
   PORT event list
   ══════════════════════════════════════════════════════ */

/**
 * @param {HTMLElement} container
 * @param {Array}       events         - ship.portEvents (all port events)
 * @param {number}      portStep       - current port timeline step (0-72)
 * @param {number}      etaH           - expected ETA hour (absolute, for time display)
 * @param {Function}    [onEventClick] - called with the event object
 * @param {string|null} [focusId]      - "{type}_{hour}" of focused event
 */
export function renderPortEventList(container, events, portStep, etaH, onEventClick, focusId = null) {
  if (!events || !events.length) {
    container.innerHTML = `
      <div class="panel-header">港口作業（0）</div>
      <div class="no-events">無港口作業排程</div>
    `;
    return;
  }

  // Sort chronologically (upcoming first, then past)
  const sorted = [...events].sort((a, b) => a.hour - b.hour);
  const currentAbsH = etaH + portStep;

  const items = sorted.map(ev => {
    const offset    = ev.hour - etaH;
    const evId      = `${ev.type}_${ev.hour}`;
    const isFocused = focusId === evId;
    const isPast    = ev.hour < currentAbsH;
    const color     = PORT_TYPE_COLORS[ev.type] || '#8b949e';

    const focusStyle = isFocused
      ? `border-left:3px solid ${color};background:rgba(88,166,255,.08);`
      : '';
    const pastStyle  = isPast && !isFocused
      ? 'opacity:.45;'
      : '';
    const focusAttr  = isFocused ? ' data-focus="1"' : '';

    // Absolute time display
    const d   = new Date(BASE_MS + ev.hour * 3_600_000);
    const pad = n => String(n).padStart(2, '0');
    const timeStr = `ETA+${offset}h  (${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:00)`;

    const upcomingDot = !isPast
      ? `<span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0;margin-top:4px"></span>`
      : `<span style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0;margin-top:4px;opacity:.4"></span>`;

    return `
      <div class="event-item${onEventClick ? ' event-clickable' : ''}"
           data-hour="${ev.hour}" data-type="${ev.type}"
           style="${focusStyle}${pastStyle}"${focusAttr}>
        ${upcomingDot}
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <span class="event-type-badge ${ev.severity}">${ev.label}</span>
            ${isPast ? '<span style="font-size:10px;color:var(--text-muted)">已完成</span>' : ''}
          </div>
          <div class="event-body-desc">${ev.description}</div>
          <div class="event-time">${timeStr}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="panel-header">港口作業（${events.length}）</div>
    ${items}
  `;

  if (onEventClick) {
    container.querySelectorAll('.event-item').forEach(el => {
      el.addEventListener('click', () => {
        const hour = parseInt(el.dataset.hour);
        const type = el.dataset.type;
        const ev   = events.find(e => e.hour === hour && e.type === type);
        if (ev) onEventClick(ev);
      });
    });
  }

  container.querySelector('[data-focus]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
