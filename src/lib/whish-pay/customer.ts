import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { lock } from '@/lib/ebooks/server';
import { lockOrder } from '@/lib/book-orders/whish-server';
import { WhishError } from './client';
import { attemptSchema, prefix, initialAttempt, startAttempt, checkAttempt, summary } from './sandbox';
import { canRetryPayment, whishSnapshotSchema, type OrderContext } from './policy';

async function validateOrder(tx: Prisma.TransactionClient, context: OrderContext, forStart = false) {
  if (context.kind === 'BOOK') {
    await lockOrder(tx, context.orderId);
    const p = await tx.bookWhishPayment.findUnique({ where: { orderId: context.orderId }, include: { order: true } });
    const s = whishSnapshotSchema.safeParse(p?.snapshot);
    if (!p || !s.success || p.order.paymentMethod !== 'WHISH' || !p.order.reference.startsWith('LEE-TEST-WHISH-') || p.order.reference !== context.reference || p.order.currency !== 'USD' || p.order.priceCents !== context.amountCents || s.data.amountCents !== context.amountCents) throw new WhishError('ORDER_CHANGED');
    if (p.order.status === 'CANCELLED' || ['CANCELLED', 'EXPIRED', 'REFUNDED'].includes(p.state)) throw new WhishError('ORDER_CLOSED');
    if (forStart && (p.order.paymentStatus !== 'PENDING' || p.state !== 'AWAITING_PAYMENT' || p.expiresAt.getTime() <= Date.now())) throw new WhishError('ORDER_NOT_PAYABLE');
    return { book: p };
  }
  const initial = await tx.ebookOrder.findUniqueOrThrow({ where: { id: context.orderId } });
  await lock(tx, 'ebook-checkout:' + initial.readerId + ':' + initial.ebookId);
  await lock(tx, 'ebook-order:' + initial.id);
  const o = await tx.ebookOrder.findUniqueOrThrow({ where: { id: initial.id } });
  const s = whishSnapshotSchema.safeParse(o.snapshot);
  if (!s.success || o.method !== 'WHISH' || !o.reference.startsWith('EB-TEST-WHISH-') || o.reference !== context.reference || o.priceCents !== context.amountCents || s.data.amountCents !== context.amountCents) throw new WhishError('ORDER_CHANGED');
  if (!['AWAITING_PAYMENT', 'VERIFIED'].includes(o.state) || forStart && o.state !== 'AWAITING_PAYMENT') throw new WhishError('ORDER_CLOSED');
  return { ebook: o };
}
export async function finalizeWhishOrder(attemptId: string) {
  return db.$transaction(async tx => {
    const row = await tx.bookWhishSettings.findUnique({ where: { id: prefix + attemptId } });
    if (!row) return false;
    const attempt = attemptSchema.parse(row.config);
    if (!attempt.order || attempt.status !== 'success' || !attempt.checkedAt || attempt.request.currency !== 'USD' || attempt.request.amount !== (attempt.order.amountCents / 100).toFixed(2)) return false;
    const reference = attempt.request.externalId;
    const current = await validateOrder(tx, attempt.order);
    if (current.book) {
      const p = current.book;
      if (p.state === 'VERIFIED' && p.verifiedReference === reference) return true;
      if (p.state !== 'AWAITING_PAYMENT' || p.order.paymentStatus !== 'PENDING') throw new WhishError('PAYMENT_REVIEW_REQUIRED');
      await tx.bookWhishPayment.update({ where: { id: p.id }, data: { state: 'VERIFIED', verifiedReference: reference, reviewedBy: 'whish-sandbox', reviewedAt: new Date(), customerNote: 'Whish sandbox test confirmed. No real money collected. Do not ship.', events: { create: { action: 'WHISH_TEST_PAID', actor: 'whish-sandbox', details: { attemptId, externalId: reference, environment: 'SANDBOX' } } } } });
      await tx.bookOrder.update({ where: { id: p.orderId }, data: { paymentStatus: 'PAID', isRead: false } });
      return true;
    }
    const o = current.ebook!;
    if (o.state === 'VERIFIED' && o.verifiedReference === reference) return true;
    if (o.state !== 'AWAITING_PAYMENT') throw new WhishError('PAYMENT_REVIEW_REQUIRED');
    const access = await tx.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId: o.readerId, ebookId: o.ebookId } } });
    const paid = await tx.ebookOrder.findFirst({ where: { readerId: o.readerId, ebookId: o.ebookId, state: 'VERIFIED' } });
    if (paid || access?.active) throw new WhishError('DUPLICATE_PURCHASE');
    await tx.ebookOrder.update({ where: { id: o.id }, data: { state: 'VERIFIED', verifiedReference: reference, customerNote: 'Whish sandbox payment verified. No real money collected.', events: { create: { action: 'WHISH_TEST_PAID', actor: 'whish-sandbox', details: { attemptId, externalId: reference, environment: 'SANDBOX' } } } } });
    await tx.ebookAccess.upsert({ where: { readerId_ebookId: { readerId: o.readerId, ebookId: o.ebookId } }, create: { readerId: o.readerId, ebookId: o.ebookId, orderId: o.id }, update: { orderId: o.id, active: true } });
    return true;
  }, { timeout: 15000 });
}
export async function latestOrderAttempt(context: OrderContext) {
  const pointer = await db.bookWhishSettings.findUnique({ where: { id: 'whish-checkout:' + context.kind + ':' + context.orderId } });
  const id = (pointer?.config as { attemptId?: string } | null)?.attemptId;
  if (!id) return null;
  const row = await db.bookWhishSettings.findUniqueOrThrow({ where: { id: prefix + id } });
  const attempt = attemptSchema.parse(row.config);
  if (attempt.order?.kind !== context.kind || attempt.order.orderId !== context.orderId) throw new WhishError('ORDER_CHANGED');
  return attempt;
}
export async function orderCheckout(context: OrderContext, action: 'start' | 'check' | 'retry', actor: string) {
  const latest = await latestOrderAttempt(context);
  if (latest) {
    // A fresh provider check is required before offering a replacement link.
    if (latest.collectUrl || latest.status === 'success') await checkAttempt(latest.id);
    if (action === 'check') return { attempt: summary((await latestOrderAttempt(context))!) };
  } else if (action === 'check') return { attempt: null };
  const id = await db.$transaction(async tx => {
    await lock(tx, 'whish-checkout:' + context.kind + ':' + context.orderId);
    const pointerId = 'whish-checkout:' + context.kind + ':' + context.orderId;
    const pointer = await tx.bookWhishSettings.findUnique({ where: { id: pointerId } });
    const previousId = (pointer?.config as { attemptId?: string } | null)?.attemptId;
    if (previousId) {
      const saved = await tx.bookWhishSettings.findUniqueOrThrow({ where: { id: prefix + previousId } });
      const previous = attemptSchema.parse(saved.config);
      // A concurrent request already created a newer attempt: return that same one.
      if (previousId !== latest?.id || action !== 'retry' || !canRetryPayment(previous.status, previous.errorCode, previous.uncertain)) return previousId;
    }
    await validateOrder(tx, context, true);
    const nextId = randomUUID();
    await tx.bookWhishSettings.create({ data: { id: prefix + nextId, config: initialAttempt(nextId, actor, context), updatedBy: actor } });
    await tx.bookWhishSettings.upsert({ where: { id: pointerId }, create: { id: pointerId, config: { attemptId: nextId }, updatedBy: actor }, update: { config: { attemptId: nextId }, updatedBy: actor } });
    return nextId;
  }, { timeout: 15000 });
  return { attempt: await startAttempt(id, actor) };
}
export async function reconcileWhishOrders() {
  const candidates = await db.bookWhishSettings.findMany({ where: { id: { startsWith: prefix }, updatedAt: { gte: new Date(Date.now() - 7 * 86400000) }, config: { path: ['order', 'kind'], string_contains: 'BOOK' } }, orderBy: { updatedAt: 'asc' }, take: 10 });
  let checked = 0, errors = 0;
  for (const row of candidates) {
    const a = attemptSchema.safeParse(row.config);
    if (!a.success || !a.data.order || ['failed', 'refunded'].includes(a.data.status)) continue;
    try { await checkAttempt(a.data.id); checked++; } catch { errors++; }
  }
  return { checked, errors };
}
