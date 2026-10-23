import { decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import { prepareTestSessionRequest } from "./test-session-request";
const testOrigin = "https://apitest.cybersource.com";
const websiteOrigin = "https://www.theleeexperience.com";
const limit = 256 * 1024;

export async function readBounded(response: Response) {
  if (!response.ok || response.redirected || !response.body) throw Error("CYBERSOURCE_RESPONSE_FAILED");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw Error("CYBERSOURCE_RESPONSE_TOO_LARGE");
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally { await reader.cancel().catch(() => {}); }
}

export async function verifyTestSession(jwt: string, amountCents: number, fetcher: typeof fetch = fetch, reference?: string) {
  if (jwt.length > limit) throw Error("CYBERSOURCE_SESSION_INVALID");
  const header = decodeProtectedHeader(jwt);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(header.kid)) throw Error("CYBERSOURCE_SESSION_INVALID");
  // Ignore token-supplied key URLs; use only the fixed TEST key endpoint.
  const response = await fetcher(`${testOrigin}/flex/v2/public-keys/${header.kid}`, {
    method: "GET", redirect: "error", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(15000),
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
  if (library.origin !== "https://testup.cybersource.com" || !library.pathname.startsWith("/uc/") || library.username || library.password || library.search || library.hash) throw Error("CYBERSOURCE_LIBRARY_INVALID");
  if (!/^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$/.test(data.clientLibraryIntegrity || "")) throw Error("CYBERSOURCE_INTEGRITY_MISSING");
  return { sessionJwt: jwt, clientLibrary: library.href, clientLibraryIntegrity: data.clientLibraryIntegrity!, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

export async function createTestSession(amountCents: number, env: Record<string, string | undefined> = process.env, fetcher: typeof fetch = fetch, reference?: string) {
  const request = prepareTestSessionRequest(amountCents, env, new Date(), reference);
  const response = await fetcher(request.url, { method: "POST", body: request.body, headers: request.headers,
    redirect: "error", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(20000) });
  return verifyTestSession((await readBounded(response)).trim(), amountCents, fetcher, reference);
}
