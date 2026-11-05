// Browser fixtures only. Never creates a provider payment or sends email.
import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch();
try {
  await mkdir('.impeccable/whish-live', { recursive: true });
  for (const [locale, width] of [['en', 1440], ['ar', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 960 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let mode = 'new', started = false;
    await page.route('**/api/ebooks/**', async route => {
      const url = new URL(route.request().url());
      if (!url.pathname.endsWith('/whish-live')) return route.fulfill({ json: { reference: 'EB-LOCAL-FIXTURE', priceCents: 999, ebookId: 'bilingual-fixture', state: 'AWAITING_PAYMENT', whishCheckout: true, liveWhish: true } });
      const action = route.request().postDataJSON().action;
      if (action === 'start') started = true;
      return route.fulfill({ json: { completed: mode === 'paid', retryAllowed: false, attempt: !started && mode === 'new' ? null : { id: 'local', status: mode === 'paid' || mode === 'review' ? 'success' : mode === 'refunded' ? 'refunded' : 'pending', collectUrl: 'https://whish.money/pay/local-fixture', errorCode: null, uncertain: false, reviewRequired: mode === 'review' } } });
    });
    const url = `${process.env.WHISH_CHECK_ORIGIN || 'http://localhost:3110'}/${locale}/ebooks/orders/local-fixture`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const ar = locale === 'ar';
    await page.getByRole('button', { name: ar ? 'متابعة إلى Whish' : 'Continue to Whish' }).click();
    await expect(page.getByRole('link', { name: ar ? 'افتح صفحة الدفع' : 'Open Whish payment', exact: true })).toHaveAttribute('href', 'https://whish.money/pay/local-fixture');
    await expect(page.getByText(/sandbox|test order|بدون أموال/i)).toHaveCount(0);
    await page.screenshot({ path: `.impeccable/whish-live/${locale}-pending.png`, fullPage: true });
    mode = 'paid';
    await page.getByRole('button', { name: ar ? 'تحقق من حالة الدفع' : 'Check payment status', exact: true }).click();
    await expect(page.getByRole('link', { name: ar ? 'اقرأ كتابك الإلكتروني' : 'Read your ebook' })).toBeVisible();
    await page.screenshot({ path: `.impeccable/whish-live/${locale}-confirmed.png`, fullPage: true });
    for (const state of ['review', 'refunded']) {
      mode = state;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: state === 'review' ? (ar ? 'نراجع دفعتك' : 'We are reviewing your payment') : (ar ? 'تم استرداد المبلغ' : 'Payment refunded'), exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: ar ? 'افتح صفحة الدفع' : 'Open Whish payment', exact: true })).toHaveCount(0);
      await expect(page.getByRole('link', { name: ar ? 'اقرأ كتابك الإلكتروني' : 'Read your ebook' })).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    console.log(`${locale}: live checkout, confirmation, review and refund UI passed`);
    await page.close();
  }
} finally { await browser.close(); }
