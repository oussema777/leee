import { randomBytes, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const provider = vi.hoisted(() => ({ create: vi.fn(), status: vi.fn(), refund: vi.fn() }));
vi.mock('./client', async original => ({ ...await original<typeof import('./client')>(), whishClient: () => provider }));
import { db } from '@/lib/db';
import { hash } from '@/lib/ebooks/server';
import { expireLockedPayment } from '@/lib/book-orders/whish-server';
import { liveOrderCheckout, checkLiveWhish, loadLiveAttempt, livePrefix, reconcileLiveWhish } from './live';
import { createLiveWhishBookOrder } from './live-book-order';
import { createLiveWhishEbookOrder } from './live-ebook-order';
import { liveWhishRoute } from './live-route';
import { WhishError } from './client';
import { refundLiveWhish } from './live-refund';
import type { OrderContext } from './policy';
import { POST as ebookCheckout } from '@/app/api/ebooks/orders/route';
const enabled = process.env.WHISH_LIVE_TEST_DATABASE === 'true';
if (enabled && process.env.DATABASE_URL !== 'postgresql://postgres@127.0.0.1:55444/postgres') throw Error('Dedicated local Whish DB required');
describe.skipIf(!enabled)('live Whish orders and fulfillment with isolated PostgreSQL', () => {
  beforeAll(() => {
    vi.stubEnv('WHISH_PAY_LIVE_ENABLED', 'true'); vi.stubEnv('WHISH_PAY_LIVE_CHANNEL', 'local-channel');
    vi.stubEnv('WHISH_PAY_LIVE_SECRET', 'local-secret'); vi.stubEnv('WHISH_PAY_LIVE_WEBSITE_URL', 'theleeexperience.com');
    vi.stubEnv('WHISH_PAY_LIVE_PUBLIC_ORIGIN', 'https://www.theleeexperience.com');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.theleeexperience.com');
  });
  beforeEach(() => { vi.stubEnv('WHISH_PAY_LIVE_ENABLED', 'true'); vi.stubEnv('WHISH_PAY_LIVE_REFUNDS_ENABLED', 'false'); provider.refund.mockReset().mockResolvedValue(undefined); provider.create.mockReset().mockResolvedValue('https://whish.money/pay/local'); provider.status.mockReset().mockResolvedValue('pending'); });
  afterAll(async () => { await db.$disconnect(); vi.unstubAllEnvs(); });
  async function ebook() {
    const reader = await db.ebookReader.create({ data: { email: randomUUID() + '@example.test' } });
    const book = await db.ebook.create({ data: { slug: randomUUID(), titleEn: 'Local bilingual book', author: 'Fixture', priceCents: 999 } });
    const version = await db.ebookVersion.create({ data: { ebookId: book.id, label: 'Arabic', ready: true, pageCount: 1 } });
    await db.ebook.update({ where: { id: book.id }, data: { published: true, activeVersionId: version.id } });
    const input = { ebookId: book.id, customerName: 'Local Buyer', method: 'WHISH', locale: 'en', termsAccepted: true, priceCents: 1 };
    const created = await createLiveWhishEbookOrder(db, reader.id, input);
    const order = await db.ebookOrder.findUniqueOrThrow({ where: { id: created.id } });
    const token = randomBytes(32).toString('hex');
    await db.ebookSession.create({ data: { id: hash(token), readerId: reader.id, expiresAt: new Date(Date.now() + 3600000) } });
    const context: OrderContext = { kind: 'EBOOK', orderId: order.id, reference: order.reference, amountCents: 999, returnPath: '/en/ebooks/orders/' + order.id };
    return { reader, book, input, order, context, token };
  }
  async function book() {
    const donor = await db.bookDonor.create({ data: { displayName: 'Local donor', phone: '70123456' } });
    const item = await db.bookInventoryItem.create({ data: { sku: randomUUID(), slug: randomUUID(), title: 'Fixture', author: 'Fixture', category: 'FICTION', language: 'ENGLISH', condition: 'GOOD', priceCents: 500, stockQuantity: 1, isPublished: true, status: 'AVAILABLE', editions: { create: { label: 'Fixture', stockQuantity: 1 } }, donorAllocations: { create: { donorId: donor.id, stockQuantity: 1 } } }, include: { editions: true, donorAllocations: true } });
    const input = { locale: 'en', package: 'SINGLE', purpose: 'SELF', selectionMode: 'CUSTOM', selectedBookIds: [item.id], selectedEditions: [{ bookId: item.id, editionId: item.editions[0].id }], customerName: 'Local Buyer', customerPhone: '70123456', fulfillmentMethod: 'PICKUP', paymentMethod: 'WHISH', termsAccepted: true, paymentAccessToken: randomBytes(32).toString('hex') };
    const [a, b] = await Promise.all([createLiveWhishBookOrder(db, input), createLiveWhishBookOrder(db, input)]);
    expect(a.id).toBe(b.id);
    const context: OrderContext = { kind: 'BOOK', orderId: a.id, reference: a.reference, amountCents: a.amountCents, returnPath: '/en/books/payment/' + a.reference };
    return { context, item, input, quantities: async () => (await Promise.all([db.bookInventoryItem.findUniqueOrThrow({ where: { id: item.id } }), db.bookInventoryEdition.findUniqueOrThrow({ where: { id: item.editions[0].id } }), db.bookInventoryDonorAllocation.findUniqueOrThrow({ where: { id: item.donorAllocations[0].id } })])).map(row => row.stockQuantity) };
  }
  it('uses the saved USD 9.99 price and grants access only after provider verification, once', async () => {
    const f = await ebook();
    expect((await createLiveWhishEbookOrder(db, f.reader.id, f.input)).id).toBe(f.order.id);
    const [a, b] = await Promise.all([liveOrderCheckout(f.context, 'start'), liveOrderCheckout(f.context, 'start')]);
    expect(a.attempt?.id).toBe(b.attempt?.id);
    expect(provider.create.mock.calls.every(([body]) => body.amount === '9.99')).toBe(true);
    expect(await db.ebookAccess.count({ where: { readerId: f.reader.id } })).toBe(0);
    provider.status.mockResolvedValue('success');
    await Promise.all([checkLiveWhish(a.attempt!.id), checkLiveWhish(a.attempt!.id)]);
    expect(await db.ebookAccess.count({ where: { readerId: f.reader.id, active: true } })).toBe(1);
    expect(await db.ebookEmail.count({ where: { orderId: f.order.id } })).toBe(1);
    expect(await db.ebookOrderEvent.count({ where: { orderId: f.order.id, action: 'WHISH_PAYMENT_CONFIRMED' } })).toBe(1);
  });
  it('reserves all stock quantities once; refund restores them once', async () => {
    const f = await book(); expect(await f.quantities()).toEqual([0, 0, 0]);
    const a = (await liveOrderCheckout(f.context, 'start')).attempt!;
    provider.status.mockResolvedValue('success'); await checkLiveWhish(a.id);
    expect(await f.quantities()).toEqual([0, 0, 0]);
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: f.context.orderId } })).paymentStatus).toBe('PAID');
    provider.status.mockResolvedValue('refunded'); await Promise.all([checkLiveWhish(a.id), checkLiveWhish(a.id)]);
    expect(await f.quantities()).toEqual([1, 1, 1]);
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: f.context.orderId } })).status).toBe('CANCELLED');
  });
  it('revokes only the refunded ebook entitlement, without stale callbacks restoring it', async () => {
    const f = await ebook(), a = (await liveOrderCheckout(f.context, 'start')).attempt!;
    provider.status.mockResolvedValue('success'); await checkLiveWhish(a.id);
    provider.status.mockResolvedValue('refunded'); await checkLiveWhish(a.id);
    provider.status.mockResolvedValue('success'); await checkLiveWhish(a.id);
    expect(await db.ebookAccess.count({ where: { readerId: f.reader.id, active: true } })).toBe(0);
    expect((await db.ebookOrder.findUniqueOrThrow({ where: { id: f.order.id } })).state).toBe('REFUNDED');
    expect(await db.ebookEmail.count({ where: { orderId: f.order.id, cancelled: false } })).toBe(1);
  });
  it('rejects forged callbacks before provider I/O and rejects sandbox ids', async () => {
    const f = await ebook(), a = (await liveOrderCheckout(f.context, 'start')).attempt!;
    await expect(checkLiveWhish(a.id, 'a'.repeat(64))).rejects.toThrow('INVALID_CALLBACK');
    expect(provider.status).not.toHaveBeenCalled();
    await expect(checkLiveWhish(randomUUID(), 'a'.repeat(64))).rejects.toThrow('ATTEMPT_NOT_FOUND');
  });
  it('recovers uncertain create with the identical request and externalId', async () => {
    const f = await ebook(); provider.create.mockRejectedValueOnce(new WhishError('TRANSPORT_UNCERTAIN', true));
    const a = await liveOrderCheckout(f.context, 'start');
    const b = await liveOrderCheckout(f.context, 'start');
    expect(a.attempt?.id).toBe(b.attempt?.id);
    expect(provider.create.mock.calls[0][0]).toEqual(provider.create.mock.calls[1][0]);
    expect(b.attempt?.collectUrl).toBeTruthy();
  });
  it('requires definitive failure before issuing a new payment reference', async () => {
    const f = await ebook(), first = (await liveOrderCheckout(f.context, 'start')).attempt!;
    const pending = await liveOrderCheckout(f.context, 'retry'); expect(pending.attempt?.id).toBe(first.id);
    provider.status.mockResolvedValue('failed');
    const retry = await liveOrderCheckout(f.context, 'retry'); expect(retry.attempt?.id).not.toBe(first.id);
  });
  it('continues checking saved payments after new payments are disabled', async () => {
    const f = await ebook(), a = (await liveOrderCheckout(f.context, 'start')).attempt!;
    vi.stubEnv('WHISH_PAY_LIVE_ENABLED', 'false'); provider.status.mockResolvedValue('success');
    expect((await liveOrderCheckout(f.context, 'check')).completed).toBe(true);
    await expect(liveOrderCheckout(f.context, 'start')).rejects.toThrow('LIVE_PAYMENTS_DISABLED');
    expect((await loadLiveAttempt(a.id)).applied).toBe(true);
  });
  it('keeps late paid orders for review after stock was released', async () => {
    const f = await book(), a = (await liveOrderCheckout(f.context, 'start')).attempt!;
    await db.bookWhishPayment.update({ where: { orderId: f.context.orderId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await db.$transaction(async tx => { const p = await tx.bookWhishPayment.findUniqueOrThrow({ where: { orderId: f.context.orderId }, include: { order: true } }); await expireLockedPayment(tx, p); });
    provider.status.mockResolvedValue('success'); await checkLiveWhish(a.id);
    expect((await loadLiveAttempt(a.id)).reviewReason).toBeTruthy();
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: f.context.orderId } })).paymentStatus).not.toBe('PAID');
    expect(await f.quantities()).toEqual([1, 1, 1]);
  });
  it('blocks payment amount tampering before fulfillment', async () => {
    const f = await ebook(), a = (await liveOrderCheckout(f.context, 'start')).attempt!;
    await db.ebookOrder.update({ where: { id: f.order.id }, data: { priceCents: 100 } });
    provider.status.mockResolvedValue('success'); await expect(checkLiveWhish(a.id)).rejects.toThrow('ORDER_CHANGED');
    expect(await db.ebookAccess.count({ where: { readerId: f.reader.id } })).toBe(0);
  });
  it('allows the owning reader without an admin cookie, denies other sessions and origins', async () => {
    const f = await ebook();
    const request = (token: string, origin = 'https://www.theleeexperience.com') => new NextRequest(origin + '/api/ebooks/orders/' + f.order.id + '/whish-live', { method: 'POST', headers: { origin, cookie: 'ebook-reader=' + token, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'check' }) });
    expect((await liveWhishRoute(request(f.token), 'EBOOK', f.order.id)).status).toBe(200);
    expect((await liveWhishRoute(request('a'.repeat(64)), 'EBOOK', f.order.id)).status).toBe(401);
    expect((await liveWhishRoute(request(f.token, 'https://evil.example'), 'EBOOK', f.order.id)).status).toBe(403);
  });
  it('respects the public payment-method switch before creating another order', async () => {
    const f = await ebook();
    await db.bookWhishSettings.upsert({ where: { id: 'checkout-payment-methods' }, create: { id: 'checkout-payment-methods', updatedBy: 'test', config: { WHISH: false, BANK_AUDI: false, CASH: true } }, update: { config: { WHISH: false, BANK_AUDI: false, CASH: true } } });
    const request = new NextRequest('https://www.theleeexperience.com/api/ebooks/orders', { method: 'POST', headers: { origin: 'https://www.theleeexperience.com', cookie: 'ebook-reader=' + f.token, 'content-type': 'application/json' }, body: JSON.stringify(f.input) });
    expect((await ebookCheckout(request)).status).toBe(409);
    expect(await db.ebookOrder.count({ where: { readerId: f.reader.id } })).toBe(1);
    expect(provider.create).not.toHaveBeenCalled();
  });
  it('reconciles ebook and physical payments when callbacks are missing', async () => {
    const e = await ebook(), b = await book();
    const a = (await liveOrderCheckout(e.context, 'start')).attempt!, c = (await liveOrderCheckout(b.context, 'start')).attempt!;
    for (const id of [a.id, c.id]) { const saved = await loadLiveAttempt(id); await db.bookWhishSettings.update({ where: { id: livePrefix + id }, data: { config: { ...saved, nextCheckAt: new Date(0).toISOString() } } }); }
    provider.status.mockResolvedValue('success'); await reconcileLiveWhish();
    expect((await loadLiveAttempt(a.id)).applied).toBe(true); expect((await loadLiveAttempt(c.id)).applied).toBe(true);
  });
  it('does not send refund requests until allowlisted egress is explicitly enabled', async () => {
    await expect(refundLiveWhish(randomUUID(), 'Requested by customer', 'admin', 999)).rejects.toThrow('REFUND_EGRESS_NOT_ENABLED');
    expect(provider.refund).not.toHaveBeenCalled();
  });
  it('confirms refund with provider status before revoking access and retries the original reason', async () => {
    const f = await ebook(), a = (await liveOrderCheckout(f.context, 'start')).attempt!;
    provider.status.mockResolvedValue('success'); await checkLiveWhish(a.id);
    vi.stubEnv('WHISH_PAY_LIVE_REFUNDS_ENABLED', 'true');
    provider.refund.mockRejectedValueOnce(new WhishError('TRANSPORT_UNCERTAIN', true));
    await expect(refundLiveWhish(a.id, 'Original request', 'local-admin', 999)).rejects.toThrow('TRANSPORT_UNCERTAIN');
    expect(await db.ebookAccess.count({ where: { readerId: f.reader.id, active: true } })).toBe(1);
    provider.status.mockResolvedValueOnce('success').mockResolvedValue('refunded');
    expect(await refundLiveWhish(a.id, 'Changed request', 'local-admin', 999)).toEqual({ refunded: true });
    expect(provider.refund.mock.calls[0]).toEqual(provider.refund.mock.calls[1]);
    expect(provider.refund.mock.calls[1][1]).toBe('Original request');
    expect(await db.ebookAccess.count({ where: { readerId: f.reader.id, active: true } })).toBe(0);
    expect(await refundLiveWhish(a.id, 'Repeated request', 'local-admin', 999)).toEqual({ refunded: true });
    expect(provider.refund).toHaveBeenCalledTimes(2);
  });
});
