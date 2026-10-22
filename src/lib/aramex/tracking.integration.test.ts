import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { ingestTrackingWebhook, shipmentTracking, trackingDescription, trackingProgress, trackingWebhookSchema } from "./tracking";
import { testInput, testPreparation } from "./uat-test-fixtures";
import catalog from "./data/tracking-codes.json";
const url = process.env.ARAMEX_TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:55441/aramex_test";
const parsed = new URL(url);
if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/aramex_test") throw Error("Dedicated local database required");
const db = new PrismaClient({ datasourceUrl: url });
const payload = (awb: string, code = "SH005", date = "2026-10-20T10:00:00Z") => ({ Key: awb, Value: {
  WaybillNumber: awb, UpdateCode: code, UpdateDateTime: date, UpdateLocation: "Beirut", Comments: "Test event", ProblemCode: "", OrderNumber: "",
} });
const event = (code: string, hour: number, problemCode = "") => ({ code, problemCode, occurredAt: `2026-10-20T${String(hour).padStart(2, "0")}:00:00Z` });
describe("documented tracking interpretation", () => {
  it("preserves the supplied status catalog and avoids confusing partial/third-party/financial events with delivery", () => {
    expect(catalog.rows).toHaveLength(310);
    expect(trackingDescription("SH005", "")).toBe("Delivered");
    expect(trackingProgress([event("SH154", 10)]).status).toBe("PARTIAL_DELIVERY");
    for (const code of ["SH007", "SH247", "SH239"]) expect(trackingProgress([event(code, 10)]).status).not.toBe("DELIVERED");
    expect(trackingProgress([event("SH539", 10)])).toEqual({ status: "REVIEW_REQUIRED", needsReview: true });
  });
  it("uses event time, retains unknown updates, and marks terminal contradictions for review", () => {
    expect(trackingProgress([event("SH005", 12), event("SH012", 9), event("SH003", 11)]).status).toBe("DELIVERED");
    expect(trackingProgress([event("SH005", 12), event("SH003", 13)])).toEqual({ status: "REVIEW_REQUIRED", needsReview: true });
    expect(trackingProgress([event("SH005", 12), event("SH559", 13)]).status).toBe("RETURNED");
    expect(trackingProgress([event("SH005", 12), event("UNKNOWN", 13)])).toEqual({ status: "DELIVERED", needsReview: true });
    expect(trackingProgress([event("SH043", 10, "U02")]).status).toBe("EXCEPTION");
  });
  it("does not arbitrarily choose between simultaneous contradictory states", () => {
    for (const events of [[event("SH005", 10), event("SH003", 10)], [event("SH003", 10), event("SH005", 10)]]) {
      expect(trackingProgress(events).status).toBe("REVIEW_REQUIRED");
    }
  });
  it("rejects mismatched waybills, missing timezone and oversized text", () => {
    const valid = payload("12345678");
    for (const input of [{ ...valid, Key: "87654321" }, { ...valid, Value: { ...valid.Value, UpdateDateTime: "2026-10-20T10:00:00" } },
      { ...valid, Value: { ...valid.Value, Comments: "x".repeat(2001) } }]) expect(trackingWebhookSchema.safeParse(input).success).toBe(false);
  });
});
describe.skipIf(!process.env.ARAMEX_TEST_DATABASE_URL)("durable tracking inbox (isolated PostgreSQL)", () => {
  afterAll(() => db.$disconnect());
  async function fixture(awb = randomUUID(), environment = "UAT", status = "CREATED") {
    const order = await db.bookOrder.create({ data: { reference: `TRACK-${randomUUID()}`, locale: "en", package: "SINGLE", purpose: "SELF",
      requestedBookCount: 1, priceCents: 900, customerName: "Test User", customerPhone: "70123456", fulfillmentMethod: "DELIVERY",
      paymentMethod: "CASH_ON_DELIVERY", status: "CONFIRMED" } });
    const shipment = await db.bookShipment.create({ data: { orderId: order.id, environment, status, trackingNumber: awb, input: testInput(),
      preparation: testPreparation(), orderFingerprint: "original", createdBy: "test", updatedBy: "test" } });
    return { order, shipment, awb };
  }
  it("deduplicates concurrent deliveries and does not change booking, order or payment state", async () => {
    const f = await fixture(); const input = payload(f.awb);
    await Promise.all([ingestTrackingWebhook(db, input), ingestTrackingWebhook(db, input), ingestTrackingWebhook(db, input)]);
    expect(await db.aramexTrackingEvent.count({ where: { shipmentId: f.shipment.id } })).toBe(1);
    await ingestTrackingWebhook(db, payload(f.awb, "SH239", "2026-10-20T11:00:00Z"));
    await ingestTrackingWebhook(db, payload(f.awb, "SH003", "2026-10-20T09:00:00Z"));
    expect((await shipmentTracking(db, f.order.id))?.status).toBe("DELIVERED");
    expect(await db.bookOrder.findUnique({ where: { id: f.order.id } })).toMatchObject({ status: "CONFIRMED", paymentStatus: "PENDING" });
    expect(await db.bookShipment.findUnique({ where: { id: f.shipment.id } })).toMatchObject({ status: "CREATED", updatedAt: f.shipment.updatedAt });
  });
  it("retains early events and links them only after a confirmed UAT booking exists", async () => {
    const awb = randomUUID(); expect(await ingestTrackingWebhook(db, payload(awb))).toEqual({ linked: false });
    const f = await fixture(awb, "UAT", "UNKNOWN");
    expect((await shipmentTracking(db, f.order.id))?.events).toHaveLength(0);
    await db.bookShipment.update({ where: { id: f.shipment.id }, data: { status: "CREATED" } });
    expect((await shipmentTracking(db, f.order.id))?.events).toHaveLength(1);
    expect(await db.aramexTrackingEvent.count({ where: { trackingNumber: awb, shipmentId: f.shipment.id } })).toBe(1);
  });
  it("never links a UAT event to a production shipment with the same AWB", async () => {
    const f = await fixture(randomUUID(), "PRODUCTION");
    expect(await ingestTrackingWebhook(db, payload(f.awb))).toEqual({ linked: false });
    expect((await shipmentTracking(db, f.order.id))?.events).toHaveLength(0);
  });
  it("normalizes timestamp offsets for deduplication and rejects future events before storage", async () => {
    const f = await fixture(); await ingestTrackingWebhook(db, payload(f.awb));
    await ingestTrackingWebhook(db, payload(f.awb, "SH005", "2026-10-20T13:00:00+03:00"));
    expect(await db.aramexTrackingEvent.count({ where: { trackingNumber: f.awb } })).toBe(1);
    await expect(ingestTrackingWebhook(db, payload(f.awb, "SH005", "2099-01-01T00:00:00Z"))).rejects.toThrow("FUTURE_TRACKING_UPDATE");
  });
});
