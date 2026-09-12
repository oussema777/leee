import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { emptyWhishConfig } from "./whish-config";
import { tokenHash } from "./whish-server";
import { GET, POST } from "@/app/api/public/book-orders/[reference]/payment/route";
import { POST as review } from "@/app/api/admin/book-orders/[id]/whish/route";
import { PUT as saveSetup } from "@/app/api/admin/book-whish/route";
import { PATCH as editOrder } from "@/app/api/admin/book-orders/[id]/route";

const mocks = vi.hoisted(() => {
  const fn = () => vi.fn();
  return { db: {
    user: { findUnique: fn() }, $transaction: fn(), $queryRaw: fn(),
    bookWhishSettings: { findUnique: fn(), updateMany: fn(), findUniqueOrThrow: fn(), create: fn() },
    bookWhishPayment: { findFirst: fn(), findUnique: fn(), findUniqueOrThrow: fn(), update: fn() },
    bookOrder: { update: fn(), findUnique: fn() },
    bookOrderItem: { findMany: fn() },
    bookInventoryItem: { update: fn(), updateMany: fn() },
  } };
});
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => true, clientIp: () => "test" }));
vi.mock("@/lib/api-utils", async () => {
  const { NextResponse } = await import("next/server");
  return {
    withAdmin: async () => ({ session: { userId: "admin-1", role: "ADMIN", email: "admin@example.test" } }),
    errorResponse: (error: string, status = 500) => NextResponse.json({ error }, { status }),
  };
});
vi.mock("@/lib/email", () => ({ renderNotification: () => "test", sendNotificationEmail: vi.fn(), sendTransactionalEmail: vi.fn() }));

const access = "cd".repeat(32);
let payment: any;
const context = { params: Promise.resolve({ reference: "LEE-BK-2026-12345678" }) };
const adminContext = { params: Promise.resolve({ id: "order-1" }) };
function request(method: string, body?: unknown, token = access) {
  return new NextRequest("http://localhost/api/public/book-orders/LEE-BK-2026-12345678/payment", {
    method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  payment = {
    id: "payment-1", orderId: "order-1", state: "AWAITING_PAYMENT",
    accessTokenHash: tokenHash(access), requestHash: "request-hash",
    snapshot: { amountCents: 500, currency: "USD", accountName: "Test LEE", accountNumber: "70123456", supportPhone: "96170123456", imageUrl: "/payments/whish/usd-5.jpeg", paymentUrl: "https://whish.money/pay/e0vYXCNFW", qrExpiresAt: null },
    expiresAt: new Date(Date.now() + 86400000), updatedAt: new Date("2026-01-01T00:00:00Z"),
    submittedReference: null, submittedAt: null, senderPhone: null, verifiedReference: null, customerNote: null,
    order: { id: "order-1", reference: "LEE-BK-2026-12345678", locale: "en", priceCents: 500, currency: "USD",
      requestedBookCount: 1, fulfillmentMethod: "PICKUP", selectionMode: "CUSTOM", status: "NEW",
      paymentStatus: "PENDING", paymentMethod: "WHISH", updatedAt: new Date("2026-01-01T00:00:00Z"),
      customerName: "Private purchaser", detailedAddress: "Private address", recipientName: "Private recipient" },
  };
  mocks.db.$transaction.mockImplementation(async callback => callback(mocks.db));
  mocks.db.$queryRaw.mockResolvedValue([]);
  mocks.db.user.findUnique.mockResolvedValue({ id: "admin-1", role: "ADMIN" });
  mocks.db.bookWhishSettings.findUnique.mockResolvedValue({ config: emptyWhishConfig() });
  mocks.db.bookWhishPayment.findFirst.mockImplementation(async ({ where }) => where.accessTokenHash === payment.accessTokenHash ? payment : null);
  mocks.db.bookWhishPayment.findUnique.mockImplementation(async () => payment);
  mocks.db.bookWhishPayment.findUniqueOrThrow.mockImplementation(async () => payment);
  mocks.db.bookWhishPayment.update.mockImplementation(async ({ data }) => {
    const { events, ...fields } = data; void events;
    payment = { ...payment, ...fields, updatedAt: new Date(payment.updatedAt.getTime() + 1) };
    return payment;
  });
  mocks.db.bookOrder.findUnique.mockImplementation(async () => ({ ...payment.order, whishPayment: payment, items: [] }));
  mocks.db.bookOrder.update.mockImplementation(async ({ data }) => { payment.order = { ...payment.order, ...data }; return payment.order; });
  mocks.db.bookOrderItem.findMany.mockResolvedValue([{ inventoryItemId: "book-1" }]);
  mocks.db.bookInventoryItem.update.mockResolvedValue({});
  mocks.db.bookInventoryItem.updateMany.mockResolvedValue({ count: 1 });
});

describe("private Whish payment routes", () => {
  it("returns an order-scoped book recap without exposing customer details", async () => {
    mocks.db.bookOrderItem.findMany.mockResolvedValueOnce([{ isFreeExtra: true, inventoryItem: { id: "book-1", title: "A new chapter", titleAr: "فصل جديد", author: "Writer", authorAr: "كاتب", coverImageUrl: "/book.jpg" } }]);
    const response = await GET(request("GET"), context);
    const body = await response.json();
    expect(body.books).toEqual([{ id: "book-1", title: "A new chapter", titleAr: "فصل جديد", author: "Writer", authorAr: "كاتب", coverImageUrl: "/book.jpg", isFreeExtra: true }]);
    expect(mocks.db.bookOrderItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { orderId: "order-1" }, select: { isFreeExtra: true, inventoryItem: { select: { id: true, title: true, titleAr: true, author: true, authorAr: true, coverImageUrl: true } } } }));
    expect(body).not.toHaveProperty("customerPhone");
  });
  it("does not present a seed book as the final selection when LEE chooses", async () => {
    payment.order.selectionMode = "LEE_CHOICE";
    const response = await GET(request("GET"), context); const body = await response.json();
    expect(body.selectionMode).toBe("LEE_CHOICE"); expect(body.books).toEqual([]);
    expect(mocks.db.bookOrderItem.findMany).not.toHaveBeenCalled();
  });

  it("rejects an incorrect access token without touching payment or inventory", async () => {
    expect((await GET(request("GET", undefined, "ab".repeat(32)), context)).status).toBe(404);
    expect(mocks.db.bookWhishPayment.update).not.toHaveBeenCalled();
    expect(mocks.db.bookInventoryItem.update).not.toHaveBeenCalled();
  });
  it("returns no purchaser, gift-recipient, address or access-token fields", async () => {
    const response = await GET(request("GET"), context); const body = await response.json();
    expect(body.reference).toBe(payment.order.reference);
    for (const key of ["customerName", "recipientName", "detailedAddress", "accessTokenHash", "requestHash", "order"]) expect(body).not.toHaveProperty(key);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("a customer-paid assertion only submits for review, never confirms funds", async () => {
    const response = await POST(request("POST", { transactionReference: "TX-123", senderPhone: "70123456", paid: true, paymentStatus: "PAID" }), context);
    expect(response.status).toBe(200);
    expect(payment.state).toBe("UNDER_REVIEW");
    expect(payment.order.paymentStatus).toBe("PENDING");
  });
  it("handles a repeated report idempotently and prevents changing it during review", async () => {
    const body = { transactionReference: "TX-123", senderPhone: "70123456" };
    await POST(request("POST", body), context);
    const writes = mocks.db.bookWhishPayment.update.mock.calls.length;
    expect((await POST(request("POST", body), context)).status).toBe(200);
    expect(mocks.db.bookWhishPayment.update.mock.calls.length).toBe(writes);
    expect((await POST(request("POST", { ...body, transactionReference: "TX-999" }), context)).status).toBe(409);
  });
  it("expires and releases an unpaid reservation exactly once across repeated reads", async () => {
    payment.expiresAt = new Date("2000-01-01");
    await GET(request("GET"), context); await GET(request("GET"), context);
    expect(payment.state).toBe("EXPIRED");
    expect(payment.order.status).toBe("CANCELLED");
    expect(mocks.db.bookInventoryItem.update).toHaveBeenCalledTimes(1);
  });
  it("accepts a late receipt without reopening the cancelled order or re-reserving books", async () => {
    payment.expiresAt = new Date("2000-01-01");
    await POST(request("POST", { transactionReference: "TX-LATE", senderPhone: "70123456" }), context);
    expect(payment.state).toBe("UNDER_REVIEW");
    expect(payment.order.status).toBe("CANCELLED");
    expect(mocks.db.bookInventoryItem.update).toHaveBeenCalledTimes(1);
    await GET(request("GET"), context);
    expect(mocks.db.bookInventoryItem.update).toHaveBeenCalledTimes(1);
  });
});

describe("staff verification and fulfilment", () => {
  function reviewBody() {
    return { action: "VERIFY", expectedUpdatedAt: payment.updatedAt.toISOString(), transactionReference: "TX-123",
      receivedAmountCents: 500, currency: "USD", checkedWallet: true, note: "" };
  }
  it("rejects editors and stale reviews", async () => {
    payment.state = "UNDER_REVIEW";
    mocks.db.user.findUnique.mockResolvedValueOnce({ id: "editor", role: "EDITOR" });
    expect((await review(request("POST", reviewBody()), adminContext)).status).toBe(403);
    expect((await review(request("POST", { ...reviewBody(), expectedUpdatedAt: "2000-01-01T00:00:00.000Z" }), adminContext)).status).toBe(409);
    expect(mocks.db.bookWhishPayment.update).not.toHaveBeenCalled();
  });
  it("confirms only after a matching wallet check and persists a normalized transaction reference", async () => {
    payment.state = "UNDER_REVIEW";
    expect((await review(request("POST", { ...reviewBody(), receivedAmountCents: 400 }), adminContext)).status).toBe(400);
    expect((await review(request("POST", reviewBody()), adminContext)).status).toBe(200);
    expect(payment.state).toBe("VERIFIED");
    expect(payment.verifiedReference).toBe("TX-123");
    expect(payment.order.paymentStatus).toBe("PAID");
  });
  it("reports a duplicate confirmed wallet reference as a conflict", async () => {
    payment.state = "UNDER_REVIEW";
    mocks.db.bookWhishPayment.update.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("Duplicate", { code: "P2002", clientVersion: "6.19.2" }));
    expect((await review(request("POST", reviewBody()), adminContext)).status).toBe(409);
    expect(mocks.db.bookOrder.update).not.toHaveBeenCalled();
  });
  it("blocks the generic editor from marking paid or fulfilling unverified orders", async () => {
    const body = { status: "NEW", paymentStatus: "PAID", expectedUpdatedAt: payment.order.updatedAt.toISOString() };
    expect((await editOrder(request("PATCH", body), adminContext)).status).toBe(409);
    expect((await editOrder(request("PATCH", { ...body, status: "READY", paymentStatus: "PENDING" }), adminContext)).status).toBe(409);
    expect(mocks.db.bookOrder.update).not.toHaveBeenCalled();
  });
});

describe("Whish settings updates", () => {
  it("rejects stale setup and changed recipients carrying old QR verification", async () => {
    const config = emptyWhishConfig();
    config.accountName = "Test LEE"; config.accountNumber = "70123456";
    config.qrCodes = config.qrCodes.map(q => ({ ...q, verified: true, reusable: true, expiryConfirmed: true }));
    const version = "2026-01-01T00:00:00.000Z";
    mocks.db.bookWhishSettings.findUnique.mockResolvedValue({ id: "book-restore", config, updatedAt: new Date(version) });
    expect((await saveSetup(request("PUT", { ...config, version: null }))).status).toBe(409);
    expect((await saveSetup(request("PUT", { ...config, accountNumber: "70999999", version }))).status).toBe(409);
    expect(mocks.db.bookWhishSettings.updateMany).not.toHaveBeenCalled();
  });
  it("rejects enabling unverified QRs and a concurrent setup overwrite", async () => {
    const config = emptyWhishConfig(); const version = "2026-01-01T00:00:00.000Z";
    mocks.db.bookWhishSettings.findUnique.mockResolvedValue({ id: "book-restore", config, updatedAt: new Date(version) });
    expect((await saveSetup(request("PUT", { ...config, enabled: true, version }))).status).toBe(400);
    mocks.db.bookWhishSettings.updateMany.mockResolvedValueOnce({ count: 0 });
    expect((await saveSetup(request("PUT", { ...config, version }))).status).toBe(409);
  });
});

describe("Whish review timing", () => {
  it("gives a customer a fresh correction window after a delayed review", async () => {
    payment.state = "UNDER_REVIEW"; payment.expiresAt = new Date("2000-01-01");
    const response = await review(request("POST", { action: "REQUEST_CORRECTION", expectedUpdatedAt: payment.updatedAt.toISOString(), note: "Please check the receipt reference." }), adminContext);
    expect(response.status).toBe(200); expect(payment.state).toBe("CHANGES_REQUESTED");
    expect(payment.expiresAt.getTime()).toBeGreaterThan(Date.now() + 23 * 3600000);
    expect(mocks.db.bookInventoryItem.update).not.toHaveBeenCalled();
  });
  it("records received money for a closed order without reopening or reserving it", async () => {
    payment.state = "UNDER_REVIEW"; payment.order.status = "CANCELLED";
    const response = await review(request("POST", { action: "VERIFY", expectedUpdatedAt: payment.updatedAt.toISOString(),
      transactionReference: "TX-LATE", receivedAmountCents: 500, currency: "USD", checkedWallet: true, note: "Contact LEE to resolve." }), adminContext);
    expect(response.status).toBe(200); expect(payment.order.status).toBe("CANCELLED");
    expect(payment.order.paymentStatus).toBe("PAID"); expect(mocks.db.bookInventoryItem.update).not.toHaveBeenCalled();
  });
});
