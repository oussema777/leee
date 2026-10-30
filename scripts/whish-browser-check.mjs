// UI fixtures only. No real provider calls, database writes, or valid admin session.
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const origin = 'http://localhost:3136';
await mkdir('.impeccable/whish-review', { recursive: true });
const browser = await chromium.launch();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
  page.on('pageerror', err => errors.push(err.message));
  await page.context().addCookies([{ name: 'admin-token', value: 'local-ui-fixture-not-a-valid-token', url: origin }]);
  await page.route('**/api/admin/auth/me', route => route.fulfill({ json: { user: { name: 'Sandbox reviewer', email: 'review@example.test', role: 'ADMIN' } } }));
  let configured = true;
  let attempts = [];
  await page.route('**/api/admin/whish-pay', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured, configurationError: configured ? null : 'SANDBOX_DISABLED', attempts } });
    const input = route.request().postDataJSON();
    if (input.action === 'connection') return route.fulfill({ json: { authenticated: true } });
    if (input.action === 'start') {
      attempts = [{ id: input.id, externalId: 'LEE-W-SBX-' + input.id, amount: '1.00', createdAt: new Date().toISOString(), collectUrl: 'https://whish.money/pay/ui-fixture', status: 'unknown', checkedAt: null, callbackAt: null, errorCode: null, uncertain: false }];
    } else { attempts[0] = { ...attempts[0], status: 'success', checkedAt: new Date().toISOString(), callbackAt: new Date().toISOString() }; }
    return route.fulfill({ json: { attempt: attempts[0] } });
  });
  await page.goto(origin + '/admin/whish-pay', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.getByRole('heading', { name: 'Whish Pay integration test' })).toBeVisible();
  await page.getByRole('button', { name: 'Check connection', exact: true }).click();
  await expect(page.getByText('Connected to Whish sandbox. Credentials accepted.')).toBeVisible();
  await page.getByRole('button', { name: 'Create $1.00 test', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open Whish test payment' })).toHaveAttribute('href', 'https://whish.money/pay/ui-fixture');
  await page.getByRole('button', { name: 'Check payment status', exact: true }).click();
  await expect(page.getByText('$1.00 USD · success', { exact: true })).toBeVisible();
  await page.screenshot({ path: '.impeccable/whish-review/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('heading', { name: 'Whish Pay integration test' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.impeccable/whish-review/mobile.png', fullPage: true });
  configured = false;
  await page.reload();
  await expect(page.getByRole('button', { name: 'Create $1.00 test', exact: true })).toBeDisabled();
  await expect(page.getByText('Setup required: SANDBOX_DISABLED')).toBeVisible();
  expect(errors).toEqual([]);
  console.log('PASS: desktop/mobile sandbox UI, create/open/check controls, persisted history fixture, disabled configuration, no horizontal overflow or browser errors. Provider/database calls mocked.');
} finally { await browser.close(); }
