import { createHash, createHmac } from 'node:crypto';
import { z } from 'zod';
import { readBounded } from './session';
import { assessTestTransaction, transactionIdSchema } from './transaction';
import type { RecoveryAttempt, VerifiedCaptureLookup } from './live-jobs';

const host = 'api.cybersource.com';
export class LivePaymentNeedsReview extends Error {}
const app = z.object({ name: z.string(), reasonCode: z.union([z.string(), z.number()]).optional(), rCode: z.union([z.string(), z.number()]).optional(), status: z.string().optional() });
const searchSchema = z.object({ totalCount: z.number().int().min(0).max(100), _embedded: z.object({ transactionSummaries: z.array(z.object({ id: transactionIdSchema, clientReferenceInformation: z.object({ code: z.string() }), applicationInformation: z.object({ applications: z.array(app).max(30) }) })).max(100) }).optional() });
type Env = Record<string, string | undefined>;

function credentials(env: Env) {
  if (typeof window !== 'undefined' || env.CYBERSOURCE_LIVE_LOOKUP_ENABLED !== 'true') throw Error('LIVE_LOOKUP_DISABLED');
  // Explicit production credentials only; never fall back to the TEST outlet.
  const merchantId = env.CYBERSOURCE_LIVE_MERCHANT_ID?.trim() || '';
  const keyId = env.CYBERSOURCE_LIVE_KEY_ID?.trim() || '';
  const secret = env.CYBERSOURCE_LIVE_SECRET_KEY?.trim() || '';
  const bytes = Buffer.from(secret, 'base64');
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(merchantId) || !/^[A-Za-z0-9_-]{1,200}$/.test(keyId)
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(secret) || secret.length > 1024 || bytes.length < 32
    || bytes.toString('base64').replace(/=+$/, '') !== secret.replace(/=+$/, '')) throw Error('LIVE_CREDENTIALS_INVALID');
  return { merchantId, keyId, bytes };
}

// Reporting only: never creates/captures/refunds payments or writes to the DB.
export function createLiveCaptureLookup(env: Env = process.env, fetcher: typeof fetch = fetch): VerifiedCaptureLookup {
  return async (attempt: Readonly<RecoveryAttempt>, signal: AbortSignal) => {
    const c = credentials(env);
    if (attempt.environment !== 'PRODUCTION' || attempt.currency !== 'USD' || attempt.merchantId !== c.merchantId
      || !Number.isSafeInteger(attempt.amountCents) || attempt.amountCents <= 0
      || !/^[A-Za-z0-9-]{1,50}$/.test(attempt.id) || /^LEE-(T-|TEST-)/i.test(attempt.id)
      || attempt.state !== 'READY') throw Error('LIVE_ATTEMPT_INVALID');
    if (attempt.transactionId !== null) transactionIdSchema.parse(attempt.transactionId);
    signal.throwIfAborted();
    const boundedSignal = AbortSignal.any([signal, AbortSignal.timeout(20000)]);
    async function request(path: string, body?: string) {
      boundedSignal.throwIfAborted();
      const date = new Date().toUTCString(), method = body === undefined ? 'get' : 'post';
      const digest = body === undefined ? undefined : 'SHA-256=' + createHash('sha256').update(body).digest('base64');
      const names = 'host date (request-target)' + (digest ? ' digest' : '') + ' v-c-merchant-id';
      const signed = `host: ${host}\ndate: ${date}\n(request-target): ${method} ${path}\n` + (digest ? `digest: ${digest}\n` : '') + `v-c-merchant-id: ${c.merchantId}`;
      const signature = createHmac('sha256', c.bytes).update(signed).digest('base64');
      return fetcher(`https://${host}${path}`, { method: method.toUpperCase(), body, signal: boundedSignal, redirect: 'error', credentials: 'omit', cache: 'no-store', headers: {
        host, date, 'v-c-merchant-id': c.merchantId, Accept: body === undefined ? 'application/hal+json' : 'application/json', ...(digest ? { digest, 'Content-Type': 'application/json' } : {}),
        signature: `keyid="${c.keyId}", algorithm="HmacSHA256", headers="${names}", signature="${signature}"`,
      } });
    }
    // Always search, even with a saved ID, to detect a second payment.
    const search = await request('/tss/v2/searches', JSON.stringify({ save: false, name: 'Live order recovery', timezone: 'UTC', query: 'clientReferenceInformation.code:' + attempt.id, offset: 0, limit: 100, sort: 'submitTimeUtc:desc' }));
    const result = searchSchema.parse(JSON.parse(await readBounded(search)));
    const rows = result._embedded?.transactionSummaries || [];
    if (rows.length !== result.totalCount || rows.some(r => r.clientReferenceInformation.code !== attempt.id)) throw Error('LIVE_SEARCH_INCOMPLETE');
    const payments = rows.filter(row => {
      const apps = row.applicationInformation.applications;
      const challenge = apps.some(a => a.name === 'ics_pa_enroll' && String(a.reasonCode) === '475' && String(a.rCode) === '0')
        && apps.every(a => a.name === 'ics_pa_enroll' ? String(a.reasonCode) === '475' && String(a.rCode) === '0' && !a.status
          : ['ics_auth', 'ics_bill'].includes(a.name) && a.reasonCode === undefined && a.rCode === undefined && a.status === undefined);
      return !challenge && apps.some(a => ['ics_auth', 'ics_bill'].includes(a.name));
    });
    if (payments.length > 1) throw new LivePaymentNeedsReview('LIVE_MULTIPLE_PAYMENTS');
    const id = payments[0]?.id;
    if (!id) return { status: 'PENDING' };
    if (attempt.transactionId && attempt.transactionId !== id) throw new LivePaymentNeedsReview('LIVE_TRANSACTION_MISMATCH');
    const response = await request('/tss/v2/transactions/' + id);
    if (response.status === 404 && !response.redirected) { await response.body?.cancel(); return { status: 'PENDING' }; }
    // The shared pure assessor's TEST-prefixed names select no environment and
    // make no network calls. Only fully bound capture evidence passes here.
    const raw = JSON.parse(await readBounded(response));
    const outcome = assessTestTransaction(raw, { transactionId: id, merchantId: c.merchantId, reference: attempt.id, amountCents: attempt.amountCents });
    // A successful reason code must not override a contradictory status.
    const info = z.object({ applicationInformation: z.object({ status: z.string().optional(), applications: z.array(app) }) }).parse(raw).applicationInformation;
    const statuses = [info.status, ...info.applications.map(a => a.status)].filter((s): s is string => !!s);
    if (outcome === 'TEST_CAPTURED' && statuses.some(s => !['AUTHORIZED', 'TRANSMITTED', 'SETTLED', 'COMPLETED', 'SUCCESS'].includes(s))) throw new LivePaymentNeedsReview('LIVE_CONFLICTING_STATUS');
    if (outcome === 'TEST_AUTHORIZED') return { status: 'PENDING' };
    if (outcome !== 'TEST_CAPTURED') throw new LivePaymentNeedsReview('LIVE_PAYMENT_REQUIRES_REVIEW');
    return { status: 'CAPTURED', environment: 'PRODUCTION', merchantId: c.merchantId, reference: attempt.id, transactionId: id, amountCents: attempt.amountCents, currency: 'USD' };
  };
}
