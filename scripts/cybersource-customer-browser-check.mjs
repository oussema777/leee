// UI regression with simulated API/provider responses; no card is charged.
import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
const origin = process.env.AUDI_PREVIEW_ORIGIN || 'http://localhost:3120';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw Error('Local preview required');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
let attempt = null, mode = 'pending', completed = false, starts = 0, checks = 0;
const reference = 'LEE-TEST-BROWSER';
const sdk = `window.VAS={UnifiedCheckout:async()=>({destroy(){},createCheckout:async()=>({destroy(){},mount:async()=> 'a.'+btoa(JSON.stringify({id:'123456789012'}))+'.b'})})};`;
const integrity = 'sha384-' + createHash('sha384').update(sdk).digest('base64');
await page.route('https://testup.cybersource.com/**', route => route.fulfill({ body: sdk, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } }));
await page.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith('/card')) {
    const input = route.request().postDataJSON();
    if (input.action === 'inspect') return route.fulfill({ json: { attempt, completed } });
    if (input.action === 'start') {
      starts++; attempt = { id: 'LEE-T-00000000-0000-0000-0000-000000000001', state: 'READY', expiresAt: new Date(Date.now() + 600000).toISOString(), transactionId: null };
      return route.fulfill({ json: { attempt, session: { sessionJwt: 'mock', clientLibrary: 'https://testup.cybersource.com/uc/mock.js', clientLibraryIntegrity: integrity } } });
    }
    checks++;
    if (mode === 'pending') return route.fulfill({ status: 202, json: { pending: true, retryAfterSeconds: 300 } });
    attempt = { ...attempt, state: mode === 'declined' ? 'TEST_DECLINED' : 'TEST_CAPTURED', transactionId: input.transactionId };
    completed = mode !== 'declined';
    return route.fulfill({ json: { attempt, completed } });
  }
  if (path.endsWith('/payment')) return route.fulfill({ json: { cardCheckout: true, reference, amountCents: 900, state: 'AWAITING_PAYMENT', method: 'BANK_AUDI', books: [] } });
  if (path === '/api/ebooks/orders/mock') return route.fulfill({ json: { cardCheckout: true, reference: 'EB-TEST-CARD-BROWSER', priceCents: 900, ebookId: 'mock', title: 'Test', state: 'AWAITING_PAYMENT', method: 'BANK_AUDI' } });
  return route.fulfill({ json: {} });
});
try {
  await page.clock.install();
  await page.goto(origin + '/en/books/payment/' + reference + '#' + 'ab'.repeat(32), { timeout: 120000 });
  await expect(page.getByRole('heading', { name: 'Pay by card' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to card payment' }).click();
  await expect(page.getByText('Waiting for the payment provider', { exact: false })).toBeVisible();
  expect(starts).toBe(1); expect(checks).toBe(1);
  await page.reload();
  await expect(page.getByText('Waiting for the payment provider', { exact: false })).toBeVisible();
  expect(checks).toBe(1);
  await expect(page.getByRole('button', { name: 'Resume card checkout' })).toHaveCount(0);
  mode = 'captured';
  await page.clock.fastForward(300001);
  await expect(page.getByRole('heading', { name: 'Your test order is confirmed' })).toBeVisible();
  expect(starts).toBe(1); expect(checks).toBe(2);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your test order is confirmed' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.vercel/customer-card-mobile.png', fullPage: true });
  attempt = null; completed = false; mode = 'declined';
  await page.goto(origin + '/en/ebooks/orders/mock');
  await page.getByRole('button', { name: 'Continue to card payment' }).click();
  await expect(page.getByText('The test card was declined.', { exact: false })).toBeVisible();
  mode = 'captured';
  await page.getByRole('button', { name: 'Continue to card payment' }).click();
  await expect(page.getByRole('link', { name: 'Read your ebook' })).toHaveAttribute('href', '/en/ebooks/read/mock');
  await page.goto(origin + '/ar/ebooks/orders/mock');
  await expect(page.locator('section[dir="rtl"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  console.log('PASS: pending lookup, refresh recovery, automatic recheck, no duplicate start, decline retry, ebook link, mobile and Arabic; simulated provider.');
} finally { await browser.close(); }
