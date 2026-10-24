import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ payments: vi.fn(), mail: vi.fn(), lookup: vi.fn(), execute: vi.fn(async () => 1) }));
vi.mock('./live-jobs', () => ({ reconcileLivePayments: mocks.payments, drainCardPaymentMail: mocks.mail }));
vi.mock('./live-lookup', () => ({ createLiveCaptureLookup: () => mocks.lookup }));
vi.mock('@/lib/db', () => ({ db: { $executeRaw: mocks.execute } }));
import { GET } from '@/app/api/cron/card-payments/route';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('rejects missing/wrong credentials before any job', async () => {
  vi.stubEnv('CRON_SECRET', 'fixture-'.repeat(8));
  for (const authorization of ['', 'Bearer wrong']) {
    expect((await GET(new Request('https://example.test', { headers: { authorization } }))).status).toBe(401);
  }
  expect(mocks.payments).not.toHaveBeenCalled(); expect(mocks.mail).not.toHaveBeenCalled();
});
it('stays disabled after authentication until explicitly enabled', async () => {
  vi.stubEnv('CRON_SECRET', 'fixture-'.repeat(8)); vi.stubEnv('CYBERSOURCE_LIVE_JOBS_ENABLED', 'false');
  const response = await GET(new Request('https://example.test', { headers: { authorization: 'Bearer ' + 'fixture-'.repeat(8) } }));
  expect(await response.json()).toEqual({ disabled: true }); expect(mocks.payments).not.toHaveBeenCalled();
});
it('runs recovery before email and returns no sensitive exception details', async () => {
  vi.stubEnv('CRON_SECRET', 'fixture-'.repeat(8)); vi.stubEnv('CYBERSOURCE_LIVE_JOBS_ENABLED', 'true'); vi.stubEnv('CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'true');
  mocks.payments.mockResolvedValue({ checked: 1 }); mocks.mail.mockResolvedValue({ sent: 1 });
  const request = () => new Request('https://example.test', { headers: { authorization: 'Bearer ' + 'fixture-'.repeat(8) } });
  expect(await (await GET(request())).json()).toEqual({ payments: { checked: 1 }, mail: { sent: 1 } });
  expect(mocks.payments.mock.invocationCallOrder[0]).toBeLessThan(mocks.mail.mock.invocationCallOrder[0]);
  mocks.payments.mockRejectedValue(Error('secret provider response'));
  const response = await GET(request()); expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret');
});
