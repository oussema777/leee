import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticatePayment, privateJson } from '@/lib/book-orders/whish-server';
import { requireReader, EbookError, limited } from '@/lib/ebooks/server';
import { boundedJson, InputTooLarge } from '@/lib/cybersource/bounded-input';
import { isLiveWhish, type OrderContext } from './policy';
import { liveConfig, WhishError } from './client';
import { liveOrderCheckout } from './live';

export async function liveWhishRoute(request: NextRequest, kind: 'BOOK' | 'EBOOK', key: string) {
  try {
    if (request.headers.get('origin') !== liveConfig().origin) return privateJson({ error: 'Open checkout on the LEE website.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return privateJson({ error: 'Send JSON.' }, 415);
    const input = z.object({ action: z.enum(['start', 'check', 'retry']) }).strict().parse(await boundedJson(request, 2048));
    let context: OrderContext;
    if (kind === 'BOOK') {
      const p = await authenticatePayment(request, key);
      if (!p || !isLiveWhish(p.snapshot) || p.order.paymentMethod !== 'WHISH') return privateJson({ error: 'Order not found. Use the complete private link.' }, 404);
      context = { kind, orderId: p.orderId, reference: p.order.reference, amountCents: p.order.priceCents, returnPath: '/' + (p.order.locale === 'ar' ? 'ar' : 'en') + '/books/payment/' + p.order.reference };
    } else {
      const reader = await requireReader(request);
      const o = await db.ebookOrder.findFirst({ where: { id: key, readerId: reader.id } });
      if (!o || !isLiveWhish(o.snapshot) || o.method !== 'WHISH') return privateJson({ error: 'Order not found.' }, 404);
      context = { kind, orderId: o.id, reference: o.reference, amountCents: o.priceCents, returnPath: '/' + (o.locale === 'ar' ? 'ar' : 'en') + '/ebooks/orders/' + o.id };
    }
    if (!await limited('whish-live-customer:' + context.orderId, 30, 60)) return privateJson({ error: 'Please wait before checking again.' }, 429);
    const result = await liveOrderCheckout(context, input.action);
    // A late confirmation of an older attempt may already have paid this order.
    // Never invite another payment just because its newest link is still pending.
    const completed = kind === 'BOOK'
      ? (await db.bookWhishPayment.findUnique({ where: { orderId: context.orderId } }))?.state === 'VERIFIED'
      : (await db.ebookOrder.findUnique({ where: { id: context.orderId } }))?.state === 'VERIFIED';
    return privateJson({ ...result, completed, retryAllowed: result.retryAllowed && !completed });
  } catch (error) {
    if (error instanceof InputTooLarge) return privateJson({ error: 'Request too large.' }, 413);
    if (error instanceof SyntaxError || error instanceof z.ZodError) return privateJson({ error: 'Invalid checkout request.' }, 400);
    if (error instanceof EbookError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: error instanceof WhishError && ['ORDER_NOT_PAYABLE', 'LIVE_PAYMENTS_DISABLED'].includes(error.code) ? 'This order cannot start a new payment. Contact LEE for help.' : 'Could not verify payment. Check its status before paying again.' }, 503);
  }
}
