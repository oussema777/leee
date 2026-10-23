import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  body,
  EbookError,
  endpoint,
  headers,
  json,
  lock,
  requireEbookAdmin,
} from "@/lib/ebooks/server";
import { reviewSchema, reviewError } from "@/lib/ebooks/policy";
import { readPrivate } from "@/lib/ebooks/storage";
import { queueOrderEmail, drainEbookEmails } from "@/lib/ebooks/mail";
import { normalizedReference } from "@/lib/book-orders/whish-policy";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    await requireEbookAdmin(request);
    const { id } = await params;
    const order = await db.ebookOrder.findUnique({
      where: { id },
      include: {
        reader: true,
        access: true,
        events: { orderBy: { createdAt: "desc" } },
        emails: {
          select: {
            id: true,
            subject: true,
            sentAt: true,
            attempts: true,
            cancelled: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!order) throw new EbookError("Order not found.", 404);
    if (request.nextUrl.searchParams.get("receipt") === "1") {
      if (!order.receiptPath) throw new EbookError("No receipt uploaded.", 404);
      return new Response(
        new Uint8Array(await readPrivate(order.receiptPath)),
        { headers: { ...headers, "Content-Type": "image/webp" } },
      );
    }
    return json({
      ...order,
      receiptPath: undefined,
      hasReceipt: !!order.receiptPath,
    });
  });
}
export async function POST(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    const admin = await requireEbookAdmin(request);
    const { id } = await params;
    const parsed = reviewSchema.safeParse(await body(request));
    if (!parsed.success) throw new EbookError("Check the review details.");
    const input = parsed.data;
    await db.$transaction(async (tx) => {
      await lock(tx, "ebook-order:" + id);
      const order = await tx.ebookOrder.findUniqueOrThrow({
        where: { id },
        include: { reader: true, access: true },
      });
      if (order.updatedAt.toISOString() !== input.expectedUpdatedAt)
        throw new EbookError(
          "This order changed. Reload before reviewing.",
          409,
        );
      if (order.method === "BANK_AUDI") throw new EbookError("Manual Bank Audi payments are retired. This record is historical.", 410);
      const problem = reviewError(
        input,
        order.state,
        order.priceCents,
        order.access?.active,
      );
      if (problem) throw new EbookError(problem);
      let state = order.state;
      const reference = input.transactionReference
        ? normalizedReference(input.transactionReference)
        : undefined;
      if (input.action === "VERIFY") {
        await lock(
          tx,
          "ebook-checkout:" + order.readerId + ":" + order.ebookId,
        );
        const paid = await tx.ebookOrder.findFirst({
          where: {
            readerId: order.readerId,
            ebookId: order.ebookId,
            state: "VERIFIED",
          },
        });
        if (paid)
          throw new EbookError(
            "This reader already has a paid order for this ebook. Reconcile the duplicate payment before continuing.",
            409,
          );
        await lock(tx, "payment-reference:" + reference);
        const duplicate = await tx.bookWhishPayment.findFirst({
          where: { verifiedReference: reference },
        });
        const otherEbook = await tx.ebookOrder.findFirst({
          where: { verifiedReference: reference },
        });
        if (duplicate || otherEbook)
          throw new EbookError(
            "This payment reference has already been used for another order.",
            409,
          );
        state = "VERIFIED";
        await tx.ebookAccess.upsert({
          where: {
            readerId_ebookId: {
              readerId: order.readerId,
              ebookId: order.ebookId,
            },
          },
          create: {
            readerId: order.readerId,
            ebookId: order.ebookId,
            orderId: id,
          },
          update: { orderId: id, active: true },
        });
      }
      if (input.action === "REQUEST_CORRECTION") state = "CHANGES_REQUESTED";
      if (input.action === "REFUND") state = "REFUNDED";
      if (["REFUND", "REVOKE", "RESTORE"].includes(input.action))
        await tx.ebookAccess.updateMany({
          where: { orderId: id },
          data: { active: input.action === "RESTORE" },
        });
      const updated = await tx.ebookOrder.update({
        where: { id },
        data: {
          state,
          customerNote: input.note || order.customerNote,
          ...(input.action === "VERIFY"
            ? { verifiedReference: reference }
            : {}),
          updatedAt: new Date(),
          events: {
            create: {
              actor: admin.userId,
              action: input.action,
              details: {
                from: order.state,
                to: state,
                note: input.note,
                reference: reference || null,
                receivedAmountCents: input.receivedAmountCents || null,
              },
            },
          },
        },
        include: { reader: true },
      });
      await queueOrderEmail(
        tx,
        updated,
        input.action === "REQUEST_CORRECTION"
          ? "CORRECTION"
          : ["REFUND", "REVOKE"].includes(input.action)
            ? "REVOKED"
            : "ACCESS",
      );
    });
    await drainEbookEmails();
    return json({ success: true });
  });
}
