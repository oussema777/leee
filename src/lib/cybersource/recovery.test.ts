import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { findTestPayment, TransactionLookupPending } from './transaction';
import { recoverTestCheckout, checkCustomerResult } from './recovery';
import { paymentResultHint } from './result-hint';
const reference = 'LEE-T-00000000-0000-0000-0000-000000000001';
const paymentId = '123456789012', setupId = '123456789011';
beforeEach(() => {
  vi.stubEnv('CYBERSOURCE_TEST_MERCHANT_ID', 'test'); vi.stubEnv('CYBERSOURCE_TEST_KEY_ID', 'key'); vi.stubEnv('CYBERSOURCE_TEST_SECRET_KEY', Buffer.alloc(32, 7).toString('base64'));
});
afterEach(() => vi.unstubAllEnvs());
const row = (id: string, service: string) => ({ id, clientReferenceInformation: { code: reference }, applicationInformation: { applications: [{ name: service }] } });
function response(rows: unknown[], totalCount = rows.length) { return new Response(JSON.stringify({ totalCount, _embedded: { transactionSummaries: rows } })); }
it('finds the payment among separate 3DS setup records using a signed server reference search', async () => {
  const fetcher = vi.fn(async () => response([row(setupId, 'ics_pa_setup'), row(paymentId, 'ics_auth')]));
  expect(await findTestPayment(reference, fetcher)).toBe(paymentId);
  const [url, options] = (fetcher.mock.calls as unknown as [string, RequestInit][])[0];
  expect(url).toBe('https://apitest.cybersource.com/tss/v2/searches');
  expect(JSON.parse(options.body as string)).toMatchObject({ save: false, query: 'clientReferenceInformation.code:' + reference });
  expect(options.headers).toHaveProperty('signature'); expect(options.redirect).toBe('error');
});
it('does not treat setup alone or no records as a payment', async () => {
  expect(await findTestPayment(reference, async () => response([row(setupId, 'ics_pa_setup')]))).toBeNull();
  expect(await findTestPayment(reference, async () => new Response(JSON.stringify({ totalCount: 0 })))).toBeNull();
});
it('rejects ambiguous, truncated and mismatched searches', async () => {
  await expect(findTestPayment(reference, async () => response([row(paymentId, 'ics_auth'), row(setupId, 'ics_auth')]))).rejects.toThrow('MULTIPLE_PAYMENT');
  await expect(findTestPayment(reference, async () => response([row(paymentId, 'ics_auth')], 2))).rejects.toThrow('INCOMPLETE');
  await expect(findTestPayment(reference, async () => response([{ ...row(paymentId, 'ics_auth'), clientReferenceInformation: { code: 'other' } }]))).rejects.toThrow('INCOMPLETE');
});
it('does not allow a caller to inject a search expression', async () => {
  const fetcher = vi.fn(); await expect(findTestPayment(reference + ' OR *', fetcher)).rejects.toThrow('INVALID_ATTEMPT'); expect(fetcher).not.toHaveBeenCalled();
});
const attempt = () => ({ id: reference, state: 'READY', orderReference: 'LEE-TEST-1', transactionId: null, expiresAt: null, verifiedAt: null, amountCents: 900 } as any);
it('recovers without a browser hint, but independently verifies the full transaction', async () => {
  const db = {} as any, find = vi.fn(async () => paymentId), verify = vi.fn(async () => ({ state: 'TEST_CAPTURED' } as any));
  expect(await recoverTestCheckout(db, attempt(), find, verify)).toMatchObject({ state: 'TEST_CAPTURED' });
  expect(verify).toHaveBeenCalledWith(db, reference, paymentId);
});
it('falls back from a missing checkout hint to the actual payment ID', async () => {
  const verify = vi.fn().mockRejectedValueOnce(new TransactionLookupPending()).mockResolvedValueOnce({ state: 'TEST_CAPTURED' });
  const find = vi.fn(async () => paymentId);
  await expect(checkCustomerResult({} as any, attempt(), setupId, find, verify)).resolves.toMatchObject({ state: 'TEST_CAPTURED' });
  expect(verify.mock.calls.map(c => c[2])).toEqual([setupId, paymentId]);
});
it('does not mask binding errors or repeat the same missing lookup', async () => {
  const find = vi.fn(async () => setupId), verify = vi.fn().mockRejectedValue(new TransactionLookupPending());
  await expect(checkCustomerResult({} as any, attempt(), setupId, find, verify)).rejects.toBeInstanceOf(TransactionLookupPending);
  expect(verify).toHaveBeenCalledTimes(1);
  verify.mockRejectedValueOnce(Error('TRANSACTION_BINDING_MISMATCH')); find.mockClear();
  await expect(checkCustomerResult({} as any, attempt(), setupId, find, verify)).rejects.toThrow('BINDING_MISMATCH');
  expect(find).not.toHaveBeenCalled();
});
it('does not requery a captured or declined attempt', async () => {
  const find = vi.fn(), verify = vi.fn();
  for (const state of ['TEST_CAPTURED', 'TEST_DECLINED']) await recoverTestCheckout({} as any, { ...attempt(), state }, find, verify);
  expect(find).not.toHaveBeenCalled(); expect(verify).not.toHaveBeenCalled();
});
it('prefers the completed payment ID over the outer checkout ID without trusting its status', () => {
  const token = (v: unknown) => 'header.' + Buffer.from(JSON.stringify(v)).toString('base64url') + '.signature';
  expect(paymentResultHint(token({ id: setupId, completeResponse: { id: paymentId } }))).toBe(paymentId);
  expect(paymentResultHint(token({ id: paymentId }))).toBe(paymentId);
  expect(paymentResultHint(token({ id: setupId, completeResponse: { id: 'invalid' } }))).toBeNull();
  expect(paymentResultHint('malformed')).toBeNull();
});
