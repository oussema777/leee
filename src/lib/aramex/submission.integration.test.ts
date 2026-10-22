import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const url = process.env.ARAMEX_TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:55441/aramex_test";
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/aramex_test") throw Error("A dedicated local aramex_test database is required.");
  return { db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/api-utils", () => ({
  withAdmin: async () => ({ session: { userId: "submission-test-admin", role: "ADMIN" } }),
}));
import { db } from "@/lib/db";
import { submitSavedShipment, type ShipmentTransport } from "./submission";
import { preparationDefaults } from "./preparation";
import { PUT } from "@/app/api/admin/book-orders/[id]/shipping/route";
import { createUatTransport } from "./uat-transport";
import { testCredentials, testSettings, testSchedule, testResponse } from "./uat-test-fixtures";

const transport = (outcome: unknown): ShipmentTransport & { createShipment: ReturnType<typeof vi.fn> } => ({
  environment: "UAT", createShipment: vi.fn(async () => outcome),
});
const created = () => ({ kind: "created", trackingNumber: randomUUID(), labelUrl: "https://ws.uat.aramex.net/labels/test.pdf" });
describe.skipIf(!process.env.ARAMEX_TEST_DATABASE_URL)("shipment submission with simulated transport (isolated PostgreSQL)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw Error("No outbound requests allowed"); })));
  afterEach(() => { expect(fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); });
  afterAll(async () => db.$disconnect());
  async function fixture() {
    await db.user.upsert({
      where: { id: "submission-test-admin" }, update: {},
      create: { id: "submission-test-admin", email: "submission-admin@example.test", name: "Test", password: "not-a-password", role: "ADMIN" },
    });
    const order = await db.bookOrder.create({ data: {
      reference: "SUBMIT-TEST-" + randomUUID(), locale: "en", package: "SINGLE", purpose: "SELF",
      requestedBookCount: 1, priceCents: 900, customerName: "Test Purchaser", customerPhone: "70123456",
      fulfillmentMethod: "DELIVERY", area: "Beirut", detailedAddress: "Test Street, Building 4",
      paymentMethod: "CASH_ON_DELIVERY", status: "CONFIRMED",
    }, include: { whishPayment: true } });
    const draftInput = { ...preparationDefaults(order), parcels: [{ weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 5 }] };
    async function save(version: number | null) {
      return PUT(new NextRequest("http://localhost/shipping", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: draftInput, expectedDraftVersion: version }),
      }), { params: Promise.resolve({ id: order.id }) });
    }
    expect((await save(null)).status).toBe(200);
    return { order, save, input: { orderId: order.id, expectedDraftVersion: 1, actor: "submission-test-admin" } };
  }
  it("stores tracking/label and attempt evidence without changing order/payment status", async () => {
    const { order, input } = await fixture();
    const result = created();
    const adapter = transport(result);
    const shipment = await submitSavedShipment(db, input, adapter);
    expect(shipment).toMatchObject({ status: "CREATED", trackingNumber: result.trackingNumber, labelUrl: result.labelUrl });
    const attempts = await db.bookShipmentAttempt.findMany({ where: { shipmentId: shipment.id } });
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ status: "CREATED", draftVersion: 1, actor: input.actor, trackingNumber: result.trackingNumber });
    expect(attempts[0].finishedAt).toBeInstanceOf(Date);
    expect(adapter.createShipment.mock.calls[0][0]).toMatchObject({
      submissionKey: attempts[0].submissionKey, preparation: { collection: { amountCents: 900 } },
    });
    expect(await db.bookOrder.findUnique({ where: { id: order.id } })).toMatchObject({ status: "CONFIRMED", paymentStatus: "PENDING" });
    await submitSavedShipment(db, input, adapter);
    expect(adapter.createShipment).toHaveBeenCalledTimes(1);
  });
  it("persists an actual adapter's parsed response and deduplicates repeated calls", async () => {
    const { input, order } = await fixture();
    const trackingNumber = randomUUID();
    const send = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      const body = JSON.parse(init!.body as string);
      const response = testResponse(body.Transaction.Reference1);
      response.Shipments[0].Reference1 = order.reference;
      response.Shipments[0].ID = trackingNumber;
      return Response.json(response);
    });
    const adapter = createUatTransport({ settings: { ...testSettings(), recipientEmailRequired: false },
      credentials: testCredentials(), schedule: testSchedule, fetchImpl: send });
    const shipment = await submitSavedShipment(db, input, adapter);
    expect(shipment).toMatchObject({ status: "CREATED", trackingNumber });
    await submitSavedShipment(db, input, adapter);
    expect(send).toHaveBeenCalledTimes(1);
    const evidence = await db.bookShipmentAttempt.findMany({ where: { shipmentId: shipment.id } });
    expect(evidence).toHaveLength(1);
    expect(JSON.stringify(evidence)).not.toMatch(/fixture-password|fixture-pin|ClientInfo/);
  });
  it("leaves the draft untouched when adapter preflight fails before sending", async () => {
    const { input, order } = await fixture();
    const send = vi.fn<typeof fetch>();
    const adapter = createUatTransport({ settings: testSettings(), credentials: testCredentials(),
      schedule: testSchedule, fetchImpl: send });
    await expect(submitSavedShipment(db, input, adapter)).rejects.toThrow("RECIPIENT_EMAIL_REQUIRED");
    const shipment = await db.bookShipment.findUniqueOrThrow({ where: { orderId: order.id } });
    expect(shipment.status).toBe("DRAFT");
    expect(await db.bookShipmentAttempt.count({ where: { shipmentId: shipment.id } })).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
  it("persists uncertain adapter HTTP failures and blocks a second send", async () => {
    const { input } = await fixture();
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response("private error", { status: 503 }));
    const adapter = createUatTransport({ settings: { ...testSettings(), recipientEmailRequired: false },
      credentials: testCredentials(), schedule: testSchedule, fetchImpl: send });
    expect((await submitSavedShipment(db, input, adapter)).status).toBe("UNKNOWN");
    await expect(submitSavedShipment(db, input, adapter)).rejects.toThrow("CONFIRMATION_REQUIRED");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("blocks a simultaneous click while the first request is in flight", async () => {
    const { input } = await fixture();
    let release!: (result: unknown) => void;
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const adapter: ShipmentTransport = { environment: "UAT", createShipment: vi.fn(() => {
      entered(); return new Promise(resolve => { release = resolve; });
    }) };
    const first = submitSavedShipment(db, input, adapter);
    await started;
    await expect(submitSavedShipment(db, input, adapter)).rejects.toThrow("CONFIRMATION_REQUIRED");
    release(created());
    await first;
    expect(adapter.createShipment).toHaveBeenCalledTimes(1);
  });
  it("requires re-review/save after a definitive rejection before retrying", async () => {
    const { input, save } = await fixture();
    const rejected = transport({ kind: "rejected", code: "VALIDATION" });
    expect((await submitSavedShipment(db, input, rejected)).status).toBe("REJECTED");
    await expect(submitSavedShipment(db, input, rejected)).rejects.toThrow("REVIEW_REJECTED_DRAFT");
    expect((await save(1)).status).toBe(200);
    const shipment = await submitSavedShipment(db, { ...input, expectedDraftVersion: 2 }, transport(created()));
    expect(shipment.status).toBe("CREATED");
    const attempts = await db.bookShipmentAttempt.findMany({ where: { shipmentId: shipment.id } });
    expect(attempts).toHaveLength(2);
    expect(new Set(attempts.map(a => a.submissionKey)).size).toBe(2);
  });
  it("aborts a timeout, persists UNKNOWN and blocks retry/save even if a late success arrives", async () => {
    const { input, save } = await fixture();
    let late!: (result: unknown) => void;
    let signal!: AbortSignal;
    const adapter: ShipmentTransport = { environment: "UAT", createShipment: vi.fn((_request, s) => {
      signal = s; return new Promise(resolve => { late = resolve; });
    }) };
    const shipment = await submitSavedShipment(db, input, adapter, 10);
    expect(signal.aborted).toBe(true);
    expect(shipment.status).toBe("UNKNOWN");
    late(created());
    await expect(submitSavedShipment(db, input, adapter)).rejects.toThrow("CONFIRMATION_REQUIRED");
    expect((await save(1)).status).toBe(409);
    expect(adapter.createShipment).toHaveBeenCalledTimes(1);
  });
  it.each([
    { kind: "created", trackingNumber: "" },
    { kind: "rejected", code: "VALIDATION", trackingNumber: "12345678" },
    { HasErrors: true }, null,
  ])("treats ambiguous/malformed outcomes as unknown, never safely retryable: %j", async outcome => {
    const { input } = await fixture();
    const adapter = transport(outcome);
    expect((await submitSavedShipment(db, input, adapter)).status).toBe("UNKNOWN");
    await expect(submitSavedShipment(db, input, adapter)).rejects.toThrow("CONFIRMATION_REQUIRED");
    expect(adapter.createShipment).toHaveBeenCalledTimes(1);
  });
  it("does not store or expose raw exceptions", async () => {
    const { input } = await fixture();
    const adapter: ShipmentTransport = { environment: "UAT", createShipment: vi.fn(async () => { throw Error("secret-password customer-phone"); }) };
    const shipment = await submitSavedShipment(db, input, adapter);
    const attempt = await db.bookShipmentAttempt.findFirstOrThrow({ where: { shipmentId: shipment.id } });
    expect(attempt.failureCode).toBe("CONFIRMATION_REQUIRED");
    expect(JSON.stringify(attempt)).not.toContain("secret-password");
  });
  it.each([null, "http://ws.aramex.net/a.pdf", "javascript:alert(1)", "https://aramex.net.attacker.test/a.pdf"])("keeps a successful booking even with an unavailable/unsafe label: %s", async labelUrl => {
    const { input } = await fixture();
    const adapter = transport({ ...created(), labelUrl });
    const shipment = await submitSavedShipment(db, input, adapter);
    expect(shipment.status).toBe("CREATED");
    expect(shipment.labelUrl).toBeNull();
    await submitSavedShipment(db, input, adapter);
    expect(adapter.createShipment).toHaveBeenCalledTimes(1);
  });
  it("checks material order changes and draft version before contacting the carrier", async () => {
    const { order, input } = await fixture();
    const adapter = transport(created());
    await expect(submitSavedShipment(db, { ...input, expectedDraftVersion: 2 }, adapter)).rejects.toThrow("STALE_DRAFT");
    await db.bookOrder.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
    await expect(submitSavedShipment(db, input, adapter)).rejects.toThrow("STALE_ORDER");
    expect(adapter.createShipment).not.toHaveBeenCalled();
  });
  it("blocks cancelled orders before contacting the carrier", async () => {
    const { order, input } = await fixture();
    await db.bookOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    const adapter = transport(created());
    await expect(submitSavedShipment(db, input, adapter)).rejects.toThrow("ORDER_NOT_ELIGIBLE");
    expect(adapter.createShipment).not.toHaveBeenCalled();
  });
  it("keeps an unresolved claim if a carrier success cannot be persisted", async () => {
    const first = await fixture(), second = await fixture();
    const result = created();
    await submitSavedShipment(db, first.input, transport(result));
    const adapter = transport(result); // Duplicate AWB violates storage uniqueness.
    await expect(submitSavedShipment(db, second.input, adapter)).rejects.toThrow("RESULT_NOT_SAVED_CONFIRMATION_REQUIRED");
    expect(await db.bookShipment.findUnique({ where: { orderId: second.order.id } })).toMatchObject({ status: "SUBMITTING" });
    await expect(submitSavedShipment(db, second.input, adapter)).rejects.toThrow("CONFIRMATION_REQUIRED");
    expect(adapter.createShipment).toHaveBeenCalledTimes(1);
  });
});
