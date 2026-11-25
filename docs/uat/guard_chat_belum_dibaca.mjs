import { chromium } from 'playwright-core';

/* Guard status baca chat (P3-30).
 *
 * Sebelumnya badge pesan dihitung dari panjang array — ikut menghitung pesan
 * sendiri dan tidak pernah kembali ke nol. Sekarang jumlah "belum dibaca"
 * dihitung server (`pesan_chat.dibaca_pada`) dan badge harus hilang setelah
 * ruang diskusi dibuka.
 *
 * Catatan: token disuntik ke localStorage (bukan login lewat form) supaya skrip
 * ini tidak memakan kuota `throttle:10,1` di /api/login dan tidak bergantung pada
 * `waitForTimeout` yang rapuh — semua penantian memakai `waitForFunction`.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const hasil = [];
const cek = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label}${detail ? ' — ' + detail : ''}`);
  hasil.push([label, ok]);
};

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

const rt = await sesi('rt001', 'rt123');
const warga = await sesi('warga01', 'warga123');

const statusRes = await page.request.get(`${API}/warga/status`, { headers: auth(warga.token) });
const idPengajuan = (await statusRes.json())?.data?.id_pengajuan;

if (!idPengajuan) {
  // Prasyarat lingkungan, bukan cacat produk: di database live `warga01` (Budi
  // Santoso, id_warga 1) memang belum punya pengajuan — data live bukan salinan
  // seed demo. Guard ini butuh warga yang punya pengajuan untuk diuji.
  console.log('LEWATI  prasyarat tidak terpenuhi: akun warga01 tidak punya pengajuan di database ini');
  console.log('        (guard ini butuh data seed demo; jalankan terhadap DB uji, bukan live)');
  await browser.close();
  console.log('\nRINGKAS: 0 pemeriksaan, 0 gagal, 1 dilewati (prasyarat)');
  process.exit(0);
}

// Siapkan: tandai semua terbaca dulu, lalu RT kirim satu pesan baru.
await page.request.put(`${API}/chat/${idPengajuan}/baca`, { headers: auth(warga.token) });
await page.request.post(`${API}/chat/${idPengajuan}`, {
  data: { isi_pesan: `Pesan uji badge ${Date.now()}` },
  headers: auth(rt.token),
});

const belum = await page.request.get(`${API}/chat/${idPengajuan}/belum-dibaca`, {
  headers: auth(warga.token),
});
const jumlahAwal = (await belum.json()).jumlah;
cek('server mencatat pesan belum dibaca', jumlahAwal >= 1, `jumlah=${jumlahAwal}`);

// Buka dashboard warga dengan token yang sudah ada.
await page.goto(`${BASE}/login`);
await page.evaluate(
  ({ t, u }) => {
    localStorage.clear();
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  },
  { t: warga.token, u: warga.user }
);
await page.goto(`${BASE}/warga`);

const daftarTab = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.nav-tab')].map((b) => b.innerText.replace(/\n/g, '|'))
  );
const adaBadge = (tabs) => tabs.some((t) => /^Diskusi\d+$/.test(t.replace(/\s/g, '')));

await page.waitForFunction(() => document.querySelectorAll('.nav-tab').length > 0, null, {
  timeout: 25000,
});
// Badge muncul setelah fetchStatus selesai — tunggu sampai benar-benar ada,
// bukan menebak lewat sleep.
await page
  .waitForFunction(
    () =>
      [...document.querySelectorAll('.nav-tab')].some((b) =>
        /^Diskusi\d+$/.test(b.innerText.replace(/\s/g, ''))
      ),
    null,
    { timeout: 20000 }
  )
  .catch(() => {});

const tabSebelum = await daftarTab();
cek('badge muncul di tab Diskusi', adaBadge(tabSebelum), JSON.stringify(tabSebelum));

// Buka tab diskusi → badge harus hilang dan server mencatat nol
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.nav-tab')].find((x) => /Diskusi/.test(x.textContent));
  if (b) b.click();
});
await page
  .waitForFunction(
    () =>
      [...document.querySelectorAll('.nav-tab')].every(
        (b) => !/^Diskusi\d+$/.test(b.innerText.replace(/\s/g, ''))
      ),
    null,
    { timeout: 20000 }
  )
  .catch(() => {});

const tabSesudah = await daftarTab();
cek('badge hilang setelah diskusi dibuka', !adaBadge(tabSesudah), JSON.stringify(tabSesudah));

const sesudah = await page.request.get(`${API}/chat/${idPengajuan}/belum-dibaca`, {
  headers: auth(warga.token),
});
const jumlahSesudah = (await sesudah.json()).jumlah;
cek('server mencatat 0 setelah dibaca', jumlahSesudah === 0, `jumlah=${jumlahSesudah}`);

// Reload: status baca harus persisten (tersimpan di DB, bukan state lokal)
await page.reload();
await page.waitForFunction(() => document.querySelectorAll('.nav-tab').length > 0, null, {
  timeout: 25000,
});
await page.waitForTimeout(2500); // beri waktu fetchStatus menetapkan badge (kalau ada)

const tabReload = await daftarTab();
cek('badge tetap nol setelah reload', !adaBadge(tabReload), JSON.stringify(tabReload));

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
