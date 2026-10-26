import { createHash, createHmac, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isCardSnapshot } from './customer-policy';

export const REVIEWER_PREFIX = 'cybersource-reviewer:';
export const reviewerTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
const grantSchema = z.object({ enabled: z.literal(true), environment: z.literal('TEST'), expiresAt: z.string().datetime() });
export function activeReviewerGrant(value: unknown, now = Date.now()) {
  const parsed = grantSchema.safeParse(value);
  return parsed.success && Date.parse(parsed.data.expiresAt) > now ? parsed.data : null;
}
export function reviewerGrantId(token: string) {
  return REVIEWER_PREFIX + createHash('sha256').update(token).digest('hex');
}
export async function reviewerPaymentAccess(snapshot: unknown) {
  if (!isCardSnapshot(snapshot)) return false;
  const id = (snapshot as Record<string, unknown>).reviewerGrantId;
  if (typeof id !== 'string' || !/^cybersource-reviewer:[a-f0-9]{64}$/.test(id)) return false;
  const row = await db.bookWhishSettings.findUnique({ where: { id } });
  return !!activeReviewerGrant(row?.config);
}
export class ReviewerError extends Error { constructor(message: string, public status = 403) { super(message); } }

// A link grants access only to dedicated sandbox orders. It never creates an admin session.
export async function createReviewerOrder(token: string, requestId: string) {
  reviewerTokenSchema.parse(token);
  z.string().uuid().parse(requestId);
  const grantId = reviewerGrantId(token);
  const paymentToken = createHmac('sha256', token).update('reviewer-order:' + requestId).digest('hex');
  const accessTokenHash = createHash('sha256').update(paymentToken).digest('hex');
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${grantId}, 0))::text`;
    const row = await tx.bookWhishSettings.findUnique({ where: { id: grantId } });
    const grant = activeReviewerGrant(row?.config);
    if (!grant) throw new ReviewerError('This review link has expired or is unavailable. Please contact LEE.');
    const existing = await tx.bookWhishPayment.findUnique({ where: { accessTokenHash }, include: { order: true } });
    if (existing) return { reference: existing.order.reference, token: paymentToken, amountCents: existing.order.priceCents };
    const count = await tx.bookWhishPayment.count({ where: { snapshot: { path: ['reviewerGrantId'], equals: grantId } } });
    if (count >= 50) throw new ReviewerError('The review test limit has been reached. Please contact LEE.', 429);
    const reference = 'LEE-TEST-' + randomUUID().replaceAll('-', '').toUpperCase();
    const amountCents = 100;
    await tx.bookOrder.create({ data: {
      reference, locale: 'en', package: 'SINGLE', purpose: 'SELF', selectionMode: 'LEE_CHOICE', requestedBookCount: 1,
      priceCents: amountCents, currency: 'USD', customerName: 'Areeba integration review — TEST ONLY', customerPhone: 'TEST',
      fulfillmentMethod: 'PICKUP', paymentMethod: 'BANK_AUDI', termsAccepted: true,
      adminNotes: 'External gateway verification. Sandbox only. Do not ship. No inventory reserved.',
      whishPayment: { create: {
        accessTokenHash, requestHash: createHash('sha256').update(grantId + ':' + requestId).digest('hex'),
        snapshot: { provider: 'CYBERSOURCE', environment: 'TEST', testMode: true, amountCents, currency: 'USD', supportPhone: '9613600747', reviewerGrantId: grantId },
        expiresAt: new Date(grant.expiresAt),
        events: { create: { action: 'CARD_REVIEW_TEST_CREATED', actor: 'areeba-reviewer', details: { environment: 'TEST' } } },
      } },
    } });
    return { reference, token: paymentToken, amountCents };
  });
}
