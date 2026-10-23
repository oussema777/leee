import { Prisma, type PrismaClient } from '@prisma/client';
import { CheckoutError, type Attempt } from './checkout';
import { cardTestSnapshotSchema, isTestBookReference, isTestEbookReference } from './customer-policy';
import { lockOrder } from '@/lib/book-orders/whish-server';
import { lock } from '@/lib/ebooks/server';

// Only customer orders explicitly created for this TEST flow can be fulfilled.
// Admin diagnostic attempts on historical/real orders never qualify.
export async function finalizeCustomerTest(db: Pick<PrismaClient, '$transaction'>, attemptId: string) {
  return db.$transaction(async tx => {
    const attempt = (await tx.$queryRaw<Attempt[]>`SELECT * FROM "CybersourceTestAttempt" WHERE "id" = ${attemptId}`)[0];
    if (!attempt || attempt.environment !== 'TEST' || attempt.currency !== 'USD' || attempt.state !== 'TEST_CAPTURED' || !attempt.transactionId || !attempt.verifiedAt) return false;
    const verifiedReference = 'CYBS-TEST-' + attempt.transactionId;
    if (attempt.bookOrderId) {
      await lockOrder(tx, attempt.bookOrderId);
      const payment = await tx.bookWhishPayment.findUnique({ where: { orderId: attempt.bookOrderId }, include: { order: true } });
      const snapshot = cardTestSnapshotSchema.safeParse(payment?.snapshot);
      if (!payment || !snapshot.success || !isTestBookReference(payment.order.reference) || payment.order.paymentMethod !== 'BANK_AUDI') throw new CheckoutError('NOT_CUSTOMER_TEST');
      if (payment.order.reference !== attempt.orderReference || snapshot.data.amountCents !== attempt.amountCents) throw new CheckoutError('ORDER_CHANGED');
      if (payment.order.status === 'CANCELLED') throw new CheckoutError('ORDER_CANCELLED');
      if (payment.verifiedReference === verifiedReference && payment.state === 'VERIFIED') return true;
      if (payment.order.status !== 'NEW' || payment.order.paymentStatus !== 'PENDING' || !['AWAITING_PAYMENT', 'CHANGES_REQUESTED'].includes(payment.state) || payment.order.currency !== 'USD' || payment.order.priceCents !== attempt.amountCents || payment.expiresAt.getTime() <= Date.now()) throw new CheckoutError('ORDER_CHANGED');
      await tx.bookWhishPayment.update({ where: { id: payment.id }, data: { state: 'VERIFIED', verifiedReference, reviewedAt: new Date(), reviewedBy: 'cybersource-test', customerNote: 'TEST card payment completed. No real money collected. Do not ship this test order.', events: { create: { action: 'CARD_TEST_CAPTURED', actor: 'cybersource-test', details: { attemptId, transactionId: attempt.transactionId, environment: 'TEST' } } } } });
      await tx.bookOrder.update({ where: { id: attempt.bookOrderId }, data: { paymentStatus: 'PAID', isRead: false } });
      return true;
    }
    if (!attempt.ebookOrderId) return false;
    const initial = await tx.ebookOrder.findUniqueOrThrow({ where: { id: attempt.ebookOrderId } });
    await lock(tx, 'ebook-checkout:' + initial.readerId + ':' + initial.ebookId);
    await lock(tx, 'ebook-order:' + initial.id);
    const order = await tx.ebookOrder.findUniqueOrThrow({ where: { id: initial.id } });
    const snapshot = cardTestSnapshotSchema.safeParse(order.snapshot);
    if (!snapshot.success || !isTestEbookReference(order.reference) || order.method !== 'BANK_AUDI') throw new CheckoutError('NOT_CUSTOMER_TEST');
    if (order.reference !== attempt.orderReference || snapshot.data.amountCents !== attempt.amountCents) throw new CheckoutError('ORDER_CHANGED');
    if (order.state === 'VERIFIED' && order.verifiedReference === verifiedReference) return true;
    if (!['AWAITING_PAYMENT', 'CHANGES_REQUESTED'].includes(order.state) || order.priceCents !== attempt.amountCents) throw new CheckoutError('ORDER_CHANGED');
    const paid = await tx.ebookOrder.findFirst({ where: { readerId: order.readerId, ebookId: order.ebookId, state: 'VERIFIED' } });
    if (paid) throw new CheckoutError('DUPLICATE_PURCHASE');
    await tx.ebookOrder.update({ where: { id: order.id }, data: { state: 'VERIFIED', verifiedReference, customerNote: 'TEST card payment completed. No real money collected.', events: { create: { action: 'CARD_TEST_CAPTURED', actor: 'cybersource-test', details: { attemptId, transactionId: attempt.transactionId, environment: 'TEST' } as Prisma.InputJsonValue } } } });
    await tx.ebookAccess.upsert({ where: { readerId_ebookId: { readerId: order.readerId, ebookId: order.ebookId } }, create: { readerId: order.readerId, ebookId: order.ebookId, orderId: order.id }, update: { orderId: order.id, active: true } });
    return true;
  });
}
