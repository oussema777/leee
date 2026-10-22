import { randomUUID } from "node:crypto";
import { configuredGatewayFetch } from "./gateway-fetch";
import { z } from "zod";
import { uatClientInfo } from "./shipment-request";
import { boundedJson } from "./bounded-json";
import { trackingWebhookSchema } from "./tracking";

export const UAT_TRACKING_URL = "https://ws.uat.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";
const optionalText = (max: number) => z.string().max(max).nullish().transform(value => value ?? "");
const resultSchema = z.object({
  HasErrors: z.literal(false), Transaction: z.object({ Reference1: z.string() }),
  TrackingResults: z.array(z.object({ Key: z.string(), Value: z.array(z.object({
    WaybillNumber: z.string(), UpdateCode: z.string(), UpdateDateTime: z.string(),
    UpdateLocation: optionalText(250), Comments: optionalText(2000), ProblemCode: optionalText(30), OrderNumber: optionalText(100),
  })).max(500) })).length(1),
});
export class TrackingLookupError extends Error {}
export function parseTrackingHistory(raw: unknown, awb: string, reference: string, now = new Date()) {
  const parsed = resultSchema.safeParse(raw);
  if (!parsed.success || parsed.data.Transaction.Reference1 !== reference || parsed.data.TrackingResults[0].Key !== awb) {
    throw new TrackingLookupError("INVALID_TRACKING_RESPONSE");
  }
  return parsed.data.TrackingResults[0].Value.map(value => {
    if (value.WaybillNumber !== awb) throw new TrackingLookupError("INVALID_TRACKING_RESPONSE");
    // .NET JSON milliseconds are UTC; its optional offset is metadata, not an
    // additional shift. Naive local date strings are rejected, never guessed.
    const dotnet = /^\/Date\((-?\d{1,15})(?:[+-]\d{4})?\)\/$/.exec(value.UpdateDateTime);
    let date = value.UpdateDateTime;
    if (dotnet) {
      const instant = new Date(Number(dotnet[1]));
      if (!Number.isFinite(instant.getTime())) throw new TrackingLookupError("INVALID_TRACKING_RESPONSE");
      date = instant.toISOString();
    }
    const event = trackingWebhookSchema.safeParse({ Key: awb, Value: { ...value, UpdateDateTime: date } });
    if (!event.success || Date.parse(date) > now.getTime() + 300_000) throw new TrackingLookupError("INVALID_TRACKING_RESPONSE");
    return event.data;
  });
}
export type TrackingLookup = { history(awb: string, signal: AbortSignal): Promise<ReturnType<typeof parseTrackingHistory>> };

export function createTrackingLookup(options: {
  credentials: Parameters<typeof uatClientInfo>[0]; fetchImpl?: typeof fetch; timeoutMs?: number;
}): TrackingLookup {
  const ClientInfo = uatClientInfo(structuredClone(options.credentials));
  const timeout = options.timeoutMs ?? 15_000;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 20_000) throw new TrackingLookupError("INVALID_LOOKUP_TIMEOUT");
  const send = options.fetchImpl ?? fetch;
  return { async history(awb, callerSignal) {
    if (!/^[A-Za-z0-9-]{5,50}$/.test(awb)) throw new TrackingLookupError("INVALID_TRACKING_NUMBER");
    if (callerSignal.aborted) throw new TrackingLookupError("LOOKUP_UNAVAILABLE");
    const reference = randomUUID();
    const controller = new AbortController();
    const abort = () => controller.abort();
    callerSignal.addEventListener("abort", abort, { once: true });
    let onAbort!: () => void;
    const cancelled = new Promise<never>((_, reject) => {
      onAbort = () => reject(new TrackingLookupError("LOOKUP_UNAVAILABLE"));
      controller.signal.addEventListener("abort", onAbort, { once: true });
    });
    const timer = setTimeout(abort, timeout);
    try {
      const work = async () => {
        const response = await send(UAT_TRACKING_URL, {
          method: "POST", redirect: "error", credentials: "omit", cache: "no-store", signal: controller.signal,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ClientInfo, Shipments: [awb], GetLastTrackingUpdateOnly: false, GetUpdateTimeZone: true,
            Transaction: { Reference1: reference, Reference2: "", Reference3: "", Reference4: "", Reference5: "" }, LabelInfo: null }),
        });
        if (!response.ok || response.redirected) {
          void response.body?.cancel().catch(() => {});
          throw new TrackingLookupError("LOOKUP_UNAVAILABLE");
        }
        return parseTrackingHistory(await boundedJson(response, controller.signal), awb, reference);
      };
      return await Promise.race([work(), cancelled]);
    } catch {
      // Keep remote messages, credentials and customer payloads out of API errors.
      throw new TrackingLookupError("LOOKUP_UNAVAILABLE");
    } finally {
      clearTimeout(timer); controller.signal.removeEventListener("abort", onAbort);
      controller.abort(); callerSignal.removeEventListener("abort", abort);
    }
  } };
}

// Deliberately distinct from the existing unverified production credentials.
export function configuredTrackingLookup() {
  if (process.env.ARAMEX_UAT_LOOKUP_ENABLED !== "true") throw new TrackingLookupError("LOOKUP_DISABLED");
  return createTrackingLookup({ fetchImpl: configuredGatewayFetch(), credentials: {
    environment: "UAT", UserName: process.env.ARAMEX_UAT_USERNAME!, Password: process.env.ARAMEX_UAT_PASSWORD!,
    AccountNumber: process.env.ARAMEX_UAT_ACCOUNT_NUMBER!, AccountPin: process.env.ARAMEX_UAT_ACCOUNT_PIN!,
    AccountEntity: process.env.ARAMEX_UAT_ACCOUNT_ENTITY!, AccountCountryCode: process.env.ARAMEX_UAT_ACCOUNT_COUNTRY_CODE as "LB",
    Version: process.env.ARAMEX_UAT_VERSION!,
  } });
}
export function trackingLookupAvailable() {
  try { configuredTrackingLookup(); return true; } catch { return false; }
}
