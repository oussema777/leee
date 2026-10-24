import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { finalizeLiveCapture } from './live-finalize';
import { LivePaymentNeedsReview } from './live-lookup';
import { cardMailSchema, prepareCardMail, sendCardMail, type CardMail, type MailEvent } from './live-mail';

type Db = Pick<PrismaClient, '$queryRaw' | '$executeRaw' | '$transaction' | 'bookOrder' | 'ebookOrder'>;
export type RecoveryAttempt = { id: string; merchantId: string; amountCents: number; currency: string; environment: string; state: string; transactionId: string | null; checkAttempts: number };
// This adapter must independently query/verify the PRODUCTION provider.
// live-lookup.ts supplies it; no cron/public endpoint is wired yet. Never pass browser JSON.
export type VerifiedCaptureLookup = (attempt: Readonly<RecoveryAttempt>, signal: AbortSignal) => Promise<unknown>;
const captureSchema = z.object({ status: z.literal('CAPTURED'), environment: z.literal('PRODUCTION'), merchantId: z.string(), reference: z.string(), transactionId: z.string().regex(/^\d{10,30}$/), amountCents: z.number().int().positive(), currency: z.literal('USD') }).strict();
const pendingSchema = z.object({ status: z.literal('PENDING') }).strict();
const delay = (attempts: number) => Math.min(300, 10 * 2 ** Math.min(5, attempts));
const enabled = () => process.env.CYBERSOURCE_LIVE_JOBS_ENABLED === 'true' && process.env.CYBERSOURCE_LIVE_FULFILLMENT_ENABLED === 'true';
async function deadline<T>(ms: number, action: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>;
  try { return await Promise.race([action(controller.signal), new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Error('JOB_TIMEOUT')); }, ms); })]); }
  finally { clearTimeout(timer!); }
}

export async function reconcileLivePayments(db: Db, lookup: VerifiedCaptureLookup, customerAttemptId?: string) {
  const stats = { checked: 0, applied: 0, pending: 0, failed: 0 };
  if (!enabled()) return stats;
  const started = Date.now();
  for (let i = 0; i < (customerAttemptId ? 1 : 10) && Date.now() - started < 35000; i++) {
    const token = randomUUID();
    const a = (await db.$queryRaw<RecoveryAttempt[]>`
      UPDATE "CybersourceLiveAttempt" SET "checkLeaseToken" = ${token}, "checkLeaseUntil" = CURRENT_TIMESTAMP + INTERVAL '2 minutes', "checkAttempts" = "checkAttempts" + 1, "customerCheckAfter" = ${customerAttemptId ? Prisma.sql`CURRENT_TIMESTAMP + INTERVAL '10 seconds'` : Prisma.sql`"customerCheckAfter"`}
      WHERE "id" = (SELECT "id" FROM "CybersourceLiveAttempt" WHERE "environment" = 'PRODUCTION' AND "state" IN ('READY','VERIFIED_CAPTURE') AND ${customerAttemptId ? Prisma.sql`"id" = ${customerAttemptId} AND "customerCheckAfter" <= CURRENT_TIMESTAMP` : Prisma.sql`"nextCheckAt" <= CURRENT_TIMESTAMP`} AND ("checkLeaseUntil" IS NULL OR "checkLeaseUntil" < CURRENT_TIMESTAMP) ORDER BY "nextCheckAt", "id" FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING "id", "merchantId", "amountCents", "currency", "environment", "state", "transactionId", "checkAttempts"`)[0];
    if (!a) break;
    stats.checked++;
    try {
      if (a.state === 'READY') {
        const raw = await deadline(20000, signal => lookup(Object.freeze({ ...a }), signal));
        if (pendingSchema.safeParse(raw).success) {
          await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "checkError" = NULL WHERE "id" = ${a.id} AND "checkLeaseToken" = ${token}`;
          stats.pending++; continue;
        }
        const capture = captureSchema.parse(raw);
        if (capture.reference !== a.id || capture.merchantId !== a.merchantId || capture.amountCents !== a.amountCents || capture.currency !== a.currency || a.transactionId && a.transactionId !== capture.transactionId) throw Error('CAPTURE_BINDING_MISMATCH');
        const saved = await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "state" = 'VERIFIED_CAPTURE', "transactionId" = ${capture.transactionId}, "verifiedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${a.id} AND "state" = 'READY' AND "checkLeaseToken" = ${token} AND "checkLeaseUntil" > CURRENT_TIMESTAMP`;
        if (saved !== 1) continue;
      }
      // A crash after storing proof is recoverable without repeating provider I/O.
      const result = await finalizeLiveCapture(db, a.id);
      if (result.state === 'APPLIED') stats.applied++;
      await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "checkError" = NULL WHERE "id" = ${a.id} AND "checkLeaseToken" = ${token}`;
    } catch (error) {
      stats.failed++;
      const code = error instanceof LivePaymentNeedsReview ? 'PAYMENT_REQUIRES_REVIEW' : 'VERIFICATION_OR_SETTLEMENT_FAILED';
      await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "checkError" = ${code} WHERE "id" = ${a.id} AND "checkLeaseToken" = ${token}`;
    } finally {
      await db.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "checkLeaseToken" = NULL, "checkLeaseUntil" = NULL, "nextCheckAt" = CURRENT_TIMESTAMP + ${delay(a.checkAttempts)} * INTERVAL '1 second' WHERE "id" = ${a.id} AND "checkLeaseToken" = ${token}`;
    }
  }
  return stats;
}

type Outbox = MailEvent & { payload: unknown; attempts: number; firstSendAt: Date | null; retryWindowOpen: boolean };
export async function drainCardPaymentMail(db: Db, send = sendCardMail, prepare: (event: MailEvent) => Promise<CardMail | null> = event => prepareCardMail(db, event)) {
  const stats = { sent: 0, skipped: 0, failed: 0, review: 0 };
  if (!enabled() || process.env.CYBERSOURCE_LIVE_EMAIL_ENABLED !== 'true') return stats;
  const started = Date.now();
  for (let i = 0; i < 10 && Date.now() - started < 35000; i++) {
    const token = randomUUID();
    const row = (await db.$queryRaw<Outbox[]>`UPDATE "CardPaymentOutbox" SET "leaseToken" = ${token}, "leaseUntil" = CURRENT_TIMESTAMP + INTERVAL '2 minutes', "attempts" = "attempts" + 1
      WHERE "id" = (SELECT "id" FROM "CardPaymentOutbox" WHERE "state" = 'PENDING' AND "processedAt" IS NULL AND "nextAttemptAt" <= CURRENT_TIMESTAMP AND ("leaseUntil" IS NULL OR "leaseUntil" < CURRENT_TIMESTAMP) ORDER BY "nextAttemptAt", "id" FOR UPDATE SKIP LOCKED LIMIT 1)
      RETURNING "id", "attemptId", "event", "payload", "attempts", "firstSendAt", ("firstSendAt" IS NULL OR "firstSendAt" > CURRENT_TIMESTAMP - INTERVAL '23 hours') AS "retryWindowOpen"`)[0];
    if (!row) break;
    try {
      // Resend retains keys for 24h. Leave a margin and require review rather
      // than risk a duplicate after an ambiguous send outside that window.
      if (!row.retryWindowOpen) {
        await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "state" = 'REVIEW_REQUIRED', "lastError" = 'DELIVERY_WINDOW_EXPIRED' WHERE "id" = ${row.id} AND "leaseToken" = ${token}`;
        stats.review++; continue;
      }
      // Recheck eligibility even for a frozen retry (e.g. refund/access revoked).
      // Changed templates/addresses never replace an already-frozen request.
      const prepared = await prepare(row);
      if (!prepared) {
        await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "state" = 'SKIPPED', "processedAt" = CURRENT_TIMESTAMP WHERE "id" = ${row.id} AND "leaseToken" = ${token}`;
        stats.skipped++; continue;
      }
      let payload: CardMail;
      if (row.payload) payload = cardMailSchema.parse(row.payload);
      else {
        payload = cardMailSchema.parse(prepared);
      }
      // Freeze body AND sender/recipient before any external side effect.
      const claimed = await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "payload" = ${JSON.stringify(payload)}::jsonb, "firstSendAt" = COALESCE("firstSendAt", CURRENT_TIMESTAMP) WHERE "id" = ${row.id} AND "leaseToken" = ${token} AND "leaseUntil" > CURRENT_TIMESTAMP`;
      if (claimed !== 1) continue;
      const providerId = await deadline(15000, signal => send(payload, 'lee-card/' + row.id, signal));
      if (!providerId || providerId.length > 200) throw Error('INVALID_DELIVERY_RESULT');
      const saved = await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "state" = 'SENT', "processedAt" = CURRENT_TIMESTAMP, "providerMessageId" = ${providerId}, "lastError" = NULL WHERE "id" = ${row.id} AND "leaseToken" = ${token}`;
      if (saved === 1) stats.sent++;
    } catch {
      stats.failed++;
      await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "lastError" = 'DELIVERY_NOT_CONFIRMED' WHERE "id" = ${row.id} AND "leaseToken" = ${token}`;
    } finally {
      await db.$executeRaw`UPDATE "CardPaymentOutbox" SET "leaseToken" = NULL, "leaseUntil" = NULL, "nextAttemptAt" = CURRENT_TIMESTAMP + ${delay(row.attempts)} * INTERVAL '1 second' WHERE "id" = ${row.id} AND "leaseToken" = ${token}`;
    }
  }
  return stats;
}
