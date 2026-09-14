import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { emptyWhishConfig } from "./whish-config";
import { POST } from "@/app/api/public/book-orders/route";

const mocks = vi.hoisted(() => ({
  db: {
    $transaction: vi.fn(), $queryRaw: vi.fn(),
    bookWhishSettings: { findUnique: vi.fn() },
    bookWhishPayment: { findUnique: vi.fn(), findMany: vi.fn() },
    bookInventoryItem: { findMany: vi.fn(), updateMany: vi.fn() },
    bookInventoryEdition: { findMany: vi.fn(), updateMany: vi.fn() },
    bookOrder: { create: vi.fn() },
  },
  teamEmail: vi.fn(), customerEmail: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => true, clientIp: () => "test" }));
vi.mock("@/lib/email", () => ({
  renderNotification: () => "test", sendNotificationEmail: mocks.teamEmail,
  sendTransactionalEmail: mocks.customerEmail,
}));
const input = {
  locale: "en", package: "SINGLE", purpose: "SELF", selectionMode: "CUSTOM",
  selectedBookIds: ["book-1"], selectedEditions: [{ bookId: "book-1", editionId: "edition-1" }], customerName: "Test purchaser", customerPhone: "70123456",
  customerEmail: "test@example.test", fulfillmentMethod: "PICKUP", showSenderName: true,
  paymentMethod: "WHISH", termsAccepted: true, paymentAccessToken: "ab".repeat(32),
};
let saved: any = null;
function request(patch = {}) {
  return new NextRequest("https://forged-host.example/api/public/book-orders", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, ...patch }),
  });
}
beforeEach(() => {
  vi.clearAllMocks(); saved = null;
  const config = emptyWhishConfig();
  Object.assign(config, { enabled: true, accountName: "Test LEE", accountNumber: "70123456", supportPhone: "96170123456", qrImageUrl: "https://assets.example.test/whish.webp", qrVerified: true });
  mocks.db.bookWhishSettings.findUnique.mockResolvedValue({ config });
  mocks.db.bookWhishPayment.findUnique.mockImplementation(async () => saved);
  mocks.db.bookWhishPayment.findMany.mockResolvedValue([]);
  mocks.db.bookInventoryItem.findMany.mockResolvedValue([{ id: "book-1", title: "Test book", status: "AVAILABLE", stockQuantity: 1 }]);
  mocks.db.bookInventoryItem.updateMany.mockResolvedValue({ count: 1 });
  mocks.db.bookInventoryEdition.findMany.mockResolvedValue([{ id: "edition-1", inventoryItemId: "book-1", label: "2021 edition", publicationYear: 2021, stockQuantity: 1 }]);
  mocks.db.bookInventoryEdition.updateMany.mockResolvedValue({ count: 1 });
  mocks.db.$transaction.mockImplementation(async callback => callback(mocks.db));
  mocks.db.bookOrder.create.mockImplementation(async ({ data }) => {
    const order = { id: "order-1", reference: "LEE-BK-2026-TEST1234", locale: data.locale };
    if (data.whishPayment) saved = { ...data.whishPayment.create, order };
    return order;
  });
});
describe("Whish order creation", () => {
  it("uses the server-calculated pickup amount, stores hashes, and sends the private link only to the purchaser", async () => {
    const response = await POST(request({ priceCents: 1, paymentStatus: "PAID", recipientEmail: "recipient@example.test" }));
    expect(response.status).toBe(201);
    expect(saved.snapshot.amountCents).toBe(500);
    expect(saved.accessTokenHash).not.toBe(input.paymentAccessToken);
    const data = mocks.db.bookOrder.create.mock.calls[0][0].data;
    expect(data.priceCents).toBe(500); expect(data).not.toHaveProperty("paymentStatus");
    expect(data.items.create[0]).toMatchObject({ inventoryItemId: "book-1", editionId: "edition-1" });
    expect(mocks.db.bookInventoryEdition.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "edition-1", inventoryItemId: "book-1" }) }));
    const body = await response.json();
    expect(body.paymentUrl).toContain("#" + input.paymentAccessToken);
    expect(mocks.customerEmail).toHaveBeenCalledWith(expect.objectContaining({ to: input.customerEmail }));
    const email = mocks.customerEmail.mock.calls[0][0];
    expect(email.html).not.toContain("forged-host.example");
  });
  it("replays an identical order without reserving stock or emailing again; rejects a changed retry", async () => {
    const first = await POST(request()); const firstBody = await first.json();
    const second = await POST(request());
    expect(second.status).toBe(200); expect(await second.json()).toEqual(firstBody);
    expect(mocks.db.bookOrder.create).toHaveBeenCalledTimes(1);
    expect(mocks.db.bookInventoryItem.updateMany).toHaveBeenCalledTimes(2);
    expect(mocks.teamEmail).toHaveBeenCalledTimes(1);
    expect((await POST(request({ customerName: "Different purchaser" }))).status).toBe(409);
  });
  it("replays the winning order after a concurrent unique-token conflict", async () => {
    await POST(request());
    mocks.db.bookWhishPayment.findUnique.mockResolvedValueOnce(null);
    mocks.db.$transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("Duplicate token", { code: "P2002", clientVersion: "6.19.2" }));
    const response = await POST(request());
    expect(response.status).toBe(200); expect(mocks.db.bookOrder.create).toHaveBeenCalledTimes(1);
  });
  it("uses the permanent QR with the exact order total and rejects unverified setup", async () => {
    expect((await POST(request({ fulfillmentMethod: "DELIVERY", governorate: "BEIRUT", area: "Hamra", detailedAddress: "Test Street, building 4" }))).status).toBe(201);
    expect(saved.snapshot.amountCents).toBe(900); expect(saved.snapshot.imageUrl).toBe("https://assets.example.test/whish.webp");
    saved = null; mocks.db.bookWhishSettings.findUnique.mockResolvedValueOnce({ config: emptyWhishConfig() });
    expect((await POST(request())).status).toBe(409);
    expect(mocks.db.bookOrder.create).toHaveBeenCalledTimes(1);
  });
  it("keeps cash checkout working without verified Whish setup", async () => {
    mocks.db.bookWhishSettings.findUnique.mockResolvedValue({ config: emptyWhishConfig() });
    const response = await POST(request({ paymentMethod: "CASH_ON_DELIVERY", paymentAccessToken: undefined }));
    expect(response.status).toBe(201); expect(await response.json()).not.toHaveProperty("paymentUrl");
    expect(mocks.db.bookOrder.create.mock.calls[0][0].data).not.toHaveProperty("whishPayment");
    expect(mocks.customerEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: input.customerEmail,
      subject: expect.stringContaining("We received your book order"),
    }));
  });
  it("returns a stock conflict before exposing payment instructions", async () => {
    mocks.db.bookInventoryItem.updateMany.mockResolvedValueOnce({ count: 0 });
    const response = await POST(request());
    expect(response.status).toBe(409); expect(mocks.db.bookOrder.create).not.toHaveBeenCalled();
    expect(mocks.customerEmail).not.toHaveBeenCalled();
  });
  it("rejects an unavailable edition without reserving the parent book", async () => {
    mocks.db.bookInventoryEdition.updateMany.mockResolvedValueOnce({ count: 0 });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(mocks.db.bookInventoryItem.updateMany).not.toHaveBeenCalled();
    expect(mocks.db.bookOrder.create).not.toHaveBeenCalled();
  });
});
