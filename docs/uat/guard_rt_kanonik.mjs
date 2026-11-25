import { chromium } from 'playwright-core';

/* Guard kanonikalisasi RT (P2-04).
 *
 * Frontend dulu menormalkan RT sendiri-sendiri (padStart(2), Number(), string
 * compare), sehingga satu wilayah bisa tampil "RT 01" di satu tempat dan "1" di
 * tempat lain. Skrip ini memastikan seluruh label RT di UI memakai format dua
 * digit dan nilai yang dikirim ke API sudah tiga digit.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const masuk = async (user, pass) => {
  await page.goto(`${BASE}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(600);
  await page.fill('input[placeholder*="username"]', user);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2400);
};

const menu = async (pat) => {
  await page.evaluate((p) => {
    const b = [...document.querySelectorAll('aside button, .nav-tab')].find((x) =>
      new RegExp(p).test(x.textContent)
    );
    if (b) b.click();
  }, pat);
  await page.waitForTimeout(1800);
};

/* Label wilayah RT di UI harus "RT 01" (dua digit).
 *
 * Pengecualian: nama akun seperti "Ketua RT 001" berasal dari kolom `name` user,
 * bukan label wilayah — itu dibiarkan apa adanya. Karena itu angka tiga digit
 * hanya ditandai bila node teksnya PERSIS "RT 001" (label wilayah murni). */
const periksaLabel = async (label) => {
  const o = await page.evaluate(() => {
    const salah = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent.trim();
      const m = t.match(/RT\s+(\d+)/g);
      if (!m) continue;
      for (const hit of m) {
        const angka = hit.replace(/RT\s+/, '');
        const nodeMurni = t === hit;
        if (angka.length === 1) {
          salah.push({ txt: t.slice(0, 40), hit, alasan: 'satu digit' });
        } else if (angka.length === 3 && nodeMurni) {
          salah.push({ txt: t.slice(0, 40), hit, alasan: 'tiga digit sebagai label wilayah' });
        }
      }
    }
    return salah;
  });
  const ok = o.length === 0;
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label} — ${o.length} label RT tidak kanonik`);
  if (!ok) console.log('        ', o.slice(0, 6));
  return ok;
};

const hasil = [];

await masuk('rt001', 'rt123');
hasil.push(['rt:beranda', await periksaLabel('rt:beranda')]);
await menu('Hasil Rekomendasi');
hasil.push(['rt:ranking', await periksaLabel('rt:ranking')]);

await masuk('rw08', 'rw123');
hasil.push(['rw:beranda', await periksaLabel('rw:beranda')]);
await menu('Perangkingan');
hasil.push(['rw:ranking', await periksaLabel('rw:ranking')]);

await masuk('admin', 'admin123');
await menu('Hasil Keputusan');
hasil.push(['admin:ranking', await periksaLabel('admin:ranking')]);
await menu('Kelola Akun');
hasil.push(['admin:users', await periksaLabel('admin:users')]);

// Warga: nilai select RT harus kanonik tiga digit
await masuk('warga01', 'warga123');
await menu('Kuesioner');
const opsi = await page.evaluate(() =>
  [...document.querySelectorAll('select option')]
    .map((o) => o.value)
    .filter((v) => v !== '')
);
const opsiOk = opsi.every((v) => /^\d{3}$/.test(v));
console.log(`${opsiOk ? 'PASS ' : 'GAGAL'} warga:kuesioner — nilai select RT ${JSON.stringify(opsi)}`);
hasil.push(['warga:kuesioner-select', opsiOk]);
hasil.push(['warga:label', await periksaLabel('warga:kuesioner')]);

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
