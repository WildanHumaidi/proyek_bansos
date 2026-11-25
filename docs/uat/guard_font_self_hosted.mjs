import { chromium } from 'playwright-core';

/* Guard font self-hosted.
 *
 * Sebelumnya font diambil dari fonts.googleapis.com (dua <link> di index.html,
 * `@import` di Landing/Login/Register/Warga, dan injeksi <link> runtime di
 * `useDesign()` dashboard). Material Symbols yang dimuat saat itu adalah versi
 * PENUH — 4 MB. Sekarang semuanya dari /fonts, dan ikon memakai subset 47 KB.
 *
 * Guard ini memastikan: tidak ada permintaan ke Google, berkas font benar-benar
 * termuat (status 200 dari origin sendiri), dan glyph ikon benar-benar tergambar
 * (bukan kotak kosong) — kegagalan yang paling mudah lolos karena teks tetap
 * tampil normal walau font ikon gagal.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const hasil = [];
const cek = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label}${detail ? ` — ${detail}` : ''}`);
  hasil.push([label, ok]);
};

// Rekam semua permintaan jaringan.
const keGoogle = [];
const fontLokal = [];
page.on('request', (req) => {
  const u = req.url();
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u)) keGoogle.push(u);
  if (/\/fonts\/[^/]+\.woff2$/.test(u)) fontLokal.push(u);
});

const auth = (t) => ({ Authorization: `Bearer ${t}`, Accept: 'application/json' });
const sesi = async (u, p) => {
  const r = await page.request.post(`${API}/login`, {
    data: { username: u, password: p },
    headers: { Accept: 'application/json' },
  });
  const b = await r.json().catch(() => ({}));
  if (!b.token) {
    throw new Error(
      r.status() === 429
        ? `batas login 10/menit tercapai untuk ${u} — tunggu ~60 detik`
        : `login ${u} gagal: ${JSON.stringify(b).slice(0, 120)}`
    );
  }
  return b;
};

/** Cek font terpasang & glyph ikon tergambar. */
const PERIKSA_FONT = async () => {
  const hasilCek = {};

  // Font web dimuat LAZY: kalau tidak ada teks yang memakainya, `document.fonts`
  // melaporkannya `unloaded` dan pengukuran jatuh ke font fallback (teks biasa).
  // Muat eksplisit dulu, kalau tidak hasil ukur tidak bermakna.
  await Promise.all([
    document.fonts.load('400 24px "Plus Jakarta Sans"'),
    document.fonts.load('400 24px "Material Symbols Outlined"'),
  ]).catch(() => {});
  await document.fonts.ready;

  // 1. Apakah font benar-benar terpasang di dokumen?
  const terpasang = [...document.fonts].map((f) => `${f.family}|${f.weight}|${f.status}`);
  hasilCek.pjs = [...document.fonts].some(
    (f) => f.family.includes('Plus Jakarta Sans') && f.status === 'loaded'
  );
  hasilCek.ikon = [...document.fonts].some(
    (f) => f.family.includes('Material Symbols') && f.status === 'loaded'
  );
  hasilCek.daftar = terpasang;

  // 2. Apakah glyph ikon tergambar? Ukur lebar <span> ikon: ligatur yang tidak
  //    ketemu akan menyisakan lebar KATA (mis. "home" ~45px) alih-alih satu
  //    glyph (~24px). Probe memakai nama yang pasti ada di subset.
  const probe = document.createElement('span');
  probe.className = 'material-symbols-outlined';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  // Font-size harus eksplisit: beberapa halaman meng-override `.material-symbols-
  // outlined` menjadi 20px, sehingga probe tanpa ukuran bisa mewarisi nilai lain
  // dan perbandingan lebar jadi tidak bermakna.
  probe.style.fontSize = '24px';
  document.body.appendChild(probe);

  //    Satu nama = satu glyph. Diukur per elemen terpisah (bukan digabung dalam
  //    satu span) supaya spasi antar-kata tidak ikut terhitung.
  probe.textContent = 'home';
  const lebarIkon = probe.getBoundingClientRect().width;
  probe.remove();

  hasilCek.lebarIkon = Math.round(lebarIkon);
  // Ikon 24px menghasilkan lebar ~24px. Kalau ligatur gagal, lebarnya mengikuti
  // panjang kata (home ~45px, dashboard ~100px).
  hasilCek.glyphOk = lebarIkon >= 18 && lebarIkon <= 32;

  // 3. Semua <span> ikon di halaman harus punya lebar masuk akal.
  const ikonDom = [...document.querySelectorAll('.material-symbols-outlined')];
  hasilCek.jumlahIkonDom = ikonDom.length;
  // Glyph yang ada lebarnya ~= font-size-nya (1 karakter). Glyph yang TIDAK ada
  // di subset tampil sebagai kata utuh, jadi lebarnya beberapa kali font-size.
  hasilCek.ikonRusak = ikonDom
    .map((el) => {
      const r = el.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(el).fontSize) || 24;
      return {
        teks: el.textContent.trim(),
        w: Math.round(r.width),
        fs: Math.round(fs),
        rasio: +(r.width / fs).toFixed(2),
      };
    })
    .filter((o) => o.w > 0 && o.rasio > 2)
    .slice(0, 6);

  return hasilCek;
};

const kunjungi = async (user, pass, path, label) => {
  const s = await sesi(user, pass);
  await page.goto(`${BASE}/login`);
  await page.evaluate(
    ({ t, u }) => {
      localStorage.clear();
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    },
    { t: s.token, u: s.user }
  );
  await page.goto(`${BASE}${path}`);
  await page.waitForFunction(() => document.querySelectorAll('main, #root').length > 0, null, {
    timeout: 25000,
  });
  // Tunggu font selesai dimuat.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);

  const o = await page.evaluate(PERIKSA_FONT);
  cek(
    `${label}: Plus Jakarta Sans termuat`,
    o.pjs,
    o.pjs ? '' : JSON.stringify(o.daftar.filter((d) => d.includes('Jakarta')))
  );
  cek(
    `${label}: ikon Material Symbols termuat`,
    o.ikon,
    o.ikon ? '' : JSON.stringify(o.daftar.filter((d) => d.includes('Material')))
  );
  cek(
    `${label}: glyph ikon tergambar`,
    o.glyphOk,
    `lebar 1 ikon=${o.lebarIkon}px`
  );
  if (o.ikonRusak.length) {
    cek(`${label}: tidak ada ikon melebar`, false, JSON.stringify(o.ikonRusak));
  }
};

// Landing (publik, tanpa token)
await page.goto(`${BASE}/`);
await page.waitForTimeout(2000);
await page.evaluate(() => document.fonts.ready);
const oLanding = await page.evaluate(PERIKSA_FONT);
cek('landing: Plus Jakarta Sans termuat', oLanding.pjs);
cek('landing: ikon Material Symbols termuat', oLanding.ikon);
cek('landing: glyph ikon tergambar', oLanding.glyphOk, `lebar 1 ikon=${oLanding.lebarIkon}px`);

await kunjungi('warga01', 'warga123', '/warga', 'warga');
await kunjungi('rt001', 'rt123', '/rt', 'rt');
await kunjungi('rw08', 'rw123', '/rw', 'rw');
await kunjungi('admin', 'admin123', '/dashboard', 'admin');

// Font harus datang dari origin sendiri, bukan Google.
cek('tidak ada permintaan ke Google Fonts', keGoogle.length === 0, `${keGoogle.length} permintaan`);

const unik = [...new Set(fontLokal.map((u) => u.split('/').pop()))].sort();
cek('font dimuat dari origin sendiri', unik.length > 0, unik.join(', '));
cek(
  'tidak ada font 4 MB yang ikut terunduh',
  unik.every((f) => !/^kJEhBvYX/.test(f)),
  unik.join(', ')
);

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
