import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { lock } from '@/lib/ebooks/server';
import { queueOrderEmail } from '@/lib/ebooks/mail';
import { lockOrder, releaseOrderStock } from '@/lib/book-orders/whish-server';
import { liveConfig, liveWhishEnabled, whishClient, WhishError, createSchema, collectStatusSchema } from './client';
import { liveWhishSnapshotSchema, canRetryPayment, type OrderContext } from './policy';
import { mergeStatus } from './sandbox';

export const livePrefix = 'whish-live:';
export const liveAttemptSchema = z.object({
  id: z.uuid(), environment: z.literal('PRODUCTION'), channel: z.string(), createdAt: z.string(),
  order: z.object({ kind: z.enum(['BOOK', 'EBOOK']), orderId: z.string(), reference: z.string(), amountCents: z.number().int().min(100) }),
  request: createSchema, collectUrl: z.string().nullable(), status: collectStatusSchema,
  errorCode: z.string().nullable(), uncertain: z.boolean(), checkedAt: z.string().nullable(),
  applied: z.boolean(), refundApplied: z.boolean(), reviewReason: z.string().nullable(),
  nextCheckAt: z.string(),
});
type Attempt = z.infer<typeof liveAttemptSchema>;
const pointerKey = (c: Pick<OrderContext, 'kind' | 'orderId'>) => 'whish-live-checkout:' + c.kind + ':' + c.orderId;
const summary = (a: Attempt) => ({ id: a.id, collectUrl: a.collectUrl, status: a.status, errorCode: a.errorCode, uncertain: a.uncertain, reviewRequired: !!a.reviewReason });

export async function loadLiveAttempt(id: string) {
  if (!z.uuid().safeParse(id).success) throw new WhishError('ATTEMPT_NOT_FOUND');
  const row = await db.bookWhishSettings.findUnique({ where: { id: livePrefix + id } });
  if (!row) throw new WhishError('ATTEMPT_NOT_FOUND');
  return liveAttemptSchema.parse(row.config);
}
async function orderFor(tx: Prisma.TransactionClient, a: Pick<Attempt, 'order' | 'channel'>) {
  const c = a.order;
  if (c.kind === 'BOOK') {
    await lockOrder(tx, c.orderId);
    const p = await tx.bookWhishPayment.findUniqueOrThrow({ where: { orderId: c.orderId }, include: { order: { include: { items: true } } } });
    const s = liveWhishSnapshotSchema.parse(p.snapshot);
    if (s.channel !== a.channel || s.amountCents !== c.amountCents || p.order.priceCents !== c.amountCents || p.order.reference !== c.reference || p.order.paymentMethod !== 'WHISH' || p.order.currency !== 'USD' || p.order.reference.startsWith('LEE-TEST-')) throw new WhishError('ORDER_CHANGED');
    return { book: p, snapshot: s };
  }
  const initial = await tx.ebookOrder.findUniqueOrThrow({ where: { id: c.orderId } });
  await lock(tx, 'ebook-checkout:' + initial.readerId + ':' + initial.ebookId);
  await lock(tx, 'ebook-order:' + initial.id);
  const o = await tx.ebookOrder.findUniqueOrThrow({ where: { id: initial.id }, include: { reader: true } });
  const s = liveWhishSnapshotSchema.parse(o.snapshot);
  if (s.channel !== a.channel || s.amountCents !== c.amountCents || o.priceCents !== c.amountCents || o.reference !== c.reference || o.method !== 'WHISH' || o.reference.startsWith('EB-TEST-')) throw new WhishError('ORDER_CHANGED');
  return { ebook: o, snapshot: s };
}
async function editAttempt(id: string, edit: (a: Attempt) => Attempt) {
  return db.$transaction(async tx => {
    await lock(tx, livePrefix + id);
    const row = await tx.bookWhishSettings.findUniqueOrThrow({ where: { id: livePrefix + id } });
    const next = edit(liveAttemptSchema.parse(row.config));
    await tx.bookWhishSettings.update({ where: { id: row.id }, data: { config: next } });
    return next;
  });
}
async function queuePaymentMail(tx: Prisma.TransactionClient, a: Attempt, event: string) {
  const id = 'whish-live-mail:' + a.id + ':' + event;
  await tx.bookWhishSettings.upsert({ where: { id }, create: { id, updatedBy: 'whish-live', config: { attemptId: a.id, event, sent: false, nextAttemptAt: new Date().toISOString() } }, update: {} });
}

// Only persisted provider results can reach this function. Always re-read under
// the same order lock used by cancellation and inventory release.
export async function applyLiveWhish(id: string) {
  const initial = await loadLiveAttempt(id);
  return db.$transaction(async tx => {
    const current = await orderFor(tx, initial);
    await lock(tx, livePrefix + id);
    const row = await tx.bookWhishSettings.findUniqueOrThrow({ where: { id: livePrefix + id } });
    const a = liveAttemptSchema.parse(row.config);
    if (!a.checkedAt || a.request.externalId !== 'LEE-W-LIVE-' + id || a.request.currency !== 'USD' || a.request.amount !== (a.order.amountCents / 100).toFixed(2)) throw new WhishError('ATTEMPT_CHANGED');
    const details = { attemptId: id, externalId: a.request.externalId, environment: 'PRODUCTION' };
    const review = async (reason: string) => {
      if (!a.reviewReason) {
        a.reviewReason = reason;
        if (current.book) {
          await tx.bookWhishPayment.update({ where: { id: current.book.id }, data: { customerNote: 'Whish payment needs staff review. Please do not pay again.', events: { create: { action: 'WHISH_PAYMENT_REVIEW', actor: 'whish-live', details: { ...details, reason } } } } });
          await tx.bookOrder.update({ where: { id: a.order.orderId }, data: { isRead: false } });
          await queuePaymentMail(tx, a, 'REVIEW');
        } else {
          await tx.ebookOrder.update({ where: { id: a.order.orderId }, data: { customerNote: 'Whish payment needs staff review. Please do not pay again.', events: { create: { action: 'WHISH_PAYMENT_REVIEW', actor: 'whish-live', details: { ...details, reason } } } } });
          await queuePaymentMail(tx, a, 'REVIEW');
        }
      }
    };
    if (a.status === 'refunded' && !a.refundApplied) {
      if (current.book) {
        const p = current.book;
        // A refund of an older attempt must not cancel a newer paid attempt.
        if (p.verifiedReference && p.verifiedReference !== a.request.externalId) await review('REFUNDED_OTHER_ATTEMPT');
        else {
          const shipment = await tx.bookShipment.findUnique({ where: { orderId: p.orderId } });
          const mayRelease = ['NEW', 'CONFIRMED'].includes(p.order.status) && !shipment;
          if (mayRelease) await releaseOrderStock(tx, p.order);
          await tx.bookWhishPayment.update({ where: { id: p.id }, data: { state: 'REFUNDED', customerNote: 'Whish confirmed the refund.', events: { create: { action: 'WHISH_REFUNDED', actor: 'whish-live', details } } } });
          await tx.bookOrder.update({ where: { id: p.orderId }, data: { paymentStatus: 'REFUNDED', ...(mayRelease ? { status: 'CANCELLED' } : {}), isRead: false } });
          await queuePaymentMail(tx, a, 'REFUNDED');
        }
      } else {
        const o = current.ebook!;
        if (o.verifiedReference && o.verifiedReference !== a.request.externalId) await review('REFUNDED_OTHER_ATTEMPT');
        else {
          await tx.ebookAccess.updateMany({ where: { orderId: o.id }, data: { active: false } });
          const updated = await tx.ebookOrder.update({ where: { id: o.id }, data: { state: 'REFUNDED', customerNote: 'Whish confirmed the refund.', events: { create: { action: 'WHISH_REFUNDED', actor: 'whish-live', details } } }, include: { reader: true } });
          await queueOrderEmail(tx, updated, 'REVOKED');
          await queuePaymentMail(tx, a, 'REFUNDED');
        }
      }
      a.refundApplied = true;
    } else if (a.status === 'success' && !a.applied && !a.reviewReason) {
      if (current.book) {
        const p = current.book;
        if (p.state !== 'AWAITING_PAYMENT' || p.order.paymentStatus !== 'PENDING' || p.order.status !== 'NEW') await review('ORDER_NOT_PAYABLE');
        else if (p.expiresAt.getTime() <= Date.now()) await review('RESERVATION_EXPIRED');
        else if (p.order.selectionMode === 'CUSTOM' && (current.snapshot.stockReservation !== 'HELD' || p.order.items.length !== p.order.requestedBookCount || p.order.items.some(i => !i.editionId))) await review('RESERVATION_NOT_CONFIRMED');
        else {
          await tx.bookWhishPayment.update({ where: { id: p.id }, data: { state: 'VERIFIED', verifiedReference: a.request.externalId, reviewedAt: new Date(), reviewedBy: 'whish-live', customerNote: 'Whish payment verified.', events: { create: { action: 'WHISH_PAYMENT_CONFIRMED', actor: 'whish-live', details } } } });
          await tx.bookOrder.update({ where: { id: p.orderId }, data: { paymentStatus: 'PAID', isRead: false } });
          await queuePaymentMail(tx, a, 'CONFIRMED');
          a.applied = true;
        }
      } else {
        const o = current.ebook!;
        const access = await tx.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId: o.readerId, ebookId: o.ebookId } } });
        const paid = await tx.ebookOrder.findFirst({ where: { readerId: o.readerId, ebookId: o.ebookId, state: 'VERIFIED' } });
        if (o.state !== 'AWAITING_PAYMENT' || paid || access?.active) await review('DUPLICATE_OR_CLOSED_PURCHASE');
        else {
          const updated = await tx.ebookOrder.update({ where: { id: o.id }, data: { state: 'VERIFIED', verifiedReference: a.request.externalId, customerNote: 'Whish payment verified.', events: { create: { action: 'WHISH_PAYMENT_CONFIRMED', actor: 'whish-live', details } } }, include: { reader: true } });
          await tx.ebookAccess.upsert({ where: { readerId_ebookId: { readerId: o.readerId, ebookId: o.ebookId } }, create: { readerId: o.readerId, ebookId: o.ebookId, orderId: o.id }, update: { orderId: o.id, active: true } });
          await queueOrderEmail(tx, updated, 'ACCESS');
          await queuePaymentMail(tx, a, 'CONFIRMED');
          a.applied = true;
        }
      }
    }
    await tx.bookWhishSettings.update({ where: { id: row.id }, data: { config: a } });
    return a;
  }, { timeout: 15000 });
}
export async function checkLiveWhish(id: string, callbackToken?: string) {
  const a = await loadLiveAttempt(id), config = liveConfig();
  if (a.channel !== config.channel) throw new WhishError('CHANNEL_CHANGED');
  if (callbackToken !== undefined) {
    const expected = new URL(a.request.successCallbackUrl).searchParams.get('token') || '';
    if (!/^[a-f0-9]{64}$/.test(callbackToken) || expected.length !== callbackToken.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(callbackToken))) throw new WhishError('INVALID_CALLBACK');
  }
  try {
    const status = await whishClient(config).status(a.request.externalId);
    await editAttempt(id, latest => ({ ...latest, status: mergeStatus(latest.status, status), checkedAt: new Date().toISOString(), errorCode: null, uncertain: false, nextCheckAt: ['failed', 'refunded'].includes(status) ? '9999-01-01T00:00:00.000Z' : new Date(Date.now() + (status === 'success' ? 86400000 : 60000)).toISOString() }));
    return summary(await applyLiveWhish(id));
  } catch (error) {
    await editAttempt(id, latest => ({ ...latest, nextCheckAt: new Date(Date.now() + 5 * 60000).toISOString() }));
    throw error;
  }
}
export async function liveOrderCheckout(context: OrderContext, action: 'start' | 'check' | 'retry') {
  const config = liveConfig();
  let pointer = await db.bookWhishSettings.findUnique({ where: { id: pointerKey(context) } });
  const previousId = (pointer?.config as { attemptId?: string } | null)?.attemptId;
  let previous = previousId ? await loadLiveAttempt(previousId) : null;
  if (previous && (previous.collectUrl || previous.status === 'success' || action === 'check' && previous.uncertain)) {
    await checkLiveWhish(previous.id);
    previous = await loadLiveAttempt(previous.id);
  }
  if (action === 'check') return { attempt: previous ? summary(previous) : null, completed: !!previous?.applied && previous.status === 'success', retryAllowed: !!previous && !previous.reviewReason && canRetryPayment(previous.status, previous.errorCode, previous.uncertain) };
  if (!liveWhishEnabled()) throw new WhishError('LIVE_PAYMENTS_DISABLED');
  const id = await db.$transaction(async tx => {
    await lock(tx, pointerKey(context));
    const current = await orderFor(tx, { order: context, channel: config.channel });
    if (current.book && (current.book.state !== 'AWAITING_PAYMENT' || current.book.order.status !== 'NEW' || current.book.order.paymentStatus !== 'PENDING' || current.book.expiresAt.getTime() <= Date.now())) throw new WhishError('ORDER_NOT_PAYABLE');
    if (current.ebook && current.ebook.state !== 'AWAITING_PAYMENT') throw new WhishError('ORDER_NOT_PAYABLE');
    pointer = await tx.bookWhishSettings.findUnique({ where: { id: pointerKey(context) } });
    const savedId = (pointer?.config as { attemptId?: string } | null)?.attemptId;
    if (savedId && (savedId !== previousId || action !== 'retry' || !previous || previous.reviewReason || !canRetryPayment(previous.status, previous.errorCode, previous.uncertain))) return savedId;
    const id = randomUUID(), callback = new URL('/api/webhooks/whish-pay/live', config.origin);
    callback.searchParams.set('id', id); callback.searchParams.set('token', randomBytes(32).toString('hex'));
    const redirect = config.origin + context.returnPath;
    const a: Attempt = { id, environment: 'PRODUCTION', channel: config.channel, order: context, createdAt: new Date().toISOString(),
      request: { amount: (context.amountCents / 100).toFixed(2), currency: 'USD', externalId: 'LEE-W-LIVE-' + id, invoice: 'LEE order ' + context.reference, successCallbackUrl: callback.href, failureCallbackUrl: callback.href, successRedirectUrl: redirect, failureRedirectUrl: redirect },
      collectUrl: null, status: 'unknown', errorCode: null, uncertain: true, checkedAt: null, applied: false, refundApplied: false, reviewReason: null, nextCheckAt: new Date(Date.now() + 60000).toISOString() };
    await tx.bookWhishSettings.create({ data: { id: livePrefix + id, updatedBy: 'whish-live', config: a } });
    await tx.bookWhishSettings.upsert({ where: { id: pointerKey(context) }, create: { id: pointerKey(context), updatedBy: 'whish-live', config: { attemptId: id } }, update: { config: { attemptId: id } } });
    return id;
  });
  let a = await loadLiveAttempt(id);
  if (!a.collectUrl && (a.uncertain || !a.errorCode)) {
    try {
      const collectUrl = await whishClient(config).create(a.request);
      a = await editAttempt(id, latest => ({ ...latest, collectUrl, errorCode: null, uncertain: false }));
    } catch (error) {
      const known = error instanceof WhishError ? error : new WhishError('TRANSPORT_UNCERTAIN', true);
      a = await editAttempt(id, latest => latest.collectUrl ? latest : { ...latest, errorCode: known.code, uncertain: known.uncertain, nextCheckAt: known.uncertain ? new Date(Date.now() + 60000).toISOString() : '9999-01-01T00:00:00.000Z' });
    }
  }
  return { attempt: summary(a), completed: a.applied && a.status === 'success', retryAllowed: !a.reviewReason && canRetryPayment(a.status, a.errorCode, a.uncertain) };
}

export async function reconcileLiveWhish() {
  const rows = await db.bookWhishSettings.findMany({ where: { id: { startsWith: livePrefix }, config: { path: ['nextCheckAt'], lte: new Date().toISOString() } }, orderBy: { updatedAt: 'asc' }, take: 20 });
  let checked = 0, errors = 0;
  const started = Date.now();
  for (const row of rows) {
    if (Date.now() - started > 180000) break;
    const a = liveAttemptSchema.safeParse(row.config);
    if (!a.success || a.data.refundApplied || a.data.status === 'failed' || (a.data.errorCode && !a.data.uncertain)) continue;
    try { await checkLiveWhish(a.data.id); checked++; } catch { errors++; }
  }
  return { checked, errors };
}
