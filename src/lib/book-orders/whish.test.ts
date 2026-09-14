import { describe, expect, it } from "vitest";
import { BOOK_PACKAGES, deliveryFeeCents, type BookPackageKey } from "./config";
import { emptyWhishConfig, makeSnapshot, paymentDeadline, isWhishAvailable, snapshotActive } from "./whish-config";
import { accessTokenSchema, canFulfilWhish, canReportPayment, normalizedReference, paymentReportSchema, reviewProblem, shouldExpire } from "./whish-policy";
import { bookOrderSchema } from "./validation";

function configured() {
  const c = emptyWhishConfig();
  return { ...c, enabled: true, accountName: "LEE test account", accountNumber: "+96170123456", supportPhone: "96170123456",
    qrImageUrl: "https://assets.example.test/whish.webp", qrVerified: true };
}
const token = "ab".repeat(32);
describe("Whish checkout readiness and exact totals", () => {
  it("starts disabled until a permanent QR is uploaded and verified", () => {
    expect(isWhishAvailable(emptyWhishConfig())).toBe(false);
    expect(makeSnapshot(emptyWhishConfig(), 500)).toBeNull();
  });
  it.each([
    ["SINGLE", "PICKUP", 500], ["SINGLE", "DELIVERY", 900], ["SINGLE", "LEE_DISTRIBUTION", 500],
    ["FIVE", "PICKUP", 2500], ["FIVE", "DELIVERY", 2500], ["FIVE", "LEE_DISTRIBUTION", 2500],
    ["TEN_PLUS_ONE", "PICKUP", 5000], ["TEN_PLUS_ONE", "DELIVERY", 5000], ["TEN_PLUS_ONE", "LEE_DISTRIBUTION", 5000],
    ["TWENTY_PLUS_TWO", "PICKUP", 8000], ["TWENTY_PLUS_TWO", "DELIVERY", 8000], ["TWENTY_PLUS_TWO", "LEE_DISTRIBUTION", 8000],
  ])("selects the exact QR for %s / %s", (key, method, expected) => {
    const pack = key as BookPackageKey;
    const amount = BOOK_PACKAGES[pack].priceCents + deliveryFeeCents(pack, method as string);
    expect(amount).toBe(expected);
    expect(makeSnapshot(configured(), amount)).toMatchObject({ amountCents: expected, currency: "USD" });
  });
  it("uses the same permanent QR for any valid order total", () => {
    expect(makeSnapshot(configured(), 2900)).toMatchObject({ amountCents: 2900, imageUrl: "https://assets.example.test/whish.webp" });
  });
  it("blocks a missing or unverified QR", () => {
    expect(isWhishAvailable({ ...configured(), qrVerified: false })).toBe(false);
    expect(isWhishAvailable({ ...configured(), qrImageUrl: "" })).toBe(false);
  });
  it("stops displaying historical instructions when disabled or recipient changed", () => {
    const c = configured(); const s = makeSnapshot(c, 500)!;
    expect(snapshotActive(c, s)).toBe(true);
    expect(snapshotActive({ ...c, enabled: false }, s)).toBe(false);
    expect(snapshotActive({ ...c, accountNumber: "96170999999" }, s)).toBe(false);
  });
  it("uses the configured order payment window", () => {
    const c = configured(); const now = new Date("2030-01-01T00:00:00Z");
    expect(paymentDeadline(c, makeSnapshot(c, 500)!, now).toISOString()).toBe("2030-01-02T00:00:00.000Z");
  });
});
describe("Whish reports and verification", () => {
  it("requires a cryptographically sized access token and explicit consent", () => {
    expect(accessTokenSchema.safeParse(token).success).toBe(true);
    expect(accessTokenSchema.safeParse("LEE-BK-2026-ABC12345").success).toBe(false);
    const order = { locale: "en", package: "SINGLE", purpose: "SELF", selectionMode: "CUSTOM", selectedBookIds: ["book-1"], selectedEditions: [{ bookId: "book-1", editionId: "edition-1" }],
      customerName: "Maya Haddad", customerPhone: "70123456", fulfillmentMethod: "PICKUP", paymentMethod: "WHISH", paymentAccessToken: token, termsAccepted: true };
    expect(bookOrderSchema.safeParse(order).success).toBe(true);
    expect(bookOrderSchema.safeParse({ ...order, termsAccepted: false }).success).toBe(false);
    expect(bookOrderSchema.safeParse({ ...order, paymentAccessToken: undefined }).success).toBe(false);
    expect(bookOrderSchema.safeParse({ ...order, purpose: "DONATION", selectionMode: "LEE_CHOICE", selectedEditions: [], fulfillmentMethod: "LEE_DISTRIBUTION" }).success).toBe(true);
    expect(bookOrderSchema.safeParse({ ...order, purpose: "GIFT", fulfillmentMethod: "DELIVERY", recipientName: "Recipient", recipientPhone: "70999999", governorate: "BEIRUT", area: "Hamra", detailedAddress: "Building 5" }).success).toBe(true);
  });
  it("ignores customer-supplied paid flags and rejects invalid receipt data", () => {
    const result = paymentReportSchema.parse({ transactionReference: "REF-123", senderPhone: "70123456", paid: true, amountCents: 1 });
    expect(result).not.toHaveProperty("paid");
    expect(result).not.toHaveProperty("amountCents");
    expect(paymentReportSchema.safeParse({ transactionReference: "", senderPhone: "xx" }).success).toBe(false);
    expect(paymentReportSchema.safeParse({ transactionReference: "", senderPhone: "70123456" }).success).toBe(true);
  });
  it("requires review, a wallet check and an exact received amount in USD", () => {
    const input = { action: "VERIFY" as const, expectedUpdatedAt: new Date().toISOString(), transactionReference: "REF-123", receivedAmountCents: 900, currency: "USD" as const, checkedWallet: true, note: "" };
    expect(reviewProblem(input, "UNDER_REVIEW", 900)).toBeNull();
    expect(reviewProblem(input, "AWAITING_PAYMENT", 900)).not.toBeNull();
    expect(reviewProblem({ ...input, checkedWallet: false }, "UNDER_REVIEW", 900)).not.toBeNull();
    expect(reviewProblem({ ...input, receivedAmountCents: 500 }, "UNDER_REVIEW", 900)).not.toBeNull();
    expect(reviewProblem({ ...input, currency: undefined }, "UNDER_REVIEW", 900)).not.toBeNull();
  });
  it("requires an explanation for corrections and actual refund confirmation", () => {
    const base = { expectedUpdatedAt: new Date().toISOString(), note: "" };
    expect(reviewProblem({ ...base, action: "REQUEST_CORRECTION" }, "UNDER_REVIEW", 500)).not.toBeNull();
    expect(reviewProblem({ ...base, action: "REFUND", note: "Refund R-123" }, "VERIFIED", 500)).not.toBeNull();
  });
  it("never expires a submitted payment awaiting staff verification", () => {
    const past = new Date("2000-01-01");
    expect(shouldExpire("AWAITING_PAYMENT", past)).toBe(true);
    expect(shouldExpire("CHANGES_REQUESTED", past)).toBe(true);
    for (const state of ["UNDER_REVIEW", "VERIFIED", "EXPIRED", "CANCELLED", "REFUNDED"] as const) expect(shouldExpire(state, past)).toBe(false);
    expect(canReportPayment("EXPIRED")).toBe(true);
    expect(canReportPayment("CANCELLED")).toBe(true);
    expect(canReportPayment("VERIFIED")).toBe(false);
  });
  it("requires both verified receipt and paid order status before fulfilment", () => {
    expect(canFulfilWhish("UNDER_REVIEW", "PAID")).toBe(false);
    expect(canFulfilWhish("VERIFIED", "REFUNDED")).toBe(false);
    expect(canFulfilWhish("VERIFIED", "PAID")).toBe(true);
    expect(normalizedReference(" Ref 123 ")).toBe(normalizedReference("REF123"));
  });
});
