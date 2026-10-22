import { attachShipmentCredentials, buildShipmentRequest } from "./shipment-request";
import { parseShipmentResponse, type ShipmentOutcome } from "./shipment-response";
import type { ShipmentTransport } from "./submission";

// Supplied UAT collection. No production endpoint or caller-controlled URL.
export const UAT_CREATE_SHIPMENTS_URL = "https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
import { boundedJson } from "./bounded-json";

/** Server-side factory used by the default-off UAT submission route.
 * Supply verified UAT settings explicitly. Application factories inject the
 * authenticated VPS gateway fetch; isolated tests may inject their own mock.
 * Neither settings nor credential-bearing bodies are logged or persisted here.
 */
export function createUatTransport(options: {
  settings: Parameters<typeof buildShipmentRequest>[1];
  schedule: Parameters<typeof buildShipmentRequest>[2];
  credentials: Parameters<typeof attachShipmentCredentials>[1];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): ShipmentTransport {
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20_000) throw Error("INVALID_UAT_TIMEOUT");
  // Snapshot configuration: caller mutation must not change an in-flight attempt.
  const settings = structuredClone(options.settings);
  const schedule = structuredClone(options.schedule);
  const credentials = structuredClone(options.credentials);
  const send = options.fetchImpl ?? fetch;
  const build = (preparation: Parameters<typeof buildShipmentRequest>[0], submissionKey: string) =>
    attachShipmentCredentials(buildShipmentRequest(preparation, settings, schedule, submissionKey), credentials);
  return {
    environment: "UAT",
    validatePreparation(preparation) { build(preparation, "preflight"); },
    async createShipment(request, callerSignal): Promise<ShipmentOutcome> {
      if (callerSignal.aborted) return { kind: "unknown" };
      const controller = new AbortController();
      const abort = () => controller.abort();
      callerSignal.addEventListener("abort", abort, { once: true });
      let onAbort!: () => void;
      const cancelled = new Promise<ShipmentOutcome>(resolve => {
        onAbort = () => resolve({ kind: "unknown" });
        controller.signal.addEventListener("abort", onAbort, { once: true });
      });
      const timer = setTimeout(abort, timeoutMs);
      try {
        const body = JSON.stringify(build(request.preparation, request.submissionKey));
        const work = async (): Promise<ShipmentOutcome> => {
          // Exactly one request, with redirects prohibited to protect credentials.
          const response = await send(UAT_CREATE_SHIPMENTS_URL, {
            method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
            body, signal: controller.signal, redirect: "error", cache: "no-store", credentials: "omit",
          });
          if (!response.ok || response.redirected) {
            void response.body?.cancel().catch(() => {});
            return { kind: "unknown" };
          }
          return parseShipmentResponse(await boundedJson(response, controller.signal), {
            submissionKey: request.submissionKey, orderReference: request.preparation.orderReference,
          });
        };
        return await Promise.race([work(), cancelled]);
      } catch {
        // No raw exception, response body, credentials or customer data escapes.
        return { kind: "unknown" };
      } finally {
        clearTimeout(timer);
        controller.abort();
        controller.signal.removeEventListener("abort", onAbort);
        callerSignal.removeEventListener("abort", abort);
      }
    },
  };
}
