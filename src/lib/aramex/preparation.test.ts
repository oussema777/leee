import { describe, expect, it } from "vitest";
import { canonicalLebanonCity, lebanonCities } from "./cities";
import {
  normalizeLebanonPhone, orderProblems, preparationDefaults, preparationSchema,
  prepareShipment, shippingCollection, type PreparationInput, type ShippingOrder,
} from "./preparation";

export const orderFixture = (): ShippingOrder => ({
  id: "order-1", reference: "LEE-BK-TEST", updatedAt: new Date("2026-10-20T10:00:00.000Z"),
  purpose: "SELF", status: "READY", fulfillmentMethod: "DELIVERY",
  paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING", priceCents: 900, currency: "USD",
  requestedBookCount: 1, customerName: "Test Purchaser", customerPhone: "70123456",
  customerEmail: "purchaser@example.test", recipientName: null, recipientPhone: null,
  governorate: "BEIRUT", area: "Beirut", detailedAddress: "Test Street, Building 4",
  whishPayment: null,
});
export const inputFixture = (): PreparationInput => ({
  ...preparationDefaults(orderFixture()),
  parcels: [{ weightKg: 0.75, lengthCm: 30, widthCm: 20, heightCm: 5 }],
});

describe("Aramex contact and parcel preparation", () => {
  it("preserves custom cities in drafts and flags them for carrier review", () => {
    const values = preparationSchema.parse({ ...inputFixture(), city: " test " });
    expect(values.city).toBe("test");
    const draft = prepareShipment(orderFixture(), values);
    expect(draft.recipient.city).toBe("test");
    expect(draft.warnings).toContain("Custom city saved in this draft. Choose an approved delivery city before sending to Aramex.");
    expect(preparationDefaults({ ...orderFixture(), area: "test" }).city).toBe("test");
  });
  it("preserves approved city names and never guesses neighbourhood mappings", () => {
    expect(lebanonCities).toHaveLength(408);
    expect(new Set(lebanonCities).size).toBe(408);
    expect(canonicalLebanonCity("  BEIRUT ")).toBe("Beirut");
    expect(canonicalLebanonCity("Hamra")).toBeNull();
    expect(canonicalLebanonCity("Beyrouth")).toBeNull();
  });
  it.each(["70123456", "70 123 456", "+961 70 123456", "00961 70 123456", "96170123456", "٧٠١٢٣٤٥٦", "۷۰۱۲۳۴۵۶"])(
    "normalizes Lebanese phone %s", value => expect(normalizeLebanonPhone(value)).toBe("+96170123456"),
  );
  it("handles Lebanon's domestic leading zero", () => {
    expect(normalizeLebanonPhone("03/123456")).toBe("+9613123456");
  });
  it.each(["", "abcdef", "Call 70123456", "70123456 ext 2", "+33123456789", "123456", "++96170123456"])(
    "rejects invalid or non-Lebanese phone %s", value => expect(normalizeLebanonPhone(value)).toBeNull(),
  );
  it("never substitutes purchaser contact information for a gift recipient", () => {
    const defaults = preparationDefaults({ ...orderFixture(), purpose: "GIFT" });
    expect(defaults).toMatchObject({ recipientName: "", recipientPhone: "", recipientEmail: "" });
    const gift = preparationDefaults({
      ...orderFixture(), purpose: "GIFT", recipientName: "Recipient", recipientPhone: "03123456",
    });
    expect(gift).toMatchObject({ recipientName: "Recipient", recipientPhone: "03123456", recipientEmail: "" });
  });
  it("preserves long addresses for correction instead of dropping text", () => {
    const address = "Building and detailed directions ".repeat(10);
    const defaults = preparationDefaults({ ...orderFixture(), area: "Hamra", detailedAddress: address });
    expect(defaults.addressLine1).toBe(address);
    expect(defaults.city).toBe("Hamra");
    expect(preparationSchema.safeParse({ ...inputFixture(), ...defaults }).success).toBe(false);
  });
  it("accepts weight-only parcels and preserves optional dimensions through JSON storage", () => {
    const parcels = [{ weightKg: 0.75 }, { weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 5 }];
    const input = preparationSchema.parse({ ...inputFixture(), parcels });
    const restored = preparationSchema.parse(JSON.parse(JSON.stringify(input)));
    const draft = prepareShipment(orderFixture(), restored);
    expect(draft.parcels).toEqual(parcels);
    expect(draft.numberOfPieces).toBe(2);
    expect(draft.totalWeightKg).toBe(1.75);
    expect(draft.parcels[0]).not.toHaveProperty("lengthCm");
  });
  it.each([
    { lengthCm: 20 }, { widthCm: 15 }, { heightCm: 5 },
    { lengthCm: 20, widthCm: 15 }, { lengthCm: 20, heightCm: 5 }, { widthCm: 15, heightCm: 5 },
  ])("rejects incomplete dimension sets: %j", dimensions => {
    const result = preparationSchema.safeParse({ ...inputFixture(), parcels: [{ weightKg: 1, ...dimensions }] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: "Enter length, width and height together, or leave all three blank." }),
    ]));
  });
  it.each([0, -1, null, "", "20"])("does not treat invalid dimension %j as omitted", value => {
    expect(preparationSchema.safeParse({ ...inputFixture(), parcels: [{ weightKg: 1, lengthCm: value, widthCm: 15, heightCm: 5 }] }).success).toBe(false);
  });
  it.each([
    { parcels: [] },
    { parcels: [{ weightKg: 0, lengthCm: 20, widthCm: 20, heightCm: 10 }] },
    { parcels: [{ weightKg: 1, lengthCm: 20, widthCm: 20 }] },
    { parcels: [{ weightKg: 1, lengthCm: -20, widthCm: 20, heightCm: 10 }] },
    { parcels: Array.from({ length: 2 }, () => ({ weightKg: 60, lengthCm: 20, widthCm: 20, heightCm: 10 })) },
    { city: " " }, { city: "test\ncity" }, { city: "x".repeat(121) }, { recipientEmail: "not-email" }, { addressLine1: "Road\nBuilding" },
    { amountCents: 0 }, { paymentStatus: "PAID" }, { ClientInfo: { Password: "do-not-accept" } },
  ])("rejects invalid fields or client-controlled payment/credentials: %j", changes => {
    expect(preparationSchema.safeParse({ ...inputFixture(), ...changes }).success).toBe(false);
  });
  it("counts parcels separately from books and produces a credential-free internal draft", () => {
    const order = { ...orderFixture(), requestedBookCount: 22, priceCents: 8000 };
    const input = preparationSchema.parse({ ...inputFixture(), city: "beirut", recipientEmail: "", parcels: [
      { weightKg: 2.4, lengthCm: 30, widthCm: 20, heightCm: 10 },
      { weightKg: 1.3, lengthCm: 30, widthCm: 20, heightCm: 10 },
    ] });
    const draft = prepareShipment(order, input);
    expect(draft).toMatchObject({
      submissionEnabled: false, intendedEnvironment: "UAT",
      numberOfPieces: 2, totalWeightKg: 3.7, contents: { bookCount: 22 },
      recipient: { city: "Beirut", phone: "+96170123456", email: null },
      collection: { amountCents: 8000 },
    });
    expect(draft).not.toHaveProperty("ClientInfo");
    expect(draft).not.toHaveProperty("customerEmail");
    expect(draft.warnings.join(" ")).toContain("Recipient email is missing");
  });
  it("rejects a draft based on an older order version", () => {
    expect(() => prepareShipment(orderFixture(), {
      ...preparationSchema.parse(inputFixture()), expectedUpdatedAt: "2026-10-19T10:00:00.000Z",
    })).toThrow("STALE_ORDER");
  });
});

describe("shipping payment eligibility", () => {
  it("requires confirmation even when an order has already been paid", () => {
    const order = { ...orderFixture(), status: "NEW", paymentStatus: "PAID" };
    expect(orderProblems(order)).toContain("Confirm and save this order before preparing its Aramex delivery.");
    expect(() => prepareShipment(order, preparationSchema.parse(inputFixture()))).toThrow("ORDER_NOT_ELIGIBLE");
  });
  it.each(["CONFIRMED", "PREPARING", "READY"])("allows preparation at %s", status => {
    expect(orderProblems({ ...orderFixture(), status })).toEqual([]);
  });
  it("collects the authoritative COD total once, including the existing delivery fee", () => {
    expect(shippingCollection(orderFixture()).amountCents).toBe(900);
    expect(shippingCollection({ ...orderFixture(), paymentStatus: "PAID" }).amountCents).toBe(0);
  });
  it.each(["WHISH", "BANK_AUDI"])("requires verified %s payment and collects zero", paymentMethod => {
    const order = { ...orderFixture(), paymentMethod, paymentStatus: "PAID" };
    expect(shippingCollection(order).amountCents).toBeNull();
    expect(shippingCollection({ ...order, whishPayment: { state: "UNDER_REVIEW" } }).amountCents).toBeNull();
    expect(shippingCollection({ ...order, whishPayment: { state: "VERIFIED" } }).amountCents).toBe(0);
    expect(shippingCollection({ ...order, paymentStatus: "REFUNDED", whishPayment: { state: "VERIFIED" } }).amountCents).toBeNull();
  });
  it("blocks unpaid gift recipients and cash arrangements", () => {
    expect(shippingCollection({ ...orderFixture(), purpose: "GIFT" }).amountCents).toBeNull();
    expect(shippingCollection({ ...orderFixture(), purpose: "GIFT", paymentStatus: "PAID" }).amountCents).toBe(0);
    expect(shippingCollection({ ...orderFixture(), paymentMethod: "CASH_ARRANGEMENT" }).amountCents).toBeNull();
    expect(shippingCollection({ ...orderFixture(), paymentMethod: "CASH_ARRANGEMENT", paymentStatus: "PAID" }).amountCents).toBe(0);
  });
  it.each(["FAILED", "REFUNDED", "CANCELLED", "UNKNOWN"])("blocks COD with payment %s", paymentStatus => {
    expect(shippingCollection({ ...orderFixture(), paymentStatus }).amountCents).toBeNull();
  });
  it.each([
    { status: "NEW" }, { status: "CANCELLED" }, { status: "DISPATCHED" }, { status: "COMPLETED" },
    { fulfillmentMethod: "PICKUP" }, { fulfillmentMethod: "LEE_DISTRIBUTION" },
    { purpose: "DONATION" }, { currency: "LBP" }, { priceCents: -1 },
    { priceCents: 1.5 }, { paymentMethod: "OTHER" }, { requestedBookCount: 0 },
  ])("blocks unsuitable orders: %j", changes => {
    const order = { ...orderFixture(), ...changes };
    expect(orderProblems(order).length).toBeGreaterThan(0);
    expect(() => prepareShipment(order, preparationSchema.parse(inputFixture()))).toThrow("ORDER_NOT_ELIGIBLE");
  });
});
