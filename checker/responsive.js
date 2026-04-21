/**
 * checker/responsive.js
 * 使用 Playwright 執行 3 種裝置寬度的響應式設計檢查
 */
import { chromium } from 'playwright';

const VIEWPORTS = [
  { name: '手機版', width: 320,  height: 667  },
  { name: '平板版', width: 768,  height: 1024 },
  { name: '桌機版', width: 1440, height: 900  },
];

/** @param {string} url */
export async function checkResponsiveDesign(url) {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 15_000 });
      // 等待任何 JS 渲染完成
      await page.waitForTimeout(800);
    } catch {
      results.push({
        name: `${vp.name}（${vp.width}px）`,
        passed: false,
        reason: '頁面載入逾時或失敗',
      });
      await page.close();
      continue;
    }

    // 偵測水平捲動
    const scrollInfo = await page.evaluate((vpWidth) => {
      const docW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      const hasHScroll = docW > clientW;

      // 找出右側超出視窗的元素（最多回傳 5 個）
      const offenders = [];
      if (hasHScroll) {
        const all = document.querySelectorAll('*');
        for (const el of all) {
          if (offenders.length >= 5) break;
          const rect = el.getBoundingClientRect();
          if (rect.right > vpWidth + 1) {          // +1 避免浮點誤差
            const tag = el.tagName.toLowerCase();
            const id   = el.id   ? `#${el.id}`   : '';
            const cls  = el.className && typeof el.className === 'string'
              ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
            offenders.push(`${tag}${id}${cls} (right=${Math.round(rect.right)}px)`);
          }
        }
      }

      return { hasHScroll, docW, clientW, offenders };
    }, vp.width);

    const passed = !scrollInfo.hasHScroll;
    results.push({
      name: `${vp.name}（${vp.width}px）`,
      passed,
      reason: passed ? null :
        `水平捲動：頁面寬 ${scrollInfo.docW}px > 視窗寬 ${scrollInfo.clientW}px` +
        (scrollInfo.offenders.length
          ? `\n         溢出元素：${scrollInfo.offenders.join(' | ')}`
          : ''),
    });

    await page.close();
  }

  await browser.close();
  return results;
}