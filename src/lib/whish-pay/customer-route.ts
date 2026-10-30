import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticatePayment, privateJson, withPaymentAdmin } from '@/lib/book-orders/whish-server';
import { requireReader, EbookError } from '@/lib/ebooks/server';
import { boundedJson, InputTooLarge } from '@/lib/cybersource/bounded-input';
import { rateLimit } from '@/lib/rate-limit';
import { isHostedWhish, canRetryPayment, type OrderContext } from './policy';
import { sandboxConfig, WhishError } from './client';
import { orderCheckout } from './customer';
import { whishReviewerAccess } from './reviewer';
export async function whishCustomerRoute(request: NextRequest, kind: 'BOOK' | 'EBOOK', key: string) {
  try {
    let actor = 'whish-reviewer';
    const config = sandboxConfig();
    if (request.headers.get('origin') !== config.origin) return privateJson({ error: 'Open checkout on the LEE website.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const input = z.object({ action: z.enum(['start', 'check', 'retry']) }).strict().parse(await boundedJson(request, 2048));
    if (input.action !== 'check' && process.env.WHISH_PAY_CUSTOMER_TEST_ENABLED !== 'true') return privateJson({ error: 'New sandbox payments are disabled.' }, 503);
    let context: OrderContext;
    if (kind === 'BOOK') {
      const p = await authenticatePayment(request, key);
      if (!p || !isHostedWhish(p.snapshot) || p.order.paymentMethod !== 'WHISH') return privateJson({ error: 'Order not found. Use the complete private link.' }, 404);
      if (!await whishReviewerAccess(p.snapshot)) { const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!; actor = auth.session.userId; }
      context = { kind, orderId: p.orderId, reference: p.order.reference, amountCents: p.order.priceCents, returnPath: '/' + (p.order.locale === 'ar' ? 'ar' : 'en') + '/books/payment/' + p.order.reference };
    } else {
      const auth = await withPaymentAdmin(request); if ('error' in auth) return auth.error!; actor = auth.session.userId;
      const reader = await requireReader(request);
      const o = await db.ebookOrder.findFirst({ where: { id: key, readerId: reader.id } });
      if (!o || o.method !== 'WHISH' || !isHostedWhish(o.snapshot)) return privateJson({ error: 'Order not found.' }, 404);
      context = { kind, orderId: o.id, reference: o.reference, amountCents: o.priceCents, returnPath: '/' + (o.locale === 'ar' ? 'ar' : 'en') + '/ebooks/orders/' + o.id };
    }
    if (!rateLimit('whish-customer:' + actor + ':' + context.orderId, 40, 60000)) return privateJson({ error: 'Please wait a minute before checking again.' }, 429);
    const result = await orderCheckout(context, input.action, actor);
    const completed = kind === 'BOOK' ? (await db.bookWhishPayment.findUnique({ where: { orderId: context.orderId } }))?.state === 'VERIFIED' : (await db.ebookOrder.findUnique({ where: { id: context.orderId } }))?.state === 'VERIFIED';
    return privateJson({ ...result, completed, retryAllowed: !!result.attempt && canRetryPayment(result.attempt.status, result.attempt.errorCode, result.attempt.uncertain) });
  } catch (error) {
    if (error instanceof InputTooLarge) return privateJson({ error: 'Request too large.' }, 413);
    if (error instanceof SyntaxError || error instanceof z.ZodError) return privateJson({ error: 'Invalid checkout request.' }, 400);
    if (error instanceof EbookError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: error instanceof WhishError ? 'Whish: ' + error.code : 'Could not verify payment. Check its status before paying again.' }, 503);
  }
}
