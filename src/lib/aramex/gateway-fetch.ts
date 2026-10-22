// Server-side only. Never expose the gateway key through a public env variable.
const gatewayOrigin = "https://aramex-gateway.theleeexperience.com";
const routes: Record<string, string> = {
  "https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments": "/uat/shipments",
  "https://ws.uat.aramex.net/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments": "/uat/tracking",
  "https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/PrintLabel": "/uat/label",
};
export class GatewayError extends Error {}

export function createGatewayFetch(options: { url: string; key: string; fetchImpl?: typeof fetch }): typeof fetch {
  // An explicit allowlist prevents accidental delivery of secrets to another host.
  if (![gatewayOrigin, `${gatewayOrigin}/`].includes(options.url) || !/^[a-f0-9]{64}$/.test(options.key)) {
    throw new GatewayError("GATEWAY_NOT_CONFIGURED");
  }
  const key = options.key;
  const send = options.fetchImpl ?? fetch;
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : "";
    const route = Object.hasOwn(routes, url) ? routes[url] : undefined;
    if (!route || init?.method !== "POST" || typeof init.body !== "string" || !init.signal
      || new TextEncoder().encode(init.body).byteLength > 256 * 1024) throw new GatewayError("INVALID_GATEWAY_REQUEST");
    if (init.signal.aborted) throw new GatewayError("GATEWAY_UNAVAILABLE");
    try {
      const response = await send(`${gatewayOrigin}${route}`, {
        method: "POST", body: init.body, signal: init.signal,
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${key}` },
        credentials: "omit", redirect: "error", cache: "no-store", referrerPolicy: "no-referrer",
      });
      if (response.redirected) {
        void response.body?.cancel().catch(() => {});
        throw new GatewayError("GATEWAY_UNAVAILABLE");
      }
      // Adapters retain bounded parsing and their existing handling of 401/429/502.
      // In particular, a failed booking response is UNKNOWN, never retried.
      return response;
    } catch {
      throw new GatewayError("GATEWAY_UNAVAILABLE");
    }
  };
}

export function configuredGatewayFetch(): typeof fetch {
  // No direct-fetch fallback, including when configuration is missing or invalid.
  return createGatewayFetch({ url: process.env.ARAMEX_UAT_GATEWAY_URL ?? "", key: process.env.ARAMEX_UAT_GATEWAY_KEY ?? "" });
}
