import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { paymentReportSchema, normalizedReference, canReportPayment } from "@/lib/book-orders/whish-policy";
import { authenticatePayment, expireLockedPayment, lockOrder, paymentSummary, privateJson } from "@/lib/book-orders/whish-server";
import { renderNotification, sendNotificationEmail } from "@/lib/email";

import { ReceiptError, receiptForm, prepareWhishReceipt, saveWhishReceipt, removeWhishReceipt } from "@/lib/book-orders/whish-receipts";

type Context = { params: Promise<{ reference: string }> };
export async function GET(request: NextRequest, context: Context) {
  if (!rateLimit("whish-read:" + clientIp(request), 120, 60000)) return privateJson({ error: "Please wait a moment before checking again." }, 429);
  try {
    const { reference } = await context.params;
    const authenticated = await authenticatePayment(request, reference);
    if (!authenticated) return privateJson({ error: "Payment page not found. Use the complete private link from checkout." }, 404);
    const payment = await db.$transaction(async tx => {
      await lockOrder(tx, authenticated.orderId);
      const current = await tx.bookWhishPayment.findUniqueOrThrow({ where: { id: authenticated.id }, include: { order: true } });
      await expireLockedPayment(tx, current);
      return tx.bookWhishPayment.findUniqueOrThrow({ where: { id: current.id }, include: { order: true } });
    });
    return privateJson(await paymentSummary(payment));
  } catch { return privateJson({ error: "Could not load your payment. Please try again." }, 500); }
}

export async function POST(request: NextRequest, context: Context) {
  let receiptPath: string | null = null;
  let receiptSaved = false;
  if (!rateLimit("whish-report:" + clientIp(request), 15, 3600000)) return privateJson({ error: "Too many attempts. Please contact LEE for help." }, 429);
  try {
    const { reference } = await context.params;
    const authenticated = await authenticatePayment(request, reference);
    if (!authenticated) return privateJson({ error: "Payment page not found." }, 404);
    const multipart = request.headers.get("content-type")?.startsWith("multipart/form-data");
    const form = multipart ? await receiptForm(request) : null;
    const parsed = paymentReportSchema.safeParse(form ? { transactionReference: form.get("transactionReference"), senderPhone: form.get("senderPhone") } : await request.json());
    if (!parsed.success) return privateJson({ error: parsed.error.issues[0]?.message || "Check your payment details." }, 400);
    const { transactionReference, senderPhone } = parsed.data;
    const receipt = form?.get("receipt");
    if (receipt && typeof receipt !== "string" && receipt.size > 0 && authenticated.state !== "UNDER_REVIEW" && canReportPayment(authenticated.state)) {
      const image = await prepareWhishReceipt(receipt);
      receiptPath = await saveWhishReceipt(authenticated.id, image);
    }
    const result = await db.$transaction(async tx => {
      await lockOrder(tx, authenticated.orderId);
      let p = await tx.bookWhishPayment.findUniqueOrThrow({ where: { id: authenticated.id }, include: { order: true } });
      await expireLockedPayment(tx, p);
      p = await tx.bookWhishPayment.findUniqueOrThrow({ where: { id: p.id }, include: { order: true } });
      if (!canReportPayment(p.state)) throw Error("PAYMENT_FINAL");
      if (p.state === "UNDER_REVIEW") {
        if (normalizedReference(p.submittedReference || "") === normalizedReference(transactionReference) && p.senderPhone === senderPhone) return { payment: p, changed: false };
        throw Error("REVIEW_PENDING");
      }
      const payment = await tx.bookWhishPayment.update({
        where: { id: p.id }, data: {
          state: "UNDER_REVIEW", submittedReference: transactionReference, senderPhone,
          submittedAt: new Date(), customerNote: null,
          events: { create: { action: "SUBMITTED", actor: "customer", details: { transactionReference, senderPhone, ...(receiptPath ? { receiptPath } : {}), orderWasClosed: p.order.status === "CANCELLED" } } },
        }, include: { order: true },
      });
      await tx.bookOrder.update({ where: { id: p.orderId }, data: { isRead: false } });
      return { payment, changed: true };
    });
    receiptSaved = result.changed && !!receiptPath;
    if (result.changed) await sendNotificationEmail({
      subject: "Whish payment to verify: " + reference,
      html: renderNotification("Whish payment awaiting verification", "Check the actual incoming wallet transaction before confirming this payment.", [
        { label: "Order", value: reference }, { label: "Amount", value: "USD " + result.payment.order.priceCents / 100 },
        { label: "Whish reference", value: transactionReference }, { label: "Sender phone", value: senderPhone },
        { label: "Order status", value: result.payment.order.status },
      ]),
    });
    return privateJson(await paymentSummary(result.payment));
  } catch (e) {
    if (e instanceof ReceiptError) return privateJson({ error: e.message }, 400);
    if (e instanceof Error && e.message === "PAYMENT_FINAL") return privateJson({ error: "This payment has already been reviewed. Refresh the page." }, 409);
    if (e instanceof Error && e.message === "REVIEW_PENDING") return privateJson({ error: "Your payment is already awaiting review. Please contact LEE to change its details." }, 409);
    return privateJson({ error: "Could not submit payment details. Please try again." }, 500);
  } finally {
    if (receiptPath && !receiptSaved) await removeWhishReceipt(receiptPath);
  }
}
