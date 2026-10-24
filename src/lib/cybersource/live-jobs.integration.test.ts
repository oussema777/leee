import { createPrismaAdapter } from "../prisma-adapter.mjs";
import { randomInt, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { drainCardPaymentMail, reconcileLivePayments, type RecoveryAttempt } from './live-jobs';
import { prepareCardMail } from './live-mail';
import { LivePaymentNeedsReview } from './live-lookup';
const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url)) throw Error('Local test database required');

// Workers intentionally scan their queue; run DB suites without file parallelism.
describe.skipIf(!url)('background payment jobs - isolated database and fake provider only', () => {
  const db = new PrismaClient({ adapter: createPrismaAdapter(url || 'postgresql://postgres@127.0.0.1:55441/aramex_test') });
  let ids: string[] = [], orders: string[] = [];
  const payload = { from: 'LEE <no-reply@example.test>', to: 'buyer@example.test', subject: 'Confirmed', html: '<p>Confirmed</p>' };
  beforeEach(() => {
    vi.stubEnv('CYBERSOURCE_LIVE_JOBS_ENABLED', 'true'); vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'true'); vi.stubEnv('CYBERSOURCE_LIVE_EMAIL_ENABLED', 'true');
    vi.stubEnv('EMAIL_TO', 'team@example.test');
  });
  afterEach(async () => {
    vi.useRealTimers();
    for (const id of ids) { await db.$executeRaw`DELETE FROM "CardPaymentOutbox" WHERE "attemptId" = ${id}`; await db.$executeRaw`DELETE FROM "CybersourceLiveAttempt" WHERE "id" = ${id}`; }
    await db.bookWhishEvent.deleteMany({ where: { payment: { orderId: { in: orders } } } });
    await db.bookWhishPayment.deleteMany({ where: { orderId: { in: orders } } });
    await db.bookOrder.deleteMany({ where: { id: { in: orders } } });
    ids = []; orders = []; vi.unstubAllEnvs();
  });
  afterAll(() => db.$disconnect());
  async function fixture() {
    const snapshot = { provider: 'CYBERSOURCE', environment: 'PRODUCTION', testMode: false, merchantId: 'local-jobs', amountCents: 900, currency: 'USD', stockReservation: 'NOT_REQUIRED' };
    const o = await db.bookOrder.create({ data: { reference: 'LEE-BK-' + randomUUID(), locale: 'en', package: 'SINGLE', purpose: 'GIFT', selectionMode: 'LEE_CHOICE', requestedBookCount: 1, priceCents: 900, customerName: 'Purchaser', customerEmail: 'buyer@example.test', customerPhone: '70123456', recipientName: 'Gift recipient', fulfillmentMethod: 'PICKUP', paymentMethod: 'BANK_AUDI', whishPayment: { create: { snapshot, accessTokenHash: randomUUID(), requestHash: randomUUID(), expiresAt: new Date(Date.now() + 3600000) } } } });
    orders.push(o.id); const id = randomUUID(); ids.push(id);
    await db.$executeRaw`INSERT INTO "CybersourceLiveAttempt" ("id", "bookOrderId", "orderReference", "merchantId", "amountCents") VALUES (${id}, ${o.id}, ${o.reference}, 'local-jobs', 900)`;
    return { id, order: o };
  }
  const capture = (a: RecoveryAttempt) => ({ status: 'CAPTURED', environment: 'PRODUCTION', merchantId: a.merchantId, reference: a.id, transactionId: String(Date.now()) + String(randomInt(1e9)), amountCents: a.amountCents, currency: a.currency });
  const row = async (id: string) => (await db.$queryRaw<any[]>`SELECT * FROM "CybersourceLiveAttempt" WHERE "id" = ${id}`)[0];
  it('enforces customer polling cooldown across independent calls', async () => {
    const f = await fixture(), lookup = vi.fn(async () => ({ status: 'PENDING' }));
    expect((await reconcileLivePayments(db, lookup, f.id)).checked).toBe(1);
    expect((await reconcileLivePayments(db, lookup, f.id)).checked).toBe(0);
    expect(lookup).toHaveBeenCalledTimes(1);
  });
  it('records a support-required result without fabricating capture proof or payment', async () => {
    const f = await fixture();
    await reconcileLivePayments(db, async () => { throw new LivePaymentNeedsReview('LIVE_MULTIPLE_PAYMENTS'); }, f.id);
    expect(await row(f.id)).toMatchObject({ state: 'READY', transactionId: null, verifiedAt: null, checkError: 'PAYMENT_REQUIRES_REVIEW' });
    expect((await db.bookOrder.findUniqueOrThrow({ where: { id: f.order.id } })).paymentStatus).toBe('PENDING');
  });
  it('customer refresh checks only its saved attempt without waiting for background backoff', async () => {
    const own = await fixture(), other = await fixture();
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "nextCheckAt" = CURRENT_TIMESTAMP + INTERVAL '5 minutes' WHERE "id" = ${own.id}`;
    const lookup = vi.fn(async (a: RecoveryAttempt) => capture(a));
    expect((await reconcileLivePayments(db, lookup, own.id)).applied).toBe(1);
    expect(lookup).toHaveBeenCalledTimes(1); expect(lookup.mock.calls[0][0].id).toBe(own.id);
    expect((await row(other.id)).state).toBe('READY');
  });
  const mail = async (id: string) => (await db.$queryRaw<any[]>`SELECT * FROM "CardPaymentOutbox" WHERE "attemptId" = ${id}`)[0];
  async function readyMail() { const f = await fixture(); await reconcileLivePayments(db, async a => capture(a)); return f; }
  async function dueMail(id: string) { await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "nextAttemptAt" = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE "attemptId" = ${id}`; }
  it('is disabled by default without touching storage or sending', async () => {
    vi.stubEnv('CYBERSOURCE_LIVE_JOBS_ENABLED', 'false'); const query = vi.fn(), send = vi.fn();
    await reconcileLivePayments({ $queryRaw: query } as any, send); await drainCardPaymentMail({ $queryRaw: query } as any, send);
    expect(query).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
  });
  it('recovers pending then captured payment without a browser or a new charge', async () => {
    const f = await fixture(), lookup = vi.fn().mockResolvedValueOnce({ status: 'PENDING' }).mockImplementation(async a => capture(a));
    expect((await reconcileLivePayments(db, lookup)).pending).toBe(1); expect((await row(f.id)).state).toBe('READY');
    await reconcileLivePayments(db, lookup); expect(lookup).toHaveBeenCalledTimes(1);
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "nextCheckAt" = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE "id" = ${f.id}`;
    expect((await reconcileLivePayments(db, lookup)).applied).toBe(1); expect((await row(f.id)).state).toBe('APPLIED');
    expect(await db.bookOrder.findUnique({ where: { id: f.order.id } })).toMatchObject({ paymentStatus: 'PAID', status: 'CONFIRMED' });
    await reconcileLivePayments(db, lookup); expect(lookup).toHaveBeenCalledTimes(2);
  });
  it.each(['merchantId', 'reference', 'amountCents', 'currency', 'environment'])('rejects mismatched %s without storing proof', async field => {
    const f = await fixture();
    expect((await reconcileLivePayments(db, async a => ({ ...capture(a), [field]: field === 'amountCents' ? 901 : 'wrong' }))).failed).toBe(1);
    expect(await row(f.id)).toMatchObject({ state: 'READY', verifiedAt: null, transactionId: null });
  });
  it('reclaims a crashed lease and resumes stored proof without another provider lookup', async () => {
    const f = await fixture(); const txn = String(Date.now()) + '123456';
    await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "state" = 'VERIFIED_CAPTURE', "transactionId" = ${txn}, "verifiedAt" = CURRENT_TIMESTAMP, "checkLeaseToken" = 'crashed', "checkLeaseUntil" = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE "id" = ${f.id}`;
    const lookup = vi.fn(); expect((await reconcileLivePayments(db, lookup)).applied).toBe(1); expect(lookup).not.toHaveBeenCalled();
  });
  it('claims a payment once with overlapping workers', async () => {
    await fixture(); let release!: () => void, entered!: () => void;
    const started = new Promise<void>(r => entered = r), gate = new Promise<void>(r => release = r);
    const lookup = vi.fn(async a => { entered(); await gate; return capture(a); });
    const first = reconcileLivePayments(db, lookup); await started;
    expect((await reconcileLivePayments(db, lookup)).checked).toBe(0); release(); await first; expect(lookup).toHaveBeenCalledTimes(1);
  });
  it('does not apply a late response after losing its lease', async () => {
    const f = await fixture();
    await reconcileLivePayments(db, async a => { await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "checkLeaseToken" = 'new-owner' WHERE "id" = ${a.id}`; return capture(a); });
    expect(await row(f.id)).toMatchObject({ state: 'READY', transactionId: null, checkLeaseToken: 'new-owner' });
  });
  it('times out a stalled provider lookup, aborts it and keeps the order unpaid', async () => {
    const f = await fixture(); let entered!: () => void, signal!: AbortSignal;
    const started = new Promise<void>(r => entered = r);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const job = reconcileLivePayments(db, async (_a, s) => { signal = s; entered(); return new Promise(() => {}); });
    await started; await vi.advanceTimersByTimeAsync(20001); const result = await job; vi.useRealTimers();
    expect(signal.aborted).toBe(true); expect(result.failed).toBe(1);
    expect(await row(f.id)).toMatchObject({ state: 'READY', checkLeaseToken: null, verifiedAt: null });
  });
  it('sends one confirmation under concurrent drainers and preserves the provider id', async () => {
    const f = await readyMail(), send = vi.fn(async (_payload: unknown) => 'provider-id');
    await Promise.all([drainCardPaymentMail(db, send), drainCardPaymentMail(db, send)]);
    expect(send).toHaveBeenCalledTimes(1); expect(send.mock.calls[0][0]).toMatchObject({ to: 'buyer@example.test' });
    expect(await mail(f.id)).toMatchObject({ state: 'SENT', providerMessageId: 'provider-id' });
    await drainCardPaymentMail(db, send); expect(send).toHaveBeenCalledTimes(1);
  });
  it('retries an ambiguous delivery with identical frozen body and key', async () => {
    const f = await readyMail(); const send = vi.fn().mockRejectedValueOnce(Error('lost response')).mockResolvedValue('same-provider-id');
    await drainCardPaymentMail(db, send, async () => payload); expect((await mail(f.id)).state).toBe('PENDING');
    await drainCardPaymentMail(db, send, async () => payload); expect(send).toHaveBeenCalledTimes(1);
    await dueMail(f.id); await drainCardPaymentMail(db, send, async () => ({ ...payload, subject: 'Changed', from: 'new@example.test' }));
    expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]); expect(send.mock.calls[1][1]).toBe(send.mock.calls[0][1]);
    expect((await mail(f.id)).state).toBe('SENT');
  });
  it('reclaims a crashed email job, but holds an ambiguous send older than the provider window', async () => {
    const f = await readyMail();
    await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "leaseToken" = 'crashed', "leaseUntil" = CURRENT_TIMESTAMP - INTERVAL '1 second', "firstSendAt" = CURRENT_TIMESTAMP - INTERVAL '24 hours', "payload" = ${JSON.stringify(payload)}::jsonb WHERE "attemptId" = ${f.id}`;
    const send = vi.fn(); expect((await drainCardPaymentMail(db, send)).review).toBe(1); expect(send).not.toHaveBeenCalled();
    expect(await mail(f.id)).toMatchObject({ state: 'REVIEW_REQUIRED', lastError: 'DELIVERY_WINDOW_EXPIRED' });
  });
  it('does not acknowledge an email using an obsolete lease token', async () => {
    const f = await readyMail();
    await drainCardPaymentMail(db, async () => { await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "leaseToken" = 'new-owner' WHERE "attemptId" = ${f.id}`; return 'accepted'; });
    expect(await mail(f.id)).toMatchObject({ state: 'PENDING', leaseToken: 'new-owner', providerMessageId: null });
  });
  it('keeps a timed-out send pending with its frozen payload and releases its lease', async () => {
    const f = await readyMail(); let entered!: () => void, signal!: AbortSignal;
    const started = new Promise<void>(r => entered = r);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const job = drainCardPaymentMail(db, async (_p, _key, s) => { signal = s; entered(); return new Promise(() => {}); });
    await started; await vi.advanceTimersByTimeAsync(15001); const result = await job; vi.useRealTimers();
    expect(signal.aborted).toBe(true); expect(result.failed).toBe(1);
    const saved = await mail(f.id); expect(saved).toMatchObject({ state: 'PENDING', leaseToken: null, processedAt: null });
    expect(saved.firstSendAt).toBeTruthy(); expect(saved.payload.to).toBe('buyer@example.test');
  });
  it('suppresses a confirmation after refund, including a frozen retry', async () => {
    const f = await readyMail(); await drainCardPaymentMail(db, async () => { throw Error('timeout'); });
    await db.bookOrder.update({ where: { id: f.order.id }, data: { paymentStatus: 'REFUNDED' } }); await dueMail(f.id);
    const send = vi.fn(); expect((await drainCardPaymentMail(db, send)).skipped).toBe(1); expect(send).not.toHaveBeenCalled();
  });
  it('skips a customer without email and directs payment review to the team only', async () => {
    const f = await readyMail(); await db.bookOrder.update({ where: { id: f.order.id }, data: { customerEmail: null } });
    const send = vi.fn(async () => 'review-mail'); expect((await drainCardPaymentMail(db, send)).skipped).toBe(1); expect(send).not.toHaveBeenCalled();
    const other = await fixture(); await db.bookOrder.update({ where: { id: other.order.id }, data: { status: 'CANCELLED' } });
    await reconcileLivePayments(db, async a => capture(a)); const e = await mail(other.id); expect(e.event).toBe('PAYMENT_REVIEW_REQUIRED');
    const message = await prepareCardMail(db, e); expect(message?.to).toBe('team@example.test');
    await drainCardPaymentMail(db, send); expect(send).toHaveBeenCalledTimes(1);
  });
});
