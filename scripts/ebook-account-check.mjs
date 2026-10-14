// Account UX fixtures only; no real sessions, emails or orders are modified.
import { chromium, expect as baseExpect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const expect = baseExpect.configure({ timeout: 15000 });
const browser = await chromium.launch();
const image = await readFile('private-ebooks/manal-web/0020.webp');
try {
  for (const locale of ['en', 'ar']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    let signedIn = true, signouts = 0;
    const reader = { email: 'oussema.lamine@example.test' };
    await page.route('**/api/ebooks/**', route => {
      const request = route.request(), url = new URL(request.url());
      if (request.method() === 'DELETE') { signedIn = false; signouts++; return route.fulfill({ json: { success: true } }); }
      if (!signedIn) return route.fulfill({ status: 401, json: { error: 'Sign in required' } });
      if (url.pathname.endsWith('/orders')) return route.fulfill({ json: { reader, access: [], orders: [] } });
      if (url.searchParams.has('page')) return route.fulfill({ contentType: 'image/webp', body: image });
      return route.fulfill({ json: { reader, titleEn: 'Reading room', direction: 'rtl', pageCount: 385, versionId: 'test', lastPage: 20, bookmarks: [] } });
    });
    const trigger = page.getByRole('button', { name: locale === 'en' ? 'My space — account' : 'مساحتي — الحساب', exact: true });
    await page.goto(`http://localhost:3107/${locale}/ebooks/library`);
    await expect(trigger).toContainText('OL');
    await trigger.click();
    await expect(page.getByText(reader.email, { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await page.getByRole('link', { name: locale === 'en' ? 'My orders' : 'طلباتي', exact: true }).click();
    await expect(page).toHaveURL(/#my-orders$/);
    await page.goto(`http://localhost:3107/${locale}/ebooks/read/account-fixture`);
    await expect(page.locator('[data-reader-flipbook]')).toBeVisible();
    await trigger.click();
    const box = await page.getByText(reader.email, { exact: true }).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: `private-ebooks/screenshots/account-${locale}.png` });
    await page.getByRole('button', { name: locale === 'en' ? 'Sign out' : 'تسجيل الخروج', exact: true }).click();
    await expect(trigger).toHaveCount(0);
    await expect(page.locator('[data-reader-flipbook] img')).toHaveCount(0);
    expect(signouts).toBe(1);
    await context.close();
  }
  console.log('Passed: initials, account email, Escape/focus, orders link, English/Arabic mobile menus, sign-out clears reader. No live writes.');
} finally { await browser.close(); }
