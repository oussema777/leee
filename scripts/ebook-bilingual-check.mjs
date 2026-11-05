// Local browser fixtures only; no purchase, email or production writes.
import { chromium, expect } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const browser = await chromium.launch();
const images = { ar: await readFile('private-ebooks/manal-web/0001.webp'), en: await readFile('private-ebooks/manal-english-web/0001.webp') };
try {
  await mkdir('private-ebooks/screenshots', { recursive: true });
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [], reads = [], saves = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/ebooks/**', async route => {
      const req = route.request(), url = new URL(req.url());
      const language = url.searchParams.get('language') || 'ar';
      if (req.method() === 'PUT') {
        saves.push({ language, ...req.postDataJSON() });
        return route.fulfill({ json: { success: true } });
      }
      if (url.searchParams.has('page')) {
        reads.push(language);
        return route.fulfill({ contentType: 'image/webp', body: images[language] });
      }
      return route.fulfill({ json: { titleEn: '366 Mistakes That Lead to Business Failure', titleAr: '٣٦٦ خطأ تقود إلى فشل الأعمال', author: 'Dr. Manal Hassoun', direction: language === 'ar' ? 'rtl' : 'ltr', editionLanguage: language, languages: ['ar', 'en'], pageCount: 385, versionId: `version-${language}`, lastPage: 1, bookmarks: [] } });
    });
    await page.goto(`${process.env.EBOOK_CHECK_ORIGIN || 'http://localhost:3107'}/en/ebooks/read/bilingual-fixture`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const selector = page.getByRole('combobox', { name: 'Book language' });
    await expect(selector).toHaveValue('ar');
    await selector.selectOption('en');
    await expect(selector).toHaveValue('en');
    await expect.poll(() => reads.includes('en')).toBe(true);
    await expect.poll(() => saves.some(s => s.language === 'en' && s.versionId === 'version-en')).toBe(true);
    await page.screenshot({ path: `private-ebooks/screenshots/bilingual-${name}.png` });
    await selector.selectOption('ar');
    await expect(selector).toHaveValue('ar');
    await expect.poll(() => saves.some(s => s.language === 'ar' && s.versionId === 'version-ar')).toBe(true);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    console.log(`${name}: Arabic/English switching, edition page requests and saves passed`);
    await page.close();
  }
} finally { await browser.close(); }
