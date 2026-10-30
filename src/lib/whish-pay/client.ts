import { z } from 'zod';

// This module is imported exclusively by server routes/services. Never expose its config.
export const SANDBOX_URL = 'https://partner.api.sbx.whish.money/itel-service/api';
export class WhishError extends Error {
  constructor(public code: string, public uncertain = false) { super(code); }
}
export type WhishConfig = { channel: string; secret: string; websiteUrl: string; origin: string };
export function sandboxConfig(env: Record<string, string | undefined> = process.env): WhishConfig {
  if (env.WHISH_PAY_SANDBOX_ENABLED !== 'true') throw new WhishError('SANDBOX_DISABLED');
  const { WHISH_PAY_CHANNEL: channel, WHISH_PAY_SECRET: secret, WHISH_PAY_WEBSITE_URL: websiteUrl, WHISH_PAY_PUBLIC_ORIGIN: origin } = env;
  if (!channel || !secret || !websiteUrl || !origin) throw new WhishError('CONFIGURATION_REQUIRED');
  let url: URL;
  try { url = new URL(origin); } catch { throw new WhishError('PUBLIC_ORIGIN_REQUIRED'); }
  // Callbacks need a public HTTPS deployment. Limit configuration to our site or Vercel previews.
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash ||
    !(['theleeexperience.com', 'www.theleeexperience.com'].includes(url.hostname) || url.hostname.endsWith('.vercel.app'))) throw new WhishError('PUBLIC_ORIGIN_REQUIRED');
  return { channel, secret, websiteUrl, origin: url.origin };
}
export const createSchema = z.object({
  amount: z.string().regex(/^(?:[1-9]\d*)(?:\.\d{1,2})?$/), currency: z.literal('USD'),
  externalId: z.string().min(1).max(100), invoice: z.string().max(200),
  successCallbackUrl: z.url(), failureCallbackUrl: z.url(), successRedirectUrl: z.url(), failureRedirectUrl: z.url(),
}).strict();
export type CreatePayment = z.infer<typeof createSchema>;
export const collectStatusSchema = z.enum(['pending', 'success', 'failed', 'refunded', 'unknown']);
export type CollectStatus = z.infer<typeof collectStatusSchema>;
export function safeCollectUrl(value: unknown): string {
  if (typeof value !== 'string') throw new WhishError('INVALID_PAYMENT_LINK', true);
  let url: URL;
  try { url = new URL(value); } catch { throw new WhishError('INVALID_PAYMENT_LINK', true); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
    !(url.hostname === 'whish.money' || url.hostname.endsWith('.whish.money'))) throw new WhishError('INVALID_PAYMENT_LINK', true);
  return url.href;
}
export function whishClient(config: WhishConfig, transport: typeof fetch = fetch) {
  async function call(path: string, body?: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await transport(SANDBOX_URL + path, {
        method: body === undefined ? 'GET' : 'POST', cache: 'no-store', redirect: 'error',
        signal: AbortSignal.timeout(15000), headers: {
          channel: config.channel, secret: config.secret, websiteUrl: config.websiteUrl,
          'User-Agent': 'LEEExperience/1.0 (https://theleeexperience.com; info@theleeexperience.com)',
          'Content-Type': 'application/json',
        }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch { throw new WhishError('TRANSPORT_UNCERTAIN', true); }
    if (!response.ok) throw new WhishError('HTTP_' + response.status, true);
    let raw: unknown;
    try { raw = await response.json(); } catch { throw new WhishError('INVALID_RESPONSE', true); }
    const result = z.object({ status: z.boolean(), code: z.string().nullable(), data: z.unknown() }).safeParse(raw);
    if (!result.success) throw new WhishError('INVALID_RESPONSE', true);
    if (!result.data.status) {
      const code = result.data.code || 'INVALID_RESPONSE';
      throw new WhishError(code, ['500', 'itel.unknown_error', 'fatal', 'INVALID_RESPONSE'].includes(code));
    }
    if (result.data.code !== null) throw new WhishError('INVALID_RESPONSE', true);
    return result.data.data;
  }
  return {
    async balance() { await call('/payment/account/balance?currency=USD'); return { authenticated: true }; },
    async create(input: CreatePayment) {
      const data = await call('/payment/whish', createSchema.parse(input));
      const result = z.object({ collectUrl: z.string() }).safeParse(data);
      if (!result.success) throw new WhishError('INVALID_PAYMENT_LINK', true);
      return safeCollectUrl(result.data.collectUrl);
    },
    async status(externalId: string): Promise<CollectStatus> {
      const data = await call('/payment/collect/status', { externalId, currency: 'USD' });
      const result = z.object({ collectStatus: collectStatusSchema }).safeParse(data);
      if (!result.success) throw new WhishError('INVALID_STATUS', true);
      return result.data.collectStatus;
    },
  };
}
