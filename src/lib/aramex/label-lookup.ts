import { randomUUID } from "node:crypto";
import { configuredGatewayFetch } from "./gateway-fetch";
import { z } from "zod";
import { uatClientInfo } from "./shipment-request";
import { boundedJson } from "./bounded-json";
import { safeLabelUrl } from "./submission-status";

export const UAT_LABEL_URL = "https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/PrintLabel";
export class LabelLookupError extends Error {}
export function parseLabel(raw: unknown, awb: string, reference: string) {
  const parsed = z.object({ HasErrors: z.literal(false), Transaction: z.object({ Reference1: z.literal(reference) }),
    ShipmentNumber: z.literal(awb), ShipmentLabel: z.object({ LabelURL: z.string() }) }).safeParse(raw);
  const url = parsed.success ? safeLabelUrl(parsed.data.ShipmentLabel.LabelURL) : null;
  if (!url) throw new LabelLookupError("INVALID_LABEL_RESPONSE");
  return url;
}
export type LabelLookup = { label(awb: string, signal: AbortSignal): Promise<string> };

export function createLabelLookup(options: {
  originEntity: string; reportId: number; credentials: Parameters<typeof uatClientInfo>[0]; fetchImpl?: typeof fetch; timeoutMs?: number;
}): LabelLookup {
  const ClientInfo = uatClientInfo(structuredClone(options.credentials));
  const originEntity = z.string().regex(/^[A-Z0-9]{3}$/).parse(options.originEntity);
  const reportId = z.number().int().positive().safe().parse(options.reportId);
  const timeout = options.timeoutMs ?? 15_000;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 20_000) throw new LabelLookupError("INVALID_LOOKUP_TIMEOUT");
  const send = options.fetchImpl ?? fetch;
  return { async label(awb, callerSignal) {
    if (!/^[A-Za-z0-9-]{5,50}$/.test(awb)) throw new LabelLookupError("INVALID_TRACKING_NUMBER");
    if (callerSignal.aborted) throw new LabelLookupError("LOOKUP_UNAVAILABLE");
    const reference = randomUUID();
    const controller = new AbortController();
    const abort = () => controller.abort();
    callerSignal.addEventListener("abort", abort, { once: true });
    let onAbort!: () => void;
    const cancelled = new Promise<never>((_, reject) => {
      onAbort = () => reject(new LabelLookupError("LOOKUP_UNAVAILABLE"));
      controller.signal.addEventListener("abort", onAbort, { once: true });
    });
    const timer = setTimeout(abort, timeout);
    try {
      const work = async () => {
        const response = await send(UAT_LABEL_URL, {
          method: "POST", redirect: "error", credentials: "omit", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ClientInfo, ShipmentNumber: awb, ProductGroup: "DOM", OriginEntity: originEntity,
            Transaction: { Reference1: reference, Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
            LabelInfo: { ReportID: reportId, ReportType: "URL" } }),
        });
        if (!response.ok || response.redirected) {
          void response.body?.cancel().catch(() => {});
          throw new LabelLookupError("LOOKUP_UNAVAILABLE");
        }
        return parseLabel(await boundedJson(response, controller.signal), awb, reference);
      };
      return await Promise.race([work(), cancelled]);
    } catch {
      // Keep remote messages, credentials and customer payloads out of API errors.
      throw new LabelLookupError("LOOKUP_UNAVAILABLE");
    } finally {
      clearTimeout(timer); controller.signal.removeEventListener("abort", onAbort);
      controller.abort(); callerSignal.removeEventListener("abort", abort);
    }
  } };
}

// Deliberately distinct from the existing unverified production credentials.
export function configuredLabelLookup() {
  if (process.env.ARAMEX_UAT_LABEL_ENABLED !== "true") throw new LabelLookupError("LOOKUP_DISABLED");
  return createLabelLookup({ fetchImpl: configuredGatewayFetch(), originEntity: process.env.ARAMEX_UAT_ORIGIN_ENTITY!,
    reportId: Number(process.env.ARAMEX_UAT_LABEL_REPORT_ID), credentials: {
    environment: "UAT", UserName: process.env.ARAMEX_UAT_USERNAME!, Password: process.env.ARAMEX_UAT_PASSWORD!,
    AccountNumber: process.env.ARAMEX_UAT_ACCOUNT_NUMBER!, AccountPin: process.env.ARAMEX_UAT_ACCOUNT_PIN!,
    AccountEntity: process.env.ARAMEX_UAT_ACCOUNT_ENTITY!, AccountCountryCode: process.env.ARAMEX_UAT_ACCOUNT_COUNTRY_CODE as "LB",
    Version: process.env.ARAMEX_UAT_VERSION!,
  } });
}
export function labelLookupAvailable() {
  try { configuredLabelLookup(); return true; } catch { return false; }
}
