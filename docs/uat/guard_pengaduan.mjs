import { chromium } from 'playwright-core';

/* Guard UI pengaduan (P2-01): empat peran, cek overflow 360px, kontras, target
 * sentuh, dan isolasi wilayah (RT 001 tidak boleh melihat pengaduan RT 003).
 *
 * Catatan penting: /api/login dibatasi `throttle:10,1`. Versi sebelumnya login
 * ulang di browser untuk setiap peran (4× per run), sehingga beberapa run
 * berurutan menembus batas dan mendapat 429 — gejalanya tampak seperti "panel
 * pengaduan tidak muncul". Sekarang token diambil SEKALI per peran lewat API,
 * lalu disuntik ke localStorage; browser hanya membuka halaman.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';

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
    if (rasio < butuh) gagal.push({ txt: txt.slice(0, 30), rasio: +rasio.toFixed(2), butuh, size });
  }

  const kecil = [...document.querySelectorAll('main button, main a, main input, main select, main textarea')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { t: (el.textContent || el.placeholder || el.tagName).trim().slice(0, 22), h: Math.round(r.height) };
    })
    .filter((o) => o.h > 0 && o.h < 40);

  return {
    diperiksa,
    gagal,
    kecil,
    scrollW: document.documentElement.scrollWidth,
    vw: innerWidth,
    teks: (document.querySelector('main') || document.body).innerText,
  };
};

/** Token diambil sekali per peran (bukan login di browser). */
const sesi = {};
const ambilSesi = async (user, pass) => {
  if (sesi[user]) return sesi[user];
  const res = await page.request.post(`${API}/login`, {
    data: { username: user, password: pass },
    headers: { Accept: 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!body.token) {
    // 429 = batas `throttle:10,1` pada /api/login tercapai. Skrip ini butuh 4
    // login per run, jadi tiga run berurutan dalam satu menit akan kena batas.
    const pesan =
      res.status() === 429
        ? 'batas login 10/menit tercapai — tunggu ~60 detik sebelum menjalankan lagi'
        : JSON.stringify(body).slice(0, 160);
    console.log(`GAGAL login ${user}: ${pesan}`);
    throw new Error(pesan);
  }
  sesi[user] = { token: body.token, user: body.user };
  return sesi[user];
};

const masuk = async (user, pass, menuRe, path) => {
  const { token, user: profil } = await ambilSesi(user, pass);

  await page.goto(`${BASE}/login`);
  await page.evaluate(
    ({ t, u }) => {
      localStorage.clear();
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    },
    { t: token, u: profil }
  );

  await page.goto(`${BASE}${path}`);
  await page.waitForTimeout(2200);

  if (menuRe) {
    // Tunggu tombol menu benar-benar ada sebelum diklik. Dulu klik dilakukan
    // setelah jeda tetap; bila sidebar belum ter-render, klik tidak terjadi dan
    // audit berjalan di halaman beranda (guard flaky: "panel tidak muncul").
    await page
      .waitForFunction(
        (pat) => {
          const b = [...document.querySelectorAll('aside button, .nav-tab')].find((x) =>
            new RegExp(pat).test(x.textContent)
          );
          return !!b;
        },
        menuRe,
        { timeout: 20000 }
      )
      .catch(() => console.log(`        (peringatan: tombol menu /${menuRe}/ tidak ditemukan)`));

    await page.evaluate((pat) => {
      const b = [...document.querySelectorAll('aside button, .nav-tab')].find((x) =>
        new RegExp(pat).test(x.textContent)
      );
      if (b) b.click();
    }, menuRe);

    // Tunggu panel pengaduan benar-benar terpasang. Menunggu `<main>` berisi teks
    // saja tidak cukup: teks beranda sudah memenuhinya.
    await page
      .waitForFunction(
        () => {
          const m = document.querySelector('main');
          if (!m) return false;
          const t = m.innerText;
          return /Pengaduan Warga/.test(t) && /(Daftar Pengaduan|Pengaduan Saya)/.test(t);
        },
        null,
        { timeout: 20000 }
      )
      .catch(() => {
        console.log('        (peringatan: panel pengaduan tidak muncul dalam 20s)');
      });
    await page.waitForTimeout(900);
  }
};

const hasil = [];
const periksa = async (label, opts = {}) => {
  const o = await page.evaluate(AUDIT);
  const masalah = [];
  if (o.gagal.length) masalah.push(`${o.gagal.length} gagal kontras ${JSON.stringify(o.gagal.slice(0, 3))}`);
  if (o.kecil.length) masalah.push(`${o.kecil.length} target < 40px ${JSON.stringify(o.kecil.slice(0, 3))}`);
  if (o.scrollW > o.vw + 1) masalah.push(`overflow ${o.scrollW}/${o.vw}`);
  if (opts.harusAda) {
    for (const s of opts.harusAda) if (!o.teks.includes(s)) masalah.push(`teks "${s}" tidak ada`);
  }
  if (opts.harusTidakAda) {
    for (const s of opts.harusTidakAda) if (o.teks.includes(s)) masalah.push(`teks "${s}" seharusnya tidak tampil`);
  }
  const ok = masalah.length === 0;
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label} — ${o.diperiksa} teks`);
  if (!ok) console.log('        ' + masalah.join('\n        '));
  hasil.push([label, ok]);
};

// Warga: harus bisa kirim & melihat pengaduannya sendiri
await masuk('warga01', 'warga123', 'Pengaduan', '/warga');
await periksa('warga:pengaduan', { harusAda: ['Kirim Pengaduan', 'Pengaduan Saya'] });

// RT: hanya wilayah sendiri — pengaduan RT 003 tidak boleh tampil
await masuk('rt001', 'rt123', 'Pengaduan', '/rt');
await periksa('rt:pengaduan', {
  harusAda: ['Daftar Pengaduan'],
  harusTidakAda: ['RT 003', 'Warga RT Lain'],
});

// RW & Admin: melihat semua
await masuk('rw08', 'rw123', 'Pengaduan', '/rw');
await periksa('rw:pengaduan', { harusAda: ['Daftar Pengaduan'] });

await masuk('admin', 'admin123', 'Pengaduan', '/dashboard');
await periksa('admin:pengaduan', { harusAda: ['Daftar Pengaduan'] });

await browser.close();

const gagalTotal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} halaman diperiksa, ${gagalTotal} gagal`);
process.exit(gagalTotal === 0 ? 0 : 1);
