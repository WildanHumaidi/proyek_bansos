import { chromium } from 'playwright-core';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Guard subset ikon Material Symbols.
 *
 * Kenapa ada: subset di `public/fonts/material-symbols-subset.woff2` hanya berisi
 * ikon yang dipakai. Nama ikon yang TIDAK ada di subset tetap dirender sebagai
 * teks biasa — jadi tombol mata di /login dan /register tampil sebagai tulisan
 * "visibility_off" (terbaca "OFF"), bukan ikon.
 *
 * Celah yang dibiarkan guard lama: `guard_font_self_hosted.mjs` hanya menyapu
 * halaman setelah login (/, /warga, /rt, /rw, /dashboard), tidak pernah
 * /login dan /register. Selain itu nama ikon di `name={showPw ? 'visibility' :
 * 'visibility_off'}` tidak tertangkap grep statis `name="..."`, sehingga tidak
 * pernah masuk daftar subset saat font dibuat ulang.
 *
 * Guard ini menutup dua celah itu: ia membaca SEMUA nama ikon dari sumber
 * (termasuk yang dinamis), lalu memeriksa satu per satu apakah glyph-nya benar
 * ada di font — di halaman yang benar-benar memakainya.
 */

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';
const SRC = process.env.SRC_DIR || resolve(dirname(fileURLToPath(import.meta.url)), '../../bansos-frontend/src');

const hasil = [];
const cek = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS ' : 'GAGAL'} ${label}${detail ? ` — ${detail}` : ''}`);
  hasil.push([label, ok]);
};

/** Kumpulkan nama ikon dari seluruh sumber frontend. */
const kumpulkanIkon = (dir) => {
  const nama = new Set();
  const tambah = (m) => m && nama.add(m);
  const berkas = [];

  const jelajah = (d) => {
    for (const entri of readdirSync(d)) {
      const p = join(d, entri);
      if (statSync(p).isDirectory()) jelajah(p);
      else if (/\.(jsx|js)$/.test(entri)) berkas.push(p);
    }
  };
  jelajah(dir);

  for (const p of berkas) {
    const isi = readFileSync(p, 'utf8');
    // <MI name="home" /> — dipakai untuk ikon di komponen MI.
    for (const m of isi.matchAll(/\bname="([a-z][a-z0-9_]*)"/g)) tambah(m[1]);
    // icon="home" / icon: 'home' — konfigurasi menu & array data.
    for (const m of isi.matchAll(/\bicon="([a-z][a-z0-9_]*)"/g)) tambah(m[1]);
    for (const m of isi.matchAll(/\bicon:\s*'([a-z][a-z0-9_]*)'/g)) tambah(m[1]);
    // name={kondisi ? 'visibility' : 'visibility_off'} — nama dinamis; inilah
    // yang dulu lolos. Semua string di dalam kurung kurawal ikut diambil.
    for (const m of isi.matchAll(/\bname=\{([^}]*)\}/g)) {
      for (const s of m[1].matchAll(/'([a-z][a-z0-9_]*)'/g)) tambah(s[1]);
    }
  }

  return [...nama].sort();
};

let ikon = [];
try {
  ikon = kumpulkanIkon(SRC);
} catch (e) {
  console.error(`Folder sumber tidak terbaca: ${SRC} — set SRC_DIR ke <repo>/bansos-frontend/src.`);
  process.exit(2);
}
if (ikon.length === 0) {
  console.error(`Tidak ada nama ikon terbaca dari ${SRC} — cek SRC_DIR.`);
  process.exit(2);
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

/** Ukur lebar glyph tiap nama ikon: 1 ligatur = 1 glyph (~24px), kata = 45px+. */
const PROBE = (nama) => {
  const kotak = document.createElement('span');
  kotak.className = 'material-symbols-outlined';
  kotak.style.cssText = 'position:absolute;visibility:hidden;font-size:24px';
  document.body.appendChild(kotak);
  const keluar = nama.map((n) => {
    kotak.textContent = n;
    const r = kotak.getBoundingClientRect();
    return { n, w: +r.width.toFixed(1), rasio: +(r.width / 24).toFixed(2) };
  });
  kotak.remove();
  return keluar;
};

/** Sapu ikon yang benar-benar terpasang di DOM halaman aktif. */
const SAPU_DOM = () =>
  [...document.querySelectorAll('.material-symbols-outlined')]
    .map((el) => {
      const r = el.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(el).fontSize) || 24;
      return { t: el.textContent.trim(), w: Math.round(r.width), rasio: +(r.width / fs).toFixed(2) };
    })
    .filter((o) => o.w > 0 && o.rasio > 2)
    .slice(0, 8);

const buka = async (path) => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
};

await buka('/login');

// 1. Font ikon harus benar-benar termuat sebelum pengukuran bermakna.
await page.evaluate(() => document.fonts.load('400 24px "Material Symbols Outlined"'));
await page.evaluate(() => document.fonts.ready);
const siap = await page.evaluate(() =>
  [...document.fonts].some((f) => f.family.includes('Material Symbols') && f.status === 'loaded')
);
cek('font Material Symbols termuat', siap);

// 2. Semua nama ikon di sumber harus punya glyph (termasuk yang dinamis).
const ukur = await page.evaluate(PROBE, ikon);
const hilang = ukur.filter((o) => o.rasio > 2 || o.w === 0);
cek(
  `semua ${ikon.length} nama ikon dari sumber punya glyph`,
  hilang.length === 0,
  hilang.length ? `${hilang.length} tidak ada: ${hilang.map((o) => `${o.n} (${o.w}px)`).join(', ')}` : ''
);

// 3. Halaman publik (yang tidak pernah disapu guard lama) harus bersih.
for (const path of ['/', '/login', '/register']) {
  await buka(path);
  const rusak = await page.evaluate(SAPU_DOM);
  cek(`${path}: tidak ada ikon tampil sebagai teks`, rusak.length === 0, JSON.stringify(rusak));
}

// 4. Tombol mata harus berganti ikon di kedua keadaan, bukan cuma satu.
for (const path of ['/login', '/register']) {
  await buka(path);
  const jumlah = await page.evaluate(
    () => document.querySelectorAll('span.material-symbols-outlined').length
  );
  const tombol = await page.$$('button');
  let diuji = 0;
  for (const b of tombol) {
    const isi = (await b.innerText()).trim();
    if (!/^visibility/.test(isi)) continue;
    await b.click();
    await page.waitForTimeout(250);
    diuji++;
    const rusak = await page.evaluate(SAPU_DOM);
    cek(`${path}: ikon mata setelah diklik (${isi})`, rusak.length === 0, JSON.stringify(rusak));
  }
  cek(`${path}: tombol mata ditemukan (${jumlah} ikon total)`, diuji > 0, `tombol diuji: ${diuji}`);
}

await browser.close();

const gagal = hasil.filter(([, ok]) => !ok).length;
console.log(`\nRINGKAS: ${hasil.length} pemeriksaan, ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);