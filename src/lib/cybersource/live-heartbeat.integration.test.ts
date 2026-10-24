import { createPrismaAdapter } from "../prisma-adapter.mjs";
import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ payments: vi.fn(), mail: vi.fn() }));
vi.mock('./live-jobs', () => ({ reconcileLivePayments: m.payments, drainCardPaymentMail: m.mail }));
vi.mock('./live-lookup', () => ({ createLiveCaptureLookup: () => vi.fn() }));
import { runLiveJobs } from './live-runner';
const url = process.env.CYBERSOURCE_TEST_DATABASE_URL;
if (url && !/^postgresql:\/\/[^@]+@127\.0\.0\.1:55441\/aramex_test$/.test(url)) throw Error('Local DB required');
describe.skipIf(!url)('scheduler heartbeat and ownership', () => {
  const db = new PrismaClient({ adapter: createPrismaAdapter(url || 'postgresql://postgres@127.0.0.1:55441/aramex_test') });
  const read = async () => (await db.$queryRaw<any[]>`SELECT * FROM "CardPaymentJobStatus" WHERE "id" = 'live-payments'`)[0];
  beforeEach(async () => {
    vi.stubEnv('CYBERSOURCE_LIVE_JOBS_ENABLED', 'true'); vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'true');
    await db.$executeRaw`DELETE FROM "CardPaymentJobStatus" WHERE "id" = 'live-payments'`;
    m.payments.mockReset(); m.mail.mockReset(); m.payments.mockResolvedValue({ checked: 1, failed: 0 }); m.mail.mockResolvedValue({ sent: 0, failed: 0 });
  });
  afterEach(async () => { await db.$executeRaw`DELETE FROM "CardPaymentJobStatus" WHERE "id" = 'live-payments'`; vi.unstubAllEnvs(); });
  afterAll(() => db.$disconnect());
  it('runs one scheduler invocation at a time', async () => {
    let entered!: () => void, release!: () => void;
    const start = new Promise<void>(r => entered = r), wait = new Promise<void>(r => release = r);
    m.payments.mockImplementation(async () => { entered(); await wait; return { checked: 1, failed: 0 }; });
    const first = runLiveJobs(db); await start;
    expect(await runLiveJobs(db)).toEqual({ running: true });
    release(); await first;
    expect(m.payments).toHaveBeenCalledTimes(1); expect((await read()).state).toBe('OK');
  });
  it('records partial failure and exposes no provider exception text', async () => {
    m.payments.mockResolvedValue({ checked: 1, failed: 1 }); await runLiveJobs(db);
    expect((await read()).state).toBe('FAILED');
    m.payments.mockRejectedValue(Error('sensitive-provider-detail'));
    await expect(runLiveJobs(db)).rejects.toThrow('LIVE_JOB_FAILED');
    expect(JSON.stringify(await read())).not.toContain('sensitive-provider-detail');
  });
  it('reclaims a crashed run after its lease expires', async () => {
    await db.$executeRaw`INSERT INTO "CardPaymentJobStatus" ("id", "token", "state", "startedAt") VALUES ('live-payments', 'crashed', 'RUNNING', CURRENT_TIMESTAMP - INTERVAL '4 minutes')`;
    await runLiveJobs(db); expect((await read()).state).toBe('OK'); expect((await read()).token).not.toBe('crashed');
  });
});
