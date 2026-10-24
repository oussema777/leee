import { createPrismaAdapter } from "../prisma-adapter.mjs";
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLiveEbookOrder } from './live-ebook-order';
import { finalizeLiveCapture } from './live-finalize';
import { startLiveCheckout } from './live-checkout';
const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url)) throw Error('Local test DB required');
const env = { CYBERSOURCE_LIVE_ORDER_CREATION_ENABLED: 'true', CYBERSOURCE_LIVE_MERCHANT_ID: 'local-ebook' };
describe.skipIf(!url)('live ebook order preparation', () => {
  const db = new PrismaClient({ adapter: createPrismaAdapter(url || 'postgresql://postgres@127.0.0.1:55441/aramex_test') });
  const readers: string[] = [], books: string[] = [];
  let readerId: string, ebookId: string;
  beforeEach(async () => {
    readerId = (await db.ebookReader.create({ data: { email: randomUUID() + '@example.test' } })).id; readers.push(readerId);
    const ebook = await db.ebook.create({ data: { slug: randomUUID(), titleEn: 'Fixture', author: 'Fixture', priceCents: 700, published: true, versions: { create: { label: 'Fixture', pageCount: 1, ready: true } } }, include: { versions: true } });
    ebookId = ebook.id; books.push(ebook.id);
    await db.ebook.update({ where: { id: ebookId }, data: { activeVersionId: ebook.versions[0].id } });
  });
  afterAll(async () => {
    for (const readerId of readers) {
      for (const o of await db.ebookOrder.findMany({ where: { readerId } })) {
        await db.$executeRaw`DELETE FROM "CardPaymentOutbox" WHERE "attemptId" IN (SELECT "id" FROM "CybersourceLiveAttempt" WHERE "ebookOrderId" = ${o.id})`;
        await db.$executeRaw`DELETE FROM "CybersourceLiveAttempt" WHERE "ebookOrderId" = ${o.id}`;
      }
      await db.ebookAccess.deleteMany({ where: { readerId } });
      await db.ebookOrderEvent.deleteMany({ where: { order: { readerId } } });
      await db.ebookOrder.deleteMany({ where: { readerId } });
      await db.ebookReader.delete({ where: { id: readerId } });
    }
    await db.ebook.updateMany({ where: { id: { in: books } }, data: { activeVersionId: null } });
    await db.ebookVersion.deleteMany({ where: { ebookId: { in: books } } });
    await db.ebook.deleteMany({ where: { id: { in: books } } });
    await db.$disconnect(); vi.unstubAllEnvs();
  });
  const input = () => ({ ebookId, customerName: 'Local Buyer', method: 'BANK_AUDI', locale: 'en', termsAccepted: true, priceCents: 1 });
  it('saves one unpaid order and server price under concurrent requests', async () => {
    const [a, b] = await Promise.all([createLiveEbookOrder(db, readerId, input(), env), createLiveEbookOrder(db, readerId, input(), env)]);
    expect(a).toEqual(b); expect(a.amountCents).toBe(700);
    expect(await db.ebookAccess.count({ where: { readerId } })).toBe(0);
    expect((await db.ebookOrder.findUniqueOrThrow({ where: { id: a.id } })).state).toBe('AWAITING_PAYMENT');
  });
  it('opens a session using saved amount and grants access only after verified capture', async () => {
    const order = await createLiveEbookOrder(db, readerId, input(), env);
    vi.stubEnv('CYBERSOURCE_LIVE_SESSION_ENABLED', 'true'); vi.stubEnv('JWT_SECRET', 'fixture-secret-'.repeat(4));
    const create = vi.fn(async () => ({ sessionJwt: 'local-only', clientLibrary: 'https://up.cybersource.com/uc/test.js', clientLibraryIntegrity: 'sha384-YWJj', expiresAt: new Date(Date.now() + 600000).toISOString() }));
    await startLiveCheckout(db, order.attemptId, create);
    expect(create.mock.calls[0]).toEqual([700, order.attemptId, 'local-ebook', expect.any(AbortSignal)]);
    expect(await db.ebookAccess.count({ where: { readerId } })).toBe(0);
    vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'true');
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "state" = 'VERIFIED_CAPTURE', "verifiedAt" = CURRENT_TIMESTAMP, "transactionId" = ${String(Date.now()) + '777'} WHERE "id" = ${order.attemptId}`;
    expect(await finalizeLiveCapture(db, order.attemptId)).toEqual({ state: 'APPLIED' });
    expect(await db.ebookAccess.count({ where: { readerId, active: true } })).toBe(1);
    await expect(createLiveEbookOrder(db, readerId, input(), env)).rejects.toThrow('ALREADY_PURCHASED');
  });
  it('refuses unpublished ebooks', async () => {
    await db.ebook.update({ where: { id: ebookId }, data: { published: false } });
    await expect(createLiveEbookOrder(db, readerId, input(), env)).rejects.toThrow('UNAVAILABLE');
    expect(await db.ebookOrder.count({ where: { readerId } })).toBe(0);
  });
  it('never replaces an existing manual payment with a card payment', async () => {
    await db.ebookOrder.create({ data: { readerId, ebookId, reference: 'EB-' + randomUUID(), title: 'Fixture', priceCents: 700, customerName: 'Buyer', locale: 'en', method: 'WHISH', snapshot: {} } });
    await expect(createLiveEbookOrder(db, readerId, input(), env)).rejects.toThrow('EXISTING_PAYMENT');
  });
  it('rolls back the order if its payment intent cannot be saved', async () => {
    const failing = { $transaction: (fn: (tx: any) => Promise<unknown>) => db.$transaction(tx => fn(new Proxy(tx, { get(target, key) {
      if (key === '$executeRaw') return () => { throw Error('INTENT_FAILED'); };
      return Reflect.get(target, key);
    } }))) } as any;
    await expect(createLiveEbookOrder(failing, readerId, input(), env)).rejects.toThrow('INTENT_FAILED');
    expect(await db.ebookOrder.count({ where: { readerId } })).toBe(0);
  });
});
