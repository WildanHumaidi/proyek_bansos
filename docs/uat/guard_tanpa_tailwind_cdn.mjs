import { chromium } from 'playwright-core';

/* Guard: tidak ada gaya yang bergantung pada Tailwind CDN.
 *
 * CDN Tailwind sudah dihapus (seluruh kelas di aplikasi ini didefinisikan sendiri
 * di <style> per halaman; hanya `select-none` yang benar-benar utilitas Tailwind
 * dan sekarang ada di index.css). Guard ini memastikan tidak ada lagi permintaan
 * ke cdn.tailwindcss.com dan tidak ada kelas yang gayanya kosong.
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

// Rekam setiap permintaan jaringan agar CDN bisa dideteksi.
const permintaanCDN = [];
page.on('request', (req) => {
  if (/cdn\.tailwindcss\.com/.test(req.url())) permintaanCDN.push(req.url());
});

const auth = (token) => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' });

const sesi = async (username, password) => {
  const res = await page.request.post(`${API}/login`, {
    data: { username, password },
    headers: { Accept: 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!body.token) {
    throw new Error(
      res.status() === 429
        ? `batas login 10/menit tercapai untuk ${username} — tunggu ~60 detik`
        : `login ${username} gagal: ${JSON.stringify(body).slice(0, 120)}`
    );
  }
  return body;
};

/** Kelas di DOM yang berpola utilitas Tailwind.
 *
 * Setelah CDN dihapus, kelas seperti `flex`, `p-4`, `text-sm`, `gap-2` tidak akan
 * punya aturan CSS sama sekali — elemennya tetap tampil tapi tanpa gaya, yang
 * gejalanya halus dan mudah lolos. Guard ini menangkap pola tersebut.
 *
 * Kelas custom (`rt-main`, `ld-btn`, `card`, …) TIDAK dianggap masalah walau
 * kebetulan tidak punya aturan: beberapa di antaranya memang kelas mati yang
 * sudah ada sebelumnya dan tidak berdampak visual.
 */
const UTILITAS_TAILWIND = () => {
  const POLA = [
    /^(flex|grid|block|inline|inline-block|inline-flex|hidden|contents|table)$/,
    /^(static|fixed|absolute|relative|sticky)$/,
    /^(items|justify|content|self|place)-(start|end|center|between|around|evenly|stretch|baseline|normal|auto)/,
    /^(flex|grid)-(row|col|wrap|nowrap|1|auto|none)/,
    /^gap(-[xy])?-\d/,
    /^[pm][xytrbl]?-\d/,
    /^(w|h|min-w|min-h|max-w|max-h)-/,
    /^(text|bg|border|ring|from|via|to)-(xs|sm|base|lg|xl|\d?xl|black|white|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/,
    /^font-(thin|light|normal|medium|semibold|bold|extrabold|black|mono|sans|serif)$/,
    /^rounded(-|$)/,
    /^shadow(-|$)/,
    /^(opacity|z|order|col|row|basis|grow|shrink)-\d/,
    /^(overflow|truncate|whitespace|break|leading|tracking|uppercase|lowercase|capitalize|italic|underline|line-through)-?/,
    /^(sm|md|lg|xl|2xl):/,
    /^(hover|focus|active|disabled|group-hover):/,
    /^(space|divide)-[xy]-\d/,
    /^(cursor|select|pointer-events|transition|duration|ease|animate)-/,
  ];

  const terpakai = new Set();
  for (const el of document.querySelectorAll('[class]')) {
    for (const k of el.classList) terpakai.add(k);
  }
  // `select-none` satu-satunya utilitas Tailwind yang benar-benar dipakai; sudah
  // dipindahkan ke src/index.css sehingga tetap berfungsi tanpa CDN.
  const DIKECUALIKAN = new Set(['select-none']);
  return [...terpakai]
    .filter((k) => !DIKECUALIKAN.has(k) && POLA.some((re) => re.test(k)))
    .sort();
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
  await page.waitForTimeout(2500);

  const utilitas = await page.evaluate(UTILITAS_TAILWIND);
  cek(`${label}: tidak ada kelas utilitas Tailwind`, utilitas.length === 0, JSON.stringify(utilitas));
};

// Halaman publik dulu (tanpa login)
await page.goto(`${BASE}/`);
await page.waitForTimeout(2500);
const utilitasPublik = await page.evaluate(UTILITAS_TAILWIND);
cek('landing: tidak ada kelas utilitas Tailwind', utilitasPublik.length === 0, JSON.stringify(utilitasPublik));

await kunjungi('warga01', 'warga123', '/warga', 'warga');
await kunjungi('rt001', 'rt123', '/rt', 'rt');
await kunjungi('rw08', 'rw123', '/rw', 'rw');
await kunjungi('admin', 'admin123', '/dashboard', 'admin');

// Verifikasi `select-none` (satu-satunya utilitas Tailwind yang dipakai) masih berlaku
await page.goto(`${BASE}/login`);
const selectNoneAktif = await page.evaluate(() => {
  const probe = document.createElement('span');
  probe.className = 'select-none';
  probe.textContent = 'x';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const nilai = cs.userSelect || cs.webkitUserSelect;
  probe.remove();
  return nilai;
});
cek('utilitas select-none tetap berlaku', selectNoneAktif === 'none', `user-select=${selectNoneAktif}`);

cek('tidak ada permintaan ke CDN Tailwind', permintaanCDN.length === 0, `${permintaanCDN.length} permintaan`);

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
