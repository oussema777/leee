// UI regression with simulated API/provider responses; no card is charged.
import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
const origin = process.env.AUDI_PREVIEW_ORIGIN || 'http://localhost:3120';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw Error('Local preview required');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
let attempt = null, mode = 'pending', completed = false, starts = 0, checks = 0, searchChecks = 0;
let holdInspect = false, releaseInspect;
const reference = 'LEE-TEST-BROWSER';
const sdk = `window.VAS={UnifiedCheckout:async()=>({destroy(){},createCheckout:async()=>({destroy(){},mount:async()=> 'a.'+btoa(JSON.stringify({id:'999999999999',completeResponse:{id:'123456789012'}}))+'.b'})})};`;
const integrity = 'sha384-' + createHash('sha384').update(sdk).digest('base64');
await page.route('https://testup.cybersource.com/**', route => route.fulfill({ body: sdk, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } }));
await page.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path.endsWith('/card')) {
    const input = route.request().postDataJSON();
    if (input.action === 'inspect') {
      if (holdInspect) await new Promise(resolve => { releaseInspect = resolve; });
      if (input.awaitingResult) searchChecks++;
      if (input.awaitingResult && mode === 'pending') return route.fulfill({ status: 202, json: { attempt, pending: true, retryAfterSeconds: 10 } });
      if (input.awaitingResult && mode === 'captured') { completed = true; attempt = { ...attempt, state: 'TEST_CAPTURED', transactionId: '123456789012' }; }
      if (mode === 'server-recovered') { completed = true; attempt = { ...attempt, state: 'TEST_CAPTURED', transactionId: '123456789012' }; }
      return route.fulfill({ json: { attempt, completed } });
    }
    if (input.action === 'start') {
      starts++; attempt = { id: 'LEE-T-00000000-0000-0000-0000-000000000001', state: 'READY', expiresAt: new Date(Date.now() + 600000).toISOString(), transactionId: null };
      return route.fulfill({ json: { attempt, session: { sessionJwt: 'mock', clientLibrary: 'https://testup.cybersource.com/uc/mock.js', clientLibraryIntegrity: integrity } } });
    }
    checks++;
    expect(input.transactionId).toBe('123456789012');
    if (mode === 'pending') return route.fulfill({ status: 202, json: { pending: true, retryAfterSeconds: 10 } });
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
  holdInspect = true;
  await page.goto(origin + '/en/books/payment/' + reference + '#' + 'ab'.repeat(32), { timeout: 120000 });
  await expect(page.getByRole('heading', { name: 'Pay by card' })).toBeVisible();
  await expect(page.getByText('Checking your payment now', { exact: true })).toBeVisible();
  await page.clock.fastForward(3000);
  await expect(page.locator('[data-payment-elapsed]')).toHaveText('0:03');
  await page.screenshot({ path: '.vercel/customer-checking-mobile.png', fullPage: true });
  holdInspect = false; releaseInspect();
  await page.getByRole('button', { name: 'Continue to card payment' }).click();
  await expect(page.getByText('Waiting for payment confirmation', { exact: true })).toBeVisible();
  await expect(page.locator('[data-payment-countdown]')).toContainText('0:10');
  await page.clock.fastForward(3000);
  await expect(page.locator('[data-payment-countdown]')).toContainText('0:07');
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '3');
  await page.screenshot({ path: '.vercel/customer-wait-mobile.png', fullPage: true });
  expect(starts).toBe(1); expect(checks).toBe(1);
  // Old tabs may still have a five-minute deadline saved by the previous build.
  await page.evaluate(reference => {
    const key = 'audi-result:' + reference, saved = JSON.parse(sessionStorage.getItem(key));
    sessionStorage.setItem(key, JSON.stringify({ ...saved, nextCheckAt: Date.now() + 300000 }));
  }, reference);
  await page.reload();
  await expect(page.getByText('Waiting for payment confirmation', { exact: true })).toBeVisible();
  await expect(page.locator('[data-payment-countdown]')).toHaveText('0:10');
  expect(checks).toBe(1);
  await expect(page.getByRole('button', { name: 'Resume card checkout' })).toHaveCount(0);
  await page.clock.fastForward(10001);
  await expect(page.locator('[data-payment-countdown]')).toHaveText('0:10');
  expect(searchChecks).toBe(2); expect(checks).toBe(1);
  mode = 'captured';
  await page.clock.fastForward(10001);
  await expect(page.getByRole('heading', { name: 'Your test order is confirmed' })).toBeVisible();
  expect(starts).toBe(1); expect(checks).toBe(1); expect(searchChecks).toBe(3);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your test order is confirmed' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.vercel/customer-card-mobile.png', fullPage: true });
  attempt = null; completed = false; mode = 'pending';
  await page.reload();
  await page.getByRole('button', { name: 'Continue to card payment' }).click();
  await expect(page.getByText('Waiting for payment confirmation', { exact: true })).toBeVisible();
  mode = 'captured';
  await page.getByRole('button', { name: 'Check now' }).click();
  await expect(page.getByRole('heading', { name: 'Your test order is confirmed' })).toBeVisible();
  // Recover on a new page without any browser transaction hint.
  completed = false; attempt = { ...attempt, state: 'READY', transactionId: null }; mode = 'server-recovered';
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your test order is confirmed' })).toBeVisible();
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
  console.log('PASS: immediate feedback, 3-second elapsed timer, countdown/progress, nested payment ID, manual refresh, automatic recheck, storage-free recovery, decline retry, ebook link, mobile and Arabic; simulated provider.');
} finally { await browser.close(); }
