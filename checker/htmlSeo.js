/**
 * checker/htmlSeo.js
 * 使用 Cheerio 執行 8 項 HTML / SEO 基礎檢查
 */
import * as cheerio from 'cheerio';

/** @param {string} url */
export async function checkHtmlSeo(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`無法取得頁面：HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html, { xmlMode: false });

  return [
    checkStructure($),
    checkLang($),
    checkCharset($),
    checkTitle($),
    checkMetaDescription($),
    checkH1($),
    checkImgAlt($),
    checkLinks($),
  ];
}

/* ── 1. 基本 HTML 結構 ────────────────────────── */
function checkStructure($) {
  const missing = ['html', 'head', 'body'].filter(tag => $(tag).length === 0);
  return {
    name: '基本 HTML 結構（html / head / body）',
    passed: missing.length === 0,
    reason: missing.length ? `缺少標籤：<${missing.join('>, <')}>` : null,
  };
}

/* ── 2. 語言屬性 ──────────────────────────────── */
function checkLang($) {
  const lang = $('html').attr('lang') || '';
  return {
    name: '語言屬性（html[lang]）',
    passed: lang.trim().length > 0,
    reason: lang ? null : '<html> 缺少 lang 屬性',
  };
}

/* ── 3. 字元編碼 ──────────────────────────────── */
function checkCharset($) {
  const charset = $('meta[charset]').attr('charset') || '';
  const passed = /utf-?8/i.test(charset);
  return {
    name: '字元編碼（meta charset="UTF-8"）',
    passed,
    reason: passed ? null : charset ? `charset 為 "${charset}"，應為 UTF-8` : '缺少 <meta charset>',
  };
}

/* ── 4. 頁面標題 ──────────────────────────────── */
function checkTitle($) {
  const title = $('title').text().trim();
  return {
    name: '頁面標題（title）',
    passed: title.length > 0,
    reason: title ? null : '<title> 不存在或內容為空',
  };
}

/* ── 5. Meta Description ──────────────────────── */
function checkMetaDescription($) {
  const el = $('meta[name="description"]');
  if (el.length === 0) {
    return { name: 'Meta Description（50–160 字元）', passed: false, reason: '缺少 <meta name="description">' };
  }
  const content = (el.attr('content') || '').trim();
  const len = content.length;
  const passed = len >= 50 && len <= 160;
  return {
    name: 'Meta Description（50–160 字元）',
    passed,
    reason: passed ? null : `內容長度為 ${len} 字元（應介於 50–160）`,
  };
}

/* ── 6. 主標題 H1 ─────────────────────────────── */
function checkH1($) {
  const count = $('h1').length;
  return {
    name: '主標題（h1 唯一）',
    passed: count === 1,
    reason: count === 0 ? '缺少 <h1>' : count > 1 ? `共有 ${count} 個 <h1>，應僅有 1 個` : null,
  };
}

/* ── 7. 圖片替代文字 ──────────────────────────── */
function checkImgAlt($) {
  const imgs = $('img');
  const missing = [];
  imgs.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined) {
      const src = $(el).attr('src') || '（無 src）';
      missing.push(src.length > 50 ? src.slice(0, 50) + '…' : src);
    }
  });
  return {
    name: '圖片替代文字（img[alt]）',
    passed: missing.length === 0,
    reason: missing.length ? `${missing.length} 張圖片缺少 alt：${missing.slice(0, 3).join(', ')}` : null,
  };
}

/* ── 8. 連結有效性 ────────────────────────────── */
function checkLinks($) {
  const invalid = [];
  $('a').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (href.length === 0 || href === '#') {
      const text = $(el).text().trim().slice(0, 30) || '（無文字）';
      invalid.push(text);
    }
  });
  return {
    name: '連結有效性（a[href] 非空且非 #）',
    passed: invalid.length === 0,
    reason: invalid.length ? `${invalid.length} 個連結無效：${invalid.slice(0, 3).join(', ')}` : null,
  };
}