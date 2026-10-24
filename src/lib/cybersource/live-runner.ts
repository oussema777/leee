import { randomUUID, timingSafeEqual } from 'node:crypto';
import { reconcileLivePayments, drainCardPaymentMail } from './live-jobs';
import { createLiveCaptureLookup } from './live-lookup';

export function authorizedLiveJob(authorization: string | null, secret = process.env.CRON_SECRET) {
  if (!secret || secret.length < 32 || !authorization) return false;
  const expected = Buffer.from('Bearer ' + secret), received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
export async function runLiveJobs(db: Parameters<typeof reconcileLivePayments>[0]) {
  if (process.env.CYBERSOURCE_LIVE_JOBS_ENABLED !== 'true' || process.env.CYBERSOURCE_LIVE_FULFILLMENT_ENABLED !== 'true') return { disabled: true };
  const token = randomUUID();
  const claimed = await db.$executeRaw`INSERT INTO "CardPaymentJobStatus" ("id", "token", "state") VALUES ('live-payments', ${token}, 'RUNNING')
    ON CONFLICT ("id") DO UPDATE SET "token" = ${token}, "startedAt" = CURRENT_TIMESTAMP, "finishedAt" = NULL, "state" = 'RUNNING', "summary" = NULL
    WHERE "CardPaymentJobStatus"."state" <> 'RUNNING' OR "CardPaymentJobStatus"."startedAt" < CURRENT_TIMESTAMP - INTERVAL '3 minutes'`;
  if (!claimed) return { running: true };
  try {
    const payments = await reconcileLivePayments(db, createLiveCaptureLookup());
    const mail = await drainCardPaymentMail(db);
    const summary = { payments, mail };
    const state = payments.failed || mail.failed ? 'FAILED' : 'OK';
    await db.$executeRaw`UPDATE "CardPaymentJobStatus" SET "state" = ${state}, "finishedAt" = CURRENT_TIMESTAMP, "summary" = ${JSON.stringify(summary)}::jsonb WHERE "id" = 'live-payments' AND "token" = ${token}`;
    return summary;
  } catch {
    await db.$executeRaw`UPDATE "CardPaymentJobStatus" SET "state" = 'FAILED', "finishedAt" = CURRENT_TIMESTAMP WHERE "id" = 'live-payments' AND "token" = ${token}`;
    throw Error('LIVE_JOB_FAILED');
  }
}
