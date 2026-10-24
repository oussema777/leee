import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticatePayment, privateJson, withPaymentAdmin } from '@/lib/book-orders/whish-server';
import { requireReader, EbookError } from '@/lib/ebooks/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { customerCardEnabled } from './customer-config';
import { isCardSnapshot, isTestBookReference, isTestEbookReference } from './customer-policy';
import { CheckoutError, checkoutErrorMessage, startCheckout, type Attempt } from './checkout';
import { transactionIdSchema, TransactionLookupPending } from './transaction';
import { finalizeCustomerTest } from './customer-finalize';
import { recoverTestCheckout, checkCustomerResult } from './recovery';
import { CUSTOMER_CHECK_SECONDS } from './polling';
const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('inspect'), awaitingResult: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal('start'), retry: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal('result'), attemptId: z.string().regex(/^LEE-T-[a-f0-9-]{36}$/), transactionId: transactionIdSchema }).strict(),
]);
export async function customerCheckout(request: NextRequest, kind: 'BOOK' | 'EBOOK', key: string) {
  try {
    if (request.headers.get('origin') !== 'https://www.theleeexperience.com') return privateJson({ error: 'Open checkout at https://www.theleeexperience.com.' }, 403);
    const admin = await withPaymentAdmin(request);
    if ('error' in admin) return admin.error!;
    if (!rateLimit('card-customer:' + clientIp(request), 40, 60000)) return privateJson({ error: 'Please wait a moment before trying again.' }, 429);
    let id: string, reference: string, amountCents: number, actor: string;
    if (kind === 'BOOK') {
      const payment = await authenticatePayment(request, key);
      if (!payment || !isTestBookReference(payment.order.reference) || payment.order.paymentMethod !== 'BANK_AUDI' || !isCardSnapshot(payment.snapshot)) return privateJson({ error: 'Order not found. Use your complete checkout link.' }, 404);
      id = payment.orderId; reference = payment.order.reference; amountCents = payment.order.priceCents; actor = 'customer';
      if (payment.order.status === 'CANCELLED' || payment.expiresAt.getTime() <= Date.now() && payment.state !== 'VERIFIED') return privateJson({ error: 'This order has expired. Contact LEE before placing another payment.' }, 409);
    } else {
      const reader = await requireReader(request);
      const order = await db.ebookOrder.findFirst({ where: { id: key, readerId: reader.id } });
      if (!order || !isTestEbookReference(order.reference) || order.method !== 'BANK_AUDI' || !isCardSnapshot(order.snapshot)) return privateJson({ error: 'Order not found.' }, 404);
      id = order.id; reference = order.reference; amountCents = order.priceCents; actor = reader.id;
    }
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const reader = request.body?.getReader(); if (!reader) return privateJson({ error: 'Missing request.' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 2048) return privateJson({ error: 'Request too large.' }, 413); chunks.push(value); } } finally { await reader.cancel().catch(() => {}); }
    const parsed = inputSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    if (!parsed.success) return privateJson({ error: 'Invalid checkout request.' }, 400);
    const input = parsed.data;
    const attempts = await db.$queryRaw<Attempt[]>(Prisma.sql`SELECT * FROM "CybersourceTestAttempt" WHERE ${kind === 'BOOK' ? Prisma.sql`"bookOrderId" = ${id}` : Prisma.sql`"ebookOrderId" = ${id}`} ORDER BY "createdAt" DESC, "id" DESC LIMIT 1`);
    const attempt = attempts[0];
    if (input.action === 'inspect') {
      const recovered = attempt ? await recoverTestCheckout(db, attempt) : null;
      const completed = attempt ? await finalizeCustomerTest(db, attempt.id) : false;
      const pending = !completed && input.awaitingResult && recovered && ['READY', 'REVIEW_REQUIRED'].includes(recovered.state);
      return privateJson({ reference, amountCents, attempt: recovered, completed, ...(pending ? { pending: true, retryAfterSeconds: CUSTOMER_CHECK_SECONDS } : {}) }, pending ? 202 : 200);
    }
    if (input.action === 'result') {
      if (!attempt || attempt.id !== input.attemptId) return privateJson({ error: 'Payment attempt not found.' }, 404);
      const result = await checkCustomerResult(db, attempt, input.transactionId);
      return privateJson({ attempt: result, completed: await finalizeCustomerTest(db, attempt.id) });
    }
    if (!customerCardEnabled()) return privateJson({ error: 'Card checkout is temporarily unavailable.' }, 503);
    return privateJson(await startCheckout(db, { kind, reference }, actor, input.retry));
  } catch (error) {
    if (error instanceof TransactionLookupPending) return privateJson({ pending: true, retryAfterSeconds: CUSTOMER_CHECK_SECONDS, message: 'Waiting for payment confirmation. We will check again in 10 seconds. Do not pay again.' }, 202);
    if (error instanceof EbookError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: 'Invalid request.' }, 400);
    return privateJson({ error: error instanceof CheckoutError ? checkoutErrorMessage(error.code) : 'We could not confirm the payment. Refresh its status before trying again.', ...(error instanceof CheckoutError ? { code: error.code } : {}) }, error instanceof CheckoutError ? error.status : 503);
  }
}
