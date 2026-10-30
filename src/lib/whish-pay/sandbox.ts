import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { collectStatusSchema, createSchema, sandboxConfig, whishClient, WhishError, type CollectStatus } from './client';
import { orderContextSchema, type OrderContext } from './policy';

export const attemptIdSchema = z.string().uuid();
export const prefix = 'whish-sandbox:';
export const attemptSchema = z.object({
  id: attemptIdSchema, createdAt: z.string(), actor: z.string(), request: createSchema,
  collectUrl: z.string().nullable(), status: collectStatusSchema, checkedAt: z.string().nullable(),
  callbackAt: z.string().nullable(), errorCode: z.string().nullable(), uncertain: z.boolean(),
  order: orderContextSchema.optional(),
});
type Attempt = z.infer<typeof attemptSchema>;
export function mergeStatus(previous: CollectStatus, incoming: CollectStatus): CollectStatus {
  if (previous === 'refunded' || incoming === 'refunded') return 'refunded';
  if (previous === 'success' || incoming === 'success') return 'success';
  if (previous === 'failed') return 'failed';
  return incoming;
}
export function summary(value: Attempt) {
  return { id: value.id, externalId: value.request.externalId, amount: value.request.amount, createdAt: value.createdAt,
    collectUrl: value.collectUrl, status: value.status, checkedAt: value.checkedAt, callbackAt: value.callbackAt,
    errorCode: value.errorCode, uncertain: value.uncertain };
}
export async function listAttempts() {
  const rows = await db.bookWhishSettings.findMany({ where: { id: { startsWith: prefix } }, orderBy: { updatedAt: 'desc' }, take: 30 });
  return rows.map(row => summary(attemptSchema.parse(row.config)));
}
export async function load(id: string) {
  attemptIdSchema.parse(id);
  const row = await db.bookWhishSettings.findUnique({ where: { id: prefix + id } });
  if (!row) throw new WhishError('ATTEMPT_NOT_FOUND');
  return attemptSchema.parse(row.config);
}
// Re-read under a row lock after provider I/O: overlapping callback/poll responses cannot downgrade success.
async function update(id: string, change: (current: Attempt) => Attempt) {
  return db.$transaction(async tx => {
    await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "BookWhishSettings" WHERE "id" = ${prefix + id} FOR UPDATE`);
    const row = await tx.bookWhishSettings.findUniqueOrThrow({ where: { id: prefix + id } });
    const next = change(attemptSchema.parse(row.config));
    await tx.bookWhishSettings.update({ where: { id: row.id }, data: { config: next } });
    return next;
  });
}
export function initialAttempt(id: string, actor: string, order?: OrderContext): Attempt {
  attemptIdSchema.parse(id);
  const config = sandboxConfig();
  const externalId = 'LEE-W-SBX-' + id;
  const callback = new URL('/api/webhooks/whish-pay', config.origin);
  callback.searchParams.set('id', id);
  callback.searchParams.set('token', randomBytes(32).toString('hex'));
  const redirect = config.origin + (order?.returnPath || '/admin/whish-pay?attempt=' + id);
  const initial: Attempt = {
    id, actor, createdAt: new Date().toISOString(), collectUrl: null, status: 'unknown',
    checkedAt: null, callbackAt: null, errorCode: null, uncertain: false,
    ...(order ? { order } : {}),
    request: { amount: order ? (order.amountCents / 100).toFixed(2) : '1.00', currency: 'USD', invoice: order ? 'LEE test order ' + order.reference : 'LEE Whish sandbox integration test', externalId,
      successCallbackUrl: callback.href, failureCallbackUrl: callback.href, successRedirectUrl: redirect, failureRedirectUrl: redirect },
  };
  return initial;
}
export async function startAttempt(id: string, actor: string) {
  const config = sandboxConfig();
  const initial = initialAttempt(id, actor);
  // Save the exact body BEFORE any network request. Even a lost browser response reuses the same externalId and URLs.
  const row = await db.bookWhishSettings.upsert({ where: { id: prefix + id }, create: { id: prefix + id, config: initial, updatedBy: actor }, update: {} });
  const attempt = attemptSchema.parse(row.config);
  if (attempt.collectUrl || (!attempt.uncertain && attempt.errorCode)) return summary(attempt);
  try {
    const collectUrl = await whishClient(config).create(attempt.request);
    return summary(await update(id, current => ({ ...current, collectUrl, errorCode: null, uncertain: false })));
  } catch (error) {
    const known = error instanceof WhishError ? error : new WhishError('INVALID_RESPONSE', true);
    return summary(await update(id, current => current.collectUrl ? current : { ...current, errorCode: known.code, uncertain: known.uncertain }));
  }
}
export async function checkAttempt(id: string, callbackToken?: string) {
  const config = sandboxConfig();
  const attempt = await load(id);
  if (callbackToken !== undefined) {
    const expected = new URL(attempt.request.successCallbackUrl).searchParams.get('token')!;
    if (!/^[a-f0-9]{64}$/.test(callbackToken) || !timingSafeEqual(Buffer.from(expected), Buffer.from(callbackToken))) throw new WhishError('INVALID_CALLBACK');
    await update(id, current => ({ ...current, callbackAt: new Date().toISOString() }));
  }
  const status = await whishClient(config).status(attempt.request.externalId);
  const verified = await update(id, current => ({ ...current, status: mergeStatus(current.status, status), checkedAt: new Date().toISOString() }));
  if (verified.order && verified.status === 'success') {
    const { finalizeWhishOrder } = await import('./customer');
    await finalizeWhishOrder(id);
  }
  return summary(verified);
}
