import { chromium } from 'playwright-core';

/* Guard dashboard RT di HP.
 *
 * Dua kegagalan nyata yang dijaga di sini:
 *  1. Tabel selebar desktop dipotong, sehingga kolom Aksi (Tombol "Tinjau")
 *     berada di luar layar — Ketua RT bisa melihat daftar tapi tidak bisa
 *     memverifikasi apa pun.
 *  2. Kartu statistik/banner berdesakan karena grid empat kolom dipaksa muat.
 *
 * Kriteria lulus: tidak ada tombol/tautan aksi yang pusatnya di luar viewport,
 * tidak ada sel tabel yang isinya terpotong, tidak ada scroll horizontal.
 */
const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';
const LEBAR = Number(process.env.UJI_LEBAR || 360);

const TABS = ['Beranda', 'Data Warga', 'Input Kuesioner', 'Verifikasi', 'Pengaduan', 'Hasil Rekomendasi'];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: LEBAR, height: 740 }, deviceScaleFactor: 2 });

const hasil = [];
const cek = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label}${detail ? ` — ${detail}` : ''}`);
  hasil.push([label, ok]);
};

const r = await page.request.post(`${API}/login`, {
  data: { username: process.env.RT_USER || 'rt001', password: process.env.RT_PASS || 'rt123' },
  headers: { Accept: 'application/json' },
});
const s = await r.json();
if (!s.token) throw new Error('login RT gagal (cek kredensial / batas throttle)');
await page.goto(`${BASE}/login`);
await page.evaluate(({ t, usr }) => {
  localStorage.clear();
  localStorage.setItem('token', t);
  localStorage.setItem('user', JSON.stringify(usr));
}, { t: s.token, usr: s.user });
await page.goto(`${BASE}/rt`);
await page.waitForTimeout(3200);

const DIAG = () =>
  page.evaluate(() => {
    const vw = innerWidth;
    const luar = [];
    for (const b of document.querySelectorAll('main button, main a')) {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.x + r.width / 2 > vw || r.x + r.width / 2 < 0) {
        luar.push(b.textContent.trim().replace(/\s+/g, ' ').slice(0, 24));
      }
    }
    const terpotong = [];
    for (const td of document.querySelectorAll('main td')) {
      const cs = getComputedStyle(td);
      if (cs.overflow === 'hidden' && td.scrollWidth > td.clientWidth + 4) {
        terpotong.push((td.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30));
      }
    }
    const tinggiKecil = [...document.querySelectorAll('main td button, main td a')]
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

for (const t of TABS) {
  await page.evaluate((label) => {
    const b = [...document.querySelectorAll('aside button')].find((x) => x.textContent.includes(label));
    if (b) b.click();
  }, t);
  await page.waitForTimeout(2600);
  const o = await DIAG();
  cek(`${t}: tanpa scroll horizontal`, o.scrollW <= o.vw + 1, `${o.scrollW}/${o.vw}`);
  cek(`${t}: semua tombol di dalam layar`, o.luar.length === 0, o.luar.join(' | '));
  cek(`${t}: tidak ada sel terpotong`, o.terpotong.length === 0, o.terpotong.join(' | '));
  cek(`${t}: tombol aksi minimal 40px`, o.tinggiKecil === 0, `${o.tinggiKecil} tombol pendek`);
}

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal (lebar uji ${LEBAR}px)`);
process.exit(gagal === 0 ? 0 : 1);