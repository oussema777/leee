import { preparationDefaults, preparationSchema, prepareShipment, type ShippingOrder } from "./preparation";
import type { ShipmentSettings } from "./shipment-request";

// Synthetic test data, never account defaults.
export const testOrder = (): ShippingOrder => ({
  id: "test-order", reference: "LEE-BK-TEST", updatedAt: new Date("2026-10-22T10:00:00Z"),
  purpose: "SELF", status: "READY", fulfillmentMethod: "DELIVERY", paymentMethod: "CASH_ON_DELIVERY",
  paymentStatus: "PENDING", priceCents: 900, currency: "USD", requestedBookCount: 1,
  customerName: "Test Recipient", customerPhone: "70123456", customerEmail: "recipient@example.test",
  recipientName: null, recipientPhone: null, governorate: "BEIRUT", area: "Beirut",
  detailedAddress: "Test Road 4", whishPayment: null,
});
export const testInput = () => ({ ...preparationDefaults(testOrder()), parcels: [{ weightKg: 1 }] });
export const testPreparation = () => prepareShipment(testOrder(), preparationSchema.parse(testInput()));
export const testSettings = (): ShipmentSettings => ({
  environment: "UAT", shipper: { name: "Test Sender", company: "Test Books", phone: "70123456",
    email: "sender@example.test", address: { line1: "Test Street 1", city: "Beirut" } },
  goodsOriginCountry: "LB", labelReportId: 9201, recipientEmailRequired: true,
  prepaid: { productType: "ONP", paymentType: "P", paymentOptions: "ACCT", services: [] },
  cod: { productType: "ONP", paymentType: "P", paymentOptions: "ACCT", services: ["COD"] },
});
export const testCredentials = () => ({
  environment: "UAT" as const, UserName: "test@example.test", Password: "fixture-password",
  AccountNumber: "fixture-account", AccountPin: "fixture-pin", AccountEntity: "BEY",
  AccountCountryCode: "LB" as const, Version: "v1",
});
export const testSchedule = { shippingAt: "2026-10-23T10:00:00Z", dueAt: "2026-10-24T10:00:00Z" };
export const testResponse = (key = "attempt-1") => ({
  HasErrors: false, Transaction: { Reference1: key }, Notifications: [],
  Shipments: [{ ID: "123456789", Reference1: "LEE-BK-TEST", Reference2: key, HasErrors: false,
    Notifications: [] as { Code: string; Message: string }[],
    ShipmentLabel: { LabelURL: "https://ws.uat.aramex.net/labels/test.pdf" } }],
});
