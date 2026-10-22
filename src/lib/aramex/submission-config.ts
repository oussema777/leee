import { shipmentSettingsSchema, uatClientInfo } from "./shipment-request";
import { createUatTransport } from "./uat-transport";
import { z } from "zod";
import { configuredGatewayFetch } from "./gateway-fetch";

export const submissionInputSchema = z.object({
  expectedDraftVersion: z.number().int().positive(),
  confirmedUat: z.literal(true),
  shippingAt: z.string().datetime({ offset: true }),
  dueAt: z.string().datetime({ offset: true }),
}).strict();
export function validateSubmissionSchedule(input: z.infer<typeof submissionInputSchema>, now = Date.now()) {
  const shipping = Date.parse(input.shippingAt), due = Date.parse(input.dueAt);
  // Explicit dates, never guessed from delivery fees, order dates or server timezone.
  return shipping >= now && shipping <= now + 7 * 86400000 && due >= shipping && due <= shipping + 30 * 86400000;
}
export function configuredSubmissionTransport(schedule: { shippingAt: string; dueAt: string }) {
  if (process.env.ARAMEX_UAT_SUBMISSION_ENABLED !== "true") throw Error("SUBMISSION_DISABLED");
  const settings = shipmentSettingsSchema.parse(JSON.parse(process.env.ARAMEX_UAT_SHIPMENT_SETTINGS_JSON || "null"));
  const credentials = {
    environment: "UAT" as const, UserName: process.env.ARAMEX_UAT_USERNAME!, Password: process.env.ARAMEX_UAT_PASSWORD!,
    AccountNumber: process.env.ARAMEX_UAT_ACCOUNT_NUMBER!, AccountPin: process.env.ARAMEX_UAT_ACCOUNT_PIN!,
    AccountEntity: process.env.ARAMEX_UAT_ACCOUNT_ENTITY!, AccountCountryCode: process.env.ARAMEX_UAT_ACCOUNT_COUNTRY_CODE as "LB",
    Version: process.env.ARAMEX_UAT_VERSION!,
  };
  uatClientInfo(credentials);
  return createUatTransport({ settings, credentials, schedule, fetchImpl: configuredGatewayFetch() });
}
