import { afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const url = process.env.ARAMEX_TEST_DATABASE_URL || "postgresql://postgres@127.0.0.1:55441/aramex_test";
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1"].includes(parsed.hostname) || parsed.pathname !== "/aramex_test") {
    throw Error("Aramex tests require a dedicated local aramex_test database.");
  }
  return { db: new PrismaClient({ datasourceUrl: url }) };
});
vi.mock("@/lib/api-utils", () => ({
  withAdmin: async () => ({ session: { userId: "aramex-test-admin", role: "ADMIN" } }),
}));

import { db } from "@/lib/db";
import { GET, POST, PUT } from "@/app/api/admin/book-orders/[id]/shipping/route";
import { preparationDefaults } from "./preparation";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function request(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/admin/book-orders/test/shipping", {
    method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe.skipIf(!process.env.ARAMEX_TEST_DATABASE_URL)("saved Aramex drafts (isolated PostgreSQL)", () => {
  afterAll(async () => db.$disconnect());
  async function fixture() {
    await db.user.upsert({
      where: { id: "aramex-test-admin" }, update: {},
      create: { id: "aramex-test-admin", email: "aramex-admin@example.test", name: "Test", password: "not-a-password", role: "ADMIN" },
    });
    const order = await db.bookOrder.create({ data: {
      reference: "SHIP-TEST-" + randomUUID(), locale: "en", package: "SINGLE", purpose: "SELF",
      requestedBookCount: 1, priceCents: 900, customerName: "Test Purchaser", customerPhone: "70123456",
      fulfillmentMethod: "DELIVERY", area: "Beirut", detailedAddress: "Test Street, Building 4",
      paymentMethod: "CASH_ON_DELIVERY", status: "CONFIRMED",
    }, include: { whishPayment: true } });
    const input = { ...preparationDefaults(order), parcels: [{ weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 5 }] };
    return { order, input, context: ctx(order.id) };
  }
  it("saves, reloads and updates one record with current server-derived amounts and audit fields", async () => {
    const { order, input, context } = await fixture();
    const before = await db.bookOrder.findUniqueOrThrow({ where: { id: order.id } });
    const saved = await PUT(request("PUT", { input, expectedDraftVersion: null }), context);
    expect(saved.status).toBe(200);
    const body = await saved.json();
    expect(body.savedDraft).toMatchObject({ version: 1, stale: false });
    expect(body.preparation.collection.amountCents).toBe(900);
    const restored = await (await GET(request("GET"), context)).json();
    expect(restored.savedDraft.input).toMatchObject({ city: "Beirut", recipientPhone: "+96170123456", parcels: input.parcels });
    const changed = { ...input, addressLine2: "Floor 2" };
    expect((await PUT(request("PUT", { input: changed, expectedDraftVersion: 1 }), context)).status).toBe(200);
    expect(await db.bookShipment.count({ where: { orderId: order.id } })).toBe(1);
    expect(await db.bookShipment.findUniqueOrThrow({ where: { orderId: order.id } })).toMatchObject({
      version: 2, status: "DRAFT", provider: "ARAMEX", environment: "UAT",
      createdBy: "aramex-test-admin", updatedBy: "aramex-test-admin",
    });
    expect(await db.bookOrder.findUniqueOrThrow({ where: { id: order.id } })).toEqual(before);
  });
  it("serializes two first saves and rejects stale revisions instead of overwriting", async () => {
    const { order, input, context } = await fixture();
    const responses = await Promise.all([1, 2].map(() => PUT(request("PUT", { input, expectedDraftVersion: null }), context)));
    expect(responses.map(r => r.status).sort()).toEqual([200, 409]);
    expect(await db.bookShipment.count({ where: { orderId: order.id } })).toBe(1);
    expect((await PUT(request("PUT", { input, expectedDraftVersion: 1 }), context)).status).toBe(200);
    expect((await PUT(request("PUT", { input, expectedDraftVersion: 1 }), context)).status).toBe(409);
  });
  it("retains the draft after payment changes, flags it, and recalculates collection on re-review", async () => {
    const { order, input, context } = await fixture();
    await PUT(request("PUT", { input, expectedDraftVersion: null }), context);
    await db.bookOrder.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
    const restored = await (await GET(request("GET"), context)).json();
    expect(restored.savedDraft.stale).toBe(true);
    expect(restored.collection.amountCents).toBe(0);
    expect((await PUT(request("PUT", { input, expectedDraftVersion: 1 }), context)).status).toBe(409);
    const refreshed = { ...input, expectedUpdatedAt: restored.defaults.expectedUpdatedAt };
    expect((await (await POST(request("POST", refreshed), context)).json()).collection.amountCents).toBe(0);
    const saved = await (await PUT(request("PUT", { input: refreshed, expectedDraftVersion: 1 }), context)).json();
    expect(saved.savedDraft.stale).toBe(false);
    expect(saved.preparation.collection.amountCents).toBe(0);
  });
  it("ignores read receipts for draft staleness but detects delivery address changes", async () => {
    const { order, input, context } = await fixture();
    await PUT(request("PUT", { input, expectedDraftVersion: null }), context);
    await db.bookOrder.update({ where: { id: order.id }, data: { isRead: true, adminNotes: "Internal note" } });
    expect((await (await GET(request("GET"), context)).json()).savedDraft.stale).toBe(false);
    await db.bookOrder.update({ where: { id: order.id }, data: { detailedAddress: "Different Street, 5" } });
    expect((await (await GET(request("GET"), context)).json()).savedDraft.stale).toBe(true);
  });
  it.each(["NEW", "CANCELLED", "DISPATCHED", "COMPLETED"] as const)("blocks saving an ineligible %s order without deleting its draft", async status => {
    const { order, input, context } = await fixture();
    await PUT(request("PUT", { input, expectedDraftVersion: null }), context);
    const changed = await db.bookOrder.update({ where: { id: order.id }, data: { status } });
    expect((await PUT(request("PUT", {
      input: { ...input, expectedUpdatedAt: changed.updatedAt.toISOString() }, expectedDraftVersion: 1,
    }), context)).status).toBe(409);
    expect((await db.bookShipment.findUniqueOrThrow({ where: { orderId: order.id } })).version).toBe(1);
  });
  it("rejects tampered collection data, oversized bodies and overwriting a booked shipment", async () => {
    const { order, input, context } = await fixture();
    expect((await PUT(request("PUT", { input: { ...input, amountCents: 0 }, expectedDraftVersion: null }), context)).status).toBe(400);
    expect((await PUT(request("PUT", { junk: "x".repeat(40000) }), context)).status).toBe(413);
    await PUT(request("PUT", { input, expectedDraftVersion: null }), context);
    await db.bookShipment.update({ where: { orderId: order.id }, data: { status: "CREATED" } });
    expect((await PUT(request("PUT", { input, expectedDraftVersion: 1 }), context)).status).toBe(409);
  });
});
