// Read-only browser checks against the configured preview; no orders or emails are created.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = "http://localhost:3107";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(60000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const assert = (condition, message) => { if (!condition) throw Error(message); };
try {
  await mkdir("private-ebooks/screenshots", { recursive: true });
  await page.goto(`${base}/en/books`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.getByRole("heading", { name: "Books beginning a new chapter." }).waitFor();
  const manal = page.locator("article").filter({ hasText: "366 Mistakes That Lead to Business Failure" });
  await manal.getByRole("link", { name: "View ebook", exact: true }).waitFor();
  assert(await page.locator("article").count() === 12, "Shared catalogue page should contain 12 cards");
  assert(await page.getByRole("link", { name: "View & order this book", exact: true }).count() > 0, "Printed books missing from shared shelf");
  assert((await manal.innerText()).includes("$5.00"), "Ebook price must be $5");
  await manal.scrollIntoViewIfNeeded();
  await manal.locator("img").evaluate(img => img.decode());
  await page.screenshot({ path: "private-ebooks/screenshots/live-store-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Ebooks", exact: true }).click();
  await page.waitForURL(/format=ebook/);
  await page.waitForFunction(() => document.querySelectorAll("article").length === 1);
  await manal.getByRole("link", { name: "View ebook", exact: true }).click();
  await page.waitForURL(/ebooks\/manal-366-days/);
  await page.getByRole("heading", { name: "366 Mistakes That Lead to Business Failure" }).waitFor();
  const catalog = await (await page.request.get(`${base}/api/ebooks/catalog`)).json();
  await page.getByRole("button", { name: "Order ebook", exact: true }).waitFor();
  assert(await page.getByLabel("Email", { exact: true }).count() === 0, "Email form should open only after Order ebook");
  if (!catalog.methods.length) await page.getByText(/Payments are currently paused/).waitFor();
  await page.screenshot({ path: "private-ebooks/screenshots/live-ebook-detail.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/ar/books?format=ebook`, { waitUntil: "domcontentloaded" });
  await page.locator("article").waitFor();
  assert(await page.locator("article").count() === 1, "Arabic ebook filter failed");
  await page.locator("article").scrollIntoViewIfNeeded();
  await page.locator("article img").evaluate(img => img.decode());
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Mobile horizontal overflow");
  await page.screenshot({ path: "private-ebooks/screenshots/live-store-ar-mobile.png", fullPage: true });
  for (const [query, expected] of [["search=Manal", 1], ["format=ebook&language=ENGLISH", 0], ["format=ebook&language=ARABIC&category=BUSINESS", 1], ["format=physical", 12], ["page=2", 12]]) {
    await page.goto(`${base}/en/books?${query}`, { waitUntil: "domcontentloaded" });
    const count = await page.locator("article").count();
    assert(count === expected, `Filter ${query}: expected ${expected}, got ${count}`);
    if (query === "page=2" || query === "format=physical") assert(await page.getByRole("link", { name: "View ebook", exact: true }).count() === 0, "Ebook repeated outside its catalogue page");
  }
  const book = catalog.ebooks.find(b => b.slug === "manal-366-days");
  assert(book.priceCents === 500 && book.activeVersion.pageCount === 385, "Published edition mismatch");
  const denied = await page.request.get(`${base}/api/ebooks/read/${book.id}?page=1`);
  assert(denied.status() === 401, "Anonymous reading must be denied");
  await page.goto(`${base}/en/ebooks/library`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Email me a code", exact: true }).waitFor();
  assert(!errors.length, `Browser errors: ${errors.join("; ")}`);
  console.log(JSON.stringify({ sharedStore: "passed", filtersAndPagination: "passed", mobileArabic: "passed", readerSignIn: "passed", anonymousReading: "denied", paymentMethods: catalog.methods, checkout: catalog.methods.length ? "available" : "disabled by existing payment settings" }));
} finally { await browser.close(); }
