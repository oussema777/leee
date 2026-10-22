import { createHash } from "node:crypto";
import { z } from "zod";
import { preparationSchema, type ShippingOrder } from "./preparation";

export const saveDraftSchema = z.object({
  input: preparationSchema,
  expectedDraftVersion: z.number().int().positive().nullable(),
}).strict();

// Read receipts/internal notes also update BookOrder.updatedAt. They must not
// invalidate a saved shipping draft; all shipping/payment inputs below must.
export function shippingOrderFingerprint(order: ShippingOrder): string {
  return createHash("sha256").update(JSON.stringify([
    order.id, order.reference, order.purpose, order.status, order.fulfillmentMethod,
    order.paymentMethod, order.paymentStatus, order.priceCents, order.currency,
    order.requestedBookCount, order.customerName, order.customerPhone, order.customerEmail,
    order.recipientName, order.recipientPhone, order.governorate, order.area,
    order.detailedAddress, order.whishPayment?.state ?? null,
  ])).digest("hex");
}

export function isDraftStorageMissing(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && error.code === "P2021"
    && "meta" in error && JSON.stringify(error.meta).includes("BookShipment");
}
