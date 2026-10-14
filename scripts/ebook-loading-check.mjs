// Delayed browser fixtures only. No real emails, orders or payments.
import { chromium, expect as baseExpect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
const expect = baseExpect.configure({ timeout: 30000 });
const base = "http://localhost:3107";
const cover = await readFile("public/images/ebooks/manal-366-cover.webp");
const book = { id: "loading-fixture", slug: "manal-366-days", titleEn: "366 Mistakes That Lead to Business Failure", titleAr: "٣٦٦ خطأ تقود إلى فشل الأعمال", author: "Dr. Manal Hassoun", language: "ARABIC", descriptionEn: "Online reading edition.", descriptionAr: "نسخة للقراءة على الموقع", coverUrl: "/loading-cover.webp", priceCents: 500, activeVersion: { pageCount: 385 } };
function gate() { let release; const promise = new Promise(resolve => { release = resolve; }); return { promise, release }; }
const catalog = gate(), session = gate(), checkout = gate(), order = gate(), qr = gate(), coverGate = gate();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", e => errors.push(e.message));
let authRequests = 0, qrRequests = 0, unauthenticated = false;
await page.route("**/loading-cover.webp", async route => { await coverGate.promise; await route.fulfill({ contentType: "image/webp", body: cover }); });
await page.route("**/loading-qr.webp", async route => { qrRequests++; await qr.promise; await route.fulfill({ contentType: "image/webp", body: cover }); });
await page.route("**/api/ebooks/**", async route => {
  const path = new URL(route.request().url()).pathname;
  const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  if (path === "/api/ebooks/catalog") { await catalog.promise; return json({ ebooks: [book], methods: ["WHISH"] }); }
  if (path === "/api/ebooks/auth") { authRequests++; await session.promise; return json({ reader: { email: "loading@example.test" } }); }
  if (path === "/api/ebooks/orders") {
    if (route.request().method() === "GET") return json({ access: [], orders: [] });
    await checkout.promise; return json({ id: "loading-order" });
  }
  if (path === "/api/ebooks/orders/loading-order") {
    await order.promise;
    if (unauthenticated) return json({ error: "Sign in required" }, 401);
    return json({ title: book.titleEn, reference: "LOADING-FIXTURE", state: "AWAITING_PAYMENT", method: "WHISH", priceCents: 500, ebookId: book.id, customerNote: "", canSubmit: true, access: false, hasReceipt: false, supportPhone: "", instructions: { accountName: "UI fixture only", accountNumber: "TEST ONLY", imageUrl: "/loading-qr.webp" } });
  }
  return json({ error: "Unexpected fixture request" }, 500);
});
try {
  await mkdir("private-ebooks/screenshots", { recursive: true });
  await page.goto(`${base}/en/ebooks/manal-366-days`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await expect(page.getByRole("status", { name: "Loading ebook", exact: true })).toBeVisible();
  await page.screenshot({ path: "private-ebooks/screenshots/loading-product.png" });
  catalog.release();
  await expect(page.getByRole("heading", { name: book.titleEn })).toBeVisible();
  await expect(page.getByRole("status", { name: "Loading image", exact: true })).toBeVisible();
  coverGate.release();
  await expect(page.getByRole("status", { name: "Loading image", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Order ebook", exact: true }).click();
  await expect(page.getByText("Preparing your order…", { exact: true })).toBeVisible();
  session.release();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name").fill("Loading fixture");
  await dialog.getByRole("checkbox").check();
  const authBeforePayment = authRequests;
  await dialog.getByRole("button", { name: "Continue to payment", exact: true }).click();
  await expect(dialog.getByText("Preparing your payment page…", { exact: true })).toBeVisible();
  await page.screenshot({ path: "private-ebooks/screenshots/loading-transition.png" });
  checkout.release();
  await page.waitForURL("**/ebooks/orders/loading-order", { waitUntil: "domcontentloaded", timeout: 90000 });
  await expect(page.getByRole("status", { name: "Loading payment details", exact: true })).toBeVisible();
  await page.screenshot({ path: "private-ebooks/screenshots/loading-payment.png" });
  order.release();
  await expect(page.getByRole("heading", { name: "Complete your payment", exact: true })).toBeVisible();
  expect(authRequests).toBe(authBeforePayment);
  expect(qrRequests).toBe(0);
  await page.getByText("Show payment QR (optional)", { exact: true }).click();
  await expect(page.getByRole("status", { name: "Loading image", exact: true })).toBeVisible();
  qr.release();
  await expect(page.getByRole("img", { name: "Payment QR", exact: true })).toHaveCSS("opacity", "1");
  expect(qrRequests).toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Complete your payment" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  unauthenticated = true;
  await page.getByRole("button", { name: "Refresh status", exact: true }).click();
  await expect(page.getByRole("button", { name: "Email me a code", exact: true })).toBeVisible();
  await expect(page.getByRole("status", { name: "Loading payment details", exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
  console.log("Passed: product/cover skeletons, modal loading, payment transition, payment skeleton, deferred QR, no payment auth preflight, mobile layout, expired-session recovery. No live writes.");
} finally { catalog.release(); session.release(); checkout.release(); order.release(); qr.release(); coverGate.release(); await browser.close(); }
