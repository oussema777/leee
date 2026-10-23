import { describe, expect, it, vi } from "vitest";
import { assessTestTransaction, decimalCents, lookupTestTransaction, TransactionLookupPending } from "./transaction";
const expected = { transactionId: "123456789012", merchantId: "test", reference: "LEE-T-example", amountCents: 500 };
function result() { return { id: expected.transactionId, merchantId: expected.merchantId, clientReferenceInformation: { code: expected.reference }, orderInformation: { amountDetails: { totalAmount: "5.00", currency: "USD", authorizedAmount: "5.00" } }, applicationInformation: { status: "AUTHORIZED", reasonCode: 100, applications: [{ name: "ics_auth", reasonCode: 100, rCode: 1 }] } }; }
describe("server transaction verification", () => {
  it("treats a not-yet-indexed transaction as pending without retrying the provider", async () => {
    vi.stubEnv("CYBERSOURCE_TEST_MERCHANT_ID", "test");
    vi.stubEnv("CYBERSOURCE_TEST_KEY_ID", "test-key");
    vi.stubEnv("CYBERSOURCE_TEST_SECRET_KEY", Buffer.alloc(32, 7).toString("base64"));
    try {
      const fetcher = vi.fn(async () => new Response("Not indexed", { status: 404 }));
      await expect(lookupTestTransaction(expected.transactionId, fetcher)).rejects.toBeInstanceOf(TransactionLookupPending);
      expect(fetcher).toHaveBeenCalledTimes(1);
      const failed = vi.fn(async () => new Response("Unavailable", { status: 503 }));
      await expect(lookupTestTransaction(expected.transactionId, failed)).rejects.toThrow("CYBERSOURCE_RESPONSE_FAILED");
    } finally { vi.unstubAllEnvs(); }
  });
  it("distinguishes authorization from capture", () => {
    const value = result(); expect(assessTestTransaction(value, expected)).toBe("TEST_AUTHORIZED");
    value.applicationInformation.applications.push({ name: "ics_bill", reasonCode: 100, rCode: 1 });
    expect(assessTestTransaction(value, expected)).toBe("TEST_CAPTURED");
  });
  it.each(["transactionId", "merchantId", "reference", "amountCents"] as const)("rejects mismatched %s", field => {
    expect(() => assessTestTransaction(result(), { ...expected, [field]: field === "amountCents" ? 501 : "different" })).toThrow("BINDING_MISMATCH");
  });
  it("rejects foreign currency", () => { const value = result(); value.orderInformation.amountDetails.currency = "EUR"; expect(() => assessTestTransaction(value, expected)).toThrow(); });
  it("does not accept partial authorization, review or refunds", () => {
    const partial = result(); partial.orderInformation.amountDetails.authorizedAmount = "4.00";
    expect(assessTestTransaction(partial, expected)).toBe("REVIEW_REQUIRED");
    const review = result(); review.applicationInformation.status = "PENDING_REVIEW";
    expect(assessTestTransaction(review, expected)).toBe("REVIEW_REQUIRED");
    const refund = result(); refund.applicationInformation.applications.push({ name: "ics_credit", reasonCode: 100, rCode: 1 });
    expect(assessTestTransaction(refund, expected)).toBe("REVIEW_REQUIRED");
  });
  it("requires an unambiguous decline", () => {
    const value = result(); value.applicationInformation.applications[0] = { name: "ics_auth", reasonCode: 203, rCode: 0 };
    expect(assessTestTransaction(value, expected)).toBe("TEST_DECLINED");
    value.applicationInformation.applications.push({ name: "ics_bill", reasonCode: 100, rCode: 1 });
    expect(assessTestTransaction(value, expected)).toBe("REVIEW_REQUIRED");
  });
  it("parses monetary values without rounding", () => { expect(decimalCents("5.1")).toBe(510); for (const value of ["5.001", "-1", "1e2", "NaN"]) expect(() => decimalCents(value)).toThrow(); });
});
