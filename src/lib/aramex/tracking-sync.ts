import type { PrismaClient } from "@prisma/client";
import { lockOrder } from "@/lib/book-orders/whish-server";
import type { TrackingLookup } from "./tracking-lookup";
import { normalizeTrackingUpdate } from "./tracking";

export async function syncTracking(db: PrismaClient, orderId: string, lookup: TrackingLookup, signal: AbortSignal) {
  const shipment = await db.bookShipment.findUnique({ where: { orderId } });
  if (!shipment || shipment.provider !== "ARAMEX" || shipment.environment !== "UAT"
    || shipment.status !== "CREATED" || !shipment.trackingNumber) throw Error("TRACKING_NOT_ELIGIBLE");
  const trackingNumber = shipment.trackingNumber;
  // No database lock or transaction spans the network call.
  const history = await lookup.history(trackingNumber, signal);
  if (!Array.isArray(history) || history.length > 500) throw Error("INVALID_TRACKING_HISTORY");
  const normalized = history.map(event => normalizeTrackingUpdate(event));
  if (normalized.some(event => event.trackingNumber !== trackingNumber)) throw Error("INVALID_TRACKING_HISTORY");
  if (signal.aborted) throw Error("LOOKUP_CANCELLED");
  return db.$transaction(async tx => {
    await lockOrder(tx, orderId);
    const current = await tx.bookShipment.findUnique({ where: { orderId } });
    if (!current || current.id !== shipment.id || current.status !== "CREATED" || current.provider !== "ARAMEX"
      || current.environment !== "UAT" || current.trackingNumber !== trackingNumber) throw Error("TRACKING_SHIPMENT_CHANGED");
    const stored = await tx.aramexTrackingEvent.createMany({ data: normalized.map(event => ({ ...event, shipmentId: shipment.id })), skipDuplicates: true });
    await tx.aramexTrackingEvent.updateMany({ where: {
      environment: "UAT", trackingNumber, shipmentId: null,
    }, data: { shipmentId: shipment.id } });
    return { received: history.length, added: stored.count, checkedAt: new Date().toISOString() };
  });
}
