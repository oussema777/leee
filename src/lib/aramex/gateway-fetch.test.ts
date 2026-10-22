import { afterEach, describe, expect, it, vi } from "vitest";
import { createGatewayFetch, configuredGatewayFetch } from "./gateway-fetch";
import { configuredSubmissionTransport } from "./submission-config";
import { configuredTrackingLookup } from "./tracking-lookup";
import { configuredLabelLookup } from "./label-lookup";
import { testCredentials, testSettings, testSchedule, testPreparation, testResponse } from "./uat-test-fixtures";
const gateway = "https://aramex-gateway.theleeexperience.com";
const upstream = "https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
const key = "a".repeat(64);
const init = () => ({ method: "POST", body: "{}", signal: new AbortController().signal });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
function configure() {
  const c = testCredentials();
  const vars = { USERNAME: c.UserName, PASSWORD: c.Password, ACCOUNT_NUMBER: c.AccountNumber, ACCOUNT_PIN: c.AccountPin,
    ACCOUNT_ENTITY: c.AccountEntity, ACCOUNT_COUNTRY_CODE: c.AccountCountryCode, VERSION: c.Version,
    GATEWAY_URL: gateway, GATEWAY_KEY: key, SUBMISSION_ENABLED: "true", LOOKUP_ENABLED: "true", LABEL_ENABLED: "true",
    ORIGIN_ENTITY: "BEY", LABEL_REPORT_ID: "9201", SHIPMENT_SETTINGS_JSON: JSON.stringify(testSettings()) };
  for (const [name, value] of Object.entries(vars)) vi.stubEnv(`ARAMEX_UAT_${name}`, value);
}
describe("UAT gateway boundary", () => {
  it.each(["", "http://aramex-gateway.theleeexperience.com", `${gateway}/elsewhere`, `${gateway}?x=1`, "https://evil.test", "https://user:pass@aramex-gateway.theleeexperience.com"])("refuses unapproved gateway %s", url => {
    expect(() => createGatewayFetch({ url, key })).toThrow("GATEWAY_NOT_CONFIGURED");
  });
  it.each(["", "short", "g".repeat(64), "a".repeat(65)])("refuses invalid keys without echoing them", bad => {
    expect(() => createGatewayFetch({ url: gateway, key: bad })).toThrow("GATEWAY_NOT_CONFIGURED");
  });
  it("preserves body/signal, replaces headers and forbids redirects/cache/cookies", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true }));
    const call = createGatewayFetch({ url: `${gateway}/`, key, fetchImpl: send });
    const options = { ...init(), headers: { Authorization: "wrong", Cookie: "private", "X-Customer": "private" }, redirect: "follow" as const };
    await call(upstream, options);
    expect(send).toHaveBeenCalledExactlyOnceWith(`${gateway}/uat/shipments`, {
      method: "POST", body: "{}", signal: options.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      redirect: "error", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer",
    });
  });
  it.each([upstream.replace("ws.uat.", "ws."), "https://evil.test", `${upstream}?url=https://evil.test`, `${upstream}/`, "toString"])("rejects destination %s before sending", async url => {
    const send = vi.fn(); const call = createGatewayFetch({ url: gateway, key, fetchImpl: send });
    await expect(call(url, init())).rejects.toThrow("INVALID_GATEWAY_REQUEST");
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects wrong method, oversized body and missing signal before sending", async () => {
    const send = vi.fn(); const call = createGatewayFetch({ url: gateway, key, fetchImpl: send });
    for (const options of [{ ...init(), method: "GET" }, { ...init(), body: "x".repeat(256 * 1024 + 1) }, { method: "POST", body: "{}" }]) {
      await expect(call(upstream, options)).rejects.toThrow("INVALID_GATEWAY_REQUEST");
    }
    expect(send).not.toHaveBeenCalled();
  });
  it("does not send an already cancelled request", async () => {
    const send = vi.fn(); const call = createGatewayFetch({ url: gateway, key, fetchImpl: send });
    await expect(call(upstream, { ...init(), signal: AbortSignal.abort() })).rejects.toThrow("GATEWAY_UNAVAILABLE");
    expect(send).not.toHaveBeenCalled();
  });
  it("sanitizes transport errors with no retry or direct fallback", async () => {
    const send = vi.fn().mockRejectedValue(Error(`secret ${key}`));
    const call = createGatewayFetch({ url: gateway, key, fetchImpl: send });
    await expect(call(upstream, init())).rejects.toThrow(/^GATEWAY_UNAVAILABLE$/);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("refuses an unexpected redirected response", async () => {
    const response = Response.json({}); Object.defineProperty(response, "redirected", { value: true });
    const send = vi.fn().mockResolvedValue(response);
    await expect(createGatewayFetch({ url: gateway, key, fetchImpl: send })(upstream, init())).rejects.toThrow("GATEWAY_UNAVAILABLE");
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("all configured Aramex operations require the gateway", () => {
  it("routes booking, tracking and label requests through their fixed gateway paths", async () => {
    configure();
    const send = vi.fn<typeof fetch>().mockImplementation(async (url, options) => {
      const body = JSON.parse(String(options!.body));
      expect(options!.headers).toMatchObject({ Authorization: `Bearer ${key}` });
      expect(body.ClientInfo.Password).toBe(testCredentials().Password);
      if (url === `${gateway}/uat/shipments`) return Response.json(testResponse(body.Transaction.Reference1));
      if (url === `${gateway}/uat/tracking`) return Response.json({ HasErrors: false, Transaction: body.Transaction,
        TrackingResults: [{ Key: body.Shipments[0], Value: [] }] });
      if (url === `${gateway}/uat/label`) return Response.json({ HasErrors: false, Transaction: body.Transaction,
        ShipmentNumber: body.ShipmentNumber, ShipmentLabel: { LabelURL: "https://ws.uat.aramex.net/label.pdf" } });
      throw Error("Unexpected destination");
    });
    vi.stubGlobal("fetch", send);
    const signal = new AbortController().signal;
    expect(await configuredSubmissionTransport(testSchedule).createShipment({ submissionKey: "test-key", preparation: testPreparation() }, signal)).toMatchObject({ kind: "created" });
    expect(await configuredTrackingLookup().history("123456789", signal)).toEqual([]);
    expect(await configuredLabelLookup().label("123456789", signal)).toContain("/label.pdf");
    expect(send.mock.calls.map(call => call[0])).toEqual([`${gateway}/uat/shipments`, `${gateway}/uat/tracking`, `${gateway}/uat/label`]);
  });
  it("fails configuration for all three operations if the gateway key is missing", () => {
    configure(); vi.stubEnv("ARAMEX_UAT_GATEWAY_KEY", "");
    const send = vi.fn(); vi.stubGlobal("fetch", send);
    for (const factory of [configuredGatewayFetch, () => configuredSubmissionTransport(testSchedule), configuredTrackingLookup, configuredLabelLookup]) {
      expect(factory).toThrow("GATEWAY_NOT_CONFIGURED");
    }
    expect(send).not.toHaveBeenCalled();
  });
  it.each([401, 429, 502])("keeps booking UNKNOWN on gateway HTTP %s without retry", async status => {
    configure(); const send = vi.fn().mockResolvedValue(new Response("gateway error", { status })); vi.stubGlobal("fetch", send);
    expect(await configuredSubmissionTransport(testSchedule).createShipment({ submissionKey: "test-key", preparation: testPreparation() }, new AbortController().signal)).toEqual({ kind: "unknown" });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("gateway configuration alone cannot enable any operation", () => {
    configure();
    for (const flag of ["SUBMISSION_ENABLED", "LOOKUP_ENABLED", "LABEL_ENABLED"]) vi.stubEnv(`ARAMEX_UAT_${flag}`, "false");
    expect(() => configuredSubmissionTransport(testSchedule)).toThrow("SUBMISSION_DISABLED");
    expect(configuredTrackingLookup).toThrow("LOOKUP_DISABLED");
    expect(configuredLabelLookup).toThrow("LOOKUP_DISABLED");
  });
});
