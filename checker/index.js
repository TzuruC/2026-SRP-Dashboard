/**
 * checker/index.js
 * 整合 HTML/SEO 與響應式設計檢查，計算總分並輸出報告
 *
 * 用法：
 *   node checker/index.js [url]
 *
 * 範例：
 *   node checker/index.js http://localhost:5173/ship-dashboard.html
 */
import { checkHtmlSeo }          from './htmlSeo.js';
import { checkResponsiveDesign } from './responsive.js';
import { generateReport }        from './report.js';

const DEFAULT_URL = 'http://localhost:5173/ship-dashboard.html';

/**
 * 執行所有檢查並回傳結果
 * @param {string} [url]
 * @returns {Promise<{ score:number, passed:number, total:number, grade:string }>}
 */
export async function runChecks(url = DEFAULT_URL) {
  console.log(`\n🔍  目標網址：${url}`);
  console.log('    正在執行 HTML/SEO 與響應式設計檢查...\n');

  // 兩項檢查並行執行以節省時間
  const [htmlSeoResults, responsiveResults] = await Promise.all([
    checkHtmlSeo(url),
    checkResponsiveDesign(url),
  ]);

  return generateReport(htmlSeoResults, responsiveResults);
}

/* ── CLI 入口（直接 node 執行時觸發） ─────────── */
const url = process.argv[2] || DEFAULT_URL;
runChecks(url).catch((err) => {
  console.error('\n❌ 執行失敗：', err.message);
  process.exit(1);
});