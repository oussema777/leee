import { createHash, createHmac } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createLiveCaptureLookup } from './live-lookup';
import type { RecoveryAttempt } from './live-jobs';

const env = { CYBERSOURCE_LIVE_LOOKUP_ENABLED: 'true', CYBERSOURCE_LIVE_MERCHANT_ID: 'live-fixture', CYBERSOURCE_LIVE_KEY_ID: 'key-fixture', CYBERSOURCE_LIVE_SECRET_KEY: Buffer.alloc(32, 7).toString('base64') };
const attempt: RecoveryAttempt = { id: 'LEE-L-12345678-1234-1234-1234-123456789012', environment: 'PRODUCTION', merchantId: 'live-fixture', amountCents: 900, currency: 'USD', state: 'READY', transactionId: null, checkAttempts: 1 };
const id = '123456789012';
const apps = [{ name: 'ics_auth', reasonCode: 100, rCode: 1 }, { name: 'ics_bill', reasonCode: 100, rCode: 1 }];
const row = () => ({ id, clientReferenceInformation: { code: attempt.id }, applicationInformation: { applications: apps } });
const search = () => ({ totalCount: 1, _embedded: { transactionSummaries: [row()] } });
const details = () => ({ ...row(), merchantId: attempt.merchantId, orderInformation: { amountDetails: { totalAmount: '9.00', currency: 'USD' } } });
function transport(s: unknown = search(), d: unknown = details(), status = 200) {
  return vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(s)).mockResolvedValueOnce(Response.json(d, { status }));
}
const run = (fetcher: typeof fetch, a = attempt, e = env, signal = new AbortController().signal) => createLiveCaptureLookup(e, fetcher)(a, signal);

it('requires explicit live enablement and separate credentials before any network', async () => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(run(fetcher, attempt, { ...env, CYBERSOURCE_LIVE_LOOKUP_ENABLED: '' })).rejects.toThrow('DISABLED');
  await expect(run(fetcher, attempt, { ...env, CYBERSOURCE_LIVE_SECRET_KEY: '' })).rejects.toThrow('CREDENTIALS');
  expect(fetcher).not.toHaveBeenCalled();
});
it.each([{ environment: 'TEST' }, { id: 'LEE-T-123' }, { id: 'x OR *' }, { merchantId: 'other' }, { currency: 'EUR' }, { amountCents: 0 }, { state: 'APPLIED' }])('rejects invalid saved attempt %j before network', async patch => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(run(fetcher, { ...attempt, ...patch })).rejects.toThrow('INVALID');
  expect(fetcher).not.toHaveBeenCalled();
});
it('signs production search and details independently and returns bound capture', async () => {
  const fetcher = transport();
  await expect(run(fetcher)).resolves.toMatchObject({ status: 'CAPTURED', reference: attempt.id, transactionId: id, amountCents: 900, environment: 'PRODUCTION' });
  for (const [url, init] of fetcher.mock.calls) {
    expect(String(url)).toMatch(/^https:\/\/api.cybersource.com\/tss\/v2\//);
    expect(init).toMatchObject({ redirect: 'error', credentials: 'omit', cache: 'no-store' });
    const h = init!.headers as Record<string, string>;
    expect(h.Accept).toBe(init!.body ? 'application/json' : 'application/hal+json');
    const digest = init!.body ? 'SHA-256=' + createHash('sha256').update(String(init!.body)).digest('base64') : undefined;
    if (digest) expect(h.digest).toBe(digest);
    const signed = `host: api.cybersource.com\ndate: ${h.date}\n(request-target): ${init!.method!.toLowerCase()} ${new URL(String(url)).pathname}\n` + (digest ? `digest: ${digest}\n` : '') + 'v-c-merchant-id: live-fixture';
    expect(h.signature).toContain('signature="' + createHmac('sha256', Buffer.alloc(32, 7)).update(signed).digest('base64') + '"');
  }
  expect(JSON.parse(String(fetcher.mock.calls[0][1]!.body)).query).toBe('clientReferenceInformation.code:' + attempt.id);
});
it('waits for absent reports and details 404 without claiming success', async () => {
  const empty = transport({ totalCount: 0 });
  await expect(run(empty)).resolves.toEqual({ status: 'PENDING' });
  expect(empty).toHaveBeenCalledTimes(1);
  await expect(run(transport(search(), {}, 404))).resolves.toEqual({ status: 'PENDING' });
});
it('rejects incomplete and duplicate search results even with a saved transaction', async () => {
  const incomplete = { ...search(), totalCount: 2 };
  await expect(run(transport(incomplete))).rejects.toThrow('INCOMPLETE');
  const duplicate = { totalCount: 2, _embedded: { transactionSummaries: [row(), { ...row(), id: '999999999999' }] } };
  const fetcher = transport(duplicate);
  await expect(run(fetcher, { ...attempt, transactionId: id })).rejects.toThrow('MULTIPLE');
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('ignores only the explicit unexecuted challenge record', async () => {
  const challenge = { ...row(), id: '888888888888', applicationInformation: { applications: [{ name: 'ics_pa_enroll', reasonCode: 475, rCode: 0 }, { name: 'ics_auth' }, { name: 'ics_bill' }] } };
  await expect(run(transport({ totalCount: 2, _embedded: { transactionSummaries: [challenge, row()] } }))).resolves.toMatchObject({ status: 'CAPTURED' });
});
it.each(['amount', 'currency', 'merchant', 'reference', 'id'])('rejects mismatched full detail %s', async field => {
  const d = details();
  if (field === 'amount') d.orderInformation.amountDetails.totalAmount = '8.00';
  if (field === 'currency') d.orderInformation.amountDetails.currency = 'EUR';
  if (field === 'merchant') d.merchantId = 'other';
  if (field === 'reference') d.clientReferenceInformation.code = 'other';
  if (field === 'id') d.id = '888888888888';
  await expect(run(transport(search(), d))).rejects.toThrow('BINDING');
});
it('never turns authorization, decline or ambiguous capture into paid', async () => {
  const d = details();
  d.applicationInformation.applications = [apps[0]];
  await expect(run(transport(search(), d))).resolves.toEqual({ status: 'PENDING' });
  d.applicationInformation.applications = [{ name: 'ics_auth', reasonCode: 203, rCode: 0 }];
  await expect(run(transport(search(), d))).rejects.toThrow('REVIEW');
  d.applicationInformation.applications = [...apps, { name: 'ics_credit', reasonCode: 100, rCode: 1 }];
  await expect(run(transport(search(), d))).rejects.toThrow('REVIEW');
});
it('rejects contradictory status even when all reason codes report success', async () => {
  const d = { ...details(), applicationInformation: { applications: apps, status: 'REVERSED' } };
  await expect(run(transport(search(), d))).rejects.toThrow('CONFLICTING_STATUS');
});
it('rejects HTTP failures and honours cancellation before and during transport', async () => {
  await expect(run(transport(search(), {}, 500))).rejects.toThrow('RESPONSE_FAILED');
  const c = new AbortController(); c.abort();
  const idle = vi.fn<typeof fetch>();
  await expect(run(idle, attempt, env, c.signal)).rejects.toThrow();
  expect(idle).not.toHaveBeenCalled();
  const active = new AbortController();
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
    active.abort(); expect(init!.signal!.aborted).toBe(true); init!.signal!.throwIfAborted(); return Response.json({});
  });
  await expect(run(fetcher, attempt, env, active.signal)).rejects.toThrow();
});
