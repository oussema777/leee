// Run against a local Next preview. All API requests are intercepted; no database,
// email, Aramex credentials, or real customer records are used.
import { chromium, expect as baseExpect } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";

const origin = process.env.ARAMEX_PREVIEW_ORIGIN || "http://127.0.0.1:3118";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname)) throw Error("Use a local preview.");
const expect = baseExpect.configure({ timeout: 15000 });
const { cities } = JSON.parse(await readFile("src/lib/aramex/data/lebanon-cities.json", "utf8"));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
// Cold local compilation can exceed Playwright's 30s navigation default.
page.setDefaultNavigationTimeout(120000);
const errors = [];
page.on("pageerror", error => errors.push(error.message));
let dismissNavigation = false;
let dialogs = 0;
page.on("dialog", dialog => { dialogs++; return dismissNavigation ? dialog.dismiss() : dialog.accept(); });
const defaults = {
  expectedUpdatedAt: "2026-10-20T10:00:00.000Z",
  recipientName: "Test Recipient", recipientPhone: "70123456", recipientEmail: "",
  city: "", addressLine1: "Test Street, Building 4", addressLine2: "", addressLine3: "",
};
const context = {
  draftStorageAvailable: true, savedDraft: null,
  submission: {
    enabled: false, reason: "Shipment sending is awaiting Aramex account access, approved service settings and IP whitelisting.",
    status: "DRAFT", environment: "UAT", trackingNumber: null, labelUrl: null, bookedAt: null,
  },
  reference: "LEE-BK-BROWSER", status: "READY", purpose: "SELF", paymentMethod: "CASH_ON_DELIVERY",
  paymentStatus: "PENDING", bookCount: 5, orderTotalCents: 2500, sourceAddress: "Beirut, Test Street, Building 4",
  defaults, collection: { amountCents: 2500, currency: "USD", problems: [] },
  cities, pendingConfirmations: ["API account and IP whitelisting", "UAT approval"],
};
let mode = "ready";
let submits = 0;
let savedOrderStatus = "NEW";
let savedDraft = null;
let saves = 0;
function bookingState() {
  const statuses = { booked: "CREATED", "missing-label": "CREATED", uncertain: "UNKNOWN", sending: "SUBMITTING", rejected: "REJECTED" };
  const status = statuses[mode];
  if (!status) return null;
  return {
    ...context, savedDraft: { ...savedDraft, editable: status === "REJECTED" },
    submission: { ...context.submission, status,
      trackingNumber: status === "CREATED" ? "12345678901" : null,
      labelUrl: mode === "booked" ? "https://ws.uat.aramex.net/labels/test.pdf" : null,
    },
  };
}
await page.context().addCookies([{ name: "admin-token", value: "mock-browser-only", url: origin }]);
await page.route("**/api/**", async route => {
  const request = route.request();
  if (request.url().endsWith("/shipping?summary=1")) return route.fulfill({ json: bookingState() || { draftStorageAvailable: true, savedDraft, submission: context.submission } });
  if (request.url().endsWith("/shipping")) {
    if (request.method() === "GET") {
      if (mode === "load-error") return route.fulfill({ status: 500, json: { error: "Unable to load shipment preparation." } });
      if (bookingState()) return route.fulfill({ json: bookingState() });
      return route.fulfill({ json: mode === "blocked" ? {
        ...context, purpose: "GIFT", paymentMethod: "CASH_ARRANGEMENT",
        collection: { amountCents: null, currency: "USD", problems: ["Record payment from the purchaser before preparing this order. The recipient must not be charged."] },
      } : mode === "new" ? {
        ...context, status: "NEW",
        collection: { amountCents: null, currency: "USD", problems: ["Confirm and save this order before preparing its Aramex delivery."] },
      } : mode === "paid" || mode === "paid-gift" ? {
        ...context, purpose: mode === "paid-gift" ? "GIFT" : "SELF", status: "CONFIRMED", paymentMethod: "WHISH", paymentStatus: "PAID",
        defaults: { ...defaults, ...(mode === "paid-gift" ? { recipientName: "Gift Recipient", recipientPhone: "71123456" } : {}) },
        collection: { amountCents: 0, currency: "USD", problems: [] },
      } : { ...context, draftStorageAvailable: mode !== "storage-missing", savedDraft: savedDraft ? { ...savedDraft, stale: mode === "changed" } : null } });
    }
    if (request.method() === "PUT") {
      const payload = request.postDataJSON();
      if (mode === "save-conflict") return route.fulfill({ status: 409, json: { error: "Someone saved a newer draft. Reload preparation before saving your changes." } });
      expect(payload.expectedDraftVersion).toBe(savedDraft?.version ?? null);
      savedDraft = { id: "shipment-1", version: (savedDraft?.version ?? 0) + 1, input: payload.input,
        updatedAt: "2026-10-20T12:00:00.000Z", stale: false, editable: true };
      saves++;
      return route.fulfill({ json: { savedDraft, preparation: lastPreparation } });
    }
    submits++;
    if (mode === "validation-error") return route.fulfill({ status: 400, json: {
      error: "Check the recipient and parcel details.",
      issues: [{ field: "recipientPhone", message: "Enter a valid Lebanese phone number." }, { field: "parcels.0.weightKg", message: "Check the packed weight." }],
    } });
    if (mode === "stale") return route.fulfill({ status: 409, json: { error: "This order changed. Reload preparation before continuing." } });
    const body = request.postDataJSON();
    expect(body).not.toHaveProperty("amountCents");
    lastPreparation = {
      kind: "aramex-shipping-preparation", version: 1, submissionEnabled: false,
      intendedEnvironment: "UAT", orderReference: context.reference, orderUpdatedAt: defaults.expectedUpdatedAt,
      orderTotalCents: context.orderTotalCents,
      recipient: { name: body.recipientName, phone: "+96170123456", email: null, countryCode: "LB",
        city: body.city, addressLines: [body.addressLine1, body.addressLine2, body.addressLine3].filter(Boolean) },
      contents: { description: "Books", bookCount: 5 }, parcels: body.parcels,
      numberOfPieces: body.parcels.length, totalWeightKg: body.parcels.reduce((sum, parcel) => sum + parcel.weightKg, 0),
      collection: { amountCents: 2500, currency: "USD", reason: "Unpaid cash-on-delivery order total." },
      warnings: ["Draft only. No shipment or pickup has been created."],
      pendingConfirmations: context.pendingConfirmations,
    };
    return route.fulfill({ json: lastPreparation });
  }
  if (new URL(request.url()).pathname === "/api/admin/book-orders/order-1") {
    if (request.method() === "PATCH") savedOrderStatus = request.postDataJSON().status;
    return route.fulfill({ json: {
      id: "order-1", reference: context.reference, updatedAt: defaults.expectedUpdatedAt,
      createdAt: defaults.expectedUpdatedAt, purpose: "SELF", selectionMode: "CUSTOM",
      requestedBookCount: 5, priceCents: 2500, customerName: "Test Purchaser", customerPhone: "70123456",
      customerEmail: null, fulfillmentMethod: "DELIVERY", governorate: "BEIRUT", area: "Beirut",
      detailedAddress: defaults.addressLine1, recipientName: null, recipientPhone: null,
      giftMessage: null, showSenderName: false, paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "PENDING", status: savedOrderStatus, adminNotes: null, whishPayment: null, items: [],
    } });
  }
  if (request.url().endsWith("/auth/me")) return route.fulfill({ json: { user: { name: "Test Admin", role: "ADMIN" } } });
  return route.fulfill({ json: {} });
});
let lastPreparation = null;

try {
  if (process.env.ARAMEX_SEND_ONLY === "1") {
    let enabled = false; let failure = false; let outcome = "CREATED"; let sends = 0;
    savedDraft = { id: "shipment-1", version: 4, updatedAt: defaults.expectedUpdatedAt, stale: false, editable: true,
      input: { ...defaults, city: "Beirut", parcels: [{ weightKg: 1 }] } };
    await page.route("**/shipping/submit", async route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { available: enabled } });
      sends++;
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({ expectedDraftVersion: 4, confirmedUat: true });
      expect(Object.keys(body).sort()).toEqual(["confirmedUat", "dueAt", "expectedDraftVersion", "shippingAt"]);
      expect(body.shippingAt).toMatch(/Z$/);
      if (failure) return route.abort("failed");
      mode = outcome === "CREATED" ? "booked" : outcome === "UNKNOWN" ? "uncertain" : "rejected";
      return route.fulfill({ json: { status: outcome } });
    });
    await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle" });
    let sendPanel = page.getByRole("region", { name: "Send a UAT shipment" });
    await expect(sendPanel.getByRole("button", { name: "Review test shipment" })).toBeDisabled();
    enabled = true;
    savedDraft.input.city = "Custom test area";
    await page.reload({ waitUntil: "networkidle" });
    await expect(sendPanel.getByText(/Choose an approved Aramex city/)).toBeVisible();
    await expect(sendPanel.getByRole("button", { name: "Review test shipment" })).toBeDisabled();
    savedDraft.input.city = "Beirut";
    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Recipient name", { exact: false }).fill("Unsaved Recipient");
    await expect(sendPanel.getByText("Save your latest changes before sending.")).toBeVisible();
    await expect(sendPanel.getByRole("button", { name: "Review test shipment" })).toBeDisabled();
    await page.reload({ waitUntil: "networkidle" });
    const localDate = days => {
      const date = new Date(Date.now() + days * 86400000); date.setSeconds(0, 0);
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    };
    async function review() {
      await sendPanel.getByRole("button", { name: "Review test shipment" }).click();
      await expect(sendPanel.getByText("Check saved draft · version 4")).toBeVisible();
      await expect(sendPanel.getByRole("button", { name: "Create Aramex test shipment" })).toBeDisabled();
      await sendPanel.getByLabel("Shipping date and time").fill(localDate(1));
      await sendPanel.getByLabel("Due date and time").fill(localDate(2));
      await sendPanel.getByRole("checkbox").check();
    }
    await review();
    await sendPanel.getByLabel("Due date and time").fill(localDate(-1));
    await sendPanel.getByRole("button", { name: "Create Aramex test shipment" }).click();
    await expect(sendPanel.getByRole("alert")).toContainText("Choose a future shipping time");
    expect(sends).toBe(0);
    await sendPanel.getByLabel("Due date and time").fill(localDate(2));
    await page.setViewportSize({ width: 390, height: 844 });
    await sendPanel.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: ".impeccable/aramex-review/send-review-mobile.png", fullPage: true });
    failure = true;
    await sendPanel.getByRole("button", { name: "Create Aramex test shipment" }).click();
    await expect(sendPanel.getByRole("alert")).toContainText("do not send it again");
    await expect(sendPanel.getByRole("button", { name: "Create Aramex test shipment" })).toHaveCount(0);
    expect(sends).toBe(1);
    failure = false;
    await sendPanel.getByRole("button", { name: "Reload saved shipment" }).click();
    await review();
    await sendPanel.getByRole("button", { name: "Create Aramex test shipment" }).click();
    await expect(page.getByRole("link", { name: "Open printable label" })).toBeVisible();
    await expect(sendPanel).toHaveCount(0);
    for (const state of ["UNKNOWN", "REJECTED"]) {
      mode = "ready"; outcome = state;
      await page.reload({ waitUntil: "networkidle" });
      await review();
      await sendPanel.getByRole("button", { name: "Create Aramex test shipment" }).click();
      if (state === "UNKNOWN") await expect(page.getByText("Shipment confirmation needed", { exact: true })).toBeVisible();
      else {
        await expect(page.getByText("Shipment request rejected", { exact: true })).toBeVisible();
        await expect(sendPanel.getByRole("button", { name: "Review test shipment" })).toBeDisabled();
      }
    }
    expect(sends).toBe(4); expect(errors).toEqual([]);
    console.log("Send UI passed: disabled config, unsaved changes, explicit review/dates/confirmation, mobile, lost response lock, CREATED/UNKNOWN/REJECTED reload.");
    await browser.close(); process.exit(0);
  }
  if (process.env.ARAMEX_INBOX_ONLY === "1") {
    let unavailable = false;
    let empty = false;
    let calls = 0;
    await page.route("**/aramex/tracking-inbox?*", route => {
      calls++;
      if (unavailable) return route.fulfill({ status: 503, json: { error: "Tracking storage unavailable. Try again." } });
      const query = new URL(route.request().url()).searchParams;
      const pageNumber = Number(query.get("page"));
      const searched = !!query.get("trackingNumber");
      return route.fulfill({ json: { page: pageNumber, total: empty || searched ? 0 : 26, totalPages: empty || searched ? 1 : 2,
        events: empty || searched ? [] : [{ id: `event-${pageNumber}`, trackingNumber: pageNumber === 1 ? "12345678901" : "98765432100",
          code: "SH005", problemCode: "", description: "Delivered", reason: pageNumber === 1 ? "NO_BOOKING" : "READY_TO_LINK",
          order: pageNumber === 1 ? null : { id: "order-1", reference: "LEE-BK-BROWSER" }, orderNumber: "unverified-reference",
          occurredAt: "2026-10-20T10:00:00Z", receivedAt: "2026-10-22T12:00:00Z", location: "Beirut",
          comments: "<script>window.injected=true</script>" }] } });
    });
    await page.goto(`${origin}/admin/book-orders/tracking-inbox`, { waitUntil: "networkidle" });
    await expect(page.getByText("No matching test shipment", { exact: true })).toBeVisible();
    await page.getByText("Carrier notes", { exact: true }).click();
    await expect(page.getByText("<script>window.injected=true</script>", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.injected)).toBeUndefined();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Matching shipment is now available", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open order LEE-BK-BROWSER" })).toHaveAttribute("href", "/admin/book-orders/order-1/shipping");
    await page.getByLabel("Full tracking number").fill("99999999999");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText(/No unmatched updates for this tracking number/)).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.getByText("No matching test shipment", { exact: true })).toBeVisible();
    unavailable = true;
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Tracking storage unavailable" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    unavailable = false; empty = true;
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(page.getByText(/No unmatched updates right now/)).toBeVisible();
    empty = false;
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: ".impeccable/aramex-review/inbox-mobile.png", fullPage: true });
    expect(calls).toBeGreaterThanOrEqual(7); expect(errors).toEqual([]); expect(submits).toBe(0);
    console.log("Inbox passed: reasons, pagination, exact search, escaped notes, empty/error/retry states and mobile.");
    await browser.close(); process.exit(0);
  }
  if (process.env.ARAMEX_LABEL_ONLY === "1") {
    mode = "missing-label";
    savedDraft = { id: "shipment-1", version: 1, updatedAt: defaults.expectedUpdatedAt, stale: false,
      input: { ...defaults, city: "Beirut", parcels: [{ weightKg: 1 }] } };
    let enabled = false;
    let fails = false;
    let requests = 0;
    await page.route("**/shipping/label", route => {
      if (route.request().method() === "GET") return route.fulfill({ json: { available: enabled } });
      requests++;
      return route.fulfill(fails ? { status: 503, json: { error: "Aramex is unavailable. Existing label kept." } }
        : { json: { labelUrl: "https://ws.uat.aramex.net/labels/recovered.pdf" } });
    });
    await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle" });
    const section = page.getByRole("region", { name: "Retrieve shipment label" });
    const button = section.getByRole("button", { name: "Retrieve label from Aramex" });
    await expect(button).toBeDisabled();
    enabled = true;
    await page.reload({ waitUntil: "networkidle" });
    await button.click();
    await expect(section.getByRole("link", { name: "Open label to print" })).toHaveAttribute("href", "https://ws.uat.aramex.net/labels/recovered.pdf");
    await expect(page.getByText(/Shipment created; label is not available yet/)).toHaveCount(0);
    fails = true;
    await button.click();
    await expect(section.getByRole("alert")).toContainText("Existing label kept");
    await expect(section.getByRole("link")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await section.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: ".impeccable/aramex-review/label-mobile.png", fullPage: true });
    expect(requests).toBe(2); expect(submits).toBe(0); expect(errors).toEqual([]);
    console.log("Label retrieval passed: disabled gate, success, retained link after error, mobile; no shipment submission.");
    await browser.close();
    process.exit(0);
  }
  if (process.env.ARAMEX_TRACKING_ONLY === "1") {
    mode = "booked";
    savedDraft = { id: "shipment-1", version: 1, updatedAt: defaults.expectedUpdatedAt, stale: false,
      input: { ...defaults, city: "Beirut", parcels: [{ weightKg: 1 }] } };
    let history = { environment: "UAT", status: "AWAITING_UPDATES", needsReview: false, truncated: false, events: [] };
    let unavailable = false;
    let lookupCalls = 0;
    let received = 2;
    await page.route("**/shipping/tracking/sync", route => {
      lookupCalls++;
      expect(route.request().method()).toBe("POST");
      expect(route.request().postDataJSON()).toEqual({});
      return route.fulfill({ json: { received, added: received ? 1 : 0, checkedAt: new Date().toISOString() } });
    });
    await page.route("**/shipping/tracking", route => unavailable
      ? route.fulfill({ status: 503, json: { error: "Tracking history is unavailable." } })
      : route.fulfill({ json: history }));
    await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "View received updates" }).click({ timeout: 60000 });
    await expect(page.getByText(/No updates have been received yet/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Check Aramex for missed updates" })).toBeDisabled();
    history = { lookupAvailable: true, environment: "UAT", status: "DELIVERED", needsReview: true, truncated: false, events: [
      { id: "event-2", code: "SH999", problemCode: "", description: null, occurredAt: "2026-10-22T13:00:00Z", receivedAt: "2026-10-22T13:01:00Z", location: "Beirut", comments: "<script>not executable</script>" },
      { id: "event-1", code: "SH005", problemCode: "", description: "Delivered", occurredAt: "2026-10-22T12:00:00Z", receivedAt: "2026-10-22T12:01:00Z", location: "Beirut", comments: "Delivered to test recipient." },
    ] };
    await page.getByRole("button", { name: "Refresh received updates" }).click();
    const tracking = page.getByRole("region", { name: "Delivery tracking" });
    await expect(tracking.getByText(/Some updates are unknown or conflicting/)).toBeVisible();
    await expect(tracking.getByText("<script>not executable</script>", { exact: true })).toBeVisible();
    expect(await tracking.locator("script").count()).toBe(0);
    await expect(tracking.getByText(/Delivery does not confirm COD settlement/)).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await tracking.screenshot({ path: ".impeccable/aramex-review/tracking-mobile.png" });
    await page.getByRole("button", { name: "Check Aramex for missed updates" }).click();
    await expect(tracking.getByRole("status")).toContainText("1 new updates saved");
    expect(lookupCalls).toBe(1);
    received = 0;
    await page.getByRole("button", { name: "Check Aramex for missed updates" }).click();
    await expect(tracking.getByRole("status")).toContainText("this does not mean no shipment exists");
    await expect(tracking.getByText("Delivered", { exact: true })).toBeVisible();
    unavailable = true;
    await page.getByRole("button", { name: "Refresh received updates" }).click();
    await expect(tracking.getByRole("alert")).toContainText("Tracking history is unavailable.");
    expect(errors).toEqual([]);
    console.log("Tracking history, disabled/enabled lookup, new/empty results and mobile display passed (mocked APIs).");
    await browser.close(); process.exit(0);
  }
  if (process.env.ARAMEX_RECOVERY_ONLY === "1") {
    mode = "uncertain";
    savedDraft = { id: "shipment-1", version: 1, updatedAt: defaults.expectedUpdatedAt, stale: false,
      input: { ...defaults, city: "Beirut", parcels: [{ weightKg: 1 }] } };
    let recent = true;
    let recorded = null;
    await page.route("**/shipping/reconciliation", route => {
      if (route.request().method() === "POST") {
        recorded = route.request().postDataJSON();
        mode = recorded.outcome === "CREATED" ? "booked" : "rejected";
        return route.fulfill({ json: { status: mode === "booked" ? "CREATED" : "REJECTED" } });
      }
      return route.fulfill({ json: { status: "UNKNOWN", environment: "UAT", updatedAt: defaults.expectedUpdatedAt,
        attempt: { id: "attempt-1", submissionKey: "request-test-1", startedAt: "2026-10-20T12:00:00Z",
          availableAt: recent ? new Date(Date.now() + 300000).toISOString() : "2026-10-20T12:05:00Z", reconciliation: null } } });
    });
    await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Review uncertain booking" }).click({ timeout: 60000 });
    await expect(page.getByText(/Recovery is unavailable/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Record verified outcome" })).toHaveCount(0);
    recent = false;
    await page.getByRole("button", { name: "Reload attempt details" }).click();
    await page.getByLabel(/Confirmed tracking number/).fill("12345678901");
    await page.getByLabel(/Evidence source/).selectOption("ARAMEX_SUPPORT");
    await page.getByLabel(/Evidence reference/).fill("Support ticket TEST-123");
    await page.getByLabel(/What did Aramex confirm/).fill("Aramex support confirmed this request belongs to the stated tracking number.");
    const recovery = page.getByRole("region", { name: "Shipment recovery" });
    expect(await recovery.locator("form").evaluate(form => form.checkValidity())).toBe(false);
    await page.getByRole("checkbox").check();
    await page.setViewportSize({ width: 390, height: 844 });
    await recovery.screenshot({ path: ".impeccable/aramex-review/recovery-mobile.png" });
    await page.getByRole("button", { name: "Record verified outcome" }).click();
    await expect(page.getByText("Shipment created", { exact: true })).toBeVisible({ timeout: 60000 });
    expect(recorded).toMatchObject({ expectedAttemptId: "attempt-1", outcome: "CREATED", confirmed: true, trackingNumber: "12345678901" });
    mode = "uncertain";
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Review uncertain booking" }).click({ timeout: 60000 });
    await page.getByLabel(/Confirmed outcome/).selectOption("NOT_CREATED");
    await expect(page.getByLabel(/Confirmed tracking number/)).toHaveCount(0);
    await page.getByLabel(/Evidence source/).selectOption("ARAMEX_SUPPORT");
    await page.getByLabel(/Evidence reference/).fill("Support ticket TEST-456");
    await page.getByLabel(/What did Aramex confirm/).fill("Aramex support confirmed no shipment was created for this exact request.");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Record verified outcome" }).click();
    await expect(page.getByText(/No shipment was created for this attempt/)).toBeVisible({ timeout: 60000 });
    expect(recorded).toMatchObject({ outcome: "NOT_CREATED", trackingNumber: "", labelUrl: "", confirmed: true });
    expect(errors).toEqual([]);
    console.log("Recovery cooldown, required evidence, mobile form and both outcomes passed (mocked APIs).");
    await browser.close(); process.exit(0);
  }
  if (process.env.ARAMEX_CITY_ONLY === "1") {
    await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle", timeout: 120000 });
    await expect(page.locator("#shipping-city")).toBeVisible({ timeout: 60000 });
    await page.locator("#shipping-city").focus();
    await expect(page.getByRole("listbox", { name: "Cities" })).toBeVisible();
    await page.locator("#shipping-city").fill("Bei");
    await expect(page.getByRole("option", { name: "Beirut", exact: true })).toBeVisible();
    await page.screenshot({ path: ".impeccable/aramex-review/city-suggestions-desktop.png" });
    await page.locator("#shipping-city").press("ArrowDown");
    await page.locator("#shipping-city").press("Enter");
    await expect(page.locator("#shipping-city")).toHaveValue("Beirut");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.locator("#shipping-city").fill("Trab");
    await page.getByRole("option", { name: "Trablous", exact: true }).click();
    await expect(page.locator("#shipping-city")).toHaveValue("Trablous");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#shipping-city").fill("Bei");
    await expect(page.getByRole("option", { name: "Beirut", exact: true })).toBeVisible();
    await page.screenshot({ path: ".impeccable/aramex-review/city-suggestions-mobile.png" });
    await page.locator("#shipping-city").press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await page.locator("#shipping-city").fill("test");
    await expect(page.getByRole("option").filter({ hasText: 'Use' }).filter({ hasText: 'test' })).toBeVisible();
    await page.locator("#shipping-city").press("Enter");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(page.locator("#shipping-city")).toHaveValue("test");
    expect(submits).toBe(0);
    expect(await page.locator("#shipping-city").evaluate(input => input.checkValidity())).toBe(true);
    await page.locator("#parcel-0-weightKg").fill("1.2");
    await page.getByRole("button", { name: "Review shipping draft" }).click();
    await expect(page.getByRole("region", { name: "Shipping draft review" })).toBeVisible();
    await page.getByRole("button", { name: "Save shipping draft", exact: true }).click();
    await expect(page.getByText("Shipping draft saved. You can leave and return to it later.")).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("#shipping-city")).toHaveValue("test", { timeout: 60000 });
    console.log("City suggestions and custom-text draft save/reopen passed (mocked APIs).");
    await browser.close();
    process.exit(0);
  }
  console.log("Checking preparation, review/save, mobile layout and payment eligibility...");
  await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle", timeout: 120000 });
  await expect(page.getByRole("heading", { name: "Prepare book delivery" })).toBeVisible();
  await page.locator("#shipping-city").focus();
    await expect(page.getByRole("listbox", { name: "Cities" })).toBeVisible();
  await expect(page.locator("#shipping-city-hint")).toContainText("Custom text can be saved");
  const requiredFields = page.locator("input[required], select[required]");
  await expect(requiredFields).toHaveCount(5);
  for (const input of await requiredFields.all()) {
    const fieldId = await input.getAttribute("id");
    await expect(page.locator(`label[for="${fieldId}"] .text-red-400`)).toHaveText("*");
  }
  await page.locator("#shipping-city").fill("Beirut");
  await page.locator("#parcel-0-weightKg").fill("1.2");
  await expect(page.locator("#parcel-0-lengthCm")).not.toHaveAttribute("required");
  await page.locator("#parcel-0-lengthCm").fill("30");
  await expect(requiredFields).toHaveCount(8);
  await expect(page.locator("#parcel-0-widthCm")).toHaveAttribute("required");
  expect(await page.locator("form").evaluate(form => form.checkValidity())).toBe(false);
  await page.locator("#parcel-0-lengthCm").fill("");
  await expect(requiredFields).toHaveCount(5);
  await page.getByRole("button", { name: "Review shipping draft" }).click();
  const review = page.getByRole("region", { name: "Shipping draft review" });
  await expect(review).toBeVisible();
  await expect(review).toContainText("$25.00");
  await expect(review).toContainText("+96170123456");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download preparation" }).click();
  const download = await downloading;
  const exported = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(exported.submissionEnabled).toBe(false);
  expect(exported).not.toHaveProperty("ClientInfo");
  expect(exported.parcels).toEqual([{ weightKg: 1.2 }]);
  await page.getByRole("button", { name: "Save shipping draft", exact: true }).click();
  await expect(page.getByText("Shipping draft saved. You can leave and return to it later.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Draft saved", exact: true })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Return to order", exact: true })).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Saved shipping draft", { exact: true })).toBeVisible();
  await expect(page.locator("#shipping-city")).toHaveValue("Beirut");
  await expect(page.locator("#parcel-0-weightKg")).toHaveValue("1.2");
  await expect(page.locator("#parcel-0-lengthCm")).toHaveValue("");
  await expect(page.locator("#parcel-0-widthCm")).toHaveValue("");
  await expect(page.locator("#parcel-0-heightCm")).toHaveValue("");
  await expect(review).toHaveCount(0);
  mode = "booked";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/Dimensions not provided/)).toBeVisible();
  mode = "changed";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/The order or payment changed since this draft was saved/)).toBeVisible();
  mode = "ready";
  await page.locator("#shipping-name").fill("Corrected Recipient");
  await expect(review).toHaveCount(0);
  await page.getByRole("button", { name: "Add parcel" }).click();
  await expect(page.locator("#parcel-1-weightKg")).toBeVisible();
  await page.getByRole("button", { name: "Remove parcel 2" }).click();
  await expect(page.locator("#parcel-1-weightKg")).toHaveCount(0);
  await mkdir(".impeccable/aramex-review", { recursive: true });
  await page.screenshot({ path: ".impeccable/aramex-review/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => Math.round((await page.locator("aside").boundingBox()).width)).toBe(72);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: ".impeccable/aramex-review/mobile.png", fullPage: true });
  mode = "stale";
  await page.getByRole("button", { name: "Review shipping draft" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "This order changed" })).toBeVisible();
  await expect(review).toHaveCount(0);
  mode = "blocked";
  await page.getByRole("button", { name: "Reload preparation" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Record payment from the purchaser" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review shipping draft" })).toHaveCount(0);
  mode = "new";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("alert").filter({ hasText: "Confirm and save" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review shipping draft" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Review order and payment" })).toBeVisible();
  mode = "paid";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("dl").first()).toContainText("$25.00");
  await expect(page.locator("dl").first()).toContainText("$0.00");
  await expect(page.getByText("Already paid — nothing to collect on delivery.")).toBeVisible();
  await page.screenshot({ path: ".impeccable/aramex-review/paid-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  savedDraft = null;
  await page.goto(`${origin}/admin/book-orders/order-1`, { waitUntil: "networkidle", timeout: 120000 });
  // A self order has no separate gift-recipient fields: display the purchaser.
  await expect(page.getByText("Test Purchaser", { exact: true })).toHaveCount(2);
  await expect(page.getByText("70123456", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Prepare Aramex delivery" })).toBeDisabled();
  await expect(page.getByText("Confirm and save this order before preparing its Aramex delivery.")).toBeVisible();
  await page.getByLabel("Order status").selectOption("CONFIRMED");
  await expect(page.getByRole("link", { name: "Prepare Aramex delivery" })).toHaveCount(0);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("link", { name: "Prepare Aramex delivery" })).toBeVisible();
  // Save conflict preserves the form and never claims the save succeeded.
  mode = "ready";
  await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle" });
  await page.locator("#shipping-city").fill("Beirut");
  for (const [key, value] of Object.entries({ weightKg: "1.2", lengthCm: "30", widthCm: "20", heightCm: "10" })) {
    await page.locator(`#parcel-0-${key}`).fill(value);
  }
  await page.getByRole("button", { name: "Review shipping draft" }).click();
  mode = "save-conflict";
  await page.getByRole("button", { name: "Save shipping draft", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Someone saved a newer draft" })).toBeVisible();
  await expect(page.locator("#shipping-city")).toHaveValue("Beirut");
  await expect(page.getByText("Shipping draft saved. You can leave and return to it later.")).toHaveCount(0);
  mode = "ready";
  await page.getByRole("button", { name: "Review shipping draft" }).click();
  await page.getByRole("button", { name: "Save shipping draft", exact: true }).click();
  await expect(page.getByText("Shipping draft saved. You can leave and return to it later.")).toBeVisible();
  await page.goto(`${origin}/admin/book-orders/order-1`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "Continue Aramex draft" })).toBeVisible();
  await expect(page.getByText(/Shipping draft saved.*Not booked/)).toBeVisible();
  mode = "booked";
  console.log("Checking booked, missing-label, uncertain and rejected shipment states...");
  await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle" });
  await expect(page.getByRole("region", { name: "Aramex shipment status" })).toContainText("12345678901");
  await expect(page.getByRole("link", { name: "Open printable label" })).toHaveAttribute("href", "https://ws.uat.aramex.net/labels/test.pdf");
  await expect(page.getByRole("button", { name: "Review shipping draft" })).toHaveCount(0);
  await expect(page.getByText(/No shipment has been booked/)).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => Math.round((await page.locator("aside").boundingBox()).width)).toBe(72);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: ".impeccable/aramex-review/booked-mobile.png", fullPage: true });
  mode = "missing-label";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/Shipment created; label is not available yet/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open printable label" })).toHaveCount(0);
  for (const pending of ["uncertain", "sending"]) {
    mode = pending;
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText(/Aramex may already have created this shipment/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Review shipping draft" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Create Aramex test shipment" })).toHaveCount(0);
  }
  await page.screenshot({ path: ".impeccable/aramex-review/uncertain-mobile.png", fullPage: true });
  mode = "rejected";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(/No shipment was created for this attempt/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Review shipping draft" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review test shipment" })).toBeDisabled();
  mode = "booked";
  savedOrderStatus = "DISPATCHED";
  await page.goto(`${origin}/admin/book-orders/order-1`, { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: "View Aramex shipment" })).toBeVisible();
  expect(submits).toBe(4);
  expect(saves).toBe(2);

  // A staff member should be taken to actionable errors, not left at the bottom.
  console.log("Checking error recovery, navigation protection and final save flow...");
  mode = "ready";
  await page.goto(`${origin}/admin/book-orders/order-1/shipping`, { waitUntil: "networkidle" });
  await page.locator("#shipping-phone").fill("12345");
  mode = "validation-error";
  await page.getByRole("button", { name: "Review shipping draft" }).click();
  await expect(page.locator("#shipping-errors")).toBeFocused();
  await expect(page.locator("#shipping-phone")).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("link", { name: "Lebanese phone: Enter a valid Lebanese phone number." }).click();
  await expect(page.locator("#shipping-phone")).toBeFocused();
  await page.getByRole("link", { name: "Parcel 1 weight: Check the packed weight." }).click();
  await expect(page.locator("#parcel-0-weightKg")).toBeFocused();
  await page.screenshot({ path: ".impeccable/aramex-review/validation-desktop.png", fullPage: true });

  // Cancelling a sidebar exit must preserve work, not just the Back to order link.
  dismissNavigation = true;
  const beforeDialogs = dialogs;
  const exit = page.locator('aside a[href]').first();
  await exit.click();
  await expect(page).toHaveURL(/\/shipping$/);
  expect(dialogs).toBe(beforeDialogs + 1);
  await expect(page.locator("#shipping-phone")).toHaveValue("12345");
  dismissNavigation = false;

  // Explicitly inspect a prepaid gift, where purchaser and recipient differ.
  mode = "paid-gift";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#shipping-name")).toHaveValue("Gift Recipient");
  await expect(page.locator("#shipping-email")).toHaveValue("");
  await expect(page.getByText("Already paid — nothing to collect on delivery.")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".impeccable/aramex-review/gift-mobile.png", fullPage: true });

  // Validate the complete review/save finish on a narrow phone.
  mode = "ready";
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#shipping-name").fill("Reviewed Recipient");
  await page.getByRole("button", { name: "Review shipping draft" }).click();
  await expect(review).toBeFocused();
  await expect(review).toContainText("Checking or downloading does not save");
  await page.screenshot({ path: ".impeccable/aramex-review/review-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Save shipping draft", exact: true }).click();
  await expect(review).toContainText("Draft saved — not booked");
  await expect(page.getByRole("button", { name: "Draft saved", exact: true })).toBeDisabled();
  await page.screenshot({ path: ".impeccable/aramex-review/saved-mobile.png", fullPage: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  mode = "load-error";
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("#shipping-errors")).toBeFocused();
  await expect(page.getByRole("button", { name: "Review shipping draft" })).toHaveCount(0);
  mode = "storage-missing";
  await page.getByRole("button", { name: "Reload preparation" }).click();
  await expect(page.getByText(/Saving drafts is awaiting the shipping database update/)).toBeVisible();
  await page.getByRole("button", { name: "Review shipping draft" }).click();
  await expect(page.getByRole("button", { name: "Save shipping draft", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
  console.log("Aramex browser checks passed: drafts, payments/gifts, conflicts, eligibility, booking outcomes, actionable error focus, sidebar exit protection, review/save completion and 320–1440px overflow checks. All APIs mocked.");
} finally {
  await browser.close();
}
