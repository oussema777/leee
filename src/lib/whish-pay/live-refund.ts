import { db } from '@/lib/db';
import { lock } from '@/lib/ebooks/server';
import { liveConfig, whishClient, WhishError } from './client';
import { loadLiveAttempt, checkLiveWhish } from './live';

export async function refundLiveWhish(id: string, reason: string, actor: string, expectedAmountCents: number) {
  if (process.env.WHISH_PAY_LIVE_REFUNDS_ENABLED !== 'true') throw new WhishError('REFUND_EGRESS_NOT_ENABLED');
  const a = await loadLiveAttempt(id), config = liveConfig();
  if (a.channel !== config.channel || a.order.amountCents !== expectedAmountCents || !reason.trim() || reason.length > 500) throw new WhishError('REFUND_REQUEST_INVALID');
  await checkLiveWhish(id);
  const verified = await loadLiveAttempt(id);
  if (verified.status === 'refunded') return { refunded: true };
  if (verified.status !== 'success') throw new WhishError('PAYMENT_NOT_REFUNDABLE');
  const key = 'whish-live-refund:' + id;
  const saved = await db.$transaction(async tx => {
    await lock(tx, key);
    const existing = await tx.bookWhishSettings.findUnique({ where: { id: key } });
    if (existing) return existing.config as { reason: string; actor: string };
    const request = { reason: reason.trim(), actor, createdAt: new Date().toISOString() };
    await tx.bookWhishSettings.create({ data: { id: key, updatedBy: actor, config: request } });
    return request;
  });
  // The original externalId makes uncertain/repeated requests idempotent at Whish.
  // Never send credentials through an arbitrary caller-provided proxy.
  await whishClient(config).refund(a.request.externalId, saved.reason);
  await checkLiveWhish(id);
  return { refunded: (await loadLiveAttempt(id)).status === 'refunded' };
}
