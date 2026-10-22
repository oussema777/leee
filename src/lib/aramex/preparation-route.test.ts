import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST, PUT } from "@/app/api/admin/book-orders/[id]/shipping/route";
import { preparationDefaults, type ShippingOrder } from "./preparation";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), order: vi.fn(), shipment: vi.fn(),
  fetch: vi.fn(() => { throw Error("Unexpected outbound request"); }),
}));
vi.mock("@/lib/db", () => ({ db: {
  user: { findUnique: mocks.user }, bookOrder: { findUnique: mocks.order },
  bookShipment: { findUnique: mocks.shipment },
} }));
vi.mock("@/lib/book-orders/whish-server", () => ({ lockOrder: vi.fn() }));
vi.mock("@/lib/api-utils", () => ({
  withAdmin: async (request: NextRequest) => request.headers.get("x-test-admin") === "yes"
    ? { session: { userId: "admin-1", role: "ADMIN" } }
    : { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) },
}));

const context = { params: Promise.resolve({ id: "order-1" }) };
let order: ShippingOrder;
function input() {
  return { ...preparationDefaults(order), parcels: [{ weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 5 }] };
}
function request(method: string, body?: unknown, admin = true) {
  return new NextRequest("http://localhost/api/admin/book-orders/order-1/shipping", {
    method, headers: { "Content-Type": "application/json", ...(admin ? { "x-test-admin": "yes" } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
  order = {
    id: "order-1", reference: "LEE-BK-TEST", updatedAt: new Date("2026-10-20T10:00:00.000Z"),
    purpose: "SELF", status: "READY", fulfillmentMethod: "DELIVERY",
    paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING", priceCents: 900, currency: "USD",
    requestedBookCount: 1, customerName: "Test Purchaser", customerPhone: "70123456",
    customerEmail: "purchaser@example.test", recipientName: null, recipientPhone: null,
    governorate: "BEIRUT", area: "Beirut", detailedAddress: "Test Street, Building 4", whishPayment: null,
  };
  mocks.user.mockResolvedValue({ role: "ADMIN" });
  mocks.shipment.mockResolvedValue(null);
  mocks.order.mockImplementation(async () => order);
});
afterEach(() => vi.unstubAllGlobals());

describe("admin-only offline shipment preparation", () => {
  it("requires login before reading an order for GET and POST", async () => {
    for (const handler of [GET, POST, PUT]) {
      const response = await handler(request(handler === GET ? "GET" : "POST", undefined, false), context);
      expect(response.status).toBe(401);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    }
    expect(mocks.order).not.toHaveBeenCalled();
    expect(mocks.user).not.toHaveBeenCalled();
  });
  it.each([null, { role: "EDITOR" }])("rejects deleted or unauthorized staff", async user => {
    mocks.user.mockResolvedValue(user);
    expect((await GET(request("GET"), context)).status).toBe(403);
    expect((await POST(request("POST", input()), context)).status).toBe(403);
    expect((await PUT(request("PUT", { input: input(), expectedDraftVersion: null }), context)).status).toBe(403);
    expect(mocks.order).not.toHaveBeenCalled();
  });
  it("returns approved city choices and no credential/payment-private fields", async () => {
    const response = await GET(request("GET"), context);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.cities).toHaveLength(408);
    expect(body.collection.amountCents).toBe(900);
    expect(body.orderTotalCents).toBe(900);
    expect(body).not.toHaveProperty("whishPayment");
    expect(JSON.stringify(body)).not.toMatch(/Password|AccountPin|accessTokenHash/);
  });
  it("keeps preparation available before the additive shipping table is installed", async () => {
    mocks.shipment.mockRejectedValue({ code: "P2021", meta: { table: "public.BookShipment" } });
    const response = await GET(request("GET"), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ draftStorageAvailable: false, savedDraft: null });
    expect((await POST(request("POST", input()), context)).status).toBe(200);
  });
  it("does not hide database failures as an empty draft", async () => {
    mocks.shipment.mockRejectedValue(Error("Connection failed"));
    expect((await GET(request("GET"), context)).status).toBe(500);
  });
  it("returns only the draft summary for the order card", async () => {
    mocks.shipment.mockResolvedValue({
      id: "shipment-1", updatedAt: new Date(), orderFingerprint: "old", status: "DRAFT",
      input: { privateAddress: "not returned" },
    });
    const response = await GET(new NextRequest("http://localhost/shipping?summary=1", {
      headers: { "x-test-admin": "yes" },
    }), context);
    const body = await response.json();
    expect(body.savedDraft).toMatchObject({ stale: true, editable: true });
    expect(body.savedDraft).not.toHaveProperty("input");
    expect(body).not.toHaveProperty("defaults");
  });
  it("prepares without external calls or database mutation methods", async () => {
    const response = await POST(request("POST", input()), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      kind: "aramex-shipping-preparation", submissionEnabled: false,
      collection: { amountCents: 900 }, recipient: { phone: "+96170123456" },
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("rejects client-supplied collection amounts", async () => {
    const response = await POST(request("POST", { ...input(), amountCents: 0 }), context);
    expect(response.status).toBe(400);
    expect(mocks.order).not.toHaveBeenCalled();
  });
  it("reviews weight-only parcels and reloads both old and dimension-free saved drafts", async () => {
    for (const parcels of [[{ weightKg: 1 }], input().parcels]) {
      const draftInput = { ...input(), parcels };
      const response = await POST(request("POST", draftInput), context);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ parcels, numberOfPieces: 1, totalWeightKg: 1 });
      mocks.shipment.mockResolvedValue({
        id: "shipment-1", version: 1, updatedAt: new Date(), orderFingerprint: "old",
        status: "DRAFT", environment: "UAT", input: JSON.parse(JSON.stringify(draftInput)),
      });
      const loaded = await GET(request("GET"), context);
      expect(loaded.status).toBe(200);
      expect((await loaded.json()).savedDraft.input.parcels).toEqual(parcels);
    }
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("rejects partial dimensions before either review or saving", async () => {
    const partial = { ...input(), parcels: [{ weightKg: 1, lengthCm: 20 }] };
    for (const response of [
      await POST(request("POST", partial), context),
      await PUT(request("PUT", { input: partial, expectedDraftVersion: null }), context),
    ]) {
      expect(response.status).toBe(400);
      expect((await response.json()).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ message: "Enter length, width and height together, or leave all three blank." }),
      ]));
    }
    expect(mocks.order).not.toHaveBeenCalled();
  });
  it("blocks direct preparation requests for new paid orders until confirmation is saved", async () => {
    order.status = "NEW";
    order.paymentStatus = "PAID";
    order.paymentMethod = "WHISH";
    order.whishPayment = { state: "VERIFIED" };
    const body = await (await GET(request("GET"), context)).json();
    expect(body.orderTotalCents).toBe(900);
    expect(body.collection.problems).toContain("Confirm and save this order before preparing its Aramex delivery.");
    const denied = await POST(request("POST", input()), context);
    expect(denied.status).toBe(409);
    expect((await denied.json()).error).toContain("Confirm and save");
    order.status = "CONFIRMED";
    const allowed = await POST(request("POST", input()), context);
    expect(allowed.status).toBe(200);
    expect(await allowed.json()).toMatchObject({ orderTotalCents: 900, collection: { amountCents: 0 } });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("rejects stale orders and checks current payment state", async () => {
    const stale = input();
    order.updatedAt = new Date("2026-10-21T10:00:00.000Z");
    expect((await POST(request("POST", stale), context)).status).toBe(409);
    order.paymentStatus = "REFUNDED";
    expect((await POST(request("POST", input()), context)).status).toBe(409);
  });
  it("returns field issues without reflecting invalid data", async () => {
    const response = await POST(request("POST", { ...input(), city: "private-invalid-city".repeat(10) }), context);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.issues).toContainEqual(expect.objectContaining({ field: "city" }));
    expect(JSON.stringify(body)).not.toContain("private-invalid-city");
  });
  it("handles malformed and oversized request bodies", async () => {
    const headers = { "Content-Type": "application/json", "x-test-admin": "yes" };
    for (const [body, status] of [["{broken", 400], ["x".repeat(32769), 413]] as const) {
      const response = await POST(new NextRequest("http://localhost", { method: "POST", headers, body }), context);
      expect(response.status).toBe(status);
    }
    expect(mocks.order).not.toHaveBeenCalled();
  });
  it("handles missing orders and hides database error details", async () => {
    mocks.order.mockResolvedValueOnce(null);
    expect((await GET(request("GET"), context)).status).toBe(404);
    mocks.order.mockResolvedValueOnce(null);
    expect((await POST(request("POST", input()), context)).status).toBe(404);
    mocks.order.mockRejectedValueOnce(Error("private connection credential"));
    const response = await GET(request("GET"), context);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("credential");
  });
});
