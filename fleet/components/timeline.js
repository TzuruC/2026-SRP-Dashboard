const TOTAL_HOURS = 24;
const BASE_TIME   = new Date('2026-04-20T00:00:00Z');

function hourLabel(h) {
  const d = new Date(BASE_TIME.getTime() + h * 3600000);
  return d.toUTCString().slice(5, 22) + ' UTC';
}

export function renderTimeline(container, onTimeChange) {
  let playing  = false;
  let step     = 0;
  let timerId  = null;

  container.innerHTML = `
    <div class="timeline-inner">
      <span class="timeline-label">時間軸</span>
      <button class="tl-btn" id="tl-play">&#9654;</button>
      <button class="tl-btn" id="tl-reset">&#8635;</button>
      <input type="range" class="tl-slider" id="tl-slider" min="0" max="${TOTAL_HOURS}" value="0" step="1" />
      <span class="tl-time" id="tl-time">${hourLabel(0)}</span>
    </div>
  `;

  const playBtn  = container.querySelector('#tl-play');
  const resetBtn = container.querySelector('#tl-reset');
  const slider   = container.querySelector('#tl-slider');
  const timeDisp = container.querySelector('#tl-time');

  function setStep(val) {
    step = val;
    slider.value   = val;
    timeDisp.textContent = hourLabel(val);
    onTimeChange(val);
  }

  function stopPlay() {
    playing = false;
    clearInterval(timerId);
    playBtn.classList.remove('active');
    playBtn.innerHTML = '&#9654;';
  }

  function startPlay() {
    playing = true;
    playBtn.classList.add('active');
    playBtn.innerHTML = '&#9646;&#9646;';
    timerId = setInterval(() => {
      if (step >= TOTAL_HOURS) { stopPlay(); return; }
      setStep(step + 1);
    }, 800);
  }

  playBtn.addEventListener('click', () => playing ? stopPlay() : startPlay());

  resetBtn.addEventListener('click', () => {
    stopPlay();
    setStep(0);
  });

  slider.addEventListener('input', () => {
    stopPlay();
    setStep(parseInt(slider.value));
  });
}
