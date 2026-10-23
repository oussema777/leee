import { createHash, createHmac } from "node:crypto";

// Server-side request preparation only. No network calls or payment state changes.
// HTTP Signature follows the Areeba guide supplied for this TEST outlet.
const host = "apitest.cybersource.com";
const path = "/uc/v1/sessions";
const origin = "https://www.theleeexperience.com";

type Credentials = { merchantId: string; keyId: string; secretKey: string };

export function testCredentials(env: Record<string, string | undefined> = process.env): Credentials {
  const merchantId = env.CYBERSOURCE_TEST_MERCHANT_ID?.trim() ?? "";
  const keyId = env.CYBERSOURCE_TEST_KEY_ID?.trim() ?? "";
  const secretKey = env.CYBERSOURCE_TEST_SECRET_KEY?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(merchantId) || !/^[A-Za-z0-9_-]{1,200}$/.test(keyId)) {
    throw new Error("CYBERSOURCE_TEST_CREDENTIALS_INVALID");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(secretKey) || secretKey.length > 1024) {
    throw new Error("CYBERSOURCE_TEST_CREDENTIALS_INVALID");
  }
  const decoded = Buffer.from(secretKey, "base64");
  if (decoded.length < 32 || decoded.toString("base64").replace(/=+$/, "") !== secretKey.replace(/=+$/, "")) {
    throw new Error("CYBERSOURCE_TEST_CREDENTIALS_INVALID");
  }
  return { merchantId, keyId, secretKey };
}

/** The caller must supply the saved order total, never a browser-provided price.
 * This function does not create a payment session; transport and order binding
 * will be implemented before any customer checkout route is exposed.
 */
export function prepareTestSessionRequest(amountCents: number, env: Record<string, string | undefined> = process.env, now = new Date(), reference?: string) {
  if (typeof window !== "undefined") throw new Error("SERVER_ONLY");
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > 99_999_999) {
    throw new Error("CYBERSOURCE_AMOUNT_INVALID");
  }
  if (!Number.isFinite(now.getTime())) throw new Error("CYBERSOURCE_DATE_INVALID");
  const credentials = testCredentials(env);
  if (reference !== undefined && !/^[A-Za-z0-9-]{1,50}$/.test(reference)) throw Error("CYBERSOURCE_REFERENCE_INVALID");
  const body = JSON.stringify({
    targetOrigins: [origin], country: "LB", locale: "en_US",
    captureMandate: { billingType: "PARTIAL", requestShipping: false, showConfirmationStep: false, requestSaveCredentials: false },
    completeMandate: { type: "CAPTURE", consumerAuthentication: "3DS" },
    data: { ...(reference ? { clientReferenceInformation: { code: reference } } : {}), orderInformation: { amountDetails: { totalAmount: (amountCents / 100).toFixed(2), currency: "USD" } } },
  });
  const date = now.toUTCString();
  const digest = `SHA-256=${createHash("sha256").update(body, "utf8").digest("base64")}`;
  const signed = `host: ${host}\ndate: ${date}\n(request-target): post ${path}\ndigest: ${digest}\nv-c-merchant-id: ${credentials.merchantId}`;
  const signature = createHmac("sha256", Buffer.from(credentials.secretKey, "base64")).update(signed, "utf8").digest("base64");
  return {
    url: `https://${host}${path}`, method: "POST" as const, body,
    headers: {
      host, date, digest, "v-c-merchant-id": credentials.merchantId, "Content-Type": "application/json",
      signature: `keyid="${credentials.keyId}", algorithm="HmacSHA256", headers="host date (request-target) digest v-c-merchant-id", signature="${signature}"`,
    },
  };
}
