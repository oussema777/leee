import { createHash, createHmac, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { lock } from '@/lib/ebooks/server';
import { isHostedWhish, whishSnapshot } from './policy';
import { WhishError } from './client';
const grantSchema = z.object({ enabled: z.literal(true), environment: z.literal('SANDBOX'), expiresAt: z.string().datetime() });
export const reviewerTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const reviewerId = (token: string) => 'whish-reviewer:' + createHash('sha256').update(token).digest('hex');
export function activeGrant(value: unknown) { const g = grantSchema.safeParse(value); return g.success && Date.parse(g.data.expiresAt) > Date.now() ? g.data : null; }
export async function whishReviewerAccess(snapshot: unknown) {
  if (!isHostedWhish(snapshot)) return false;
  const grantId = (snapshot as { reviewerGrantId?: string }).reviewerGrantId;
  if (!grantId || !/^whish-reviewer:[a-f0-9]{64}$/.test(grantId)) return false;
  return !!activeGrant((await db.bookWhishSettings.findUnique({ where: { id: grantId } }))?.config);
}
export async function createWhishReviewOrder(token: string, requestId: string) {
  reviewerTokenSchema.parse(token); z.string().uuid().parse(requestId);
  const grantId = reviewerId(token);
  const access = createHmac('sha256', token).update('whish-review:' + requestId).digest('hex');
  const hash = createHash('sha256').update(access).digest('hex');
  return db.$transaction(async tx => {
    await lock(tx, grantId);
    const grant = activeGrant((await tx.bookWhishSettings.findUnique({ where: { id: grantId } }))?.config);
    if (!grant) throw new WhishError('REVIEW_LINK_EXPIRED');
    const existing = await tx.bookWhishPayment.findUnique({ where: { accessTokenHash: hash }, include: { order: true } });
    if (existing) return { reference: existing.order.reference, token: access, amountCents: existing.order.priceCents };
    if (await tx.bookWhishPayment.count({ where: { snapshot: { path: ['reviewerGrantId'], equals: grantId } } }) >= 20) throw new WhishError('REVIEW_LIMIT_REACHED');
    const reference = 'LEE-TEST-WHISH-' + randomUUID().replaceAll('-', '').toUpperCase();
    await tx.bookOrder.create({ data: {
      reference, locale: 'en', package: 'SINGLE', purpose: 'SELF', selectionMode: 'LEE_CHOICE', requestedBookCount: 1, priceCents: 100, currency: 'USD', customerName: 'Whish integration review - TEST ONLY', customerPhone: 'TEST', fulfillmentMethod: 'PICKUP', paymentMethod: 'WHISH', termsAccepted: true,
      adminNotes: 'Whish sandbox review only. Do not ship. No inventory reserved.',
      whishPayment: { create: { accessTokenHash: hash, requestHash: createHash('sha256').update(grantId + requestId).digest('hex'), snapshot: { ...whishSnapshot(100), reviewerGrantId: grantId }, expiresAt: new Date(grant.expiresAt), events: { create: { action: 'WHISH_REVIEW_CREATED', actor: 'whish-reviewer', details: { environment: 'SANDBOX' } } } } },
    } });
    return { reference, token: access, amountCents: 100 };
  }, { timeout: 15000 });
}
