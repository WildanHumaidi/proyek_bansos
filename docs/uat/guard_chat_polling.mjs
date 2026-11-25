import { chromium } from 'playwright-core';

/* Guard polling chat: balasan RT harus muncul di layar warga TANPA reload, dan
 * badge "belum dibaca" harus muncul di Beranda saat warga sedang tidak di tab
 * Diskusi.
 *
 * Sebelum perbaikan, pesan hanya dimuat sekali saat halaman dibuka — balasan baru
 * terlihat setelah reload manual. Sekarang ada polling 15 detik (berhenti saat tab
 * tidak terlihat), jadi guard ini menunggu sampai ~40 detik.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000/api';
const JEDA_POLLING = 45000; // > 15s interval, dengan margin untuk jitter

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 390, height: 780 } });

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

// Pengajuan milik warga01 — dipakai untuk mengirim pesan sebagai RT.
const statusRes = await page.request.get(`${API}/warga/status`, {
  headers: { Authorization: `Bearer ${warga.token}`, Accept: 'application/json' },
});
const statusBody = await statusRes.json();
const idPengajuan = statusBody?.data?.id_pengajuan;
if (!idPengajuan) {
  // Prasyarat lingkungan, bukan cacat produk — lihat catatan di guard_chat_belum_dibaca.
  console.log('LEWATI  prasyarat tidak terpenuhi: akun warga01 tidak punya pengajuan di database ini');
  console.log('        (guard ini butuh data seed demo; jalankan terhadap DB uji, bukan live)');
  await browser.close();
  console.log('\nRINGKAS: 0 pemeriksaan, 0 gagal, 1 dilewati (prasyarat)');
  process.exit(0);
}
console.log(`pengajuan warga01: #${idPengajuan}`);

const kirimSebagaiRT = async (teks) => {
  const r = await page.request.post(`${API}/chat/${idPengajuan}`, {
    data: { isi_pesan: teks },
    headers: { Authorization: `Bearer ${rt.token}`, Accept: 'application/json' },
  });
  if (!r.ok()) throw new Error(`kirim pesan gagal: HTTP ${r.status()}`);
};

// ── Masuk sebagai warga, buka tab Diskusi ──────────────────────────────────
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

await page.waitForFunction(
  () => [...document.querySelectorAll('.nav-tab, aside button')].some((b) => /Diskusi/.test(b.textContent)),
  null,
  { timeout: 25000 }
);
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.nav-tab, aside button')].find((x) => /Diskusi/.test(x.textContent));
  if (b) b.click();
});
await page.waitForFunction(() => /Diskusi dengan Ketua RT/.test(document.body.innerText), null, {
  timeout: 20000,
});
await page.waitForTimeout(1200);

// ── 1. Pesan baru muncul tanpa reload ──────────────────────────────────────
// Token unik per run: prefix saja tidak cukup, karena run sebelumnya meninggalkan
// pesan "Uji polling ..." di database dan akan membuat cek ini gagal palsu.
const teksUji = `Uji polling ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const sebelum = await page.evaluate((t) => document.body.innerText.includes(t), teksUji);
cek('pesan uji belum ada sebelum dikirim', sebelum === false);

await kirimSebagaiRT(teksUji);

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
cek('pesan RT muncul tanpa reload', muncul, `${detik}s`);
cek('halaman tidak di-reload (URL tetap /warga)', page.url().endsWith('/warga'));

// ── 2. Badge belum-dibaca muncul di Beranda ────────────────────────────────
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.nav-tab, aside button')].find((x) => /Beranda/.test(x.textContent));
  if (b) b.click();
});
await page.waitForTimeout(1500);

const teksUji2 = `Uji badge ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
await kirimSebagaiRT(teksUji2);

let badgeMuncul = false;
try {
  await page.waitForFunction(
    () => {
      const b = [...document.querySelectorAll('.nav-tab, aside button')].find((x) =>
        /Diskusi/.test(x.textContent)
      );
      // badge tampil sebagai angka setelah label "Diskusi"
      return b && /\d/.test(b.textContent.replace('Diskusi', ''));
    },
    null,
    { timeout: JEDA_POLLING }
  );
  badgeMuncul = true;
} catch {
  badgeMuncul = false;
}
cek('badge belum-dibaca muncul tanpa reload', badgeMuncul);

// ── 3. Membuka Diskusi menghapus badge & menandai dibaca di server ─────────
await page.evaluate(() => {
  const b = [...document.querySelectorAll('.nav-tab, aside button')].find((x) => /Diskusi/.test(x.textContent));
  if (b) b.click();
});
await page.waitForTimeout(2500);

const badgeSesudah = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.nav-tab, aside button')].find((x) => /Diskusi/.test(x.textContent));
  return b ? /\d/.test(b.textContent.replace('Diskusi', '')) : null;
});
cek('badge hilang setelah Diskusi dibuka', badgeSesudah === false);

const belumRes = await page.request.get(`${API}/chat/${idPengajuan}/belum-dibaca`, {
  headers: { Authorization: `Bearer ${warga.token}`, Accept: 'application/json' },
});
const belumBody = await belumRes.json();
cek('server mencatat 0 belum dibaca', belumBody.jumlah === 0, `jumlah=${belumBody.jumlah}`);

// ── 4. Pesan uji kedua juga terlihat (polling tetap jalan) ─────────────────
let muncul2 = false;
try {
  await page.waitForFunction((t) => document.body.innerText.includes(t), teksUji2, {
    timeout: JEDA_POLLING,
  });
  muncul2 = true;
} catch {
  muncul2 = false;
}
cek('pesan kedua muncul di tab Diskusi', muncul2);

// ── 5. Tidak ada duplikat setelah beberapa siklus polling ─────────────────
// Pesan yang dikirim dari UI ini dulu tetap bertanda `temp_id`, sehingga muncul
// ganda begitu polling menarik versi server. Cek setelah >1 siklus polling.
const teksKirim = `Kirim dari UI ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
await page.evaluate((t) => {
  const ta = document.querySelector('textarea, input[placeholder*="esan"], input[type="text"]');
  if (!ta) return;
  const proto = ta.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(ta, t);
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.closest('form')?.requestSubmit();
}, teksKirim);

await page.waitForFunction((t) => document.body.innerText.includes(t), teksKirim, { timeout: 15000 });
await page.waitForTimeout(32000); // >2 siklus polling 15s

const jumlahKemunculan = await page.evaluate((t) => {
  const main = document.querySelector('main') || document.body;
  const gelembung = [...main.querySelectorAll('div')].filter(
    (d) => d.children.length <= 2 && d.innerText.trim().startsWith(t)
  );
  return gelembung.length;
}, teksKirim);
cek('pesan tidak terduplikasi setelah polling', jumlahKemunculan === 1, `muncul ${jumlahKemunculan}×`);

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
