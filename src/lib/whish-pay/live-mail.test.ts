import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ deliver: vi.fn(), load: vi.fn(), rows: vi.fn(), find: vi.fn(), update: vi.fn(), order: vi.fn() }));
vi.mock('@/lib/db', () => {
  const tx = { $queryRaw: vi.fn(), bookWhishSettings: { findUniqueOrThrow: mocks.find, update: mocks.update } };
  return { db: { $transaction: (work: (tx: unknown) => unknown) => work(tx), bookWhishSettings: { findMany: mocks.rows, update: mocks.update }, bookOrder: { findUniqueOrThrow: mocks.order } } };
});
vi.mock('@/lib/ebooks/mail', () => ({ deliver: mocks.deliver }));
vi.mock('./live', () => ({ loadLiveAttempt: mocks.load }));
import { drainWhishLiveMail } from './live-mail';
const job = { attemptId: 'b0694e1a-2c68-4f63-8806-38384c13ec13', event: 'CONFIRMED', sent: false, nextAttemptAt: new Date(0).toISOString() };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rows.mockResolvedValue([{ id: 'mail-fixture', config: job }]); mocks.find.mockResolvedValue({ config: job });
  mocks.load.mockResolvedValue({ applied: true, status: 'success', order: { kind: 'BOOK', orderId: 'order', reference: 'LEE-LOCAL', amountCents: 999 } });
  mocks.order.mockResolvedValue({ reference: 'LEE-LOCAL', locale: 'en', customerEmail: 'buyer@example.test' });
  mocks.deliver.mockResolvedValue(undefined); mocks.update.mockResolvedValue({});
});
it('uses stable delivery keys and leaves failed mail available for retry', async () => {
  mocks.deliver.mockRejectedValueOnce(new Error('Temporary provider failure'));
  expect(await drainWhishLiveMail()).toEqual({ sent: 0, errors: 1 });
  expect(mocks.update.mock.calls.some(([arg]) => arg.data.config.sent === true)).toBe(false);
  expect(await drainWhishLiveMail()).toEqual({ sent: 1, errors: 0 });
  expect(mocks.deliver.mock.calls[0][3]).toBe(mocks.deliver.mock.calls[1][3]);
  expect(mocks.deliver.mock.calls[2][3]).toBe('mail-fixture:customer');
});
it('does not send a stale paid confirmation after a refund', async () => {
  mocks.load.mockResolvedValue({ applied: true, status: 'refunded', order: { kind: 'BOOK' } });
  expect(await drainWhishLiveMail()).toEqual({ sent: 1, errors: 0 });
  expect(mocks.deliver).not.toHaveBeenCalled();
});
it('does not send mail already leased by another worker', async () => {
  mocks.find.mockResolvedValue({ config: { ...job, nextAttemptAt: new Date(Date.now() + 60000).toISOString() } });
  expect(await drainWhishLiveMail()).toEqual({ sent: 0, errors: 0 });
  expect(mocks.deliver).not.toHaveBeenCalled();
});
