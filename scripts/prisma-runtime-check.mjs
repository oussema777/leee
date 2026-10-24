// Real HTTP/database regression on an explicitly selected isolated local preview.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/lib/prisma-adapter.mjs';
const database = process.env.PRISMA_UPGRADE_TEST_DATABASE_URL;
const origin = process.env.AUDI_PREVIEW_ORIGIN || 'http://127.0.0.1:3120';
if (!database || new URL(database).pathname !== '/aramex_test'
  || !['localhost', '127.0.0.1'].includes(new URL(database).hostname)
  || !['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw Error('Local preview and dedicated database required');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw Error('Local JWT secret required');
const db = new PrismaClient({ adapter: createPrismaAdapter(database) });
const id = randomUUID(), slug = 'prisma-regression-' + id;
try {
  const user = await db.user.create({ data: { id, email: id + '@example.test', name: 'Local Prisma verification', password: 'not-a-login', role: 'SUPER_ADMIN' } });
  const token = await new SignJWT({ userId: id, email: user.email, role: user.role }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('10m').sign(new TextEncoder().encode(process.env.JWT_SECRET));
  const headers = { cookie: 'admin-token=' + token, 'Content-Type': 'application/json', origin };
  assert.equal((await fetch(origin + '/api/admin/blog')).status, 401);
  for (const route of ['blog', 'programs', 'events', 'team-submissions', 'partners', 'ebooks', 'book-orders', 'card-payments']) {
    const response = await fetch(origin + '/api/admin/' + route, { headers });
    assert.equal(response.status, 200, route + ' list failed');
    await response.json();
  }
  const created = await fetch(origin + '/api/admin/blog', { method: 'POST', headers, body: JSON.stringify({ slug, titleEn: 'Local regression', titleAr: 'Local regression', summaryEn: 'Local', summaryAr: 'Local', bodyEn: 'Local', bodyAr: 'Local' }) });
  assert.equal(created.status, 201);
  const post = await created.json();
  const updated = await fetch(origin + '/api/admin/blog/' + post.id, { method: 'PUT', headers, body: JSON.stringify({ titleEn: 'Updated local regression' }) });
  assert.equal(updated.status, 200);
  assert.equal((await db.blogPost.findUniqueOrThrow({ where: { id: post.id } })).titleEn, 'Updated local regression');
  const removed = await fetch(origin + '/api/admin/blog/' + post.id, { method: 'DELETE', headers });
  assert.equal(removed.status, 200);
  assert.equal(await db.blogPost.count({ where: { slug } }), 0);
  console.log('PASS: eight real admin list APIs, anonymous denial, and content create/update/delete through the built application.');
} finally {
  await db.blogPost.deleteMany({ where: { slug } });
  await db.user.deleteMany({ where: { id } });
  await db.$disconnect();
}
