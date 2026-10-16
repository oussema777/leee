import { describe, expect, it } from "vitest";
import {
  canRead,
  catalogSchema,
  checkoutSchema,
  reviewError,
  validPage,
} from "./policy";
describe("ebook access and payment policy", () => {
  it("never grants reading based on a receipt or an active flag alone", () => {
    expect(canRead(null)).toBe(false);
    for (const state of [
      "AWAITING_PAYMENT",
      "UNDER_REVIEW",
      "CHANGES_REQUESTED",
      "REFUNDED",
      "CANCELLED",
    ])
      expect(canRead({ active: true, order: { state } })).toBe(false);
    expect(canRead({ active: false, order: { state: "VERIFIED" } })).toBe(
      false,
    );
    expect(canRead({ active: true, order: { state: "VERIFIED" } })).toBe(true);
  });
  it("requires exact received amount, account verification, and a reference", () => {
    const input = {
      action: "VERIFY" as const,
      expectedUpdatedAt: new Date().toISOString(),
      note: "",
      currency: "USD" as const,
      receivedAmountCents: 500,
      transactionReference: "PAY123",
      checkedWallet: true,
    };
    expect(reviewError(input, "UNDER_REVIEW", 500)).toBeNull();
    expect(
      reviewError({ ...input, receivedAmountCents: 499 }, "UNDER_REVIEW", 500),
    ).toBeTruthy();
    expect(
      reviewError({ ...input, checkedWallet: false }, "UNDER_REVIEW", 500),
    ).toBeTruthy();
    for (const state of ["AWAITING_PAYMENT", "CHANGES_REQUESTED"]) {
      expect(reviewError(input, state, 500)).toBeNull();
      expect(reviewError({ ...input, checkedWallet: false }, state, 500)).toBeTruthy();
      expect(reviewError({ ...input, transactionReference: undefined }, state, 500)).toBeTruthy();
      expect(reviewError({ ...input, receivedAmountCents: 499 }, state, 500)).toBeTruthy();
      expect(reviewError({ ...input, currency: undefined }, state, 500)).toBeTruthy();
    }
    for (const state of ["VERIFIED", "REFUNDED", "CANCELLED"]) {
      expect(reviewError(input, state, 500)).toBeTruthy();
    }
  });
  it("cannot restore a refunded purchase or revoke without a reason", () => {
    const input = {
      action: "RESTORE" as const,
      expectedUpdatedAt: new Date().toISOString(),
      note: "Resolved",
    };
    expect(reviewError(input, "REFUNDED", 500, false)).toBeTruthy();
    expect(reviewError(input, "VERIFIED", 500, false)).toBeNull();
    expect(
      reviewError(
        { ...input, action: "REVOKE", note: "" },
        "VERIFIED",
        500,
        true,
      ),
    ).toBeTruthy();
  });
  it("rejects fractional and out-of-bounds pages", () => {
    for (const value of [0, -1, NaN, Infinity, 1.5, 386])
      expect(validPage(value, 385)).toBe(false);
    expect(validPage(385, 385)).toBe(true);
  });
  it("rejects non-HTTP cover URLs and physical payment options", () => {
    expect(
      catalogSchema.safeParse({
        slug: "book",
        titleEn: "Book",
        author: "Author",
        priceCents: 500,
        coverUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({
        ebookId: "b",
        customerName: "Reader",
        method: "CASH_ON_DELIVERY",
        termsAccepted: true,
        locale: "en",
      }).success,
    ).toBe(false);
  });
});
