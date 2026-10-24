import { createHash, createHmac } from 'node:crypto';
import { decodeProtectedHeader, importJWK, jwtVerify } from 'jose';
import { readBounded } from './session';
const websiteOrigin = 'https://www.theleeexperience.com';
const limit = 256 * 1024;
export async function verifyLiveSession(jwt: string, amountCents: number, fetcher: typeof fetch, reference: string, signal: AbortSignal) {
  if (jwt.length > limit) throw Error("CYBERSOURCE_SESSION_INVALID");
  const header = decodeProtectedHeader(jwt);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(header.kid)) throw Error("CYBERSOURCE_SESSION_INVALID");
  // Ignore token-supplied key URLs; use only the fixed PRODUCTION key endpoint.
  const response = await fetcher(`https://api.cybersource.com/flex/v2/public-keys/${header.kid}`, {
    method: "GET", redirect: "error", credentials: "omit", cache: "no-store", signal,
  });
  const jwk = JSON.parse(await readBounded(response));
  if (jwk.kty !== "RSA" || jwk.d || (jwk.kid && jwk.kid !== header.kid)) throw Error("CYBERSOURCE_KEY_INVALID");
  const key = await importJWK(jwk, "RS256");
  const { payload } = await jwtVerify(jwt, key, { algorithms: ["RS256"], requiredClaims: ["iat", "exp"], clockTolerance: 5 });
  if (typeof payload.iat !== "number" || typeof payload.exp !== "number" || payload.iat > Date.now() / 1000 + 5 || payload.exp - payload.iat > 3600) throw Error("CYBERSOURCE_SESSION_INVALID");
  const contexts = payload.ctx as { data?: { clientReferenceInformation?: { code?: string }; targetOrigins?: string[]; clientLibrary?: string; clientLibraryIntegrity?: string; orderInformation?: { amountDetails?: { totalAmount?: string; currency?: string } } } }[] | undefined;
  const data = contexts?.[0]?.data;
  if (!data || !Array.isArray(data.targetOrigins) || data.targetOrigins.length !== 1 || data.targetOrigins[0] !== websiteOrigin) throw Error("CYBERSOURCE_ORIGIN_MISMATCH");
  const amount = data.orderInformation?.amountDetails;
  if (reference && data.clientReferenceInformation?.code !== reference) throw Error("CYBERSOURCE_REFERENCE_MISMATCH");
  if (!amount || amount.totalAmount !== (amountCents / 100).toFixed(2) || amount.currency !== "USD") throw Error("CYBERSOURCE_AMOUNT_MISMATCH");
  const library = new URL(data.clientLibrary || "");
  if (library.origin !== "https://up.cybersource.com" || !library.pathname.startsWith("/uc/") || library.username || library.password || library.search || library.hash) throw Error("CYBERSOURCE_LIBRARY_INVALID");
  if (!/^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$/.test(data.clientLibraryIntegrity || "")) throw Error("CYBERSOURCE_INTEGRITY_MISSING");
  return { sessionJwt: jwt, clientLibrary: library.href, clientLibraryIntegrity: data.clientLibraryIntegrity!, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

export async function createLiveSession(amountCents: number, reference: string, merchantId: string, signal: AbortSignal,
  env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch) {
  if (typeof window !== 'undefined' || env.CYBERSOURCE_LIVE_SESSION_ENABLED !== 'true') throw Error('LIVE_SESSION_DISABLED');
  const keyId = env.CYBERSOURCE_LIVE_KEY_ID?.trim() || '', secret = env.CYBERSOURCE_LIVE_SECRET_KEY?.trim() || '';
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(merchantId) || merchantId !== env.CYBERSOURCE_LIVE_MERCHANT_ID?.trim()
    || !/^[A-Za-z0-9_-]{1,200}$/.test(keyId) || !/^[A-Za-z0-9+/]+={0,2}$/.test(secret) || secret.length > 1024
    || Buffer.from(secret, 'base64').length < 32 || Buffer.from(secret, 'base64').toString('base64').replace(/=+$/, '') !== secret.replace(/=+$/, '')) throw Error('LIVE_CREDENTIALS_INVALID');
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > 99999999 || !/^LEE-L-[a-f0-9-]{36}$/.test(reference)) throw Error('LIVE_SESSION_INPUT_INVALID');
  signal.throwIfAborted();
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(20000)]);
  const host = 'api.cybersource.com', path = '/uc/v1/sessions', date = new Date().toUTCString();
  const body = JSON.stringify({ targetOrigins: [websiteOrigin], country: 'LB', locale: 'en_US',
    captureMandate: { billingType: 'PARTIAL', requestShipping: false, showConfirmationStep: false, requestSaveCredentials: false },
    completeMandate: { type: 'CAPTURE', consumerAuthentication: '3DS' },
    data: { clientReferenceInformation: { code: reference }, orderInformation: { amountDetails: { totalAmount: (amountCents / 100).toFixed(2), currency: 'USD' } } },
  });
  const digest = 'SHA-256=' + createHash('sha256').update(body).digest('base64');
  const signed = `host: ${host}\ndate: ${date}\n(request-target): post ${path}\ndigest: ${digest}\nv-c-merchant-id: ${merchantId}`;
  const signature = createHmac('sha256', Buffer.from(secret, 'base64')).update(signed).digest('base64');
  const response = await fetcher(`https://${host}${path}`, { method: 'POST', body, signal: bounded, redirect: 'error', credentials: 'omit', cache: 'no-store', headers: {
    host, date, digest, 'v-c-merchant-id': merchantId, 'Content-Type': 'application/json',
    signature: `keyid="${keyId}", algorithm="HmacSHA256", headers="host date (request-target) digest v-c-merchant-id", signature="${signature}"`,
  } });
  return verifyLiveSession((await readBounded(response)).trim(), amountCents, fetcher, reference, bounded);
}

