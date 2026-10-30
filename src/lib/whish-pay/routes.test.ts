import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), config: vi.fn(), balance: vi.fn(), list: vi.fn(), start: vi.fn(), check: vi.fn(), rate: vi.fn() }));
vi.mock('@/lib/book-orders/whish-server', () => ({ withPaymentAdmin: mocks.auth, privateJson: (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } }) }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mocks.rate }));
vi.mock('./client', async original => ({ ...await original<typeof import('./client')>(), sandboxConfig: mocks.config, whishClient: () => ({ balance: mocks.balance }) }));
vi.mock('./sandbox', async () => { const { z } = await import('zod'); return { attemptIdSchema: z.string().uuid(), listAttempts: mocks.list, startAttempt: mocks.start, checkAttempt: mocks.check }; });
import { GET, POST } from '@/app/api/admin/whish-pay/route';
import { GET as callback } from '@/app/api/webhooks/whish-pay/route';
import { WhishError } from './client';
const id = '960b75d7-2c02-4902-8e97-c982123aaa65';
const url = 'https://preview.vercel.app/api/admin/whish-pay';
function post(body: unknown, origin = 'https://preview.vercel.app') { return new NextRequest(url, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
beforeEach(() => {
  vi.resetAllMocks(); mocks.auth.mockResolvedValue({ session: { userId: 'admin' } }); mocks.rate.mockReturnValue(true);
  mocks.config.mockReturnValue({}); mocks.list.mockResolvedValue([]); mocks.balance.mockResolvedValue({ authenticated: true }); mocks.check.mockResolvedValue({ status: 'pending' });
});
describe('Whish sandbox routes', () => {
  it('blocks unauthenticated access before listing or creating attempts', async () => {
    mocks.auth.mockResolvedValue({ error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) });
    expect((await GET(new NextRequest(url))).status).toBe(401);
    expect((await POST(post({ action: 'start', id }))).status).toBe(401);
    expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.start).not.toHaveBeenCalled();
  });
  it('rejects cross-origin mutations', async () => {
    expect((await POST(post({ action: 'start', id }, 'https://other.test'))).status).toBe(403);
    expect(mocks.start).not.toHaveBeenCalled();
  });
  it('rejects requests that try to choose the amount', async () => {
    expect((await POST(post({ action: 'start', id, amount: '999' }))).status).toBe(400);
    expect(mocks.start).not.toHaveBeenCalled();
  });
  it('honors the disabled configuration gate before provider calls', async () => {
    mocks.config.mockImplementation(() => { throw new WhishError('SANDBOX_DISABLED'); });
    expect((await POST(post({ action: 'connection' }))).status).toBe(503);
    expect(mocks.balance).not.toHaveBeenCalled();
  });
  it('limits request size and request rate', async () => {
    expect((await POST(post({ action: 'start', value: 'x'.repeat(3000) }))).status).toBe(413);
    mocks.rate.mockReturnValue(false);
    expect((await POST(post({ action: 'connection' }))).status).toBe(429);
  });
  it('starts a saved test with the authenticated actor', async () => {
    mocks.start.mockResolvedValue({ id });
    const response = await POST(post({ action: 'start', id }));
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.start).toHaveBeenCalledWith(id, 'admin');
  });
  it('rejects malformed callback references', async () => {
    expect((await callback(new NextRequest('https://preview.vercel.app/api/webhooks/whish-pay?id=bad'))).status).toBe(400);
    expect(mocks.check).not.toHaveBeenCalled();
  });
  it('verifies callback without interpreting a forged success query parameter', async () => {
    const response = await callback(new NextRequest(`https://preview.vercel.app/api/webhooks/whish-pay?id=${id}&token=${'a'.repeat(64)}&status=success`));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ received: true });
    expect(mocks.check).toHaveBeenCalledWith(id, 'a'.repeat(64));
  });
  it('rejects invalid callback capabilities and reports verification outages', async () => {
    const request = () => new NextRequest(`https://preview.vercel.app/api/webhooks/whish-pay?id=${id}&token=${'a'.repeat(64)}`);
    mocks.check.mockRejectedValueOnce(new WhishError('INVALID_CALLBACK'));
    expect((await callback(request())).status).toBe(403);
    mocks.check.mockRejectedValueOnce(new WhishError('TRANSPORT_UNCERTAIN', true));
    expect((await callback(request())).status).toBe(503);
  });
});
