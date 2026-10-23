import { describe, expect, it } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { prepareTestSessionRequest, testCredentials } from "./test-session-request";

const env = { CYBERSOURCE_TEST_MERCHANT_ID: "test_merchant", CYBERSOURCE_TEST_KEY_ID: "test-key", CYBERSOURCE_TEST_SECRET_KEY: Buffer.alloc(32, 7).toString("base64") };

describe("Areeba test request preparation", () => {
  it("uses only the test server, approved website origin and exact cents", () => {
    const request = prepareTestSessionRequest(1099, env);
    expect(request.url).toBe("https://apitest.cybersource.com/uc/v1/sessions");
    const body = JSON.parse(request.body);
    expect(body.targetOrigins).toEqual(["https://www.theleeexperience.com"]);
    expect(body.data.orderInformation.amountDetails).toEqual({ totalAmount: "10.99", currency: "USD" });
    expect(request.body).not.toContain(env.CYBERSOURCE_TEST_SECRET_KEY);
  });
  it("signs the exact transmitted bytes with the decoded secret", () => {
    const request = prepareTestSessionRequest(20, env, new Date("2026-10-23T00:00:00Z"));
    const digest = "SHA-256=" + createHash("sha256").update(request.body).digest("base64");
    expect(request.headers.digest).toBe(digest);
    const signatureHeader = request.headers.signature;
    const names = signatureHeader.match(/headers="([^"]+)"/)![1].split(" ");
    const signingText = names.map(name => name + ": " + (name === "(request-target)" ? "post /uc/v1/sessions" : request.headers[name as keyof typeof request.headers])).join("\n");
    const expected = createHmac("sha256", Buffer.alloc(32, 7)).update(signingText).digest("base64");
    expect(signatureHeader).toContain(`signature="${expected}"`);
    expect(request.headers.date).toBe("Fri, 23 Oct 2026 00:00:00 GMT");
    expect(prepareTestSessionRequest(21, env, new Date("2026-10-23T00:00:00Z")).headers.signature).not.toBe(signatureHeader);
  });
  it.each([0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])("rejects invalid cents %s", amount => {
    expect(() => prepareTestSessionRequest(amount, env)).toThrow("CYBERSOURCE_AMOUNT_INVALID");
  });
  it("does not fall back to production or expose credentials in errors", () => {
    expect(() => testCredentials({ CYBERSOURCE_KEY_ID: "production" })).toThrow("CYBERSOURCE_TEST_CREDENTIALS_INVALID");
    for (const override of [{ CYBERSOURCE_TEST_KEY_ID: 'bad"key' }, { CYBERSOURCE_TEST_MERCHANT_ID: "bad\r\nheader" }, { CYBERSOURCE_TEST_SECRET_KEY: "not-base64" }]) {
      expect(() => testCredentials({ ...env, ...override })).toThrow("CYBERSOURCE_TEST_CREDENTIALS_INVALID");
    }
  });
});
