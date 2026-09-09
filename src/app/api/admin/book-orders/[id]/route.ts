import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, withAdmin } from "@/lib/api-utils";

const statuses = ["NEW", "CONFIRMED", "PREPARING", "READY", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
const paymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"] as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const order = await db.bookOrder.update({
      where: { id }, data: { isRead: true },
      include: { items: { include: { inventoryItem: { select: { id: true, slug: true, title: true, titleAr: true, author: true, coverImageUrl: true, sku: true } } } } },
    });
    return NextResponse.json(order);
  } catch (error: any) {
    if (error?.code === "P2025") return errorResponse("Order not found", 404);
    return errorResponse("Failed to load order");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json();
    const status = body.status as (typeof statuses)[number];
    const paymentStatus = body.paymentStatus as (typeof paymentStatuses)[number];
    const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 5_000) : "";
    if (!statuses.includes(status)) return errorResponse("Invalid order status", 400);
    if (!paymentStatuses.includes(paymentStatus)) return errorResponse("Invalid payment status", 400);

    const updated = await db.$transaction(async (transaction) => {
      const current = await transaction.bookOrder.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new Error("NOT_FOUND");
      if (current.status === "CANCELLED" && status !== "CANCELLED") throw new Error("CANCELLED_FINAL");

      if (status === "CANCELLED" && current.status !== "CANCELLED" && current.selectionMode === "CUSTOM") {
        for (const item of current.items) {
          await transaction.bookInventoryItem.update({ where: { id: item.inventoryItemId }, data: { stockQuantity: { increment: 1 }, status: "AVAILABLE" } });
        }
      }
      if (status === "COMPLETED" && current.status !== "COMPLETED" && current.selectionMode === "CUSTOM") {
        for (const item of current.items) {
          const inventory = await transaction.bookInventoryItem.findUnique({ where: { id: item.inventoryItemId }, select: { stockQuantity: true } });
          await transaction.bookInventoryItem.update({ where: { id: item.inventoryItemId }, data: { status: inventory && inventory.stockQuantity > 0 ? "AVAILABLE" : "SOLD" } });
        }
      }

      return transaction.bookOrder.update({
        where: { id }, data: { status, paymentStatus, adminNotes: adminNotes || null, isRead: true, reviewedAt: new Date() },
        include: { items: { include: { inventoryItem: true } } },
      });
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return errorResponse("Order not found", 404);
    if (error instanceof Error && error.message === "CANCELLED_FINAL") return errorResponse("A cancelled order cannot be reopened", 409);
    console.error("Book order update failed", error);
    return errorResponse("Failed to update order");
  }
}

