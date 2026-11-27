import { chromium } from 'playwright-core';

/* Guard dashboard Admin di HP.
 *
 * Temuan sapuan 360px sebelumnya:
 *  - tombol Kalkulasi SAW di Beranda berada di x=337 (luar layar);
 *  - edit/delete Data Kuesioner di x=1314, Kelola Akun di x=764–802;
 *  - span jawaban kuesioner dipotong 70px;
 *  - header kartu (Top 5, Activity Log) terpotong.
 *
 * Matriks SAW 10 kriteria sengaja tetap berupa tabel lebar dan digeser
 * horizontal DI DALAM kartu — halaman sendiri tidak boleh ikut melebar.
 */
const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';
const LEBAR = Number(process.env.UJI_LEBAR || 360);

const TABS = [
  'Beranda',
  'Data Kuesioner',
  'Matriks SAW',
  'Pengaduan',
  'Hasil Keputusan',
  'Kelola Kriteria',
  'Kelola Akun',
  'Activity Log',
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: LEBAR, height: 760 }, deviceScaleFactor: 2 });

const hasil = [];
const cek = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label}${detail ? ` — ${detail}` : ''}`);
  hasil.push([label, ok]);
};

const r = await page.request.post(`${API}/login`, {
  data: { username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'admin' },
  headers: { Accept: 'application/json' },
});
const s = await r.json();
if (!s.token) throw new Error('login admin gagal (cek kredensial / batas throttle)');
await page.goto(`${BASE}/login`);
await page.evaluate(({ t, usr }) => {
  localStorage.clear();
  localStorage.setItem('token', t);
  localStorage.setItem('user', JSON.stringify(usr));
}, { t: s.token, usr: s.user });
await page.goto(`${BASE}/dashboard`);
await page.waitForTimeout(3400);

const DIAG = () =>
  page.evaluate(() => {
    const vw = innerWidth;
    const luar = [];
    for (const b of document.querySelectorAll('main button, main a, main label, header button, header a')) {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.x + r.width / 2 > vw || r.x + r.width / 2 < 0) {
        luar.push(b.textContent.trim().replace(/\s+/g, ' ').slice(0, 24));
      }
    }
    const terpotong = [];
    for (const el of document.querySelectorAll('main td, main th, main h2, main h3, .mob-card-head > div')) {
      const cs = getComputedStyle(el);
      if (cs.overflow === 'hidden' && el.scrollWidth > el.clientWidth + 4) {
        terpotong.push((el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30));
      }
    }
    const tinggiKecil = [...document.querySelectorAll('main td button, main td a, header button, header a, header label')]
      .map((el) => Math.round(el.getBoundingClientRect().height))
      .filter((h) => h > 0 && h < 40).length;
    return {
      scrollW: document.documentElement.scrollWidth,
      vw,
      luar: luar.slice(0, 6),
      terpotong: terpotong.slice(0, 6),
      tinggiKecil,
    };
  });

const cekKhusus = async (tab) => {
  if (tab === 'Beranda') {
    const o = await page.evaluate(() => {
      const grid = document.querySelector('main .mob-stat-grid');
      return {
        kartu: grid ? grid.children.length : 0,
        kolom: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : 0,
      };
    });
    cek('Beranda: 4 kartu statistik jadi 2 kolom', o.kartu === 4 && o.kolom === 2, `${o.kartu} kartu / ${o.kolom} kolom`);
  }

  if (tab === 'Data Kuesioner') {
    const o = await page.evaluate(() => {
      const t = document.querySelector('main table.mob-table');
      const thead = t?.querySelector('thead');
      const sel = document.querySelector('main td .jawaban-sel');
      return {
        ada: !!t,
        thead: thead ? getComputedStyle(thead).display : null,
        jawabanBebas: sel ? getComputedStyle(sel).whiteSpace === 'normal' && getComputedStyle(sel).overflow === 'visible' : null,
      };
    });
    cek('Data Kuesioner: tabel jadi kartu', o.ada && o.thead === 'none', `thead=${o.thead}`);
    cek('Data Kuesioner: jawaban tidak dipotong', o.jawabanBebas === true, String(o.jawabanBebas));
  }

  if (tab === 'Matriks SAW') {
    const o = await page.evaluate(() => {
      const t = document.querySelector('main table');
      const wrap = t?.parentElement;
      const hint = document.querySelector('main .mob-scroll-hint');
      return {
        thead: t?.querySelector('thead') ? getComputedStyle(t.querySelector('thead')).display : null,
        bisaGeser: wrap ? wrap.scrollWidth > wrap.clientWidth + 4 : false,
        hint: hint ? getComputedStyle(hint).display !== 'none' : false,
      };
    });
    cek('Matriks: tabel tetap tabel (thead tampil)', o.thead === 'table-header-group', String(o.thead));
    cek('Matriks: bisa digeser dalam kartu', o.bisaGeser, String(o.bisaGeser));
    cek('Matriks: ada petunjuk geser', o.hint, String(o.hint));
  }
};

for (const t of TABS) {
  await page.evaluate((label) => {
    const b = [...document.querySelectorAll('aside button')].find((x) => x.textContent.includes(label));
    if (b) b.click();
  }, t);
  await page.waitForTimeout(2900);
  const o = await DIAG();
  cek(`${t}: tanpa scroll horizontal`, o.scrollW <= o.vw + 1, `${o.scrollW}/${o.vw}`);
  cek(`${t}: semua tombol di dalam layar`, o.luar.length === 0, o.luar.join(' | '));
  cek(`${t}: tidak ada teks terpotong`, o.terpotong.length === 0, o.terpotong.join(' | '));
  cek(`${t}: target sentuh minimal 40px`, o.tinggiKecil === 0, `${o.tinggiKecil} tombol pendek`);
  await cekKhusus(t);
}

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal (lebar uji ${LEBAR}px)`);
process.exit(gagal === 0 ? 0 : 1);