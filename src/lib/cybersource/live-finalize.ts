import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { lockOrder } from '@/lib/book-orders/whish-server';
import { lock } from '@/lib/ebooks/server';

// NOT wired to a route or checkout. A future server-side production verifier
// must populate this separate ledger after binding its response to the saved
// merchant/reference/amount/currency. Browser callbacks are never proof.
type LiveAttempt = {
  id: string; bookOrderId: string | null; ebookOrderId: string | null;
  orderReference: string; merchantId: string; amountCents: number; currency: string;
  environment: string; state: string; transactionId: string | null; verifiedAt: Date | null;
  reviewReason: string | null;
};
const snapshotSchema = z.object({
  provider: z.literal('CYBERSOURCE'), environment: z.literal('PRODUCTION'), testMode: z.literal(false),
  merchantId: z.string().min(1), amountCents: z.number().int().positive(), currency: z.literal('USD'),
  stockReservation: z.enum(['HELD', 'NOT_REQUIRED']).optional(),
});
type Outcome = { state: 'DISABLED' | 'PENDING' | 'APPLIED' | 'REVIEW_REQUIRED'; reason?: string };

async function event(tx: Prisma.TransactionClient, attemptId: string, name: string) {
  await tx.$executeRaw`INSERT INTO "CardPaymentOutbox" ("id", "attemptId", "event") VALUES (${randomUUID()}, ${attemptId}, ${name}) ON CONFLICT ("attemptId", "event") DO NOTHING`;
}

export async function finalizeLiveCapture(db: Pick<PrismaClient, '$transaction'>, attemptId: string): Promise<Outcome> {
  // A configuration flag alone cannot enable live checkout: there is no live
  // session creation, verification or public route in this preparation step.
  if (process.env.CYBERSOURCE_LIVE_FULFILLMENT_ENABLED !== 'true') return { state: 'DISABLED' };
  return db.$transaction(async tx => {
    const attempt = (await tx.$queryRaw<LiveAttempt[]>`SELECT * FROM "CybersourceLiveAttempt" WHERE "id" = ${attemptId} FOR UPDATE`)[0];
    if (!attempt || attempt.environment !== 'PRODUCTION' || attempt.currency !== 'USD'
      || !attempt.transactionId || !attempt.verifiedAt || !['VERIFIED_CAPTURE', 'APPLIED', 'REVIEW_REQUIRED'].includes(attempt.state)) return { state: 'PENDING' };
    // Replays must not reset fulfilment, revoke/refund state or ebook access.
    if (attempt.state === 'APPLIED') return { state: 'APPLIED' };
    if (attempt.state === 'REVIEW_REQUIRED') return { state: 'REVIEW_REQUIRED', reason: attempt.reviewReason || 'REVIEW_REQUIRED' };
    const review = async (reason: string): Promise<Outcome> => {
      await tx.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "state" = 'REVIEW_REQUIRED', "reviewReason" = ${reason}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${attempt.id}`;
      await event(tx, attempt.id, 'PAYMENT_REVIEW_REQUIRED');
      return { state: 'REVIEW_REQUIRED', reason };
    };
    const matches = (raw: unknown) => {
      const parsed = snapshotSchema.safeParse(raw);
      return parsed.success && parsed.data.merchantId === attempt.merchantId && parsed.data.amountCents === attempt.amountCents ? parsed.data : null;
    };
    const verifiedReference = 'CYBS-LIVE-' + attempt.transactionId;
    const details = { attemptId: attempt.id, transactionId: attempt.transactionId, environment: 'PRODUCTION' };
    if (attempt.bookOrderId && !attempt.ebookOrderId) {
      await lockOrder(tx, attempt.bookOrderId);
      const payment = await tx.bookWhishPayment.findUnique({ where: { orderId: attempt.bookOrderId }, include: { order: { include: { items: true } } } });
      if (!payment) return review('ORDER_NOT_FOUND');
      const order = payment.order, snapshot = matches(payment.snapshot);
      if (!snapshot || order.reference.startsWith('LEE-TEST-') || order.paymentMethod !== 'BANK_AUDI') return review('NOT_LIVE_CARD_ORDER');
      if (order.reference !== attempt.orderReference || order.priceCents !== attempt.amountCents || order.currency !== attempt.currency) return review('ORDER_CHANGED');
      if (order.status !== 'NEW' || order.paymentStatus !== 'PENDING'
        || !['AWAITING_PAYMENT', 'CHANGES_REQUESTED'].includes(payment.state)) return review('ORDER_NOT_PAYABLE');
      // Expiry/cancellation may have released stock. Never silently re-reserve
      // or ship a late payment; keep its verified capture for manual resolution.
      if (payment.expiresAt.getTime() <= Date.now()) return review('RESERVATION_EXPIRED');
      if (order.selectionMode === 'CUSTOM' && (snapshot.stockReservation !== 'HELD'
        || order.items.length !== order.requestedBookCount || order.items.some(i => !i.editionId))) return review('RESERVATION_NOT_CONFIRMED');
      if (order.selectionMode === 'LEE_CHOICE' && snapshot.stockReservation !== 'NOT_REQUIRED') return review('RESERVATION_NOT_CONFIRMED');
      await tx.bookWhishPayment.update({ where: { id: payment.id }, data: {
        state: 'VERIFIED', verifiedReference, reviewedAt: new Date(), reviewedBy: 'cybersource-live',
        customerNote: 'Card payment verified.',
        events: { create: { action: 'CARD_PAYMENT_CAPTURED', actor: 'cybersource-live', details } },
      } });
      // Inventory was reserved at order creation. Do not decrement it again.
      await tx.bookOrder.update({ where: { id: order.id }, data: { paymentStatus: 'PAID', status: 'CONFIRMED', isRead: false } });
    } else if (attempt.ebookOrderId && !attempt.bookOrderId) {
      const initial = await tx.ebookOrder.findUnique({ where: { id: attempt.ebookOrderId } });
      if (!initial) return review('ORDER_NOT_FOUND');
      await lock(tx, 'ebook-checkout:' + initial.readerId + ':' + initial.ebookId);
      await lock(tx, 'ebook-order:' + initial.id);
      const order = await tx.ebookOrder.findUniqueOrThrow({ where: { id: initial.id } });
      if (!matches(order.snapshot) || order.reference.startsWith('EB-TEST-') || order.method !== 'BANK_AUDI') return review('NOT_LIVE_CARD_ORDER');
      if (order.reference !== attempt.orderReference || order.priceCents !== attempt.amountCents) return review('ORDER_CHANGED');
      if (!['AWAITING_PAYMENT', 'CHANGES_REQUESTED'].includes(order.state)) return review('ORDER_NOT_PAYABLE');
      const [paid, access] = await Promise.all([
        tx.ebookOrder.findFirst({ where: { readerId: order.readerId, ebookId: order.ebookId, state: 'VERIFIED', id: { not: order.id } }, select: { id: true } }),
        tx.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId: order.readerId, ebookId: order.ebookId } }, select: { id: true, active: true, orderId: true } }),
      ]);
      if (paid || access?.active && access.orderId !== order.id) return review('DUPLICATE_PURCHASE');
      await tx.ebookOrder.update({ where: { id: order.id }, data: {
        state: 'VERIFIED', verifiedReference, customerNote: 'Card payment verified.',
        events: { create: { action: 'CARD_PAYMENT_CAPTURED', actor: 'cybersource-live', details } },
      } });
      await tx.ebookAccess.upsert({ where: { readerId_ebookId: { readerId: order.readerId, ebookId: order.ebookId } },
        create: { readerId: order.readerId, ebookId: order.ebookId, orderId: order.id }, update: { orderId: order.id, active: true } });
    } else return review('INVALID_ORDER_BINDING');
    // Committed together: a worker can later deliver email even if the browser
    // has closed. No email/network I/O is performed in this transaction.
    await event(tx, attempt.id, 'PAYMENT_CONFIRMED');
    await tx.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "state" = 'APPLIED', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${attempt.id}`;
    return { state: 'APPLIED' };
  });
}
