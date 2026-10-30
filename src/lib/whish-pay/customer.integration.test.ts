import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const provider = vi.hoisted(() => ({ create: vi.fn(), status: vi.fn() }));
vi.mock('./client', async original => ({ ...await original<typeof import('./client')>(), whishClient: () => provider }));
import { db } from '@/lib/db';
import { whishSnapshot, type OrderContext } from './policy';
import { checkAttempt, load, prefix } from './sandbox';
import { finalizeWhishOrder, orderCheckout } from './customer';
import { whishCustomerRoute } from './customer-route';
import { tokenHash, releaseOrderStock } from '@/lib/book-orders/whish-server';
import { createToken } from '@/lib/auth';
import { WhishError } from './client';
import { createWhishReviewOrder, reviewerId } from './reviewer';

const enabled = process.env.WHISH_TEST_DATABASE === 'true';
if (enabled && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(process.env.DATABASE_URL || '')) throw Error('Isolated local DB required');
describe.skipIf(!enabled)('Whish customer checkout with PostgreSQL locks', () => {
  const books: string[] = [], ebooks: string[] = [], pointers: string[] = [];
  let readerId: string, ebookId: string, adminId: string, jwt: string;
  const token = 'c'.repeat(64);
  beforeAll(async () => {
    vi.stubEnv('WHISH_PAY_SANDBOX_ENABLED', 'true'); vi.stubEnv('WHISH_PAY_CUSTOMER_TEST_ENABLED', 'true');
    vi.stubEnv('WHISH_PAY_CHANNEL', 'test'); vi.stubEnv('WHISH_PAY_SECRET', 'test'); vi.stubEnv('WHISH_PAY_WEBSITE_URL', 'theleeexperience.com'); vi.stubEnv('WHISH_PAY_PUBLIC_ORIGIN', 'https://www.theleeexperience.com'); vi.stubEnv('JWT_SECRET', 'local-test-secret'.repeat(4));
    readerId = (await db.ebookReader.create({ data: { email: randomUUID() + '@example.test' } })).id;
    ebookId = (await db.ebook.create({ data: { slug: randomUUID(), titleEn: 'Whish integration fixture', author: 'Test', priceCents: 725 } })).id;
    const admin = await db.user.create({ data: { email: randomUUID() + '@example.test', name: 'Test', role: 'ADMIN', password: 'unused' } });
    adminId = admin.id; jwt = await createToken({ userId: admin.id, email: admin.email, role: admin.role });
  });
  beforeEach(() => { provider.create.mockReset().mockResolvedValue('https://whish.money/pay/test'); provider.status.mockReset().mockResolvedValue('pending'); });
  afterAll(async () => {
    // Only this suite's exact ids are removed; no production database is permitted.
    await db.bookWhishSettings.deleteMany({ where: { OR: [{ id: { in: pointers } }, ...[...books, ...ebooks].map(id => ({ config: { path: ['order', 'orderId'], equals: id } }))] } });
    await db.bookWhishEvent.deleteMany({ where: { payment: { orderId: { in: books } } } });
    await db.bookWhishPayment.deleteMany({ where: { orderId: { in: books } } });
    await db.bookOrder.deleteMany({ where: { id: { in: books } } });
    await db.ebookAccess.deleteMany({ where: { readerId } });
    await db.ebookOrderEvent.deleteMany({ where: { orderId: { in: ebooks } } });
    await db.ebookOrder.deleteMany({ where: { id: { in: ebooks } } });
    await db.ebook.delete({ where: { id: ebookId } }); await db.ebookReader.delete({ where: { id: readerId } });
    await db.user.delete({ where: { id: adminId } });
    await db.$disconnect(); vi.unstubAllEnvs();
  });
  async function book(): Promise<OrderContext> {
    const order = await db.bookOrder.create({ data: { reference: 'LEE-TEST-WHISH-' + randomUUID(), locale: 'en', package: 'SINGLE', purpose: 'SELF', requestedBookCount: 1, priceCents: 900, customerName: 'Whish Test', customerPhone: '70123456', fulfillmentMethod: 'DELIVERY', paymentMethod: 'WHISH', whishPayment: { create: { snapshot: whishSnapshot(900), accessTokenHash: tokenHash(books.length ? randomUUID() : token), requestHash: randomUUID(), expiresAt: new Date(Date.now() + 3600000) } } } });
    books.push(order.id); pointers.push('whish-checkout:BOOK:' + order.id);
    return { kind: 'BOOK', orderId: order.id, reference: order.reference, amountCents: 900, returnPath: '/en/books/payment/' + order.reference };
  }
  async function ebook(): Promise<OrderContext> {
    const order = await db.ebookOrder.create({ data: { readerId, ebookId, reference: 'EB-TEST-WHISH-' + randomUUID(), title: 'Test', customerName: 'Test', locale: 'en', priceCents: 725, method: 'WHISH', snapshot: whishSnapshot(725) } });
    ebooks.push(order.id); pointers.push('whish-checkout:EBOOK:' + order.id);
    return { kind: 'EBOOK', orderId: order.id, reference: order.reference, amountCents: 725, returnPath: '/en/ebooks/orders/' + order.id };
  }
  it('requires both a payment administrator and the private book token, and rejects amount overrides', async () => {
    const c = await book();
    const request = (cookie = true, bearer = true, extra = {}) => new NextRequest('https://www.theleeexperience.com/api/public/book-orders/' + c.reference + '/whish-pay', { method: 'POST', headers: { origin: 'https://www.theleeexperience.com', 'content-type': 'application/json', ...(cookie ? { cookie: 'admin-token=' + jwt } : {}), ...(bearer ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ action: 'start', ...extra }) });
    expect((await whishCustomerRoute(request(false), 'BOOK', c.reference)).status).toBe(401);
    expect((await whishCustomerRoute(request(true, false), 'BOOK', c.reference)).status).toBe(404);
    expect((await whishCustomerRoute(request(true, true, { amount: '1' }), 'BOOK', c.reference)).status).toBe(400);
    expect((await whishCustomerRoute(request(), 'BOOK', c.reference)).status).toBe(200);
    expect(provider.create.mock.calls[0][0].amount).toBe('9.00');
  });
  it('uses one persisted attempt under concurrent starts and fulfills once under concurrent callbacks', async () => {
    const c = await book();
    const result = await Promise.all([orderCheckout(c, 'start', adminId), orderCheckout(c, 'start', adminId)]);
    const id = result[0].attempt!.id; expect(result[1].attempt!.id).toBe(id);
    const bodies = provider.create.mock.calls.map(call => call[0]); expect(bodies.every(body => JSON.stringify(body) === JSON.stringify(bodies[0]))).toBe(true);
    provider.status.mockResolvedValue('success');
    const callbackToken = new URL((await load(id)).request.successCallbackUrl).searchParams.get('token')!;
    await Promise.all([checkAttempt(id, callbackToken), checkAttempt(id, callbackToken), checkAttempt(id)]);
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: c.orderId } })).paymentStatus).toBe('PAID');
    expect(await db.bookWhishEvent.count({ where: { payment: { orderId: c.orderId }, action: 'WHISH_TEST_PAID' } })).toBe(1);
    provider.status.mockResolvedValue('pending'); await checkAttempt(id);
    expect((await load(id)).status).toBe('success');
  });
  it('does not fulfill pending/failure/unknown states and creates a fresh reference only after definitive failure', async () => {
    const c = await book(), first = (await orderCheckout(c, 'start', adminId)).attempt!;
    expect((await orderCheckout(c, 'retry', adminId)).attempt!.id).toBe(first.id);
    expect(await finalizeWhishOrder(first.id)).toBe(false);
    provider.status.mockResolvedValue('failed');
    const next = (await orderCheckout(c, 'retry', adminId)).attempt!;
    expect(next.id).not.toBe(first.id);
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: c.orderId } })).paymentStatus).toBe('PENDING');
  });
  it('recovers the exact saved request after a network timeout', async () => {
    const c = await book(); provider.create.mockRejectedValueOnce(new WhishError('TRANSPORT_UNCERTAIN', true));
    const first = (await orderCheckout(c, 'start', adminId)).attempt!;
    const next = (await orderCheckout(c, 'start', adminId)).attempt!;
    expect(next.id).toBe(first.id); expect(provider.create.mock.calls[1][0]).toEqual(provider.create.mock.calls[0][0]);
  });
  it.each(['amount', 'cancelled', 'non-test'])('refuses to fulfill an %s order after provider success', async reason => {
    const c = await book(), a = (await orderCheckout(c, 'start', adminId)).attempt!;
    if (reason === 'amount') await db.bookOrder.update({ where: { id: c.orderId }, data: { priceCents: 1000 } });
    if (reason === 'cancelled') await db.bookOrder.update({ where: { id: c.orderId }, data: { status: 'CANCELLED' } });
    if (reason === 'non-test') await db.bookOrder.update({ where: { id: c.orderId }, data: { reference: 'LEE-BK-' + randomUUID() } });
    provider.status.mockResolvedValue('success'); await expect(checkAttempt(a.id)).rejects.toThrow();
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: c.orderId } })).paymentStatus).toBe('PENDING');
  });
  it('does not release real stock for sandbox orders', async () => {
    const tx = { bookOrderItem: { findMany: vi.fn() } }; await releaseOrderStock(tx as never, { id: 'test', reference: 'LEE-TEST-WHISH-123', selectionMode: 'CUSTOM' }); expect(tx.bookOrderItem.findMany).not.toHaveBeenCalled();
  });
  it('unlocks the ebook once after verified success and protects it from duplicate purchases', async () => {
    const c = await ebook(), other = await ebook();
    const a = (await orderCheckout(c, 'start', adminId)).attempt!, b = (await orderCheckout(other, 'start', adminId)).attempt!;
    expect(provider.create.mock.calls[0][0].amount).toBe('7.25');
    expect(await db.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId, ebookId } } })).toBeNull();
    provider.status.mockResolvedValue('success'); await Promise.all([checkAttempt(a.id), checkAttempt(a.id)]);
    expect(await db.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId, ebookId } } })).toMatchObject({ active: true, orderId: c.orderId });
    expect(await db.ebookOrderEvent.count({ where: { orderId: c.orderId, action: 'WHISH_TEST_PAID' } })).toBe(1);
    await expect(checkAttempt(b.id)).rejects.toThrow('DUPLICATE_PURCHASE');
  });
  it('grants a bounded reviewer checkout without admin access and supports revocation', async () => {
    const token = 'd'.repeat(64), grantId = reviewerId(token); pointers.push(grantId);
    await db.bookWhishSettings.create({ data: { id: grantId, updatedBy: 'test', config: { enabled: true, environment: 'SANDBOX', expiresAt: new Date(Date.now() + 3600000).toISOString() } } });
    const requestId = randomUUID();
    const first = await createWhishReviewOrder(token, requestId);
    expect(await createWhishReviewOrder(token, requestId)).toEqual(first);
    const order = await db.bookOrder.findUniqueOrThrow({ where: { reference: first.reference } });
    books.push(order.id); pointers.push('whish-checkout:BOOK:' + order.id);
    const req = () => new NextRequest('https://www.theleeexperience.com/api/public/book-orders/' + first.reference + '/whish-pay', { method: 'POST', headers: { origin: 'https://www.theleeexperience.com', 'content-type': 'application/json', authorization: 'Bearer ' + first.token }, body: JSON.stringify({ action: 'start' }) });
    expect((await whishCustomerRoute(req(), 'BOOK', first.reference)).status).toBe(200);
    expect(provider.create.mock.calls[0][0].amount).toBe('1.00');
    await db.bookWhishSettings.update({ where: { id: grantId }, data: { config: { enabled: false, environment: 'SANDBOX', expiresAt: new Date(Date.now() + 3600000).toISOString() } } });
    expect((await whishCustomerRoute(req(), 'BOOK', first.reference)).status).toBe(401);
    await expect(createWhishReviewOrder(token, randomUUID())).rejects.toThrow('REVIEW_LINK_EXPIRED');
  });
  it('rejects expired and fabricated reviewer grants', async () => {
    await expect(createWhishReviewOrder('e'.repeat(64), randomUUID())).rejects.toThrow('REVIEW_LINK_EXPIRED');
    const token = 'f'.repeat(64), id = reviewerId(token); pointers.push(id);
    await db.bookWhishSettings.create({ data: { id, updatedBy: 'test', config: { enabled: true, environment: 'SANDBOX', expiresAt: new Date(0).toISOString() } } });
    await expect(createWhishReviewOrder(token, randomUUID())).rejects.toThrow('REVIEW_LINK_EXPIRED');
  });
});
