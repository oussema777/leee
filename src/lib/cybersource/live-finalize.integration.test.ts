import { createPrismaAdapter } from "../prisma-adapter.mjs";
import { randomInt, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { finalizeLiveCapture } from './live-finalize';
const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url)) throw Error('Local test database required');

describe.skipIf(!url)('disabled live settlement preparation - isolated fixtures only', () => {
  const db = new PrismaClient({ adapter: createPrismaAdapter(url || 'postgresql://postgres@127.0.0.1:55441/aramex_test') });
  const books: string[] = [], ebooks: string[] = [], attempts: string[] = [];
  let itemId: string, editionId: string, readerId: string, ebookId: string;
  const snapshot = { provider: 'CYBERSOURCE', environment: 'PRODUCTION', testMode: false, merchantId: 'local-fixture', amountCents: 900, currency: 'USD', stockReservation: 'HELD' };
  beforeAll(async () => {
    vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'true');
    const item = await db.bookInventoryItem.create({ data: { sku: randomUUID(), slug: randomUUID(), title: 'Local fixture', author: 'Local', category: 'FICTION', language: 'ENGLISH', condition: 'GOOD', priceCents: 900, stockQuantity: 7, editions: { create: { label: 'Test edition', stockQuantity: 7 } } }, include: { editions: true } });
    itemId = item.id; editionId = item.editions[0].id;
    readerId = (await db.ebookReader.create({ data: { email: randomUUID() + '@example.test' } })).id;
    ebookId = (await db.ebook.create({ data: { slug: randomUUID(), titleEn: 'Local fixture', author: 'Local', priceCents: 900 } })).id;
  });
  afterAll(async () => {
    for (const id of attempts) {
      await db.$executeRaw`DELETE FROM "CardPaymentOutbox" WHERE "attemptId" = ${id}`;
      await db.$executeRaw`DELETE FROM "CybersourceLiveAttempt" WHERE "id" = ${id}`;
    }
    await db.bookWhishEvent.deleteMany({ where: { payment: { orderId: { in: books } } } });
    await db.bookWhishPayment.deleteMany({ where: { orderId: { in: books } } });
    await db.bookOrderItem.deleteMany({ where: { orderId: { in: books } } });
    await db.bookOrder.deleteMany({ where: { id: { in: books } } });
    if (editionId) await db.bookInventoryEdition.delete({ where: { id: editionId } });
    if (itemId) await db.bookInventoryItem.delete({ where: { id: itemId } });
    if (readerId) await db.ebookAccess.deleteMany({ where: { readerId } });
    await db.ebookOrderEvent.deleteMany({ where: { orderId: { in: ebooks } } });
    await db.ebookOrder.deleteMany({ where: { id: { in: ebooks } } });
    if (ebookId) await db.ebook.delete({ where: { id: ebookId } }); if (readerId) await db.ebookReader.delete({ where: { id: readerId } });
    await db.$disconnect(); vi.unstubAllEnvs();
  });
  async function book() {
    const o = await db.bookOrder.create({ data: { reference: 'LEE-BK-' + randomUUID(), locale: 'en', package: 'SINGLE', purpose: 'SELF', requestedBookCount: 1, priceCents: 900, customerName: 'Local fixture', customerPhone: '70123456', fulfillmentMethod: 'PICKUP', paymentMethod: 'BANK_AUDI',
      items: { create: { inventoryItemId: itemId, editionId } },
      whishPayment: { create: { snapshot, accessTokenHash: randomUUID(), requestHash: randomUUID(), expiresAt: new Date(Date.now() + 3600000) } } } });
    books.push(o.id); return o;
  }
  async function captured(order: { id: string; reference: string }, kind: 'BOOK' | 'EBOOK' = 'BOOK', state = 'VERIFIED_CAPTURE') {
    const id = randomUUID(), transactionId = String(Date.now()) + String(randomInt(1e9)); attempts.push(id);
    await db.$executeRaw`INSERT INTO "CybersourceLiveAttempt" ("id", "bookOrderId", "ebookOrderId", "orderReference", "merchantId", "amountCents", "state", "transactionId", "verifiedAt") VALUES (${id}, ${kind === 'BOOK' ? order.id : null}, ${kind === 'EBOOK' ? order.id : null}, ${order.reference}, 'local-fixture', 900, ${state}, ${transactionId}, CURRENT_TIMESTAMP)`;
    return id;
  }
  const events = (id: string) => db.$queryRaw<{ event: string }[]>`SELECT "event" FROM "CardPaymentOutbox" WHERE "attemptId" = ${id}`;
  it('does not touch storage with the default-off gate', async () => {
    vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'false'); const tx = vi.fn();
    expect(await finalizeLiveCapture({ $transaction: tx } as any, 'any')).toEqual({ state: 'DISABLED' }); expect(tx).not.toHaveBeenCalled();
    vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'true');
  });
  it('confirms once under concurrent callbacks, queues one event and never deducts reserved stock again', async () => {
    const o = await book(), id = await captured(o);
    expect(await Promise.all([finalizeLiveCapture(db, id), finalizeLiveCapture(db, id)])).toEqual([{ state: 'APPLIED' }, { state: 'APPLIED' }]);
    expect(await db.bookOrder.findUnique({ where: { id: o.id } })).toMatchObject({ paymentStatus: 'PAID', status: 'CONFIRMED' });
    expect(await db.bookInventoryItem.findUnique({ where: { id: itemId } })).toMatchObject({ stockQuantity: 7 });
    expect(await db.bookInventoryEdition.findUnique({ where: { id: editionId } })).toMatchObject({ stockQuantity: 7 });
    expect(await events(id)).toEqual([{ event: 'PAYMENT_CONFIRMED' }]);
    expect(await db.bookWhishEvent.count({ where: { payment: { orderId: o.id }, action: 'CARD_PAYMENT_CAPTURED' } })).toBe(1);
    await db.bookOrder.update({ where: { id: o.id }, data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' } });
    await finalizeLiveCapture(db, id);
    expect(await db.bookOrder.findUnique({ where: { id: o.id } })).toMatchObject({ paymentStatus: 'REFUNDED', status: 'CANCELLED' });
  });
  it('does not fulfill an unverified ledger entry', async () => {
    const o = await book(), id = await captured(o, 'BOOK', 'READY');
    expect(await finalizeLiveCapture(db, id)).toEqual({ state: 'PENDING' }); expect(await events(id)).toHaveLength(0);
  });
  it('rolls back payment and audit updates if the durable confirmation event cannot be saved', async () => {
    const o = await book(), id = await captured(o);
    const failing = { $transaction: (fn: (tx: any) => Promise<unknown>) => db.$transaction(tx => fn(new Proxy(tx, {
      get(target, key) {
        if (key === '$executeRaw') return (...args: any[]) => {
          if (String(args[0]).includes('INSERT INTO "CardPaymentOutbox"')) throw Error('OUTBOX_UNAVAILABLE');
          return (target.$executeRaw as any)(...args);
        };
        return Reflect.get(target, key);
      },
    }))) } as any;
    await expect(finalizeLiveCapture(failing, id)).rejects.toThrow('OUTBOX_UNAVAILABLE');
    expect(await db.bookOrder.findUnique({ where: { id: o.id } })).toMatchObject({ status: 'NEW', paymentStatus: 'PENDING' });
    expect(await db.bookWhishEvent.count({ where: { payment: { orderId: o.id }, action: 'CARD_PAYMENT_CAPTURED' } })).toBe(0);
    expect(await events(id)).toHaveLength(0);
    expect(await finalizeLiveCapture(db, id)).toEqual({ state: 'APPLIED' });
  });
  it('enforces production isolation and unique provider transactions in storage', async () => {
    const o = await book(), a = await captured(o), b = await captured(o);
    await expect(db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "environment" = 'TEST' WHERE "id" = ${a}`).rejects.toThrow();
    await expect(db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "verifiedAt" = NULL WHERE "id" = ${a}`).rejects.toThrow();
    await expect(db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "transactionId" = (SELECT "transactionId" FROM "CybersourceLiveAttempt" WHERE "id" = ${a}) WHERE "id" = ${b}`).rejects.toThrow();
  });
  it.each(['cancelled', 'expired', 'wrong-amount', 'wrong-merchant', 'test-snapshot', 'test-reference', 'missing-reservation'])('keeps a captured %s order unpaid and queues review once', async mode => {
    const o = await book(), id = await captured(o);
    if (mode === 'cancelled') await db.bookOrder.update({ where: { id: o.id }, data: { status: 'CANCELLED' } });
    if (mode === 'expired') await db.bookWhishPayment.update({ where: { orderId: o.id }, data: { expiresAt: new Date(0) } });
    if (mode === 'wrong-amount') await db.bookOrder.update({ where: { id: o.id }, data: { priceCents: 901 } });
    if (mode === 'wrong-merchant') await db.bookWhishPayment.update({ where: { orderId: o.id }, data: { snapshot: { ...snapshot, merchantId: 'other' } } });
    if (mode === 'test-snapshot') await db.bookWhishPayment.update({ where: { orderId: o.id }, data: { snapshot: { ...snapshot, environment: 'TEST', testMode: true } } });
    if (mode === 'test-reference') await db.bookOrder.update({ where: { id: o.id }, data: { reference: 'LEE-TEST-' + randomUUID() } });
    if (mode === 'missing-reservation') await db.bookWhishPayment.update({ where: { orderId: o.id }, data: { snapshot: { ...snapshot, stockReservation: 'NOT_REQUIRED' } } });
    expect((await finalizeLiveCapture(db, id)).state).toBe('REVIEW_REQUIRED'); await finalizeLiveCapture(db, id);
    expect(await events(id)).toEqual([{ event: 'PAYMENT_REVIEW_REQUIRED' }]);
    expect(await db.bookOrder.findUnique({ where: { id: o.id } })).toMatchObject({ paymentStatus: 'PENDING' });
  });
  it('lets only one capture pay an order; a second successful charge needs review', async () => {
    const o = await book(), a = await captured(o), b = await captured(o);
    const results = await Promise.all([finalizeLiveCapture(db, a), finalizeLiveCapture(db, b)]);
    expect(results.map(r => r.state).sort()).toEqual(['APPLIED', 'REVIEW_REQUIRED']);
  });
  it('grants ebook access once, preserves revoked access on replay, and reviews duplicate purchases', async () => {
    const create = async () => {
      const o = await db.ebookOrder.create({ data: { readerId, ebookId, reference: 'EB-' + randomUUID(), title: 'Fixture', customerName: 'Fixture', locale: 'en', priceCents: 900, method: 'BANK_AUDI', snapshot } }); ebooks.push(o.id); return o;
    };
    const o = await create(), other = await create(), id = await captured(o, 'EBOOK'), otherId = await captured(other, 'EBOOK');
    await Promise.all([finalizeLiveCapture(db, id), finalizeLiveCapture(db, id)]);
    expect(await db.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId, ebookId } } })).toMatchObject({ active: true, orderId: o.id });
    expect(await events(id)).toEqual([{ event: 'PAYMENT_CONFIRMED' }]);
    expect((await finalizeLiveCapture(db, otherId)).state).toBe('REVIEW_REQUIRED');
    await db.ebookAccess.update({ where: { readerId_ebookId: { readerId, ebookId } }, data: { active: false } });
    await finalizeLiveCapture(db, id);
    expect(await db.ebookAccess.findUnique({ where: { readerId_ebookId: { readerId, ebookId } } })).toMatchObject({ active: false, orderId: o.id });
  });
});
