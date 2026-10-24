import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
vi.mock('@/lib/db', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const { createPrismaAdapter } = await import('./prisma-adapter.mjs');
  const url = process.env.CYBERSOURCE_TEST_DATABASE_URL || 'postgresql://postgres@127.0.0.1:55441/aramex_test';
  if (!['127.0.0.1', 'localhost'].includes(new URL(url).hostname) || new URL(url).pathname !== '/aramex_test') throw Error('Dedicated local database required');
  return { db: new PrismaClient({ adapter: createPrismaAdapter(url) }) };
});
vi.mock('@/lib/rate-limit', () => ({ rateLimit: () => true, clientIp: () => 'method-switch-local' }));
vi.mock('@/lib/email', () => ({ sendNotificationEmail: vi.fn(), sendTransactionalEmail: vi.fn(), renderNotification: () => '' }));
import { db } from './db';
import { createToken } from './auth';
import { GET, PUT } from '@/app/api/admin/payment-methods/route';
import { GET as availability } from '@/app/api/public/book-orders/methods/route';
import { GET as catalog } from '@/app/api/ebooks/catalog/route';
import { POST as printedOrder } from '@/app/api/public/book-orders/route';
import { getPaymentMethods, PAYMENT_METHOD_SETTINGS_ID } from './payment-methods';
import { ebookPaymentSettings } from './ebooks/payment-settings';
import { getWhishConfig } from './book-orders/whish-server';

describe.skipIf(!process.env.CYBERSOURCE_TEST_DATABASE_URL)('payment method switches - isolated database', () => {
  const ids = [PAYMENT_METHOD_SETTINGS_ID, 'book-restore', 'ebook-management-testing'];
  let saved: any[] = [], cookie = '', actor = '';
  const all = { WHISH: true, BANK_AUDI: true, CASH: true };
  const request = (data?: unknown, origin = 'https://www.theleeexperience.com', auth = cookie) => new NextRequest('https://www.theleeexperience.com/api/admin/payment-methods', { method: data === undefined ? 'GET' : 'PUT', headers: { cookie: auth, origin, 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const version = async () => (await (await GET(request())).json()).version;
  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', 'local-payment-switch-test-secret-32-characters');
    saved = await db.bookWhishSettings.findMany({ where: { id: { in: ids } } });
    actor = 'switch-' + randomUUID();
    const user = await db.user.create({ data: { id: actor, email: actor + '@example.test', name: 'Local switch admin', role: 'ADMIN', password: 'unused' } });
    cookie = 'admin-token=' + await createToken({ userId: actor, email: user.email, role: user.role });
    await db.bookWhishSettings.upsert({ where: { id: 'book-restore' }, create: { id: 'book-restore', updatedBy: actor, config: {} }, update: {} });
    await db.bookWhishSettings.update({ where: { id: 'book-restore' }, data: { config: { enabled: true, accountName: 'Local receiver', accountNumber: '70123456', supportPhone: '96170123456', holdHours: 24, qrImageUrl: 'https://example.test/qr.webp', qrVerified: true } } });
    await db.bookWhishSettings.upsert({ where: { id: 'ebook-management-testing' }, create: { id: 'ebook-management-testing', config: { enabled: true }, updatedBy: actor }, update: { config: { enabled: true } } });
  });
  beforeEach(async () => { await db.bookWhishSettings.deleteMany({ where: { id: PAYMENT_METHOD_SETTINGS_ID } }); });
  afterAll(async () => {
    await db.bookWhishSettings.deleteMany({ where: { id: { in: ids } } });
    for (const row of saved) await db.bookWhishSettings.create({ data: row });
    await db.user.deleteMany({ where: { id: actor } });
    await db.$disconnect(); vi.unstubAllEnvs();
  });
  it('starts with Whish hidden in printed books and ebooks, even with management testing enabled', async () => {
    expect((await getPaymentMethods()).WHISH).toBe(false);
    expect((await getWhishConfig()).enabled).toBe(false);
    expect((await ebookPaymentSettings()).whish.enabled).toBe(false);
    expect((await (await availability(request())).json()).methods.WHISH).toBe(false);
    const hidden = await (await catalog(request())).json();
    expect(hidden.methods).not.toContain('WHISH');
    expect(hidden.testMode).toBe(false);
  });
  it('restores Whish in both flows without changing receiving details, then hides it again', async () => {
    const receiver = await db.bookWhishSettings.findUniqueOrThrow({ where: { id: 'book-restore' } });
    expect((await PUT(request({ methods: all, version: null }))).status).toBe(200);
    expect((await (await availability(request())).json()).methods.WHISH).toBe(true);
    expect((await (await catalog(request())).json()).methods).toContain('WHISH');
    expect((await PUT(request({ methods: { ...all, WHISH: false }, version: await version() }))).status).toBe(200);
    expect((await ebookPaymentSettings()).whish.enabled).toBe(false);
    expect((await db.bookWhishSettings.findUniqueOrThrow({ where: { id: 'book-restore' } })).config).toEqual(receiver.config);
    expect((await db.bookWhishSettings.findUniqueOrThrow({ where: { id: PAYMENT_METHOD_SETTINGS_ID } })).updatedBy).toBe(actor);
  });
  it('rejects stale concurrent changes and forged fields', async () => {
    const responses = await Promise.all([PUT(request({ methods: all, version: null })), PUT(request({ methods: { ...all, CASH: false }, version: null }))]);
    expect(responses.map(r => r.status).sort()).toEqual([200, 409]);
    expect((await PUT(request({ methods: all, version: await version(), actorId: 'forged' }))).status).toBe(400);
  });
  it('requires authentication, current database admin role and the correct origin', async () => {
    expect((await GET(request(undefined, undefined, ''))).status).toBe(401);
    expect((await PUT(request({ methods: all, version: null }, 'https://evil.example'))).status).toBe(403);
    await db.user.update({ where: { id: actor }, data: { role: 'EDITOR' } });
    try { expect((await PUT(request({ methods: all, version: null }))).status).toBe(403); }
    finally { await db.user.update({ where: { id: actor }, data: { role: 'ADMIN' } }); }
  });
  it('blocks disabled printed-order methods before reserving stock or creating orders', async () => {
    expect((await PUT(request({ methods: { WHISH: false, BANK_AUDI: false, CASH: false }, version: null }))).status).toBe(200);
    const before = await db.bookOrder.count();
    for (const method of ['WHISH', 'BANK_AUDI', 'CASH_ON_DELIVERY']) {
      const req = new NextRequest('https://www.theleeexperience.com/api/public/book-orders', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'https://www.theleeexperience.com' }, body: JSON.stringify({ locale: 'en', package: 'SINGLE', purpose: 'SELF', selectionMode: 'CUSTOM', selectedBookIds: ['local-book'], selectedEditions: [{ bookId: 'local-book', editionId: 'local-edition' }], customerName: 'Local Buyer', customerPhone: '70123456', fulfillmentMethod: 'PICKUP', paymentMethod: method, termsAccepted: true, paymentAccessToken: 'ab'.repeat(32) }) });
      expect((await printedOrder(req)).status).toBe(409);
    }
    expect(await db.bookOrder.count()).toBe(before);
    expect((await (await availability(request())).json()).methods).toEqual({ WHISH: false, BANK_AUDI: false, CASH: false });
  });
});
