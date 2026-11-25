import { chromium } from 'playwright-core';

/* Guard kontras + target sentuh untuk halaman RANKING (RT/RW/Admin).
 *
 * guard_kontras_wcag.mjs hanya memeriksa halaman Beranda, sehingga seluruh
 * halaman ranking lolos tanpa diperiksa. Skrip ini menutup celah itu: memeriksa
 * teks di <main> terhadap latar efektifnya (WCAG AA) plus target sentuh >= 40px.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });

const AUDIT = () => {
  const parseRgb = (s) => {
    const m = String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const lin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const contrast = (f, b) => {
    const l1 = lum(f), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const effBg = (el) => {
    let node = el, acc = null, guard = 0;
    while (node && guard++ < 30) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parseRgb(cs.backgroundColor);
      if (c && c.a > 0) {
        acc = acc
          ? {
              r: c.r * c.a + acc.r * (1 - c.a),
              g: c.g * c.a + acc.g * (1 - c.a),
              b: c.b * c.a + acc.b * (1 - c.a),
              a: 1,
            }
          : c;
        if (acc.a === 1 || c.a === 1) return acc;
      }
      node = node.parentElement;
    }
    return acc || { r: 255, g: 255, b: 255, a: 1 };
  };

  const gagal = [];
  let diperiksa = 0;
  for (const el of document.querySelectorAll('main *')) {
    const txt = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    if (!txt) continue;
    const cs = getComputedStyle(el);
    const fg = parseRgb(cs.color);
    const bg = effBg(el);
    if (!fg || !bg) continue;
    diperiksa++;
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const butuh = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    const rasio = contrast(fg, bg);
    if (rasio < butuh) {
      gagal.push({ txt: txt.slice(0, 34), rasio: +rasio.toFixed(2), butuh, size });
    }
  }

  const kecil = [...document.querySelectorAll('main button, main a, main [role="button"]')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { t: el.textContent.trim().slice(0, 24), h: Math.round(r.height) };
    })
    .filter((o) => o.h > 0 && o.h < 40);

  const scroll = {
    scrollW: document.documentElement.scrollWidth,
    vw: innerWidth,
  };

  return { diperiksa, gagal, kecil, scroll };
};

const masuk = async (user, pass, menuRe) => {
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(600);
  await page.fill('input[placeholder*="username"]', user);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2200);
  await page.evaluate((pat) => {
    const b = [...document.querySelectorAll('aside button')].find((x) =>
      new RegExp(pat).test(x.textContent)
    );
    if (b) b.click();
  }, menuRe);
  await page.waitForTimeout(2000);
};

const periksa = async (label) => {
  const o = await page.evaluate(AUDIT);
  const ok = o.gagal.length === 0 && o.kecil.length === 0 && o.scroll.scrollW <= o.scroll.vw + 1;
  console.log(
    `${ok ? 'PASS' : 'GAGAL'} ${label} — ${o.diperiksa} teks, ` +
      `${o.gagal.length} gagal kontras, ${o.kecil.length} target < 40px, ` +
      `scrollW ${o.scroll.scrollW}/${o.scroll.vw}`
  );
  if (o.gagal.length) console.log('        kontras:', o.gagal.slice(0, 5));
  if (o.kecil.length) console.log('        target:', o.kecil);
  return ok;
};

const hasil = [];
hasil.push(['rt:ranking', await masuk('rt001', 'rt123', 'Hasil Rekomendasi').then(() => periksa('rt:ranking'))]);
hasil.push(['rw:ranking', await masuk('rw08', 'rw123', 'Perangkingan').then(() => periksa('rw:ranking'))]);
hasil.push(['admin:ranking', await masuk('admin', 'admin123', 'Hasil Keputusan').then(() => periksa('admin:ranking'))]);

await browser.close();

const gagalTotal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} halaman diperiksa, ${gagalTotal} gagal`);
process.exit(gagalTotal === 0 ? 0 : 1);
