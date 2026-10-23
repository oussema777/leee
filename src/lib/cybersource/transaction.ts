import { createHmac } from "node:crypto";
import { z } from "zod";
import { testCredentials } from "./test-session-request";
import { readBounded } from "./session";

export const transactionIdSchema = z.string().regex(/^\d{10,30}$/);
const application = z.object({ name: z.string(), reasonCode: z.union([z.string(), z.number()]).optional(), rCode: z.union([z.string(), z.number()]).optional(), status: z.string().optional() });
const details = z.object({ id: transactionIdSchema, merchantId: z.string(),
  clientReferenceInformation: z.object({ code: z.string() }),
  orderInformation: z.object({ amountDetails: z.object({ totalAmount: z.string(), currency: z.string(), authorizedAmount: z.string().optional() }) }),
  applicationInformation: z.object({ status: z.string().optional(), reasonCode: z.union([z.string(), z.number()]).optional(), applications: z.array(application).max(30) }),
});
export function decimalCents(value: string) {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(value)) throw Error("TRANSACTION_AMOUNT_INVALID");
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export type TestOutcome = "TEST_AUTHORIZED" | "TEST_CAPTURED" | "TEST_DECLINED" | "REVIEW_REQUIRED";
export function assessTestTransaction(raw: unknown, expected: { transactionId: string; merchantId: string; reference: string; amountCents: number }): TestOutcome {
  const value = details.parse(raw);
  const amount = value.orderInformation.amountDetails;
  if (value.id !== expected.transactionId || value.merchantId !== expected.merchantId || value.clientReferenceInformation.code !== expected.reference || amount.currency !== "USD" || decimalCents(amount.totalAmount) !== expected.amountCents) throw Error("TRANSACTION_BINDING_MISMATCH");
  if (amount.authorizedAmount !== undefined && decimalCents(amount.authorizedAmount) !== expected.amountCents) return "REVIEW_REQUIRED";
  const info = value.applicationInformation;
  // Unknown services, review/reversal/refund and conflicting results stay unresolved.
  const apps = info.applications;
  if (apps.some(a => !["ics_auth", "ics_bill", "ics_decision", "ics_pa_enroll", "ics_pa_validate"].includes(a.name))) return "REVIEW_REQUIRED";
  if (["PENDING_REVIEW", "AUTHORIZED_PENDING_REVIEW", "PENDING_AUTHENTICATION"].includes(info.status || "")) return "REVIEW_REQUIRED";
  const auth = apps.filter(a => a.name === "ics_auth");
  const capture = apps.filter(a => a.name === "ics_bill");
  if (auth.length !== 1 || capture.length > 1) return "REVIEW_REQUIRED";
  const success = (a: z.infer<typeof application>) => String(a.reasonCode) === "100" && String(a.rCode) === "1";
  if (success(auth[0]) && (!info.reasonCode || String(info.reasonCode) === "100") && apps.every(success)) {
    return capture.length === 1 ? "TEST_CAPTURED" : "TEST_AUTHORIZED";
  }
  const declineCodes = new Set(["200", "201", "202", "203", "204", "205", "207", "208", "210", "211", "231", "232", "233", "234"]);
  if (!capture.length && String(auth[0].rCode) === "0" && declineCodes.has(String(auth[0].reasonCode))) return "TEST_DECLINED";
  return "REVIEW_REQUIRED";
}
export async function lookupTestTransaction(transactionId: string, fetcher: typeof fetch = fetch) {
  transactionIdSchema.parse(transactionId);
  const credentials = testCredentials();
  const host = "apitest.cybersource.com", path = `/tss/v2/transactions/${transactionId}`, date = new Date().toUTCString();
  const signed = `host: ${host}\ndate: ${date}\n(request-target): get ${path}\nv-c-merchant-id: ${credentials.merchantId}`;
  const signature = createHmac("sha256", Buffer.from(credentials.secretKey, "base64")).update(signed).digest("base64");
  const response = await fetcher(`https://${host}${path}`, { method: "GET", redirect: "error", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(20000), headers: {
    host, date, "v-c-merchant-id": credentials.merchantId, Accept: "application/hal+json",
    signature: `keyid="${credentials.keyId}", algorithm="HmacSHA256", headers="host date (request-target) v-c-merchant-id", signature="${signature}"`,
  } });
  return JSON.parse(await readBounded(response));
}
