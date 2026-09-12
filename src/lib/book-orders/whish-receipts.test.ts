import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { POST } from "@/app/api/public/book-orders/[reference]/payment/route";
import { GET as getReceipt } from "@/app/api/admin/book-orders/[id]/whish/receipt/route";
import { prepareWhishReceipt, receiptForm, MAX_RECEIPT_BYTES, ReceiptError } from "./whish-receipts";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(), admin: vi.fn(), save: vi.fn(), remove: vi.fn(), read: vi.fn(),
  db: { $transaction: vi.fn(), bookWhishPayment: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    bookOrder: { update: vi.fn() }, bookWhishEvent: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => true, clientIp: () => "fixture" }));
vi.mock("@/lib/email", () => ({ renderNotification: () => "", sendNotificationEmail: vi.fn() }));
vi.mock("./whish-receipts", async original => ({ ...await original<typeof import("./whish-receipts")>(), saveWhishReceipt: mocks.save, removeWhishReceipt: mocks.remove, readWhishReceipt: mocks.read }));
vi.mock("./whish-server", () => ({
  authenticatePayment: mocks.authenticate, withPaymentAdmin: mocks.admin,
  expireLockedPayment: vi.fn(), lockOrder: vi.fn(), paymentSummary: (p: any) => ({ state: p.state }),
  privateJson: (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } }),
  PRIVATE_HEADERS: { "Cache-Control": "private, no-store" },
}));
let payment: any;
const context = { params: Promise.resolve({ reference: "LEE-BK-TEST" }) };
const adminContext = { params: Promise.resolve({ id: "order-1" }) };
async function imageFile() {
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#ffffff" } }).png().toBuffer();
  return new File([new Uint8Array(bytes)], "receipt.png", { type: "image/png" });
}
async function report() {
  const form = new FormData(); form.set("transactionReference", "TX-123"); form.set("senderPhone", "70123456"); form.set("receipt", await imageFile());
  return new NextRequest("http://localhost/api/public/book-orders/LEE-BK-TEST/payment", { method: "POST", body: form });
}
beforeEach(() => {
  vi.resetAllMocks();
  payment = { id: "payment-1", orderId: "order-1", state: "AWAITING_PAYMENT", submittedReference: null, senderPhone: null, order: { status: "NEW", priceCents: 500, paymentStatus: "PENDING" } };
  mocks.authenticate.mockImplementation(async () => payment);
  mocks.admin.mockResolvedValue({ session: { userId: "admin" } });
  mocks.db.$transaction.mockImplementation(async fn => fn(mocks.db));
  mocks.db.bookWhishPayment.findUniqueOrThrow.mockImplementation(async () => payment);
  mocks.db.bookWhishPayment.update.mockImplementation(async ({ data }) => ({ ...payment, ...data }));
  mocks.save.mockResolvedValue("payment-1/test.webp");
  mocks.read.mockResolvedValue(new Blob(["image"], { type: "image/webp" }));
});
describe("private payment screenshots", () => {
  it("re-encodes a real receipt and rejects a disguised non-image", async () => {
    const cleaned = await prepareWhishReceipt(await imageFile());
    expect((await sharp(cleaned).metadata()).format).toBe("webp");
    await expect(prepareWhishReceipt(new File(["<script>alert(1)</script>"], "receipt.png", { type: "image/png" }))).rejects.toBeInstanceOf(ReceiptError);
    await expect(prepareWhishReceipt(new File([new Uint8Array(MAX_RECEIPT_BYTES + 1)], "large.png", { type: "image/png" }))).rejects.toBeInstanceOf(ReceiptError);
  });
  it("bounds multipart bodies even without content-length", async () => {
    const request = new Request("http://localhost", { method: "POST", body: new Uint8Array(MAX_RECEIPT_BYTES + 65537), headers: { "Content-Type": "multipart/form-data; boundary=x" } });
    await expect(receiptForm(request)).rejects.toBeInstanceOf(ReceiptError);
  });
  it("rejects unauthenticated uploads before processing storage", async () => {
    mocks.authenticate.mockResolvedValue(null);
    expect((await POST(await report(), context)).status).toBe(404);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("attaches private proof to the audit event without confirming payment", async () => {
    const response = await POST(await report(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ state: "UNDER_REVIEW" });
    const write = mocks.db.bookWhishPayment.update.mock.calls[0][0].data;
    expect(write.events.create.details.receiptPath).toBe("payment-1/test.webp");
    expect(payment.order.paymentStatus).toBe("PENDING");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("keeps a failed upload retryable without changing the payment", async () => {
    mocks.save.mockRejectedValue(new ReceiptError("Upload failed"));
    expect((await POST(await report(), context)).status).toBe(400);
    expect(mocks.db.bookWhishPayment.update).not.toHaveBeenCalled();
  });
  it("removes newly uploaded proof if the transaction fails", async () => {
    mocks.db.$transaction.mockRejectedValue(new Error("Database unavailable"));
    expect((await POST(await report(), context)).status).toBe(500);
    expect(mocks.remove).toHaveBeenCalledWith("payment-1/test.webp");
  });
  it("does not upload duplicate proof when a submitted report is retried", async () => {
    payment.state = "UNDER_REVIEW"; payment.submittedReference = "TX-123"; payment.senderPhone = "70123456";
    expect((await POST(await report(), context)).status).toBe(200);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.db.bookWhishPayment.update).not.toHaveBeenCalled();
  });
  it("cleans up proof when another request submits first", async () => {
    mocks.db.bookWhishPayment.findUniqueOrThrow.mockImplementation(async () => ({ ...payment, state: "UNDER_REVIEW", submittedReference: "TX-123", senderPhone: "70123456" }));
    expect((await POST(await report(), context)).status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith("payment-1/test.webp");
  });
  it("restricts screenshot reads to payment administrators", async () => {
    mocks.admin.mockResolvedValue({ error: NextResponse.json({}, { status: 403 }) });
    expect((await getReceipt(new NextRequest("http://localhost/receipt?event=e"), adminContext)).status).toBe(403);
    expect(mocks.db.bookWhishEvent.findFirst).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("scopes receipt lookup to the requested order and rejects missing events", async () => {
    mocks.db.bookWhishEvent.findFirst.mockResolvedValue(null);
    expect((await getReceipt(new NextRequest("http://localhost/receipt?event=e"), adminContext)).status).toBe(404);
    expect(mocks.db.bookWhishEvent.findFirst).toHaveBeenCalledWith({ where: { id: "e", action: "SUBMITTED", payment: { orderId: "order-1" } } });
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("serves authorized proof without caching or exposing a public storage URL", async () => {
    mocks.db.bookWhishEvent.findFirst.mockResolvedValue({ paymentId: "payment-1", details: { receiptPath: "payment-1/test.webp" } });
    const response = await getReceipt(new NextRequest("http://localhost/receipt?event=e"), adminContext);
    expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(await response.text()).toBe("image");
  });
});
