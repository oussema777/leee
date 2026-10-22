import { afterEach, describe, expect, it, vi } from "vitest";
import { createUatTransport, UAT_CREATE_SHIPMENTS_URL } from "./uat-transport";
import { parseShipmentResponse } from "./shipment-response";
import { testCredentials, testPreparation, testResponse, testSchedule, testSettings } from "./uat-test-fixtures";

const expected = { submissionKey: "attempt-1", orderReference: "LEE-BK-TEST" };
const request = () => ({ submissionKey: expected.submissionKey, preparation: testPreparation() });
const options = () => ({ settings: testSettings(), credentials: testCredentials(), schedule: testSchedule });
afterEach(() => vi.useRealTimers());

describe("Aramex response evidence", () => {
  it("retains a correlated AWB with missing/unsafe labels or top-level errors", () => {
    for (const label of [null, {}, { LabelURL: "http://aramex.net/test" }, { LabelURL: "https://evil.test/file" }]) {
      const response = { ...testResponse(), HasErrors: true, Shipments: [{ ...testResponse().Shipments[0], ShipmentLabel: label }] };
      expect(parseShipmentResponse(response, expected)).toEqual({ kind: "created", trackingNumber: "123456789", labelUrl: null });
    }
  });
  it("accepts an explicit correlated per-shipment rejection without copying its message", () => {
    const response = testResponse(); response.HasErrors = true;
    Object.assign(response.Shipments[0], { ID: "", HasErrors: true, Notifications: [{ Code: "ERR", Message: "private carrier details" }] });
    expect(parseShipmentResponse(response, expected)).toEqual({ kind: "rejected", code: "VALIDATION" });
  });
  it.each([
    null, {}, { HasErrors: true, Shipments: [], Notifications: [{ Code: "ERR", Message: "rejected" }] },
    { ...testResponse(), HasErrors: "false" },
    { ...testResponse(), Transaction: { Reference1: "different-attempt" } },
    { ...testResponse(), Shipments: [testResponse().Shipments[0], testResponse().Shipments[0]] },
    { ...testResponse(), Shipments: [{ ...testResponse().Shipments[0], Reference1: "different-order" }] },
    { ...testResponse(), Shipments: [{ ...testResponse().Shipments[0], Reference2: "different-attempt" }] },
    { ...testResponse(), Shipments: [{ ...testResponse().Shipments[0], ID: "" }] },
    { ...testResponse(), HasErrors: true, Shipments: [{ ...testResponse().Shipments[0], HasErrors: true }] },
  ])("keeps missing, contradictory or unrelated evidence uncertain: %#", response => {
    expect(parseShipmentResponse(response, expected)).toEqual({ kind: "unknown" });
  });
});

describe("one-shot bounded UAT HTTP transport (mocked fetch)", () => {
  it("sends the mapped authenticated JSON only to UAT, forbids redirects and returns safe evidence", async () => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(Response.json(testResponse()));
    const config = options();
    const transport = createUatTransport({ ...config, fetchImpl: send });
    config.credentials.Password = "changed-after-construction";
    const outcome = await transport.createShipment(request(), new AbortController().signal);
    expect(outcome).toMatchObject({ kind: "created", trackingNumber: "123456789" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBe(UAT_CREATE_SHIPMENTS_URL);
    const init = send.mock.calls[0][1]!;
    expect(init).toMatchObject({ method: "POST", redirect: "error", cache: "no-store", credentials: "omit" });
    const body = JSON.parse(init.body as string);
    expect(body.ClientInfo.Password).toBe("fixture-password");
    expect(body.Shipments[0].Shipper.AccountNumber).toBe(body.ClientInfo.AccountNumber);
    expect(body.Shipments[0].Details.CashOnDeliveryAmount.Value).toBe(9);
    expect(JSON.stringify(outcome)).not.toMatch(/fixture-password|fixture-pin|recipient@example/);
  });
  it.each([401, 429, 500, 503, 302])("never retries or declares rejection from HTTP %s", async status => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response("private error", { status }));
    const result = await createUatTransport({ ...options(), fetchImpl: send }).createShipment(request(), new AbortController().signal);
    expect(result).toEqual({ kind: "unknown" }); expect(send).toHaveBeenCalledTimes(1);
  });
  it.each(["not json", "null", "x".repeat(262145)])("bounds and rejects invalid response bodies: %#", async body => {
    const send = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
    expect(await createUatTransport({ ...options(), fetchImpl: send }).createShipment(request(), new AbortController().signal))
      .toEqual({ kind: "unknown" });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("does not expose network exceptions", async () => {
    const send = vi.fn<typeof fetch>().mockRejectedValue(Error("secret password and address"));
    expect(await createUatTransport({ ...options(), fetchImpl: send }).createShipment(request(), new AbortController().signal))
      .toEqual({ kind: "unknown" });
  });
  it.each(["headers", "body"])("times out even if %s never arrive", async stage => {
    vi.useFakeTimers();
    const send = vi.fn<typeof fetch>().mockImplementation(() => stage === "headers" ? new Promise(() => {})
      : Promise.resolve(new Response(new ReadableStream({ start() {} }))));
    const pending = createUatTransport({ ...options(), fetchImpl: send, timeoutMs: 10 }).createShipment(request(), new AbortController().signal);
    await vi.advanceTimersByTimeAsync(11);
    expect(await pending).toEqual({ kind: "unknown" });
    expect(send.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("honors caller cancellation before and during sending", async () => {
    const send = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {}));
    const transport = createUatTransport({ ...options(), fetchImpl: send });
    const cancelled = new AbortController(); cancelled.abort();
    expect(await transport.createShipment(request(), cancelled.signal)).toEqual({ kind: "unknown" });
    expect(send).not.toHaveBeenCalled();
    const caller = new AbortController(); const pending = transport.createShipment(request(), caller.signal); caller.abort();
    expect(await pending).toEqual({ kind: "unknown" }); expect(send).toHaveBeenCalledTimes(1);
  });
  it("validates mapping without sending or leaking credentials", () => {
    const send = vi.fn<typeof fetch>(); const config = options(); config.credentials.Password = "";
    const transport = createUatTransport({ ...config, fetchImpl: send });
    expect(() => transport.validatePreparation!(testPreparation())).toThrow("INVALID_UAT_CREDENTIALS");
    expect(send).not.toHaveBeenCalled();
  });
});
