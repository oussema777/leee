import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { reconcileShipment, reconciliationSchema } from "./reconciliation";
import { testInput, testPreparation } from "./uat-test-fixtures";
import { submitSavedShipment } from "./submission";

const url = process.env.ARAMEX_TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:55441/aramex_test";
const parsed = new URL(url);
if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/aramex_test") throw Error("Dedicated local database required");
const db = new PrismaClient({ datasourceUrl: url });
const evidence = { outcome: "CREATED" as const, evidenceSource: "ARAMEX_SUPPORT" as const,
  evidenceReference: "Support ticket TEST-123", notes: "Aramex confirmed this request and order match the tracking number.",
  confirmed: true as const, trackingNumber: "123456789", labelUrl: "" };

describe("recovery validation", () => {
  it("requires positive evidence, safe labels and matching outcome fields", () => {
    const valid = { ...evidence, expectedAttemptId: "a", expectedUpdatedAt: new Date().toISOString() };
    expect(reconciliationSchema.safeParse(valid).success).toBe(true);
    for (const change of [{ confirmed: false }, { notes: "" }, { trackingNumber: "" },
      { outcome: "NOT_CREATED" }, { labelUrl: "https://evil.test/label" }, { evidenceSource: "NO_SEARCH_RESULTS" }]) {
      expect(reconciliationSchema.safeParse({ ...valid, ...change }).success).toBe(false);
    }
  });
});
describe.skipIf(!process.env.ARAMEX_TEST_DATABASE_URL)("audited shipment recovery (isolated PostgreSQL)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("No carrier requests allowed"); })));
  afterAll(async () => { vi.unstubAllGlobals(); await db.$disconnect(); });
  async function fixture(status = "UNKNOWN", recent = false) {
    const key = randomUUID();
    const order = await db.bookOrder.create({ data: { reference: `REC-${key}`, locale: "en", package: "SINGLE", purpose: "SELF",
      requestedBookCount: 1, priceCents: 900, customerName: "Test User", customerPhone: "70123456", fulfillmentMethod: "DELIVERY",
      paymentMethod: "CASH_ON_DELIVERY", status: "CONFIRMED" } });
    const shipment = await db.bookShipment.create({ data: { orderId: order.id, status, input: testInput(), preparation: testPreparation(),
      orderFingerprint: "old-fingerprint", createdBy: "test", updatedBy: "test" } });
    const attempt = await db.bookShipmentAttempt.create({ data: { shipmentId: shipment.id, submissionKey: key, status,
      draftVersion: 1, preparation: testPreparation(), orderFingerprint: "old-fingerprint", actor: "test",
      startedAt: new Date(Date.now() - (recent ? 0 : 600_000)), failureCode: "CONFIRMATION_REQUIRED" } });
    return { order, shipment, attempt, input: { ...evidence, trackingNumber: key, expectedAttemptId: attempt.id, expectedUpdatedAt: shipment.updatedAt.toISOString() } };
  }
  it.each(["UNKNOWN", "SUBMITTING"])("recovers %s with immutable evidence and no payment/order changes", async status => {
    const f = await fixture(status);
    const result = await reconcileShipment(db, f.order.id, f.input, "reviewer");
    expect(result).toMatchObject({ status: "CREATED", trackingNumber: f.input.trackingNumber, orderFingerprint: "old-fingerprint" });
    expect(await db.bookShipmentReconciliation.findUnique({ where: { attemptId: f.attempt.id } }))
      .toMatchObject({ actor: "reviewer", outcome: "CREATED", previousAttemptStatus: status, previousShipmentStatus: status });
    expect(await db.bookOrder.findUnique({ where: { id: f.order.id } })).toMatchObject({ status: "CONFIRMED", paymentStatus: "PENDING" });
    await expect(reconcileShipment(db, f.order.id, f.input, "other")).rejects.toThrow("ALREADY_RESOLVED");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("requires draft review after definitive no-booking confirmation", async () => {
    const f = await fixture();
    expect((await reconcileShipment(db, f.order.id, { ...f.input, outcome: "NOT_CREATED", trackingNumber: "" }, "reviewer")).status).toBe("REJECTED");
    const send = vi.fn();
    await expect(submitSavedShipment(db, { orderId: f.order.id, expectedDraftVersion: 1, actor: "test" }, { environment: "UAT", createShipment: send }))
      .rejects.toThrow("REVIEW_REJECTED_DRAFT");
    expect(send).not.toHaveBeenCalled();
  });
  it("blocks recent attempts, stale reviews and production records without audit changes", async () => {
    const f = await fixture("SUBMITTING", true);
    await expect(reconcileShipment(db, f.order.id, f.input, "r")).rejects.toThrow("REQUEST_STILL_RECENT");
    const old = await fixture();
    await expect(reconcileShipment(db, old.order.id, { ...old.input, expectedUpdatedAt: new Date(0).toISOString() }, "r")).rejects.toThrow("STALE_REVIEW");
    await db.bookShipment.update({ where: { id: old.shipment.id }, data: { environment: "PRODUCTION" } });
    await expect(reconcileShipment(db, old.order.id, old.input, "r")).rejects.toThrow("UAT_ONLY");
    expect(await db.bookShipmentReconciliation.count({ where: { attemptId: { in: [f.attempt.id, old.attempt.id] } } })).toBe(0);
  });
  it("serializes concurrent reviewers so only one outcome is recorded", async () => {
    const f = await fixture();
    const results = await Promise.allSettled([reconcileShipment(db, f.order.id, f.input, "one"), reconcileShipment(db, f.order.id, f.input, "two")]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(await db.bookShipmentReconciliation.count({ where: { attemptId: f.attempt.id } })).toBe(1);
  });
  it("rolls back all evidence if a tracking number already belongs to another shipment", async () => {
    const first = await fixture(); await reconcileShipment(db, first.order.id, first.input, "r");
    const second = await fixture();
    await expect(reconcileShipment(db, second.order.id, { ...second.input, trackingNumber: first.input.trackingNumber }, "r")).rejects.toMatchObject({ code: "P2002" });
    expect((await db.bookShipment.findUniqueOrThrow({ where: { id: second.shipment.id } })).status).toBe("UNKNOWN");
    expect(await db.bookShipmentReconciliation.count({ where: { attemptId: second.attempt.id } })).toBe(0);
  });
});
