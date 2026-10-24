// These existing behavior tests exercise enabled methods; switch policy has separate integration coverage.
vi.mock('@/lib/payment-methods', async original => ({ ...await original<typeof import('@/lib/payment-methods')>(), getPaymentMethods: vi.fn(async () => ({ WHISH: true, BANK_AUDI: true, CASH: true })) }));
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { liveCustomerCheckout } from './live-customer-route';
import { getPaymentMethods } from '@/lib/payment-methods';
const m = vi.hoisted(() => ({ enabled: vi.fn(), payment: vi.fn(), reader: vi.fn(), ebook: vi.fn(), book: vi.fn(), query: vi.fn(), execute: vi.fn(), recover: vi.fn(), start: vi.fn(), rate: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { $queryRaw: m.query, $executeRaw: m.execute, bookOrder: { findUniqueOrThrow: m.book }, ebookOrder: { findFirst: m.ebook, findUniqueOrThrow: m.ebook } } }));
vi.mock('@/lib/book-orders/whish-server', () => ({ authenticatePayment: m.payment, privateJson: (v: unknown, status = 200) => NextResponse.json(v, { status }) }));
vi.mock('@/lib/ebooks/server', () => ({ requireReader: m.reader, EbookError: class extends Error {} }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: m.rate, clientIp: () => 'local' }));
vi.mock('./live-config', async original => ({ ...await original<typeof import('./live-config')>(), liveCustomerEnabled: m.enabled }));
vi.mock('./live-checkout', () => ({ startLiveCheckout: m.start }));
vi.mock('./live-jobs', () => ({ reconcileLivePayments: m.recover }));
vi.mock('./live-lookup', () => ({ createLiveCaptureLookup: () => vi.fn() }));
const id = 'LEE-L-00000000-0000-0000-0000-000000000001';
const snapshot = { provider: 'CYBERSOURCE', environment: 'PRODUCTION', testMode: false, merchantId: 'live', amountCents: 900, currency: 'USD' };
let attempt: Record<string, unknown>;
const request = (data: unknown, origin = 'https://www.theleeexperience.com') => new NextRequest('https://www.theleeexperience.com/api/test', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(() => {
  vi.clearAllMocks(); m.enabled.mockReturnValue(true); m.rate.mockReturnValue(true);
  m.payment.mockResolvedValue({ orderId: 'owned', snapshot, order: { reference: 'LEE-BK-owned', priceCents: 900, paymentMethod: 'BANK_AUDI' } });
  attempt = { id, state: 'READY', sessionState: 'NONE', sessionExpiresAt: null, transactionId: null, merchantId: 'live', amountCents: 900, orderReference: 'LEE-BK-owned', environment: 'PRODUCTION' };
  m.query.mockImplementation(async () => [attempt]); m.book.mockResolvedValue({ status: 'NEW', paymentStatus: 'PENDING', whishPayment: { expiresAt: new Date(Date.now() + 3600000) } });
  m.reader.mockResolvedValue({ id: 'reader' }); m.ebook.mockResolvedValue(null);
  m.execute.mockImplementation(async () => { attempt.sessionState = 'SUBMITTED'; return 1; });
  m.recover.mockResolvedValue({ checked: 0 }); m.start.mockResolvedValue({ session: null });
});
it('does not touch orders for cross-origin or rate-limited requests', async () => {
  expect((await liveCustomerCheckout(request({ action: 'inspect' }, 'https://other.test'), 'BOOK', 'x')).status).toBe(403);
  m.rate.mockReturnValue(false); expect((await liveCustomerCheckout(request({ action: 'inspect' }), 'BOOK', 'x')).status).toBe(429);
  expect(m.payment).not.toHaveBeenCalled();
});
it('keeps authenticated status available while the new-payment kill switch is off', async () => {
  m.enabled.mockReturnValue(false);
  expect((await liveCustomerCheckout(request({ action: 'inspect' }), 'BOOK', 'x')).status).toBe(200);
  expect((await liveCustomerCheckout(request({ action: 'start' }), 'BOOK', 'x')).status).toBe(503);
  expect(m.start).not.toHaveBeenCalled();
});
it('requires the private book link and scopes ebooks to their reader', async () => {
  m.payment.mockResolvedValue(null);
  expect((await liveCustomerCheckout(request({ action: 'start' }), 'BOOK', 'x')).status).toBe(404);
  expect((await liveCustomerCheckout(request({ action: 'start' }), 'EBOOK', 'x')).status).toBe(404);
  expect(m.ebook).toHaveBeenCalledWith({ where: { id: 'x', readerId: 'reader' } }); expect(m.query).not.toHaveBeenCalled();
});
it('refuses test/manual snapshots', async () => {
  const p = await m.payment(); p.snapshot = { ...snapshot, environment: 'TEST', testMode: true };
  expect((await liveCustomerCheckout(request({ action: 'start' }), 'BOOK', 'x')).status).toBe(404); expect(m.start).not.toHaveBeenCalled();
});
it('refuses another attempt ID, retries and client-controlled prices', async () => {
  expect((await liveCustomerCheckout(request({ action: 'result', attemptId: id.replace(/1$/, '2'), transactionId: '123456789012' }), 'BOOK', 'x')).status).toBe(404);
  for (const data of [{ action: 'start', retry: true }, { action: 'start', amountCents: 1 }]) expect((await liveCustomerCheckout(request(data), 'BOOK', 'x')).status).toBe(400);
  expect(m.start).not.toHaveBeenCalled(); expect(m.recover).not.toHaveBeenCalled();
});
it('rejects oversized input', async () => {
  expect((await liveCustomerCheckout(request({ action: 'inspect', text: 'x'.repeat(3000) }), 'BOOK', 'x')).status).toBe(413); expect(m.query).not.toHaveBeenCalled();
});
it('keeps a fresh order available to start without polling the provider', async () => {
  const result = await liveCustomerCheckout(request({ action: 'inspect' }), 'BOOK', 'x');
  expect(await result.json()).toMatchObject({ pending: false, attempt: { state: 'NOT_STARTED' } }); expect(m.recover).not.toHaveBeenCalled();
});
it('persists submission and checks only the owned attempt, never trusting browser proof', async () => {
  attempt.sessionState = 'READY'; attempt.sessionExpiresAt = new Date(Date.now() + 600000);
  const result = await liveCustomerCheckout(request({ action: 'result', attemptId: id, transactionId: '123456789012' }), 'BOOK', 'x');
  expect(m.execute).toHaveBeenCalledOnce(); expect(m.recover).toHaveBeenCalledWith(expect.anything(), expect.any(Function), id);
  expect(result.status).toBe(202); expect(await result.json()).toMatchObject({ completed: false, pending: true, retryAfterSeconds: 10 }); expect(m.start).not.toHaveBeenCalled();
});
it('recovers a submitted payment after refresh without browser hints', async () => {
  attempt.sessionState = 'SUBMITTED';
  m.recover.mockImplementation(async () => { attempt.state = 'APPLIED'; });
  m.book.mockResolvedValue({ status: 'CONFIRMED', paymentStatus: 'PAID' });
  expect(await (await liveCustomerCheckout(request({ action: 'inspect' }), 'BOOK', 'x')).json()).toMatchObject({ completed: true, pending: false });
});
it('shows review instead of success for a refunded or cancelled order', async () => {
  attempt.state = 'APPLIED'; attempt.sessionState = 'SUBMITTED'; m.book.mockResolvedValue({ status: 'CANCELLED', paymentStatus: 'REFUNDED' });
  expect(await (await liveCustomerCheckout(request({ action: 'start' }), 'BOOK', 'x')).json()).toMatchObject({ completed: false, review: true }); expect(m.start).not.toHaveBeenCalled();
});
it('withholds new checkout after expiry', async () => {
  m.book.mockResolvedValue({ status: 'NEW', paymentStatus: 'PENDING', whishPayment: { expiresAt: new Date(0) } });
  expect(await (await liveCustomerCheckout(request({ action: 'start' }), 'BOOK', 'x')).json()).toMatchObject({ review: true }); expect(m.start).not.toHaveBeenCalled();
});
it('stops automatic polling and offers support for a known decline or duplicate', async () => {
  attempt.sessionState = 'SUBMITTED'; attempt.checkError = 'PAYMENT_REQUIRES_REVIEW';
  const response = await liveCustomerCheckout(request({ action: 'inspect' }), 'BOOK', 'x');
  expect(await response.json()).toMatchObject({ review: true, pending: false, completed: false }); expect(m.start).not.toHaveBeenCalled();
});
it('blocks a new card start when the method is hidden while leaving status recovery available', async () => {
  expect((await liveCustomerCheckout(request({ action: 'inspect' }), 'BOOK', 'x')).status).toBe(200);
  vi.mocked(getPaymentMethods).mockResolvedValueOnce({ WHISH: false, BANK_AUDI: false, CASH: true });
  expect((await liveCustomerCheckout(request({ action: 'start' }), 'BOOK', 'x')).status).toBe(503);
  expect(m.start).not.toHaveBeenCalled();
});
