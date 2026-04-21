/**
 * checker/report.js
 * 計算分數並格式化輸出檢查報告
 */

const TOTAL_ITEMS  = 11;
const SCORE_EACH   = 100 / TOTAL_ITEMS;   // ≈ 9.09 分 / 項

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

const pass = (text) => `${GREEN}✅ ${text}${RESET}`;
const fail = (text) => `${RED}❌ ${text}${RESET}`;

/**
 * @param {{ name:string, passed:boolean, reason:string|null }[]} htmlSeoResults
 * @param {{ name:string, passed:boolean, reason:string|null }[]} responsiveResults
 * @returns {{ score:number, passed:number, total:number, grade:string }}
 */
export function generateReport(htmlSeoResults, responsiveResults) {
  const allResults = [...htmlSeoResults, ...responsiveResults];
  const passedCount = allResults.filter(r => r.passed).length;
  const score = Math.round(passedCount * SCORE_EACH);

  const line = '─'.repeat(52);

  console.log(`\n${BOLD}${CYAN}${'═'.repeat(52)}${RESET}`);
  console.log(`${BOLD}${CYAN}   網站品質自動化檢查報告${RESET}`);
  console.log(`${BOLD}${CYAN}${'═'.repeat(52)}${RESET}\n`);

  // ── HTML / SEO ──
  console.log(`${BOLD}【HTML / SEO 基礎檢查】${RESET}`);
  htmlSeoResults.forEach((r, i) => {
    console.log(`  ${r.passed ? pass(`${i + 1}. ${r.name}`) : fail(`${i + 1}. ${r.name}`)}`);
    if (!r.passed && r.reason) {
      console.log(`${YELLOW}       ↳ ${r.reason}${RESET}`);
    }
  });

  // ── 響應式 ──
  console.log(`\n${BOLD}【響應式設計檢查】${RESET}`);
  responsiveResults.forEach((r, i) => {
    console.log(`  ${r.passed ? pass(`${i + 1}. ${r.name}`) : fail(`${i + 1}. ${r.name}`)}`);
    if (!r.passed && r.reason) {
      r.reason.split('\n').forEach(line => {
        console.log(`${YELLOW}       ${line}${RESET}`);
      });
    }
  });

  // ── 總分 ──
  const grade = score >= 90 ? '優秀 🏆' : score >= 70 ? '良好 👍' : score >= 50 ? '待改善 ⚠️' : '不合格 ❌';
  const scoreColor = score >= 90 ? GREEN : score >= 70 ? CYAN : score >= 50 ? YELLOW : RED;

  console.log(`\n${line}`);
  console.log(`  通過項目：${BOLD}${passedCount} / ${TOTAL_ITEMS}${RESET}`);
  console.log(`  每項配分：${SCORE_EACH.toFixed(2)} 分`);
  console.log(`  ${BOLD}總分：${scoreColor}${score} 分${RESET}`);
  console.log(`  評估等級：${BOLD}${grade}${RESET}`);
  console.log(`${line}\n`);

  return { score, passed: passedCount, total: TOTAL_ITEMS, grade };
}