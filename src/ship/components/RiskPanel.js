const RISK_NAMES = {
  lateArrival:  '遲到機率',
  fuelShortage: '燃油不足風險',
  ecaEntry:     'ECA 進入風險',
  routeControl: '航線管制風險',
};

const FUEL_COLORS = { HFO: '#6e7681', MGO: '#58a6ff', VLSFO: '#3fb950' };

/** 從 fuelStatus 衍生多油種風險項目 */
function deriveFuelRisks(fuelStatus) {
  if (!fuelStatus || !fuelStatus.fuels) return [];
  const risks = [];
  const vlsfo = fuelStatus.fuels.find(f => f.type === 'VLSFO');
  const hfo   = fuelStatus.fuels.find(f => f.type === 'HFO');
  const inECA = fuelStatus.type && fuelStatus.type.includes('ECA');

  // VLSFO 不足：進 ECA 或即將進 ECA 時風險高
  if (vlsfo && vlsfo.percentage < 30) {
    const pct     = Math.min(100, Math.round((30 - vlsfo.percentage) / 30 * 100));
    const level   = vlsfo.percentage < 15 ? '高' : '中';
    risks.push({ name: 'VLSFO 備量不足', level, pct,
      desc: `VLSFO 剩餘 ${vlsfo.percentage}%，ECA 管制區燃油風險升高` });
  }

  // 總油量警戒
  const overall = fuelStatus.overallPercentage ?? fuelStatus.percentage ?? 100;
  if (overall < 35) {
    const level = overall < 20 ? '高' : '中';
    const pct   = Math.min(100, Math.round((35 - overall) / 35 * 100));
    risks.push({ name: overall < 20 ? '總油量嚴重不足' : '總油量偏低', level, pct,
      desc: `總剩餘 ${overall}%，建議確認補給計畫` });
  }

  // HFO 囤積於 ECA 管制區（無法使用）
  if (inECA && hfo && hfo.percentage > 50) {
    risks.push({ name: 'HFO 囤積（ECA 不可用）', level: '中', pct: 50,
      desc: `ECA 模式中 HFO 剩餘 ${hfo.percentage}%，無法消耗` });
  }

  return risks;
}

function riskItem(name, level, pct, desc) {
  return `
    <div class="risk-item">
      <div class="risk-item-header">
        <span class="risk-name">${name}</span>
        <span class="risk-badge ${level}">${level}</span>
      </div>
      <div class="risk-bar-wrap">
        <div class="risk-bar">
          <div class="risk-fill ${level}" style="width:${pct}%"></div>
        </div>
        <span class="risk-pct">${pct}%</span>
      </div>
      ${desc ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">${desc}</div>` : ''}
    </div>`;
}

/**
 * @param {HTMLElement} container
 * @param {object}      risk        - snap.risk
 * @param {object}      [fuelStatus] - snap.fuelStatus (選填，啟用多油種風險）
 */
export function renderRiskPanel(container, risk, fuelStatus) {
  const baseItems = Object.entries(RISK_NAMES).map(([key, name]) => {
    const { level, pct } = risk[key];
    return riskItem(name, level, pct, '');
  }).join('');

  const fuelRisks = deriveFuelRisks(fuelStatus);
  const fuelSep   = fuelRisks.length
    ? `<div style="padding:6px 14px 2px;font-size:11px;color:var(--text-muted);letter-spacing:.5px">▸ 多油種風險分析</div>`
    : '';
  const fuelItems = fuelRisks.map(r => riskItem(r.name, r.level, r.pct, r.desc)).join('');

  // Per-fuel quick summary
  const fuelBar = fuelStatus && fuelStatus.fuels
    ? `<div style="padding:6px 14px 10px;display:flex;gap:10px;border-bottom:1px solid var(--border-color)">
        ${fuelStatus.fuels.map(f => {
          const color = FUEL_COLORS[f.type] || '#8b949e';
          return `<div style="flex:1;text-align:center">
            <div style="font-size:11px;color:${color};font-weight:600">${f.type}</div>
            <div style="font-size:13px;font-weight:600">${f.percentage}%</div>
            <div style="height:3px;background:var(--bg-tertiary);border-radius:2px;margin-top:3px">
              <div style="height:100%;width:${f.percentage}%;background:${color};border-radius:2px"></div>
            </div>
          </div>`;
        }).join('')}
      </div>`
    : '';

  container.innerHTML = `<div class="panel-header">風險評估</div>${fuelBar}${baseItems}${fuelSep}${fuelItems}`;
}