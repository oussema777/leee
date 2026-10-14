import { chromium, expect as baseExpect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const expect = baseExpect.configure({ timeout: 15000 });
const browser = await chromium.launch();
const image = await readFile('private-ebooks/manal-web/0020.webp');
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 700 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    await page.route('**/api/ebooks/**', route => {
      if (new URL(route.request().url()).searchParams.has('page')) return route.fulfill({ contentType: 'image/webp', body: image });
      return route.fulfill({ json: { titleEn: 'Reader dock check', direction: 'rtl', pageCount: 385, versionId: 'fixture', lastPage: 20, bookmarks: [] } });
    });
    await page.goto('http://localhost:3107/en/ebooks/read/dock-fixture');
    const dock = page.locator('[data-reader-dock]');
    const book = page.locator('[data-reader-flipbook]');
    await expect(book).toBeVisible();
    await expect(dock).toHaveAttribute('data-open', 'false');
    await expect(page.locator('footer[aria-label="Reading controls"]')).toHaveCSS('opacity', '0');
    const closedHeight = (await dock.boundingBox()).height;
    expect(closedHeight).toBeLessThanOrEqual(45);
    const fit = async () => {
      const bounds = await book.boundingBox(), controls = await dock.boundingBox();
      if (bounds.y + bounds.height > controls.y + 1) console.log(await book.evaluate(el => ({ host: el.getAttribute('style'), parent: el.parentElement.getBoundingClientRect().toJSON(), viewport: el.parentElement.parentElement.getBoundingClientRect().toJSON(), hostBox: el.getBoundingClientRect().toJSON() })));
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(controls.y + 1);
      expect(bounds.x).toBeGreaterThanOrEqual(-1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
    };
    await fit();
    if (mobile) await page.getByRole('button', { name: 'Show reading controls', exact: true }).tap();
    else await dock.hover();
    await expect(dock).toHaveAttribute('data-open', 'true');
    await expect(page.locator('footer[aria-label="Reading controls"]')).toHaveCSS('opacity', '1');
    await expect.poll(async () => (await dock.boundingBox()).height).toBeGreaterThan(closedHeight + 70);
    await page.waitForTimeout(350);
    await fit();
    if (mobile) await page.getByRole('button', { name: 'Hide reading controls', exact: true }).tap();
    else { await page.mouse.move(10, 100); }
    await expect(dock).toHaveAttribute('data-open', 'false');
    await page.waitForTimeout(350);
    await fit();
    await page.screenshot({ path: `private-ebooks/screenshots/dock-${mobile ? 'mobile' : 'desktop'}-collapsed.png` });
    await context.close();
  }
  console.log('Passed: desktop and touch collapse/reveal, reclaimed height, full page fits with controls open and closed. Fixture APIs only.');
} finally { await browser.close(); }
