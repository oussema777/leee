import { describe, expect, it } from "vitest";
import { bookOrderSchema } from "./validation";

const base = {
  locale: "en",
  package: "SINGLE",
  purpose: "SELF",
  selectionMode: "CUSTOM",
  selectedBookIds: ["book-1"],
  customerName: "Maya Haddad",
  customerPhone: "+961 70 123 456",
  customerEmail: "maya@example.com",
  fulfillmentMethod: "PICKUP",
  showSenderName: true,
  paymentMethod: "CASH_ON_DELIVERY",
};

describe("bookOrderSchema", () => {
  it("accepts a single cash pickup order", () => {
    expect(bookOrderSchema.safeParse(base).success).toBe(true);
  });

  it("requires the exact number of distinct books in a custom package", () => {
    const result = bookOrderSchema.safeParse({ ...base, package: "FIVE" });
    expect(result.success).toBe(false);
  });

  it("accepts a LEE-curated donation with one preferred book", () => {
    const result = bookOrderSchema.safeParse({
      ...base,
      package: "TWENTY_PLUS_TWO",
      purpose: "DONATION",
      selectionMode: "LEE_CHOICE",
      fulfillmentMethod: "LEE_DISTRIBUTION",
      paymentMethod: "CASH_ARRANGEMENT",
    });
    expect(result.success).toBe(true);
  });

  it("requires recipient and address details for a gift", () => {
    const result = bookOrderSchema.safeParse({
      ...base,
      purpose: "GIFT",
      fulfillmentMethod: "DELIVERY",
      paymentMethod: "CASH_ARRANGEMENT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects LEE Choice for personal orders", () => {
    const result = bookOrderSchema.safeParse({ ...base, selectionMode: "LEE_CHOICE" });
    expect(result.success).toBe(false);
  });

  it("accepts null values sent by hidden optional form fields", () => {
    const result = bookOrderSchema.safeParse({
      ...base,
      customerPhone: "70 123 456",
      customerEmail: "",
      governorate: null,
      area: null,
      detailedAddress: null,
      recipientName: null,
      recipientPhone: null,
      giftMessage: null,
      website: null,
    });
    expect(result.success).toBe(true);
  });
});
