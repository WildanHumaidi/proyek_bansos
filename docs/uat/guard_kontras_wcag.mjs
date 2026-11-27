import { chromium } from 'playwright-core';

/* Audit kontras WCAG + ukuran font + target sentuh, langsung dari computed style browser. */
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 360, height: 740 } });

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
  const blend = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });

  const effBg = (el) => {
    let node = el, acc = null, guard = 0;
    while (node && guard++ < 30) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { gradient: true };
      const c = parseRgb(cs.backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? blend(acc, c) : c;
        if (acc.a === 1 || c.a === 1) return acc;
      }
      node = node.parentElement;
    }
    return acc || { r: 255, g: 255, b: 255, a: 1 };
  };

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const txt = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    if (!txt) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const fg = parseRgb(cs.color);
    if (!fg) continue;
    const bg = effBg(el);
    if (bg.gradient) continue; // latar gradien: dilewati (tidak bisa dihitung andal)
    const ratio = contrast(fg.a < 1 ? blend(fg, bg) : fg, bg);
    const fs = parseFloat(cs.fontSize);
    const fw = +cs.fontWeight || 400;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const need = large ? 3.0 : 4.5;
    out.push({
      tag: el.tagName,
      cls: String(el.className).slice(0, 22),
      txt: txt.slice(0, 34),
      fs: Math.round(fs * 10) / 10,
      fw,
      ratio: Math.round(ratio * 100) / 100,
      need,
      fail: ratio < need - 0.01,
      color: cs.color,
      bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
    });
  }
  return out;
};

const login = async (user, pass) => {
  await page.goto('http://127.0.0.1:5173/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://127.0.0.1:5173/login');
  await page.waitForTimeout(450);
  await page.fill('input[placeholder*="username"]', user);
  await page.fill('input[type="password"]', pass);
  const sebelum = new URL(page.url()).pathname;
  await page.click('button[type="submit"]');
  // Tunggu URL benar-benar berpindah DULU. Tanpa ini, penantian "Memuat hilang"
  // langsung lolos karena halaman /login tidak memuat kata itu, lalu audit
  // mengukur spinner loading dan melaporkan "1 teks, 0 gagal" — lolos palsu
  // untuk halaman yang belum tampil sama sekali.
  await page.waitForFunction((awal) => location.pathname !== awal, sebelum, { timeout: 10000 }).catch(() => {});
  await page
    .waitForFunction(() => !document.body.innerText.includes('Memuat'), { timeout: 10000 })
    .catch(() => {});
  await page.waitForTimeout(1200);
};

const report = [];
const auditPage = async (label) => {
  const res = await page.evaluate(AUDIT);
  const fails = res.filter((r) => r.fail);
  report.push({ label, total: res.length, fails });
  console.log(`\n== ${label} == ${res.length} teks diperiksa, ${fails.length} gagal kontras`);
  for (const f of fails.slice(0, 14)) {
    console.log(`   ${f.ratio} (butuh ${f.need}) ${f.fs}px/${f.fw} ${f.color} di ${f.bg} — "${f.txt}" [${f.cls}]`);
  }
};

/* halaman publik */
await page.goto('http://127.0.0.1:5173/login');
await page.waitForTimeout(1200);
await auditPage('login');
await page.goto('http://127.0.0.1:5173/register');
await page.waitForTimeout(1000);
await auditPage('register');

/* warga */
await login('warga01', 'warga123');
await auditPage('warga:beranda');
for (const [re, lbl] of [['Kuesioner', 'warga:kuesioner'], ['^Status$', 'warga:status'], ['Diskusi', 'warga:diskusi']]) {
  await page.evaluate((pat) => {
    const b = [...document.querySelectorAll('.nav-tab')].find((x) => new RegExp(pat).test(x.textContent));
    if (b) b.click();
  }, re);
  await page.waitForTimeout(1000);
  await auditPage(lbl);
}

/* ukuran target sentuh di halaman warga (min 44px) */
const small = await page.evaluate(() =>
  [...document.querySelectorAll('.nav-tab, .opt-card, .btn-blue, .btn-ghost, main button, main input')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { t: (el.textContent || el.placeholder || el.tagName).trim().slice(0, 24), h: Math.round(r.height), w: Math.round(r.width) };
    })
    .filter((e) => e.h > 0 && (e.h < 40 || e.w < 40))
);
console.log(`\n== target sentuh < 40px: ${small.length} ==`);
for (const s of small.slice(0, 12)) console.log(`   ${s.w}x${s.h} "${s.t}"`);

const fontSize = await page.evaluate(() => {
  const c = {};
  for (const el of document.querySelectorAll('main *')) {
    const t = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!t) continue;
    const fs = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10;
    c[fs] = (c[fs] || 0) + 1;
  }
  return c;
});
console.log('\n== distribusi ukuran font di <main> (kuesioner) ==', JSON.stringify(fontSize));

/* Sidebar staf (RT/RW/Admin).
 *
 * Celah yang ditutup: AUDIT() menyapu seluruh <body>, tetapi guard ini dulu
 * hanya login sebagai warga — yang tidak punya sidebar. Akibatnya chip pengguna
 * di sidebar RT ("Ketua RT 01", #bfdbfe di atas #D6E9FF, rasio 1.15) tidak
 * pernah terukur, padahal praktis tidak terbaca. Sekarang tiap peran staf
 * dibuka dan sidebarnya ikut dinilai. */
for (const [user, pass, lbl] of [
  ['rt001', 'rt123', 'rt:sidebar'],
  ['rw08', 'rw123', 'rw:sidebar'],
  ['admin', 'admin123', 'admin:sidebar'],
]) {
  await login(user, pass);
  if (new URL(page.url()).pathname === '/login') {
    console.log(`\n== ${lbl} == LEWATI (kredensial demo tidak berlaku di ${page.url()})`);
    continue;
  }
  await auditPage(lbl);
}

await browser.close();
const allFails = report.reduce((a, r) => a + r.fails.length, 0);
const allTxt = report.reduce((a, r) => a + r.total, 0);
console.log(`\nTOTAL: ${allTxt} teks diperiksa, ${allFails} gagal kontras`);
