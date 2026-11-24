import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 360, height: 740 } });

const loginAs = async (user, pass) => {
  await page.goto('http://127.0.0.1:5173/login');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://127.0.0.1:5173/login');
  await page.waitForTimeout(500);
  await page.fill('input[placeholder*="username"]', user);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2200);
};

const asideState = () =>
  page.evaluate(() => {
    const el = document.querySelector('.rt-sidebar, .rw-sidebar, .admin-sidebar');
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round(rect.x),
      w: Math.round(rect.width),
      pos: cs.position,
      shadow: cs.boxShadow,
      zIndex: cs.zIndex,
    };
  });

const scrimState = () =>
  page.evaluate(() => {
    const el = document.querySelector('.rt-scrim, .rw-scrim, .admin-scrim');
    const cs = getComputedStyle(el);
    return { disp: cs.display, z: cs.zIndex, hitAt340: document.elementFromPoint(340, 300)?.className };
  });

for (const [user, pass, label] of [
  ['rt001', 'rt123', 'RT'],
  ['rw08', 'rw123', 'RW'],
  ['admin', 'admin123', 'ADMIN'],
]) {
  await loginAs(user, pass);
  const before = await asideState();
  const scrimBefore = await scrimState();
  await page.$eval('.rt-burger, .rw-burger, .admin-burger', (b) => b.click({ force: true }));
  await page.waitForTimeout(500);
  const open = await asideState();
  const scrimOpen = await scrimState();
  // klik scrim di kanan sidebar
  await page.mouse.click(340, 300);
  await page.waitForTimeout(500);
  const closed = await asideState();

  const checks = {
    tersembunyi_awal: before.x <= -1 && before.pos === 'fixed',
    terbuka_penuh: open.x === 0 && open.w === 256,
    ada_penggelap: open.shadow !== 'none',
    scrim_naik_saat_terbuka: scrimOpen.z === '190' && scrimOpen.hitAt340?.includes('scrim'),
    ketuk_luar_menutup: closed.x <= -1 && scrimBefore.disp === 'none',
  };
  const pass_ = Object.values(checks).every(Boolean);
  console.log(`${label}: ${pass_ ? 'PASS' : 'FAIL'}`, JSON.stringify(checks), '| shadow:', open.shadow.slice(0, 60));
}

await browser.close();
console.log('DONE');
