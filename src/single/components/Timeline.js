const BASE_MS = new Date('2026-04-20T00:00:00+08:00').getTime();
const TOTAL   = 24;

function stepLabel(h) {
  const d = new Date(BASE_MS + h * 3_600_000);
  const pad = n => String(n).padStart(2, '0');
  return `2026-04-${pad(d.getDate())} ${pad(d.getHours())}:00 UTC+8`;
}

export function renderTimeline(container, onStep) {
  let playing = false;
  let step    = 0;
  let timerId = null;

  container.innerHTML = `
    <span class="tl-label">時間軸</span>
    <button class="tl-btn" id="tl-start" title="跳至開始">&#10073;&#10073;</button>
    <button class="tl-btn" id="tl-play"  title="播放 / 暫停">&#9654;</button>
    <button class="tl-btn" id="tl-end"   title="跳至結束">&#10073;&#10073;</button>
    <input  type="range" class="tl-slider" id="tl-slider" min="0" max="${TOTAL}" value="0" step="1" />
    <span class="tl-time" id="tl-time">${stepLabel(0)}</span>
  `;

  const startBtn = container.querySelector('#tl-start');
  const playBtn  = container.querySelector('#tl-play');
  const endBtn   = container.querySelector('#tl-end');
  const slider   = container.querySelector('#tl-slider');
  const timeDisp = container.querySelector('#tl-time');

  function setStep(val, fire = true) {
    step = Math.min(Math.max(val, 0), TOTAL);
    slider.value = step;
    timeDisp.textContent = stepLabel(step);
    if (fire) onStep(step);
  }

  function stopPlay() {
    playing = false;
    clearInterval(timerId);
    playBtn.classList.remove('active');
    playBtn.innerHTML = '&#9654;';
  }

  function startPlay() {
    if (step >= TOTAL) setStep(0);
    playing = true;
    playBtn.classList.add('active');
    playBtn.innerHTML = '&#9646;&#9646;';
    timerId = setInterval(() => {
      if (step >= TOTAL) { stopPlay(); return; }
      setStep(step + 1);
    }, 700);
  }

  startBtn.addEventListener('click', () => { stopPlay(); setStep(0); });
  endBtn.addEventListener('click',   () => { stopPlay(); setStep(TOTAL); });
  playBtn.addEventListener('click',  () => playing ? stopPlay() : startPlay());
  slider.addEventListener('input',   () => { stopPlay(); setStep(parseInt(slider.value)); });
}
