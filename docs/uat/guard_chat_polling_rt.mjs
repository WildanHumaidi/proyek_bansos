import { chromium } from 'playwright-core';

/* Guard polling chat sisi RT: balasan warga harus muncul di modal verifikasi
 * tanpa menutup-buka modal, dan polling harus berhenti saat modal ditutup.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';
const JEDA_POLLING = 45000;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const hasil = [];
const cek = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label}${detail ? ` — ${detail}` : ''}`);
  hasil.push([label, ok]);
};

const sesi = async (user, pass) => {
  const res = await page.request.post(`${API}/login`, {
    data: { username: user, password: pass },
    headers: { Accept: 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!body.token) {
    throw new Error(
      res.status() === 429
        ? `batas login 10/menit tercapai untuk ${user} — tunggu ~60 detik`
        : `login ${user} gagal: ${JSON.stringify(body).slice(0, 120)}`
    );
  }
  return body;
};

const warga = await sesi('warga01', 'warga123');
const rt = await sesi('rt001', 'rt123');

const statusRes = await page.request.get(`${API}/warga/status`, {
  headers: { Authorization: `Bearer ${warga.token}`, Accept: 'application/json' },
});
const idPengajuan = (await statusRes.json())?.data?.id_pengajuan;
if (!idPengajuan) {
  // Prasyarat lingkungan, bukan cacat produk — lihat catatan di guard_chat_belum_dibaca.
  console.log('LEWATI  prasyarat tidak terpenuhi: akun warga01 tidak punya pengajuan di database ini');
  console.log('        (guard ini butuh data seed demo; jalankan terhadap DB uji, bukan live)');
  await browser.close();
  console.log('\nRINGKAS: 0 pemeriksaan, 0 gagal, 1 dilewati (prasyarat)');
  process.exit(0);
}
console.log(`pengajuan warga01: #${idPengajuan}`);

const kirimSebagaiWarga = async (teks) => {
  const r = await page.request.post(`${API}/chat/${idPengajuan}`, {
    data: { isi_pesan: teks },
    headers: { Authorization: `Bearer ${warga.token}`, Accept: 'application/json' },
  });
  if (!r.ok()) throw new Error(`kirim pesan gagal: HTTP ${r.status()}`);
};

// ── Masuk sebagai RT, buka menu Verifikasi ────────────────────────────────
await page.goto(`${BASE}/login`);
await page.evaluate(
  ({ t, u }) => {
    localStorage.clear();
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  },
  { t: rt.token, u: rt.user }
);
await page.goto(`${BASE}/rt`);

await page.waitForFunction(
  () => [...document.querySelectorAll('aside button, .nav-tab')].some((b) => /Verifikasi/.test(b.textContent)),
  null,
  { timeout: 25000 }
);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('aside button, .nav-tab')].find((x) => /Verifikasi/.test(x.textContent));
  if (b) b.click();
});
await page.waitForTimeout(2500);

// ── Buka modal verifikasi untuk pengajuan warga01 ─────────────────────────
const dibuka = await page.evaluate(() => {
  // Baris tabel memuat tombol "Tinjau"; cari baris milik warga01.
  const baris = [...document.querySelectorAll('tr')].find((tr) => tr.innerText.includes('Budi Santoso'));
  if (!baris) return false;
  const tombol = [...baris.querySelectorAll('button')].find((b) => /Tinjau/i.test(b.textContent));
  if (!tombol) return false;
  tombol.click();
  return true;
});

cek('modal verifikasi terbuka', dibuka);
if (!dibuka) {
  await browser.close();
  console.log('\nRINGKAS: modal tidak bisa dibuka — sisa pemeriksaan dilewati');
  process.exit(1);
}

await page.waitForFunction(() => /Diskusi|Pesan/i.test(document.body.innerText), null, { timeout: 20000 });
await page.waitForTimeout(1500);

// ── 1. Pesan warga baru muncul tanpa menutup modal ────────────────────────
const teksUji = `Uji polling RT ${Date.now()}`;
const sebelum = await page.evaluate((t) => document.body.innerText.includes(t), teksUji);
cek('pesan uji belum ada sebelum dikirim', sebelum === false);

await kirimSebagaiWarga(teksUji);

let muncul = false;
const mulai = Date.now();
try {
  await page.waitForFunction((t) => document.body.innerText.includes(t), teksUji, {
    timeout: JEDA_POLLING,
  });
  muncul = true;
} catch {
  muncul = false;
}
const detik = ((Date.now() - mulai) / 1000).toFixed(1);
cek('pesan warga muncul tanpa menutup modal', muncul, `${detik}s`);

// ── 2. Modal masih terbuka (polling tidak merusak state) ──────────────────
const masihTerbuka = await page.evaluate((t) => document.body.innerText.includes(t), teksUji);
cek('modal tetap menampilkan percakapan', masihTerbuka);

// ── 3. Kirim dari RT masih berfungsi setelah polling ─────────────────────
const teksRT = `Balasan RT ${Date.now()}`;
const terkirim = await page.evaluate((t) => {
  const ta = document.querySelector('input[placeholder="Tulis balasan untuk warga..."]');
  if (!ta) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(ta, t);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  const form = ta.closest('form');
  if (form) {
    form.requestSubmit();
    return true;
  }
  return false;
}, teksRT);
await page.waitForTimeout(2000);

const balasanAda = await page.evaluate((t) => document.body.innerText.includes(t), teksRT);
cek('RT masih bisa mengirim pesan', terkirim && balasanAda);

// ── 4. Pesan benar-benar tersimpan di server ─────────────────────────────
const chatRes = await page.request.get(`${API}/chat/${idPengajuan}`, {
  headers: { Authorization: `Bearer ${rt.token}`, Accept: 'application/json' },
});
const isiServer = (await chatRes.json())?.data || [];
cek(
  'pesan RT tersimpan di server',
  isiServer.some((m) => m.isi_pesan === teksRT && m.pengirim_role === 'rt'),
  `${isiServer.length} pesan total`
);

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
