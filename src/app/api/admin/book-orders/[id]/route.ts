import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, withAdmin } from "@/lib/api-utils";
import { lockOrder, releaseOrderStock, withPaymentAdmin } from "@/lib/book-orders/whish-server";
import { canFulfilWhish } from "@/lib/book-orders/whish-policy";
import { adminPaymentSelect } from "@/lib/book-orders/admin-payment-select";
import { sendBookOrderCustomerEmail } from "@/lib/book-orders/customer-email";
const statuses = ["NEW", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"] as const;
const include = {
  items: { include: { edition: { select: { label: true, publicationYear: true, coverImageUrl: true } }, inventoryItem: { select: { id: true, slug: true, title: true, titleAr: true, author: true, coverImageUrl: true, sku: true } } } },
  whishPayment: { select: adminPaymentSelect },
} as const;
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request); if ("error" in auth) return auth.error!;
  const { id } = await params;
  try {
    const order = await db.bookOrder.update({ where: { id }, data: { isRead: true }, include });
    return NextResponse.json(order, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") return errorResponse("Order not found", 404);
    return errorResponse("Failed to load order");
  }
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request); if ("error" in auth) return auth.error!;
  const { id } = await params;
  try {
    const body = await request.json();
    const status = body.status as typeof statuses[number];
    const paymentStatus = body.paymentStatus as typeof paymentStatuses[number];
    const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 5000) : "";
    if (!statuses.includes(status)) return errorResponse("Invalid order status", 400);
    if (!paymentStatuses.includes(paymentStatus)) return errorResponse("Invalid payment status", 400);
    const paymentOrder = await db.bookWhishPayment.findUnique({ where: { orderId: id }, select: { id: true } });
    if (paymentOrder) { const finance = await withPaymentAdmin(request); if ("error" in finance) return finance.error!; }
    const result = await db.$transaction(async tx => {
      await lockOrder(tx, id);
      const current = await tx.bookOrder.findUnique({ where: { id }, include: { whishPayment: true, items: true } });
      if (!current) throw Error("NOT_FOUND");
      if (current.status === "CANCELLED" && status !== "CANCELLED") throw Error("CANCELLED_FINAL");
      if (current.paymentMethod === "WHISH") {
        if (body.expectedUpdatedAt !== current.updatedAt.toISOString()) throw Error("STALE");
        if (paymentStatus !== current.paymentStatus) throw Error("PAYMENT_REVIEW_REQUIRED");
        if (!["NEW", "CANCELLED"].includes(status) && !canFulfilWhish(current.whishPayment?.state, current.paymentStatus)) throw Error("PAYMENT_REQUIRED");
        if (status === "CANCELLED" && ["DISPATCHED", "COMPLETED"].includes(current.status)) throw Error("RETURN_REQUIRED");
      }
      let finalPaymentStatus = paymentStatus;
      if (status === "CANCELLED" && current.status !== "CANCELLED") {
        await releaseOrderStock(tx, current);
        const p = current.whishPayment;
        if (p) {
          const keepReview = ["UNDER_REVIEW", "VERIFIED", "REFUNDED"].includes(p.state);
          if (!keepReview) finalPaymentStatus = "CANCELLED";
          await tx.bookWhishPayment.update({ where: { id: p.id }, data: {
            ...(!keepReview ? { state: "CANCELLED" } : {}),
            events: { create: { action: "ORDER_CANCELLED", actor: auth.session.userId, details: { previousState: p.state } } },
          } });
        }
      }
      if (status === "COMPLETED" && current.status !== "COMPLETED" && current.selectionMode === "CUSTOM") {
        for (const item of [...current.items].sort((a, b) => a.inventoryItemId.localeCompare(b.inventoryItemId))) await tx.bookInventoryItem.updateMany({
          where: { id: item.inventoryItemId, stockQuantity: 0, status: "RESERVED" }, data: { status: "SOLD" },
        });
      }
      const updated = await tx.bookOrder.update({ where: { id }, data: { status, paymentStatus: finalPaymentStatus, adminNotes: adminNotes || null, isRead: true, reviewedAt: new Date() }, include });
      return { updated, previousStatus: current.status };
    });
    if (result.updated.customerEmail && result.previousStatus !== result.updated.status && result.updated.status !== "NEW") {
      await sendBookOrderCustomerEmail({
        to: result.updated.customerEmail,
        locale: result.updated.locale,
        reference: result.updated.reference,
        amountCents: result.updated.priceCents,
        fulfillmentMethod: result.updated.fulfillmentMethod,
        selectionMode: result.updated.selectionMode,
        requestedBookCount: result.updated.requestedBookCount,
        bookTitles: result.updated.selectionMode === "CUSTOM"
          ? result.updated.items.map(item => {
              const title = result.updated.locale === "ar" ? item.inventoryItem.titleAr || item.inventoryItem.title : item.inventoryItem.title;
              return `${title} — ${item.edition?.label || (result.updated.locale === "ar" ? "الطبعة القياسية" : "Standard edition")}${item.edition?.publicationYear ? ` (${item.edition.publicationYear})` : ""}`;
            })
          : [],
        status: result.updated.status,
      });
    }
    return NextResponse.json(result.updated);
  } catch (e) {
    const messages: Record<string, string> = {
      NOT_FOUND: "Order not found", CANCELLED_FINAL: "A cancelled order cannot be reopened.",
      STALE: "This order has changed. Reload before saving.",
      PAYMENT_REVIEW_REQUIRED: "Use the Whish payment review to confirm receipt or record a refund.",
      PAYMENT_REQUIRED: "Verify the Whish payment before confirming or fulfilling this order.",
      RETURN_REQUIRED: "Dispatched or completed books cannot be returned to inventory by cancelling. Arrange and record the physical return first.",
    };
    if (e instanceof Error && messages[e.message]) return errorResponse(messages[e.message], e.message === "NOT_FOUND" ? 404 : 409);
    console.error("Book order update failed");
    return errorResponse("Failed to update order");
  }
}
