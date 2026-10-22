import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { retrieveLabel } from "./label-retrieval";
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
  it("saves a label without changing booking, order or payment state", async () => {
    const f = await fixture();
    const lookup = { label: vi.fn().mockResolvedValue("https://ws.uat.aramex.net/label.pdf") };
    await retrieveLabel(db, f.order.id, lookup, "reviewer", new AbortController().signal);
    expect(lookup.label).toHaveBeenCalledWith(f.awb, expect.any(AbortSignal));
    expect(await db.bookShipment.findUnique({ where: { id: f.shipment.id } })).toMatchObject({ status: "CREATED", trackingNumber: f.awb, labelUrl: "https://ws.uat.aramex.net/label.pdf", updatedBy: "reviewer" });
    expect(await db.bookShipmentAttempt.count({ where: { shipmentId: f.shipment.id } })).toBe(0);
    expect(await db.bookOrder.findUnique({ where: { id: f.order.id } })).toEqual(f.order);
    lookup.label.mockResolvedValue("https://evil.example/label.pdf");
    await expect(retrieveLabel(db, f.order.id, lookup, "reviewer", new AbortController().signal)).rejects.toThrow();
    expect((await db.bookShipment.findUniqueOrThrow({ where: { id: f.shipment.id } })).labelUrl).toBe("https://ws.uat.aramex.net/label.pdf");
  });
  it.each([["PRODUCTION", "CREATED"], ["UAT", "UNKNOWN"], ["UAT", "DRAFT"]])("rejects ineligible %s/%s before network I/O", async (environment, status) => {
    const f = await fixture(environment, status); const lookup = { label: vi.fn() };
    await expect(retrieveLabel(db, f.order.id, lookup, "reviewer", new AbortController().signal)).rejects.toThrow("LABEL_NOT_ELIGIBLE");
    expect(lookup.label).not.toHaveBeenCalled();
  });
  it("rejects a stale response after a concurrent change", async () => {
    const f = await fixture();
    const lookup = { label: vi.fn().mockImplementation(async () => {
      await db.bookShipment.update({ where: { id: f.shipment.id }, data: { labelUrl: "https://aramex.com/newer.pdf" } });
      return "https://aramex.com/stale.pdf";
    }) };
    await expect(retrieveLabel(db, f.order.id, lookup, "reviewer", new AbortController().signal)).rejects.toThrow("LABEL_SHIPMENT_CHANGED");
    expect((await db.bookShipment.findUniqueOrThrow({ where: { id: f.shipment.id } })).labelUrl).toBe("https://aramex.com/newer.pdf");
  });
});
