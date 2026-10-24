import type { Prisma, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { lockOrder } from '@/lib/book-orders/whish-server';
import { lock } from '@/lib/ebooks/server';
import { encryptSession, decryptSession } from './session-storage';
import { createLiveSession } from './live-session';

type Session = Awaited<ReturnType<typeof createLiveSession>>;
type Attempt = { id: string; bookOrderId: string | null; ebookOrderId: string | null; orderReference: string; merchantId: string; amountCents: number; currency: string; environment: string; state: string; sessionState: string; sessionCipher: string | null; sessionExpiresAt: Date | null };
const snapshot = z.object({ provider: z.literal('CYBERSOURCE'), environment: z.literal('PRODUCTION'), testMode: z.literal(false), merchantId: z.string(), amountCents: z.number().int().positive(), currency: z.literal('USD') });
async function eligible(tx: Prisma.TransactionClient, a: Attempt) {
  if (a.state !== 'READY' || a.environment !== 'PRODUCTION' || a.currency !== 'USD') throw Error('LIVE_ORDER_NOT_PAYABLE');
  let saved: unknown;
  if (a.bookOrderId && !a.ebookOrderId) {
    await lockOrder(tx, a.bookOrderId);
    const p = await tx.bookWhishPayment.findUnique({ where: { orderId: a.bookOrderId }, include: { order: true } });
    if (!p || p.expiresAt.getTime() <= Date.now() || p.order.status !== 'NEW' || p.order.paymentStatus !== 'PENDING'
      || !['AWAITING_PAYMENT', 'CHANGES_REQUESTED'].includes(p.state) || p.order.paymentMethod !== 'BANK_AUDI'
      || p.order.reference !== a.orderReference || p.order.priceCents !== a.amountCents || p.order.currency !== 'USD') throw Error('LIVE_ORDER_NOT_PAYABLE');
    saved = p.snapshot;
  } else if (a.ebookOrderId && !a.bookOrderId) {
    const initial = await tx.ebookOrder.findUniqueOrThrow({ where: { id: a.ebookOrderId } });
    await lock(tx, 'ebook-checkout:' + initial.readerId + ':' + initial.ebookId);
    await lock(tx, 'ebook-order:' + initial.id);
    const o = await tx.ebookOrder.findUniqueOrThrow({ where: { id: initial.id } });
    const access = await tx.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId: o.readerId, ebookId: o.ebookId } } });
    const paid = await tx.ebookOrder.findFirst({ where: { readerId: o.readerId, ebookId: o.ebookId, state: 'VERIFIED' } });
    if (!['AWAITING_PAYMENT', 'CHANGES_REQUESTED'].includes(o.state) || o.method !== 'BANK_AUDI' || o.reference !== a.orderReference || o.priceCents !== a.amountCents || access?.active || paid) throw Error('LIVE_ORDER_NOT_PAYABLE');
    saved = o.snapshot;
  } else throw Error('LIVE_ORDER_NOT_PAYABLE');
  const s = snapshot.parse(saved);
  if (s.merchantId !== a.merchantId || s.amountCents !== a.amountCents) throw Error('LIVE_ORDER_CHANGED');
}

// Caller must authenticate ownership before passing an internal attempt ID.
// One provider session per intent. Ambiguous/expired sessions never auto-retry.
export async function startLiveCheckout(db: Pick<PrismaClient, '$transaction' | '$executeRaw'>, attemptId: string,
  create: (amount: number, reference: string, merchant: string, signal: AbortSignal) => Promise<Session> = createLiveSession) {
  if (process.env.CYBERSOURCE_LIVE_SESSION_ENABLED !== 'true') throw Error('LIVE_SESSION_DISABLED');
  if (!/^LEE-L-[a-f0-9-]{36}$/.test(attemptId)) throw Error('LIVE_ATTEMPT_INVALID');
  encryptSession({}, 'live:' + attemptId);
  const claimed = await db.$transaction(async tx => {
    const a = (await tx.$queryRaw<Attempt[]>`SELECT * FROM "CybersourceLiveAttempt" WHERE "id" = ${attemptId} FOR UPDATE`)[0];
    if (!a) throw Error('LIVE_ATTEMPT_NOT_FOUND');
    await eligible(tx, a);
    if (a.sessionState !== 'NONE') return { a, created: false };
    await tx.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "sessionState" = 'CREATING', "sessionStartedAt" = CURRENT_TIMESTAMP WHERE "id" = ${a.id}`;
    return { a, created: true };
  });
  if (!claimed.created) {
    const a = claimed.a;
    if (a.sessionState === 'READY' && a.sessionCipher && a.sessionExpiresAt && a.sessionExpiresAt.getTime() > Date.now()) {
      return { state: 'READY', session: decryptSession(a.sessionCipher, 'live:' + a.id) as Session };
    }
    return { state: 'AWAITING_CONFIRMATION', session: null };
  }
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const session = await Promise.race([create(claimed.a.amountCents, attemptId, claimed.a.merchantId, controller.signal), new Promise<never>((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(Error('LIVE_SESSION_TIMEOUT')); }, 25000);
    })]);
    if (!Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) throw Error('LIVE_SESSION_EXPIRED');
    const cipher = encryptSession(session, 'live:' + attemptId);
    await db.$transaction(async tx => {
      const a = (await tx.$queryRaw<Attempt[]>`SELECT * FROM "CybersourceLiveAttempt" WHERE "id" = ${attemptId} FOR UPDATE`)[0];
      if (!a || a.sessionState !== 'CREATING') throw Error('LIVE_SESSION_CHANGED');
      await eligible(tx, a); // Cancellation/expiry during the network request wins.
      await tx.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "sessionState" = 'READY', "sessionCipher" = ${cipher}, "sessionExpiresAt" = ${new Date(session.expiresAt)} WHERE "id" = ${attemptId}`;
    });
    return { state: 'READY', session };
  } catch {
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "sessionState" = 'UNCERTAIN', "sessionCipher" = NULL WHERE "id" = ${attemptId} AND "sessionState" = 'CREATING'`;
    return { state: 'AWAITING_CONFIRMATION', session: null };
  } finally { clearTimeout(timer); }
}
