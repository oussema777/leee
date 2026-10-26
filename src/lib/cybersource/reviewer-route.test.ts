import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ create: vi.fn(), enabled: vi.fn(), methods: vi.fn() }));
vi.mock('@/lib/book-orders/whish-server', () => ({ privateJson: (value: unknown, status = 200) => NextResponse.json(value, { status }) }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: () => true, clientIp: () => 'test' }));
vi.mock('@/lib/cybersource/customer-config', () => ({ customerCardEnabled: mocks.enabled }));
vi.mock('@/lib/payment-methods', () => ({ getPaymentMethods: mocks.methods }));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('./reviewer-access', async original => ({ ...await original<typeof import('./reviewer-access')>(), createReviewerOrder: mocks.create }));
import { POST } from '@/app/api/payment-test/route';
import { ReviewerError } from './reviewer-access';
const token = 'ab'.repeat(32), requestId = '00000000-0000-4000-8000-000000000001';
function request(body: unknown = { requestId }, bearer = token, origin = 'https://www.theleeexperience.com') {
  return new NextRequest('https://www.theleeexperience.com/api/payment-test', { method: 'POST', headers: { origin, authorization: 'Bearer ' + bearer, 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
beforeEach(() => { vi.clearAllMocks(); mocks.enabled.mockReturnValue(true); mocks.methods.mockResolvedValue({ BANK_AUDI: true }); mocks.create.mockResolvedValue({ reference: 'LEE-TEST-example', token, amountCents: 100 }); });
it('creates a sandbox checkout with no admin cookie', async () => {
  expect((await POST(request())).status).toBe(200);
  expect(mocks.create).toHaveBeenCalledWith(token, requestId);
});
it('rejects missing links, foreign origins and client-supplied prices', async () => {
  expect((await POST(request({}, ''))).status).toBe(403);
  expect((await POST(request({ requestId }, token, 'https://attacker.test'))).status).toBe(403);
  expect((await POST(request({ requestId, amountCents: 1 }))).status).toBe(400);
  expect(mocks.create).not.toHaveBeenCalled();
});
it('rejects oversized requests before creating an order', async () => {
  expect((await POST(request({ requestId, junk: 'x'.repeat(2000) }))).status).toBe(413);
  expect(mocks.create).not.toHaveBeenCalled();
});
it('honors the checkout switches and grant rejection', async () => {
  mocks.enabled.mockReturnValueOnce(false);
  expect((await POST(request())).status).toBe(503);
  mocks.methods.mockResolvedValueOnce({ BANK_AUDI: false });
  expect((await POST(request())).status).toBe(503);
  mocks.create.mockRejectedValueOnce(new ReviewerError('Expired'));
  expect((await POST(request())).status).toBe(403);
});
