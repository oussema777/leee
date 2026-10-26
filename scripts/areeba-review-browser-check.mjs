import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
const origin = 'http://localhost:3132';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
let creates = 0; const ids = [];
await page.route('**/api/**', route => {
  const path = new URL(route.request().url()).pathname;
  if (path === '/api/payment-test') {
    creates++; ids.push(route.request().postDataJSON().requestId);
    expect(route.request().headers().authorization).toBe('Bearer ' + 'ab'.repeat(32));
    return route.fulfill({ json: { reference: 'LEE-TEST-UI-' + ids.at(-1), amountCents: 100, token: 'cd'.repeat(32) } });
  }
  if (path.endsWith('/card')) return route.fulfill({ json: { attempt: null, completed: false } });
  return route.fulfill({ json: {} });
});
try {
  await page.goto(origin + '/en/payment-test');
  await expect(page.getByText('Open the complete private review link supplied by LEE.')).toBeVisible();
  expect(creates).toBe(0);
  await page.goto('about:blank');
  await page.goto(origin + '/en/payment-test#' + 'ab'.repeat(32));
  await page.getByRole('button', { name: 'Open test checkout' }).click();
  await expect(page.getByRole('heading', { name: 'Pay by card', exact: true })).toBeVisible();
  await expect(page.getByText('USD 1.00', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Open test checkout' }).click();
  await expect(page.getByRole('button', { name: 'Start a separate test' })).toBeVisible();
  expect(ids[1]).toBe(ids[0]);
  await page.getByRole('button', { name: 'Start a separate test' }).click();
  await expect(page.getByRole('button', { name: 'Start a separate test' })).toBeEnabled();
  expect(ids[2]).not.toBe(ids[1]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  fs.mkdirSync('.vercel/reviewer-evidence', { recursive: true });
  await page.screenshot({ path: '.vercel/reviewer-evidence/mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '.vercel/reviewer-evidence/desktop.png', fullPage: true });
  expect(errors).toEqual([]);
  console.log('PASS: no-login review UI, missing-link guard, fixed amount, refresh reuse, separate tests, mobile overflow, no browser errors.');
} finally { await browser.close(); }
