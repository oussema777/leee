import { liveConfig, liveWhishEnabled } from './client';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { bookOrderSchema } from '@/lib/book-orders/validation';
import { BOOK_PACKAGES, deliveryFeeCents, isFreeExtraIndex, type BookPackageKey } from '@/lib/book-orders/config';
import { tokenHash, requestHash } from '@/lib/book-orders/whish-server';

// Reserve real inventory atomically before issuing a hosted Whish payment link.
export async function createLiveWhishBookOrder(db: Pick<PrismaClient, '$transaction'>, raw: unknown,
  env: Record<string, string | undefined> = process.env) {
  if (!liveWhishEnabled(env)) throw Error('LIVE_ORDER_CREATION_DISABLED');
  const { channel } = liveConfig(env);
  const input = bookOrderSchema.parse(raw);
  if (input.paymentMethod !== 'WHISH' || input.website) throw Error('LIVE_ORDER_INVALID');
  const hash = tokenHash(input.paymentAccessToken!);
  const fingerprint = requestHash(input);
  const key = input.package as BookPackageKey, pack = BOOK_PACKAGES[key];
  const delivery = deliveryFeeCents(key, input.fulfillmentMethod), total = pack.priceCents + delivery;
  return db.$transaction(async tx => {
    // Same access token means one order, including concurrent double-clicks.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${ 'whish-live-book-create:' + hash }, 0))::text`;
    const existing = await tx.bookWhishPayment.findUnique({ where: { accessTokenHash: hash }, include: { order: true } });
    if (existing) {
      const snapshot = existing.snapshot as Record<string, unknown>;
      if (existing.requestHash !== fingerprint || snapshot?.provider !== 'WHISH_PAY' || snapshot.environment !== 'PRODUCTION'
        || snapshot.testMode !== false || snapshot.channel !== channel) throw Error('LIVE_ORDER_REPLAY_MISMATCH');
      // Return the same saved order even if expired/paid; never reserve again.
      return { id: existing.orderId, reference: existing.order.reference, amountCents: existing.order.priceCents, expiresAt: existing.expiresAt };
    }
    // A curated donation may record one preference without reserving it.
    if (input.selectionMode === 'LEE_CHOICE' && input.selectedBookIds.length) {
      const preference = await tx.bookInventoryItem.findFirst({ where: { id: input.selectedBookIds[0], isPublished: true, status: 'AVAILABLE', stockQuantity: { gt: 0 } }, select: { id: true } });
      if (!preference) throw Error('BOOK_UNAVAILABLE');
    }
    const allocations = new Map<string, string>();
    if (input.selectionMode === 'CUSTOM') {
      for (const choice of [...input.selectedEditions].sort((a, b) => a.editionId.localeCompare(b.editionId))) {
        const edition = await tx.bookInventoryEdition.updateMany({ where: { id: choice.editionId, inventoryItemId: choice.bookId, active: true, stockQuantity: { gt: 0 } }, data: { stockQuantity: { decrement: 1 } } });
        if (edition.count !== 1) throw Error('BOOK_UNAVAILABLE');
        const item = await tx.bookInventoryItem.updateMany({ where: { id: choice.bookId, isPublished: true, status: 'AVAILABLE', stockQuantity: { gt: 0 } }, data: { stockQuantity: { decrement: 1 } } });
        if (item.count !== 1) throw Error('BOOK_UNAVAILABLE');
        const allocation = await tx.bookInventoryDonorAllocation.findFirst({ where: { inventoryItemId: choice.bookId, stockQuantity: { gt: 0 } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], select: { id: true } });
        if (allocation) {
          const reserved = await tx.bookInventoryDonorAllocation.updateMany({ where: { id: allocation.id, stockQuantity: { gt: 0 } }, data: { stockQuantity: { decrement: 1 } } });
          if (reserved.count !== 1) throw Error('BOOK_UNAVAILABLE');
          allocations.set(choice.bookId, allocation.id);
        }
        await tx.bookInventoryItem.updateMany({ where: { id: choice.bookId, stockQuantity: 0 }, data: { status: 'RESERVED' } });
      }
    }
    const reference = 'LEE-BK-' + new Date().getFullYear() + '-' + randomUUID().replaceAll('-', '').toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 3600000);
    const order = await tx.bookOrder.create({ data: {
      reference, locale: input.locale, package: key, purpose: input.purpose, selectionMode: input.selectionMode, requestedBookCount: pack.totalBooks,
      priceCents: total, deliveryFeeCents: delivery, currency: 'USD', paymentMethod: 'WHISH',
      customerName: input.customerName, customerPhone: input.customerPhone, customerEmail: input.customerEmail || null,
      fulfillmentMethod: input.fulfillmentMethod, governorate: input.governorate || null, area: input.area || null, detailedAddress: input.detailedAddress || null,
      recipientName: input.recipientName || null, recipientPhone: input.recipientPhone || null, giftMessage: input.giftMessage || null,
      showSenderName: input.showSenderName, termsAccepted: input.termsAccepted, consentTextVersion: 'book-order-v2',
      items: { create: input.selectedBookIds.map((inventoryItemId, i) => ({ inventoryItemId, editionId: input.selectedEditions.find(e => e.bookId === inventoryItemId)?.editionId, donorAllocationId: allocations.get(inventoryItemId), isFreeExtra: isFreeExtraIndex(key, i) })) },
      whishPayment: { create: { accessTokenHash: hash, requestHash: fingerprint, expiresAt,
        snapshot: { provider: 'WHISH_PAY', environment: 'PRODUCTION', testMode: false, channel, amountCents: total, currency: 'USD', supportPhone: '9613600747', stockReservation: input.selectionMode === 'CUSTOM' ? 'HELD' : 'NOT_REQUIRED' },
        events: { create: { action: 'WHISH_ORDER_CREATED', actor: 'customer', details: { amountCents: total, currency: 'USD' } } },
      } },
    }, select: { id: true } });
    return { id: order.id, reference, amountCents: total, expiresAt };
  });
}
