import { createHash } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import catalog from "./data/tracking-codes.json";

const number = z.string().regex(/^[A-Za-z0-9-]{5,50}$/);
export const trackingWebhookSchema = z.object({
  Key: number,
  Value: z.object({
    WaybillNumber: number, UpdateCode: z.string().regex(/^[A-Z0-9]{2,20}$/),
    UpdateDateTime: z.string().datetime({ offset: true }),
    UpdateLocation: z.string().max(250), Comments: z.string().max(2000),
    ProblemCode: z.string().max(30), OrderNumber: z.string().max(100),
  }),
}).refine(value => value.Key === value.Value.WaybillNumber);

export function trackingDescription(code: string, problem: string) {
  const rows = catalog.rows.filter(row => row.code === code && row.problem === problem && row.groups.includes("DOM"));
  const descriptions = [...new Set(rows.map(row => row.description))];
  return descriptions.length === 1 ? descriptions[0] : null;
}
// Explicit full/partial/return distinctions from the supplied PI workbook.
// Do not classify by free-text comments or infer financial settlement.
const progress: Record<string, string> = {
  SH012: "PICKED_UP", SH003: "OUT_FOR_DELIVERY", SH004: "PARTIAL_OUT_FOR_DELIVERY",
  SH005: "DELIVERED", SH006: "DELIVERED", SH234: "DELIVERED", SH496: "DELIVERED",
  SH597: "DELIVERED", SH154: "PARTIAL_DELIVERY", SH559: "RETURNED",
};
export type TrackingSummaryEvent = { code: string; problemCode: string; occurredAt: Date | string };
export function trackingProgress(events: TrackingSummaryEvent[]) {
  let status = events.length ? "UPDATES_RECEIVED" : "AWAITING_UPDATES";
  let needsReview = false;
  let lastTime = -Infinity;
  const sorted = [...events].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  for (const event of sorted) {
    if (!trackingDescription(event.code, event.problemCode)) { needsReview = true; continue; }
    if (event.code === "SH539") { needsReview = true; status = "REVIEW_REQUIRED"; continue; }
    const next = ["SH033", "SH043"].includes(event.code) ? "EXCEPTION" : !event.problemCode ? progress[event.code] : undefined;
    if (!next) continue;
    const time = new Date(event.occurredAt).getTime();
    if (time === lastTime && next !== status) { needsReview = true; status = "REVIEW_REQUIRED"; }
    else if (status === "REVIEW_REQUIRED") { needsReview = true; }
    else if ((status === "DELIVERED" && next !== "DELIVERED" && next !== "RETURNED") || (status === "RETURNED" && next !== "RETURNED")) {
      needsReview = true; status = "REVIEW_REQUIRED";
    } else status = next;
    lastTime = time;
  }
  return { status, needsReview };
}

/** UAT only. Unknown AWBs are retained in an inbox, never used to create orders
 * or assert a booking. Link only to an existing confirmed shipment in UAT. */
export function normalizeTrackingUpdate(raw: unknown, now = new Date()) {
  const parsed = trackingWebhookSchema.safeParse(raw);
  if (!parsed.success) throw Error("INVALID_TRACKING_UPDATE");
  const value = parsed.data.Value;
  const occurredAt = new Date(value.UpdateDateTime);
  if (occurredAt.getTime() > now.getTime() + 5 * 60_000) throw Error("FUTURE_TRACKING_UPDATE");
  const digest = createHash("sha256").update(JSON.stringify([
    value.WaybillNumber, value.UpdateCode, occurredAt.toISOString(), value.UpdateLocation,
    value.Comments, value.ProblemCode,
  ])).digest("hex");
  // OrderNumber is optional metadata in API history, not event identity.
  return { environment: "UAT", digest, trackingNumber: value.WaybillNumber,
    code: value.UpdateCode, problemCode: value.ProblemCode, occurredAt,
    location: value.UpdateLocation, comments: value.Comments, orderNumber: value.OrderNumber };
}

export async function ingestTrackingWebhook(db: PrismaClient, raw: unknown, now = new Date()) {
  const normalized = normalizeTrackingUpdate(raw, now);
  return db.$transaction(async tx => {
    const shipment = await tx.bookShipment.findFirst({ where: {
      provider: "ARAMEX", environment: "UAT", trackingNumber: normalized.trackingNumber, status: "CREATED",
    }, select: { id: true } });
    const event = await tx.aramexTrackingEvent.upsert({
      where: { environment_digest: { environment: "UAT", digest: normalized.digest } },
      create: { ...normalized, shipmentId: shipment?.id },
      update: shipment ? { shipmentId: shipment.id } : {},
    });
    if (shipment) await tx.aramexTrackingEvent.updateMany({ where: {
      environment: "UAT", trackingNumber: normalized.trackingNumber, shipmentId: null,
    }, data: { shipmentId: shipment.id } });
    return { linked: !!event.shipmentId };
  });
}

export async function shipmentTracking(db: PrismaClient, orderId: string) {
  const shipment = await db.bookShipment.findUnique({ where: { orderId }, select: {
    id: true, provider: true, environment: true, status: true, trackingNumber: true,
  } });
  if (!shipment) return null;
  if (shipment.environment !== "UAT" || shipment.provider !== "ARAMEX" || shipment.status !== "CREATED" || !shipment.trackingNumber) {
    return { environment: shipment.environment, status: "AWAITING_UPDATES", needsReview: false, truncated: false, events: [] };
  }
  // This also links inbox events that arrived before the booking was saved.
  await db.aramexTrackingEvent.updateMany({ where: { environment: "UAT", trackingNumber: shipment.trackingNumber, shipmentId: null }, data: { shipmentId: shipment.id } });
  const events = await db.aramexTrackingEvent.findMany({ where: { shipmentId: shipment.id },
    orderBy: [{ occurredAt: "desc" }, { digest: "asc" }], take: 501,
    select: { id: true, code: true, problemCode: true, occurredAt: true, receivedAt: true, location: true, comments: true },
  });
  const truncated = events.length > 500;
  return { environment: "UAT", ...(truncated ? { status: "REVIEW_REQUIRED", needsReview: true } : trackingProgress(events)),
    truncated, events: events.slice(0, 100).map(event => ({ ...event, description: trackingDescription(event.code, event.problemCode) })) };
}
