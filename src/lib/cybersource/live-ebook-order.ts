import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { checkoutSchema } from '@/lib/ebooks/policy';
import { lock } from '@/lib/ebooks/server';

// readerId must come from the authenticated server session, never request JSON.
export async function createLiveEbookOrder(db: Pick<PrismaClient, '$transaction'>, readerId: string, raw: unknown,
  env: Record<string, string | undefined> = process.env) {
  if (env.CYBERSOURCE_LIVE_ORDER_CREATION_ENABLED !== 'true') throw Error('LIVE_ORDER_CREATION_DISABLED');
  const merchantId = env.CYBERSOURCE_LIVE_MERCHANT_ID?.trim() || '';
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(merchantId)) throw Error('LIVE_MERCHANT_INVALID');
  const input = checkoutSchema.parse(raw);
  if (input.method !== 'BANK_AUDI') throw Error('LIVE_ORDER_INVALID');
  return db.$transaction(async tx => {
    await lock(tx, 'ebook-checkout:' + readerId + ':' + input.ebookId);
    await tx.ebookReader.findUniqueOrThrow({ where: { id: readerId } });
    const ebook = await tx.ebook.findUnique({ where: { id: input.ebookId }, include: { activeVersion: true } });
    if (!ebook?.published || !ebook.activeVersion?.ready || ebook.priceCents <= 0) throw Error('EBOOK_UNAVAILABLE');
    const paid = await tx.ebookOrder.findFirst({ where: { readerId, ebookId: ebook.id, state: 'VERIFIED' } });
    const access = await tx.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId, ebookId: ebook.id } } });
    if (paid || access?.active) throw Error('EBOOK_ALREADY_PURCHASED');
    const existing = await tx.ebookOrder.findFirst({ where: { readerId, ebookId: ebook.id, state: { in: ['AWAITING_PAYMENT', 'UNDER_REVIEW', 'CHANGES_REQUESTED'] }, NOT: { reference: { startsWith: 'EB-TEST-' } } } });
    if (existing) {
      const s = existing.snapshot as Record<string, unknown>;
      if (existing.method !== 'BANK_AUDI' || s.provider !== 'CYBERSOURCE' || s.environment !== 'PRODUCTION' || s.testMode !== false || s.merchantId !== merchantId) throw Error('EBOOK_EXISTING_PAYMENT');
      const attempts = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "CybersourceLiveAttempt" WHERE "ebookOrderId" = ${existing.id} LIMIT 2`;
      if (attempts.length !== 1) throw Error('LIVE_ORDER_INTENT_INVALID');
      return { id: existing.id, attemptId: attempts[0].id, amountCents: existing.priceCents };
    }
    const reference = 'EB-' + randomUUID().replaceAll('-', '').toUpperCase(), attemptId = 'LEE-L-' + randomUUID();
    const order = await tx.ebookOrder.create({ data: {
      readerId, ebookId: ebook.id, customerName: input.customerName, locale: input.locale, method: 'BANK_AUDI', reference,
      priceCents: ebook.priceCents, title: input.locale === 'ar' ? ebook.titleAr || ebook.titleEn : ebook.titleEn,
      snapshot: { provider: 'CYBERSOURCE', environment: 'PRODUCTION', testMode: false, merchantId, amountCents: ebook.priceCents, currency: 'USD' },
      events: { create: { actor: readerId, action: 'CARD_ORDER_CREATED', details: { terms: 'ebook-online-v1', attemptId } } },
    } });
    await tx.$executeRaw`INSERT INTO "CybersourceLiveAttempt" ("id", "ebookOrderId", "orderReference", "merchantId", "amountCents") VALUES (${attemptId}, ${order.id}, ${reference}, ${merchantId}, ${ebook.priceCents})`;
    return { id: order.id, attemptId, amountCents: ebook.priceCents };
  });
}
