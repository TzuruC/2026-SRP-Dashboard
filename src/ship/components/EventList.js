const BASE_MS = new Date('2026-04-20T00:00:00+08:00').getTime();

function hourToTime(h) {
  const d = new Date(BASE_MS + h * 3_600_000);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * @param {HTMLElement} container
 * @param {Array}       events
 * @param {Function}    [onEventClick]   - called with the event object
 * @param {string|null} [focusEventId]   - "{type}_{hour}" of the focused event (EVENT mode)
 */
export function renderEventList(container, events, onEventClick, focusEventId = null) {
  if (!events.length) {
    container.innerHTML = `
      <div class="panel-header">決策事件列表（0）</div>
      <div class="no-events">目前尚無事件記錄</div>
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
    <div class="panel-header">決策事件列表（${events.length}）</div>
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

  // Scroll focused event into view
  const focused = container.querySelector('[data-focus]');
  if (focused) focused.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
