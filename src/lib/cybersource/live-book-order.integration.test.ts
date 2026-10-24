import { createPrismaAdapter } from "../prisma-adapter.mjs";
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLiveBookOrder } from './live-book-order';
import { startLiveCheckout } from './live-checkout';
import { finalizeLiveCapture } from './live-finalize';
import { expireLockedPayment, lockOrder, tokenHash } from '@/lib/book-orders/whish-server';
const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url)) throw Error('Local test DB required');
const env = { CYBERSOURCE_LIVE_ORDER_CREATION_ENABLED: 'true', CYBERSOURCE_LIVE_MERCHANT_ID: 'local-create' };

describe.skipIf(!url)('live printed order creation - isolated DB', () => {
  const db = new PrismaClient({ adapter: createPrismaAdapter(url || 'postgresql://postgres@127.0.0.1:55441/aramex_test') });
  const tokens: string[] = [], itemIds: string[] = [], donorIds: string[] = [];
  let itemId: string, editionId: string, allocationId: string;
  beforeEach(async () => {
    vi.stubEnv('CYBERSOURCE_LIVE_SESSION_ENABLED', 'true');
    vi.stubEnv('JWT_SECRET', 'local-only-fixture-secret-'.repeat(3));
    const donor = await db.bookDonor.create({ data: { displayName: 'Local test', phone: '70123456' } }); donorIds.push(donor.id);
    const item = await db.bookInventoryItem.create({ data: { sku: randomUUID(), slug: randomUUID(), title: 'Fixture', author: 'Fixture', category: 'FICTION', language: 'ENGLISH', condition: 'GOOD', priceCents: 500, stockQuantity: 1, isPublished: true, status: 'AVAILABLE', editions: { create: { label: 'Fixture', stockQuantity: 1 } }, donorAllocations: { create: { donorId: donor.id, stockQuantity: 1 } } }, include: { editions: true, donorAllocations: true } });
    itemId = item.id; itemIds.push(item.id); editionId = item.editions[0].id; allocationId = item.donorAllocations[0].id;
  });
  afterAll(async () => {
    const payments = await db.bookWhishPayment.findMany({ where: { accessTokenHash: { in: tokens.map(tokenHash) } }, select: { orderId: true } });
    for (const { orderId } of payments) {
      await db.$executeRaw`DELETE FROM "CardPaymentOutbox" WHERE "attemptId" IN (SELECT "id" FROM "CybersourceLiveAttempt" WHERE "bookOrderId" = ${orderId})`;
      await db.$executeRaw`DELETE FROM "CybersourceLiveAttempt" WHERE "bookOrderId" = ${orderId}`;
      await db.bookWhishEvent.deleteMany({ where: { payment: { orderId } } });
      await db.bookWhishPayment.deleteMany({ where: { orderId } });
      await db.bookOrderItem.deleteMany({ where: { orderId } });
      await db.bookOrder.delete({ where: { id: orderId } });
    }
    await db.bookInventoryDonorAllocation.deleteMany({ where: { inventoryItemId: { in: itemIds } } });
    await db.bookInventoryEdition.deleteMany({ where: { inventoryItemId: { in: itemIds } } });
    await db.bookInventoryItem.deleteMany({ where: { id: { in: itemIds } } });
    await db.bookDonor.deleteMany({ where: { id: { in: donorIds } } });
    await db.$disconnect(); vi.unstubAllEnvs();
  });
  function input() {
    const paymentAccessToken = randomBytes(32).toString('hex'); tokens.push(paymentAccessToken);
    return { locale: 'en', package: 'SINGLE', purpose: 'SELF', selectionMode: 'CUSTOM', selectedBookIds: [itemId], selectedEditions: [{ bookId: itemId, editionId }], customerName: 'Local Buyer', customerPhone: '70123456', fulfillmentMethod: 'PICKUP', paymentMethod: 'BANK_AUDI', termsAccepted: true, paymentAccessToken };
  }
  async function quantities() {
    return Promise.all([db.bookInventoryItem.findUniqueOrThrow({ where: { id: itemId } }), db.bookInventoryEdition.findUniqueOrThrow({ where: { id: editionId } }), db.bookInventoryDonorAllocation.findUniqueOrThrow({ where: { id: allocationId } })]).then(rows => rows.map(r => r.stockQuantity));
  }
  async function capture(id: string) {
    vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'true');
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "state" = 'VERIFIED_CAPTURE', "verifiedAt" = CURRENT_TIMESTAMP, "transactionId" = ${String(Date.now()) + String(Math.floor(Math.random() * 1e8))} WHERE "id" = ${id}`;
    return finalizeLiveCapture(db, id);
  }
  it('is disabled before storage access', async () => {
    const transaction = vi.fn();
    await expect(createLiveBookOrder({ $transaction: transaction } as any, {}, {})).rejects.toThrow('DISABLED');
    expect(transaction).not.toHaveBeenCalled();
  });
  it('double-click creates one intent and reserves all three quantities once', async () => {
    const data = input();
    const [a, b] = await Promise.all([createLiveBookOrder(db, data, env), createLiveBookOrder(db, data, env)]);
    expect(a).toEqual(b); expect(a.amountCents).toBe(500); expect(a.attemptId).toMatch(/^LEE-L-/);
    expect(await quantities()).toEqual([0, 0, 0]);
    expect(await capture(a.attemptId)).toEqual({ state: 'APPLIED' });
    expect(await quantities()).toEqual([0, 0, 0]);
    expect(await createLiveBookOrder(db, data, env)).toEqual(a);
  });
  it('allows only one buyer to reserve the final copy', async () => {
    const results = await Promise.allSettled([createLiveBookOrder(db, input(), env), createLiveBookOrder(db, input(), env)]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
    expect(await quantities()).toEqual([0, 0, 0]);
  });
  it('rolls back reservations and order when intent persistence fails', async () => {
    const data = input();
    const failing = { $transaction: (fn: (tx: any) => Promise<unknown>) => db.$transaction(tx => fn(new Proxy(tx, { get(target, key) {
      if (key === '$executeRaw') return () => { throw Error('INTENT_FAILED'); };
      return Reflect.get(target, key);
    } }))) } as any;
    await expect(createLiveBookOrder(failing, data, env)).rejects.toThrow('INTENT_FAILED');
    expect(await quantities()).toEqual([1, 1, 1]);
    expect(await db.bookWhishPayment.findUnique({ where: { accessTokenHash: tokenHash(data.paymentAccessToken) } })).toBeNull();
  });
  it('rejects changed replay and computes delivery price on the server', async () => {
    const data = { ...input(), fulfillmentMethod: 'DELIVERY', governorate: 'BEIRUT', area: 'Test', detailedAddress: 'Local fixture', amountCents: 1 };
    const order = await createLiveBookOrder(db, data, env); expect(order.amountCents).toBe(900);
    await expect(createLiveBookOrder(db, { ...data, customerName: 'Changed' }, env)).rejects.toThrow('REPLAY_MISMATCH');
    expect(await quantities()).toEqual([0, 0, 0]);
  });
  it('preserves a curated donation preference without reserving it', async () => {
    const order = await createLiveBookOrder(db, { ...input(), purpose: 'DONATION', selectionMode: 'LEE_CHOICE', selectedEditions: [], fulfillmentMethod: 'LEE_DISTRIBUTION' }, env);
    expect(await quantities()).toEqual([1, 1, 1]);
    expect(await capture(order.attemptId)).toEqual({ state: 'APPLIED' });
    expect(await quantities()).toEqual([1, 1, 1]);
  });
  it('expiry releases once, preserves intent, and late capture requires review', async () => {
    const data = input(), order = await createLiveBookOrder(db, data, env);
    await db.bookWhishPayment.update({ where: { orderId: order.id }, data: { expiresAt: new Date(0) } });
    const expire = () => db.$transaction(async tx => {
      await lockOrder(tx, order.id);
      const p = await tx.bookWhishPayment.findUniqueOrThrow({ where: { orderId: order.id }, include: { order: true } });
      return expireLockedPayment(tx, p);
    });
    expect((await Promise.all([expire(), expire()])).sort()).toEqual([false, true]);
    expect(await quantities()).toEqual([1, 1, 1]);
    expect((await createLiveBookOrder(db, data, env)).id).toBe(order.id);
    expect(await capture(order.attemptId)).toMatchObject({ state: 'REVIEW_REQUIRED' });
    expect(await quantities()).toEqual([1, 1, 1]);
  });
  it('rolls back an edition decrement when its parent book was withdrawn', async () => {
    await db.bookInventoryItem.update({ where: { id: itemId }, data: { isPublished: false } });
    await expect(createLiveBookOrder(db, input(), env)).rejects.toThrow('BOOK_UNAVAILABLE');
    expect(await quantities()).toEqual([1, 1, 1]);
  });
  it('does not release paid stock when expiry runs after successful settlement', async () => {
    const order = await createLiveBookOrder(db, input(), env);
    expect(await capture(order.attemptId)).toEqual({ state: 'APPLIED' });
    await db.bookWhishPayment.update({ where: { orderId: order.id }, data: { expiresAt: new Date(0) } });
    expect(await db.$transaction(async tx => {
      await lockOrder(tx, order.id);
      return expireLockedPayment(tx, await tx.bookWhishPayment.findUniqueOrThrow({ where: { orderId: order.id }, include: { order: true } }));
    })).toBe(false);
    expect(await quantities()).toEqual([0, 0, 0]);
  });
  const session = () => ({ sessionJwt: 'local-fixture', clientLibrary: 'https://up.cybersource.com/uc/test.js', clientLibraryIntegrity: 'sha384-YWJj', expiresAt: new Date(Date.now() + 600000).toISOString() });
  it('persists one encrypted session under concurrent starts and resumes it', async () => {
    const order = await createLiveBookOrder(db, input(), env), value = session();
    const create = vi.fn(async () => value);
    await Promise.all([startLiveCheckout(db, order.attemptId, create), startLiveCheckout(db, order.attemptId, create)]);
    expect(create).toHaveBeenCalledTimes(1);
    expect(await startLiveCheckout(db, order.attemptId, create)).toEqual({ state: 'READY', session: value });
    const rows = await db.$queryRaw<{ sessionCipher: string }[]>`SELECT "sessionCipher" FROM "CybersourceLiveAttempt" WHERE "id" = ${order.attemptId}`;
    expect(rows[0].sessionCipher).not.toContain('local-fixture');
  });
  it('does not repeat an ambiguous provider request or an expired session', async () => {
    const order = await createLiveBookOrder(db, input(), env);
    const create = vi.fn(async () => { throw Error('NETWORK_LOST'); });
    expect((await startLiveCheckout(db, order.attemptId, create)).session).toBeNull();
    expect((await startLiveCheckout(db, order.attemptId, create)).session).toBeNull();
    expect(create).toHaveBeenCalledTimes(1);
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "sessionState" = 'READY', "sessionExpiresAt" = '2000-01-01' WHERE "id" = ${order.attemptId}`;
    expect((await startLiveCheckout(db, order.attemptId, create)).session).toBeNull();
    expect(create).toHaveBeenCalledTimes(1);
  });
  it('holds an interrupted creation instead of opening another card form', async () => {
    const order = await createLiveBookOrder(db, input(), env);
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "sessionState" = 'CREATING' WHERE "id" = ${order.attemptId}`;
    const create = vi.fn(async () => session());
    expect((await startLiveCheckout(db, order.attemptId, create)).session).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });
  it('withholds a session if the reservation expires during provider creation', async () => {
    const order = await createLiveBookOrder(db, input(), env);
    const create = vi.fn(async () => {
      await db.bookWhishPayment.update({ where: { orderId: order.id }, data: { expiresAt: new Date(0) } });
      return session();
    });
    expect((await startLiveCheckout(db, order.attemptId, create)).session).toBeNull();
    await expect(startLiveCheckout(db, order.attemptId, create)).rejects.toThrow('NOT_PAYABLE');
    expect(create).toHaveBeenCalledTimes(1);
  });
});
