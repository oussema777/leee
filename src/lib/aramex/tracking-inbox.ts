import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { trackingDescription } from "./tracking";

export const inboxQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  trackingNumber: z.string().trim().regex(/^$|^[A-Za-z0-9-]{5,50}$/).default(""),
});
export async function trackingInbox(db: PrismaClient, query: z.infer<typeof inboxQuery>) {
  const where = { environment: "UAT", shipmentId: null, ...(query.trackingNumber ? { trackingNumber: query.trackingNumber } : {}) };
  const [total, events] = await db.$transaction([
    db.aramexTrackingEvent.count({ where }),
    db.aramexTrackingEvent.findMany({ where, orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      skip: (query.page - 1) * 25, take: 25,
      select: { id: true, trackingNumber: true, code: true, problemCode: true, occurredAt: true,
        receivedAt: true, location: true, comments: true, orderNumber: true } }),
  ]);
  const shipments = events.length ? await db.bookShipment.findMany({ where: {
    provider: "ARAMEX", environment: "UAT", trackingNumber: { in: events.map(event => event.trackingNumber) },
  }, select: { trackingNumber: true, status: true, orderId: true, order: { select: { reference: true } } } }) : [];
  return { environment: "UAT" as const, total, page: query.page, totalPages: Math.max(1, Math.ceil(total / 25)),
    events: events.map(event => {
      const match = shipments.find(shipment => shipment.trackingNumber === event.trackingNumber);
      return { ...event, description: trackingDescription(event.code, event.problemCode),
        reason: match ? match.status === "CREATED" ? "READY_TO_LINK" : "BOOKING_UNCONFIRMED" : "NO_BOOKING",
        order: match ? { id: match.orderId, reference: match.order.reference } : null };
    }) };
}
