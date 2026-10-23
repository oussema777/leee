import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  EbookError,
  endpoint,
  json,
  limited,
  lock,
  requireReader,
} from "@/lib/ebooks/server";
import { queueOrderEmail, drainEbookEmails } from "@/lib/ebooks/mail";
import {
  normalizedReference,
  paymentReportSchema,
} from "@/lib/book-orders/whish-policy";
import {
  receiptForm,
  prepareWhishReceipt,
} from "@/lib/book-orders/whish-receipts";
import { readPrivate, savePrivate } from "@/lib/ebooks/storage";
import { ebookPaymentSettings } from "@/lib/ebooks/payment-settings";
import { hasReadingAccess } from "@/lib/ebooks/reading-access";
import {
  snapshotActive,
  type WhishSnapshot,
} from "@/lib/book-orders/whish-config";
import {
  bankAudiSnapshotActive,
  type BankAudiSnapshot,
} from "@/lib/book-orders/bank-audi-config";
import { headers } from "@/lib/ebooks/server";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    const reader = await requireReader(request);
    const { id } = await params;
    const order = await db.ebookOrder.findFirst({
      where: { id, readerId: reader.id },
      include: { access: true },
    });
    if (!order) throw new EbookError("Order not found.", 404);
    if (request.nextUrl.searchParams.get("receipt") === "1") {
      if (!order.receiptPath) throw new EbookError("No receipt uploaded.", 404);
      return new Response(
        new Uint8Array(await readPrivate(order.receiptPath)),
        { headers: { ...headers, "Content-Type": "image/webp" } },
      );
    }
    const snapshot = order.snapshot as unknown as WhishSnapshot &
      BankAudiSnapshot & { testMode?: boolean };
    const settings = await ebookPaymentSettings();
    const active =
      order.method === "WHISH"
        ? snapshotActive(settings.whish, snapshot)
        : bankAudiSnapshotActive(settings.bank, snapshot);
    return json({
      id: order.id,
      reference: order.reference,
      ebookId: order.ebookId,
      title: order.title,
      state: order.state,
      priceCents: order.priceCents,
      method: order.method,
      testOrder: snapshot.testMode === true,
      testMode: settings.testMode,
      instructions:
        active &&
        ["AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(order.state)
          ? order.snapshot
          : null,
      canSubmit: order.method !== "BANK_AUDI" && ["AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(
        order.state,
      ),
      customerNote: order.customerNote,
      submittedReference: order.submittedReference,
      supportPhone: snapshot.supportPhone,
      hasReceipt: !!order.receiptPath,
      access: await hasReadingAccess(order.access ? { ...order.access, order } : null),
    });
  });
}
export async function POST(request: NextRequest, { params }: Context) {
  return endpoint(request, async () => {
    const reader = await requireReader(request);
    const { id } = await params;
    if (!(await limited("proof:" + reader.id, 20, 3600)))
      throw new EbookError("Too many submissions. Try again later.", 429);
    const order = await db.ebookOrder.findFirst({
      where: { id, readerId: reader.id },
    });
    if (!order) throw new EbookError("Order not found.", 404);
    if (order.method === "BANK_AUDI") throw new EbookError("Bank Audi transfers have been retired. Contact LEE about this existing order.", 410);
    const form = await receiptForm(request);
    const parsed = paymentReportSchema.shape.transactionReference.safeParse(
      form.get("transactionReference"),
    );
    if (!parsed.success)
      throw new EbookError("Enter the payment transaction reference.");
    const file = form.get("receipt");
    let receiptPath: string | undefined;
    if (file instanceof File && file.size)
      receiptPath = await savePrivate(
        "receipts/" + id,
        await prepareWhishReceipt(file),
      );
    await db.$transaction(async (tx) => {
      await lock(tx, "ebook-order:" + id);
      const latest = await tx.ebookOrder.findUniqueOrThrow({ where: { id } });
      if (!["AWAITING_PAYMENT", "CHANGES_REQUESTED"].includes(latest.state))
        throw new EbookError(
          "This payment is already being reviewed or is closed.",
          409,
        );
      const updated = await tx.ebookOrder.update({
        where: { id },
        data: {
          state: "UNDER_REVIEW",
          submittedReference: normalizedReference(parsed.data),
          ...(receiptPath ? { receiptPath } : {}),
          events: {
            create: {
              actor: reader.id,
              action: "SUBMITTED",
              details: { reference: normalizedReference(parsed.data) },
            },
          },
        },
        include: { reader: true },
      });
      await queueOrderEmail(tx, updated, "PENDING");
    });
    await drainEbookEmails();
    return json({ success: true });
  });
}
