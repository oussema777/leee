import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { customerCheckout } from './customer-route';
import { TransactionLookupPending } from './transaction';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), payment: vi.fn(), reader: vi.fn(), order: vi.fn(), query: vi.fn(), verify: vi.fn(), finalize: vi.fn(), start: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { $queryRaw: mocks.query, ebookOrder: { findFirst: mocks.order } } }));
vi.mock('@/lib/book-orders/whish-server', () => ({ withPaymentAdmin: mocks.admin, authenticatePayment: mocks.payment, privateJson: (value: unknown, status = 200) => NextResponse.json(value, { status }) }));
vi.mock('@/lib/ebooks/server', () => ({ requireReader: mocks.reader, EbookError: class extends Error {} }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: () => true, clientIp: () => 'test' }));
vi.mock('./transaction', async importOriginal => ({ ...await importOriginal<typeof import('./transaction')>(), findTestPayment: vi.fn(async () => null) }));
vi.mock('./customer-config', () => ({ customerCardEnabled: () => true }));
vi.mock('./customer-finalize', () => ({ finalizeCustomerTest: mocks.finalize }));
vi.mock('./checkout', async importOriginal => ({ ...await importOriginal<typeof import('./checkout')>(), startCheckout: mocks.start, checkResult: mocks.verify }));
const snapshot = { provider: 'CYBERSOURCE', environment: 'TEST', testMode: true, amountCents: 900, currency: 'USD', supportPhone: '9613600747' };
const id = 'LEE-T-00000000-0000-0000-0000-000000000001';
const attempt = { id, state: 'READY', orderReference: 'LEE-TEST-1', amountCents: 900, expiresAt: new Date(Date.now() + 100000), verifiedAt: null };
function request(data: unknown, origin = 'https://www.theleeexperience.com') { return new NextRequest(origin + '/api/test', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data) }); }
beforeEach(() => {
  vi.clearAllMocks();
  mocks.admin.mockResolvedValue({ session: { userId: 'admin' } });
  mocks.payment.mockResolvedValue({ orderId: 'book', snapshot, state: 'AWAITING_PAYMENT', expiresAt: new Date(Date.now() + 3600000), order: { reference: 'LEE-TEST-1', priceCents: 900, paymentMethod: 'BANK_AUDI', status: 'NEW' } });
  mocks.query.mockResolvedValue([attempt]); mocks.finalize.mockResolvedValue(false);
  mocks.reader.mockResolvedValue({ id: 'owner' }); mocks.order.mockResolvedValue(null);
  mocks.verify.mockResolvedValue({ ...attempt, state: 'TEST_CAPTURED' });
});
it('requires admin access before looking up an order', async () => {
  mocks.admin.mockResolvedValue({ error: NextResponse.json({}, { status: 401 }) });
  expect((await customerCheckout(request({ action: 'inspect' }), 'BOOK', 'LEE-TEST-1')).status).toBe(401);
  expect(mocks.payment).not.toHaveBeenCalled();
});
it('rejects foreign origins and missing private payment links', async () => {
  expect((await customerCheckout(request({ action: 'inspect' }, 'https://attacker.test'), 'BOOK', 'LEE-TEST-1')).status).toBe(403);
  mocks.payment.mockResolvedValue(null);
  expect((await customerCheckout(request({ action: 'inspect' }), 'BOOK', 'LEE-TEST-1')).status).toBe(404);
});
it('never routes a real historical order into customer test finalization', async () => {
  const p = await mocks.payment(); p.order.reference = 'LEE-BK-1';
  expect((await customerCheckout(request({ action: 'inspect' }), 'BOOK', 'LEE-BK-1')).status).toBe(404);
  expect(mocks.finalize).not.toHaveBeenCalled();
});
it('scopes ebook lookup to the authenticated reader', async () => {
  expect((await customerCheckout(request({ action: 'inspect' }), 'EBOOK', 'ebook')).status).toBe(404);
  expect(mocks.order).toHaveBeenCalledWith({ where: { id: 'ebook', readerId: 'owner' } });
});
it('rejects attempts belonging to a different order', async () => {
  expect((await customerCheckout(request({ action: 'result', attemptId: id.replace(/1$/, '2'), transactionId: '123456789012' }), 'BOOK', 'LEE-TEST-1')).status).toBe(404);
  expect(mocks.verify).not.toHaveBeenCalled();
});
it('retains pending lookup semantics without finalizing or starting another charge', async () => {
  mocks.verify.mockRejectedValue(new TransactionLookupPending());
  const response = await customerCheckout(request({ action: 'result', attemptId: id, transactionId: '123456789012' }), 'BOOK', 'LEE-TEST-1');
  expect(response.status).toBe(202); expect(await response.json()).toMatchObject({ pending: true, retryAfterSeconds: 300 });
  expect(mocks.finalize).not.toHaveBeenCalled(); expect(mocks.start).not.toHaveBeenCalled();
});
it('recovers a verified result during refresh', async () => {
  mocks.finalize.mockResolvedValue(true);
  const response = await customerCheckout(request({ action: 'inspect' }), 'BOOK', 'LEE-TEST-1');
  expect(await response.json()).toMatchObject({ completed: true });
  expect(mocks.finalize).toHaveBeenCalledWith(expect.anything(), id);
});
