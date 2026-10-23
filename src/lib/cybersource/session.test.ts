import { beforeAll, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { verifyTestSession, createTestSession } from "./session";
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let publicKey: object;
beforeAll(async () => { keys = await generateKeyPair("RS256"); publicKey = await exportJWK(keys.publicKey); });
const data = () => ({ targetOrigins: ["https://www.theleeexperience.com"], orderInformation: { amountDetails: { totalAmount: "5.00", currency: "USD" } }, clientLibrary: "https://testup.cybersource.com/uc/v1/assets/test/UnifiedCheckout.js", clientLibraryIntegrity: "sha384-YWJj" });
async function token(values = data(), expires = "15m") { return new SignJWT({ ctx: [{ data: values }] }).setProtectedHeader({ alg: "RS256", kid: "test-key" }).setIssuedAt().setExpirationTime(expires).sign(keys.privateKey); }
function mockFetch() { return vi.fn<typeof fetch>().mockImplementation(async () => new Response(JSON.stringify(publicKey))); }
describe("verified TEST checkout session", () => {
  it("binds the signed session to its test attempt", async () => {
    const jwt = await token({ ...data(), clientReferenceInformation: { code: "LEE-T-example" } } as ReturnType<typeof data>);
    await expect(verifyTestSession(jwt, 500, mockFetch(), "LEE-T-example")).resolves.toBeDefined();
    await expect(verifyTestSession(jwt, 500, mockFetch(), "LEE-T-other")).rejects.toThrow();
  });
  it("verifies signed session, amount, origin and script before browser use", async () => {
    const fetcher = mockFetch(); const jwt = await token();
    expect((await verifyTestSession(jwt, 500, fetcher)).sessionJwt).toBe(jwt);
    expect(fetcher.mock.calls[0][0]).toBe("https://apitest.cybersource.com/flex/v2/public-keys/test-key");
    expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: "error", credentials: "omit" });
  });
  it("rejects forged and expired tokens", async () => {
    const jwt = await token(); const parts = jwt.split(".");
    parts[1] = Buffer.from(JSON.stringify({ ctx: [{ data: data() }], exp: 9999999999 })).toString("base64url");
    await expect(verifyTestSession(parts.join("."), 500, mockFetch())).rejects.toThrow();
    await expect(verifyTestSession(await token(data(), "-1m"), 500, mockFetch())).rejects.toThrow();
  });
  it("rejects wrong order amount and currency", async () => {
    await expect(verifyTestSession(await token(), 501, mockFetch())).rejects.toThrow("AMOUNT_MISMATCH");
    const changed = data(); changed.orderInformation.amountDetails.currency = "EUR";
    await expect(verifyTestSession(await token(changed), 500, mockFetch())).rejects.toThrow("AMOUNT_MISMATCH");
  });
  it("rejects foreign origins and script hosts even in a signed session", async () => {
    await expect(verifyTestSession(await token({ ...data(), targetOrigins: ["https://evil.test"] }), 500, mockFetch())).rejects.toThrow("ORIGIN_MISMATCH");
    await expect(verifyTestSession(await token({ ...data(), clientLibrary: "https://evil.test/uc/evil.js" }), 500, mockFetch())).rejects.toThrow("LIBRARY_INVALID");
    await expect(verifyTestSession(await token({ ...data(), clientLibraryIntegrity: "" }), 500, mockFetch())).rejects.toThrow("INTEGRITY_MISSING");
  });
  it("does not fetch token-controlled paths or accept another algorithm", async () => {
    const unsafe = await new SignJWT({}).setProtectedHeader({ alg: "RS256", kid: "../production" }).sign(keys.privateKey);
    const fetcher = mockFetch(); await expect(verifyTestSession(unsafe, 500, fetcher)).rejects.toThrow(); expect(fetcher).not.toHaveBeenCalled();
  });
  it("bounds key responses", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("x".repeat(256 * 1024 + 1)));
    await expect(verifyTestSession(await token(), 500, fetcher)).rejects.toThrow("RESPONSE_TOO_LARGE");
  });
  it("never retries failed session creation or falls back to production", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("unavailable", { status: 503 }));
    const env = { CYBERSOURCE_TEST_MERCHANT_ID: "test", CYBERSOURCE_TEST_KEY_ID: "test-key", CYBERSOURCE_TEST_SECRET_KEY: Buffer.alloc(32, 7).toString("base64") };
    await expect(createTestSession(500, env, fetcher)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("https://apitest.cybersource.com/uc/v1/sessions");
  });
});
