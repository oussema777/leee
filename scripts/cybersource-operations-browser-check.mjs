// Local admin UI and map regression; all API/provider requests are simulated.
import { chromium, expect } from '@playwright/test';
const origin = process.env.AUDI_PREVIEW_ORIGIN || 'http://localhost:3120';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw Error('Local preview required');
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
await page.context().addCookies([{ name: 'admin-token', value: 'local-ui-fixture-not-an-auth-token', url: origin }]);
const errors = []; page.on('pageerror', e => errors.push(e.message));
const row = { id: 'LEE-L-fixture', bookOrderId: 'local-order', ebookOrderId: null, orderReference: 'LEE-BK-REVIEW', amountCents: 900, state: 'READY', sessionState: 'SUBMITTED', transactionId: null, reviewReason: null, checkError: 'PAYMENT_REQUIRES_REVIEW', updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(), mail: [{ id: 'mail', event: 'PAYMENT_CONFIRMED', state: 'REVIEW_REQUIRED', lastError: 'DELIVERY_WINDOW_EXPIRED' }], notes: [{ id: 'note', action: 'NOTE', actorId: 'fixture-admin', createdAt: new Date().toISOString(), note: '<img src=x onerror="window.XSS=true">' }] };
let actions = [], conflict = false;
await page.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('countries-110m')) return route.fulfill({ json: { type: 'Topology', transform: { scale: [1,1], translate: [0,0] }, objects: { countries: { type: 'GeometryCollection', geometries: [{ type: 'Polygon', arcs: [[0]], id: '422', properties: { name: 'Lebanon' } }] } }, arcs: [[[35,33],[1,0],[0,1],[-1,0],[0,-1]]] } });
  if (url.origin !== origin) return route.abort();
  if (url.pathname === '/api/admin/card-payments') {
    if (route.request().method() === 'POST') {
      const input = route.request().postDataJSON(); actions.push(input);
      if (conflict) return route.fulfill({ status: 409, json: { error: 'This payment changed. Refresh before acting.' } });
      row.notes.unshift({ id: 'saved', ...input, actorId: 'fixture-admin', createdAt: new Date().toISOString() });
      return route.fulfill({ json: { saved: true } });
    }
    return route.fulfill({ json: { rows: [row], page: 1, total: 1, schedulerStale: true, liveEnabled: false, jobsEnabled: true, heartbeat: null } });
  }
  if (url.pathname === '/api/admin/auth/me') return route.fulfill({ json: { user: { id: 'fixture-admin', name: 'Local Admin', role: 'ADMIN' } } });
  if (url.pathname.startsWith('/api/')) return route.fulfill({ json: {} });
  return route.continue();
});
try {
  await page.goto(origin + '/admin/card-payments', { timeout: 120000 });
  await expect(page.getByRole('heading', { name: 'Card payment review' })).toBeVisible();
  await expect(page.getByText('Background checks need attention.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Queue payment check' })).toBeDisabled();
  await page.getByText('Recent staff notes', { exact: false }).click();
  await expect(page.getByText('<img src=x onerror="window.XSS=true">', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.XSS)).toBeUndefined();
  await page.getByRole('textbox', { name: 'Note for LEE-BK-REVIEW' }).fill('Customer requested another status check.');
  await page.getByRole('button', { name: 'Queue payment check' }).click();
  await expect(page.getByText('Payment queued for a background check.', { exact: false })).toBeVisible();
  expect(actions[0].action).toBe('QUEUE_CHECK');
  expect(actions[0]).not.toHaveProperty('actorId');
  conflict = true;
  await page.getByRole('textbox', { name: 'Note for LEE-BK-REVIEW' }).fill('Another investigation note.');
  await page.getByRole('button', { name: 'Save note' }).click();
  await expect(page.getByText('This payment changed. Refresh before acting.', { exact: true })).toBeVisible();
  await page.screenshot({ path: '.impeccable/card-operations-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.impeccable/card-operations-mobile.png', fullPage: true });
  await page.goto(origin + '/en/impact', { timeout: 120000 });
  await page.locator('svg.rsm-svg').scrollIntoViewIfNeeded();
  await expect(page.locator('.rsm-geography')).toHaveCount(1);
  await page.locator('.rsm-geography').hover({ force: true });
  expect(errors).toEqual([]);
  console.log('PASS: staff heartbeat alert, required note, queued check, stale action, escaped HTML, mobile layout, D3 map with patched color dependency. All APIs simulated.');
} finally { await browser.close(); }
