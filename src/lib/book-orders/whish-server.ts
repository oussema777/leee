import { createHash } from "node:crypto";
import { Prisma, type BookWhishPayment, type BookOrder } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { accessTokenSchema, shouldExpire } from "./whish-policy";
import { emptyWhishConfig, parseWhishConfig, snapshotActive, type WhishSnapshot } from "./whish-config";

export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
export function privateJson(value: unknown, status = 200) { return NextResponse.json(value, { status, headers: PRIVATE_HEADERS }); }
export function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function requestHash(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
export function paymentPath(locale: string, reference: string, token: string) {
  return "/" + (locale === "ar" ? "ar" : "en") + "/books/payment/" + encodeURIComponent(reference) + "#" + token;
}
export async function getWhishConfig() {
  try {
    const row = await db.bookWhishSettings.findUnique({ where: { id: "book-restore" } });
    return parseWhishConfig(row?.config);
  } catch (e) {
    // Fail closed until the additive schema patch has been applied.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021")) console.error("Whish setup unavailable");
    return emptyWhishConfig();
  }
}
export async function withPaymentAdmin(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth;
  const user = await db.user.findUnique({ where: { id: auth.session.userId }, select: { id: true, role: true } });
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) return { error: errorResponse("Payment administration requires an admin role", 403) };
  return { session: auth.session };
}
export async function authenticatePayment(request: NextRequest, reference: string) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!accessTokenSchema.safeParse(token).success) return null;
  return db.bookWhishPayment.findFirst({
    where: { accessTokenHash: tokenHash(token), order: { reference } }, include: { order: true },
  });
}
export async function lockOrder(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "BookOrder" WHERE "id" = ${id} FOR UPDATE`);
}
export async function releaseOrderStock(tx: Prisma.TransactionClient, order: { id: string; selectionMode: string }) {
  if (order.selectionMode !== "CUSTOM") return;
  const items = await tx.bookOrderItem.findMany({ where: { orderId: order.id }, orderBy: { inventoryItemId: "asc" }, select: { inventoryItemId: true, editionId: true } });
  for (const item of items) {
    // Do not make an item that staff deliberately withdrew available again.
    await tx.bookInventoryItem.update({ where: { id: item.inventoryItemId }, data: { stockQuantity: { increment: 1 } } });
    if (item.editionId) await tx.bookInventoryEdition.update({ where: { id: item.editionId }, data: { stockQuantity: { increment: 1 } } });
    await tx.bookInventoryItem.updateMany({ where: { id: item.inventoryItemId, status: "RESERVED" }, data: { status: "AVAILABLE" } });
  }
}
export async function expireLockedPayment(tx: Prisma.TransactionClient, p: BookWhishPayment & { order: BookOrder }, now = new Date()) {
  if (!shouldExpire(p.state, p.expiresAt, now) || p.order.paymentStatus === "PAID") return false;
  if (p.order.status !== "CANCELLED") {
    if (p.order.status !== "NEW") return false;
    await releaseOrderStock(tx, p.order);
    await tx.bookOrder.update({ where: { id: p.orderId }, data: { status: "CANCELLED", paymentStatus: "CANCELLED" } });
  }
  await tx.bookWhishPayment.update({ where: { id: p.id }, data: {
    state: "EXPIRED",
    events: { create: { action: "EXPIRED", actor: "system", details: {} } },
  } });
  return true;
}
export async function expireWhishPayments() {
  try {
    const candidates = await db.bookWhishPayment.findMany({
      where: { state: { in: ["AWAITING_PAYMENT", "CHANGES_REQUESTED"] }, expiresAt: { lte: new Date() } },
      select: { id: true, orderId: true }, orderBy: { expiresAt: "asc" }, take: 50,
    });
    let expired = 0;
    for (const candidate of candidates) {
      expired += await db.$transaction(async tx => {
        await lockOrder(tx, candidate.orderId);
        const p = await tx.bookWhishPayment.findUnique({ where: { id: candidate.id }, include: { order: true } });
        return p && await expireLockedPayment(tx, p) ? 1 : 0;
      });
    }
    return expired;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") return 0;
    throw e;
  }
}
export async function paymentSummary(p: BookWhishPayment & { order: BookOrder }) {
  const snapshot = p.snapshot as unknown as WhishSnapshot;
  const [config, items] = await Promise.all([
    getWhishConfig(),
    p.order.selectionMode === "LEE_CHOICE" ? Promise.resolve([]) : db.bookOrderItem.findMany({
      where: { orderId: p.orderId }, orderBy: { createdAt: "asc" },
      select: { isFreeExtra: true, edition: { select: { label: true, publicationYear: true, coverImageUrl: true } }, inventoryItem: { select: { id: true, title: true, titleAr: true, author: true, authorAr: true, coverImageUrl: true } } },
    }),
  ]);
  const payable = ["AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(p.state) &&
    p.order.status !== "CANCELLED" && p.expiresAt.getTime() > Date.now() && snapshotActive(config, snapshot);
  return {
    reference: p.order.reference, state: p.state, orderStatus: p.order.status,
    amountCents: p.order.priceCents, currency: p.order.currency,
    selectionMode: p.order.selectionMode,
    books: items.map(item => ({ ...item.inventoryItem, coverImageUrl: item.edition?.coverImageUrl || item.inventoryItem.coverImageUrl, editionLabel: item.edition?.label || null, editionYear: item.edition?.publicationYear || null, isFreeExtra: item.isFreeExtra })),
    bookCount: p.order.requestedBookCount, fulfillmentMethod: p.order.fulfillmentMethod,
    expiresAt: p.expiresAt.toISOString(), submittedAt: p.submittedAt?.toISOString() || null,
    customerNote: p.customerNote, submittedReference: p.submittedReference,
    supportPhone: config.supportPhone || snapshot.supportPhone,
    instructions: payable ? snapshot : null,
  };
}
