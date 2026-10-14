// Intercepted fixtures only; no live account or order writes.
import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
let release, mode = 'loaded', authRequests = 0;
let gate = new Promise(resolve => { release = resolve; });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/ebooks/**', async route => {
  if (route.request().url().includes('/auth')) authRequests++;
  await gate;
  const status = mode === 'error' ? 503 : mode === 'signed-out' ? 401 : 200;
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status !== 200 ? { error: 'Fixture unavailable' } : {
    access: [{ id: 'access', ebook: { id: 'book', titleEn: '366 Mistakes That Lead to Business Failure', titleAr: '', author: 'Dr. Manal Hassoun', coverUrl: '/images/ebooks/manal-366-cover.webp' } }], orders: [],
  }) });
});
try {
  await page.goto('http://localhost:3107/en/ebooks/library');
  await expect(page.getByRole('status')).toContainText('Loading your ebooks and orders');
  await expect(page.getByText('Your ebooks will appear here')).toHaveCount(0);
  release();
  await expect(page.getByRole('heading', { name: '366 Mistakes That Lead to Business Failure' })).toBeVisible();
  expect((await page.locator('article').boundingBox()).width).toBeLessThanOrEqual(300);
  const reveal = page.locator('article h2').locator('..');
  await expect(reveal).toHaveCSS('opacity', '0');
  await page.locator('article').screenshot({ path: 'private-ebooks/screenshots/library-book-rest.png' });
  await page.locator('article').hover();
  await expect(reveal).toHaveCSS('opacity', '1');
  await page.locator('article').screenshot({ path: 'private-ebooks/screenshots/library-book-hover.png' });
  await page.mouse.move(10, 100);
  await page.getByRole('link', { name: /^Continue reading:/ }).focus();
  await expect(reveal).toHaveCSS('opacity', '1');
  await expect(page.getByRole('status')).toHaveCount(0);
  expect(authRequests).toBe(0);
  mode = 'error';
  await page.reload();
  await expect(page.locator('p[role="alert"]')).toContainText('Fixture unavailable');
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Email me a code' })).toHaveCount(0);
  mode = 'loaded';
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: '366 Mistakes That Lead to Business Failure' })).toBeVisible();
  mode = 'signed-out';
  await page.reload();
  await expect(page.getByRole('button', { name: 'Email me a code', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Open your library');
  await expect(page.getByRole('heading', { name: 'My ebooks', exact: true })).toHaveCount(0);
  const phoenix = page.getByRole('link', { name: 'Phoenix Buy & donate books', exact: true });
  await expect(phoenix).toBeVisible();
  expect((await phoenix.boundingBox()).width).toBeLessThan(180);
  await page.screenshot({ path: 'private-ebooks/screenshots/library-sign-in-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3107/ar/ebooks/library');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('افتح مكتبتك');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'private-ebooks/screenshots/library-sign-in-ar.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log('Passed: visible library skeleton, no auth preflight, loaded books, error/retry, expired session. No live writes.');
} finally { release(); await browser.close(); }
