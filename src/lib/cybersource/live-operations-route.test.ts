import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn(), action: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/book-orders/whish-server', () => ({ withPaymentAdmin: m.auth, privateJson: (v: unknown, status = 200) => NextResponse.json(v, { status }) }));
vi.mock('./live-operations', async original => ({ ...await original<typeof import('./live-operations')>(), paymentOperations: m.list, recordPaymentAction: m.action }));
import { GET, POST } from '@/app/api/admin/card-payments/route';
const request = (data: unknown, origin = 'https://www.theleeexperience.com') => new NextRequest('https://www.theleeexperience.com/api/admin/card-payments', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data) });
const input = { action: 'NOTE', attemptId: 'LEE-L-fixture', note: 'Bank contacted.', expectedUpdatedAt: new Date().toISOString() };
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ session: { userId: 'current-admin' } }); m.list.mockResolvedValue({ rows: [], total: 0 }); m.action.mockResolvedValue({ saved: true }); });
it.each([401,403])('blocks unauthorized role/status %s without loading operations', async status => {
  m.auth.mockResolvedValue({ error: NextResponse.json({}, { status }) });
  expect((await GET(new NextRequest('https://www.theleeexperience.com/api/admin/card-payments'))).status).toBe(status);
  expect((await POST(request(input))).status).toBe(status);
  expect(m.list).not.toHaveBeenCalled(); expect(m.action).not.toHaveBeenCalled();
});
it('requires same-origin writes and enforces byte limits and strict actions', async () => {
  expect((await POST(request(input, 'https://evil.test'))).status).toBe(403);
  expect((await POST(request({ ...input, note: 'x'.repeat(11000) }))).status).toBe(413);
  expect((await POST(request({ ...input, action: 'MARK_PAID' }))).status).toBe(400);
  expect((await POST(request({ ...input, actorId: 'forged-admin' }))).status).toBe(400);
  expect(m.action).not.toHaveBeenCalled();
});
it('uses the authenticated actor and returns stale-action conflicts', async () => {
  expect((await POST(request(input))).status).toBe(200);
  expect(m.action).toHaveBeenCalledWith(expect.anything(), input, 'current-admin');
  m.action.mockRejectedValue(Error('ATTEMPT_CHANGED'));
  expect((await POST(request(input))).status).toBe(409);
});
it('rejects invalid pagination', async () => {
  expect((await GET(new NextRequest('https://www.theleeexperience.com/api/admin/card-payments?page=NaN'))).status).toBe(400);
  expect(m.list).not.toHaveBeenCalled();
});
