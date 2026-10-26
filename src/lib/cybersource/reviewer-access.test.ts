import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ grant: vi.fn(), existing: vi.fn(), count: vi.fn(), create: vi.fn(), lock: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  bookWhishSettings: { findUnique: mocks.grant },
  $transaction: (callback: (tx: unknown) => unknown) => callback({ $queryRaw: mocks.lock, bookWhishSettings: { findUnique: mocks.grant }, bookWhishPayment: { findUnique: mocks.existing, count: mocks.count }, bookOrder: { create: mocks.create } }),
} }));
import { activeReviewerGrant, createReviewerOrder, reviewerGrantId, reviewerPaymentAccess } from './reviewer-access';
const token = 'ab'.repeat(32), requestId = '00000000-0000-4000-8000-000000000001';
const grant = { enabled: true, environment: 'TEST', expiresAt: '2099-01-01T00:00:00.000Z' };
const snapshot = { provider: 'CYBERSOURCE', environment: 'TEST', testMode: true, amountCents: 100, currency: 'USD', supportPhone: '9613600747', reviewerGrantId: reviewerGrantId(token) };
beforeEach(() => { vi.clearAllMocks(); mocks.grant.mockResolvedValue({ config: grant }); mocks.existing.mockResolvedValue(null); mocks.count.mockResolvedValue(0); });
it('rejects disabled, expired, malformed and production grants', () => {
  for (const value of [null, {}, { ...grant, enabled: false }, { ...grant, environment: 'PRODUCTION' }, { ...grant, expiresAt: '2020-01-01T00:00:00.000Z' }]) expect(activeReviewerGrant(value)).toBeNull();
});
it('checks a persisted grant only for an explicitly marked TEST snapshot', async () => {
  expect(await reviewerPaymentAccess(snapshot)).toBe(true);
  expect(await reviewerPaymentAccess({ ...snapshot, environment: 'PRODUCTION' })).toBe(false);
  expect(await reviewerPaymentAccess({ ...snapshot, reviewerGrantId: undefined })).toBe(false);
  mocks.grant.mockResolvedValue({ config: { ...grant, enabled: false } });
  expect(await reviewerPaymentAccess(snapshot)).toBe(false);
});
it('creates a fixed-price isolated test with no inventory items or customer contact data', async () => {
  const result = await createReviewerOrder(token, requestId);
  expect(result).toMatchObject({ amountCents: 100, token: expect.stringMatching(/^[a-f0-9]{64}$/), reference: expect.stringMatching(/^LEE-TEST-/) });
  const { data } = mocks.create.mock.calls[0][0];
  expect(data).toMatchObject({ priceCents: 100, selectionMode: 'LEE_CHOICE', paymentMethod: 'BANK_AUDI', whishPayment: { create: { snapshot } } });
  expect(data).not.toHaveProperty('items'); expect(data).not.toHaveProperty('customerEmail');
  expect(mocks.lock).toHaveBeenCalledOnce();
});
it('resumes the same private order on duplicate requests', async () => {
  const first = await createReviewerOrder(token, requestId);
  mocks.existing.mockResolvedValue({ order: { reference: first.reference, priceCents: 100 } });
  expect(await createReviewerOrder(token, requestId)).toEqual(first);
  expect(mocks.create).toHaveBeenCalledOnce();
});
it('rejects revocation before resuming or creating orders', async () => {
  mocks.grant.mockResolvedValue(null);
  await expect(createReviewerOrder(token, requestId)).rejects.toThrow('expired');
  expect(mocks.existing).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled();
});
it('enforces the persistent grant quota and validates input', async () => {
  mocks.count.mockResolvedValue(50);
  await expect(createReviewerOrder(token, requestId)).rejects.toThrow('limit');
  await expect(createReviewerOrder('invalid', requestId)).rejects.toThrow();
  await expect(createReviewerOrder(token, 'invalid')).rejects.toThrow();
  expect(mocks.create).not.toHaveBeenCalled();
});
