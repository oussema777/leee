import { describe, expect, it, vi } from "vitest";
import { attachShipmentCredentials, buildShipmentRequest, type ShipmentSettings } from "./shipment-request";
import { preparationDefaults, preparationSchema, prepareShipment, type ShippingOrder } from "./preparation";

// Illustrative codes only. These fixtures are not account configuration.
const settings: ShipmentSettings = {
  environment: "UAT", shipper: { name: "Test Sender", company: "Test Books", phone: "70123456",
    email: "sender@example.test", address: { line1: "Test Street, Building 1", city: "Beirut" } },
  goodsOriginCountry: "LB", labelReportId: 9201, recipientEmailRequired: true,
  prepaid: { productType: "ONP", paymentType: "P", paymentOptions: "ACCT", services: [] },
  cod: { productType: "ONP", paymentType: "P", paymentOptions: "ACCT", services: ["COD"] },
};
const schedule = { shippingAt: "2026-10-23T10:00:00+03:00", dueAt: "2026-10-24T10:00:00+03:00" };
function draft(paid = false) {
  const order: ShippingOrder = {
    id: "test", reference: "LEE-BK-TEST", updatedAt: new Date("2026-10-22T10:00:00Z"),
    purpose: "SELF", status: "READY", fulfillmentMethod: "DELIVERY", paymentMethod: "CASH_ON_DELIVERY",
    paymentStatus: paid ? "PAID" : "PENDING", priceCents: 925, currency: "USD", requestedBookCount: 4,
    customerName: "Test Recipient", customerPhone: "70123456", customerEmail: "recipient@example.test",
    recipientName: null, recipientPhone: null, governorate: "BEIRUT", area: "Beirut",
    detailedAddress: "Test Road, Building 4", whishPayment: null,
  };
  return prepareShipment(order, preparationSchema.parse({ ...preparationDefaults(order), parcels: [{ weightKg: 1.2 }] }));
}
describe("offline Aramex request mapping", () => {
  it("attaches explicit UAT credentials without changing the credential-free request", () => {
    const request = buildShipmentRequest(draft(), settings, schedule, "a");
    const credentials = { environment: "UAT" as const, UserName: "test@example.test", Password: " test-password ",
      AccountNumber: "test-account", AccountPin: "test-pin", AccountEntity: "BEY", AccountCountryCode: "LB" as const, Version: "v1" };
    const authenticated = attachShipmentCredentials(request, credentials);
    expect(authenticated.ClientInfo.Source).toBe(24);
    expect(authenticated.ClientInfo.Password).toBe(" test-password ");
    expect(authenticated.Shipments[0].Shipper.AccountNumber).toBe("test-account");
    expect(request).not.toHaveProperty("ClientInfo");
    expect(request.Shipments[0].Shipper).not.toHaveProperty("AccountNumber");
    expect(() => attachShipmentCredentials(request, { ...credentials, Password: "" })).toThrow("INVALID_UAT_CREDENTIALS");
  });
  it("maps COD separately from transport billing and never sends a request", () => {
    const outgoing = vi.fn(); vi.stubGlobal("fetch", outgoing);
    try {
      const body = buildShipmentRequest(draft(), settings, schedule, "attempt-1");
      expect(body.Transaction).toEqual({ Reference1: "attempt-1", Reference2: "LEE-BK-TEST" });
      expect(body.Shipments[0]).toMatchObject({
        Reference1: "LEE-BK-TEST", Reference2: "attempt-1",
        ShippingDateTime: `/Date(${Date.parse(schedule.shippingAt)})/`,
        Details: { ProductGroup: "DOM", PaymentType: "P", PaymentOptions: "ACCT", Services: "COD",
          CashOnDeliveryAmount: { CurrencyCode: "USD", Value: 9.25 }, NumberOfPieces: 1,
          ActualWeight: { Unit: "KG", Value: 1.2 }, Dimensions: null },
        Consignee: { Contact: { CompanyName: "Test Recipient", PhoneNumber1: "+96170123456" } },
      });
      expect(body).not.toHaveProperty("ClientInfo");
      expect(body.Shipments[0].Shipper).not.toHaveProperty("AccountNumber");
      expect(body.Shipments[0].Details).not.toHaveProperty("CollectAmount");
      expect(outgoing).not.toHaveBeenCalled();
    } finally { vi.unstubAllGlobals(); }
  });
  it("does not request COD on a paid shipment", () => {
    expect(buildShipmentRequest(draft(true), settings, schedule, "attempt-2").Shipments[0].Details)
      .toMatchObject({ CashOnDeliveryAmount: null, Services: "" });
  });
  it("recalculates piece count and weight instead of trusting summary fields", () => {
    const value = draft(); value.parcels = [{ weightKg: 0.1 }, { weightKg: 0.2 }];
    value.numberOfPieces = 99; value.totalWeightKg = 99;
    expect(buildShipmentRequest(value, settings, schedule, "a").Shipments[0].Details)
      .toMatchObject({ NumberOfPieces: 2, ActualWeight: { Value: 0.3 }, Dimensions: null });
  });
  it("maps single dimensions and complete multi-piece dimensions without inventing a combined box", () => {
    const value = draft(); const parcel = { weightKg: 1.2, lengthCm: 30, widthCm: 20, heightCm: 5 };
    value.parcels = [parcel];
    expect(buildShipmentRequest(value, settings, schedule, "a").Shipments[0].Details.Dimensions)
      .toEqual({ Length: 30, Width: 20, Height: 5, Unit: "CM" });
    value.parcels = [parcel, { ...parcel, weightKg: 0.8 }];
    const details = buildShipmentRequest(value, settings, schedule, "a").Shipments[0].Details;
    expect(details.Dimensions).toBeNull();
    expect(details.PieceDimensions).toHaveLength(2);
    expect(details.PieceDimensions?.map(piece => piece.NumberOfPieces)).toEqual([1, 1]);
    expect(details.ActualWeight.Value).toBe(2);
    value.parcels = [parcel, { weightKg: 1 }];
    expect(() => buildShipmentRequest(value, settings, schedule, "a")).toThrow("MIXED_PARCEL_DIMENSIONS_REQUIRE_REVIEW");
  });
  it("requires explicit domestic email policy and never substitutes a sender email", () => {
    const value = draft(); value.recipient.email = null;
    expect(() => buildShipmentRequest(value, settings, schedule, "a")).toThrow("RECIPIENT_EMAIL_REQUIRED");
    expect(buildShipmentRequest(value, { ...settings, recipientEmailRequired: false }, schedule, "a")
      .Shipments[0].Consignee.Contact.EmailAddress).toBe("");
  });
  it("rejects custom cities at the carrier boundary", () => {
    const value = draft(); value.recipient.city = "test";
    expect(() => buildShipmentRequest(value, settings, schedule, "a")).toThrow("CITY_CONFIRMATION_REQUIRED");
  });
  it.each([-1, 1.5, 900, Number.MAX_SAFE_INTEGER + 1])("rejects invalid or changed collection %s", cents => {
    const value = draft(); value.collection.amountCents = cents;
    expect(() => buildShipmentRequest(value, settings, schedule, "a")).toThrow("INVALID_COLLECTION_AMOUNT");
  });
  it("rejects impossible dates and overlength references", () => {
    expect(() => buildShipmentRequest(draft(), settings, { ...schedule, dueAt: "2026-10-22T00:00:00Z" }, "a"))
      .toThrow("INVALID_SHIPPING_DATES");
    expect(() => buildShipmentRequest(draft(), settings, schedule, "x".repeat(51))).toThrow("INVALID_SHIPMENT_REFERENCE");
  });
  it("rejects missing settings, production, conflicting COD and unsupported billing", () => {
    for (const changes of [{ environment: "production" }, { labelReportId: undefined },
      { prepaid: settings.cod }, { cod: settings.prepaid },
      { prepaid: { ...settings.prepaid, paymentType: "C" } }]) {
      expect(() => buildShipmentRequest(draft(), { ...settings, ...changes } as ShipmentSettings, schedule, "a"))
        .toThrow("INVALID_SHIPMENT_SETTINGS");
    }
  });
});
