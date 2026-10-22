import { expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { submitSavedShipment } from "./submission";
import { preparationDefaults, type ShippingOrder } from "./preparation";
import { shippingOrderFingerprint } from "./drafts";

vi.mock("@/lib/book-orders/whish-server", () => ({ lockOrder: vi.fn() }));

it("blocks a custom city before recording an attempt or contacting the carrier", async () => {
  const order: ShippingOrder = {
    id: "test-order", reference: "TEST", updatedAt: new Date("2026-10-22T10:00:00Z"),
    purpose: "SELF", status: "READY", fulfillmentMethod: "DELIVERY",
    paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING", priceCents: 900,
    currency: "USD", requestedBookCount: 1, customerName: "Test User",
    customerPhone: "70123456", customerEmail: null, recipientName: null,
    recipientPhone: null, governorate: "BEIRUT", area: "test",
    detailedAddress: "Test Street 4", whishPayment: null,
  };
  const createAttempt = vi.fn();
  const updateShipment = vi.fn();
  const tx = {
    bookOrder: { findUnique: vi.fn().mockResolvedValue(order) },
    bookShipment: {
      findUnique: vi.fn().mockResolvedValue({
        id: "draft", provider: "ARAMEX", environment: "UAT", status: "DRAFT", version: 1,
        orderFingerprint: shippingOrderFingerprint(order),
        input: { ...preparationDefaults(order), parcels: [{ weightKg: 1 }] },
      }), update: updateShipment,
    },
    bookShipmentAttempt: { create: createAttempt },
  };
  const db = { $transaction: (fn: (value: typeof tx) => unknown) => fn(tx) } as unknown as PrismaClient;
  const transport = { environment: "UAT" as const, createShipment: vi.fn() };
  await expect(submitSavedShipment(db, { orderId: order.id, expectedDraftVersion: 1, actor: "test" }, transport))
    .rejects.toThrow("CITY_CONFIRMATION_REQUIRED");
  expect(createAttempt).not.toHaveBeenCalled();
  expect(updateShipment).not.toHaveBeenCalled();
  expect(transport.createShipment).not.toHaveBeenCalled();
});
