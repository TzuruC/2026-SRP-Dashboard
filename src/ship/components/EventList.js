const BASE_MS = new Date('2026-04-20T00:00:00+08:00').getTime();

function hourToTime(h) {
  const d = new Date(BASE_MS + h * 3_600_000);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * @param {HTMLElement} container
 * @param {Array}       events
 * @param {Function}    [onEventClick]  - optional, called with the event object
 */
export function renderEventList(container, events, onEventClick) {
  if (!events.length) {
    container.innerHTML = `
      <div class="panel-header">決策事件列表（0）</div>
      <div class="no-events">目前尚無事件記錄</div>
    `;
    return;
  }

  const sorted = [...events].sort((a, b) => b.hour - a.hour);

  const items = sorted.map(ev => `
    <div class="event-item${onEventClick ? ' event-clickable' : ''}"
         data-hour="${ev.hour}" data-type="${ev.type}">
      <span class="event-type-badge ${ev.severity}">${ev.label}</span>
      <div>
        <div class="event-body-desc">${ev.description}</div>
        <div class="event-time">2026-04-20 ${hourToTime(ev.hour)} UTC+8</div>
      </div>
    </div>
  `).join('');

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
}