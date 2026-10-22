// Local HTTP smoke check against the real configured database. No carrier calls.
// A short-lived admin token stays in memory and is never logged or persisted.
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const origin = 'http://127.0.0.1:3000';
try {
  if (!process.env.JWT_SECRET) throw Error('Explicit session secret required');
  const admin = await db.user.findFirst({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }, select: { id: true, email: true, role: true } });
  if (!admin) throw Error('No existing admin for local smoke check');
  const token = await new SignJWT({ userId: admin.id, email: admin.email, role: admin.role })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('5m')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
  async function check(path, expected, authenticated = true, method = 'GET') {
    const response = await fetch(`${origin}${path}`, { method, redirect: 'error', signal: AbortSignal.timeout(90000),
      headers: { ...(authenticated ? { Cookie: `admin-token=${token}` } : {}), ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
      ...(method === 'POST' ? { body: '{}' } : {}) });
    const body = await response.json();
    if (response.status !== expected) throw Error(`HTTP smoke check failed: expected ${expected}, received ${response.status}`);
    return body;
  }
  await check('/api/admin/aramex/tracking-inbox', 401, false);
  const inbox = await check('/api/admin/aramex/tracking-inbox', 200);
  if (!Array.isArray(inbox.events)) throw Error('Inbox response malformed');
  const shipment = await db.bookShipment.findFirst({ select: { orderId: true } });
  if (!shipment) throw Error('No existing shipment draft to check');
  const base = `/api/admin/book-orders/${encodeURIComponent(shipment.orderId)}/shipping`;
  await check(`${base}/reconciliation`, 200);
  await check(`${base}/tracking`, 200);
  const label = await check(`${base}/label`, 200);
  if (label.available !== false) throw Error('Label lookup unexpectedly available');
  const submission = await check(`${base}/submit`, 503, true, 'POST');
  if (submission.code !== 'SUBMISSION_DISABLED') throw Error('Submission gate did not return expected disabled response');
  console.log(JSON.stringify({ inbox: '200', recovery: '200', tracking: '200', unauthenticated: '401',
    labelAvailable: false, submission: '503 SUBMISSION_DISABLED', unmatchedEvents: inbox.total }));
} catch {
  console.error('Local HTTP smoke check failed; no session token or customer data logged.');
  process.exitCode = 1;
} finally { await db.$disconnect(); }
