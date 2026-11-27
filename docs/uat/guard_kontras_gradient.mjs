import { chromium } from 'playwright-core';

/* Audit kontras untuk teks di atas LATAR GRADIEN.
 *
 * Kenapa ada: `guard_kontras_wcag.mjs` melewatkan setiap elemen yang latarnya
 * gradien, karena rasio tidak bisa dibaca dari `backgroundColor` biasa. Akibatnya
 * seluruh panel merek di /login dan /register, hero warga, dan banner dashboard
 * sama sekali tidak pernah diperiksa — padahal di situlah teks putih ber-alpha
 * rendah dipakai paling banyak (rgba(255,255,255,.3) dst).
 *
 * Hitungannya: warna gradien di titik tengah tiap elemen dihitung analitis
 * (proyeksi titik ke garis gradien CSS), lalu kontras dihitung antara teks yang
 * sudah dicampur latar (alpha) dan latar itu sendiri. Ambang WCAG AA: 4.5 untuk
 * teks normal, 3.0 untuk teks besar (>=24px, atau >=18.66px tebal).
 *
 * Latar ber-alpha di antara teks dan gradien (mis. badge rgba(255,255,255,.12))
 * ikut dicampur, jadi badge di atas gradien tidak salah dinilai.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';

/* Kredensial bisa ditimpa lewat env supaya guard ini juga bisa dijalankan
 * terhadap situs live, yang password stafnya sudah dirotasi dan tidak sama
 * dengan seed demo. Tidak ada kredensial yang disimpan di berkas ini. */
const akun = {
  warga: [process.env.WARGA_USER || 'warga01', process.env.WARGA_PASS || 'warga123'],
  rt: [process.env.RT_USER || 'rt001', process.env.RT_PASS || 'rt123'],
  rw: [process.env.RW_USER || 'rw08', process.env.RW_PASS || 'rw123'],
  admin: [process.env.ADMIN_USER || 'admin', process.env.ADMIN_PASS || 'admin123'],
};

const AUDIT = () => {
  const parseRgb = (s) => {
    const m = String(s).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
  };
  const hex = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  };
  const lin = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const contrast = (f, b) => {
    const l1 = lum(f);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const over = (top, alpha, bottom) => ({
    r: top.r * alpha + bottom.r * (1 - alpha),
    g: top.g * alpha + bottom.g * (1 - alpha),
    b: top.b * alpha + bottom.b * (1 - alpha),
  });

  /** Parse linear-gradient(angle, #hex|rgb() p%, ...) -> {angle, stops}. */
  const parseGradient = (bg) => {
    const m = /linear-gradient\(\s*([-\d.]+)deg\s*,([\s\S]+)\)/.exec(bg);
    if (!m) return null;
    const angle = +m[1];
    const stops = [];
    for (const part of m[2].split(/,(?![^(]*\))/)) {
      const s = part.trim();
      // Chromium menormalkan `#0b3fa8` menjadi `rgb(11, 63, 168)`, jadi kedua
      // bentuk harus diterima — kalau hanya hex yang dicari, gradien tidak
      // pernah terdeteksi dan audit melaporkan "0 teks" (lolos palsu).
      const c = parseRgb(s) || (/[0-9a-fA-F]{3,6}/.exec(s) ? hex(/#[0-9a-fA-F]{3,6}/.exec(s)[0]) : null);
      if (!c) continue;
      const pm = /([\d.]+)%/.exec(s);
      stops.push({ color: { r: c.r, g: c.g, b: c.b }, pos: pm ? +pm[1] / 100 : null });
    }
    if (stops.length < 2) return null;
    // Stop tanpa persen: bagi rata pada sisa rentang.
    if (stops[0].pos === null) stops[0].pos = 0;
    if (stops[stops.length - 1].pos === null) stops[stops.length - 1].pos = 1;
    for (let i = 1; i < stops.length - 1; i++) if (stops[i].pos === null) stops[i].pos = i / (stops.length - 1);
    return { angle, stops };
  };

  /** Warna gradien pada titik (x, y) relatif terhadap kotak elemen bergradien. */
  const gradientAt = (grad, rect, x, y) => {
    const rad = (grad.angle * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const len = Math.abs(rect.width * dx) + Math.abs(rect.height * dy);
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let t = len === 0 ? 0.5 : ((x - cx) * dx + (y - cy) * dy) / len + 0.5;
    t = Math.min(1, Math.max(0, t));
    let a = grad.stops[0];
    let b = grad.stops[grad.stops.length - 1];
    for (let i = 0; i < grad.stops.length - 1; i++) {
      if (t >= grad.stops[i].pos && t <= grad.stops[i + 1].pos) {
        a = grad.stops[i];
        b = grad.stops[i + 1];
        break;
      }
    }
    const span = b.pos - a.pos || 1;
    const k = (t - a.pos) / span;
    return {
      r: a.color.r + (b.color.r - a.color.r) * k,
      g: a.color.g + (b.color.g - a.color.g) * k,
      b: a.color.b + (b.color.b - a.color.b) * k,
    };
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
    // Ligatur ikon juga textContent ("check_circle", "hub"), tetapi yang dinilai
    // di sini hanya keterbacaan teks.
    if (cs.fontFamily.includes('Material Symbols') || el.classList.contains('material-symbols-outlined')) continue;

    // Cari leluhur terdekat yang memasang gradien; catat lapisan alpha di antaranya.
    // Mulai dari `el` sendiri: kotak berlatar solid (mis. nomor langkah #D6E9FF)
    // membawa text node secara langsung, jadi melewatkannya membuat latar solid
    // itu hilang dari hitungan dan rasio jadi ngawur.
    let node = el;
    let grad = null;
    let gradRect = null;
    const lapisan = [];
    let guard = 0;
    while (node && guard++ < 30) {
      const ncs = getComputedStyle(node);
      if (ncs.backgroundImage && ncs.backgroundImage !== 'none') {
        grad = parseGradient(ncs.backgroundImage);
        if (grad) {
          gradRect = node.getBoundingClientRect();
          break;
        }
      }
      const c = parseRgb(ncs.backgroundColor);
      if (c && c.a > 0) lapisan.push(c);
      node = node.parentElement;
    }
    if (!grad) continue; // bukan latar gradien: urusan guard_kontras_wcag

    // Titik ukur: tengah kotak teks.
    let bg = gradientAt(grad, gradRect, r.left + r.width / 2, r.top + r.height / 2);
    for (let i = lapisan.length - 1; i >= 0; i--) bg = over(lapisan[i], lapisan[i].a, bg);

    const fgRaw = parseRgb(cs.color);
    if (!fgRaw) continue;
    const fg = fgRaw.a < 1 ? over(fgRaw, fgRaw.a, bg) : fgRaw;

    const ratio = contrast(fg, bg);
    const fs = parseFloat(cs.fontSize);
    const fw = +cs.fontWeight || 400;
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const need = large ? 3.0 : 4.5;

    out.push({
      tag: el.tagName,
      txt: txt.slice(0, 40),
      fs: Math.round(fs * 10) / 10,
      fw,
      color: cs.color,
      bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
      ratio: Math.round(ratio * 100) / 100,
      need,
      fail: ratio < need - 0.01,
    });
  }
  return out;
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const hasil = [];
const cekHalaman = async (label) => {
  await page.evaluate(() => document.fonts.ready);
  // Tunggu sampai ada elemen bergradien yang benar-benar memuat teks. Dashboard
  // warga menyusul lebih lambat (hero baru muncul setelah status pengajuan
  // selesai di-fetch, sekitar 3 detik), jadi jeda tetap 250 ms membuat audit
  // mengukur halaman kosong dan melaporkan "0 teks" — lolos palsu.
  await page
    .waitForFunction(
      () => {
        const grads = [...document.querySelectorAll('div,section,header,aside')].filter((d) =>
          getComputedStyle(d).backgroundImage.includes('gradient')
        );
        return grads.some((g) =>
          [...g.querySelectorAll('*')].some(
            (e) => e.children.length === 0 && e.textContent.trim().length > 2
          )
        );
      },
      { timeout: 8000 }
    )
    .catch(() => {});
  await page.waitForTimeout(300);
  const res = await page.evaluate(AUDIT);
  const gagal = res.filter((r) => r.fail);
  hasil.push({ label, total: res.length, gagal });
  // URL ikut dicetak: 0 teks bisa berarti "halaman tidak memuat gradien" atau
  // "login belum mendarat di halaman yang dimaksud" — dua hal yang sangat berbeda.
  console.log(
    `\n== ${label} == ${new URL(page.url()).pathname} — ${res.length} teks di atas gradien, ${gagal.length} gagal`
  );
  for (const f of gagal.slice(0, 20)) {
    console.log(`   ${f.ratio} (butuh ${f.need}) ${f.fs}px/${f.fw} ${f.color} di ${f.bg} — "${f.txt}"`);
  }
};

const buka = async (path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
};

const masuk = async (user, pass, tujuan) => {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  await page.fill('input[autocomplete="username"]', user);
  await page.fill('input[autocomplete="current-password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2200);
  const url = new URL(page.url()).pathname;
  // Password staf di server live sudah dirotasi, jadi kredensial demo tidak
  // selalu berlaku. Peran yang tidak bisa masuk dilewati dengan alasan yang
  // jelas — bukan dilempar sebagai kegagalan UI, karena halaman yang belum
  // dibuka tidak bisa dinilai. Untuk live, timpa lewat env (mis. ADMIN_PASS).
  if (tujuan && url !== tujuan) {
    console.log(`   LEWATI ${user}: login mendarat di ${url}, bukan ${tujuan} (atur lewat env)`);
    return false;
  }
  return true;
};

await buka('/login');
await cekHalaman('login');
await buka('/register');
await cekHalaman('register');

if (await masuk(...akun.warga, '/warga')) {
  await cekHalaman('warga:beranda');
  for (const [re, lbl] of [['^Status$', 'warga:status'], ['Diskusi', 'warga:diskusi']]) {
    await page.evaluate((pat) => {
      const b = [...document.querySelectorAll('.nav-tab')].find((x) => new RegExp(pat).test(x.textContent));
      if (b) b.click();
    }, re);
    await cekHalaman(lbl);
  }
}

if (await masuk(...akun.rt, '/rt')) {
  await cekHalaman('rt:beranda');
  for (const tab of ['Hasil Rekomendasi', 'Data Warga']) {
    await page.evaluate((t) => {
      const el = [...document.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && new RegExp(t).test(e.textContent) && e.closest('button,a,div[role="button"]')
      );
      if (el) el.closest('button,a,div[role="button"]').click();
    }, tab);
    await cekHalaman(`rt:${tab}`);
  }
}

if (await masuk(...akun.rw, '/rw')) await cekHalaman('rw:beranda');

if (await masuk(...akun.admin, '/dashboard')) await cekHalaman('admin:beranda');

// Mobile: gradien yang sama tetapi kotak lebih sempit -> titik warna bergeser.
// localStorage harus dibersihkan dulu; kalau tidak, /login langsung redirect ke
// /dashboard dan label "@360" menipu (mengukur halaman admin, bukan form login).
await page.setViewportSize({ width: 360, height: 740 });
await page.evaluate(() => localStorage.clear());
for (const p of ['/login', '/register']) {
  await buka(p);
  await cekHalaman(`${p} @360`);
}

await browser.close();

const totalGagal = hasil.reduce((a, h) => a + h.gagal.length, 0);
const totalTeks = hasil.reduce((a, h) => a + h.total, 0);
console.log(`\nRINGKAS: ${totalTeks} teks di atas gradien diperiksa, ${totalGagal} gagal kontras`);
process.exit(totalGagal === 0 ? 0 : 1);
