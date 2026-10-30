import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rows: new Map<string, { id: string; config: unknown }>(), create: vi.fn(), status: vi.fn() }));
vi.mock('@/lib/db', () => {
  const settings = {
    upsert: vi.fn(async ({ where, create }: { where: { id: string }; create: { id: string; config: unknown } }) => { if (!mocks.rows.has(where.id)) mocks.rows.set(where.id, structuredClone(create)); return structuredClone(mocks.rows.get(where.id)); }),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => structuredClone(mocks.rows.get(where.id) || null)),
    findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => structuredClone(mocks.rows.get(where.id))),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: { config: unknown } }) => { mocks.rows.set(where.id, { id: where.id, config: structuredClone(data.config) }); }),
    findMany: vi.fn(async () => [...mocks.rows.values()]),
  };
  const tx = { bookWhishSettings: settings, $queryRaw: vi.fn() };
  return { db: { ...tx, $transaction: async (fn: (value: typeof tx) => unknown) => fn(tx) } };
});
vi.mock('./client', async importOriginal => ({ ...await importOriginal<typeof import('./client')>(), whishClient: () => ({ create: mocks.create, status: mocks.status }) }));
import { checkAttempt, listAttempts, mergeStatus, startAttempt } from './sandbox';
import { WhishError } from './client';
const id = '960b75d7-2c02-4902-8e97-c982123aaa65';
beforeEach(() => {
  vi.clearAllMocks(); mocks.rows.clear();
  vi.stubEnv('WHISH_PAY_SANDBOX_ENABLED', 'true'); vi.stubEnv('WHISH_PAY_CHANNEL', 'test'); vi.stubEnv('WHISH_PAY_SECRET', 'test');
  vi.stubEnv('WHISH_PAY_WEBSITE_URL', 'theleeexperience.com'); vi.stubEnv('WHISH_PAY_PUBLIC_ORIGIN', 'https://test.vercel.app');
  mocks.create.mockResolvedValue('https://whish.money/pay/test'); mocks.status.mockResolvedValue('pending');
});
describe('saved sandbox attempts', () => {
  it('persists before calling Whish, reuses the saved attempt and hides callback capability', async () => {
    mocks.create.mockImplementation(async () => { expect(mocks.rows.size).toBe(1); return 'https://whish.money/pay/test'; });
    const first = await startAttempt(id, 'admin');
    expect(await startAttempt(id, 'admin')).toEqual(first);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(await listAttempts())).not.toContain('token=');
    expect(first.status).toBe('unknown');
  });
  it('replays an identical body after an uncertain creation response', async () => {
    mocks.create.mockRejectedValueOnce(new WhishError('500', true));
    expect((await startAttempt(id, 'admin')).uncertain).toBe(true);
    await startAttempt(id, 'admin');
    expect(mocks.create.mock.calls[1][0]).toEqual(mocks.create.mock.calls[0][0]);
  });
  it('does not retry a definitive rejection with the old id', async () => {
    mocks.create.mockRejectedValueOnce(new WhishError('auth.session_not_exist'));
    await startAttempt(id, 'admin'); await startAttempt(id, 'admin');
    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
  it('rejects forged callbacks before querying the provider', async () => {
    await startAttempt(id, 'admin');
    await expect(checkAttempt(id, 'a'.repeat(64))).rejects.toThrow('INVALID_CALLBACK');
    expect(mocks.status).not.toHaveBeenCalled();
  });
  it('records callbacks but only takes payment status from the provider', async () => {
    await startAttempt(id, 'admin');
    const token = new URL(mocks.create.mock.calls[0][0].successCallbackUrl).searchParams.get('token')!;
    const pending = await checkAttempt(id, token);
    expect(pending.status).toBe('pending'); expect(pending.callbackAt).toBeTruthy();
    mocks.status.mockResolvedValueOnce('success'); expect((await checkAttempt(id, token)).status).toBe('success');
    mocks.status.mockResolvedValueOnce('pending'); expect((await checkAttempt(id)).status).toBe('success');
  });
  it('retains a callback receipt when verification times out, without confirming it', async () => {
    await startAttempt(id, 'admin');
    const token = new URL(mocks.create.mock.calls[0][0].successCallbackUrl).searchParams.get('token')!;
    mocks.status.mockRejectedValueOnce(new WhishError('TRANSPORT_UNCERTAIN', true));
    await expect(checkAttempt(id, token)).rejects.toThrow('TRANSPORT_UNCERTAIN');
    expect((await listAttempts())[0]).toMatchObject({ status: 'unknown', callbackAt: expect.any(String), checkedAt: null });
  });
  it('does not downgrade verified or refunded payments', () => {
    expect(mergeStatus('success', 'failed')).toBe('success');
    expect(mergeStatus('refunded', 'success')).toBe('refunded');
    expect(mergeStatus('failed', 'pending')).toBe('failed');
  });
});
