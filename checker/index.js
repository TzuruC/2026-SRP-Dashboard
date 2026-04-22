/**
 * checker/index.js
 * 整合 HTML/SEO 與響應式設計檢查，計算總分並輸出報告
 *
 * 用法：
 *   node checker/index.js [url]
 *
 * 若未傳入 url，自動啟動 Vite dev server、完成後自動關閉。
 */
import { createServer }          from 'vite';
import { checkHtmlSeo }          from './htmlSeo.js';
import { checkResponsiveDesign } from './responsive.js';
import { generateReport }        from './report.js';

const DEFAULT_PAGE = 'ship-dashboard.html';

export async function runChecks(url) {
  let vite = null;

  if (!url) {
    console.log('\n🚀  未指定 URL，自動啟動 Vite dev server...');
    vite = await createServer({
      root: new URL('../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
      server: { port: 5173, strictPort: true },
      logLevel: 'silent',
    });
    await vite.listen();
    url = `http://localhost:5173/${DEFAULT_PAGE}`;
    console.log(`    Dev server 就緒：${url}`);
  }

  console.log(`\n🔍  目標網址：${url}`);
  console.log('    正在執行 HTML/SEO 與響應式設計檢查...\n');

  try {
    const [htmlSeoResults, responsiveResults] = await Promise.all([
      checkHtmlSeo(url),
      checkResponsiveDesign(url),
    ]);
    return generateReport(htmlSeoResults, responsiveResults);
  } finally {
    if (vite) await vite.close();
  }
}

/* ── CLI 入口 ─────────────────────────────────── */
const url = process.argv[2] || null;
runChecks(url).catch((err) => {
  console.error('\n❌ 執行失敗：', err.message);
  process.exit(1);
});