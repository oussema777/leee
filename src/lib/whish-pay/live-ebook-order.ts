import { liveConfig, liveWhishEnabled } from './client';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { checkoutSchema } from '@/lib/ebooks/policy';
import { lock } from '@/lib/ebooks/server';

// readerId must come from the authenticated server session, never request JSON.
export async function createLiveWhishEbookOrder(db: Pick<PrismaClient, '$transaction'>, readerId: string, raw: unknown,
  env: Record<string, string | undefined> = process.env) {
  if (!liveWhishEnabled(env)) throw Error('LIVE_ORDER_CREATION_DISABLED');
  const { channel } = liveConfig(env);
  const input = checkoutSchema.parse(raw);
  if (input.method !== 'WHISH') throw Error('LIVE_ORDER_INVALID');
  return db.$transaction(async tx => {
    await lock(tx, 'ebook-checkout:' + readerId + ':' + input.ebookId);
    await tx.ebookReader.findUniqueOrThrow({ where: { id: readerId } });
    const ebook = await tx.ebook.findUnique({ where: { id: input.ebookId }, include: { activeVersion: true } });
    if (!ebook?.published || !ebook.activeVersion?.ready || ebook.priceCents < 100) throw Error('EBOOK_UNAVAILABLE');
    const paid = await tx.ebookOrder.findFirst({ where: { readerId, ebookId: ebook.id, state: 'VERIFIED' } });
    const access = await tx.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId, ebookId: ebook.id } } });
    if (paid || access?.active) throw Error('EBOOK_ALREADY_PURCHASED');
    const existing = await tx.ebookOrder.findFirst({ where: { readerId, ebookId: ebook.id, state: { in: ['AWAITING_PAYMENT', 'UNDER_REVIEW', 'CHANGES_REQUESTED'] }, NOT: { reference: { startsWith: 'EB-TEST-' } } } });
    if (existing) {
      const s = existing.snapshot as Record<string, unknown>;
      if (existing.method !== 'WHISH' || s.provider !== 'WHISH_PAY' || s.environment !== 'PRODUCTION' || s.testMode !== false || s.channel !== channel) throw Error('EBOOK_EXISTING_PAYMENT');
      return { id: existing.id, amountCents: existing.priceCents };
    }
    const reference = 'EB-' + randomUUID().replaceAll('-', '').toUpperCase();
    const order = await tx.ebookOrder.create({ data: {
      readerId, ebookId: ebook.id, customerName: input.customerName, locale: input.locale, method: 'WHISH', reference,
      priceCents: ebook.priceCents, title: input.locale === 'ar' ? ebook.titleAr || ebook.titleEn : ebook.titleEn,
      snapshot: { provider: 'WHISH_PAY', environment: 'PRODUCTION', testMode: false, channel, amountCents: ebook.priceCents, currency: 'USD', supportPhone: '9613600747' },
      events: { create: { actor: readerId, action: 'WHISH_ORDER_CREATED', details: { terms: 'ebook-online-v1' } } },
    } });
    return { id: order.id, amountCents: ebook.priceCents };
  });
}
