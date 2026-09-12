import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWhishConfig, lockOrder, privateJson, withPaymentAdmin } from "@/lib/book-orders/whish-server";
import { normalizedReference, paymentReviewSchema, reviewProblem } from "@/lib/book-orders/whish-policy";
import { sendWhishOrderEmail } from "@/lib/book-orders/whish-email";
import { formatBookOrderSummary } from "@/lib/book-orders/customer-email";
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await withPaymentAdmin(request);
    if ("error" in auth) return auth.error!;
    const parsed = paymentReviewSchema.safeParse(await request.json());
    if (!parsed.success) return privateJson({ error: "Check the review details and refresh the order." }, 400);
    const input = parsed.data;
    const { id } = await params;
    const config = input.action === "REQUEST_CORRECTION" ? await getWhishConfig() : null;
    const order = await db.$transaction(async tx => {
      await lockOrder(tx, id);
      const p = await tx.bookWhishPayment.findUnique({
        where: { orderId: id },
        include: { order: { include: { items: { include: { inventoryItem: { select: { title: true, titleAr: true } } } } } } },
      });
      if (!p) throw Error("NOT_FOUND");
      if (p.updatedAt.toISOString() !== input.expectedUpdatedAt) throw Error("STALE_REVIEW");
      const problem = reviewProblem(input, p.state, p.order.priceCents);
      if (problem) throw Error("REVIEW:" + problem);
      const now = new Date();
      const state = input.action === "VERIFY" ? "VERIFIED" : input.action === "REFUND" ? "REFUNDED" : "CHANGES_REQUESTED";
      await tx.bookWhishPayment.update({
        where: { id: p.id }, data: {
          state, reviewedAt: now, reviewedBy: auth.session.userId,
          customerNote: input.note || null,
          ...(config && p.order.status !== "CANCELLED" ? { expiresAt: new Date(now.getTime() + config.holdHours * 3600000) } : {}),
          ...(input.action === "VERIFY" ? { verifiedReference: normalizedReference(input.transactionReference!) } : {}),
          events: { create: {
            action: input.action, actor: auth.session.userId,
            details: { from: p.state, to: state, reference: input.transactionReference || p.verifiedReference,
              receivedAmountCents: input.receivedAmountCents ?? null, currency: input.currency ?? null, note: input.note, orderWasClosed: p.order.status === "CANCELLED" },
          } },
        },
      });
      await tx.bookOrder.update({ where: { id }, data: {
        ...(input.action === "VERIFY" ? { paymentStatus: "PAID" } : input.action === "REFUND" ? { paymentStatus: "REFUNDED" } : {}),
        isRead: true, reviewedAt: now,
      } });
      return p.order;
    });
    if (order.customerEmail) await sendWhishOrderEmail({
      to: order.customerEmail, locale: order.locale, reference: order.reference,
      amountCents: order.priceCents, kind: input.action, note: input.note,
      orderClosed: order.status === "CANCELLED",
      bookSummary: formatBookOrderSummary({
        locale: order.locale, selectionMode: order.selectionMode,
        requestedBookCount: order.requestedBookCount,
        bookTitles: order.selectionMode === "CUSTOM"
          ? (order.items || []).map(item => order.locale === "ar" ? item.inventoryItem.titleAr || item.inventoryItem.title : item.inventoryItem.title)
          : [],
      }),
    });
    return privateJson({ success: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return privateJson({ error: "This Whish transaction has already been confirmed for another order. Check the wallet and both orders." }, 409);
    if (e instanceof Error && e.message === "NOT_FOUND") return privateJson({ error: "Whish payment not found." }, 404);
    if (e instanceof Error && e.message === "STALE_REVIEW") return privateJson({ error: "This payment changed while you were reviewing it. Reload the order." }, 409);
    if (e instanceof Error && e.message.startsWith("REVIEW:")) return privateJson({ error: e.message.slice(7) }, 400);
    return privateJson({ error: "Could not save the payment review." }, 500);
  }
}
