import { randomUUID } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

type Db = Pick<PrismaClient, '$queryRaw' | '$transaction'>;
export const opsAction = z.object({ action: z.enum(['NOTE', 'QUEUE_CHECK']), attemptId: z.string().min(1).max(80).regex(/^[A-Za-z0-9-]+$/), note: z.string().trim().min(5).max(2000), expectedUpdatedAt: z.string().datetime() }).strict();
export async function paymentOperations(db: Db, page: number, attention: boolean) {
  const where = attention ? Prisma.sql`(a."state" = 'REVIEW_REQUIRED' OR a."checkError" IS NOT NULL OR (a."state" = 'READY' AND a."sessionState" <> 'NONE' AND a."createdAt" < CURRENT_TIMESTAMP - INTERVAL '5 minutes') OR EXISTS (SELECT 1 FROM "CardPaymentOutbox" m WHERE m."attemptId" = a."id" AND (m."state" = 'REVIEW_REQUIRED' OR m."state" = 'PENDING' AND m."createdAt" < CURRENT_TIMESTAMP - INTERVAL '5 minutes')))` : Prisma.sql`TRUE`;
  const rows = await db.$queryRaw(Prisma.sql`SELECT a."id", a."bookOrderId", a."ebookOrderId", a."orderReference", a."amountCents", a."currency", a."state", a."sessionState", a."transactionId", a."reviewReason", a."checkError", a."checkAttempts", a."nextCheckAt", a."createdAt", a."updatedAt",
    (SELECT COALESCE(json_agg(m), '[]'::json) FROM (SELECT "id", "event", "state", "attempts", "lastError", "nextAttemptAt", "processedAt" FROM "CardPaymentOutbox" WHERE "attemptId" = a."id" ORDER BY "createdAt") m) AS "mail",
    (SELECT COALESCE(json_agg(n), '[]'::json) FROM (SELECT "id", "action", "note", "actorId", "createdAt" FROM "CardPaymentOpsNote" WHERE "attemptId" = a."id" ORDER BY "createdAt" DESC LIMIT 10) n) AS "notes"
    FROM "CybersourceLiveAttempt" a WHERE ${where} ORDER BY a."createdAt" DESC, a."id" LIMIT 25 OFFSET ${(page - 1) * 25}`);
  const count = await db.$queryRaw<{ count: number }[]>(Prisma.sql`SELECT COUNT(*)::int AS count FROM "CybersourceLiveAttempt" a WHERE ${where}`);
  const heartbeat = (await db.$queryRaw<{ startedAt: Date; finishedAt: Date | null; state: string; summary: unknown }[]>`SELECT "startedAt", "finishedAt", "state", "summary" FROM "CardPaymentJobStatus" WHERE "id" = 'live-payments'`)[0] || null;
  const latest = heartbeat?.finishedAt || heartbeat?.startedAt;
  return { rows, total: count[0].count, page, heartbeat, schedulerStale: !latest || Date.now() - latest.getTime() > 5 * 60000 };
}
export async function recordPaymentAction(db: Pick<PrismaClient, '$transaction'>, raw: unknown, actorId: string) {
  const input = opsAction.parse(raw);
  if (!actorId) throw Error('ACTOR_REQUIRED');
  return db.$transaction(async tx => {
    const a = (await tx.$queryRaw<{ state: string; updatedAt: Date }[]>`SELECT "state", "updatedAt" FROM "CybersourceLiveAttempt" WHERE "id" = ${input.attemptId} FOR UPDATE`)[0];
    if (!a) throw Error('ATTEMPT_NOT_FOUND');
    if (a.updatedAt.toISOString() !== input.expectedUpdatedAt) throw Error('ATTEMPT_CHANGED');
    if (input.action === 'QUEUE_CHECK') {
      if (!['READY', 'VERIFIED_CAPTURE'].includes(a.state)) throw Error('CHECK_NOT_APPLICABLE');
      // Preserve proof, lease, error and session. Never reopen a card form.
      await tx.$executeRaw`UPDATE "CybersourceLiveAttempt" SET "nextCheckAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${input.attemptId}`;
    }
    await tx.$executeRaw`INSERT INTO "CardPaymentOpsNote" ("id", "attemptId", "actorId", "action", "note") VALUES (${randomUUID()}, ${input.attemptId}, ${actorId}, ${input.action}, ${input.note})`;
    return { saved: true };
  });
}
