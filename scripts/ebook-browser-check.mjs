import { chromium } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
const database = process.env.EBOOK_TEST_DATABASE_URL;
if (
  !database ||
  !["localhost", "127.0.0.1"].includes(new URL(database).hostname)
)
  throw Error("Use an isolated local database");
const origin = process.env.EBOOK_PREVIEW_URL || "http://localhost:3107";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
  throw Error("Use a local preview server");
const db = new PrismaClient({ datasourceUrl: database });
const browser = await chromium.launch({ headless: true });
const admin = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const reader = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
admin.setDefaultTimeout(60000);
reader.setDefaultTimeout(60000);
const errors = [];
try {
  const email = randomBytes(8).toString("hex") + "@browser-check.invalid";
  const user = await db.user.create({
    data: {
      email,
      name: "Browser test admin",
      role: "ADMIN",
      password: "unused",
    },
  });
  const jwt = await new SignJWT({ userId: user.id, email, role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  await admin.addCookies([{ name: "admin-token", value: jwt, url: origin }]);
  const customer = await db.ebookReader.create({ data: { email } });
  const token = randomBytes(32).toString("hex");
  await db.ebookSession.create({
    data: {
      id: createHash("sha256").update(token).digest("hex"),
      readerId: customer.id,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  await reader.addCookies([
    { name: "ebook-reader", value: token, url: origin },
  ]);
  const page = await admin.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin + "/admin/ebooks/new", { timeout: 120000 });
  await page
    .getByLabel("English title", { exact: true })
    .fill("Browser verification ebook");
  await page.getByLabel("Author", { exact: true }).fill("Test author");
  const slug = "browser-check-" + randomBytes(5).toString("hex");
  await page.getByLabel("URL slug", { exact: true }).fill(slug);
  await page.getByRole("button", { name: "Save ebook", exact: true }).click();
  await page.waitForURL(/\/admin\/ebooks\/(?!new)[^/]+$/, { timeout: 30000 });
  const bookId = page.url().split("/").at(-1);
  await page
    .getByLabel("Approved PDF", { exact: true })
    .setInputFiles("private-ebooks/browser-fixture.pdf");
  await page
    .getByRole("button", { name: "Prepare reading pages", exact: true })
    .click();
  await page
    .getByText(
      "Pages prepared. Preview this version, then activate it below.",
      { exact: true },
    )
    .waitFor({ timeout: 120000 });
  await page
    .getByRole("button", { name: "Preview version", exact: true })
    .click();
  await page
    .getByLabel(
      "I reviewed the pages and confirm this is the approved reading version.",
    )
    .check();
  await page
    .getByRole("button", { name: "Activate this version", exact: true })
    .click();
  await page
    .getByText(
      "Reading version activated. Publication is controlled separately above.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByLabel("Published in the ebook catalog.", { exact: false })
    .check();
  await page.getByRole("button", { name: "Save ebook", exact: true }).click();
  await page.getByText("Ebook saved.", { exact: true }).waitFor();
  const customerPage = await reader.newPage();
  customerPage.on("pageerror", (e) => errors.push(e.message));
  await customerPage.goto(origin + "/en/ebooks/" + slug, { timeout: 120000 });
  await customerPage
    .getByLabel("Full name", { exact: true })
    .fill("Test buyer");
  await customerPage
    .getByLabel("I agree to purchase personal online reading access", {
      exact: false,
    })
    .check();
  await customerPage
    .getByRole("button", { name: "Continue to payment", exact: false })
    .click();
  await customerPage.waitForURL(/\/ebooks\/orders\//, { timeout: 120000 });
  const orderId = customerPage.url().split("/").at(-1);
  await customerPage
    .getByLabel("Payment transaction reference", { exact: true })
    .fill("BROWSER-" + randomBytes(8).toString("hex"));
  await customerPage
    .getByRole("button", { name: "Submit for verification", exact: true })
    .click();
  await customerPage
    .getByText("Awaiting verification", { exact: true })
    .waitFor();
  await page.goto(origin + "/admin/ebook-orders/" + orderId);
  await page.getByLabel("Received amount (USD)").fill("5");
  await page
    .getByLabel("I checked the receiving account", { exact: false })
    .check();
  await page.getByRole("button", { name: "Apply action", exact: true }).click();
  await page
    .getByText("Saved. The customer notification is queued for delivery.", {
      exact: true,
    })
    .waitFor();
  await customerPage.goto(origin + "/en/ebooks/read/" + bookId);
  await customerPage.locator('img[alt="Page 1"]').waitFor({ timeout: 30000 });
  await customerPage.getByRole("button", { name: "Next", exact: true }).click();
  await customerPage.locator('img[alt="Page 2"]').waitFor();
  await customerPage.waitForTimeout(400);
  await customerPage.reload();
  await customerPage.locator('img[alt="Page 2"]').waitFor();
  const overflow = await customerPage.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  if (overflow) throw Error("Mobile page overflows horizontally");
  await mkdir("private-ebooks/checks", { recursive: true });
  await customerPage.screenshot({
    path: "private-ebooks/checks/mobile-reader.png",
    fullPage: true,
  });
  await page.screenshot({
    path: "private-ebooks/checks/admin-review.png",
    fullPage: true,
  });
  await page.getByLabel("Action", { exact: true }).selectOption("REFUND");
  await page
    .getByLabel("Reason / review note", { exact: true })
    .fill("External test refund REF-123");
  await page
    .getByLabel("I completed the refund outside this website", { exact: false })
    .check();
  await page.getByRole("button", { name: "Apply action", exact: true }).click();
  await page.getByText("Payment: Refunded", { exact: false }).waitFor();
  const denied = await reader.request.get(
    origin + `/api/ebooks/read/${bookId}?page=1`,
  );
  if (denied.status() !== 403) throw Error("Refund did not revoke page access");
  const anonymous = await browser.newContext();
  if (
    (
      await anonymous.request.get(origin + `/api/ebooks/read/${bookId}?page=1`)
    ).status() !== 401
  )
    throw Error("Anonymous page access succeeded");
  if (errors.length) throw Error("Browser errors: " + errors.join("; "));
  console.log(
    "PASS: catalog draft, PDF conversion, private upload, preview, activation, publication, mobile purchase, payment review, reading, saved position, refund and anonymous denial.",
  );
} finally {
  await browser.close();
  await db.$disconnect();
}
