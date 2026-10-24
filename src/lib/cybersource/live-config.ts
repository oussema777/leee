import { z } from 'zod';
export const liveSnapshotSchema = z.object({ provider: z.literal('CYBERSOURCE'), environment: z.literal('PRODUCTION'), testMode: z.literal(false), merchantId: z.string().min(1), amountCents: z.number().int().positive(), currency: z.literal('USD') });
export const isLiveCardSnapshot = (value: unknown) => liveSnapshotSchema.safeParse(value).success;
// Separate rollout switch: enabling one backend worker must never expose checkout.
export function liveCustomerEnabled() {
  const flags = ['CYBERSOURCE_LIVE_CUSTOMER_ENABLED', 'CYBERSOURCE_LIVE_ORDER_CREATION_ENABLED', 'CYBERSOURCE_LIVE_SESSION_ENABLED', 'CYBERSOURCE_LIVE_LOOKUP_ENABLED', 'CYBERSOURCE_LIVE_FULFILLMENT_ENABLED', 'CYBERSOURCE_LIVE_JOBS_ENABLED'].every(key => process.env[key] === 'true');
  if (!flags) return false;
  const secret = process.env.CYBERSOURCE_LIVE_SECRET_KEY?.trim() || '';
  return /^[A-Za-z0-9_-]{1,100}$/.test(process.env.CYBERSOURCE_LIVE_MERCHANT_ID?.trim() || '')
    && /^[A-Za-z0-9_-]{1,200}$/.test(process.env.CYBERSOURCE_LIVE_KEY_ID?.trim() || '')
    && /^[A-Za-z0-9+/]+={0,2}$/.test(secret) && secret.length <= 1024 && Buffer.from(secret, 'base64').length >= 32
    && Buffer.from(secret, 'base64').toString('base64').replace(/=+$/, '') === secret.replace(/=+$/, '')
    && (process.env.JWT_SECRET?.length || 0) >= 32 && (process.env.CRON_SECRET?.length || 0) >= 32;
}
