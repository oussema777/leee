import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { startCheckout, checkResult } from './checkout';
import { finalizeCustomerTest } from './customer-finalize';
import { releaseOrderStock } from '@/lib/book-orders/whish-server';

const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url)) throw Error('Local test database required');
describe.skipIf(!url)('customer sandbox finalization', () => {
  const db = new PrismaClient({ datasources: { db: { url: url || 'postgresql://postgres@127.0.0.1:55441/aramex_test' } } });
  const bookIds: string[] = [], ebookIds: string[] = [];
  let readerId: string, ebookId: string;
  const snapshot = { provider: 'CYBERSOURCE', environment: 'TEST', testMode: true, amountCents: 900, currency: 'USD', supportPhone: '9613600747' };
  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', 'local-only-test-secret'.repeat(3));
    vi.stubEnv('CYBERSOURCE_TEST_MERCHANT_ID', 'test'); vi.stubEnv('CYBERSOURCE_TEST_KEY_ID', 'test'); vi.stubEnv('CYBERSOURCE_TEST_SECRET_KEY', Buffer.alloc(32, 7).toString('base64'));
    readerId = (await db.ebookReader.create({ data: { email: randomUUID() + '@example.test' } })).id;
    ebookId = (await db.ebook.create({ data: { slug: randomUUID(), titleEn: 'Test', author: 'Test', priceCents: 900 } })).id;
  });
  afterAll(async () => {
    await db.cybersourceTestAttempt.deleteMany({ where: { OR: [{ bookOrderId: { in: bookIds } }, { ebookOrderId: { in: ebookIds } }] } });
    await db.bookWhishEvent.deleteMany({ where: { payment: { orderId: { in: bookIds } } } });
    await db.bookWhishPayment.deleteMany({ where: { orderId: { in: bookIds } } });
    await db.bookOrder.deleteMany({ where: { id: { in: bookIds } } });
    await db.ebookAccess.deleteMany({ where: { readerId } });
    await db.ebookOrderEvent.deleteMany({ where: { orderId: { in: ebookIds } } });
    await db.ebookOrder.deleteMany({ where: { id: { in: ebookIds } } });
    if (ebookId) await db.ebook.delete({ where: { id: ebookId } });
    if (readerId) await db.ebookReader.delete({ where: { id: readerId } });
    await db.$disconnect(); vi.unstubAllEnvs();
  });
  async function book(real = false) {
    const order = await db.bookOrder.create({ data: { reference: (real ? 'LEE-BK-' : 'LEE-TEST-') + randomUUID(), locale: 'en', package: 'SINGLE', purpose: 'SELF', requestedBookCount: 1, priceCents: 900, customerName: 'Test', customerPhone: '70123456', fulfillmentMethod: 'PICKUP', paymentMethod: 'BANK_AUDI', whishPayment: { create: { snapshot, accessTokenHash: randomUUID(), requestHash: randomUUID(), expiresAt: new Date(Date.now() + 3600000) } } } });
    bookIds.push(order.id); return order;
  }
  async function captured(kind: 'BOOK' | 'EBOOK', reference: string, decline = false) {
    const session = await startCheckout(db, { kind, reference }, 'tester', false, async () => ({ sessionJwt: 'test', clientLibrary: 'https://testup.cybersource.com/uc/test.js', clientLibraryIntegrity: 'sha384-YWJj', expiresAt: new Date(Date.now() + 600000).toISOString() }));
    const transactionId = String(Date.now()) + Math.floor(Math.random() * 1e6);
    await checkResult(db, session.attempt.id, transactionId, async () => ({ id: transactionId, merchantId: 'test', clientReferenceInformation: { code: session.attempt.id }, orderInformation: { amountDetails: { totalAmount: '9.00', currency: 'USD' } }, applicationInformation: { applications: [{ name: 'ics_auth', reasonCode: decline ? 203 : 100, rCode: decline ? 0 : 1 }, ...(!decline ? [{ name: 'ics_bill', reasonCode: 100, rCode: 1 }] : [])] } }));
    return session.attempt.id;
  }
  it('confirms a dedicated test order once under concurrent callbacks', async () => {
    const order = await book(), id = await captured('BOOK', order.reference);
    expect(await Promise.all([finalizeCustomerTest(db, id), finalizeCustomerTest(db, id)])).toEqual([true, true]);
    expect(await db.bookOrder.findUnique({ where: { id: order.id } })).toMatchObject({ paymentStatus: 'PAID', status: 'NEW' });
    expect(await db.bookWhishEvent.count({ where: { payment: { orderId: order.id }, action: 'CARD_TEST_CAPTURED' } })).toBe(1);
  });
  it('does not release stock for a test order', async () => {
    const tx = { bookOrderItem: { findMany: vi.fn() } };
    await releaseOrderStock(tx as any, { id: 'test', selectionMode: 'CUSTOM', reference: 'LEE-TEST-123' });
    expect(tx.bookOrderItem.findMany).not.toHaveBeenCalled();
  });
  it('keeps diagnostic captures on real orders unpaid', async () => {
    const order = await book(true), id = await captured('BOOK', order.reference);
    await expect(finalizeCustomerTest(db, id)).rejects.toThrow('NOT_CUSTOMER_TEST');
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe('PENDING');
  });
  it.each(['cancelled', 'expired', 'changed', 'wrong-reference'])('rejects %s orders after capture', async mode => {
    const order = await book(), id = await captured('BOOK', order.reference);
    if (mode === 'cancelled') await db.bookOrder.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    if (mode === 'expired') await db.bookWhishPayment.update({ where: { orderId: order.id }, data: { expiresAt: new Date(0) } });
    if (mode === 'changed') await db.bookOrder.update({ where: { id: order.id }, data: { priceCents: 1000 } });
    if (mode === 'wrong-reference') await db.cybersourceTestAttempt.update({ where: { id }, data: { orderReference: 'different' } });
    await expect(finalizeCustomerTest(db, id)).rejects.toThrow();
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe('PENDING');
  });
  it('never fulfills declined or authorized-only payments', async () => {
    const order = await book(), id = await captured('BOOK', order.reference, true);
    expect(await finalizeCustomerTest(db, id)).toBe(false);
    await db.cybersourceTestAttempt.update({ where: { id }, data: { state: 'TEST_AUTHORIZED' } });
    expect(await finalizeCustomerTest(db, id)).toBe(false);
  });
  it('unlocks an ebook once and protects existing access from another order', async () => {
    async function create() {
      const order = await db.ebookOrder.create({ data: { readerId, ebookId, reference: 'EB-TEST-CARD-' + randomUUID(), title: 'Test', customerName: 'Tester', locale: 'en', priceCents: 900, method: 'BANK_AUDI', snapshot } });
      ebookIds.push(order.id); return order;
    }
    const order = await create(), other = await create();
    const id = await captured('EBOOK', order.reference), otherId = await captured('EBOOK', other.reference);
    expect(await Promise.all([finalizeCustomerTest(db, id), finalizeCustomerTest(db, id)])).toEqual([true, true]);
    expect(await db.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId, ebookId } } })).toMatchObject({ active: true, orderId: order.id });
    expect(await db.ebookOrderEvent.count({ where: { orderId: order.id, action: 'CARD_TEST_CAPTURED' } })).toBe(1);
    await expect(finalizeCustomerTest(db, otherId)).rejects.toThrow('DUPLICATE_PURCHASE');
    expect((await db.ebookAccess.findUniqueOrThrow({ where: { readerId_ebookId: { readerId, ebookId } } })).orderId).toBe(order.id);
  });
});
