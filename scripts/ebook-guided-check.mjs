// Browser interaction tests: all ebook API requests are intercepted with fixtures.
// No email, reader, order, or payment is created in the website database.
import { chromium, expect as baseExpect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
const base = "http://localhost:3107";
const expect = baseExpect.configure({ timeout: 30000 });
const cover = await readFile("public/images/ebooks/manal-366-cover.webp");
const book = { id: "ui-fixture-ebook", slug: "manal-366-days", titleEn: "366 Mistakes That Lead to Business Failure", titleAr: "٣٦٦ خطأ تقود إلى فشل الأعمال", author: "Dr. Manal Hassoun", descriptionEn: "A daily reading journey through 366 mistakes that can lead to business failure, by Dr. Manal Hassoun.", descriptionAr: "رحلة قراءة يومية مع الدكتورة منال حسون عبر ٣٦٦ خطأ تقود إلى فشل الأعمال.", coverUrl: "/images/ebooks/manal-366-cover.webp", language: "ARABIC", priceCents: 500, activeVersion: { pageCount: 385 } };
const browser = await chromium.launch({ headless: true });
const completed = [];
const errors = [];
async function fixture(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", e => errors.push(e.message));
  const state = { signed: false, methods: ["WHISH", "BANK_AUDI"], orders: [], owned: false, orderState: "AWAITING_PAYMENT", posts: [], failCheckout: false, ...options };
  await page.route("**/api/ebooks/**", async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    const json = (data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (url.pathname === "/api/ebooks/catalog") return json({ ebooks: [book], methods: state.methods });
    if (url.pathname === "/api/ebooks/auth") {
      if (method === "GET") return json({ reader: state.signed ? { email: "reader@example.test" } : null });
      if (method === "DELETE") { state.signed = false; return json({ success: true }); }
      const data = request.postDataJSON();
      if (data.action === "VERIFY") {
        if (data.code !== "123456") return json({ error: "This code is incorrect. Please try again." }, 400);
        state.signed = true;
      }
      return json({ success: true });
    }
    if (url.pathname === "/api/ebooks/orders") {
      if (method === "GET") return json({ access: state.owned ? [{ ebook: book }] : [], orders: state.orders });
      if (state.failCheckout) { state.failCheckout = false; state.signed = false; return json({ error: "Your session expired. Please sign in again." }, 401); }
      state.posts.push(request.postDataJSON());
      return json({ id: "ui-fixture-order" });
    }
    if (url.pathname === "/api/ebooks/orders/ui-fixture-order") {
      if (method !== "GET") { state.orderState = "UNDER_REVIEW"; return json({ success: true }); }
      return json({ title: book.titleEn, reference: "UI-FIXTURE-ONLY", state: state.orderState, method: "WHISH", priceCents: 500, ebookId: book.id, customerNote: "", submittedReference: null, canSubmit: state.orderState === "AWAITING_PAYMENT", access: false, hasReceipt: false, supportPhone: "", instructions: state.orderState === "AWAITING_PAYMENT" ? { accountName: "UI fixture — not a payment recipient", accountNumber: "TEST ONLY", imageUrl: "" } : null });
    }
    if (url.pathname === `/api/ebooks/read/${book.id}`) {
      if (method === "PUT") return json({ success: true });
      if (url.searchParams.has("page")) return route.fulfill({ contentType: "image/webp", body: cover });
      return json({ ...book, direction: "rtl", pageCount: 385, versionId: "ui-version", lastPage: 1 });
    }
    // Fail closed: never fall through to a real ebook API.
    return json({ error: "Unexpected fixture request" }, 500);
  });
  return { context, page, state };
}
async function open(page, locale = "en") {
  await page.goto(`${base}/${locale}/ebooks/manal-366-days`, { waitUntil: "domcontentloaded", timeout: 90000 });
  const button = page.getByRole("button", { name: locale === "ar" ? "اطلب الكتاب الإلكتروني" : "Order ebook", exact: true });
  await expect(button).toBeVisible();
  await expect(page.locator('main input[type="email"]')).toHaveCount(0);
  await button.click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function login(page, invalid = false) {
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email", { exact: true }).fill("reader@example.test");
  await dialog.getByRole("button", { name: "Email me a code", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  if (invalid) {
    await dialog.getByLabel("Sign-in code").fill("000000");
    await dialog.getByRole("button", { name: "Verify & continue" }).click();
    await expect(dialog.getByRole("alert")).toContainText("incorrect");
  }
  await dialog.getByLabel("Sign-in code").fill("123456");
  await dialog.getByRole("button", { name: "Verify & continue" }).click();
}
try {
  await mkdir("private-ebooks/screenshots", { recursive: true });
  {
    const { page, context, state } = await fixture();
    await open(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Email", { exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Order ebook", exact: true })).toBeFocused();
    await page.screenshot({ path: "private-ebooks/screenshots/guided-product-desktop.png", fullPage: true });
    await page.getByRole("button", { name: "Order ebook", exact: true }).click();
    await expect(dialog.getByLabel("Email", { exact: true })).toBeVisible();
    for (let i = 0; i < 8; i++) { await page.keyboard.press("Tab"); expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBeTruthy(); }
    await page.screenshot({ path: "private-ebooks/screenshots/guided-email-modal.png" });
    await login(page, true);
    await expect(dialog.getByRole("heading", { name: "Review your order" })).toBeVisible();
    expect(state.posts).toHaveLength(0);
    await dialog.getByLabel("Full name").fill("UI fixture reader");
    await dialog.getByRole("checkbox").check();
    await page.screenshot({ path: "private-ebooks/screenshots/guided-order-review.png" });
    await dialog.getByRole("button", { name: "Continue to payment", exact: true }).click();
    await page.waitForURL("**/ebooks/orders/ui-fixture-order");
    await expect(page.getByRole("heading", { name: "Complete your payment" })).toBeVisible();
    expect(state.posts).toHaveLength(1);
    expect(state.posts[0]).toMatchObject({ ebookId: book.id, customerName: "UI fixture reader", method: "WHISH", termsAccepted: true });
    await page.getByLabel("Payment transaction reference").fill("UI-MOCK-ONLY");
    await page.getByRole("button", { name: "Submit for verification" }).click();
    await expect(page.getByRole("heading", { name: "Your payment is under review", exact: true })).toBeVisible();
    await expect(page.getByText(/Don’t pay again/)).toBeVisible();
    completed.push("guest → popup → incorrect code recovery → verification → review → payment → pending approval; keyboard trap and focus return");
    await context.close();
  }
  {
    const { page, context, state } = await fixture({ methods: [] });
    await open(page);
    await expect(page.getByRole("dialog").getByText(/Payments are temporarily paused/)).toBeVisible();
    await login(page);
    await expect(page.getByRole("heading", { name: "Review your order" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue to payment", exact: true })).toBeDisabled();
    expect(state.posts).toHaveLength(0);
    completed.push("disabled payment methods cannot create an order");
    await context.close();
  }
  {
    const { page, context, state } = await fixture({ signed: true, failCheckout: true });
    await open(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Review your order" })).toBeVisible();
    await dialog.getByLabel("Full name").fill("UI fixture reader");
    await dialog.getByRole("checkbox").check();
    await dialog.getByRole("button", { name: "Continue to payment", exact: true }).click();
    await expect(dialog.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("alert")).toContainText("expired");
    await login(page);
    await expect(dialog.getByLabel("Full name")).toHaveValue("UI fixture reader");
    expect(state.posts).toHaveLength(0);
    completed.push("signed-in customer skips login; expired session resumes without losing details");
    await context.close();
  }
  for (const owned of [false, true]) {
    const { page, context, state } = await fixture({ signed: true, owned, orderState: "UNDER_REVIEW", orders: owned ? [] : [{ id: "ui-fixture-order", ebookId: book.id, state: "UNDER_REVIEW" }] });
    await page.goto(`${base}/en/ebooks/manal-366-days`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Order ebook", exact: true }).click();
    await page.waitForURL(owned ? `**/ebooks/read/${book.id}` : "**/ebooks/orders/ui-fixture-order", { waitUntil: "domcontentloaded", timeout: 60000 });
    expect(state.posts).toHaveLength(0);
    completed.push(owned ? "paid customer opens reader directly" : "existing pending order resumes without duplicate checkout");
    await context.close();
  }
  {
    const { page, context } = await fixture();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/ar/ebooks/manal-366-days`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "اطلب الكتاب الإلكتروني", exact: true }).waitFor();
    await page.locator("main img").evaluate(img => img.decode());
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    await page.screenshot({ path: "private-ebooks/screenshots/guided-product-ar-mobile.png", fullPage: true });
    await page.getByRole("button", { name: "اطلب الكتاب الإلكتروني", exact: true }).click();
    await page.getByRole("dialog").getByLabel("البريد الإلكتروني", { exact: true }).waitFor();
    expect(await page.getByRole("dialog").evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    await page.screenshot({ path: "private-ebooks/screenshots/guided-modal-ar-mobile.png" });
    await page.getByRole("button", { name: "إغلاق", exact: true }).click();
    completed.push("Arabic mobile detail and popup; no horizontal overflow");
    await context.close();
  }
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ passed: completed, realEmailsSent: 0, realOrdersCreated: 0 }, null, 2));
} catch (error) {
  const page = browser.contexts().at(-1)?.pages().at(-1);
  if (page) { console.error("Stopped at", page.url(), "Completed", completed, "Browser errors", errors); await page.screenshot({ path: "private-ebooks/screenshots/guided-failure.png" }).catch(() => {}); }
  throw error;
} finally { await browser.close(); }
