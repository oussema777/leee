import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withPaymentAdmin, privateJson, PRIVATE_HEADERS } from "@/lib/book-orders/whish-server";
import { readWhishReceipt } from "@/lib/book-orders/whish-receipts";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error || privateJson({ error: "Payment administrator access required." }, 403);
    const { id } = await context.params;
    const eventId = request.nextUrl.searchParams.get("event");
    if (!eventId) return privateJson({ error: "Screenshot not found." }, 404);
    const event = await db.bookWhishEvent.findFirst({ where: { id: eventId, action: "SUBMITTED", payment: { orderId: id } } });
    const details = event?.details as Record<string, unknown> | null;
    const path = details?.receiptPath;
    if (!event || typeof path !== "string" || !path.startsWith(event.paymentId + "/") || path.includes("..")) return privateJson({ error: "Screenshot not found." }, 404);
    const receipt = await readWhishReceipt(path);
    return new NextResponse(receipt, { headers: { ...PRIVATE_HEADERS, "Content-Type": "image/webp", "Content-Disposition": 'inline; filename="payment-receipt.webp"', "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
  } catch { return privateJson({ error: "Could not load screenshot." }, 500); }
}
