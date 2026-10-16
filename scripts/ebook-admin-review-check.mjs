// Browser fixtures only: every API request is intercepted; no customer data is changed.
import { chromium, expect as baseExpect } from "@playwright/test";
const expect = baseExpect.configure({ timeout: 60000 });
const origin = "http://127.0.0.1:3107";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
await context.addCookies([{ name: "admin-token", value: "ui-fixture-only", url: origin }]);
let order = {
  id: "review-fixture", reference: "EB-UI-FIXTURE", title: "Review fixture ebook",
  customerName: "Fixture customer", priceCents: 500, method: "WHISH",
  state: "AWAITING_PAYMENT", createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(), reader: { email: "fixture@example.invalid" },
  access: null, customerNote: "", submittedReference: null,
  verifiedReference: null, hasReceipt: false, emails: [], events: [],
};
const posts = [];
await context.route("**/api/**", async route => {
  const request = route.request(), path = new URL(request.url()).pathname;
  const json = data => route.fulfill({ contentType: "application/json", body: JSON.stringify(data) });
  if (path === "/api/admin/ebook-orders") return json({ orders: [order], total: 1 });
  if (path === "/api/admin/ebook-orders/review-fixture") {
    if (request.method() === "POST") {
      posts.push(request.postDataJSON());
      order = { ...order, state: "VERIFIED", access: { active: true } };
      return json({ success: true });
    }
    return json(order);
  }
  if (["/api/admin/me", "/api/admin/auth/me"].includes(path))
    return json({ role: "ADMIN", name: "Fixture admin", email: "fixture@example.invalid" });
  return json({ count: 0 });
});
try {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(origin + "/admin/ebook-orders", { timeout: 120000, waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: "Validate payment", exact: true }))
    .toHaveAttribute("href", "/admin/ebook-orders/review-fixture");
  await page.goto(origin + "/admin/ebook-orders/review-fixture", { waitUntil: "domcontentloaded" });
  console.log("Opened order review");
  await expect(page.getByText("The customer has not submitted payment details yet.", { exact: false })).toBeVisible();
  const submit = page.getByRole("button", { name: "Confirm payment & grant access", exact: true });
  await submit.click();
  expect(posts).toHaveLength(0);
  await page.getByLabel("Actual transaction reference").fill("UI-FIXTURE-REFERENCE");
  await page.getByLabel("Received amount (USD)").fill("5.00");
  await submit.click();
  expect(posts).toHaveLength(0);
  await page.getByRole("checkbox").check();
  console.log("Confirmed required payment evidence");
  await submit.click();
  await expect(page.getByRole("status")).toContainText("Saved.");
  expect(posts).toHaveLength(1);
  console.log("Verified confirmation submission");
  expect(posts[0]).toMatchObject({ action: "VERIFY", checkedWallet: true, receivedAmountCents: 500, currency: "USD", transactionReference: "UI-FIXTURE-REFERENCE" });
  await expect(page.locator("form select")).toHaveValue("RESEND");
  console.log("Verified paid order actions");
  for (const state of ["CHANGES_REQUESTED", "UNDER_REVIEW", "CANCELLED", "REFUNDED"]) {
    order = { ...order, state, access: null };
    await page.reload({ waitUntil: "domcontentloaded" });
    console.log("Checking state", state);
    if (["CANCELLED", "REFUNDED"].includes(state)) {
      await expect(page.getByText("Cancelled and refunded orders cannot be validated or have access restored.")).toBeVisible();
      await expect(submit).toHaveCount(0);
    } else {
      await expect(submit).toBeVisible();
      await expect(page.getByRole("option", { name: "Request a correction", exact: true })).toHaveCount(state === "UNDER_REVIEW" ? 1 : 0);
    }
  }
  expect(errors).toEqual([]);
  console.log("PASS: validation link, awaiting-payment review, required evidence, confirmation, and state restrictions. All APIs mocked.");
} finally {
  await browser.close();
}
