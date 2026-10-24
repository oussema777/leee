import { getPaymentMethods } from '@/lib/payment-methods';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticatePayment, privateJson } from '@/lib/book-orders/whish-server';
import { requireReader, EbookError } from '@/lib/ebooks/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { liveCustomerEnabled, liveSnapshotSchema } from './live-config';
import { startLiveCheckout } from './live-checkout';
import { reconcileLivePayments } from './live-jobs';
import { createLiveCaptureLookup } from './live-lookup';
import { transactionIdSchema } from './transaction';

const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inspect'), awaitingResult: z.boolean().optional() }).strict(),
  z.object({ action: z.literal('start'), retry: z.literal(false).optional() }).strict(),
  z.object({ action: z.literal('result'), attemptId: z.string().regex(/^LEE-L-[a-f0-9-]{36}$/), transactionId: transactionIdSchema }).strict(),
]);
type Attempt = { id: string; state: string; sessionState: string; sessionExpiresAt: Date | null; transactionId: string | null; merchantId: string; amountCents: number; orderReference: string; environment: string; checkError: string | null };
export async function liveCustomerCheckout(request: NextRequest, kind: 'BOOK' | 'EBOOK', key: string) {
  if (request.headers.get('origin') !== 'https://www.theleeexperience.com') return privateJson({ error: 'Open checkout on the LEE website.' }, 403);
  if (!rateLimit('live-card:' + clientIp(request), 40, 60000)) return privateJson({ error: 'Please wait before checking again.' }, 429);
  try {
    let id: string, reference: string, amount: number, saved: unknown;
    if (kind === 'BOOK') {
      const p = await authenticatePayment(request, key);
      if (!p || p.order.paymentMethod !== 'BANK_AUDI' || p.order.reference.startsWith('LEE-TEST-')) return privateJson({ error: 'Order not found.' }, 404);
      id = p.orderId; reference = p.order.reference; amount = p.order.priceCents; saved = p.snapshot;
    } else {
      const reader = await requireReader(request);
      const order = await db.ebookOrder.findFirst({ where: { id: key, readerId: reader.id } });
      if (!order || order.method !== 'BANK_AUDI' || order.reference.startsWith('EB-TEST-')) return privateJson({ error: 'Order not found.' }, 404);
      id = order.id; reference = order.reference; amount = order.priceCents; saved = order.snapshot;
    }
    const snapshot = liveSnapshotSchema.safeParse(saved);
    if (!snapshot.success || snapshot.data.amountCents !== amount) return privateJson({ error: 'Order not found.' }, 404);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const reader = request.body?.getReader(); if (!reader) return privateJson({ error: 'Missing request.' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 2048) return privateJson({ error: 'Request too large.' }, 413); chunks.push(value); } } finally { await reader.cancel().catch(() => {}); }
    const parsed = inputSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!parsed.success) return privateJson({ error: 'Invalid checkout request.' }, 400);
    const read = () => db.$queryRaw<Attempt[]>(Prisma.sql`SELECT "id", "state", "sessionState", "sessionExpiresAt", "transactionId", "merchantId", "amountCents", "orderReference", "environment", "checkError" FROM "CybersourceLiveAttempt" WHERE ${kind === 'BOOK' ? Prisma.sql`"bookOrderId" = ${id}` : Prisma.sql`"ebookOrderId" = ${id}`} LIMIT 2`);
    let rows = await read(), a = rows[0];
    if (rows.length !== 1 || a.environment !== 'PRODUCTION' || a.merchantId !== snapshot.data.merchantId || a.amountCents !== amount || a.orderReference !== reference) return privateJson({ error: 'Payment needs support. Do not pay again.' }, 409);
    const input = parsed.data;
    if (input.action === 'start' && (!liveCustomerEnabled() || !(await getPaymentMethods()).BANK_AUDI)) return privateJson({ error: 'New card payments are temporarily unavailable. You can still check an existing payment.' }, 503);
    if (input.action === 'result' && input.attemptId !== a.id) return privateJson({ error: 'Payment attempt not found.' }, 404);
    if (input.action === 'result' || input.action === 'inspect' && input.awaitingResult) {
      await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "sessionState" = 'SUBMITTED' WHERE "id" = ${a.id} AND "sessionState" = 'READY' AND "state" = 'READY'`;
    }
    // Browser IDs are hints only. Search the authenticated order's saved reference.
    if (a.sessionState !== 'NONE' || a.state === 'VERIFIED_CAPTURE') {
      await reconcileLivePayments(db, createLiveCaptureLookup(), a.id);
      rows = await read(); a = rows[0];
    }
    let completed = false, closed = false;
    if (kind === 'BOOK') {
      const o = await db.bookOrder.findUniqueOrThrow({ where: { id }, include: { whishPayment: true } });
      completed = a.state === 'APPLIED' && o.paymentStatus === 'PAID' && o.status !== 'CANCELLED';
      closed = o.status === 'CANCELLED' || o.paymentStatus === 'REFUNDED' || !completed && !!o.whishPayment && o.whishPayment.expiresAt.getTime() <= Date.now();
    } else {
      const o = await db.ebookOrder.findUniqueOrThrow({ where: { id }, include: { access: true } });
      completed = a.state === 'APPLIED' && o.state === 'VERIFIED' && !!o.access?.active;
      closed = !['AWAITING_PAYMENT', 'CHANGES_REQUESTED'].includes(o.state) && !completed;
    }
    const review = closed || a.state === 'REVIEW_REQUIRED' || a.checkError === 'PAYMENT_REQUIRES_REVIEW' || a.state === 'APPLIED' && !completed;
    let session: Awaited<ReturnType<typeof startLiveCheckout>>['session'] = null;
    if (input.action === 'start' && !completed && !review) {
      const result = await startLiveCheckout(db, a.id); session = result.session;
      rows = await read(); a = rows[0];
    }
    const ready = a.state === 'READY' && a.sessionState === 'READY' && !!a.sessionExpiresAt && a.sessionExpiresAt.getTime() > Date.now();
    const pending = !completed && !review && !session && (a.sessionState !== 'NONE' && !ready || input.action === 'result' || input.action === 'inspect' && input.awaitingResult === true);
    return privateJson({ completed, review, pending, ...(pending ? { retryAfterSeconds: 10 } : {}), session,
      attempt: { id: a.id, state: review ? 'REVIEW_REQUIRED' : a.sessionState === 'NONE' ? 'NOT_STARTED' : ready ? 'READY' : a.state, transactionId: a.transactionId, expiresAt: a.sessionExpiresAt?.toISOString() || null } }, pending ? 202 : 200);
  } catch (error) {
    if (error instanceof EbookError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: 'Invalid request.' }, 400);
    return privateJson({ error: 'Could not confirm checkout. Check its status or contact LEE before paying again.' }, 503);
  }
}
