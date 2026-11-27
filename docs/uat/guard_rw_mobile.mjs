import { chromium } from 'playwright-core';

/* Guard dashboard RW di HP.
 *
 * Kerusakan yang dijaga:
 *  1. Tabel selebar desktop dipotong di layar 360px — kolom paling kanan
 *     hilang dan isinya tidak bisa dibaca.
 *  2. Kartu statistik empat kolom / banner dipaksa muat, teks berdesakan.
 *  3. Tombol aksi di header (Cetak / Unduh / Hitung Ulang) terdorong ke luar
 *     layar sehingga tidak bisa ditekan.
 *
 * Kriteria lulus: tidak ada scroll horizontal, tidak ada tombol yang pusatnya
 * di luar viewport, tidak ada sel/teks yang terpotong, tombol ≥ 40px.
 */
const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';
const LEBAR = Number(process.env.UJI_LEBAR || 360);

const TABS = ['Beranda', 'Database Warga', 'Pengaduan', 'Perangkingan SAW'];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: LEBAR, height: 740 }, deviceScaleFactor: 2 });

const hasil = [];
const cek = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label}${detail ? ` — ${detail}` : ''}`);
  hasil.push([label, ok]);
};

const r = await page.request.post(`${API}/login`, {
  data: { username: process.env.RW_USER || 'rw08', password: process.env.RW_PASS || 'rw123' },
  headers: { Accept: 'application/json' },
});
const s = await r.json();
if (!s.token) throw new Error('login RW gagal (cek kredensial / batas throttle)');
await page.goto(`${BASE}/login`);
await page.evaluate(({ t, usr }) => {
  localStorage.clear();
  localStorage.setItem('token', t);
  localStorage.setItem('user', JSON.stringify(usr));
}, { t: s.token, usr: s.user });
await page.goto(`${BASE}/rw`);
await page.waitForTimeout(3200);

const DIAG = () =>
  page.evaluate(() => {
    const vw = innerWidth;
    // Sidebar memang sengaja di luar layar (translateX(-102%)); jangan dihitung.
    const area = 'main button, main a, header button, header a';
    const luar = [];
    for (const b of document.querySelectorAll(area)) {
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
    const tinggiKecil = [...document.querySelectorAll('main td button, main td a, header button')]
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
  cek(`${t}: tidak ada teks terpotong`, o.terpotong.length === 0, o.terpotong.join(' | '));
  cek(`${t}: tombol aksi minimal 40px`, o.tinggiKecil === 0, `${o.tinggiKecil} tombol pendek`);
}

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal (lebar uji ${LEBAR}px)`);
process.exit(gagal === 0 ? 0 : 1);
