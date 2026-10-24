// Actual local UI with simulated provider/API responses. Never contacts a gateway.
import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
const origin = process.env.AUDI_PREVIEW_ORIGIN || 'http://localhost:3120';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw Error('Local preview required');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
const reference = 'LEE-BK-LOCAL-UI', id = 'LEE-L-00000000-0000-0000-0000-000000000001';
let mode = 'fresh', starts = 0, inspections = 0, hold = true, release;
const sdk = `window.VAS={UnifiedCheckout:async()=>({destroy(){},createCheckout:async()=>({destroy(){},mount:async()=> 'a.'+btoa(JSON.stringify({completeResponse:{id:'123456789012'}}))+'.b'})})};`;
const integrity = 'sha384-' + createHash('sha384').update(sdk).digest('base64');
const attempt = () => ({ id, state: mode === 'fresh' ? 'NOT_STARTED' : mode === 'review' ? 'REVIEW_REQUIRED' : mode === 'captured' ? 'APPLIED' : 'READY', transactionId: null, expiresAt: null });
await page.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === 'up.cybersource.com') return route.fulfill({ body: sdk, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } });
  if (url.origin !== origin) return route.abort();
  if (!url.pathname.startsWith('/api/')) return route.continue();
  if (url.pathname.endsWith('/live-card')) {
    const input = route.request().postDataJSON();
    if (input.action === 'start') {
      starts++; mode = 'pending';
      return route.fulfill({ json: { attempt: { ...attempt(), state: 'READY', expiresAt: new Date(Date.now() + 600000).toISOString() }, session: { sessionJwt: 'local-only', clientLibrary: 'https://up.cybersource.com/uc/mock.js', clientLibraryIntegrity: integrity } } });
    }
    inspections++;
    if (hold) await new Promise(resolve => { release = resolve; });
    return route.fulfill({ status: mode === 'pending' ? 202 : 200, json: { attempt: attempt(), pending: mode === 'pending', completed: mode === 'captured', review: mode === 'review', retryAfterSeconds: 10 } });
  }
  if (url.pathname.endsWith('/payment')) return route.fulfill({ json: { cardCheckout: true, liveCard: true, reference, amountCents: 900, state: 'AWAITING_PAYMENT', method: 'BANK_AUDI', books: [] } });
  if (url.pathname === '/api/ebooks/orders/local-ui') return route.fulfill({ json: { cardCheckout: true, liveCard: true, reference: 'EB-LOCAL-UI', priceCents: 900, ebookId: 'local-ui', title: 'Local fixture', state: 'AWAITING_PAYMENT', method: 'BANK_AUDI' } });
  return route.fulfill({ json: {} });
});
try {
  await page.clock.install();
  await page.goto(origin + '/en/books/payment/' + reference + '#' + 'ab'.repeat(32), { timeout: 120000 });
  await expect(page.getByText('Checking your payment now', { exact: true })).toBeVisible();
  await page.clock.fastForward(3000);
  await expect(page.locator('[data-payment-elapsed]')).toHaveText('0:03');
  hold = false; release();
  await page.getByRole('button', { name: 'Continue to card payment' }).click();
  await expect(page.getByText('Waiting for payment confirmation', { exact: true })).toBeVisible();
  await page.clock.fastForward(3000);
  await expect(page.locator('[data-payment-countdown]')).toHaveText('0:07');
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '3');
  await page.screenshot({ path: '.impeccable/live-payment-wait.png', fullPage: true });
  await page.reload();
  await expect(page.getByText('Waiting for payment confirmation', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume card checkout' })).toHaveCount(0);
  expect(starts).toBe(1);
  mode = 'captured';
  await page.clock.fastForward(10001);
  await expect(page.getByRole('heading', { name: 'Your order is confirmed' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Payment successful!' })).toHaveClass(/text-emerald-800/);
  await expect(page.getByText('Test checkout:', { exact: false })).toHaveCount(0);
  expect(starts).toBe(1);
  await page.screenshot({ path: '.impeccable/live-payment-success.png', fullPage: true });
  mode = 'review'; await page.reload();
  await expect(page.getByText('This order needs help from the LEE team.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to card payment' })).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  mode = 'captured'; await page.goto(origin + '/en/ebooks/orders/local-ui');
  await expect(page.getByRole('link', { name: 'Read your ebook' })).toHaveAttribute('href', '/en/ebooks/read/local-ui');
  await page.goto(origin + '/ar/ebooks/orders/local-ui');
  await expect(page.getByRole('heading', { name: 'تم تأكيد طلبك' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.impeccable/live-ebook-arabic.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ result: 'PASS', starts, inspections, checks: ['elapsed timer', 'countdown and progress', 'refresh without second start', 'automatic confirmation', 'green live success', 'support state', 'ebook link', 'Arabic mobile layout'] }));
} finally { await browser.close(); }
