// Local UI regression only: API and provider responses are simulated.
import { chromium, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
const origin = process.env.AUDI_PREVIEW_ORIGIN || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw Error('Local preview required');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultNavigationTimeout(120000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.context().addCookies([{ name: 'admin-token', value: 'mock-ui-only', url: origin }]);
let available = true, mode = 'interrupted', starts = 0, checks = 0;
let attempt = null;
const sdk = `window.VAS={UnifiedCheckout:async()=>({destroy(){},createCheckout:async()=>({destroy(){},mount:async()=>{throw Error('Simulated interruption')}})})};`;
const integrity = 'sha384-' + createHash('sha384').update(sdk).digest('base64');
await page.route('https://testup.cybersource.com/**', route => route.fulfill({ body: sdk, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' } }));
await page.route('**/api/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if (path === '/api/admin/book-bank-audi') return route.fulfill({ json: { configured: true, testCheckoutAvailable: available, testCheckoutMessage: 'Staff card testing has not been enabled on this server yet.' } });
  if (path === '/api/admin/book-bank-audi/checkout') {
    const input = route.request().postDataJSON();
    if (input.action === 'inspect') return route.fulfill({ json: { reference: 'LEE-BK-UI-TEST', amountCents: 100, attempt } });
    if (input.action === 'start') {
      starts++;
      attempt = { id: 'LEE-T-00000000-0000-0000-0000-000000000001', reference: 'LEE-BK-UI-TEST', state: 'READY', amountCents: 100, expiresAt: new Date(Date.now() + 600000).toISOString(), transactionId: null };
      return route.fulfill({ json: { attempt, session: { sessionJwt: 'mock', clientLibrary: 'https://testup.cybersource.com/uc/mock.js', clientLibraryIntegrity: integrity, expiresAt: attempt.expiresAt } } });
    }
    checks++;
    if (mode === 'wrong-transaction') return route.fulfill({ status: 409, json: { error: 'Wrong transaction' } });
    attempt = { ...attempt, state: 'TEST_CAPTURED', transactionId: input.transactionId };
    return route.fulfill({ json: { attempt } });
  }
  return route.fulfill({ json: { count: 0, unreadCount: 0, role: 'SUPER_ADMIN', data: [] } });
});
try {
  await page.goto(origin + '/admin/book-bank-audi');
  await expect(page.getByRole('heading', { name: 'Test the card checkout' })).toBeVisible();
  await page.getByLabel('Order reference').fill('LEE-BK-UI-TEST');
  await page.getByRole('button', { name: 'Load saved order' }).click();
  await expect(page.getByRole('button', { name: 'Open test card checkout' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Open test card checkout' }).click();
  await expect(page.locator('p[role="alert"]')).toContainText('Do not pay again');
  expect(starts).toBe(1);
  await page.reload();
  await page.getByLabel('Order reference').fill('LEE-BK-UI-TEST');
  await page.getByRole('button', { name: 'Load saved order' }).click();
  await expect(page.getByRole('button', { name: 'Resume test checkout' })).toBeDisabled();
  expect(starts).toBe(1);
  mode = 'wrong-transaction';
  await page.getByLabel('Transaction ID from Cybersource').fill('123456789012345');
  await page.getByRole('button', { name: 'Check transaction' }).click();
  await expect(page.locator('p[role="alert"]')).toContainText('Could not verify');
  mode = 'captured';
  await page.getByRole('button', { name: 'Check transaction' }).click();
  await expect(page.getByText('Test capture verified', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open test card checkout' })).toHaveCount(0);
  expect(checks).toBe(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.impeccable/audi-checkout-mobile.png', fullPage: true });
  available = false;
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Card testing is not open here yet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Test the card checkout' })).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log('PASS: confirmation, interruption, refresh recovery, rejected lookup, verified status, mobile overflow, disabled setup; mocked provider only.');
} finally { await browser.close(); }
