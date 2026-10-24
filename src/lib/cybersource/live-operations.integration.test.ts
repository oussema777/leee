import { createPrismaAdapter } from "../prisma-adapter.mjs";
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, expect, it, describe } from 'vitest';
import { paymentOperations, recordPaymentAction } from './live-operations';
const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url)) throw Error('Local DB required');
describe.skipIf(!url)('payment operations - isolated DB', () => {
  const db = new PrismaClient({ adapter: createPrismaAdapter(url || 'postgresql://postgres@127.0.0.1:55441/aramex_test') });
  const id = 'LEE-L-' + randomUUID(); let orderId: string;
  const row = async () => (await db.$queryRaw<any[]>`SELECT * FROM "CybersourceLiveAttempt" WHERE "id" = ${id}`)[0];
  beforeAll(async () => {
    orderId = (await db.bookOrder.create({ data: { reference: 'LEE-BK-' + randomUUID(), locale: 'en', package: 'SINGLE', purpose: 'SELF', requestedBookCount: 1, priceCents: 900, customerName: 'Local fixture', customerPhone: '70123456', fulfillmentMethod: 'PICKUP', paymentMethod: 'BANK_AUDI' } })).id;
    await db.$executeRaw`INSERT INTO "CybersourceLiveAttempt" ("id", "bookOrderId", "orderReference", "merchantId", "amountCents", "sessionState", "sessionCipher", "checkError", "nextCheckAt") VALUES (${id}, ${orderId}, 'LOCAL-OPS', 'fixture', 900, 'SUBMITTED', 'secret-cipher-fixture', 'PAYMENT_REQUIRES_REVIEW', CURRENT_TIMESTAMP + INTERVAL '1 hour')`;
  });
  afterAll(async () => {
    await db.$executeRaw`DELETE FROM "CardPaymentOpsNote" WHERE "attemptId" = ${id}`;
    await db.$executeRaw`DELETE FROM "CybersourceLiveAttempt" WHERE "id" = ${id}`;
    if (orderId) await db.bookOrder.delete({ where: { id: orderId } });
    await db.$disconnect();
  });
  it('lists attention without exposing encrypted sessions or email bodies', async () => {
    const result = await paymentOperations(db, 1, true);
    expect(JSON.stringify(result)).toContain('LOCAL-OPS'); expect(JSON.stringify(result)).not.toContain('secret-cipher-fixture');
    expect(result).toHaveProperty('schedulerStale');
  });
  it('writes an audit note without financial or session changes', async () => {
    const before = await row();
    await recordPaymentAction(db, { action: 'NOTE', attemptId: id, note: 'Contacted bank; awaiting confirmation.', expectedUpdatedAt: before.updatedAt.toISOString() }, 'staff-1');
    expect(await row()).toEqual(before);
    const notes = await db.$queryRaw<any[]>`SELECT * FROM "CardPaymentOpsNote" WHERE "attemptId" = ${id}`;
    expect(notes[0]).toMatchObject({ actorId: 'staff-1', action: 'NOTE' });
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: orderId } })).paymentStatus).toBe('PENDING');
  });
  it('queues a recheck preserving submitted session and preventing stale actions', async () => {
    const before = await row();
    await recordPaymentAction(db, { action: 'QUEUE_CHECK', attemptId: id, note: 'Customer requested a status check.', expectedUpdatedAt: before.updatedAt.toISOString() }, 'staff-2');
    expect(await row()).toMatchObject({ state: 'READY', sessionState: 'SUBMITTED', sessionCipher: 'secret-cipher-fixture', transactionId: null, checkError: 'PAYMENT_REQUIRES_REVIEW' });
    expect((await row()).nextCheckAt.getTime()).toBeLessThan(before.nextCheckAt.getTime());
    await expect(recordPaymentAction(db, { action: 'QUEUE_CHECK', attemptId: id, note: 'Duplicate stale action.', expectedUpdatedAt: before.updatedAt.toISOString() }, 'staff-2')).rejects.toThrow('CHANGED');
  });
  it('rejects unsupported financial actions', async () => {
    await expect(recordPaymentAction(db, { action: 'MARK_PAID', attemptId: id, note: 'Please mark paid.', expectedUpdatedAt: new Date().toISOString() }, 'staff')).rejects.toThrow();
    await expect(recordPaymentAction(db, { action: 'REFUND', attemptId: id, note: 'Please refund.', expectedUpdatedAt: new Date().toISOString() }, 'staff')).rejects.toThrow();
  });
});
