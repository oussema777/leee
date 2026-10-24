import { beforeAll, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { createLiveSession, verifyLiveSession } from './live-session';
const reference = 'LEE-L-12345678-1234-1234-1234-123456789012';
let keys: Awaited<ReturnType<typeof generateKeyPair>>, publicKey: object;
beforeAll(async () => { keys = await generateKeyPair('RS256'); publicKey = await exportJWK(keys.publicKey); });
const data = () => ({ targetOrigins: ['https://www.theleeexperience.com'], clientReferenceInformation: { code: reference }, orderInformation: { amountDetails: { totalAmount: '5.00', currency: 'USD' } }, clientLibrary: 'https://up.cybersource.com/uc/v1/assets/UnifiedCheckout.js', clientLibraryIntegrity: 'sha384-YWJj' });
const token = (value = data(), expiry = '15m') => new SignJWT({ ctx: [{ data: value }] }).setProtectedHeader({ alg: 'RS256', kid: 'local' }).setIssuedAt().setExpirationTime(expiry).sign(keys.privateKey);
const signal = () => new AbortController().signal;
const env = { CYBERSOURCE_LIVE_SESSION_ENABLED: 'true', CYBERSOURCE_LIVE_MERCHANT_ID: 'live-fixture', CYBERSOURCE_LIVE_KEY_ID: 'fixture', CYBERSOURCE_LIVE_SECRET_KEY: Buffer.alloc(32, 7).toString('base64') };
it('creates only a production session and verifies it before returning', async () => {
  const jwt = await token();
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(jwt)).mockResolvedValueOnce(Response.json(publicKey));
  expect((await createLiveSession(500, reference, 'live-fixture', signal(), env, fetcher)).sessionJwt).toBe(jwt);
  expect(fetcher.mock.calls.map(c => c[0])).toEqual(['https://api.cybersource.com/uc/v1/sessions', 'https://api.cybersource.com/flex/v2/public-keys/local']);
  const body = JSON.parse(String(fetcher.mock.calls[0][1]!.body));
  expect(body.completeMandate).toEqual({ type: 'CAPTURE', consumerAuthentication: '3DS' });
  expect(body.data.orderInformation.amountDetails).toEqual({ totalAmount: '5.00', currency: 'USD' });
});
it('fails before transport when disabled or given test/mismatched configuration', async () => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(createLiveSession(500, reference, 'live-fixture', signal(), {}, fetcher)).rejects.toThrow('DISABLED');
  await expect(createLiveSession(500, reference, 'other', signal(), env, fetcher)).rejects.toThrow('CREDENTIALS');
  await expect(createLiveSession(500, 'LEE-T-test', 'live-fixture', signal(), env, fetcher)).rejects.toThrow('INPUT');
  expect(fetcher).not.toHaveBeenCalled();
});
it.each(['amount', 'currency', 'reference', 'origin', 'test-library', 'integrity'])('rejects signed but mismatched %s', async mode => {
  const d = data();
  if (mode === 'amount') d.orderInformation.amountDetails.totalAmount = '9.00';
  if (mode === 'currency') d.orderInformation.amountDetails.currency = 'EUR';
  if (mode === 'reference') d.clientReferenceInformation.code = 'wrong';
  if (mode === 'origin') d.targetOrigins = ['https://other.test'];
  if (mode === 'test-library') d.clientLibrary = 'https://testup.cybersource.com/uc/v1/test.js';
  if (mode === 'integrity') d.clientLibraryIntegrity = '';
  await expect(verifyLiveSession(await token(d), 500, vi.fn<typeof fetch>().mockResolvedValue(Response.json(publicKey)), reference, signal())).rejects.toThrow();
});
it('rejects expired and forged JWTs and never retries failed session creation', async () => {
  await expect(verifyLiveSession(await token(data(), '-1m'), 500, vi.fn<typeof fetch>().mockResolvedValue(Response.json(publicKey)), reference, signal())).rejects.toThrow();
  const forged = (await token()).split('.'); forged[1] = Buffer.from('{}').toString('base64url');
  await expect(verifyLiveSession(forged.join('.'), 500, vi.fn<typeof fetch>().mockResolvedValue(Response.json(publicKey)), reference, signal())).rejects.toThrow();
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 }));
  await expect(createLiveSession(500, reference, 'live-fixture', signal(), env, fetcher)).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
