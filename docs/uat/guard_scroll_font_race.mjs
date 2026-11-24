import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });

for (const attempt of [1, 2, 3]) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5173/login');
  for (const ms of [400, 800, 1500, 2500]) {
    await page.waitForTimeout(ms === 400 ? 400 : ms - 400);
    const m = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      bodyW: document.body.scrollWidth,
      fonts: document.fonts.status,
    }));
    console.log(`run${attempt} t=${ms}ms scrollW=${m.w} bodyW=${m.bodyW} fonts=${m.fonts}`);
  }
  await ctx.close();
}
await browser.close();
