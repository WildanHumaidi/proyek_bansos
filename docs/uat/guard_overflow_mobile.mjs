import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
const SHOTS = 'E:/Projects/proyek_bansos/docs/screenshots';

const chunks = [];
const login = async (user, pass) => {
  await page.goto('http://127.0.0.1:5173/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://127.0.0.1:5173/login');
  await page.waitForTimeout(450);
  await page.fill('input[placeholder*="username"]', user);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  // Tunggu kerangka dashboard terpasang; jeda tetap saja bisa menangkap halaman
  // yang masih memuat sehingga navigasi berikutnya tidak menemukan tombol.
  await page.waitForSelector('.nav-tab, aside, main', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
};

const check = async (label) => {
  const o = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    vw: innerWidth,
    bad: document.documentElement.scrollWidth > innerWidth + 1,
  }));
  chunks.push(`${o.bad ? 'OVERFLOW' : 'ok      '} ${label} (${o.scrollW}/${o.vw})`);
  return o;
};

const clickNav = async (re) => {
  // Tunggu tombolnya benar-benar ada; kalau tidak, klik tidak terjadi dan guard
  // memeriksa halaman yang salah (dulu: kuesioner diperiksa padahal masih Beranda).
  await page
    .waitForFunction(
      (pat) => [...document.querySelectorAll('.nav-tab, aside button')].some((x) => new RegExp(pat).test(x.textContent)),
      re,
      { timeout: 20000 }
    )
    .catch(() => {});
  await page.evaluate((pat) => {
    const b = [...document.querySelectorAll('.nav-tab, aside button')].find((x) => new RegExp(pat).test(x.textContent));
    if (b) b.click();
  }, re);
  await page.waitForTimeout(1000);
};

// publik + bantuan teks baru
await page.goto('http://127.0.0.1:5173/login');
await page.waitForTimeout(1200);
await check('login');
await page.screenshot({ path: `${SHOTS}/uat_13_login_bantuan_360.png` });
const loginHelp = await page.evaluate(() => document.body.innerText.includes('Hubungi Ketua RT'));
const loginBtn = await page.evaluate(() => document.body.innerText.includes('Belum punya akun? Daftar di sini'));
console.log('login: teks bantuan lupa sandi =', loginHelp, '| tombol daftar =', loginBtn);

await page.goto('http://127.0.0.1:5173/register');
await page.waitForTimeout(1000);
await check('register');
await page.screenshot({ path: `${SHOTS}/uat_14_register_bantuan_360.png` });
const regHelp = await page.evaluate(() => document.body.innerText.includes('wajib diisi'));
const regLink = await page.evaluate(() => document.body.innerText.includes('Masuk di sini'));
console.log('register: teks wajib diisi =', regHelp, '| tautan masuk =', regLink);

// tenant flows
await login('warga01', 'warga123');
await check('warga:beranda');
await clickNav('Kuesioner');
// Isi kuesioner dimuat async (GET /warga/status). Tanpa menunggu, guard mengukur
// dan memotret halaman yang masih menampilkan spinner "Memuat data pengajuan...".
await page
  .waitForFunction(() => !/Memuat data pengajuan/.test(document.body.innerText), null, { timeout: 20000 })
  .catch(() => {});
await check('warga:kuesioner');
await page.screenshot({ path: `${SHOTS}/uat_15_warga_kuesioner_360.png` });
await clickNav('^Status$');
await check('warga:status');
await clickNav('Diskusi');
await check('warga:diskusi');

await login('rt001', 'rt123');
await check('rt:beranda');
await login('rw08', 'rw123');
await check('rw:beranda');
await login('admin', 'admin123');
await check('admin:beranda');

await browser.close();
console.log(chunks.map((c) => '  ' + c).join('\n'));
const bad = chunks.filter((c) => c.startsWith('OVERFLOW')).length;
console.log(`RINGKAS: ${chunks.length} halaman diperiksa, ${bad} overflow`);
