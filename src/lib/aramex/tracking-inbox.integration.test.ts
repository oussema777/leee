import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { trackingInbox } from "./tracking-inbox";
import { ingestTrackingWebhook, shipmentTracking } from "./tracking";
import { testInput, testPreparation } from "./uat-test-fixtures";
const url = process.env.ARAMEX_TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:55441/aramex_test";
const parsed = new URL(url);
if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/aramex_test") throw Error("Dedicated local database required");
const db = new PrismaClient({ datasourceUrl: url });
const event = (awb: string, comments = "Test") => ({ Key: awb, Value: { WaybillNumber: awb, UpdateCode: "SH005",
  UpdateDateTime: "2026-10-20T10:00:00Z", UpdateLocation: "Beirut", Comments: comments, ProblemCode: "", OrderNumber: "untrusted-ref" } });
describe.skipIf(!process.env.ARAMEX_TEST_DATABASE_URL)("unmatched tracking inbox", () => {
  afterAll(() => db.$disconnect());
  async function shipment(awb: string, environment = "UAT", status = "CREATED") {
    const order = await db.bookOrder.create({ data: { reference: `INBOX-${randomUUID()}`, locale: "en", package: "SINGLE", purpose: "SELF",
      requestedBookCount: 1, priceCents: 900, customerName: "Test User", customerPhone: "70123456", fulfillmentMethod: "DELIVERY",
      paymentMethod: "CASH_ON_DELIVERY", status: "CONFIRMED" } });
    await db.bookShipment.create({ data: { orderId: order.id, environment, status, trackingNumber: awb, input: testInput(),
      preparation: testPreparation(), orderFingerprint: "original", createdBy: "test", updatedBy: "test" } });
    return order;
  }
  it("shows the exact-match reason without changing state, then disappears after existing linking flow", async () => {
    const awb = randomUUID(); await ingestTrackingWebhook(db, event(awb));
    const read = () => trackingInbox(db, { page: 1, trackingNumber: awb });
    expect((await read()).events[0]).toMatchObject({ reason: "NO_BOOKING", order: null, orderNumber: "untrusted-ref" });
    await shipment(awb, "PRODUCTION");
    expect((await read()).events[0].reason).toBe("NO_BOOKING");
    const order = await shipment(awb, "UAT", "UNKNOWN");
    expect((await read()).events[0]).toMatchObject({ reason: "BOOKING_UNCONFIRMED", order: { id: order.id } });
    await db.bookShipment.update({ where: { orderId: order.id }, data: { status: "CREATED" } });
    expect((await read()).events[0].reason).toBe("READY_TO_LINK");
    expect((await read()).total).toBe(1);
    expect(await db.bookOrder.findUnique({ where: { id: order.id } })).toEqual(order);
    await shipmentTracking(db, order.id);
    expect((await read()).total).toBe(0);
  });
  it("uses stable bounded pages and excludes production events", async () => {
    const awb = randomUUID();
    for (let index = 0; index < 26; index++) await ingestTrackingWebhook(db, event(awb, `Update ${index}`));
    await db.aramexTrackingEvent.create({ data: { environment: "PRODUCTION", digest: randomUUID(), trackingNumber: awb,
      code: "SH005", problemCode: "", occurredAt: new Date(), location: "", comments: "", orderNumber: "" } });
    const first = await trackingInbox(db, { page: 1, trackingNumber: awb });
    const second = await trackingInbox(db, { page: 2, trackingNumber: awb });
    expect(first.total).toBe(26); expect(first.totalPages).toBe(2);
    expect(first.events).toHaveLength(25); expect(second.events).toHaveLength(1);
    expect(new Set([...first.events, ...second.events].map(row => row.id)).size).toBe(26);
    expect((await trackingInbox(db, { page: 1, trackingNumber: awb })).events.map(row => row.id)).toEqual(first.events.map(row => row.id));
    expect((await trackingInbox(db, { page: 1, trackingNumber: randomUUID() })).total).toBe(0);
  });
});
