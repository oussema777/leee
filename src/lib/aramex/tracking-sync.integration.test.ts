import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { syncTracking } from "./tracking-sync";
import { ingestTrackingWebhook } from "./tracking";
import { testInput, testPreparation } from "./uat-test-fixtures";
const url = process.env.ARAMEX_TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:55441/aramex_test";
const parsed = new URL(url);
if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/aramex_test") throw Error("Dedicated local database required");
const db = new PrismaClient({ datasourceUrl: url });
const event = (awb: string, code = "SH005", orderNumber = "") => ({ Key: awb, Value: { WaybillNumber: awb,
  UpdateCode: code, UpdateDateTime: "2026-10-20T10:00:00Z", UpdateLocation: "Beirut", Comments: "Test event", ProblemCode: "", OrderNumber: orderNumber } });
describe.skipIf(!process.env.ARAMEX_TEST_DATABASE_URL)("missed-update recovery (isolated PostgreSQL)", () => {
  afterAll(() => db.$disconnect());
  async function fixture(environment = "UAT", status = "CREATED") {
    const awb = randomUUID();
    const order = await db.bookOrder.create({ data: { reference: `SYNC-${randomUUID()}`, locale: "en", package: "SINGLE", purpose: "SELF",
      requestedBookCount: 1, priceCents: 900, customerName: "Test User", customerPhone: "70123456", fulfillmentMethod: "DELIVERY",
      paymentMethod: "CASH_ON_DELIVERY", status: "CONFIRMED" } });
    const shipment = await db.bookShipment.create({ data: { orderId: order.id, environment, status, trackingNumber: awb, input: testInput(),
      preparation: testPreparation(), orderFingerprint: "original", createdBy: "test", updatedBy: "test" } });
    return { order, shipment, awb };
  }
  it("adds only missing events, deduplicates webhook/API metadata differences and preserves financial/order state", async () => {
    const f = await fixture(); await ingestTrackingWebhook(db, event(f.awb, "SH005", "optional-reference"));
    const lookup = { history: vi.fn().mockResolvedValue([event(f.awb), event(f.awb, "SH012")]) };
    const results = await Promise.all([syncTracking(db, f.order.id, lookup, new AbortController().signal), syncTracking(db, f.order.id, lookup, new AbortController().signal)]);
    expect(results.reduce((sum, result) => sum + result.added, 0)).toBe(1);
    expect(await db.aramexTrackingEvent.count({ where: { shipmentId: f.shipment.id } })).toBe(2);
    expect(await db.bookOrder.findUnique({ where: { id: f.order.id } })).toMatchObject({ status: "CONFIRMED", paymentStatus: "PENDING" });
    expect(await db.bookShipment.findUnique({ where: { id: f.shipment.id } })).toMatchObject({ status: "CREATED", updatedAt: f.shipment.updatedAt });
    lookup.history.mockResolvedValue([]);
    expect((await syncTracking(db, f.order.id, lookup, new AbortController().signal)).added).toBe(0);
    expect(await db.aramexTrackingEvent.count({ where: { shipmentId: f.shipment.id } })).toBe(2);
  });
  it("does not save a partial batch or a response for a different AWB", async () => {
    const f = await fixture();
    for (const events of [[event(f.awb), event("wrong-awb")], [event(f.awb), { ...event(f.awb), Value: { ...event(f.awb).Value, UpdateDateTime: "bad" } }]]) {
      await expect(syncTracking(db, f.order.id, { history: vi.fn().mockResolvedValue(events) }, new AbortController().signal)).rejects.toThrow();
    }
    expect(await db.aramexTrackingEvent.count({ where: { shipmentId: f.shipment.id } })).toBe(0);
  });
  it.each([["PRODUCTION", "CREATED"], ["UAT", "UNKNOWN"], ["UAT", "DRAFT"]])("rejects ineligible %s/%s without contacting Aramex", async (environment, status) => {
    const f = await fixture(environment, status); const lookup = { history: vi.fn() };
    await expect(syncTracking(db, f.order.id, lookup, new AbortController().signal)).rejects.toThrow("TRACKING_NOT_ELIGIBLE");
    expect(lookup.history).not.toHaveBeenCalled();
  });
  it("rechecks the shipment after network I/O", async () => {
    const f = await fixture();
    const lookup = { history: vi.fn().mockImplementation(async () => {
      await db.bookShipment.update({ where: { id: f.shipment.id }, data: { trackingNumber: randomUUID() } }); return [event(f.awb)];
    }) };
    await expect(syncTracking(db, f.order.id, lookup, new AbortController().signal)).rejects.toThrow("TRACKING_SHIPMENT_CHANGED");
    expect(await db.aramexTrackingEvent.count({ where: { shipmentId: f.shipment.id } })).toBe(0);
  });
});
