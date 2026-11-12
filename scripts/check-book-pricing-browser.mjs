import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
const source = await readFile('src/components/sections/books/BookDetailExperience.tsx', 'utf8');
const label = (key, index) => [...source.matchAll(new RegExp(`\\b${key}: "([^"]+)"`, 'g'))][index][1];
const origin = process.env.PRICE_CHECK_ORIGIN || 'http://localhost:3019';
const slug = 'illustrated-cooking-encyclopedia-fruit-desserts-bk-260916-b446bb99';
await mkdir('.impeccable/pricing', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [index, locale] of ['en', 'ar'].entries()) {
    const page = await browser.newPage({ viewport: { width: index ? 390 : 1440, height: 1000 } });
    page.on('pageerror', error => console.error('Browser error:', error.message));
    let writes = 0;
    await page.route('**/api/**', async route => {
      if (route.request().method() !== 'GET') { writes++; return route.abort(); }
      return route.continue();
    });
    await page.goto(`${origin}/${locale}/books/${slug}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    const orderButton = page.getByRole('button', { name: label('order', index), exact: true });
    await orderButton.waitFor({ timeout: 60000 });
    await page.waitForFunction(text => [...document.querySelectorAll('button')].some(button =>
      button.textContent.trim() === text && Object.keys(button).some(key => key.startsWith('__reactProps'))), label('order', index), { timeout: 60000 });
    await orderButton.click();
    const dialog = page.getByRole('dialog');
    const packages = await dialog.innerText();
    for (const price of ['$9', '$45', '$90', '$180']) assert(packages.includes(price), `Missing ${price} in ${locale}`);
    await page.screenshot({ path: `.impeccable/pricing/${locale}-packages.png`, fullPage: true });
    await dialog.getByRole('button', { name: label('continue', index), exact: true }).click();
    await dialog.getByRole('button', { name: new RegExp(label('selfTitle', index)) }).click();
    await dialog.getByRole('button', { name: label('continue', index), exact: true }).click();
    await dialog.locator('form').waitFor();
    assert((await dialog.locator('aside').innerText()).includes('$13'), 'Single delivered book must total $13');
    await dialog.getByRole('button', { name: label('pickup', index), exact: true }).click();
    const summary = await dialog.locator('aside').innerText();
    assert(summary.includes('$9') && !summary.includes('$13'), 'Pickup must total $9');
    assert.equal(writes, 0, 'Browser must not submit orders');
    await page.screenshot({ path: `.impeccable/pricing/${locale}-pickup.png`, fullPage: true });
    console.log(JSON.stringify({ locale, packages: [9,45,90,180], deliveryTotal: 13, pickupTotal: 9, submittedOrders: writes }));
    await page.close();
  }
} finally { await browser.close(); }
